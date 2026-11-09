// Lady 3D's Catering Services - Menu & App Data
export const BRANCHES = [
  {
    id: 'cug',
    name: 'Catholic University (Campus Annex)',
    short: 'CUG Campus',
    address: 'Fiapre Campus, Catholic University of Ghana, Sunyani',
    phone: '027 691 3089',
    whatsapp: '053 129 9243',
    cateringPhone: '024 465 0474',
    badge: 'Fiapre Campus',
    flyerImg: '/campus-branch-flyer.jpg',
    tagline: 'Delicious meals, made with love for students & faculty'
  },
  {
    id: 'sunyani',
    name: 'Sunyani (Main Branch)',
    short: 'Sunyani Main',
    address: 'Market Circle / Main Road, Sunyani',
    phone: '027 691 3089',
    whatsapp: '053 129 9243',
    cateringPhone: '024 465 0474',
    badge: 'Market Circle',
    flyerImg: '/main-branch-signboard.jpg',
    tagline: 'We serve all kinds of local & continental dishes'
  },
]

export const STATUSES = [
  { label: 'Received', desc: 'Order received by the kitchen', step: '1' },
  { label: 'Confirmed', desc: 'Kitchen confirmed your order', step: '2' },
  { label: 'Preparing', desc: 'Cooking your fresh meal', step: '3' },
  { label: 'Ready for Collection', desc: 'Packed and ready for pickup', step: '4' },
  { label: 'Collected', desc: 'Order completed and delivered', step: '5' },
]

export const ORDER_STATUS_MAP = {
  pending_payment: { label: 'Pending Payment', desc: 'Awaiting required payment', step: 1, color: '#f59e0b' },
  confirmed: { label: 'Confirmed', desc: 'Accepted by the system', step: 2, color: '#3b82f6' },
  preparing: { label: 'Preparing', desc: 'Kitchen is preparing food', step: 3, color: '#8b5cf6' },
  ready_for_collection: { label: 'Ready for Collection', desc: 'Food is packed and ready for pickup', step: 4, color: '#10b981' },
  ready_for_dispatch: { label: 'Ready for Dispatch', desc: 'Food is packed and awaiting rider dispatch', step: 4, color: '#06b6d4' },
  out_for_delivery: { label: 'Out for Delivery', desc: 'Rider has collected the food', step: 4, color: '#f97316' },
  collected: { label: 'Collected', desc: 'Customer has collected the order', step: 5, color: '#059669' },
  delivered: { label: 'Delivered', desc: 'Order successfully delivered to customer', step: 5, color: '#059669' },
  cancelled: { label: 'Cancelled', desc: 'Order has been cancelled', step: 0, color: '#ef4444' },
  rejected: { label: 'Rejected', desc: 'Order could not be fulfilled', step: 0, color: '#dc2626' }
}

export const PAYMENT_STATUS_MAP = {
  unpaid: { label: 'Unpaid', color: '#6b7280' },
  pending: { label: 'Pending Payment', color: '#f59e0b' },
  paid: { label: 'Paid', color: '#10b981' },
  failed: { label: 'Payment Failed', color: '#ef4444' },
  refunded: { label: 'Refunded', color: '#6366f1' },
  partially_refunded: { label: 'Partially Refunded', color: '#8b5cf6' }
}

export const DELIVERY_STATUS_MAP = {
  not_applicable: { label: 'Not Applicable (Collection)', color: '#6b7280' },
  awaiting_assignment: { label: 'Awaiting Rider Assignment', color: '#f59e0b' },
  assigned: { label: 'Rider Assigned', color: '#3b82f6' },
  awaiting_pickup: { label: 'Awaiting Kitchen Pickup', color: '#8b5cf6' },
  picked_up: { label: 'Picked Up by Rider', color: '#06b6d4' },
  in_transit: { label: 'In Transit', color: '#f97316' },
  delivered: { label: 'Delivered', color: '#10b981' },
  failed_delivery: { label: 'Delivery Failed', color: '#ef4444' },
  returned: { label: 'Returned to Kitchen', color: '#b91c1c' }
}

