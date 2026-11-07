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
import { MenuItem, Order, User, Review, Branch, Promo, AppState } from './models.js'
import { clearSession, issueSession, optionalAuth, requireAuth, requireRoles, requireStaff } from './auth.js'

const requiredEnv = ['MONGODB_URI', 'JWT_SECRET']
const missing = requiredEnv.filter(key => !process.env[key])
if (missing.length) { console.error(`Missing required environment variables: ${missing.join(', ')}`); process.exit(1) }
if (process.env.JWT_SECRET.length < 32) { console.error('JWT_SECRET must contain at least 32 characters'); process.exit(1) }

const app = express()
app.disable('x-powered-by')
app.use(helmet())
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(x => x.trim())
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)), credentials: true }))
app.use(express.json({ limit: '32kb' }))
app.use(cookieParser())
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }))
app.use('/api/orders', rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }))

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const publicUser = user => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, branch: user.branch, assignedBranch: user.assignedBranch, active: user.active !== false })
const authBody = z.object({ email: z.string().email().max(254), password: z.string().min(10).max(128) })

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))
app.get('/api/public/config', (_req, res) => res.json({ momoEnabled: [process.env.HUBTEL_API_ID, process.env.HUBTEL_API_KEY, process.env.HUBTEL_COLLECTION_ACCOUNT, process.env.HUBTEL_CALLBACK_URL, process.env.HUBTEL_RETURN_URL, process.env.HUBTEL_CANCEL_URL].every(Boolean) }))

app.post('/api/auth/signup', asyncRoute(async (req, res) => {
  const body = z.object({ name: z.string().trim().min(2).max(100), phone: z.string().regex(/^\+?[0-9 ()-]{9,18}$/), branch: z.enum(['cug', 'sunyani']), email: z.string().email().max(254), password: z.string().min(10).max(128) }).parse(req.body)
  const email = body.email.toLowerCase()
  if (await User.exists({ email })) return res.status(409).json({ error: 'An account with this email already exists' })
  const user = await User.create({ ...body, email, passwordHash: await bcrypt.hash(body.password, 12), role: 'customer' })
  issueSession(res, user)
  res.status(201).json({ user: publicUser(user) })
}))

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = authBody.parse(req.body)
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user || user.active === false || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect' })
  issueSession(res, user)
  res.json({ user: publicUser(user) })
}))

app.post('/api/auth/staff-login', asyncRoute(async (req, res) => {
  const { email, password } = authBody.parse(req.body)
  const user = await User.findOne({ email: email.toLowerCase(), role: { $ne: 'customer' } })
  if (!user || user.active === false || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect' })
  issueSession(res, user)
  res.json({ user: publicUser(user) })
}))

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }))
app.put('/api/auth/profile', requireAuth, asyncRoute(async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Customer profile access required' })
  const body = z.object({ name: z.string().trim().min(2).max(100), phone: z.string().regex(/^\+?[0-9 ()-]{9,18}$/), branch: z.enum(['cug', 'sunyani']) }).parse(req.body)
  const user = await User.findByIdAndUpdate(req.user.id, { $set: body }, { new: true }).select('-passwordHash')
  res.json({ user: publicUser(user) })
}))
app.post('/api/auth/logout', (_req, res) => { clearSession(res); res.status(204).end() })

app.get('/api/public/bootstrap', asyncRoute(async (_req, res) => {
  const [menuState, menuItems, branches, promos, reviews] = await Promise.all([
    AppState.findOne({ key: 'menu' }).lean(), MenuItem.find().sort({ id: 1 }).lean(), Branch.find().lean(), Promo.find({ enabled: true }).lean(), Review.find({ show: true }).sort({ createdAt: -1 }).limit(100).lean()
  ])
  res.json({ menu: menuState?.value || menuItems, branches, promos: promos.map(promo => ({ ...promo, id: String(promo._id) })), reviews: reviews.map(review => ({ ...review, id: String(review._id) })) })
}))

const orderBody = z.object({
  items: z.array(z.object({ id: z.number().int(), qty: z.number().int().min(1).max(50), extras: z.array(z.number().int()).max(10).default([]) })).min(1).max(30),
  branch: z.enum(['cug', 'sunyani']), orderType: z.enum(['delivery', 'pickup']), name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9 ()-]{9,18}$/), address: z.string().trim().max(300).optional(), note: z.string().trim().max(500).optional(),
  promoCode: z.string().trim().max(30).optional(), pay: z.enum(['cash', 'momo'])
})

