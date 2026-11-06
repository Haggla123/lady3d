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
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)

  const [staff, setStaff] = useState([
    { id: 1, name: 'Lady 3D (Lead Caterer)', role: 'Owner', branch: 'all', phone: '024 465 0474', active: true },
    { id: 2, name: 'Esi (Kitchen Supervisor)', role: 'Manager', branch: 'cug', phone: '053 129 9243', active: true },
    { id: 3, name: 'Kwame (Cashier & Counter)', role: 'Cashier', branch: 'sunyani', phone: '027 691 3089', active: true },
    { id: 4, name: 'Adwoa (Line Chef & Prep)', role: 'Kitchen Chef', branch: 'cug', phone: '053 129 9243', active: true }
  ])

  const [customers, setCustomers] = useState([
    { id: 1, name: 'Kofi Mensah', phone: '027 691 3089', branch: 'cug', ordersCount: 14, spent: 480, points: 48, status: 'VIP Member' },
    { id: 2, name: 'Ama Boateng', phone: '053 129 9243', branch: 'cug', ordersCount: 9, spent: 315, points: 31, status: 'Regular' },
    { id: 3, name: 'Yaw Manu', phone: '024 465 0474', branch: 'sunyani', ordersCount: 6, spent: 270, points: 27, status: 'Regular' },
    { id: 4, name: 'Julie Martin', phone: '024 123 4567', branch: 'cug', ordersCount: 4, spent: 160, points: 16, status: 'New Customer' },
    { id: 5, name: 'Efua Mensah', phone: '055 987 6543', branch: 'sunyani', ordersCount: 8, spent: 390, points: 39, status: 'Regular' }
  ])

  const [loyaltyRules, setLoyaltyRules] = useState({
    spendPerPoint: 10,
    rewardThreshold: 50,
    promoDiscount: 20
  })

  const [settings, setSettings] = useState({
    businessName: "Lady 3D's Catering Services",
    cugWhatsapp: '053 129 9243',
    sunyaniWhatsapp: '053 129 9243',
    cateringPhone: '024 465 0474',
    generalPhone: '027 691 3089',
    hours: 'Daily, 7:00 AM – 8:00 PM'
  })

  const [branchStatus, setBranchStatus] = useState({
    cug: { open: true, notice: 'Fiapre campus kitchen open! Fresh hot student & faculty lunch packs ready.', supervisor: 'Esi (Kitchen Supervisor)' },
    sunyani: { open: true, notice: 'Main branch kitchen open at Market Circle. Local & continental specials live.', supervisor: 'Kwame (Branch Manager)' }
  })

  useEffect(() => {
    const handler = e => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const installPwa = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    try {
      const res = await deferredPrompt.userChoice
      if (res?.outcome === 'accepted') {
        setCanInstall(false)
        setDeferredPrompt(null)
        say('Lady 3D App installed to home screen!')
      }
    } catch (err) {
      console.warn('Install error:', err)
    }
  }

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

  const add = (id, q = 1, selectedExtras = []) => {
    const extrasKey = (selectedExtras || []).map(x => x.id || x).sort().join(',')
    setCart(c => {
      const match = c.find(x => x.id === id && (x.extras || []).map(e => e.id || e).sort().join(',') === extrasKey)
      if (match) {
        return c.map(x => x === match ? { ...x, qty: x.qty + q } : x)
      }
      return [
        ...c,
        {
          lineId: `${id}-${extrasKey || 'plain'}-${Date.now()}`,
          id,
          qty: q,
          extras: selectedExtras || []
        }
      ]
    })
    say('Added to basket')
  }

  const setQty = (lineIdentifier, q) => setCart(c =>
    q < 1
      ? c.filter(x => (x.lineId || x.id) !== lineIdentifier && x.id !== lineIdentifier)
      : c.map(x => (x.lineId || x.id) === lineIdentifier || x.id === lineIdentifier ? { ...x, qty: q } : x)
  )

  const lines = cart.map((l, idx) => {
    const it = menu.find(m => m.id === l.id)
    if (!it) return null
    const extrasList = (l.extras || []).map(e => {
      if (typeof e === 'object' && e.name) return e
      return menu.find(m => m.id === e)
    }).filter(Boolean)
    const extrasTotal = extrasList.reduce((s, e) => s + (e.price || 0), 0)
    const unitPrice = price(it) + extrasTotal
    const lineTotal = unitPrice * l.qty
    return {
      ...l,
      lineId: l.lineId || `${l.id}-${idx}`,
      it,
      extrasList,
      unitPrice,
      lineTotal
    }
  }).filter(Boolean)

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0)
  
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
      items: lines.map(l => ({
        id: l.id,
        name: l.it.name,
        qty: l.qty,
        unitPrice: l.unitPrice,
        price: l.unitPrice,
        img: l.it.img,
        extras: (l.extrasList || []).map(e => ({ name: e.name, price: e.price }))
      })),
      subtotal,
      discount,
      deliveryFee,
      total,
      branch: branch || 'cug',
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
    place, orders, setOrders, setStatus, markPaid,
    branchStatus, setBranchStatus,
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
    deviceFrame, setDeviceFrame,
    canInstall, installPwa,
    staff, setStaff,
    customers, setCustomers,
    loyaltyRules, setLoyaltyRules,
    settings, setSettings
  }

  return <Ctx.Provider value={v}>{children}</Ctx.Provider>
}
