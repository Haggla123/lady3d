import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { randomBytes } from 'node:crypto'
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
app.use(express.json({ limit: '32kb' }))
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
    momoEnabled: [
      process.env.HUBTEL_API_ID,
      process.env.HUBTEL_API_KEY,
      process.env.HUBTEL_COLLECTION_ACCOUNT,
      process.env.HUBTEL_CALLBACK_URL,
      process.env.HUBTEL_RETURN_URL,
      process.env.HUBTEL_CANCEL_URL
    ].every(Boolean)
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

  // Check 1: Hubtel prerequisite if MoMo selected
  if (input.pay === 'momo' && ![
    process.env.HUBTEL_API_ID,
    process.env.HUBTEL_API_KEY,
    process.env.HUBTEL_COLLECTION_ACCOUNT,
    process.env.HUBTEL_CALLBACK_URL,
    process.env.HUBTEL_RETURN_URL,
    process.env.HUBTEL_CANCEL_URL
  ].every(Boolean)) {
    return res.status(503).json({ error: 'Mobile Money checkout is not configured. Choose cash or contact administrator.' })
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

  const order = await Order.create({
    ref,
    customerId: req.user?.id,
    isGuest: !req.user,
    name: input.name,
    phone: input.phone,
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
    statusHistory: [{
      orderStatus: initialOrderStatus,
      paymentStatus: initialPaymentStatus,
      deliveryStatus: initialDeliveryStatus,
      timestamp: new Date(),
      note: input.pay === 'momo' ? 'Order initiated, awaiting MoMo authorization' : 'Order automatically validated and confirmed. Sent to kitchen queue.',
      updatedBy: req.user?.name || 'Customer'
    }]
  })

  // MoMo Payment initiation
  if (input.pay === 'momo') {
    try {
      const base = process.env.HUBTEL_SANDBOX === 'true'
        ? 'https://code.hubtel.com/sandbox/v1/payproxyapi'
        : 'https://payproxyapi.hubtel.com'
      const response = await fetch(`${base}/items/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${process.env.HUBTEL_API_ID}:${process.env.HUBTEL_API_KEY}`).toString('base64')}`
        },
        body: JSON.stringify({
          totalAmount: total,
          description: `Lady 3D order ${ref}`,
          callbackUrl: process.env.HUBTEL_CALLBACK_URL,
          returnUrl: process.env.HUBTEL_RETURN_URL,
          cancellationUrl: process.env.HUBTEL_CANCEL_URL,
          merchantAccountNumber: process.env.HUBTEL_COLLECTION_ACCOUNT,
          clientReference: ref
        })
      })
      const result = await response.json()
      const checkoutUrl = result?.data?.checkoutUrl || result?.Data?.checkoutUrl
      if (!response.ok || !checkoutUrl) throw new Error('Hubtel did not return a checkout URL')
      return res.status(201).json({
        order: { ref, total, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus, deliveryStatus: order.deliveryStatus },
        checkoutUrl
      })
    } catch (error) {
      console.error('Hubtel checkout initiation failed:', error.message)
      return res.status(202).json({
        order: { ref, total, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus, deliveryStatus: order.deliveryStatus },
        message: `Payment initiated for order ${ref}. Complete on prompt or check status.`
      })
    }
  }

  // Cash / Pay on collection: Order is automatically confirmed and sent to kitchen queue!
  res.status(201).json({ order })
}))

// Hubtel Payment verification & callbacks
const verifyHubtelPayment = async ref => {
  const base = process.env.HUBTEL_SANDBOX === 'true'
    ? 'https://code.hubtel.com/sandbox/v1/api-txnstatus/transactions'
    : 'https://api-txnstatus.hubtel.com/transactions'
  const url = new URL(`${base}/${process.env.HUBTEL_COLLECTION_ACCOUNT}/status`)
  url.searchParams.set('clientReference', ref)
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${Buffer.from(`${process.env.HUBTEL_API_ID}:${process.env.HUBTEL_API_KEY}`).toString('base64')}` }
  })
  if (!response.ok) throw new Error(`Hubtel status check returned ${response.status}`)
  return response.json()
}

