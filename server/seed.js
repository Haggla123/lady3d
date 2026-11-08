import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { MENU, BRANCHES, PROMO_CODES, REVIEWS } from '../src/data.js'
import { AppState, Branch, MenuItem, Promo, Review, User, DeliveryZone, DailyAvailability } from './models.js'

if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI before seeding')
await mongoose.connect(process.env.MONGODB_URI)

// 1. Seed Global Menu Items
if (!(await MenuItem.countDocuments())) {
  await MenuItem.insertMany(MENU.map(({ hue, ...item }) => ({
    ...item,
    prices: item.prices || { cug: item.price, sunyani: item.price },
    avail: item.avail || { cug: true, sunyani: true }
  })))
  console.log(`Seeded ${MENU.length} menu items`)
}

// 2. Seed Branches with capacity and service settings
for (const branch of BRANCHES) {
  await Branch.updateOne(
    { id: branch.id },
    {
      $set: {
        name: branch.name,
        open: true,
        orderPaused: false,
        maxActiveOrders: branch.id === 'cug' ? 60 : 80,
        notice: branch.tagline,
        serviceSettings: {
          allowCollection: true,
          allowDelivery: true,
          estimatedPrepMinutes: 15
        }
      }
    },
    { upsert: true }
  )
}
console.log('Seeded branch configurations')

// 3. Seed Delivery Zones (Target requirement: delivery zones & fees separated)
const defaultZones = [
  // Catholic University Zones
  { id: 'cug-halls', branchId: 'cug', name: 'Catholic University Hostels & Campus Halls', fee: 5, minOrderValue: 20, estimatedMinutes: '15-25 mins', active: true, description: 'Direct delivery to any hall of residence or administration block.' },
  { id: 'cug-fiapre', branchId: 'cug', name: 'Fiapre Town & Surrounding Hostels', fee: 8, minOrderValue: 25, estimatedMinutes: '20-35 mins', active: true, description: 'Private hostels and residential areas within Fiapre.' },
  { id: 'cug-berlin', branchId: 'cug', name: 'Berlin-Top / Fiapre Barrier Area', fee: 10, minOrderValue: 35, estimatedMinutes: '25-40 mins', active: true, description: 'Fiapre outskirts and boundary zones.' },

  // Sunyani Main Branch Zones
  { id: 'sun-market', branchId: 'sunyani', name: 'Sunyani Central / Market Circle Area', fee: 6, minOrderValue: 20, estimatedMinutes: '15-25 mins', active: true, description: 'Commercial core, Market circle, and nearby offices.' },
  { id: 'sun-residential', branchId: 'sunyani', name: 'Sunyani Residential Areas (Area 1, 2, 3, 4)', fee: 10, minOrderValue: 30, estimatedMinutes: '25-35 mins', active: true, description: 'Residential estates and government residential areas.' },
  { id: 'sun-airport', branchId: 'sunyani', name: 'Sunyani Airport / Kotokrom / Penkwase', fee: 12, minOrderValue: 40, estimatedMinutes: '30-45 mins', active: true, description: 'Penkwase and town extensions.' }
]

for (const zone of defaultZones) {
  await DeliveryZone.updateOne({ id: zone.id }, { $set: zone }, { upsert: true })
}
console.log('Seeded delivery zones for CUG and Sunyani')

// 4. Seed Daily Availability for today
const todayStr = new Date().toISOString().slice(0, 10)
const allMenuItems = await MenuItem.find().lean()
for (const branch of ['cug', 'sunyani']) {
  for (const item of allMenuItems) {
    if (item.isExtra) continue
    await DailyAvailability.updateOne(
      { branchId: branch, mealId: item.id, date: todayStr },
      {
        $setOnInsert: {
          branchId: branch,
          mealId: item.id,
          mealName: item.name,
          date: todayStr,
          status: 'available',
          quantityPrepared: branch === 'cug' ? 45 : 60,
          quantityReserved: 0,
          quantitySold: 0
        }
      },
      { upsert: true }
    )
  }
}
console.log(`Seeded daily inventory portions for ${todayStr}`)

// 5. Seed Promos
for (const promo of Object.values(PROMO_CODES)) {
  await Promo.updateOne({ code: promo.code }, { $setOnInsert: { ...promo, enabled: true } }, { upsert: true })
}

// 6. Seed Reviews
if (!(await Review.countDocuments())) {
  await Review.insertMany(REVIEWS.map(({ id, ...review }) => review))
}

// 7. Seed App State
for (const [key, value] of Object.entries({
  cats: ['Rice', 'Waakye', 'Banku & Fufu', 'Ampesi & Stews', 'Drinks & Extras'],
  staff: [],
  customers: [],
  loyaltyRules: { spendPerPoint: 10, rewardThreshold: 50, promoDiscount: 20 },
  settings: {
    businessName: "Lady 3D's Catering Services",
    cugWhatsapp: '053 129 9243',
    sunyaniWhatsapp: '053 129 9243',
    cateringPhone: '024 465 0474',
    generalPhone: '027 691 3089',
    hours: 'Daily, 7:00 AM – 8:00 PM'
  },
  votes: { 'Waakye Special': 0, 'Jollof & Chicken': 0, 'Fufu & Light Soup': 0 }
})) {
  await AppState.updateOne({ key }, { $setOnInsert: { key, value } }, { upsert: true })
}

