import { createContext, useContext, useEffect, useState } from 'react'
import { MENU, SEED_ORDERS, REVIEWS, PROMO_CODES, priceAt } from './data.js'

const Ctx = createContext()
export const useApp = () => useContext(Ctx)
export const money = n => 'GH₵' + Number(n).toFixed(2).replace(/\.00$/, '')

export function useHash() {
  const [h, setH] = useState(location.hash.slice(1) || '/')
  useEffect(() => {
    const f = () => {
      setH(location.hash.slice(1) || '/')
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return h
}

export const go = p => {
  location.hash = p
}

export function AppProvider({ children }) {
  const [menu, setMenu] = useState(MENU)
  const [cats, setCats] = useState(['Rice', 'Waakye', 'Banku & Fufu', 'Soups & Stews', 'Sides & Drinks'])
  const [branch, setBranch] = useState('cug') // default to CUG Annex for instant convenient browsing
  const [orderType, setOrderType] = useState('delivery') // 'delivery' | 'pickup'
  const [cart, setCart] = useState([])
  const [orders, setOrders] = useState(SEED_ORDERS)
  
  // Persistent user state with Google auth support
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lady3d-user')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return null
  })
  
  const [googleModal, setGoogleModal] = useState(false)
  const [favs, setFavs] = useState([1, 2])
  const [points, setPoints] = useState(38)
  const [reviews, setReviews] = useState(REVIEWS)
  const [votes, setVotes] = useState({ 'Waakye Special': 41, 'Jollof & Chicken': 37, 'Fufu & Light Soup': 18 })
  const [voted, setVoted] = useState(null)
  const [toast, setToast] = useState('')
  const [promos, setPromos] = useState([
    { id: 1, name: 'Student ID: 10% off before 11am (Code: STUDENT10)', on: true },
    { id: 2, name: 'Welcome 20% Voucher on all orders (Code: WELCOME20)', on: true }
  ])
  const [promoCode, setPromoCode] = useState('WELCOME20')
  const [promoError, setPromoError] = useState('')
  const [role, setRole] = useState('Owner')
  const [activeFood, setActiveFood] = useState(null)
  const [deviceFrame, setDeviceFrame] = useState(false) // Toggle phone frame preview

  const say = m => {
    setToast(m)
    setTimeout(() => setToast(''), 2600)
  }

  const loginUser = userData => {
    setUser(userData)
    try {
      localStorage.setItem('lady3d-user', JSON.stringify(userData))
    } catch (e) {}
    say(`Welcome back, ${userData.name}!`)
  }

  const logoutUser = () => {
    setUser(null)
    try {
      localStorage.removeItem('lady3d-user')
    } catch (e) {}
    say('You have been logged out.')
  }

  const loginGoogle = (googleAccount) => {
    const acc = googleAccount || {
      name: 'Julie Martin',
      email: 'julie.martin@cug.edu.gh',
      phone: '0241234567',
      googleAuth: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    }
    loginUser(acc)
    setGoogleModal(false)
  }

  const price = it => priceAt(it, branch || 'cug')
  const ok = it => !branch || it.avail[branch]

  const add = (id, q = 1) => {
    setCart(c => c.find(x => x.id === id) ? c.map(x => x.id === id ? { ...x, qty: x.qty + q } : x) : [...c, { id, qty: q }])
    say('Added to basket')
  }

  const setQty = (id, q) => setCart(c => q < 1 ? c.filter(x => x.id !== id) : c.map(x => x.id === id ? { ...x, qty: q } : x))

  const lines = cart.map(l => ({ ...l, it: menu.find(m => m.id === l.id) })).filter(l => l.it)
  const subtotal = lines.reduce((s, l) => s + price(l.it) * l.qty, 0)
  
  // Calculate promo discount
  const activePromo = promoCode && PROMO_CODES[promoCode.toUpperCase()]
  const discountRate = activePromo ? activePromo.discount : 0
  const discount = Math.round(subtotal * discountRate * 100) / 100
  const deliveryFee = orderType === 'delivery' && subtotal > 0 ? (subtotal >= 80 ? 0 : 5) : 0
  const total = Math.max(0, subtotal - discount + deliveryFee)
  const count = cart.reduce((s, l) => s + l.qty, 0)

  const applyPromo = code => {
    const clean = (code || '').trim().toUpperCase()
    if (!clean) {
      setPromoCode('')
      setPromoError('')
      return
    }
    if (PROMO_CODES[clean]) {
      setPromoCode(clean)
      setPromoError('')
      say(`Promo ${clean} applied! (-${PROMO_CODES[clean].discount * 100}%)`)
    } else {
      setPromoError('Invalid promo code. Try WELCOME20 or STUDENT10')
      say('Invalid voucher code')
    }
  }

  const removePromo = () => {
    setPromoCode('')
    setPromoError('')
    say('Voucher removed')
  }

  const toggleFav = id => {
    setFavs(f => {
      const isFav = f.includes(id)
      say(isFav ? 'Removed from favorites' : 'Saved to favorites ♥')
      return isFav ? f.filter(x => x !== id) : [...f, id]
    })
  }

  const place = f => {
    const ref = 'L3D-' + Math.random().toString(36).slice(2, 7).toUpperCase()
    const o = {
      ref,
      items: lines.map(l => ({ id: l.id, name: l.it.name, qty: l.qty, price: price(l.it), img: l.it.img })),
      subtotal,
      discount,
      deliveryFee,
      total,
      branch,
      orderType,
      ...f,
      paid: false,
      status: 0,
      mine: true,
      time: new Date().toTimeString().slice(0, 5)
    }
    setOrders(os => [o, ...os])
    setCart([])
    say(`Order ${ref} placed successfully!`)
    return ref
  }

  const setStatus = (ref, s) => {
    const o = orders.find(x => x.ref === ref)
    setOrders(os => os.map(x => x.ref === ref ? { ...x, status: s, paid: s === 4 && x.pay === 'cash' ? true : x.paid } : x))
    const paid = o?.paid || o?.pay === 'cash'
    if (s === 4 && o?.status !== 4 && o?.mine && paid && o?.total >= 20) {
      setPoints(p => p + Math.floor(o.total / 10))
      say('Loyalty points awarded!')
    }
  }

  const markPaid = ref => setOrders(os => os.map(x => x.ref === ref ? { ...x, paid: true } : x))

  const v = {
    menu, setMenu,
    cats, setCats,
    branch, setBranch,
    orderType, setOrderType,
    cart, add, setQty, lines,
    subtotal, discount, deliveryFee, total, count,
    price, ok,
    place, orders, setStatus, markPaid,
    user, setUser, loginUser, logoutUser, loginGoogle, googleModal, setGoogleModal,
    favs, setFavs, toggleFav,
    points, setPoints,
    reviews, setReviews,
    votes, setVotes, voted, setVoted,
    toast, say,
    promos, setPromos,
    promoCode, setPromoCode, promoError, applyPromo, removePromo,
    role, setRole,
    activeFood, setActiveFood,
    deviceFrame, setDeviceFrame
  }

  return <Ctx.Provider value={v}>{children}</Ctx.Provider>
}