app.post('/api/orders', optionalAuth, asyncRoute(async (req, res) => {
  const input = orderBody.parse(req.body)
  if (input.pay === 'momo' && ![process.env.HUBTEL_API_ID, process.env.HUBTEL_API_KEY, process.env.HUBTEL_COLLECTION_ACCOUNT, process.env.HUBTEL_CALLBACK_URL, process.env.HUBTEL_RETURN_URL, process.env.HUBTEL_CANCEL_URL].every(Boolean)) return res.status(503).json({ error: 'Mobile Money checkout is not configured. Choose cash or contact the administrator.' })
  const branch = await Branch.findOne({ id: input.branch }).lean()
  if (branch?.open === false) return res.status(409).json({ error: 'This branch is not accepting orders right now' })
  if (input.orderType === 'delivery' && !input.address) return res.status(400).json({ error: 'A delivery address is required' })
  const ids = [...new Set(input.items.flatMap(item => [item.id, ...item.extras]))]
  const menu = await MenuItem.find({ id: { $in: ids } }).lean()
  const byId = new Map(menu.map(item => [item.id, item]))
  const normalizedItems = input.items.map(line => {
    const item = byId.get(line.id)
    if (!item || item.avail?.[input.branch] === false || item.isExtra) throw Object.assign(new Error(`${item?.name || 'An item'} is unavailable at this branch`), { status: 409 })
    const unitPrice = item.prices?.[input.branch] ?? item.price
    const extras = line.extras.map(id => {
      const extra = byId.get(id)
      if (!extra || extra.avail?.[input.branch] === false) throw Object.assign(new Error('An extra is unavailable at this branch'), { status: 409 })
      return { id, name: extra.name, price: extra.prices?.[input.branch] ?? extra.price }
    })
    return { id: item.id, name: item.name, qty: line.qty, unitPrice, extras }
  })
  const subtotal = normalizedItems.reduce((sum, line) => sum + (line.unitPrice + line.extras.reduce((s, x) => s + x.price, 0)) * line.qty, 0)
  const promoCode = input.promoCode?.toUpperCase()
  const promo = promoCode ? await Promo.findOne({ code: promoCode, enabled: true, $and: [{ $or: [{ startsAt: null }, { startsAt: { $lte: new Date() } }] }, { $or: [{ endsAt: null }, { endsAt: { $gte: new Date() } }] }] }).lean() : null
  if (promoCode && !promo) return res.status(400).json({ error: 'This promo code is invalid or expired' })
  const discount = Math.round(subtotal * (promo?.discount || 0) * 100) / 100
  const deliveryFee = input.orderType === 'delivery' && subtotal > 0 && subtotal < 80 ? 5 : 0
  const total = Math.max(0, subtotal - discount + deliveryFee)
  const ref = `L3D-${randomBytes(16).toString('hex').toUpperCase()}`
  const order = await Order.create({ ...input, ref, customerId: req.user?.id, items: normalizedItems, subtotal, discount, deliveryFee, total, paid: false, paymentStatus: input.pay === 'momo' ? 'pending' : 'not_required', paymentReference: input.pay === 'momo' ? ref : undefined, status: 0 })
  if (input.pay === 'momo') {
    try {
      const base = process.env.HUBTEL_SANDBOX === 'true' ? 'https://code.hubtel.com/sandbox/v1/payproxyapi' : 'https://payproxyapi.hubtel.com'
      const response = await fetch(`${base}/items/initiate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Basic ${Buffer.from(`${process.env.HUBTEL_API_ID}:${process.env.HUBTEL_API_KEY}`).toString('base64')}` },
        body: JSON.stringify({ totalAmount: total, description: `Lady 3D order ${ref}`, callbackUrl: process.env.HUBTEL_CALLBACK_URL, returnUrl: process.env.HUBTEL_RETURN_URL, cancellationUrl: process.env.HUBTEL_CANCEL_URL, merchantAccountNumber: process.env.HUBTEL_COLLECTION_ACCOUNT, clientReference: ref })
      })
      const result = await response.json()
      const checkoutUrl = result?.data?.checkoutUrl || result?.Data?.checkoutUrl
      if (!response.ok || !checkoutUrl) throw new Error('Hubtel did not return a checkout URL')
      return res.status(201).json({ order: { ref, total, status: 0, paid: false, paymentStatus: 'pending' }, checkoutUrl })
    } catch (error) {
      console.error('Hubtel checkout initiation failed:', error.message)
      return res.status(202).json({ order: { ref, total, status: 0, paid: false, paymentStatus: 'pending' }, message: `Payment status is being checked for order ${ref}. Please do not retry yet.` })
    }
  }
  res.status(201).json({ order: { ref: order.ref, total: order.total, status: order.status, paid: order.paid, paymentStatus: order.paymentStatus, branch: order.branch, orderType: order.orderType, name: order.name, phone: order.phone, address: order.address, note: order.note, items: order.items, subtotal: order.subtotal, discount: order.discount, deliveryFee: order.deliveryFee, time: order.createdAt.toTimeString().slice(0, 5), pay: order.pay } })
}))

