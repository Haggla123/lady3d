import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import {
  MenuItem,
  DailyAvailability,
  DeliveryZone,
  Order,
  User,
  Review,
  Branch,
  Promo,
  AuditLog,
  AppState
} from './models.js'
import { clearSession, issueSession, optionalAuth, requireAuth, requireRoles, requireStaff } from './auth.js'

const requiredEnv = ['MONGODB_URI', 'JWT_SECRET']
const missing = requiredEnv.filter(key => !process.env[key])
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`)
  process.exit(1)
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must contain at least 32 characters')
  process.exit(1)
}

const app = express()
app.disable('x-powered-by')
app.use(helmet())
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(x => x.trim())
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)), credentials: true }))
app.use(express.json({
  limit: '32kb',
  verify(req, _res, buffer) {
    if (req.originalUrl.startsWith('/api/payments/paystack/webhook')) req.rawBody = Buffer.from(buffer)
  }
}))
app.use(cookieParser())
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }))
app.use('/api/orders', rateLimit({ windowMs: 60 * 1000, limit: 40, standardHeaders: 'draft-8', legacyHeaders: false }))

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const publicUser = user => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  branch: user.assignedBranch,
  assignedBranch: user.assignedBranch,
  active: user.active !== false
})
const authBody = z.object({ email: z.string().email().max(254), password: z.string().min(8).max(128) })

const getTodayString = () => new Date().toISOString().slice(0, 10)
const capacityOrderStatuses = ['pending_payment', 'confirmed', 'preparing', 'ready_for_collection', 'ready_for_dispatch', 'out_for_delivery']

async function reserveBranchSlot(branchId) {
  const branch = await Branch.findOneAndUpdate(
    { id: branchId, open: { $ne: false }, orderPaused: { $ne: true }, $expr: { $lt: ['$currentActiveOrders', '$maxActiveOrders'] } },
    { $inc: { currentActiveOrders: 1 } },
    { new: true }
  )
  return Boolean(branch)
}

async function releaseBranchSlot(branchId) {
  await Branch.updateOne({ id: branchId, currentActiveOrders: { $gt: 0 } }, { $inc: { currentActiveOrders: -1 } })
}

// Helper: Ensure and fetch DailyAvailability record
async function getOrCreateDailyStock(branchId, mealId, mealName) {
  const date = getTodayString()
  let stock = await DailyAvailability.findOne({ branchId, mealId, date })
  if (!stock) {
    stock = await DailyAvailability.create({
      branchId,
      mealId,
      mealName,
      date,
      status: 'available',
      quantityPrepared: branchId === 'cug' ? 45 : 60,
      quantityReserved: 0,
      quantitySold: 0
    })
  }
  return stock
}

// Atomic stock reservation logic
async function reserveOrderStock(branchId, items) {
  const date = getTodayString()
  const reservedBatch = []

  try {
    for (const line of items) {
      if (line.isExtra) continue

      // Ensure record exists
      await getOrCreateDailyStock(branchId, line.id, line.name)

      // Atomically check availability and reserve quantity
      const updated = await DailyAvailability.findOneAndUpdate(
        {
          branchId,
          mealId: line.id,
          date,
          status: 'available',
          $expr: {
            $gte: [
              { $subtract: [{ $subtract: ['$quantityPrepared', '$quantityReserved'] }, '$quantitySold'] },
              line.qty
            ]
          }
        },
        { $inc: { quantityReserved: line.qty } },
        { new: true }
      )

      if (!updated) {
        // Fetch current to provide clear explanation
        const curr = await DailyAvailability.findOne({ branchId, mealId: line.id, date })
        const remaining = curr ? Math.max(0, curr.quantityPrepared - curr.quantityReserved - curr.quantitySold) : 0
        const reason = curr?.status !== 'available'
          ? `${line.name} is currently marked ${curr?.status || 'unavailable'} at this branch.`
          : `Only ${remaining} portion(s) of ${line.name} remaining today. Requested: ${line.qty}.`
        const err = new Error(reason)
        err.status = 409
        throw err
      }

      reservedBatch.push({ mealId: line.id, qty: line.qty })
    }
  } catch (error) {
    // Rollback any items reserved before failure
    for (const rollback of reservedBatch) {
      await DailyAvailability.updateOne(
        { branchId, mealId: rollback.mealId, date },
        { $inc: { quantityReserved: -rollback.qty } }
      )
    }
    throw error
  }
}

// Commit reserved stock to sold
async function commitOrderStock(branchId, items) {
  const date = getTodayString()
  for (const line of items) {
    if (line.isExtra) continue
    await DailyAvailability.updateOne(
      { branchId, mealId: line.id, date },
      { $inc: { quantityReserved: -line.qty, quantitySold: line.qty } }
    )
  }
}

// Release reserved stock back to available pool
async function releaseOrderStock(branchId, items) {
  const date = getTodayString()
  for (const line of items) {
    if (line.isExtra) continue
    await DailyAvailability.updateOne(
      { branchId, mealId: line.id, date },
      { $inc: { quantityReserved: -line.qty } }
    )
  }
}

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
)

app.get('/api/public/config', (_req, res) =>
  res.json({
    paystackEnabled: [process.env.PAYSTACK_SECRET_KEY, process.env.API_PUBLIC_URL, process.env.FRONTEND_PUBLIC_URL].every(Boolean)
  })
)

// Public bootstrap
app.get('/api/public/bootstrap', asyncRoute(async (_req, res) => {
  const date = getTodayString()
  const [menuState, menuItems, branches, deliveryZones, dailyStock, promos, reviews] = await Promise.all([
    AppState.findOne({ key: 'menu' }).lean(),
    MenuItem.find().sort({ id: 1 }).lean(),
    Branch.find().lean(),
    DeliveryZone.find({ active: true }).lean(),
    DailyAvailability.find({ date }).lean(),
    Promo.find({ enabled: true }).lean(),
    Review.find({ show: true }).sort({ createdAt: -1 }).limit(100).lean()
  ])
  res.json({
    menu: menuState?.value || menuItems,
    branches,
    deliveryZones,
    dailyStock,
    promos: promos.map(promo => ({ ...promo, id: String(promo._id) })),
    reviews: reviews.map(review => ({ ...review, id: String(review._id) }))
  })
}))

// Auth Routes
app.post('/api/auth/signup', asyncRoute(async (req, res) => {
  const body = z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().regex(/^\+?[0-9 ()-]{9,18}$/),
    branch: z.enum(['cug', 'sunyani']).optional(),
    email: z.string().email().max(254),
    password: z.string().min(8).max(128)
  }).parse(req.body)

  const email = body.email.toLowerCase()
  if (await User.exists({ email })) return res.status(409).json({ error: 'An account with this email already exists' })

  const user = await User.create({
    ...body,
    email,
    passwordHash: await bcrypt.hash(body.password, 12),
    role: 'customer'
  })

  // Auto-claim any previous guest orders for this phone number
  await Order.updateMany(
    { phone: body.phone, customerId: { $exists: false } },
    { $set: { customerId: user._id, isGuest: false } }
  )

  issueSession(res, user)
  res.status(201).json({ user: publicUser(user) })
}))

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = authBody.parse(req.body)
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user || user.active === false || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Email or password is incorrect' })
  }
  issueSession(res, user)
  res.json({ user: publicUser(user) })
}))

app.post('/api/auth/staff-login', asyncRoute(async (req, res) => {
  const { email, password } = authBody.parse(req.body)
  const user = await User.findOne({ email: email.toLowerCase(), role: { $ne: 'customer' } })
  if (!user || user.active === false || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Email or password is incorrect' })
  }
  issueSession(res, user)
  res.json({ user: publicUser(user) })
}))

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }))

app.put('/api/auth/profile', requireAuth, asyncRoute(async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Customer profile access required' })
  const body = z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().regex(/^\+?[0-9 ()-]{9,18}$/),
    branch: z.enum(['cug', 'sunyani']).optional()
  }).parse(req.body)
  const user = await User.findByIdAndUpdate(req.user.id, { $set: body }, { new: true }).select('-passwordHash')
  res.json({ user: publicUser(user) })
}))

app.post('/api/auth/logout', (_req, res) => {
  clearSession(res)
  res.status(204).end()
})

// Claim guest orders by phone
app.post('/api/my/claim-guest-orders', requireAuth, asyncRoute(async (req, res) => {
  const result = await Order.updateMany(
    { phone: req.user.phone, customerId: { $ne: req.user.id } },
    { $set: { customerId: req.user.id, isGuest: false } }
  )
  res.json({ claimedCount: result.modifiedCount })
}))

app.get('/api/my/orders', requireAuth, asyncRoute(async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Customer account required' })
  const orders = await Order.find({
    $or: [{ customerId: req.user.id }, { phone: req.user.phone }]
  }).sort({ createdAt: -1 }).limit(100).lean()
  res.json({
    orders: orders.map(order => ({
      ...order,
      mine: true,
      time: order.createdAt.toTimeString().slice(0, 5)
    }))
  })
}))

// Delivery Zones
app.get('/api/delivery/zones', asyncRoute(async (req, res) => {
  const filter = req.query.branch ? { branchId: req.query.branch, active: true } : { active: true }
  const zones = await DeliveryZone.find(filter).lean()
  res.json({ zones })
}))

// Place Order Schema with fulfillment separation & zone validation
const orderBody = z.object({
  items: z.array(z.object({
    id: z.number().int(),
    qty: z.number().int().min(1).max(50),
    extras: z.array(z.number().int()).max(10).default([])
  })).min(1).max(30),
  branch: z.enum(['cug', 'sunyani']),
  orderType: z.enum(['collection', 'delivery']),
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9 ()-]{9,18}$/),
  email: z.string().email().max(254).optional(),
  
  // Fulfilment specifics
  deliveryZoneId: z.string().optional(),
  address: z.string().trim().max(300).optional(),
  collectionTime: z.string().max(50).optional(),
  instructions: z.string().trim().max(500).optional(),
  note: z.string().trim().max(500).optional(),
  promoCode: z.string().trim().max(30).optional(),
  pay: z.enum(['cash', 'momo'])
})

// Core Order Creation & Automatic Confirmation Check
app.post('/api/orders', optionalAuth, asyncRoute(async (req, res) => {
  const input = orderBody.parse(req.body)
  const idempotencyKey = req.get('Idempotency-Key')
  if (idempotencyKey && !/^[A-Za-z0-9-]{8,128}$/.test(idempotencyKey)) return res.status(400).json({ error: 'Invalid idempotency key' })
  if (idempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey }).lean()
    if (existing) return res.status(200).json({ order: existing, checkoutUrl: existing.checkoutUrl })
  }

  const paymentEmail = input.email || req.user?.email
  if (input.pay === 'momo' && !/^\S+@\S+\.\S+$/.test(paymentEmail || '')) {
    return res.status(400).json({ error: 'A valid email address is required for Paystack checkout.' })
  }

  // Paystack must be fully configured before an online payment order is accepted.
  if (input.pay === 'momo' && ![
    process.env.PAYSTACK_SECRET_KEY,
    process.env.API_PUBLIC_URL,
    process.env.FRONTEND_PUBLIC_URL
  ].every(Boolean)) {
    return res.status(503).json({ error: 'Paystack checkout is not configured. Choose cash or contact the administrator.' })
  }

  // Check 2: Branch status & capacity check
  const branch = await Branch.findOne({ id: input.branch }).lean()
  if (branch?.open === false) {
    return res.status(409).json({ error: 'This branch is currently closed and not accepting orders.' })
  }
  if (branch?.orderPaused === true) {
    return res.status(409).json({ error: `Orders at ${branch.name || input.branch.toUpperCase()} are temporarily paused: ${branch.pauseReason || 'Kitchen is at peak capacity.'}` })
  }

  // Check 3: Fulfilment method supported
  if (input.orderType === 'delivery' && branch?.serviceSettings?.allowDelivery === false) {
    return res.status(400).json({ error: 'Delivery is temporarily suspended at this branch. Please choose Collection.' })
  }
  if (input.orderType === 'collection' && branch?.serviceSettings?.allowCollection === false) {
    return res.status(400).json({ error: 'Collection is temporarily suspended at this branch.' })
  }

  // Check 4: Delivery zone & minimum order value
  let deliveryFee = 0
  let zoneRecord = null
  if (input.orderType === 'delivery') {
    if (!input.address) return res.status(400).json({ error: 'A specific delivery address or hostel name is required.' })
    if (input.deliveryZoneId) {
      zoneRecord = await DeliveryZone.findOne({ id: input.deliveryZoneId, branchId: input.branch, active: true }).lean()
      if (!zoneRecord) {
        return res.status(400).json({ error: 'Selected delivery zone is invalid or inactive for this branch.' })
      }
      deliveryFee = zoneRecord.fee
    } else {
      deliveryFee = 5 // standard default
    }
  }

  // Check 5: Resolve menu items and calculate pricing
  const ids = [...new Set(input.items.flatMap(item => [item.id, ...item.extras]))]
  const menu = await MenuItem.find({ id: { $in: ids } }).lean()
  const byId = new Map(menu.map(item => [item.id, item]))

  const normalizedItems = input.items.map(line => {
    const item = byId.get(line.id)
    if (!item || item.avail?.[input.branch] === false || item.isExtra) {
      throw Object.assign(new Error(`${item?.name || 'An item'} is currently unavailable at this branch`), { status: 409 })
    }
    const unitPrice = item.prices?.[input.branch] ?? item.price
    const extras = line.extras.map(id => {
      const extra = byId.get(id)
      if (!extra || extra.avail?.[input.branch] === false) {
        throw Object.assign(new Error('An extra is unavailable at this branch'), { status: 409 })
      }
      return { id, name: extra.name, price: extra.prices?.[input.branch] ?? extra.price }
    })
    return { id: item.id, name: item.name, qty: line.qty, unitPrice, extras, isExtra: false }
  })

  const subtotal = normalizedItems.reduce(
    (sum, line) => sum + (line.unitPrice + line.extras.reduce((s, x) => s + x.price, 0)) * line.qty,
    0
  )

  // Verify Zone minimum order value if applicable
  if (zoneRecord?.minOrderValue && subtotal < zoneRecord.minOrderValue) {
    return res.status(400).json({
      error: `Minimum order value for ${zoneRecord.name} is GH₵${zoneRecord.minOrderValue.toFixed(2)}. Current subtotal: GH₵${subtotal.toFixed(2)}.`
    })
  }

  // Promo code
  const promoCode = input.promoCode?.toUpperCase()
  const promo = promoCode
    ? await Promo.findOne({
        code: promoCode,
        enabled: true,
        $and: [
          { $or: [{ startsAt: null }, { startsAt: { $lte: new Date() } }] },
          { $or: [{ endsAt: null }, { endsAt: { $gte: new Date() } }] }
        ]
      }).lean()
    : null
  if (promoCode && !promo) return res.status(400).json({ error: 'This promo code is invalid or expired' })
  const discount = Math.round(subtotal * (promo?.discount || 0) * 100) / 100
  const total = Math.max(0, subtotal - discount + deliveryFee)

  // Check 6: ATOMIC STOCK RESERVATION
  // Validates available quantity and reserves portions atomically
  await reserveOrderStock(input.branch, normalizedItems)
  if (!await reserveBranchSlot(input.branch)) {
    await releaseOrderStock(input.branch, normalizedItems)
    return res.status(409).json({ error: 'This branch is at order capacity or has paused new orders. Please try again shortly.' })
  }

  // If passed, create order with distinct status fields
  const ref = `L3D-${randomBytes(8).toString('hex').toUpperCase()}`
  
  // Independent state machines initial state:
  let initialOrderStatus = 'confirmed'
  let initialPaymentStatus = 'unpaid'
  let initialDeliveryStatus = input.orderType === 'delivery' ? 'awaiting_assignment' : 'not_applicable'

  if (input.pay === 'momo') {
    initialOrderStatus = 'pending_payment'
    initialPaymentStatus = 'pending'
  }

  let order
  try { order = await Order.create({
    ref,
    customerId: req.user?.id,
    isGuest: !req.user,
    name: input.name,
    phone: input.phone,
    customerEmail: paymentEmail,
    branch: input.branch,
    orderType: input.orderType,
    orderStatus: initialOrderStatus,
    paymentStatus: initialPaymentStatus,
    deliveryStatus: initialDeliveryStatus,
    status: initialOrderStatus === 'confirmed' ? 1 : 0, // legacy
    paid: false,
    collectionDetails: {
      collectionTime: input.collectionTime || 'ASAP',
      instructions: input.instructions || ''
    },
    deliveryDetails: {
      zoneId: zoneRecord?.id,
      zoneName: zoneRecord?.name || 'Local Delivery',
      address: input.address || '',
      instructions: input.instructions || '',
      phone: input.phone
    },
    items: normalizedItems,
    subtotal,
    discount,
    deliveryFee,
    total,
    promoCode,
    note: input.note,
    pay: input.pay,
    paymentReference: input.pay === 'momo' ? ref : undefined,
    paymentProvider: input.pay === 'momo' ? 'paystack' : undefined,
    idempotencyKey,
    statusHistory: [{
      orderStatus: initialOrderStatus,
      paymentStatus: initialPaymentStatus,
      deliveryStatus: initialDeliveryStatus,
      timestamp: new Date(),
      note: input.pay === 'momo' ? 'Order initiated, awaiting Paystack payment authorization' : 'Order automatically validated and confirmed. Sent to kitchen queue.',
      updatedBy: req.user?.name || 'Customer'
    }]
  }) } catch (error) {
    await releaseOrderStock(input.branch, normalizedItems)
    await releaseBranchSlot(input.branch)
    throw error
  }

  // Paystack checkout initialization is server-to-server. The client receives only the hosted checkout URL.
  if (input.pay === 'momo') {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        },
        body: JSON.stringify({
          email: paymentEmail,
          amount: String(Math.round(total * 100)),
          currency: 'GHS',
          reference: ref,
          callback_url: `${process.env.API_PUBLIC_URL.replace(/\/$/, '')}/api/payments/paystack/return`,
          metadata: { order_ref: ref, branch: input.branch, fulfilment: input.orderType }
        })
      })
      const result = await response.json()
      const checkoutUrl = result?.data?.authorization_url
      if (!response.ok || result?.status !== true || !checkoutUrl) throw new Error(result?.message || 'Paystack did not return a checkout URL')
      await Order.updateOne({ _id: order._id }, { $set: { checkoutUrl } })
      return res.status(201).json({
        order: { ref, total, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus, deliveryStatus: order.deliveryStatus },
        checkoutUrl
      })
    } catch (error) {
      console.error('Paystack checkout initialization failed:', error.message)
      await Order.updateOne({ _id: order._id, paymentStatus: 'pending' }, {
        $set: { paymentStatus: 'failed', orderStatus: 'cancelled', status: 0 },
        $unset: { idempotencyKey: 1 },
        $push: { statusHistory: { orderStatus: 'cancelled', paymentStatus: 'failed', deliveryStatus: order.deliveryStatus, timestamp: new Date(), note: 'Paystack checkout could not be initialized.', updatedBy: 'System' } }
      })
      await releaseOrderStock(order.branch, order.items)
      await releaseBranchSlot(order.branch)
      return res.status(502).json({ error: 'Paystack could not start checkout. Please try again.' })
    }
  }

  // Cash / Pay on collection: Order is automatically confirmed and sent to kitchen queue!
  res.status(201).json({ order })
}))

// Paystack verification is authoritative; browser redirects and webhook payloads alone never mark an order paid.
const verifyPaystackReference = async reference => {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
  })
  const result = await response.json()
  if (!response.ok || result?.status !== true || !result?.data) throw new Error(result?.message || 'Paystack verification failed')
  return result.data
}

async function applyPaystackResult(reference) {
  const order = await Order.findOne({ ref: reference, paymentProvider: 'paystack', paymentStatus: 'pending' })
  if (!order) return { order: await Order.findOne({ ref: reference }).lean(), changed: false }

  const payment = await verifyPaystackReference(reference)
  if (payment.reference !== order.paymentReference || payment.currency !== 'GHS' || Number(payment.amount) !== Math.round(order.total * 100)) {
    throw Object.assign(new Error('Payment amount, currency, or reference does not match the order'), { status: 400 })
  }

  if (payment.status === 'success') {
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: 'pending', orderStatus: 'pending_payment' },
      {
        $set: {
          paid: true,
          paymentStatus: 'paid',
          orderStatus: 'confirmed',
          status: 1,
          providerTransactionId: String(payment.id),
          paymentVerifiedAt: new Date()
        },
        $push: { statusHistory: {
          orderStatus: 'confirmed', paymentStatus: 'paid', deliveryStatus: order.deliveryStatus,
          timestamp: new Date(), note: 'Payment verified with Paystack. Order confirmed for kitchen preparation.', updatedBy: 'Paystack'
        } }
      },
      { new: true }
    )
    if (updated) await commitOrderStock(updated.branch, updated.items)
    return { order: updated || await Order.findById(order._id).lean(), changed: Boolean(updated) }
  }

  if (['failed', 'abandoned'].includes(payment.status)) {
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: 'pending', orderStatus: 'pending_payment' },
      {
        $set: { paymentStatus: 'failed', orderStatus: 'cancelled', status: 0 },
        $unset: { idempotencyKey: 1 },
        $push: { statusHistory: {
          orderStatus: 'cancelled', paymentStatus: 'failed', deliveryStatus: order.deliveryStatus,
          timestamp: new Date(), note: 'Paystack payment failed or was abandoned. Reserved stock released.', updatedBy: 'Paystack'
        } }
      },
      { new: true }
    )
    if (updated) {
      await releaseOrderStock(updated.branch, updated.items)
      await releaseBranchSlot(updated.branch)
    }
    return { order: updated || await Order.findById(order._id).lean(), changed: Boolean(updated) }
  }
  return { order, changed: false }
}

app.get('/api/payments/paystack/return', asyncRoute(async (req, res) => {
  const reference = String(req.query.reference || '')
  if (reference) {
    try { await applyPaystackResult(reference) }
    catch (error) { console.error('Paystack return verification failed:', error.message) }
  }
  const target = new URL(process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173')
  target.hash = reference ? `/track/${encodeURIComponent(reference)}` : '/cart'
  res.redirect(303, target.toString())
}))

app.post('/api/payments/paystack/webhook', asyncRoute(async (req, res) => {
  const signature = req.get('Paystack-Signature') || ''
  const expected = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '').update(req.rawBody || Buffer.alloc(0)).digest('hex')
  const signatureBuffer = Buffer.from(signature, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  if (!signature || signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return res.status(401).json({ error: 'Invalid Paystack signature' })
  }
  if (req.body?.event === 'charge.success' && req.body?.data?.reference) {
    await applyPaystackResult(String(req.body.data.reference))
  }
  res.status(200).json({ received: true })
}))

// Tracking endpoint for customer (accessible by ref without login)
app.get('/api/orders/:ref', asyncRoute(async (req, res) => {
  const order = await Order.findOne({ ref: req.params.ref.toUpperCase() })
    .select('ref orderStatus paymentStatus deliveryStatus total branch orderType items createdAt pay status deliveryAssignment.driverName deliveryAssignment.driverPhone')
    .lean()
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json({ order })
}))

// ==========================================
// KITCHEN OPERATIONS API
// ==========================================
app.get('/api/kitchen/orders', requireAuth, requireRoles('Owner', 'Manager', 'Kitchen'), asyncRoute(async (req, res) => {
  const filter = {
    orderStatus: { $in: ['confirmed', 'preparing', 'ready_for_collection', 'ready_for_dispatch'] }
  }
  if (req.user.role !== 'Owner' && req.user.assignedBranch && req.user.assignedBranch !== 'all') {
    filter.branch = req.user.assignedBranch
  }
  const orders = await Order.find(filter).sort({ createdAt: 1 }).limit(100).lean()
  res.json({ orders })
}))

app.patch('/api/kitchen/orders/:ref/status', requireAuth, requireRoles('Owner', 'Manager', 'Kitchen'), asyncRoute(async (req, res) => {
  const { action } = z.object({
    action: z.enum(['start_cooking', 'mark_ready', 'complete_pickup'])
  }).parse(req.body)

  const filter = { ref: req.params.ref.toUpperCase() }
  if (req.user.role !== 'Owner' && req.user.assignedBranch && req.user.assignedBranch !== 'all') {
    filter.branch = req.user.assignedBranch
  }
  const order = await Order.findOne(filter)
  if (!order) return res.status(404).json({ error: 'Order not found' })

  if (action === 'start_cooking') {
    if (!['confirmed', 'preparing'].includes(order.orderStatus) || order.paymentStatus === 'pending' || order.paymentStatus === 'failed') return res.status(409).json({ error: 'Order must be confirmed and paid or cash-on-delivery before cooking.' })
    order.orderStatus = 'preparing'
    order.status = 2
    order.statusHistory.push({
      orderStatus: 'preparing',
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
      timestamp: new Date(),
      note: 'Kitchen started food preparation',
      updatedBy: req.user.name
    })
  } else if (action === 'mark_ready') {
    if (!['preparing', 'ready_for_collection', 'ready_for_dispatch'].includes(order.orderStatus)) return res.status(409).json({ error: 'Start cooking before marking this order ready.' })
    if (order.orderType === 'collection') {
      order.orderStatus = 'ready_for_collection'
      order.status = 3
    } else {
      order.orderStatus = 'ready_for_dispatch'
      order.deliveryStatus = 'awaiting_pickup'
      order.status = 3
    }
    order.statusHistory.push({
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
      timestamp: new Date(),
      note: order.orderType === 'collection' ? 'Food packed and ready for customer pickup' : 'Food packed and ready for rider dispatch',
      updatedBy: req.user.name
    })
  } else if (action === 'complete_pickup') {
    if (order.orderType !== 'collection') return res.status(400).json({ error: 'Only collection orders can be marked collected at the kitchen counter' })
    if (order.orderStatus !== 'ready_for_collection') return res.status(409).json({ error: 'Only ready collection orders can be completed.' })
    order.orderStatus = 'collected'
    order.status = 4
    if (order.pay === 'cash') {
      order.paid = true
      order.paymentStatus = 'paid'
    }
    order.statusHistory.push({
      orderStatus: 'collected',
      paymentStatus: order.paymentStatus,
      deliveryStatus: 'not_applicable',
      timestamp: new Date(),
      note: 'Handed over to customer at branch counter',
      updatedBy: req.user.name
    })
    await commitOrderStock(order.branch, order.items)
    await releaseBranchSlot(order.branch)
  }

  await order.save()
  res.json({ order })
}))

app.get('/api/kitchen/availability', requireAuth, requireRoles('Owner', 'Manager', 'Kitchen'), asyncRoute(async (req, res) => {
  const branchId = req.query.branch || req.user.assignedBranch || 'cug'
  if (req.user.role !== 'Owner' && req.user.assignedBranch !== 'all' && branchId !== req.user.assignedBranch) return res.status(403).json({ error: 'You can only view stock for your assigned branch.' })
  const date = getTodayString()
  const records = await DailyAvailability.find({ branchId, date }).lean()
  res.json({ records })
}))

app.patch('/api/kitchen/availability/:mealId', requireAuth, requireRoles('Owner', 'Manager', 'Kitchen'), asyncRoute(async (req, res) => {
  const { mealId } = req.params
  const branchId = req.query.branch || req.user.assignedBranch || 'cug'
  if (req.user.role !== 'Owner' && req.user.assignedBranch !== 'all' && branchId !== req.user.assignedBranch) return res.status(403).json({ error: 'You can only manage stock for your assigned branch.' })
  const body = z.object({
    status: z.enum(['available', 'sold_out', 'unavailable_today', 'temporarily_paused']).optional(),
    addPrepared: z.number().int().min(-100).max(500).optional(),
    setPrepared: z.number().int().min(0).max(1000).optional()
  }).parse(req.body)

  const date = getTodayString()
  const item = await MenuItem.findOne({ id: Number(mealId) }).lean()
  if (!item) return res.status(404).json({ error: 'Menu item not found' })

  let stock = await getOrCreateDailyStock(branchId, Number(mealId), item.name)
  if (body.status) stock.status = body.status
  if (typeof body.setPrepared === 'number') stock.quantityPrepared = body.setPrepared
  if (typeof body.addPrepared === 'number') stock.quantityPrepared = Math.max(0, stock.quantityPrepared + body.addPrepared)

  await stock.save()
  res.json({ stock })
}))

// ==========================================
// DELIVERY OPERATIONS API
// ==========================================
app.get('/api/delivery/orders', requireAuth, requireRoles('Owner', 'Manager', 'Driver'), asyncRoute(async (req, res) => {
  const filter = {
    orderType: 'delivery',
    orderStatus: { $nin: ['cancelled', 'rejected'] }
  }
  if (req.user.role !== 'Owner' && req.user.assignedBranch && req.user.assignedBranch !== 'all') {
    filter.branch = req.user.assignedBranch
  }
  // If rider role, can filter to self-assigned or pending
  if (req.user.role === 'Driver') {
    filter['deliveryAssignment.driverId'] = req.user._id
  }
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(100).lean()
  res.json({ orders })
}))

app.patch('/api/delivery/orders/:ref/assign', requireAuth, requireRoles('Owner', 'Manager'), asyncRoute(async (req, res) => {
  const body = z.object({
    driverId: z.string().optional(),
    driverName: z.string().optional(),
    driverPhone: z.string().optional()
  }).parse(req.body)

  const order = await Order.findOne({ ref: req.params.ref.toUpperCase(), orderType: 'delivery' })
  if (!order) return res.status(404).json({ error: 'Delivery order not found' })
  if (req.user.role !== 'Owner' && req.user.assignedBranch !== 'all' && req.user.assignedBranch !== order.branch) return res.status(403).json({ error: 'This order belongs to another branch.' })
  if (!['awaiting_assignment', 'failed_delivery'].includes(order.deliveryStatus)) return res.status(409).json({ error: 'This delivery is already assigned or complete.' })

  const driver = body.driverId ? await User.findById(body.driverId) : req.user
  if (!driver || driver.role !== 'Driver' || driver.active === false || (driver.assignedBranch !== 'all' && driver.assignedBranch !== order.branch)) return res.status(400).json({ error: 'Choose an active driver assigned to this branch.' })
  order.deliveryStatus = 'assigned'
  order.deliveryAssignment = {
    driverId: driver._id,
    driverName: body.driverName || driver.name,
    driverPhone: body.driverPhone || driver.phone,
    assignedAt: new Date()
  }
  order.statusHistory.push({
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    deliveryStatus: 'assigned',
    timestamp: new Date(),
    note: `Assigned to delivery driver ${order.deliveryAssignment.driverName}`,
    updatedBy: req.user.name
  })
  await order.save()
  res.json({ order })
}))

app.patch('/api/delivery/orders/:ref/pickup', requireAuth, requireRoles('Owner', 'Manager', 'Driver'), asyncRoute(async (req, res) => {
  const order = await Order.findOne({ ref: req.params.ref.toUpperCase(), orderType: 'delivery' })
  if (!order) return res.status(404).json({ error: 'Delivery order not found' })
  if (req.user.role !== 'Owner' && req.user.assignedBranch !== 'all' && req.user.assignedBranch !== order.branch) return res.status(403).json({ error: 'This order belongs to another branch.' })
  if (req.user.role === 'Driver' && String(order.deliveryAssignment?.driverId || '') !== String(req.user._id)) return res.status(403).json({ error: 'This delivery is not assigned to you.' })
  if (!['assigned', 'awaiting_pickup'].includes(order.deliveryStatus) || order.orderStatus !== 'ready_for_dispatch') return res.status(409).json({ error: 'This order is not ready for driver pickup.' })

  order.deliveryStatus = 'picked_up'
  order.orderStatus = 'out_for_delivery'
  order.status = 3
  if (order.deliveryAssignment) {
    order.deliveryAssignment.pickedUpAt = new Date()
  }
  order.statusHistory.push({
    orderStatus: 'out_for_delivery',
    paymentStatus: order.paymentStatus,
    deliveryStatus: 'picked_up',
    timestamp: new Date(),
    note: 'Order collected by delivery personnel; out for delivery',
    updatedBy: req.user.name
  })
  await order.save()
  res.json({ order })
}))

app.patch('/api/delivery/orders/:ref/deliver', requireAuth, requireRoles('Owner', 'Manager', 'Driver'), asyncRoute(async (req, res) => {
  const order = await Order.findOne({ ref: req.params.ref.toUpperCase(), orderType: 'delivery' })
  if (!order) return res.status(404).json({ error: 'Delivery order not found' })
  if (req.user.role !== 'Owner' && req.user.assignedBranch !== 'all' && req.user.assignedBranch !== order.branch) return res.status(403).json({ error: 'This order belongs to another branch.' })
  if (req.user.role === 'Driver' && String(order.deliveryAssignment?.driverId || '') !== String(req.user._id)) return res.status(403).json({ error: 'This delivery is not assigned to you.' })
  if (order.deliveryStatus !== 'picked_up') return res.status(409).json({ error: 'Record pickup before completing delivery.' })

  order.deliveryStatus = 'delivered'
  order.orderStatus = 'delivered'
  order.status = 4
  if (order.pay === 'cash') {
    order.paid = true
    order.paymentStatus = 'paid'
  }
  if (order.deliveryAssignment) {
    order.deliveryAssignment.deliveredAt = new Date()
  }
  order.statusHistory.push({
    orderStatus: 'delivered',
    paymentStatus: order.paymentStatus,
    deliveryStatus: 'delivered',
    timestamp: new Date(),
    note: 'Delivered successfully to customer address',
    updatedBy: req.user.name
  })
  await commitOrderStock(order.branch, order.items)
  await releaseBranchSlot(order.branch)
  await order.save()
  res.json({ order })
}))

app.patch('/api/delivery/orders/:ref/fail', requireAuth, requireRoles('Owner', 'Manager', 'Driver'), asyncRoute(async (req, res) => {
  const { reason } = z.object({ reason: z.string().min(3).max(300) }).parse(req.body)
  const order = await Order.findOne({ ref: req.params.ref.toUpperCase(), orderType: 'delivery' })
  if (!order) return res.status(404).json({ error: 'Delivery order not found' })
  if (req.user.role !== 'Owner' && req.user.assignedBranch !== 'all' && req.user.assignedBranch !== order.branch) return res.status(403).json({ error: 'This order belongs to another branch.' })
  if (req.user.role === 'Driver' && String(order.deliveryAssignment?.driverId || '') !== String(req.user._id)) return res.status(403).json({ error: 'This delivery is not assigned to you.' })
  if (!['assigned', 'awaiting_pickup', 'picked_up', 'in_transit'].includes(order.deliveryStatus)) return res.status(409).json({ error: 'Only an active assigned delivery can be marked failed.' })

  order.deliveryStatus = 'failed_delivery'
  order.orderStatus = 'ready_for_dispatch'
  order.status = 3
  if (order.deliveryAssignment) {
    order.deliveryAssignment.failureReason = reason
  }
  order.statusHistory.push({
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    deliveryStatus: 'failed_delivery',
    timestamp: new Date(),
    note: `Delivery failed: ${reason}`,
    updatedBy: req.user.name
  })
  await order.save()
  res.json({ order })
}))

// ==========================================
// ADMIN & MANAGER GENERAL CONTROLS
// ==========================================
app.use('/api/admin', requireAuth, requireStaff)

app.get('/api/admin/orders', asyncRoute(async (req, res) => {
  const filter = req.user.role !== 'Owner' && req.user.assignedBranch && req.user.assignedBranch !== 'all' ? { branch: req.user.assignedBranch } : {}
  res.json({ orders: await Order.find(filter).sort({ createdAt: -1 }).limit(500).lean() })
}))

app.patch('/api/admin/orders/:ref/status', requireRoles('Owner', 'Manager', 'Cashier'), asyncRoute(async (req, res) => {
  const { orderStatus, paymentStatus } = z.object({
    orderStatus: z.enum(['confirmed', 'preparing', 'ready_for_collection', 'ready_for_dispatch', 'out_for_delivery', 'collected', 'delivered', 'cancelled', 'rejected']).optional(),
    paymentStatus: z.enum(['paid', 'unpaid', 'refunded', 'partially_refunded']).optional()
  }).parse(req.body)

  const filter = { ref: req.params.ref.toUpperCase() }
  if (req.user.role !== 'Owner' && req.user.assignedBranch && req.user.assignedBranch !== 'all') filter.branch = req.user.assignedBranch
  const order = await Order.findOne(filter)
  if (!order) return res.status(404).json({ error: 'Order not found' })

  if (orderStatus) return res.status(400).json({ error: 'Use the kitchen or delivery dashboard to update order progress.' })
  if (paymentStatus && ['refunded', 'partially_refunded'].includes(paymentStatus) && req.user.role !== 'Owner') return res.status(403).json({ error: 'Only owners can record refunds.' })
  if (paymentStatus === 'paid' && order.pay !== 'cash') return res.status(409).json({ error: 'Paystack payments can only be confirmed by Paystack verification.' })
  if (paymentStatus && req.user.role === 'Manager' && order.branch !== req.user.assignedBranch && req.user.assignedBranch !== 'all') return res.status(403).json({ error: 'This order belongs to another branch.' })

  if (orderStatus) order.orderStatus = orderStatus
  if (paymentStatus) {
    order.paymentStatus = paymentStatus
    order.paid = paymentStatus === 'paid'
  }

  order.statusHistory.push({
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    timestamp: new Date(),
    note: `Updated by manager/admin (${req.user.name})`,
    updatedBy: req.user.name
  })

  await order.save()
  res.json({ order })
}))

// Delivery zones CRUD
app.post('/api/admin/delivery/zones', requireRoles('Owner', 'Manager'), asyncRoute(async (req, res) => {
  const body = z.object({
    id: z.string().min(2),
    branchId: z.enum(['cug', 'sunyani']),
    name: z.string().min(2),
    fee: z.number().min(0),
    minOrderValue: z.number().min(0).default(0),
    estimatedMinutes: z.string().default('20-30 mins'),
    active: z.boolean().default(true),
    description: z.string().optional()
  }).parse(req.body)

  if (req.user.role === 'Manager' && req.user.assignedBranch !== 'all' && body.branchId !== req.user.assignedBranch) return res.status(403).json({ error: 'You can only manage delivery zones for your assigned branch.' })

  const zone = await DeliveryZone.findOneAndUpdate({ id: body.id }, { $set: body }, { upsert: true, new: true })
  res.json({ zone })
}))

// Branch Capacity & Pause controls
app.patch('/api/admin/branches/:id/controls', requireRoles('Owner', 'Manager'), asyncRoute(async (req, res) => {
  const body = z.object({
    open: z.boolean().optional(),
    orderPaused: z.boolean().optional(),
    pauseReason: z.string().max(200).optional(),
    maxActiveOrders: z.number().int().min(5).max(300).optional(),
    notice: z.string().max(300).optional(),
    allowCollection: z.boolean().optional(),
    allowDelivery: z.boolean().optional()
  }).parse(req.body)

  const branch = await Branch.findOne({ id: req.params.id })
  if (!branch) return res.status(404).json({ error: 'Branch not found' })
  if (req.user.role === 'Manager' && req.user.assignedBranch !== 'all' && req.user.assignedBranch !== branch.id) return res.status(403).json({ error: 'You can only manage your assigned branch.' })

  if (typeof body.open === 'boolean') branch.open = body.open
  if (typeof body.orderPaused === 'boolean') branch.orderPaused = body.orderPaused
  if (body.pauseReason !== undefined) branch.pauseReason = body.pauseReason
  if (typeof body.maxActiveOrders === 'number') branch.maxActiveOrders = body.maxActiveOrders
  if (body.notice !== undefined) branch.notice = body.notice
  if (typeof body.allowCollection === 'boolean') branch.serviceSettings.allowCollection = body.allowCollection
  if (typeof body.allowDelivery === 'boolean') branch.serviceSettings.allowDelivery = body.allowDelivery

  await branch.save()
  res.json({ branch })
}))

app.get('/api/admin/staff', requireRoles('Owner', 'Manager'), asyncRoute(async (req, res) => {
  const filter = { role: { $ne: 'customer' } }
  if (req.user.role === 'Manager' && req.user.assignedBranch !== 'all') filter.assignedBranch = { $in: [req.user.assignedBranch, 'all'] }
  const staff = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).limit(500).lean()
  res.json({ staff: staff.map(publicUser) })
}))

app.post('/api/admin/staff', requireRoles('Owner'), asyncRoute(async (req, res) => {
  const body = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email().max(254),
    phone: z.string().regex(/^\+?[0-9 ()-]{9,18}$/),
    role: z.enum(['Manager', 'Kitchen', 'Driver', 'Cashier']),
    branch: z.enum(['cug', 'sunyani', 'all']),
    password: z.string().min(8).max(128)
  }).parse(req.body)

  const email = body.email.toLowerCase()
  const user = await User.create({
    name: body.name,
    email,
    phone: body.phone,
    role: body.role,
    assignedBranch: body.branch,
    active: true,
    passwordHash: await bcrypt.hash(body.password, 12)
  })
  res.status(201).json({ staff: publicUser(user) })
}))

app.patch('/api/admin/staff/:id', requireRoles('Owner'), asyncRoute(async (req, res) => {
  const { active, role, branch } = z.object({
    active: z.boolean().optional(),
    role: z.enum(['Manager', 'Kitchen', 'Driver', 'Cashier']).optional(),
    branch: z.enum(['cug', 'sunyani', 'all']).optional()
  }).parse(req.body)

  const update = {}
  if (typeof active === 'boolean') update.active = active
  if (role) update.role = role
  if (branch) update.assignedBranch = branch

  const user = await User.findOneAndUpdate({ _id: req.params.id, role: { $ne: 'customer' } }, update, { new: true }).select('-passwordHash')
  if (!user) return res.status(404).json({ error: 'Staff account not found' })
  res.json({ staff: publicUser(user) })
}))

app.get('/api/admin/reviews', asyncRoute(async (_req, res) => {
  res.json({ reviews: (await Review.find().sort({ createdAt: -1 }).lean()).map(review => ({ ...review, id: String(review._id) })) })
}))

// ==========================================
// MENU MANAGEMENT API (Admins & Managers)
// ==========================================
app.post('/api/admin/menu', requireRoles('Owner'), asyncRoute(async (req, res) => {
  const body = z.object({
    name: z.string().trim().min(2).max(120),
    cat: z.string().trim().min(2),
    price: z.number().min(0),
    prices: z.object({ cug: z.number().optional(), sunyani: z.number().optional() }).optional(),
    avail: z.object({ cug: z.boolean().optional(), sunyani: z.boolean().optional() }).optional(),
    desc: z.string().max(500).optional(),
    img: z.string().optional(),
    tag: z.string().optional()
  }).parse(req.body)

  const maxItem = await MenuItem.findOne().sort({ id: -1 }).select('id').lean()
  const nextId = (maxItem?.id || 100) + 1

  const item = await MenuItem.create({
    id: nextId,
    name: body.name,
    cat: body.cat,
    price: body.price,
    prices: body.prices || { cug: body.price, sunyani: body.price },
    avail: body.avail || { cug: true, sunyani: true },
    desc: body.desc || '',
    img: body.img || '',
    tag: body.tag || 'Popular'
  })

  // Seed initial daily availability
  const date = getTodayString()
  for (const branch of ['cug', 'sunyani']) {
    await DailyAvailability.create({
      branchId: branch,
      mealId: item.id,
      mealName: item.name,
      date,
      status: 'available',
      quantityPrepared: branch === 'cug' ? 45 : 60,
      quantityReserved: 0,
      quantitySold: 0
    }).catch(() => {})
  }

  const allMenu = await MenuItem.find().sort({ id: 1 }).lean()
  await AppState.findOneAndUpdate({ key: 'menu' }, { $set: { value: allMenu } }, { upsert: true })

  res.status(201).json({ item })
}))

app.put('/api/admin/menu/:id', requireRoles('Owner', 'Manager'), asyncRoute(async (req, res) => {
  const id = Number(req.params.id)
  const body = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    cat: z.string().trim().min(2).optional(),
    price: z.number().min(0).optional(),
    prices: z.object({ cug: z.number().optional(), sunyani: z.number().optional() }).optional(),
    avail: z.object({ cug: z.boolean().optional(), sunyani: z.boolean().optional() }).optional(),
    desc: z.string().max(500).optional(),
    img: z.string().optional(),
    tag: z.string().optional()
  }).parse(req.body)

  if (req.user.role === 'Manager') {
    const branchKey = req.user.assignedBranch
    if (Object.keys(body).some(key => !['prices', 'avail'].includes(key))) return res.status(403).json({ error: 'Only owners can change the shared menu catalogue.' })
    if (branchKey !== 'all' && body.prices && Object.keys(body.prices).some(key => key !== branchKey)) return res.status(403).json({ error: 'You can only change prices for your assigned branch.' })
    if (branchKey !== 'all' && body.avail && Object.keys(body.avail).some(key => key !== branchKey)) return res.status(403).json({ error: 'You can only change availability for your assigned branch.' })
    const current = await MenuItem.findOne({ id }).lean()
    if (!current) return res.status(404).json({ error: 'Menu item not found' })
    if (body.prices) body.prices = { ...current.prices, ...body.prices }
    if (body.avail) body.avail = { ...current.avail, ...body.avail }
  }

  const item = await MenuItem.findOneAndUpdate({ id }, { $set: body }, { new: true })
  if (!item) return res.status(404).json({ error: 'Menu item not found' })

  if (body.name) {
    await DailyAvailability.updateMany({ mealId: id }, { $set: { mealName: body.name } })
  }

  const allMenu = await MenuItem.find().sort({ id: 1 }).lean()
  await AppState.findOneAndUpdate({ key: 'menu' }, { $set: { value: allMenu } }, { upsert: true })

  res.json({ item })
}))

app.delete('/api/admin/menu/:id', requireRoles('Owner'), asyncRoute(async (req, res) => {
  const id = Number(req.params.id)
  await MenuItem.deleteOne({ id })
  await DailyAvailability.deleteMany({ mealId: id })

  const allMenu = await MenuItem.find().sort({ id: 1 }).lean()
  await AppState.findOneAndUpdate({ key: 'menu' }, { $set: { value: allMenu } }, { upsert: true })

  res.json({ success: true, id })
}))

const allowedStateKeys = ['menu', 'cats', 'branchStatus', 'promos', 'staff', 'customers', 'loyaltyRules', 'settings', 'votes', 'reviews']
app.get('/api/admin/state', asyncRoute(async (req, res) => {
  const rows = await AppState.find({ key: { $in: allowedStateKeys } }).lean()
  const state = Object.fromEntries(rows.map(row => [row.key, row.value]))
  if (req.user.role === 'Cashier' || req.user.role === 'Driver') delete state.staff
  res.json({ state })
}))

app.put('/api/admin/state/:key', requireRoles('Owner', 'Manager'), asyncRoute(async (req, res) => {
  const { key } = req.params
  if (!allowedStateKeys.includes(key)) return res.status(404).json({ error: 'Unknown setting' })
  const value = z.unknown().parse(req.body?.value)

  if (key === 'menu' && Array.isArray(value)) {
    const operations = value.map(item => ({
      updateOne: { filter: { id: item.id }, update: { $set: item }, upsert: true }
    }))
    if (operations.length) await MenuItem.bulkWrite(operations)
    await MenuItem.deleteMany({ id: { $nin: value.map(item => item.id) } })
  }

  const row = await AppState.findOneAndUpdate({ key }, { $set: { value } }, { upsert: true, new: true, runValidators: true })
  res.json({ key, value: row.value })
}))

app.post('/api/reviews', asyncRoute(async (req, res) => {
  const data = z.object({
    who: z.string().trim().min(2).max(100),
    stars: z.number().int().min(1).max(5),
    text: z.string().trim().min(5).max(1000)
  }).parse(req.body)
  const review = await Review.create({ ...data, show: false, time: 'Pending moderation' })
  res.status(201).json({ review: { id: review.id, show: review.show } })
}))

app.use((err, _req, res, _next) => {
  if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues.map(issue => issue.message).join('. ') })
  if (err.code === 11000) return res.status(409).json({ error: 'A record with that value already exists' })
  const status = err.status || 500
  if (status >= 500) console.error(err)
  res.status(status).json({ error: status >= 500 ? 'An unexpected server error occurred' : err.message })
})

const port = Number(process.env.PORT || 4000)
await mongoose.connect(process.env.MONGODB_URI)
for (const branchId of ['cug', 'sunyani']) {
  const currentActiveOrders = await Order.countDocuments({ branch: branchId, orderStatus: { $in: capacityOrderStatuses } })
  await Branch.updateOne({ id: branchId }, { $set: { currentActiveOrders } })
}
app.listen(port, () => console.log(`Lady 3D Enterprise API listening on port ${port}`))
