import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { MENU, REVIEWS, PROMO_CODES, priceAt, DEFAULT_DELIVERY_ZONES, setActiveSettings } from '../../data.js'
import { api, subscribeApiActivity, isApiBusy, getAuthToken, setAuthToken } from '../../services/api/client.js'
import { money, setCurrencySymbol } from '../../utils/money.js'

const Ctx = createContext()
export const useApp = () => useContext(Ctx)
export { money, api }

const getRoutePath = () => {
  if (typeof window === 'undefined') return '/'
  if (window.location.hash) {
    let hashPath = window.location.hash.replace(/^#\/?/, '/')
    if (!hashPath.startsWith('/')) hashPath = '/' + hashPath
    if (hashPath.length > 1 && hashPath.endsWith('/')) {
      hashPath = hashPath.slice(0, -1)
    }
    window.history.replaceState(null, '', hashPath)
    return hashPath
  }
  let path = (window.location.pathname || '/') + (window.location.search || '')
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1)
    window.history.replaceState(null, '', path)
  }
  return path
}

export function useHash() {
  const [h, setH] = useState(getRoutePath)
  useEffect(() => {
    const f = () => {
      setH(getRoutePath())
      window.scrollTo(0, 0)
    }
    window.addEventListener('popstate', f)
    window.addEventListener('hashchange', f)
    return () => {
      window.removeEventListener('popstate', f)
      window.removeEventListener('hashchange', f)
    }
  }, [])
  return h
}

const getWeeklyVoteKey = () => {
  const monday = new Date()
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return `lady3d-vote-${monday.toISOString().slice(0, 10)}`
}

