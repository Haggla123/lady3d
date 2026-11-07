import mongoose from 'mongoose'

const { Schema, model } = mongoose

const MenuItemSchema = new Schema({
  id: { type: Number, unique: true, required: true }, name: { type: String, required: true, trim: true },
  cat: { type: String, required: true }, price: { type: Number, min: 0, required: true },
  prices: { cug: Number, sunyani: Number }, avail: { cug: Boolean, sunyani: Boolean },
  desc: String, img: String, tag: String, rating: Number, reviews: Number, prepTime: String, isExtra: Boolean, hue: Number
}, { timestamps: true })

const OrderSchema = new Schema({
  ref: { type: String, unique: true, required: true, index: true }, customerId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true }, phone: { type: String, required: true }, branch: { type: String, enum: ['cug', 'sunyani'], required: true },
  orderType: { type: String, enum: ['delivery', 'pickup'], required: true }, address: String, note: String,
  items: [{ id: Number, name: String, qty: { type: Number, min: 1, required: true }, unitPrice: Number, extras: [{ id: Number, name: String, price: Number }] }],
  subtotal: { type: Number, required: true }, discount: { type: Number, default: 0 }, deliveryFee: { type: Number, default: 0 },
  total: { type: Number, required: true }, promoCode: String, pay: { type: String, enum: ['cash', 'momo'], required: true },
  paid: { type: Boolean, default: false }, paymentStatus: { type: String, enum: ['not_required', 'pending', 'paid', 'failed'], default: 'not_required' },
  paymentReference: String, hubtelOrderId: String, status: { type: Number, min: 0, max: 4, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true }, passwordHash: { type: String, required: true }, branch: String,
  role: { type: String, enum: ['customer', 'Owner', 'Manager', 'Cashier'], default: 'customer' },
  assignedBranch: { type: String, enum: ['all', 'cug', 'sunyani'] }, active: { type: Boolean, default: true }
}, { timestamps: true })

const ReviewSchema = new Schema({ who: String, stars: { type: Number, min: 1, max: 5 }, text: String, show: { type: Boolean, default: true }, time: String }, { timestamps: true })
const BranchSchema = new Schema({ id: { type: String, unique: true, enum: ['cug', 'sunyani'] }, open: { type: Boolean, default: true }, notice: String, supervisor: String, settings: Schema.Types.Mixed }, { timestamps: true })
const PromoSchema = new Schema({ code: { type: String, unique: true, uppercase: true }, discount: { type: Number, min: 0, max: 0.8 }, label: String, enabled: { type: Boolean, default: true }, startsAt: Date, endsAt: Date }, { timestamps: true })
const AppStateSchema = new Schema({ key: { type: String, unique: true }, value: Schema.Types.Mixed }, { timestamps: true })

export const MenuItem = mongoose.models.MenuItem || model('MenuItem', MenuItemSchema)
export const Order = mongoose.models.Order || model('Order', OrderSchema)
export const User = mongoose.models.User || model('User', UserSchema)
export const Review = mongoose.models.Review || model('Review', ReviewSchema)
export const Branch = mongoose.models.Branch || model('Branch', BranchSchema)
export const Promo = mongoose.models.Promo || model('Promo', PromoSchema)
export const AppState = mongoose.models.AppState || model('AppState', AppStateSchema)