const isLocalDev = process.env.NODE_ENV === 'development'

// 8. Seed Default Staff Accounts (Owner, Managers, Kitchen, Driver)
if (process.env.SEED_OWNER_EMAIL && process.env.SEED_OWNER_PASSWORD) {
  const email = process.env.SEED_OWNER_EMAIL.toLowerCase()
  await User.updateOne(
    { email },
    {
      $set: {
        name: process.env.SEED_OWNER_NAME || 'Lady 3D General Manager',
        email,
        phone: process.env.SEED_OWNER_PHONE || '0276913089',
        passwordHash: await bcrypt.hash(process.env.SEED_OWNER_PASSWORD, 12),
        role: 'Owner',
        assignedBranch: 'all',
        active: true
      }
    },
    { upsert: true }
  )
  console.log(`Ensured owner login for ${email}`)

  const demoStaffEmails = [
    'manager.cug@lady3d.local',
    'kitchen.cug@lady3d.local',
    'driver.cug@lady3d.local',
    'cashier.cug@lady3d.local',
    'manager.sunyani@lady3d.local',
    'kitchen.sunyani@lady3d.local',
    'driver.sunyani@lady3d.local',
    'cashier.sunyani@lady3d.local'
  ]

  if (isLocalDev && process.env.SEED_DEMO_STAFF === 'true') {
    const demoStaff = [
      { email: 'manager.cug@lady3d.local', name: 'CUG Branch Manager', role: 'Manager', branch: 'cug', phone: '0531299243' },
      { email: 'kitchen.cug@lady3d.local', name: 'Fiapre Chef / Kitchen', role: 'Kitchen', branch: 'cug', phone: '0244650474' },
      { email: 'driver.cug@lady3d.local', name: 'Campus Dispatch Rider 1', role: 'Driver', branch: 'cug', phone: '0551122334' },
      { email: 'cashier.cug@lady3d.local', name: 'CUG Cashier POS', role: 'Cashier', branch: 'cug', phone: '0245566778' },
      { email: 'manager.sunyani@lady3d.local', name: 'Sunyani Main Manager', role: 'Manager', branch: 'sunyani', phone: '0276913089' },
      { email: 'kitchen.sunyani@lady3d.local', name: 'Main Kitchen Team', role: 'Kitchen', branch: 'sunyani', phone: '0244650474' },
      { email: 'driver.sunyani@lady3d.local', name: 'Town Dispatch Rider 1', role: 'Driver', branch: 'sunyani', phone: '0209988776' },
      { email: 'cashier.sunyani@lady3d.local', name: 'Sunyani Cashier POS', role: 'Cashier', branch: 'sunyani', phone: '0249988776' }
    ]

    for (const s of demoStaff) {
      const staffPassword = process.env.SEED_DEMO_STAFF_PASSWORD || 'StaffPass123!'
      await User.updateOne(
        { email: s.email },
        {
          $set: {
            name: s.name,
            email: s.email,
            phone: s.phone,
            role: s.role,
            assignedBranch: s.branch,
            active: true,
            passwordHash: await bcrypt.hash(staffPassword, 12)
          }
        },
        { upsert: true }
      )
    }

    // Demo customer account for customer login testing
    await User.updateOne(
      { email: 'customer@lady3d.local' },
      {
        $set: {
          name: 'Ama Boateng (Demo Customer)',
          email: 'customer@lady3d.local',
          phone: '0241234567',
          role: 'customer',
          assignedBranch: 'cug',
          active: true,
          passwordHash: await bcrypt.hash('Customer123!', 12)
        }
      },
      { upsert: true }
    )

    console.log('Ensured role accounts (Manager, Kitchen, Driver, Cashier, Customer) for local testing')
  } else {
    const removed = await User.deleteMany({ email: { $in: demoStaffEmails } })
    if (removed.deletedCount > 0) {
      console.log(`Purged ${removed.deletedCount} demo staff accounts retained outside local development`)
    }
  }
} else {
  console.log('Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD to seed staff credentials.')
}

// 9. Rotate any active accounts using known seeded/compromised passwords in production
if (!isLocalDev) {
  const existingUsers = await User.find({})
  for (const u of existingUsers) {
    if (u.passwordHash && await bcrypt.compare('StaffPass123!', u.passwordHash)) {
      const rotated = randomBytes(24).toString('base64url')
      u.passwordHash = await bcrypt.hash(rotated, 12)
      u.active = false
      await u.save()
      console.log(`Rotated compromised seeded password for account: ${u.email}`)
    }
  }
}

await mongoose.disconnect()
console.log('Database seed complete with full target schema!')
