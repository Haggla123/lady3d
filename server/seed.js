import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { MENU, BRANCHES, PROMO_CODES, REVIEWS } from '../src/data.js'
import { AppState, Branch, MenuItem, Promo, Review, User } from './models.js'

if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI before seeding')
await mongoose.connect(process.env.MONGODB_URI)

if (!(await MenuItem.countDocuments())) {
  await MenuItem.insertMany(MENU.map(({ hue, ...item }) => ({ ...item, prices: item.prices || {}, avail: item.avail || { cug: true, sunyani: true } })))
  console.log(`Seeded ${MENU.length} menu items`)
}
for (const branch of BRANCHES) {
  await Branch.updateOne({ id: branch.id }, { $setOnInsert: { id: branch.id, open: true, notice: branch.tagline, supervisor: '' } }, { upsert: true })
}
for (const promo of Object.values(PROMO_CODES)) {
  await Promo.updateOne({ code: promo.code }, { $setOnInsert: { ...promo, enabled: true } }, { upsert: true })
}
if (!(await Review.countDocuments())) await Review.insertMany(REVIEWS.map(({ id, ...review }) => review))
for (const [key, value] of Object.entries({
  cats: ['Rice', 'Waakye', 'Banku & Fufu', 'Ampesi & Stews', 'Drinks & Extras'],
  staff: [], customers: [],
  loyaltyRules: { spendPerPoint: 10, rewardThreshold: 50, promoDiscount: 20 },
  settings: { businessName: "Lady 3D's Catering Services", cugWhatsapp: '053 129 9243', sunyaniWhatsapp: '053 129 9243', cateringPhone: '024 465 0474', generalPhone: '027 691 3089', hours: 'Daily, 7:00 AM – 8:00 PM' },
  votes: { 'Waakye Special': 0, 'Jollof & Chicken': 0, 'Fufu & Light Soup': 0 }
})) await AppState.updateOne({ key }, { $setOnInsert: { key, value } }, { upsert: true })

if (process.env.SEED_OWNER_EMAIL && process.env.SEED_OWNER_PASSWORD) {
  const email = process.env.SEED_OWNER_EMAIL.toLowerCase()
  await User.updateOne({ email }, { $setOnInsert: {
    name: process.env.SEED_OWNER_NAME || 'Business Owner', email, phone: process.env.SEED_OWNER_PHONE || '0000000000',
    passwordHash: await bcrypt.hash(process.env.SEED_OWNER_PASSWORD, 12), role: 'Owner', assignedBranch: 'all'
  } }, { upsert: true })
  console.log(`Ensured owner login for ${email}`)
} else console.log('No staff account seeded. Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD to create the initial Owner login.')

await mongoose.disconnect()
console.log('Database seed complete')
