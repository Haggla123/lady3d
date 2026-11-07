import { createContext, useContext, useEffect, useState } from 'react'
import { MENU, REVIEWS, PROMO_CODES, priceAt, DEFAULT_DELIVERY_ZONES } from '../../data.js'
import { api } from '../../services/api/client.js'
import { money } from '../../utils/money.js'

const Ctx = createContext()
export const useApp = () => useContext(Ctx)
export { money, api }

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
  const [branch, setBranch] = useState('cug') // default to CUG Annex
  const [orderType, setOrderType] = useState('delivery') // 'collection' | 'delivery'
  const [deliveryZones, setDeliveryZones] = useState(DEFAULT_DELIVERY_ZONES)
  const [selectedZoneId, setSelectedZoneId] = useState('cug-halls')
  const [dailyStock, setDailyStock] = useState([])
  
  const [cart, setCart] = useState([])
  const [orders, setOrders] = useState([])
  
  // Customer session
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
  const [deviceFrame, setDeviceFrame] = useState(false)
  const [staffUser, setStaffUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [momoEnabled, setMomoEnabled] = useState(false)

  const [branchStatus, setBranchStatus] = useState({
    cug: { open: true, notice: 'Campus Annex open 7am-8pm', supervisor: 'Mrs. Cynthia Boakye' },
    sunyani: { open: true, notice: 'Town branch open daily', supervisor: 'Mr. Ernest Kwaku' }
  })

  const say = text => {
    setToast(text)
    setTimeout(() => setToast(''), 4000)
  }

  // Load public bootstrap data and session
  useEffect(() => {
    let alive = true
    const initialize = async () => {
      try {
        const config = await api('/public/config')
        if (alive) setMomoEnabled(Boolean(config.momoEnabled))
        const bootstrap = await api('/public/bootstrap')
        if (alive) {
          if (bootstrap.menu?.length) setMenu(bootstrap.menu)
          if (bootstrap.reviews) setReviews(bootstrap.reviews)
          if (bootstrap.promos?.length) setPromos(bootstrap.promos)
          if (bootstrap.deliveryZones?.length) setDeliveryZones(bootstrap.deliveryZones)
          if (bootstrap.dailyStock?.length) setDailyStock(bootstrap.dailyStock)
          if (bootstrap.branches?.length) {
            setBranchStatus(Object.fromEntries(bootstrap.branches.map(b => [b.id, b])))
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
          const { orders: mine } = await api('/my/orders')
          if (alive) setOrders(mine || [])
        } else {
          setStaffUser(session)
          setRole(session.role)
          const [{ orders: currentOrders }, { state }] = await Promise.all([
            api('/admin/orders'),
            api('/admin/state')
          ])
          if (!alive) return
          setOrders(currentOrders || [])
          if (state.menu) setMenu(state.menu)
          if (state.cats) setCats(state.cats)
          if (state.branchStatus) setBranchStatus(state.branchStatus)
          if (state.promos) setPromos(state.promos)
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
        deliveryZoneId: orderType === 'delivery' ? selectedZoneId : undefined,
        address: orderType === 'delivery' ? f.address : undefined,
        collectionTime: orderType === 'collection' ? (f.collectionTime || 'ASAP') : undefined,
        instructions: f.instructions || '',
        note: f.note,
        promoCode,
        pay: f.pay
      })
    })

    setCart([])
    say(result.message || `Order ${result.order.ref} confirmed!`)
    if (result.checkoutUrl) {
      window.location.assign(result.checkoutUrl)
    } else {
      setOrders(os => [result.order, ...os])
      go(`/order-success/${result.order.ref}`)
    }
    return result.order.ref
  }

  const staffLogin = async (email, password) => {
    const { user: session } = await api('/auth/staff-login', { method: 'POST', body: JSON.stringify({ email, password }) })
    setStaffUser(session)
    setRole(session.role)
    const [{ orders: currentOrders }, { state }] = await Promise.all([
      api('/admin/orders'),
      api('/admin/state')
    ])
    setOrders(currentOrders || [])
    if (state.menu) setMenu(state.menu)
    if (state.cats) setCats(state.cats)
    if (state.branchStatus) setBranchStatus(state.branchStatus)
    return session
  }

  const staffLogout = async () => {
    await api('/auth/logout', { method: 'POST' })
    setStaffUser(null)
    setOrders([])
  }

  const v = {
    menu, setMenu,
    cats, setCats,
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
    user, setUser, loginUser, logoutUser, claimGuestOrders,
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
    staffUser, staffLogin, staffLogout, authReady, api, momoEnabled
  }

  return <Ctx.Provider value={v}>{children}</Ctx.Provider>
}