export const DEFAULT_DELIVERY_ZONES = [
  { id: 'cug-halls', branchId: 'cug', name: 'Catholic University Hostels & Campus Halls', fee: 5, minOrderValue: 20, estimatedMinutes: '15-25 mins', active: true, description: 'Direct delivery to any hall of residence or faculty block.' },
  { id: 'cug-fiapre', branchId: 'cug', name: 'Fiapre Town & Surrounding Hostels', fee: 8, minOrderValue: 25, estimatedMinutes: '20-35 mins', active: true, description: 'Private student hostels and residences within Fiapre.' },
  { id: 'cug-berlin', branchId: 'cug', name: 'Berlin-Top / Fiapre Barrier Area', fee: 10, minOrderValue: 35, estimatedMinutes: '25-40 mins', active: true, description: 'Fiapre outskirts and boundary zones.' },
  { id: 'sun-market', branchId: 'sunyani', name: 'Sunyani Central / Market Circle Area', fee: 6, minOrderValue: 20, estimatedMinutes: '15-25 mins', active: true, description: 'Commercial core, Market circle, and nearby offices.' },
  { id: 'sun-residential', branchId: 'sunyani', name: 'Sunyani Residential Areas (Area 1, 2, 3, 4)', fee: 10, minOrderValue: 30, estimatedMinutes: '25-35 mins', active: true, description: 'Residential estates and government residential areas.' },
  { id: 'sun-airport', branchId: 'sunyani', name: 'Sunyani Airport / Kotokrom / Penkwase', fee: 12, minOrderValue: 40, estimatedMinutes: '30-45 mins', active: true, description: 'Penkwase and town extensions.' }
]

const a = (c = true, s = true) => ({ cug: c, sunyani: s })

