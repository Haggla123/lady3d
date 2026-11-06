// Lady 3D's Catering Services - Menu & App Data
export const BRANCHES = [
  { id: 'cug', name: 'Catholic University (Annex)', short: 'CUG Annex', address: 'Fiapre Campus, Sunyani' },
  { id: 'sunyani', name: 'Sunyani (Main)', short: 'Sunyani Main', address: 'Market Circle, Sunyani' },
]

export const STATUSES = [
  { label: 'Received', desc: 'Order received by the kitchen', icon: '📝' },
  { label: 'Confirmed', desc: 'Kitchen confirmed your order', icon: '👨‍🍳' },
  { label: 'Preparing', desc: 'Cooking your fresh meal', icon: '🔥' },
  { label: 'Ready for Collection', desc: 'Packed and waiting for you', icon: '🛍️' },
  { label: 'Collected', desc: 'Delivered & enjoyed', icon: '✨' },
]

const a = (c = true, s = true) => ({ cug: c, sunyani: s })

export const MENU = [
  {
    id: 1,
    name: 'Waakye Special',
    cat: 'Waakye',
    price: 30,
    hue: 18,
    img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    desc: 'Rice and beans served with spaghetti, gari foto, spicy black shito, boiled egg, fried plantain and rich beef stew.',
    tag: 'Student Favourite',
    rating: 4.9,
    reviews: 128,
    prepTime: '10-15 min',
    avail: a(),
    prices: {}
  },
  {
    id: 2,
    name: 'Jollof & Chicken',
    cat: 'Rice',
    price: 35,
    hue: 8,
    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    desc: 'Authentic smoky Ghanaian party jollof cooked in rich spiced tomato sauce, served with seasoned grilled chicken and kachumbari.',
    tag: 'Meal of the Day',
    rating: 5.0,
    reviews: 214,
    prepTime: '10-15 min',
    avail: a(),
    prices: { sunyani: 38 }
  },
  {
    id: 3,
    name: 'Fried Rice & Chicken',
    cat: 'Rice',
    price: 35,
    hue: 40,
    img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    desc: 'Savory stir-fried rice loaded with crunchy fresh vegetables, spiced chicken quarter, and hot green pepper sauce.',
    tag: 'Bestseller',
    rating: 4.8,
    reviews: 95,
    prepTime: '12-18 min',
    avail: a(),
    prices: {}
  },
  {
    id: 4,
    name: 'Plain Jollof & Egg',
    cat: 'Rice',
    price: 20,
    hue: 12,
    img: 'https://images.unsplash.com/photo-1539136788836-5699e78bfc75?auto=format&fit=crop&w=800&q=80',
    desc: 'Our budget-friendly smoky jollof plate served with seasoned boiled egg, coleslaw salad and mild stew.',
    tag: 'Budget Saver',
    rating: 4.7,
    reviews: 64,
    prepTime: '5-10 min',
    avail: a(),
    prices: {}
  },
  {
    id: 5,
    name: 'Banku & Tilapia',
    cat: 'Banku & Fufu',
    price: 45,
    hue: 52,
    img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    desc: 'Soft fermented corn and cassava banku paired with freshly seasoned grilled whole tilapia, hot raw pepper sauce and sliced onions.',
    tag: 'Chef Special',
    rating: 4.9,
    reviews: 82,
    prepTime: '20-25 min',
    avail: a(false, true),
    prices: {}
  },
  {
    id: 6,
    name: 'Fufu & Light Soup',
    cat: 'Banku & Fufu',
    price: 40,
    hue: 30,
    img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    desc: 'Traditional pounded plantain and cassava fufu steeped in fragrant, spicy goat meat light soup with local herbs.',
    tag: 'Sunday Comfort',
    rating: 4.9,
    reviews: 110,
    prepTime: '15-20 min',
    avail: a(),
    prices: {}
  },
  {
    id: 7,
    name: 'Red Red & Plantain',
    cat: 'Soups & Stews',
    price: 28,
    hue: 4,
    img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80',
    desc: 'Tender black-eyed beans cooked in aromatic red palm oil stew, served with caramelized fried ripe plantains and gari.',
    tag: 'Vegan Friendly',
    rating: 4.8,
    reviews: 73,
    prepTime: '10-15 min',
    avail: a(),
    prices: {}
  },
  {
    id: 8,
    name: 'Kenkey & Fish',
    cat: 'Banku & Fufu',
    price: 32,
    hue: 45,
    img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    desc: 'Steamed Ga kenkey served with golden fried fish, rich black shito, spicy freshly ground red pepper and diced tomatoes.',
    tag: 'Coastal Classic',
    rating: 4.7,
    reviews: 58,
    prepTime: '10-15 min',
    avail: a(true, false),
    prices: {}
  },
  {
    id: 9,
    name: 'Extra Grilled Chicken',
    cat: 'Sides & Drinks',
    price: 15,
    hue: 25,
    img: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
    desc: 'Juicy, flame-grilled chicken quarter seasoned in our signature ginger, garlic, rosemary and chili marinade.',
    tag: 'Add-on',
    rating: 4.9,
    reviews: 142,
    prepTime: '5 min',
    avail: a(),
    prices: {}
  },
  {
    id: 10,
    name: 'Sobolo (500ml)',
    cat: 'Sides & Drinks',
    price: 10,
    hue: 350,
    img: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
    desc: 'Chilled homemade hibiscus tea infused with spicy ginger, cloves, fresh pineapple juice and aromatic mint leaves.',
    tag: 'Ice Cold',
    rating: 5.0,
    reviews: 189,
    prepTime: 'Ready',
    avail: a(),
    prices: {}
  },
]