app.post('/api/payments/hubtel/callback', asyncRoute(async (req, res) => {
  const callbackIps = (process.env.HUBTEL_CALLBACK_IPS || '18.202.122.131,108.129.40.25').split(',').map(x => x.trim())
  if (!callbackIps.includes(req.ip)) return res.status(403).json({ error: 'Callback source is not allowed' })
  const ref = req.body?.Data?.ClientReference || req.body?.data?.ClientReference || req.body?.data?.clientReference
  if (!ref) return res.status(400).json({ error: 'Missing payment reference' })
  const order = await Order.findOne({ ref, pay: 'momo' })
  if (!order) return res.status(404).json({ error: 'Unknown payment reference' })

  const verification = await verifyHubtelPayment(ref)
  const status = verification?.data?.status || verification?.Data?.Status
  const paidAmount = Number(verification?.data?.amount ?? verification?.Data?.Amount)

  if (status === 'Paid' && paidAmount === order.total) {
    if (order.paymentStatus !== 'paid') {
      order.paid = true
      order.paymentStatus = 'paid'
      order.orderStatus = 'confirmed' // Automatically confirmed upon payment!
      order.status = 1
      order.hubtelOrderId = req.body?.Data?.OrderId || req.body?.Data?.TransactionId || req.body?.data?.CheckoutId
      order.statusHistory.push({
        orderStatus: 'confirmed',
        paymentStatus: 'paid',
        deliveryStatus: order.deliveryStatus,
        timestamp: new Date(),
        note: 'Payment verified via Hubtel callback. Order confirmed for kitchen preparation.',
        updatedBy: 'Hubtel Gateway'
      })
      await order.save()
      // Commit reserved stock to sold
      await commitOrderStock(order.branch, order.items)
    }
  } else if (status === 'Failed') {
    if (order.paymentStatus !== 'failed') {
      order.paymentStatus = 'failed'
      order.orderStatus = 'cancelled'
      order.statusHistory.push({
        orderStatus: 'cancelled',
        paymentStatus: 'failed',
        deliveryStatus: order.deliveryStatus,
        timestamp: new Date(),
        note: 'Mobile Money payment failed. Reserved stock released.',
        updatedBy: 'Hubtel Gateway'
      })
      await order.save()
      // Release reserved stock
      await releaseOrderStock(order.branch, order.items)
    }
  }
  res.status(200).json({ received: true })
}))

// Tracking endpoint for customer (accessible by ref without login)
app.get('/api/orders/:ref', asyncRoute(async (req, res) => {
  const order = await Order.findOne({ ref: req.params.ref.toUpperCase() }).lean()
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json({ order })
}))

// ==========================================
// KITCHEN OPERATIONS API
// ==========================================
app.get('/api/kitchen/orders', requireAuth, requireStaff, asyncRoute(async (req, res) => {
  const filter = {
    orderStatus: { $in: ['confirmed', 'preparing', 'ready_for_collection', 'ready_for_dispatch'] }
  }
  if (req.user.assignedBranch && req.user.assignedBranch !== 'all') {
    filter.branch = req.user.assignedBranch
  }
  const orders = await Order.find(filter).sort({ createdAt: 1 }).limit(100).lean()
  res.json({ orders })
}))

app.patch('/api/kitchen/orders/:ref/status', requireAuth, requireStaff, asyncRoute(async (req, res) => {
  const { action } = z.object({
    action: z.enum(['start_cooking', 'mark_ready', 'complete_pickup'])
  }).parse(req.body)

  const filter = { ref: req.params.ref.toUpperCase() }
  if (req.user.assignedBranch && req.user.assignedBranch !== 'all') {
    filter.branch = req.user.assignedBranch
  }
  const order = await Order.findOne(filter)
  if (!order) return res.status(404).json({ error: 'Order not found' })

  if (action === 'start_cooking') {
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
  }

  await order.save()
  res.json({ order })
}))

app.get('/api/kitchen/availability', requireAuth, requireStaff, asyncRoute(async (req, res) => {
  const branchId = req.query.branch || req.user.assignedBranch || 'cug'
  const date = getTodayString()
  const records = await DailyAvailability.find({ branchId, date }).lean()
  res.json({ records })
}))

