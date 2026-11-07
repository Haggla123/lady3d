import { createContext, useContext, useEffect, useState } from 'react'
import { MENU, REVIEWS, PROMO_CODES, priceAt } from './data.js'

const Ctx = createContext()
export const useApp = () => useContext(Ctx)
export const money = n => 'GH₵' + Number(n).toFixed(2).replace(/\.00$/, '')
export const api = async (path, options = {}) => {
  const base = import.meta.env.VITE_API_URL || ''
  const response = await fetch(`${base}/api${path}`, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...options.headers } })
  const data = response.status === 204 ? null : await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`)
  return data
}

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
  const [orders, setOrders] = useState([])
  
  // Customer sessions are verified by the API.
  const [user, setUser] = useState(null)
  
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
  const [role, setRole] = useState(null)
  const [activeFood, setActiveFood] = useState(null)
  const [deviceFrame, setDeviceFrame] = useState(false) // Toggle phone frame preview
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [canInstall, setCanInstall] = useState(false)
  const [staffUser, setStaffUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [momoEnabled, setMomoEnabled] = useState(false)

  useEffect(() => {
    let alive = true
    const initialize = async () => {
      try {
        const config = await api('/public/config')
        if (alive) setMomoEnabled(Boolean(config.momoEnabled))
        const bootstrap = await api('/public/bootstrap')
        if (alive && bootstrap.menu?.length) setMenu(bootstrap.menu)
        if (alive && bootstrap.reviews) setReviews(bootstrap.reviews)
        if (alive && bootstrap.promos?.length) setPromos(bootstrap.promos)
        if (alive && bootstrap.branches?.length) setBranchStatus(Object.fromEntries(bootstrap.branches.map(b => [b.id, b])))
      } catch (error) { console.error('Could not load public app data:', error.message) }
      try {
        const { user: session } = await api('/auth/me')
        if (!alive) return
        if (session.role === 'customer') {
          setUser(session)
          const { orders: mine } = await api('/my/orders')
          if (alive) setOrders(mine || [])
        }
        else {
          setStaffUser(session)
          setRole(session.role)
          const [{ orders: currentOrders }, { state }] = await Promise.all([api('/admin/orders'), api('/admin/state')])
          if (!alive) return
          setOrders(currentOrders || [])
          if (state.menu) setMenu(state.menu)
          if (state.cats) setCats(state.cats)
          if (state.branchStatus) setBranchStatus(state.branchStatus)
          if (state.promos) setPromos(state.promos)
          if (state.staff) setStaff(state.staff)
          if (state.customers) setCustomers(state.customers)
          if (state.loyaltyRules) setLoyaltyRules(state.loyaltyRules)
          if (state.settings) setSettings(state.settings)
          if (state.votes) setVotes(state.votes)
        }
      } catch { /* Public browsing is allowed; staff operations require a server session. */ }
      if (alive) setAuthReady(true)
    }
    initialize()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!authReady || !staffUser) return
    let active = true
    const refreshOrders = () => api('/admin/orders')
      .then(({ orders: currentOrders }) => { if (active) setOrders(currentOrders || []) })
      .catch(() => {})
    const timer = setInterval(refreshOrders, 15000)
    return () => { active = false; clearInterval(timer) }
  }, [authReady, staffUser])

  const [staff, setStaff] = useState([])

  const [customers, setCustomers] = useState([])

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
    api('/my/orders').then(({ orders: mine }) => setOrders(mine || [])).catch(() => {})
    say(`Welcome back, ${userData.name}!`)
  }

  const logoutUser = () => {
    setUser(null)
    setOrders([])
    api('/auth/logout', { method: 'POST' }).catch(() => {})
    say('You have been logged out.')
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

  const place = async f => {
    const result = await api('/orders', { method: 'POST', body: JSON.stringify({
      items: lines.map(l => ({ id: l.id, qty: l.qty, extras: (l.extrasList || []).map(e => e.id) })),
      branch: branch || 'cug', orderType, name: f.name, phone: f.phone, address: orderType === 'delivery' ? f.address : undefined,
      note: f.note, promoCode, pay: f.pay
    }) })
    setCart([])
    say(result.message || `Order ${result.order.ref} received.`)
    if (result.checkoutUrl) window.location.assign(result.checkoutUrl)
    setOrders(os => [result.order, ...os])
    if (f.pay === 'momo' && !result.checkoutUrl) go(`/track/${result.order.ref}`)
    return result.order.ref
  }

  const staffLogin = async (email, password) => {
    const { user: session } = await api('/auth/staff-login', { method: 'POST', body: JSON.stringify({ email, password }) })
    setStaffUser(session)
    setRole(session.role)
    const [{ orders: currentOrders }, { state }] = await Promise.all([api('/admin/orders'), api('/admin/state')])
    setOrders(currentOrders || [])
    if (state.menu) setMenu(state.menu)
    if (state.cats) setCats(state.cats)
    if (state.branchStatus) setBranchStatus(state.branchStatus)
    if (state.promos) setPromos(state.promos)
    if (state.staff) setStaff(state.staff)
    if (state.customers) setCustomers(state.customers)
    if (state.loyaltyRules) setLoyaltyRules(state.loyaltyRules)
    if (state.settings) setSettings(state.settings)
    if (state.votes) setVotes(state.votes)
    return session
  }
  const staffLogout = async () => { await api('/auth/logout', { method: 'POST' }); setStaffUser(null); setOrders([]) }
  const updateProfile = async profile => {
    const { user: account } = await api('/auth/profile', { method: 'PUT', body: JSON.stringify(profile) })
    setUser(account)
    return account
  }

  const persistState = (key, setter, current) => nextOrUpdater => {
    const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(current) : nextOrUpdater
    setter(next)
    if (staffUser) api(`/admin/state/${key}`, { method: 'PUT', body: JSON.stringify({ value: next }) }).catch(error => say(error.message))
  }
  const saveMenu = persistState('menu', setMenu, menu)
  const saveCats = persistState('cats', setCats, cats)
  const saveBranchStatus = persistState('branchStatus', setBranchStatus, branchStatus)
  const savePromos = persistState('promos', setPromos, promos)
  const saveStaff = persistState('staff', setStaff, staff)
  const saveCustomers = persistState('customers', setCustomers, customers)
  const saveLoyaltyRules = persistState('loyaltyRules', setLoyaltyRules, loyaltyRules)
  const saveSettings = persistState('settings', setSettings, settings)

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
    menu, setMenu: saveMenu,
    cats, setCats: saveCats,
    branch, setBranch,
    orderType, setOrderType,
    cart, add, setQty, lines,
    subtotal, discount, deliveryFee, total, count,
    price, ok,
    place, orders, setOrders,
    setStatus: (ref, s) => api(`/admin/orders/${ref}/status`, { method: 'PATCH', body: JSON.stringify({ status: s }) }).then(({ order }) => setOrders(os => os.map(o => o.ref === ref ? order : o))).catch(error => say(error.message)),
    markPaid: ref => api(`/admin/orders/${ref}/payment`, { method: 'PATCH' }).then(({ order }) => setOrders(os => os.map(o => o.ref === ref ? order : o))).catch(error => say(error.message)),
    branchStatus, setBranchStatus: saveBranchStatus,
    user, setUser, loginUser, logoutUser,
    favs, setFavs, toggleFav,
    points, setPoints,
    reviews, setReviews,
    votes, setVotes, voted, setVoted,
    toast, say,
    promos, setPromos: savePromos,
    promoCode, setPromoCode, promoError, applyPromo, removePromo,
    role, setRole,
    activeFood, setActiveFood,
    deviceFrame, setDeviceFrame,
    canInstall, installPwa,
    staff, setStaff: saveStaff,
    customers, setCustomers: saveCustomers,
    loyaltyRules, setLoyaltyRules: saveLoyaltyRules,
    settings, setSettings: saveSettings,
    staffUser, staffLogin, staffLogout, authReady, api, momoEnabled, updateProfile
  }

  return <Ctx.Provider value={v}>{children}</Ctx.Provider>
}