// Official Extras as listed on both the Campus Flyer and Main Branch Signboard
export const EXTRAS = [
  { id: 101, name: 'Extra Chicken (Grilled/Fried)', cat: 'Drinks & Extras', price: 15, tag: 'Extra', img: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80', desc: 'Juicy, flame-grilled or golden fried seasoned chicken portion.', avail: a(), isExtra: true },
  { id: 102, name: 'Cow Feet Portion', cat: 'Drinks & Extras', price: 15, tag: 'Extra', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80', desc: 'Tender, spiced cow feet cooked in rich savory broth.', avail: a(), isExtra: true },
  { id: 103, name: 'Intestines (Towel)', cat: 'Drinks & Extras', price: 12, tag: 'Extra', img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80', desc: 'Soft and savory seasoned towel intestines in pepper broth.', avail: a(), isExtra: true },
  { id: 104, name: 'Fried Whole Fish', cat: 'Drinks & Extras', price: 15, tag: 'Extra', img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80', desc: 'Golden crispy fried seasoned fish (tilapia/red fish).', avail: a(), isExtra: true },
  { id: 105, name: 'Sausage Links (2 pcs)', cat: 'Drinks & Extras', price: 8, tag: 'Extra', img: 'https://images.unsplash.com/photo-1597393353415-b3730f3719fe?auto=format&fit=crop&w=800&q=80', desc: 'Grilled chicken/beef sausages with mild seasonings.', avail: a(), isExtra: true },
  { id: 106, name: 'Extra Light Soup Bowl', cat: 'Drinks & Extras', price: 10, tag: 'Extra', img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80', desc: 'Aromatic, spicy Ghanaian tomato and pepper light soup broth.', avail: a(), isExtra: true },
  { id: 107, name: 'Extra Groundnut Soup Bowl', cat: 'Drinks & Extras', price: 10, tag: 'Extra', img: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80', desc: 'Rich, creamy peanut butter groundnut soup with spices.', avail: a(), isExtra: true },
  { id: 108, name: 'Extra Banku (with Pepper/Soup)', cat: 'Drinks & Extras', price: 10, tag: 'Extra', img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80', desc: 'Soft fermented corn and cassava banku ball with spicy raw pepper or soup.', avail: a(), isExtra: true },
  { id: 109, name: 'Fried Ripe Plantain (Dodo)', cat: 'Drinks & Extras', price: 8, tag: 'Extra', img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80', desc: 'Sweet, caramelized slices of golden fried ripe plantain.', avail: a(), isExtra: true },
  { id: 110, name: 'Boiled Egg (Seasoned)', cat: 'Drinks & Extras', price: 4, tag: 'Extra', img: 'https://images.unsplash.com/photo-1539136788836-5699e78bfc75?auto=format&fit=crop&w=800&q=80', desc: 'Farm-fresh boiled egg with pinch of pepper seasoning.', avail: a(), isExtra: true },
]

export const MENU = [
  // 1. Campus & Main Featured Dishes (From Campus Flyer & Main Signboard)
  {
    id: 1,
    name: 'Waakye Special',
    cat: 'Waakye',
    price: 30,
    hue: 18,
    img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    desc: 'Rice and beans served on plantain leaf with spaghetti (talia), fried ripe plantain, boiled egg, spicy shito and beef stew.',
    tag: 'Student Favourite',
    rating: 4.9,
    reviews: 148,
    prepTime: '10-15 min',
    avail: a(true, true),
    prices: {}
  },
  {
    id: 2,
    name: 'Jollof & Grilled Chicken',
    cat: 'Rice',
    price: 35,
    hue: 8,
    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    desc: 'Authentic smoky Ghanaian party jollof cooked in rich spiced tomato sauce, served with roasted chicken quarter and coleslaw salad.',
    tag: 'Meal of the Day',
    rating: 5.0,
    reviews: 236,
    prepTime: '10-15 min',
    avail: a(true, true),
    prices: { sunyani: 38 }
  },
  {
    id: 3,
    name: 'Fried Rice & Fried Fish (Tilapia)',
    cat: 'Rice',
    price: 40,
    hue: 45,
    img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    desc: 'Golden stir-fried vegetable rice paired with crispy whole fried fish, hot green shito sauce and fresh vegetable garnish.',
    tag: 'Campus Special',
    rating: 4.9,
    reviews: 112,
    prepTime: '15-20 min',
    avail: a(true, true),
    prices: {}
  },
  {
    id: 4,
    name: 'Fried Rice & Chicken',
    cat: 'Rice',
    price: 35,
    hue: 40,
    img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    desc: 'Savory stir-fried rice loaded with crunchy fresh vegetables, spiced chicken quarter, and hot green pepper sauce.',
    tag: 'Bestseller',
    rating: 4.8,
    reviews: 120,
    prepTime: '12-18 min',
    avail: a(true, true),
    prices: {}
  },
  {
    id: 5,
    name: 'Plain Rice & Chicken Stew',
    cat: 'Rice',
    price: 32,
    hue: 35,
    img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    desc: 'Steamed fragrant white rice served with Ghanaian chicken stew, boiled egg and sliced fresh garden salad (lettuce, cucumber, tomatoes).',
    tag: 'Daily Special',
    rating: 4.8,
    reviews: 94,
    prepTime: '10-15 min',
    avail: a(true, true),
    prices: {}
  },
  {
    id: 6,
    name: 'Banku & Light Soup with Intestines (Towel)',
    cat: 'Banku & Fufu',
    price: 35,
    hue: 24,
    img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    desc: 'Smooth corn and cassava banku served in aromatic spicy light soup with tender seasoned towel intestines, sliced onions and fresh tomatoes.',
    tag: 'Chef Special',
    rating: 4.9,
    reviews: 87,
    prepTime: '15-20 min',
    avail: a(true, true),
    prices: {}
  },
  {
    id: 7,
    name: 'Banku / Fufu with Cow Feet Soup',
    cat: 'Banku & Fufu',
    price: 40,
    hue: 28,
    img: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    desc: 'Freshly prepared banku or fufu served in rich peanut groundnut or light soup loaded with tender seasoned cow feet.',
    tag: 'Top Pick',
    rating: 4.9,
    reviews: 104,
    prepTime: '15-20 min',
    avail: a(true, true),
    prices: {}
  },

  // 2. Main Branch Exclusive Specialties (Sold at Sunyani Main Branch)
  {
    id: 8,
    name: 'Banku & Grilled Tilapia with Hot Pepper',
    cat: 'Banku & Fufu',
    price: 45,
    hue: 52,
    img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    desc: 'Soft fermented corn and cassava banku paired with freshly seasoned grilled whole tilapia, hot raw pepper sauce and sliced onions.',
    tag: 'Main Signature',
    rating: 5.0,
    reviews: 156,
    prepTime: '20-25 min',
    avail: a(false, true), // Main branch only
    prices: {}
  },
  {
    id: 9,
    name: 'Fufu & Goat Light Soup',
    cat: 'Banku & Fufu',
    price: 42,
    hue: 30,
    img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    desc: 'Traditional freshly pounded plantain and cassava fufu steeped in fragrant, spicy goat meat light soup with local herbs and garden seasonings.',
    tag: 'Main Branch Specialty',
    rating: 4.9,
    reviews: 138,
    prepTime: '15-20 min',
    avail: a(false, true), // Main branch only
    prices: {}
  },
  {
    id: 10,
    name: 'Yam Ampesi & Kontomire (Palava Sauce) with Egg',
    cat: 'Ampesi & Stews',
    price: 35,
    hue: 15,
    img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80',
    desc: 'Steamed soft Pona yam ampesi served with rich cocoyam leaves (kontomire / palava sauce), smoked fish, boiled egg and avocado slices.',
    tag: 'Local Heritage',
    rating: 4.9,
    reviews: 91,
    prepTime: '15-20 min',
    avail: a(false, true), // Main branch only
    prices: {}
  },
  {
    id: 11,
    name: 'Plantain Ampesi & Garden Egg Stew with Fish',
    cat: 'Ampesi & Stews',
    price: 35,
    hue: 20,
    img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    desc: 'Tender boiled plantain served with traditional Ghanaian garden egg stew, smoked salmon/fish, boiled egg and palm oil aroma.',
    tag: 'Traditional Stew',
    rating: 4.8,
    reviews: 79,
    prepTime: '15-20 min',
    avail: a(false, true), // Main branch only
    prices: {}
  },
  {
    id: 12,
    name: 'Kokonte with Groundnut Soup & Cow Feet',
    cat: 'Banku & Fufu',
    price: 35,
    hue: 33,
    img: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
    desc: 'Traditional smooth dried cassava swallow (Kokonte / Face-the-Wall) served with rich, creamy peanut groundnut soup and tender cow feet.',
    tag: 'Main Branch Traditional',
    rating: 4.8,
    reviews: 64,
    prepTime: '15-20 min',
    avail: a(false, true), // Main branch only
    prices: {}
  },
  {
    id: 13,
    name: 'Plain Jollof & Boiled Egg',
    cat: 'Rice',
    price: 20,
    hue: 12,
    img: 'https://images.unsplash.com/photo-1539136788836-5699e78bfc75?auto=format&fit=crop&w=800&q=80',
    desc: 'Our budget-friendly smoky jollof plate served with seasoned boiled egg, coleslaw salad and mild stew.',
    tag: 'Budget Saver',
    rating: 4.7,
    reviews: 64,
    prepTime: '5-10 min',
    avail: a(true, true),
    prices: {}
  },
  {
    id: 14,
    name: 'Red Red & Fried Plantain',
    cat: 'Ampesi & Stews',
    price: 28,
    hue: 4,
    img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80',
    desc: 'Tender black-eyed beans cooked in aromatic red palm oil stew, served with caramelized fried ripe plantains and gari.',
    tag: 'Local Classic',
    rating: 4.8,
    reviews: 73,
    prepTime: '10-15 min',
    avail: a(false, true),
    prices: {}
  },
  {
    id: 15,
    name: 'Sobolo Chilled Drink (500ml)',
    cat: 'Drinks & Extras',
    price: 10,
    hue: 350,
    img: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
    desc: 'Chilled homemade hibiscus tea infused with spicy ginger, cloves, fresh pineapple juice and aromatic mint leaves.',
    tag: 'Ice Cold',
    rating: 5.0,
    reviews: 189,
    prepTime: 'Ready to serve',
    avail: a(true, true),
    prices: {}
  },

  // Spread the extras so they are searchable and orderable in the menu as well
  ...EXTRAS
]

export const CATEGORIES_WITH_ICONS = [
  { name: 'All', key: 'all', label: 'All Meals' },
  { name: 'Rice', key: 'rice', label: 'Jollof & Fried' },
  { name: 'Waakye', key: 'waakye', label: 'Waakye Plates' },
  { name: 'Banku & Fufu', key: 'swallow', label: 'Swallow Dishes' },
  { name: 'Ampesi & Stews', key: 'stews', label: 'Ampesi & Stews' },
  { name: 'Drinks & Extras', key: 'drinks', label: 'Extras & Drinks' },
]

export const PROMO_CODES = {
  'WELCOME20': { code: 'WELCOME20', discount: 0.20, label: '20% Welcome Voucher' },
  'STUDENT10': { code: 'STUDENT10', discount: 0.10, label: '10% Student Discount' },
  'LADY3D': { code: 'LADY3D', discount: 0.15, label: '15% Catering Special' },
  '3H89DSH': { code: '3H89DSH', discount: 0.20, label: '20% App Promo' }
}

export const priceAt = (it, b) => it.prices?.[b] ?? it.price

export const REVIEWS = []

export const ROLES = {
  Owner: ['overview', 'orders', 'delivery', 'inventory', 'branch-dashboards', 'menu', 'categories', 'branches', 'customers', 'loyalty', 'promos', 'payments', 'analytics', 'reviews', 'staff', 'settings'],
  Manager: ['overview', 'orders', 'delivery', 'inventory', 'branch-dashboards', 'menu', 'categories', 'branches', 'customers', 'loyalty', 'promos', 'reviews'],
  Kitchen: ['orders', 'inventory'],
  Driver: ['delivery'],
  Cashier: ['overview', 'orders', 'branch-dashboards'],
}

export const ADMIN_NAV = [
  ['overview', 'Overview'],
  ['orders', 'Kitchen & Orders'],
  ['delivery', 'Delivery Operations'],
  ['inventory', 'Daily Stock & Portions'],
  ['branch-dashboards', 'Branch Dashboards'],
  ['menu', 'Menu'],
  ['categories', 'Categories'],
  ['branches', 'Branch menu & prices'],
  ['customers', 'Customers'],
  ['loyalty', 'Loyalty & rewards'],
  ['promos', 'Promotions'],
  ['payments', 'Payments'],
  ['analytics', 'Sales reports'],
  ['reviews', 'Reviews & feedback'],
  ['staff', 'Staff & roles'],
  ['settings', 'Settings'],
]

let activeSettings = null
export function setActiveSettings(s) {
  if (s) activeSettings = s
}

export function getBranchWhatsApp(branchId, customSettings = null) {
  const s = customSettings || activeSettings
  if (s) {
    const raw = branchId === 'sunyani' ? s.sunyaniWhatsapp : s.cugWhatsapp
    if (raw) {
      const clean = String(raw).replace(/\D/g, '')
      if (clean) return clean.startsWith('0') ? '233' + clean.slice(1) : clean
    }
  }
  const b = BRANCHES.find(x => x.id === branchId) || BRANCHES[0]
  const clean = (b.whatsapp || '053 129 9243').replace(/\D/g, '')
  return clean.startsWith('0') ? '233' + clean.slice(1) : clean
}

export function buildOrderWhatsAppUrl(order, customSettings = null) {
  const branchObj = BRANCHES.find(b => b.id === order?.branch) || BRANCHES[0]
  const phone = getBranchWhatsApp(order?.branch, customSettings)
  const s = customSettings || activeSettings
  const currencySymbol = s?.currency || 'GH₵'
  const brandName = (s?.businessName || "Lady 3D's Catering Services").toUpperCase()

  const itemsText = (order.items || []).map(i => {
    const extrasStr = i.extras && i.extras.length ? ` (+ ${i.extras.map(e => e.name).join(', ')})` : ''
    const extrasTotal = (i.extras || []).reduce((sum, extra) => sum + (extra.price || 0), 0)
    return `• ${i.qty}x ${i.name}${extrasStr} - ${currencySymbol} ${((i.price ?? i.unitPrice ?? 0) + extrasTotal) * i.qty}`
  }).join('\n')

  const msg = 
`*NEW ORDER - ${brandName}*
--------------------------------
*Branch:* ${branchObj.name}
*Order Ref:* #${order.ref}
*Customer:* ${order.name} (${order.phone})
*Order Type:* ${order.orderType === 'delivery' ? 'Campus Delivery' : 'Counter Pickup'}
${order.address ? `*Address/Room:* ${order.address}\n` : ''}*Items Ordered:*
${itemsText}

*Subtotal:* ${currencySymbol} ${order.subtotal || order.total}
${order.discount ? `*Discount:* -${currencySymbol} ${order.discount}\n` : ''}${order.deliveryFee ? `*Delivery Fee:* ${currencySymbol} ${order.deliveryFee}\n` : ''}*TOTAL AMOUNT:* ${currencySymbol} ${order.total}
*Payment Method:* ${order.pay === 'momo' ? 'Mobile Money (Prompt)' : 'Pay on Collection/Delivery'}
*Payment Status:* ${order.paid ? 'PAID' : 'PENDING'}
--------------------------------
_Order placed via ${s?.businessName || "Lady 3D's Catering"} Mobile App_`

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}
