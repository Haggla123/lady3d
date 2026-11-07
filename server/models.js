import mongoose from 'mongoose'

const { Schema, model } = mongoose

// Global Food Catalogue
const MenuItemSchema = new Schema({
  id: { type: Number, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  cat: { type: String, required: true },
  price: { type: Number, min: 0, required: true },
  prices: { cug: Number, sunyani: Number },
  avail: { cug: Boolean, sunyani: Boolean },
  desc: String,
  img: String,
  tag: String,
  rating: Number,
  reviews: Number,
  prepTime: String,
  isExtra: Boolean,
  hue: Number
}, { timestamps: true })

// Daily Availability & Stock Tracking (Separated per branch and date)
const DailyAvailabilitySchema = new Schema({
  branchId: { type: String, enum: ['cug', 'sunyani'], required: true, index: true },
  mealId: { type: Number, required: true, index: true },
  mealName: { type: String, required: true },
  date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
  status: {
    type: String,
    enum: ['available', 'sold_out', 'unavailable_today', 'temporarily_paused'],
    default: 'available'
  },
  quantityPrepared: { type: Number, default: 50, min: 0 },
  quantityReserved: { type: Number, default: 0, min: 0 },
  quantitySold: { type: Number, default: 0, min: 0 }
}, { timestamps: true })

DailyAvailabilitySchema.index({ branchId: 1, mealId: 1, date: 1 }, { unique: true })

// Delivery Zones & Fees Configuration
const DeliveryZoneSchema = new Schema({
  id: { type: String, required: true, unique: true },
  branchId: { type: String, enum: ['cug', 'sunyani'], required: true, index: true },
  name: { type: String, required: true },
  fee: { type: Number, required: true, min: 0 },
  minOrderValue: { type: Number, default: 0, min: 0 },
  estimatedMinutes: { type: String, default: '20-35 mins' },
  active: { type: Boolean, default: true },
  description: String
}, { timestamps: true })

// Main Order Schema with 3 independent state machines: Order, Payment, and Delivery
const OrderSchema = new Schema({
  ref: { type: String, unique: true, required: true, index: true },
  orderNumber: { type: Number },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  isGuest: { type: Boolean, default: false },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true, index: true },
  branch: { type: String, enum: ['cug', 'sunyani'], required: true, index: true },
  orderType: { type: String, enum: ['collection', 'delivery'], required: true },
  
  // Independent State Machine 1: Order Status
  orderStatus: {
    type: String,
    enum: [
      'pending_payment',
      'confirmed',
      'preparing',
      'ready_for_collection',
      'ready_for_dispatch',
      'out_for_delivery',
      'collected',
      'delivered',
      'cancelled',
      'rejected'
    ],
    default: 'confirmed',
    index: true
  },
  
  // Independent State Machine 2: Payment Status
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'unpaid',
    index: true
  },
  
  // Independent State Machine 3: Delivery Status
  deliveryStatus: {
    type: String,
    enum: [
      'not_applicable',
      'awaiting_assignment',
      'assigned',
      'awaiting_pickup',
      'picked_up',
      'in_transit',
      'delivered',
      'failed_delivery',
      'returned'
    ],
    default: 'not_applicable',
    index: true
  },
  
  // Legacy numeric status support for backward compatibility
  status: { type: Number, min: 0, max: 4, default: 0 },
  paid: { type: Boolean, default: false },
  
  // Fulfilment Details
  collectionDetails: {
    collectionTime: { type: String, default: 'ASAP' },
    instructions: String
  },
  deliveryDetails: {
    zoneId: String,
    zoneName: String,
    address: String,
    instructions: String,
    phone: String
  },
  deliveryAssignment: {
    driverId: { type: Schema.Types.ObjectId, ref: 'User' },
    driverName: String,
    driverPhone: String,
    assignedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    failureReason: String
  },
  
  // Items & Pricing Snapshot
  items: [{
    id: { type: Number, required: true },
    name: { type: String, required: true },
    qty: { type: Number, min: 1, required: true },
    unitPrice: { type: Number, required: true },
    extras: [{
      id: Number,
      name: String,
      price: Number
    }]
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  promoCode: String,
  note: String,
  
  // Payment info
  pay: { type: String, enum: ['cash', 'momo'], required: true },
  paymentReference: String,
  hubtelOrderId: String,
  
  // Full Audit & Status Transition History
  statusHistory: [{
    orderStatus: String,
    paymentStatus: String,
    deliveryStatus: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: String
  }]
}, { timestamps: true })

// User & Role Schema
const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, index: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['customer', 'Owner', 'Manager', 'Kitchen', 'Driver', 'Cashier'],
    default: 'customer'
  },
  assignedBranch: { type: String, enum: ['all', 'cug', 'sunyani'] },
  active: { type: Boolean, default: true }
}, { timestamps: true })

// Branch & Service Configuration
const BranchSchema = new Schema({
  id: { type: String, unique: true, enum: ['cug', 'sunyani'], required: true },
  name: { type: String, default: '' },
  open: { type: Boolean, default: true },
  orderPaused: { type: Boolean, default: false },
  pauseReason: String,
  maxActiveOrders: { type: Number, default: 50 },
  currentActiveOrders: { type: Number, default: 0 },
  notice: String,
  supervisor: String,
  serviceSettings: {
    allowCollection: { type: Boolean, default: true },
    allowDelivery: { type: Boolean, default: true },
    estimatedPrepMinutes: { type: Number, default: 15 }
  },
  settings: Schema.Types.Mixed
}, { timestamps: true })

// Reviews & Promos
const ReviewSchema = new Schema({
  who: String,
  stars: { type: Number, min: 1, max: 5 },
  text: String,
  show: { type: Boolean, default: true },
  time: String
}, { timestamps: true })

const PromoSchema = new Schema({
  code: { type: String, unique: true, uppercase: true },
  discount: { type: Number, min: 0, max: 0.8 },
  label: String,
  enabled: { type: Boolean, default: true },
  startsAt: Date,
  endsAt: Date
}, { timestamps: true })

// Audit Logs
const AuditLogSchema = new Schema({
  action: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  userRole: String,
  branchId: String,
  details: Schema.Types.Mixed,
  ip: String
}, { timestamps: true })

const AppStateSchema = new Schema({
  key: { type: String, unique: true },
  value: Schema.Types.Mixed
}, { timestamps: true })

export const MenuItem = mongoose.models.MenuItem || model('MenuItem', MenuItemSchema)
export const DailyAvailability = mongoose.models.DailyAvailability || model('DailyAvailability', DailyAvailabilitySchema)
export const DeliveryZone = mongoose.models.DeliveryZone || model('DeliveryZone', DeliveryZoneSchema)
export const Order = mongoose.models.Order || model('Order', OrderSchema)
export const User = mongoose.models.User || model('User', UserSchema)
export const Review = mongoose.models.Review || model('Review', ReviewSchema)
export const Branch = mongoose.models.Branch || model('Branch', BranchSchema)
export const Promo = mongoose.models.Promo || model('Promo', PromoSchema)
export const AuditLog = mongoose.models.AuditLog || model('AuditLog', AuditLogSchema)
export const AppState = mongoose.models.AppState || model('AppState', AppStateSchema)