app.get('/api/my/orders', requireAuth, asyncRoute(async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ error: 'Customer account required' })
  const orders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 }).limit(100).lean()
  res.json({ orders: orders.map(order => ({ ...order, mine: true, time: order.createdAt.toTimeString().slice(0, 5) })) })
}))

const verifyHubtelPayment = async ref => {
  const base = process.env.HUBTEL_SANDBOX === 'true' ? 'https://code.hubtel.com/sandbox/v1/api-txnstatus/transactions' : 'https://api-txnstatus.hubtel.com/transactions'
  const url = new URL(`${base}/${process.env.HUBTEL_COLLECTION_ACCOUNT}/status`)
  url.searchParams.set('clientReference', ref)
  const response = await fetch(url, { headers: { Authorization: `Basic ${Buffer.from(`${process.env.HUBTEL_API_ID}:${process.env.HUBTEL_API_KEY}`).toString('base64')}` } })
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
    await Order.updateOne({ _id: order._id, paymentStatus: { $ne: 'paid' } }, { $set: { paid: true, paymentStatus: 'paid', hubtelOrderId: req.body?.Data?.OrderId || req.body?.Data?.TransactionId || req.body?.data?.CheckoutId } })
  } else if (status === 'Failed') {
    await Order.updateOne({ _id: order._id, paymentStatus: { $ne: 'paid' } }, { $set: { paymentStatus: 'failed' } })
  }
  res.status(200).json({ received: true })
}))

let reconciling = false
const reconcileHubtelPayments = async () => {
  if (reconciling || ![process.env.HUBTEL_API_ID, process.env.HUBTEL_API_KEY, process.env.HUBTEL_COLLECTION_ACCOUNT].every(Boolean)) return
  reconciling = true
  try {
    const stale = await Order.find({ pay: 'momo', paymentStatus: 'pending', createdAt: { $lte: new Date(Date.now() - 5 * 60 * 1000) } }).limit(50)
    for (const order of stale) {
      try {
        const result = await verifyHubtelPayment(order.ref)
        const status = result?.data?.status || result?.Data?.Status
        const amount = Number(result?.data?.amount ?? result?.Data?.Amount)
        if (status === 'Paid' && amount === order.total) await Order.updateOne({ _id: order._id, paymentStatus: 'pending' }, { $set: { paid: true, paymentStatus: 'paid' } })
        else if (status === 'Failed') await Order.updateOne({ _id: order._id, paymentStatus: 'pending' }, { $set: { paymentStatus: 'failed' } })
      } catch (error) { console.error(`Hubtel reconciliation failed for ${order.ref}:`, error.message) }
    }
  } finally { reconciling = false }
}

app.get('/api/orders/:ref', asyncRoute(async (req, res) => {
  const order = await Order.findOne({ ref: req.params.ref.toUpperCase() }).select('ref status paid total branch orderType items createdAt').lean()
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json({ order })
}))