export const go = p => {
  const target = p.startsWith('/') ? p : '/' + p
  window.history.pushState(null, '', target)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

export function AppProvider({ children }) {
  const [menu, setMenu] = useState(MENU)
  const [cats, setCatsState] = useState(['Rice', 'Waakye', 'Banku & Fufu', 'Soups & Stews', 'Sides & Drinks'])
  const [customers, setCustomersState] = useState([])
  const [branch, setBranchState] = useState('cug') // default to CUG Annex
  const [orderType, setOrderType] = useState('collection') // 'collection' | 'delivery'
  const [deliveryZones, setDeliveryZones] = useState(DEFAULT_DELIVERY_ZONES)
  const [selectedZoneId, setSelectedZoneId] = useState('cug-halls')
  const [dailyStock, setDailyStock] = useState([])
  
  const [cart, setCart] = useState(() => {
    try {
      if (typeof window === 'undefined') return []
      const savedCart = JSON.parse(window.localStorage.getItem('lady3d_cart') || '[]')
      return Array.isArray(savedCart)
        ? savedCart.filter(line => line && Number.isInteger(line.id) && Number.isInteger(line.qty) && line.qty > 0)
          .map(line => ({ ...line, extras: Array.isArray(line.extras) ? line.extras : [] }))
        : []
    } catch {
      return []
    }
  })
  const [orders, setOrders] = useState([])
  
  // Customer session with persistent device storage
  const [user, setUser] = useState(() => {
    try {
      if (typeof window === 'undefined') return null
      const stored = window.localStorage.getItem('lady3d_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [favs, setFavs] = useState([1, 2])
  const [points, setPoints] = useState(0)
  const [reviews, setReviews] = useState(REVIEWS)
  const [votes, setVotes] = useState({ 'Waakye Special': 41, 'Jollof & Chicken': 37, 'Fufu & Light Soup': 18 })
  const [voted, setVoted] = useState(() => {
    try { return typeof window === 'undefined' ? null : window.localStorage.getItem(getWeeklyVoteKey()) } catch { return null }
  })
  const [toast, setToast] = useState('')
  const [promos, setPromos] = useState([
    ...Object.values(PROMO_CODES).map(promo => ({ ...promo, label: promo.label, bannerText: promo.label, enabled: true, on: true }))
  ])
  const [loyaltyRules, setLoyaltyRulesState] = useState({ spendPerPoint: 10, rewardThreshold: 50, promoDiscount: 20 })
  const [promoCode, setPromoCode] = useState('')
  const [promoError, setPromoError] = useState('')
  const [role, setRole] = useState(null)
  const [activeFood, setActiveFood] = useState(null)
  const [deviceFrame, setDeviceFrame] = useState(false)
  const [staffUser, setStaffUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [paystackEnabled, setPaystackEnabled] = useState(false)
  const [staff, setStaff] = useState([])
  const [isNetworkBusy, setIsNetworkBusy] = useState(isApiBusy)

  useEffect(() => {
    return subscribeApiActivity(busy => setIsNetworkBusy(busy))
  }, [])

  const refreshAllData = async () => {
    try {
      const bootstrap = await api('/public/bootstrap')
      if (bootstrap.menu?.length) setMenu(bootstrap.menu)
      if (bootstrap.reviews) setReviews(bootstrap.reviews)
      if (bootstrap.votes) setVotes(bootstrap.votes)
      if (Array.isArray(bootstrap.promos)) setPromos(bootstrap.promos)
      if (bootstrap.loyaltyRules) setLoyaltyRulesState(bootstrap.loyaltyRules)
      if (bootstrap.deliveryZones?.length) setDeliveryZones(bootstrap.deliveryZones)
      if (bootstrap.dailyStock?.length) setDailyStock(bootstrap.dailyStock)
      if (bootstrap.branches?.length) setBranchStatus(Object.fromEntries(bootstrap.branches.map(b => [b.id, b])))
      if (bootstrap.settings) {
        setSettingsState(prev => ({ ...prev, ...bootstrap.settings }))
        if (bootstrap.settings.currency) setCurrencySymbol(bootstrap.settings.currency)
        setActiveSettings(bootstrap.settings)
      }
      if (staffUser && staffUser.role !== 'customer') {
        const [{ orders: currentOrders }, { state }] = await Promise.all([
          api('/admin/orders').catch(() => ({ orders: [] })),
          api('/admin/state').catch(() => ({ state: {} }))
        ])
        if (currentOrders) setOrders(currentOrders)
        if (state?.menu) setMenu(state.menu)
        if (state?.cats) setCatsState(state.cats)
        if (Array.isArray(state?.customers)) setCustomersState(state.customers)
        if (state?.settings) setSettingsState(prev => ({ ...prev, ...state.settings }))
      } else {
        const [{ menu: remoteMenu }, sessionRes] = await Promise.all([
          api('/menu').catch(() => ({ menu: null })),
          api('/auth/me').catch(() => ({ user: null }))
        ])
        if (Array.isArray(remoteMenu)) setMenu(remoteMenu)
        if (sessionRes?.user) {
          setUser(sessionRes.user)
          try {
            if (typeof window !== 'undefined') window.localStorage.setItem('lady3d_user', JSON.stringify(sessionRes.user))
          } catch {}
          setPoints(sessionRes.user.loyaltyPoints || 0)
          const { orders: mine } = await api('/my/orders').catch(() => ({ orders: [] }))
          if (mine) setOrders(mine)
        } else if (!getAuthToken()) {
          setUser(null)
          try {
            if (typeof window !== 'undefined') window.localStorage.removeItem('lady3d_user')
          } catch {}
        }
      }
      return true
    } catch {
      return false
    }
  }

  const defaultSettings = {
    businessName: "Lady 3D's Catering Services",
    cugWhatsapp: "053 129 9243",
    sunyaniWhatsapp: "053 129 9243",
    cateringPhone: "024 465 0474",
    generalPhone: "027 691 3089",
    hours: "Mon - Sat: 8:00 AM - 9:00 PM | Sun: 12:00 PM - 8:00 PM",
    currency: "GH₵",
    cugAddress: "Fiapre Campus, Catholic University of Ghana, Sunyani",
    sunyaniAddress: "Market Circle / Main Road, Sunyani",
    supportEmail: "info@lady3d.com",
    orderNotificationSound: true
  }

  const [settings, setSettingsState] = useState(defaultSettings)

  useEffect(() => {
    setCurrencySymbol(settings.currency)
    setActiveSettings(settings)
  }, [settings])

  const setBranch = next => {
    const nextBranch = typeof next === 'function' ? next(branch) : next
    setBranchState(nextBranch)
    const matchingZone = deliveryZones.find(zone => zone.branchId === nextBranch && zone.active)
    if (matchingZone) setSelectedZoneId(matchingZone.id)
  }

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('lady3d_cart', JSON.stringify(cart))
    } catch {
      // Keep the in-memory basket usable when browser storage is unavailable.
    }
  }, [cart])

  const setCats = async next => {
    const updated = typeof next === 'function' ? next(cats) : next
    const { value } = await api('/admin/state/cats', { method: 'PUT', body: JSON.stringify({ value: updated }) })
    setCatsState(value)
    return value
  }

  const loadCustomers = async () => {
    try {
      const res = await api('/admin/customers')
      if (Array.isArray(res?.customers)) {
        setCustomersState(res.customers)
        return res.customers
      }
    } catch { /* Fallback to current state */ }
    return customers
  }

  const setCustomers = async next => {
    const updated = typeof next === 'function' ? next(customers) : next
    setCustomersState(updated)
    try {
      const { value } = await api('/admin/state/customers', { method: 'PUT', body: JSON.stringify({ value: updated }) })
      if (Array.isArray(value)) setCustomersState(value)
      return value
    } catch {
      return updated
    }
  }

  const castVote = async option => {
    if (voted) return
    const { votes: updated } = await api('/votes', { method: 'POST', body: JSON.stringify({ option }) })
    setVotes(updated)
    setVoted(option)
    try { if (typeof window !== 'undefined') window.localStorage.setItem(getWeeklyVoteKey(), option) } catch { /* Server vote is already accepted. */ }
    return updated
  }

  const setSettings = async newSettings => {
    const previousSettings = settings
    await api('/admin/state/settings', { method: 'PUT', body: JSON.stringify({ value: newSettings }) })
    setSettingsState(currentSettings => Object.fromEntries(
      Object.keys({ ...currentSettings, ...newSettings }).map(key => [
        key,
        currentSettings[key] === previousSettings[key] ? newSettings[key] ?? currentSettings[key] : currentSettings[key]
      ])
    ))
    return newSettings
  }

  const [branchStatus, setBranchStatus] = useState({
    cug: { open: true, notice: 'Campus Annex open 7am-8pm', supervisor: 'Mrs. Cynthia Boakye' },
    sunyani: { open: true, notice: 'Town branch open daily', supervisor: 'Mr. Ernest Kwaku' }
  })

  const toastTimerRef = useRef(null)

  const say = (input, options = {}) => {
    let rawMessage = ''
    let explicitTitle = options.title
    let explicitType = options.type
    let actionLabel = options.actionLabel || ''
    let actionPath = options.actionPath || ''

    if (typeof input === 'string') {
      rawMessage = input
    } else if (input instanceof Error) {
      rawMessage = input.message || 'An unexpected error occurred'
      if (!explicitType) explicitType = 'error'
      if (!explicitTitle) explicitTitle = 'Error'
    } else if (typeof input === 'object' && input !== null) {
      rawMessage = input.message || input.error || ''
      if (input.title) explicitTitle = input.title
      if (input.type) explicitType = input.type
      if (input.actionLabel) actionLabel = input.actionLabel
      if (input.actionPath) actionPath = input.actionPath
    } else {
      rawMessage = String(input || '')
    }

    const lower = rawMessage.toLowerCase()
    const isError = explicitType === 'error' ||
                    (input instanceof Error) ||
                    lower.includes('fail') ||
                    lower.includes('error') || 
                    lower.includes('invalid') ||
                    lower.includes('cannot') ||
                    lower.includes('restricted') ||
                    lower.includes('incorrect') ||
                    lower.includes('wrong') ||
                    lower.includes('denied') ||
                    lower.includes('unauthorized') ||
                    lower.includes('not found') ||
                    lower.includes('required') ||
                    lower.includes('already exists') ||
                    lower.includes('too many') ||
                    lower.includes('could not') ||
                    lower.includes('unable') ||
                    lower.includes('expired') ||
                    lower.includes('not match') ||
                    lower.includes('disabled') ||
                    lower.includes('please ')
    const isBasket = lower.includes('basket') || lower.includes('cart')
    
    const computedType = explicitType || (isError ? 'error' : isBasket ? 'basket' : 'success')
    const computedTitle = explicitTitle || (isError ? 'Error' : isBasket ? 'Added to Basket' : 'Success')

    const payload = {
      id: Date.now() + Math.random(),
      title: computedTitle,
      message: rawMessage,
      type: computedType,
      actionLabel: actionLabel || (computedType === 'basket' ? 'View Basket' : ''),
      actionPath: actionPath || (computedType === 'basket' ? '/cart' : '')
    }

    setToast(payload)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
    }, options.duration || 4500)
  }

  const dismissToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(null)
  }

  // Load public bootstrap data and session
  useEffect(() => {
    let alive = true
    const initialize = async () => {
      try {
        const config = await api('/public/config')
        if (alive) setPaystackEnabled(Boolean(config.paystackEnabled))
        const bootstrap = await api('/public/bootstrap')
        if (alive) {
          if (bootstrap.menu?.length) setMenu(bootstrap.menu)
          if (bootstrap.reviews) setReviews(bootstrap.reviews)
          if (bootstrap.votes) setVotes(bootstrap.votes)
          if (Array.isArray(bootstrap.promos)) setPromos(bootstrap.promos)
          if (bootstrap.loyaltyRules) setLoyaltyRulesState(bootstrap.loyaltyRules)
          if (bootstrap.deliveryZones?.length) setDeliveryZones(bootstrap.deliveryZones)
          if (bootstrap.dailyStock?.length) setDailyStock(bootstrap.dailyStock)
          if (bootstrap.branches?.length) {
            setBranchStatus(Object.fromEntries(bootstrap.branches.map(b => [b.id, b])))
          }
          if (bootstrap.settings) {
            setSettingsState(prev => ({ ...prev, ...bootstrap.settings }))
            if (bootstrap.settings.currency) setCurrencySymbol(bootstrap.settings.currency)
            setActiveSettings(bootstrap.settings)
          }
        }
      } catch (error) {
        console.debug('Could not load public bootstrap:', error.message)
      }

      try {
        const { user: session } = await api('/auth/me')
        if (!alive) return
        if (session.role === 'customer') {
          setUser(session)
          if (session.branch === 'cug' || session.branch === 'sunyani') setBranch(session.branch)
          setPoints(session.loyaltyPoints || 0)
          const { orders: mine } = await api('/my/orders')
          if (alive) setOrders(mine || [])
        } else {
          setStaffUser(session)
          setUser(session)
          setRole(session.role)
          const [{ orders: currentOrders }, { state }] = await Promise.all([
            api('/admin/orders'),
            api('/admin/state')
          ])
          if (!alive) return
          setOrders(currentOrders || [])
          if (['Owner', 'Manager'].includes(session.role)) {
            const { staff: currentStaff } = await api('/admin/staff')
            if (alive) setStaff(currentStaff || [])
          }
          if (state.menu) setMenu(state.menu)
          if (state.cats) setCatsState(state.cats)
          if (Array.isArray(state.customers)) setCustomersState(state.customers)
          if (state.loyaltyRules) setLoyaltyRulesState(state.loyaltyRules)
          if (state.settings) setSettingsState(prev => ({ ...prev, ...state.settings }))
        }
      } catch {
        /* Anonymous visitor */
      } finally {
        if (alive) setAuthReady(true)
      }
    }
    initialize()
    return () => { alive = false }
  }, [])

  // Keep operational screens current without requiring a manual refresh.
  useEffect(() => {
    if (!staffUser || staffUser.role === 'customer') return
    const refresh = async () => {
      try {
        const { orders: currentOrders } = await api('/admin/orders')
        setOrders(currentOrders || [])
      } catch { /* Session may have expired; the next API action will show it. */ }
    }
    const timer = window.setInterval(refresh, 10000)
    return () => window.clearInterval(timer)
  }, [staffUser])

  const loginUser = (userData, token) => {
    setUser(userData)
    if (token) setAuthToken(token)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lady3d_user', JSON.stringify(userData))
      }
    } catch {}
    if (userData.role === 'customer' && (userData.branch === 'cug' || userData.branch === 'sunyani')) {
      setBranch(userData.branch)
    }
    setPoints(userData.loyaltyPoints || 0)
    if (userData.role && userData.role !== 'customer') {
      setStaffUser(userData)
      setRole(userData.role)
    }
    api('/my/orders').then(({ orders: mine }) => setOrders(mine || [])).catch(() => {})
    say(`Welcome back, ${userData.name}!`)
  }

  const updateProfile = async profile => {
    const { user: updated } = await api('/auth/profile', { method: 'PUT', body: JSON.stringify(profile) })
    setUser(updated)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lady3d_user', JSON.stringify(updated))
      }
    } catch {}
    if (updated.branch === 'cug' || updated.branch === 'sunyani') setBranch(updated.branch)
    setPoints(updated.loyaltyPoints || 0)
    return updated
  }

  const logoutUser = () => {
    setUser(null)
    setPoints(0)
    setPromoCode('')
    setPromoError('')
    setStaffUser(null)
    setRole('customer')
    setOrders([])
    setAuthToken(null)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('lady3d_user')
      }
    } catch {}
    api('/auth/logout', { method: 'POST' }).catch(() => {})
    say('You have been logged out.')
  }

  // Claim past guest orders for verified registered phone
  const claimGuestOrders = async () => {
    try {
      const res = await api('/my/claim-guest-orders', { method: 'POST' })
      const { orders: mine } = await api('/my/orders')
      setOrders(mine || [])
      say(`Successfully claimed ${res.claimedCount || 0} past orders!`)
      return res.claimedCount
    } catch (err) {
      say(err.message)
    }
  }

  const price = it => priceAt(it, branch || 'cug')
  const ok = it => {
    if (!branch) return true
    if (it.avail && it.avail[branch] === false) return false
    // Also check daily stock portions
    const stock = dailyStock.find(s => s.branchId === branch && s.mealId === it.id)
    if (stock && stock.status !== 'available') return false
    return true
  }

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

    const meal = (menu || []).find(m => m.id === id)
    const mealName = meal?.name || 'Item'
    say({
      title: 'Added to Basket',
      message: `${q > 1 ? q + 'x ' : ''}${mealName} added to basket successfully.`,
      type: 'basket',
      actionLabel: 'View Basket',
      actionPath: '/cart'
    })
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
  const activePromo = promoCode && promos.find(promo => promo.code?.toUpperCase() === promoCode.toUpperCase() && promo.enabled !== false)
  const discountRate = activePromo ? activePromo.discount : 0
  const discount = Math.round(subtotal * discountRate * 100) / 100

  // Calculate delivery fee from selected zone
  const activeZone = deliveryZones.find(z => z.id === selectedZoneId && z.branchId === branch) || deliveryZones[0]
  const deliveryFee = orderType === 'delivery' && subtotal > 0 ? (activeZone?.fee ?? 5) : 0
  const total = Math.max(0, subtotal - discount + deliveryFee)
  const count = cart.reduce((s, l) => s + l.qty, 0)

  const applyPromo = code => {
    const clean = (code || '').trim().toUpperCase()
    if (!clean) {
      setPromoCode('')
      setPromoError('')
      return
    }
    if (clean === 'WELCOME20' && (!user || user.welcomeVoucherUsed)) {
      const message = !user ? 'Create an account or sign in to use the welcome voucher.' : 'Your account has already used the welcome voucher.'
      setPromoError(message)
      say(message)
      if (!user) go('/signup')
      return
    }
    const promo = promos.find(item => item.code?.toUpperCase() === clean && item.enabled !== false)
    if (promo) {
      setPromoCode(clean)
      setPromoError('')
      say(`Promo ${clean} applied! (-${promo.discount * 100}%)`)
    } else {
      setPromoError('Invalid or unavailable promo code')
      say('Invalid voucher code')
    }
  }

  const setLoyaltyRules = async rules => {
    await api('/admin/state/loyaltyRules', { method: 'PUT', body: JSON.stringify({ value: rules }) })
    if (Number.isFinite(rules.promoDiscount)) {
      const welcomePromo = promos.find(promo => promo.code?.toUpperCase() === 'WELCOME20')
      const targetId = welcomePromo ? (welcomePromo.id || welcomePromo._id || 'WELCOME20') : 'WELCOME20'
      const { promo } = await api(`/admin/promos/${targetId}`, {
        method: 'PATCH',
        body: JSON.stringify({ discount: Math.min(0.8, Math.max(0, rules.promoDiscount / 100)) })
      })
      if (promo) {
        setPromos(rows => rows.map(row => (row.id === promo.id || row._id === promo._id || row.code?.toUpperCase() === 'WELCOME20') ? { ...row, ...promo, id: promo.id || promo._id } : row))
      }
    }
    setLoyaltyRulesState(rules)
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

  // Place order with fulfillment separation and stock verification
  const place = async f => {
    const result = await api('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: lines.map(l => ({ id: l.id, qty: l.qty, extras: (l.extrasList || []).map(e => e.id) })),
        branch: branch || 'cug',
        orderType: orderType === 'delivery' ? 'delivery' : 'collection',
        name: f.name,
        phone: f.phone,
        email: f.email,
        deliveryZoneId: orderType === 'delivery' ? selectedZoneId : undefined,
        address: orderType === 'delivery' ? f.address : undefined,
        collectionTime: orderType === 'collection' ? (f.collectionTime || 'ASAP') : undefined,
        instructions: f.instructions || '',
        note: f.note,
        promoCode,
        pay: f.pay
      }),
      headers: f.pay === 'momo' ? { 'Idempotency-Key': f.idempotencyKey || crypto.randomUUID() } : undefined
    })

    if (promoCode?.toUpperCase() === 'WELCOME20' && user) setUser(current => current ? { ...current, welcomeVoucherUsed: true } : current)
    setPromoCode('')
    setPromoError('')
    setCart([])
    if (result.checkoutUrl) {
      say('Complete your Paystack payment to place the order.')
      window.location.assign(result.checkoutUrl)
    } else {
      say(result.message || `Order ${result.order.ref} confirmed!`)
      setOrders(os => [result.order, ...os])
      go(`/order-success/${result.order.ref}`)
    }
    return result.order.ref
  }

  const setStatus = async (ref, nextStatus) => {
    const order = orders.find(item => item.ref === ref)
    if (!order) throw new Error('Order is no longer in the dashboard. Refresh and try again.')
    const actionByStatus = { 2: 'start_cooking', 3: 'mark_ready', 4: 'complete_pickup' }
    const action = actionByStatus[nextStatus]
    if (!action) throw new Error('This order cannot be moved to that status.')
    if (order.orderType === 'delivery' && nextStatus === 4) {
      throw new Error('Delivery orders are completed from the Delivery dashboard.')
    }
    try {
      const { order: updated } = await api(`/kitchen/orders/${ref}/status`, {
        method: 'PATCH', body: JSON.stringify({ action })
      })
      setOrders(rows => rows.map(row => row.ref === ref ? updated : row))
      return updated
    } catch (error) { say(error.message); throw error }
  }

  const markPaid = async ref => {
    const order = orders.find(item => item.ref === ref)
    if (!order || order.pay !== 'cash') throw new Error('Online payments are confirmed by Paystack automatically.')
    const { order: updated } = await api(`/admin/orders/${ref}/status`, {
      method: 'PATCH', body: JSON.stringify({ paymentStatus: 'paid' })
    })
    setOrders(rows => rows.map(row => row.ref === ref ? updated : row))
    return updated
  }

  const staffLogin = async (email, password) => {
    const { user: session, token } = await api('/auth/staff-login', { method: 'POST', body: JSON.stringify({ email, password }) })
    if (token) setAuthToken(token)
    setStaffUser(session)
    setUser(session)
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('lady3d_user', JSON.stringify(session))
    } catch {}
    setPoints(session.loyaltyPoints || 0)
    setRole(session.role)
    const [{ orders: currentOrders }, { state }] = await Promise.all([
      api('/admin/orders'),
      api('/admin/state')
    ])
    setOrders(currentOrders || [])
    if (['Owner', 'Manager'].includes(session.role)) {
      const { staff: currentStaff } = await api('/admin/staff')
      setStaff(currentStaff || [])
    }
    if (state.menu) setMenu(state.menu)
    if (state.cats) setCatsState(state.cats)
    if (Array.isArray(state.customers)) setCustomersState(state.customers)
    if (state.settings) setSettingsState(prev => ({ ...prev, ...state.settings }))
    return session
  }

  const staffLogout = async () => {
    setAuthToken(null)
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem('lady3d_user')
    } catch {}
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    setStaffUser(null)
    setUser(null)
    setPoints(0)
    setRole('customer')
    setOrders([])
  }

  const v = {
    menu, setMenu,
    cats, setCats,
    customers, setCustomers, loadCustomers, setCustomersState,
    branch, setBranch,
    orderType, setOrderType,
    deliveryZones, setDeliveryZones,
    selectedZoneId, setSelectedZoneId,
    activeZone,
    dailyStock, setDailyStock,
    cart, add, setQty, lines,
    subtotal, discount, deliveryFee, total, count,
    price, ok,
    place, orders, setOrders,
    branchStatus, setBranchStatus,
    user, setUser, loginUser, logoutUser, updateProfile, claimGuestOrders,
    favs, setFavs, toggleFav,
    points, setPoints,
    reviews, setReviews,
    votes, setVotes, voted, setVoted, castVote,
    toast, say, dismissToast,
    promos, setPromos,
    loyaltyRules, setLoyaltyRules,
    promoCode, setPromoCode, promoError, applyPromo, removePromo,
    role, setRole,
    activeFood, setActiveFood,
    deviceFrame, setDeviceFrame,
    staffUser, staffLogin, staffLogout, authReady, api, paystackEnabled,
    setStatus, markPaid, staff, setStaff,
    settings, setSettings,
    isNetworkBusy, refreshAllData
  }

  return <Ctx.Provider value={v}>{children}</Ctx.Provider>
}