export const CATEGORIES_WITH_ICONS = [
  { name: 'All', icon: '🍽️', label: 'All Items' },
  { name: 'Rice', icon: '🍚', label: 'Jollof & Fried' },
  { name: 'Waakye', icon: '🍛', label: 'Waakye Bowls' },
  { name: 'Banku & Fufu', icon: '🥣', label: 'Swallow Meals' },
  { name: 'Soups & Stews', icon: '🍲', label: 'Hot Stews' },
  { name: 'Sides & Drinks', icon: '🥤', label: 'Drinks & Sides' },
]

export const PROMO_CODES = {
  'WELCOME20': { code: 'WELCOME20', discount: 0.20, label: '20% Welcome Voucher' },
  'STUDENT10': { code: 'STUDENT10', discount: 0.10, label: '10% Student Discount' },
  'LADY3D': { code: 'LADY3D', discount: 0.15, label: '15% Catering Special' },
  '3H89DSH': { code: '3H89DSH', discount: 0.20, label: '20% App Promo' }
}

export const priceAt = (it, b) => it.prices?.[b] ?? it.price

export const SEED_ORDERS = [
  { ref: 'L3D-7K2QA', items: [{ id: 1, name: 'Waakye Special', qty: 2, price: 30 }], total: 60, branch: 'cug', name: 'Kofi A.', phone: '0240000001', pay: 'momo', paid: true, status: 4, time: '08:42' },
  { ref: 'L3D-9PX4M', items: [{ id: 2, name: 'Jollof & Chicken', qty: 1, price: 35 }, { id: 10, name: 'Sobolo (500ml)', qty: 1, price: 10 }], total: 45, branch: 'cug', name: 'Ama B.', phone: '0240000002', pay: 'cash', paid: false, status: 2, time: '12:10' },
  { ref: 'L3D-3TR8D', items: [{ id: 5, name: 'Banku & Tilapia', qty: 1, price: 45 }], total: 45, branch: 'sunyani', name: 'Yaw M.', phone: '0240000003', pay: 'momo', paid: false, status: 0, time: '12:31' },
]

export const REVIEWS = [
  { id: 1, who: 'Efua Mensah', stars: 5, text: 'Waakye is always steaming hot and the shito is simply the best in Sunyani! Consistent every single time.', show: true, time: 'Yesterday' },
  { id: 2, who: 'Nana Kwame', stars: 5, text: 'Huge portions for student budget. The smoky jollof chicken is unbeatable during lunch break.', show: true, time: '2 days ago' },
  { id: 3, who: 'Julie Martin', stars: 5, text: 'Quick pickup service at Catholic University Annex. Clean packaging and friendly staff.', show: true, time: '3 days ago' },
]

export const ROLES = {
  Owner: ['overview', 'orders', 'menu', 'categories', 'branches', 'customers', 'loyalty', 'promos', 'payments', 'analytics', 'reviews', 'staff', 'settings'],
  Manager: ['overview', 'orders', 'menu', 'categories', 'branches', 'customers', 'loyalty', 'promos', 'reviews'],
  Cashier: ['overview', 'orders'],
}

export const ADMIN_NAV = [
  ['overview', 'Overview'], ['orders', 'Orders'], ['menu', 'Menu'], ['categories', 'Categories'], ['branches', 'Branch menu & prices'],
  ['customers', 'Customers'], ['loyalty', 'Loyalty & rewards'], ['promos', 'Promotions'], ['payments', 'Payments'],
  ['analytics', 'Sales reports'], ['reviews', 'Reviews & feedback'], ['staff', 'Staff & roles'], ['settings', 'Settings'],
]