app.use('/api/admin', requireAuth, requireStaff)
app.get('/api/admin/orders', asyncRoute(async (req, res) => {
  const filter = req.user.assignedBranch && req.user.assignedBranch !== 'all' ? { branch: req.user.assignedBranch } : {}
  res.json({ orders: await Order.find(filter).sort({ createdAt: -1 }).limit(500).lean() })
}))
app.patch('/api/admin/orders/:ref/status', asyncRoute(async (req, res) => {
  const { status } = z.object({ status: z.number().int().min(0).max(4) }).parse(req.body)
  const filter = { ref: req.params.ref.toUpperCase() }
  if (req.user.assignedBranch && req.user.assignedBranch !== 'all') filter.branch = req.user.assignedBranch
  const current = await Order.findOne(filter)
  if (current && status === 4 && current.pay === 'momo' && !current.paid) return res.status(409).json({ error: 'Cannot complete this order until Mobile Money payment is confirmed' })
  const update = { status }
  if (current && status === 4 && current.pay === 'cash') { update.paid = true; update.paymentStatus = 'paid' }
  const order = await Order.findOneAndUpdate(filter, update, { new: true })
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json({ order })
}))
app.patch('/api/admin/orders/:ref/payment', requireRoles('Owner', 'Manager'), asyncRoute(async (req, res) => {
  const filter = { ref: req.params.ref.toUpperCase() }
  if (req.user.assignedBranch && req.user.assignedBranch !== 'all') filter.branch = req.user.assignedBranch
  const order = await Order.findOneAndUpdate(filter, { paid: true, paymentStatus: 'paid' }, { new: true })
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json({ order })
}))
app.get('/api/admin/users', requireRoles('Owner', 'Manager'), asyncRoute(async (_req, res) => res.json({ users: await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(500).lean() })))
app.get('/api/admin/staff', requireRoles('Owner'), asyncRoute(async (_req, res) => {
  const staff = await User.find({ role: { $ne: 'customer' } }).select('-passwordHash').sort({ createdAt: -1 }).limit(500).lean()
  res.json({ staff: staff.map(user => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, branch: user.assignedBranch, active: user.active !== false })) })
}))
app.post('/api/admin/staff', requireRoles('Owner'), asyncRoute(async (req, res) => {
  const body = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email().max(254), phone: z.string().regex(/^\+?[0-9 ()-]{9,18}$/), role: z.enum(['Manager', 'Cashier']), branch: z.enum(['cug', 'sunyani']), password: z.string().min(10).max(128) }).parse(req.body)
  const email = body.email.toLowerCase()
  const user = await User.create({ name: body.name, email, phone: body.phone, role: body.role, assignedBranch: body.branch, active: true, passwordHash: await bcrypt.hash(body.password, 12) })
  res.status(201).json({ staff: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, branch: user.assignedBranch, active: true } })
}))
app.patch('/api/admin/staff/:id', requireRoles('Owner'), asyncRoute(async (req, res) => {
  const { active } = z.object({ active: z.boolean() }).parse(req.body)
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: { $ne: 'customer' } }, { active }, { new: true }).select('-passwordHash')
  if (!user) return res.status(404).json({ error: 'Staff account not found' })
  res.json({ staff: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, branch: user.assignedBranch, active: user.active !== false } })
}))
app.get('/api/admin/reviews', asyncRoute(async (_req, res) => res.json({ reviews: (await Review.find().sort({ createdAt: -1 }).lean()).map(review => ({ ...review, id: String(review._id) })) })))
const allowedStateKeys = ['menu', 'cats', 'branchStatus', 'promos', 'staff', 'customers', 'loyaltyRules', 'settings', 'votes', 'reviews']
app.get('/api/admin/state', asyncRoute(async (req, res) => {
  const rows = await AppState.find({ key: { $in: allowedStateKeys } }).lean()
  const state = Object.fromEntries(rows.map(row => [row.key, row.value]))
  if (req.user.role === 'Cashier') delete state.staff
  res.json({ state })
}))
app.put('/api/admin/state/:key', requireRoles('Owner', 'Manager'), asyncRoute(async (req, res) => {
  const { key } = req.params
  if (!allowedStateKeys.includes(key)) return res.status(404).json({ error: 'Unknown setting' })
  if (req.user.role === 'Manager' && ['staff', 'customers', 'settings', 'loyaltyRules', 'menu', 'branchStatus', 'reviews'].includes(key)) return res.status(403).json({ error: 'Owner access required' })
  const value = z.unknown().parse(req.body?.value)
  if (key === 'menu') {
    if (req.user.role !== 'Owner') return res.status(403).json({ error: 'Owner access required' })
    if (!Array.isArray(value) || value.length > 500) return res.status(400).json({ error: 'Menu must be a valid item list' })
    const operations = value.map(item => ({ updateOne: { filter: { id: item.id }, update: { $set: item }, upsert: true } }))
    if (operations.length) await MenuItem.bulkWrite(operations)
    await MenuItem.deleteMany({ id: { $nin: value.map(item => item.id) } })
  }
  if (key === 'branchStatus') {
    if (req.user.role !== 'Owner') return res.status(403).json({ error: 'Owner access required' })
    for (const id of ['cug', 'sunyani']) {
      if (!value[id]) continue
      await Branch.updateOne({ id }, { $set: { open: Boolean(value[id].open), notice: String(value[id].notice || '').slice(0, 500), supervisor: String(value[id].supervisor || '').slice(0, 100) } })
    }
  }
  if (key === 'reviews') {
    if (req.user.role !== 'Owner') return res.status(403).json({ error: 'Owner access required' })
    if (!Array.isArray(value) || value.length > 500) return res.status(400).json({ error: 'Review list is invalid' })
    await Review.deleteMany({})
    if (value.length) await Review.insertMany(value.map(({ _id, id, ...review }) => review))
  }
  const row = await AppState.findOneAndUpdate({ key }, { $set: { value } }, { upsert: true, new: true, runValidators: true })
  res.json({ key, value: row.value })
}))
app.post('/api/reviews', asyncRoute(async (req, res) => {
  const data = z.object({ who: z.string().trim().min(2).max(100), stars: z.number().int().min(1).max(5), text: z.string().trim().min(5).max(1000) }).parse(req.body)
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
app.listen(port, () => console.log(`Lady 3D API listening on port ${port}`))
setInterval(reconcileHubtelPayments, 60_000).unref()