app.patch('/api/kitchen/availability/:mealId', requireAuth, requireStaff, asyncRoute(async (req, res) => {
  const { mealId } = req.params
  const branchId = req.query.branch || req.user.assignedBranch || 'cug'
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
app.get('/api/delivery/orders', requireAuth, requireStaff, asyncRoute(async (req, res) => {
  const filter = {
    orderType: 'delivery',
    orderStatus: { $nin: ['cancelled', 'rejected'] }
  }
  if (req.user.assignedBranch && req.user.assignedBranch !== 'all') {
    filter.branch = req.user.assignedBranch
  }
  // If rider role, can filter to self-assigned or pending
  if (req.user.role === 'Driver') {
    filter.$or = [
      { 'deliveryAssignment.driverId': req.user._id },
      { deliveryStatus: 'awaiting_assignment' }
    ]
  }
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(100).lean()
  res.json({ orders })
}))

app.patch('/api/delivery/orders/:ref/assign', requireAuth, requireStaff, asyncRoute(async (req, res) => {
  const body = z.object({
    driverId: z.string().optional(),
    driverName: z.string().optional(),
    driverPhone: z.string().optional()
  }).parse(req.body)

  const order = await Order.findOne({ ref: req.params.ref.toUpperCase(), orderType: 'delivery' })
  if (!order) return res.status(404).json({ error: 'Delivery order not found' })

  const driver = body.driverId ? await User.findById(body.driverId) : req.user
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

app.patch('/api/delivery/orders/:ref/pickup', requireAuth, requireStaff, asyncRoute(async (req, res) => {
  const order = await Order.findOne({ ref: req.params.ref.toUpperCase(), orderType: 'delivery' })
  if (!order) return res.status(404).json({ error: 'Delivery order not found' })

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

app.patch('/api/delivery/orders/:ref/deliver', requireAuth, requireStaff, asyncRoute(async (req, res) => {
  const order = await Order.findOne({ ref: req.params.ref.toUpperCase(), orderType: 'delivery' })
  if (!order) return res.status(404).json({ error: 'Delivery order not found' })

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
  await order.save()
  res.json({ order })
}))

app.patch('/api/delivery/orders/:ref/fail', requireAuth, requireStaff, asyncRoute(async (req, res) => {
  const { reason } = z.object({ reason: z.string().min(3).max(300) }).parse(req.body)
  const order = await Order.findOne({ ref: req.params.ref.toUpperCase(), orderType: 'delivery' })
  if (!order) return res.status(404).json({ error: 'Delivery order not found' })

  order.deliveryStatus = 'failed_delivery'
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
  const filter = req.user.assignedBranch && req.user.assignedBranch !== 'all' ? { branch: req.user.assignedBranch } : {}
  res.json({ orders: await Order.find(filter).sort({ createdAt: -1 }).limit(500).lean() })
}))

app.patch('/api/admin/orders/:ref/status', asyncRoute(async (req, res) => {
  const { orderStatus, paymentStatus, deliveryStatus } = z.object({
    orderStatus: z.string().optional(),
    paymentStatus: z.string().optional(),
    deliveryStatus: z.string().optional()
  }).parse(req.body)

  const filter = { ref: req.params.ref.toUpperCase() }
  if (req.user.assignedBranch && req.user.assignedBranch !== 'all') filter.branch = req.user.assignedBranch
  const order = await Order.findOne(filter)
  if (!order) return res.status(404).json({ error: 'Order not found' })

  if (orderStatus) order.orderStatus = orderStatus
  if (paymentStatus) {
    order.paymentStatus = paymentStatus
    order.paid = paymentStatus === 'paid'
  }
  if (deliveryStatus) order.deliveryStatus = deliveryStatus

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

app.get('/api/admin/staff', requireRoles('Owner', 'Manager'), asyncRoute(async (_req, res) => {
  const staff = await User.find({ role: { $ne: 'customer' } }).select('-passwordHash').sort({ createdAt: -1 }).limit(500).lean()
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
app.listen(port, () => console.log(`Lady 3D Enterprise API listening on port ${port}`))
