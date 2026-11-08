import { useState, useEffect, useRef } from 'react'
import { api, money, useApp, go } from '../store.jsx'
import { Link, RefreshButton, LoadingSpinner } from '../components/ui.jsx'
import { BRANCHES, STATUSES, EXTRAS, buildOrderWhatsAppUrl } from '../data.js'
import { playKitchenChime } from './Admin.jsx'

// Sidebar SVG Icons
function BranchNavIcon({ name }) {
  const p = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }
  switch (name) {
    case 'overview':
      return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
    case 'orders':
      return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    case 'stock':
      return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    case 'pos':
      return <svg {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
    case 'staff':
      return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
    case 'drawer':
      return <svg {...p}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    case 'notice':
      return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    default:
      return <svg {...p}><circle cx="12" cy="12" r="10"/></svg>
  }
}

// Donut Chart for branch workflow
function BranchDonutChart({ data, total }) {
  const r = 52
  const c = 2 * Math.PI * r
  let accumulatedOffset = 0

  return (
    <div className="pbd-donut-wrap">
      <svg width="144" height="144" viewBox="0 0 144 144" className="pbd-donut-svg">
        <circle cx="72" cy="72" r={r} fill="transparent" stroke="#FEEBEB" strokeWidth="16" />
        {data.map((seg, idx) => {
          const pct = seg.val / (total || 1)
          const strokeDash = pct * c
          const dashOffset = -accumulatedOffset
          accumulatedOffset += strokeDash
          return (
            <circle
              key={idx}
              cx="72"
              cy="72"
              r={r}
              fill="transparent"
              stroke={seg.color}
              strokeWidth="16"
              strokeDasharray={`${strokeDash} ${c - strokeDash}`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 72 72)"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          )
        })}
      </svg>
      <div className="pbd-donut-center">
        <span className="pbd-donut-num">{total}</span>
      </div>
    </div>
  )
}

export default function BranchDashboard({ branchId = 'sunyani', section = 'overview' }) {
  // STRICT BRANCH ENFORCEMENT:
  // Normalize and strictly lock to the assigned branch.
  // When a user is at the Sunyani branch console, it is impossible to toggle or switch to CUG.
  // When at the CUG console, it is impossible to toggle or switch to Sunyani.
  const lockedBranchId = branchId === 'sunyani' ? 'sunyani' : 'cug'
  const currentBranch = BRANCHES.find(b => b.id === lockedBranchId) || BRANCHES[0]
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const {
    menu,
    setMenu,
    cats = ['Rice', 'Waakye', 'Banku & Fufu', 'Soups & Stews', 'Sides & Drinks'],
    orders,
    setOrders,
    setStatus,
    staff,
    setStaff,
    branchStatus,
    setBranchStatus,
    staffUser,
    staffLogout,
    say,
    refreshAllData,
    isNetworkBusy,
    api
  } = useApp()

  const [activeSection, setActiveSection] = useState(section || 'overview')
  const [kitchenFilter, setKitchenFilter] = useState('active')
  const [searchOrder, setSearchOrder] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Manager Meal Add / Edit state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMeal, setNewMeal] = useState({ name: '', price: '', cat: 'Local Dishes', desc: '', img: '' })
  const [editingMeal, setEditingMeal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [priceDrafts, setPriceDrafts] = useState({})

  const handleAddDish = async () => {
    if (!newMeal.name.trim() || !newMeal.price) return say('Name and price are required')
    setBusy(true)
    try {
      const payload = {
        name: newMeal.name.trim(),
        cat: newMeal.cat,
        price: +newMeal.price,
        desc: newMeal.desc.trim() || 'Authentic Ghanaian dish',
        img: newMeal.img.trim() || 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
        avail: { cug: true, sunyani: true },
        prices: { [lockedBranchId]: +newMeal.price }
      }
      const res = await api('/admin/menu', { method: 'POST', body: JSON.stringify(payload) })
      setMenu([res.item || { ...payload, id: Date.now() }, ...menu])
      setShowAddModal(false)
      setNewMeal({ name: '', price: '', cat: 'Local Dishes', desc: '', img: '' })
      say(`Dish "${payload.name}" added to menu!`)
    } catch (err) {
      say(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleSaveDishEdit = async () => {
    if (!editingMeal?.name?.trim() || !editingMeal?.price) return say('Name and price are required')
    setBusy(true)
    try {
      const updateData = {
        name: editingMeal.name.trim(),
        cat: editingMeal.cat,
        price: +editingMeal.price,
        desc: editingMeal.desc,
        img: editingMeal.img,
        prices: {
          ...(editingMeal.prices || {}),
          [lockedBranchId]: editingMeal.branchPrice !== '' && editingMeal.branchPrice !== undefined ? +editingMeal.branchPrice : +editingMeal.price
        }
      }
      await api('/admin/menu/' + editingMeal.id, { method: 'PUT', body: JSON.stringify(updateData) })
      setMenu(menu.map(m => m.id === editingMeal.id ? { ...m, ...updateData } : m))
      say(`Dish "${updateData.name}" updated!`)
      setEditingMeal(null)
    } catch (err) {
      say(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteDish = async (m) => {
    if (!confirm(`Delete "${m.name}" permanently from the menu catalogue?`)) return
    try {
      await api('/admin/menu/' + m.id, { method: 'DELETE' })
      setMenu(menu.filter(x => x.id !== m.id))
      say(`Dish "${m.name}" deleted from menu`)
    } catch (err) {
      say(err.message)
    }
  }

  // Walk-in POS state
  const [posMealId, setPosMealId] = useState(null)
  const [posQty, setPosQty] = useState(1)
  const [posExtras, setPosExtras] = useState([])
  const [posCustName, setPosCustName] = useState('')
  const [posCustPhone, setPosCustPhone] = useState('')
  const [posCustEmail, setPosCustEmail] = useState('')
  const [posLocation, setPosLocation] = useState('')
  const [posPayType, setPosPayType] = useState('cash')
  const [posSubmitting, setPosSubmitting] = useState(false)
  const [posIdempotencyKey, setPosIdempotencyKey] = useState(() => crypto.randomUUID())

  // New staff state for branch

  const currentBranchStatus = branchStatus?.[lockedBranchId] || {
    open: true,
    notice: lockedBranchId === 'sunyani' ? 'Market Circle main kitchen open for local & continental lunch specials!' : 'Fiapre campus kitchen open for student packs!',
    supervisor: lockedBranchId === 'sunyani' ? 'Kwame (Branch Manager)' : 'Esi (Kitchen Supervisor)'
  }

  // Filter orders STRICTLY for this branch only
  const branchOrders = orders.filter(o => o.branch === lockedBranchId)

  // Audio alert on new order for this branch
  const prevCount = useRef(branchOrders.length)
  useEffect(() => {
    if (branchOrders.length > prevCount.current) {
      if (soundEnabled) {
        playKitchenChime()
        say(`Ding-Dong! New incoming order for ${currentBranch.short}!`)
      }
    }
    prevCount.current = branchOrders.length
  }, [branchOrders.length, soundEnabled, currentBranch.short, say])

  // Statistics for this branch only
  const activeOrders = branchOrders.filter(o => o.status < 4)
  const completedOrders = branchOrders.filter(o => o.status === 4)
  const cookingOrders = branchOrders.filter(o => o.status === 2)
  const readyOrders = branchOrders.filter(o => o.status === 3)
  const newOrders = branchOrders.filter(o => o.status === 0)
  const confirmedOrders = branchOrders.filter(o => o.status === 1)
  const branchRevenue = completedOrders.filter(o => o.paid).reduce((sum, o) => sum + (o.total || 0), 0)
  const cashTotal = completedOrders.filter(o => o.pay === 'cash' && o.paid).reduce((sum, o) => sum + (o.total || 0), 0)
  const momoTotal = completedOrders.filter(o => o.pay === 'momo' && o.paid).reduce((sum, o) => sum + (o.total || 0), 0)

  // Meals for this branch
  const branchMeals = menu.filter(m => !m.avail || m.avail[lockedBranchId] !== false)

  // Staff assigned to this branch
  const branchStaffList = staff.filter(s => s.branch === lockedBranchId || s.branch === 'all')

  const handleLogout = () => {
    staffLogout().then(() => { say('Signed out from branch portal'); go('/staff-login') }).catch(error => say(error.message))
  }

  const toggleBranchOpen = async () => {
    const open = !currentBranchStatus.open
    try { await api(`/admin/branches/${lockedBranchId}/controls`, { method: 'PATCH', body: JSON.stringify({ open }) }) }
    catch (error) { return say(error.message) }
    const updated = {
      ...branchStatus,
      [lockedBranchId]: {
        ...currentBranchStatus,
        open
      }
    }
    setBranchStatus(updated)
    say(`${currentBranch.short} kitchen is now ${!currentBranchStatus.open ? 'OPEN & ACCEPTING ORDERS' : 'PAUSED / CLOSED'}`)
  }

  const saveBranchNotice = async (noticeText) => {
    try { await api(`/admin/branches/${lockedBranchId}/controls`, { method: 'PATCH', body: JSON.stringify({ notice: noticeText }) }) }
    catch (error) { return say(error.message) }
    const updated = {
      ...branchStatus,
      [lockedBranchId]: {
        ...currentBranchStatus,
        notice: noticeText
      }
    }
    setBranchStatus(updated)
    say('Branch announcement banner updated!')
  }

  const toggleDishStock = async (dishId) => {
    const meal = menu.find(item => item.id === dishId)
    const available = !(meal?.avail?.[lockedBranchId] !== false)
    try {
      await api(`/kitchen/availability/${dishId}?branch=${lockedBranchId}`, {
        method: 'PATCH', body: JSON.stringify({ status: available ? 'available' : 'sold_out' })
      })
      const avail = { [lockedBranchId]: available }
      await api(`/admin/menu/${dishId}`, { method: 'PUT', body: JSON.stringify({ avail }) })
    } catch (error) { return say(error.message) }
    setMenu(menu.map(m => {
      if (m.id === dishId) {
        const currentAvail = m.avail || { cug: true, sunyani: true }
        return {
          ...m,
          avail: {
            ...currentAvail,
            [lockedBranchId]: !currentAvail[lockedBranchId]
          }
        }
      }
      return m
    }))
    say('Dish stock availability updated for this branch')
  }

  const updateBranchPrice = async (dishId, newPrice) => {
    const meal = menu.find(item => item.id === dishId)
    const numericPrice = newPrice === '' ? meal?.price : Number(newPrice)
    if (!Number.isFinite(numericPrice) || numericPrice < 0) return say('Enter a valid price.')
    const prices = { [lockedBranchId]: numericPrice }
    try {
      await api(`/admin/menu/${dishId}`, { method: 'PUT', body: JSON.stringify({ prices }) })
      setPriceDrafts(current => { const next = { ...current }; delete next[dishId]; return next })
    }
    catch (error) { return say(error.message) }
    setMenu(menu.map(m => {
      if (m.id === dishId) {
        const prices = m.prices || {}
        return {
          ...m,
          prices: {
            ...prices,
          [lockedBranchId]: numericPrice
          }
        }
      }
      return m
    }))
  }

  // POS Walk-in submit
  const handlePosSubmit = async () => {
    if (posSubmitting) return
    const selectedMeal = branchMeals.find(m => m.id === posMealId) || branchMeals[0]
    if (!selectedMeal) return say('Please select a meal')
    if (!posCustName.trim()) return say('Please enter customer name or location')
    if (posPayType === 'momo' && !/^\S+@\S+\.\S+$/.test(posCustEmail)) return say('Enter the customer email to start Paystack checkout.')

    const mealPrice = selectedMeal.prices?.[lockedBranchId] ?? selectedMeal.price
    let newOrder
    setPosSubmitting(true)
    try {
      const result = await api('/orders', { method: 'POST', body: JSON.stringify({
        items: [{ id: selectedMeal.id, qty: posQty, extras: posExtras.map(extra => extra.id) }],
        branch: lockedBranchId, orderType: 'collection', collectionTime: 'ASAP',
        name: posCustName.trim(), phone: posCustPhone.trim() || '0000000000', email: posCustEmail || undefined,
        pay: posPayType, note: posLocation.trim() || undefined
      }), headers: { 'Idempotency-Key': posIdempotencyKey } })
      newOrder = result.order
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl)
        return
      }
      setOrders([newOrder, ...orders])
    } catch (error) { say(error.message); return }
    finally { setPosSubmitting(false) }
    playKitchenChime()
    say(`Walk-in order #${newOrder.ref} added to kitchen queue!`)

    setPosCustName('')
    setPosCustPhone('')
    setPosCustEmail('')
    setPosLocation('')
    setPosExtras([])
    setPosQty(1)
    setPosIdempotencyKey(crypto.randomUUID())
  }

  // Add staff member to this branch
  // Filtered orders for view
  const displayedOrders = branchOrders.filter(o => {
    let matchStatus = true
    if (kitchenFilter === 'active') matchStatus = o.status < 4
    else if (kitchenFilter === 'all') matchStatus = true
    else matchStatus = o.status === +kitchenFilter

    const q = searchOrder.toLowerCase().trim()
    const matchSearch = !q ||
      o.ref.toLowerCase().includes(q) ||
      o.name.toLowerCase().includes(q) ||
      (o.phone && o.phone.includes(q)) ||
      (o.address && o.address.toLowerCase().includes(q))

    return matchStatus && matchSearch
  })

  const getStatusBadge = (s) => {
    switch (s) {
      case 0: return { label: 'New / Received', cls: 'st-0' }
      case 1: return { label: 'Confirmed', cls: 'st-1' }
      case 2: return { label: 'Cooking on Stove', cls: 'st-2' }
      case 3: return { label: 'Ready for Pickup', cls: 'st-3' }
      case 4: return { label: 'Completed', cls: 'st-4' }
      default: return { label: 'Processing', cls: 'st-0' }
    }
  }

  const getNextLabel = (s) => {
    switch (s) {
      case 0: return 'Confirm Order →'
      case 1: return 'Start Cooking (Stove) →'
      case 2: return 'Mark Ready for Pickup →'
      case 3: return 'Mark Collected / Delivered ✓'
      default: return 'Completed'
    }
  }

  // Navigation Items for the Sidebar
  const BRANCH_NAV_ITEMS = [
    { key: 'overview', label: 'Branch Overview' },
    { key: 'orders', label: `Kitchen & Orders (${activeOrders.length})` },
    { key: 'stock', label: 'Daily Menu & Stock' },
    { key: 'pos', label: 'Walk-In Quick POS' },
    { key: 'staff', label: 'Branch Staff' },
    { key: 'drawer', label: 'Cash & Paystack Drawer' },
    { key: 'notice', label: 'Branch Notice Board' }
  ]

  // Donut data for branch
  const donutData = [
    { label: 'Ready for Pickup', val: readyOrders.length, color: '#22C55E' },
    { label: 'Cooking on Stove', val: cookingOrders.length, color: '#3B82F6' },
    { label: 'Confirmed / Queued', val: confirmedOrders.length, color: '#EAB308' },
    { label: 'New / Received', val: newOrders.length, color: '#80141B' },
  ]
  const totalTickets = branchOrders.length

  return (
    <div className="pbd-canvas-wrapper">
      <div className="pbd-dashboard-shell" style={{ gridTemplateColumns: sidebarOpen ? '240px minmax(0, 1fr)' : '1fr' }}>
        {/* Panel 1: Left Signature Red Sidebar */}
        {sidebarOpen && (
        <aside className="pbd-sidebar">
          {/* Official Lady 3D Logo Brand Header */}
          <div className="pbd-brand-header">
            <div className="pbd-brand-logo-circle">
              <img
                src="/lady3d-logo.jpg"
                alt="Lady 3D's Catering Services"
                className="pbd-logo-img"
              />
            </div>
            <div className="pbd-brand-text-block">
              <span className="pbd-brand-title-text">LADY 3D’S</span>
              <span className="pbd-brand-sub-text">
                {lockedBranchId === 'sunyani' ? 'SUNYANI MAIN' : 'CUG CAMPUS ANNEX'}
              </span>
            </div>
            <button
              type="button"
              className="pbd-sidebar-collapse-btn"
              onClick={() => setSidebarOpen(false)}
              title="Hide sidebar"
              aria-label="Hide sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <path d="M9 3v18"/>
                <path d="m16 15-3-3 3-3"/>
              </svg>
            </button>
          </div>

          {/* STRICT BRANCH LOCK INDICATOR (NO TOGGLE PERMITTED) */}
          <div className="branch-locked-card">
            <div className="branch-locked-pill">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <span>{currentBranch.short} (Locked)</span>
            </div>
            <p className="branch-locked-desc">
              Branch console is locked to {currentBranch.short}. Cross-branch switching is disabled for security.
            </p>
          </div>

          {/* Navigation Links with Red & White Theme */}
          <nav className="pbd-nav-list">
            {BRANCH_NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={`pbd-nav-item ${isActive ? 'active' : ''}`}
                  style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <span className="pbd-nav-icon">
                    <BranchNavIcon name={item.key} />
                  </span>
                  <span className="pbd-nav-label">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Bottom Profile Pill & Logout (Static in sidebar footer) */}
          <div className="pbd-sidebar-bottom">
            <div className="pbd-user-profile-pill">
              <div className="pbd-profile-avatar-wrap">
                <img
                  src="/lady3d-logo.jpg"
                  alt="Branch Staff"
                  className="pbd-profile-avatar"
                />
                <span className="pbd-green-dot" />
              </div>
              <div className="pbd-profile-info">
                <span className="pbd-user-name">
                  {lockedBranchId === 'sunyani' ? 'Kwame (Sunyani)' : 'Esi (CUG)'}
                </span>
                <span className="pbd-user-status">Online · Branch Supervisor</span>
              </div>
            </div>

            {/* Sidebar Actions Stack */}
            <div className="pbd-sidebar-actions-stack">
              <Link to="/admin/overview" className="pbd-back-customer-link">
                Master Admin Portal
              </Link>
              <Link to="/" className="pbd-back-customer-link">
                ← Customer App
              </Link>
              <button
                className="pbd-logout-btn"
                onClick={handleLogout}
                title="Log out of Branch Console"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Log Out
              </button>
            </div>
          </div>
        </aside>
        )}

        {/* Panel 2: Center Main Content (Static Header, Scrollable View) */}
        <main className="pbd-main-content">
          <header className="pbd-content-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {!sidebarOpen && (
                <button
                  type="button"
                  className="pbd-sidebar-reveal-btn"
                  onClick={() => setSidebarOpen(true)}
                  title="Reveal sidebar"
                  aria-label="Reveal sidebar"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <path d="M9 3v18"/>
                    <path d="m14 9 3 3-3 3"/>
                  </svg>
                  <span>Reveal Sidebar</span>
                </button>
              )}
              {sidebarOpen && (
                <button
                  type="button"
                  className="pbd-sidebar-toggle-ghost-btn"
                  onClick={() => setSidebarOpen(false)}
                  title="Hide sidebar"
                  aria-label="Hide sidebar"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <path d="M9 3v18"/>
                    <path d="m16 15-3-3 3-3"/>
                  </svg>
                </button>
              )}
              <div>
                <h1 className="pbd-page-heading">
                  {BRANCH_NAV_ITEMS.find(n => n.key === activeSection)?.label || 'Branch Console'}
                </h1>
              <span className="muted small">
                {currentBranch.name} · {currentBranch.address}
              </span>
            </div>
            </div>

            <div className="pbd-header-right">
              <RefreshButton onClick={refreshAllData} loading={isNetworkBusy} title="Refresh console data" />
              {/* Branch Locked Indicator Pill */}
              <div className="branch-header-lock-tag">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                <span>{currentBranch.short} Only</span>
              </div>

              <button
                className="btn-sound-small"
                onClick={() => {
                  playKitchenChime()
                  say('Ding-Dong! Kitchen chime tested')
                }}
              >
                Test Chime
              </button>

              <button
                className="pbd-header-logout-btn"
                onClick={handleLogout}
                title="Log out"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Log Out
              </button>
            </div>
          </header>

          <div className="pbd-view-container">
            {/* SECTION 1: BRANCH OVERVIEW */}
            {activeSection === 'overview' && (
              <div className="pbd-overview-canvas">
                {/* Hero Welcome Banner */}
                <div className="pbd-hero-banner" style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '20px', alignItems: 'center' }}>
                  <div className="pbd-hero-content">
                    <div className="row gap align-center mb-2">
                      <span className="branch-pill-tag">{currentBranch.badge}</span>
                      <span className={`branch-live-indicator ${currentBranchStatus.open ? 'open' : 'closed'}`}>
                        <span className="pulse-dot" />
                        {currentBranchStatus.open ? 'KITCHEN OPEN & ACCEPTING ORDERS' : 'PAUSED / CLOSED'}
                      </span>
                    </div>

                    <h2 className="pbd-hero-title">{currentBranch.name}</h2>
                    <p className="pbd-hero-desc">{currentBranch.tagline}</p>
                    <p className="small" style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 12px' }}>
                      {currentBranch.address} · WhatsApp Kitchen: <b>{currentBranch.whatsapp}</b>
                    </p>

                    <div className="pbd-hero-buttons">
                      <button
                        className="pbd-btn-hero-white"
                        onClick={toggleBranchOpen}
                      >
                        {currentBranchStatus.open ? 'Pause Kitchen Orders' : 'Open Kitchen'}
                      </button>
                      <button
                        className="pbd-btn-hero-white"
                        onClick={() => setActiveSection('orders')}
                      >
                        View Kitchen Tickets ({activeOrders.length}) →
                      </button>
                    </div>
                  </div>

                  <div className="branch-hero-photo-wrap">
                    <img
                      src={currentBranch.flyerImg}
                      alt={currentBranch.name}
                      className="branch-flyer-img"
                    />
                    <span className="photo-caption-tag">Official Branch Sign / Menu</span>
                  </div>
                </div>

                {/* 4 KPI Metric Cards */}
                <div className="pbd-kpi-row">
                  <div className="pbd-kpi-pill-card">
                    <div className="pbd-kpi-icon-tan">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    </div>
                    <div className="pbd-kpi-meta">
                      <b className="pbd-kpi-val">{activeOrders.length}</b>
                      <span className="pbd-kpi-tag">Active Kitchen Tickets</span>
                    </div>
                  </div>

                  <div className="pbd-kpi-pill-card">
                    <div className="pbd-kpi-icon-tan">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                    </div>
                    <div className="pbd-kpi-meta">
                      <b className="pbd-kpi-val">{money(branchRevenue)}</b>
                      <span className="pbd-kpi-tag">Today's Sales Collected</span>
                    </div>
                  </div>

                  <div className="pbd-kpi-pill-card">
                    <div className="pbd-kpi-icon-tan">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
                    </div>
                    <div className="pbd-kpi-meta">
                      <b className="pbd-kpi-val">{completedOrders.length}</b>
                      <span className="pbd-kpi-tag">Dispatched Plates</span>
                    </div>
                  </div>

                  <div className="pbd-kpi-pill-card">
                    <div className="pbd-kpi-icon-tan">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                    </div>
                    <div className="pbd-kpi-meta">
                      <b className="pbd-kpi-val">{branchStaffList.filter(s => s.active).length}</b>
                      <span className="pbd-kpi-tag">Staff On Shift</span>
                    </div>
                  </div>
                </div>

                {/* Workflow Donut & Breakdown Card */}
                <div className="pbd-executive-card">
                  <div className="pbd-card-head-row">
                    <h3 className="pbd-card-title">{currentBranch.short} Kitchen Workflow</h3>
                    <span className="pbd-card-subtitle">{totalTickets} orders processed today</span>
                  </div>

                  <div className="pbd-donut-progress-split">
                    <BranchDonutChart data={donutData} total={totalTickets} />

                    <div className="pbd-progress-rows-stack">
                      <div className="pbd-progress-row">
                        <div className="pbd-row-label">
                          <span className="pbd-color-dot green" />
                          <span className="pbd-lbl-name">Ready for Pickup</span>
                        </div>
                        <div className="pbd-bar-track">
                          <div className="pbd-bar-fill green" style={{ width: `${totalTickets ? Math.round((readyOrders.length / totalTickets) * 100) : 0}%` }} />
                        </div>
                        <b className="pbd-row-count">{readyOrders.length}</b>
                      </div>

                      <div className="pbd-progress-row">
                        <div className="pbd-row-label">
                          <span className="pbd-color-dot blue" />
                          <span className="pbd-lbl-name">Cooking on Stove</span>
                        </div>
                        <div className="pbd-bar-track">
                          <div className="pbd-bar-fill blue" style={{ width: `${totalTickets ? Math.round((cookingOrders.length / totalTickets) * 100) : 0}%` }} />
                        </div>
                        <b className="pbd-row-count">{cookingOrders.length}</b>
                      </div>

                      <div className="pbd-progress-row">
                        <div className="pbd-row-label">
                          <span className="pbd-color-dot yellow" />
                          <span className="pbd-lbl-name">Confirmed / Queued</span>
                        </div>
                        <div className="pbd-bar-track">
                          <div className="pbd-bar-fill yellow" style={{ width: `${totalTickets ? Math.round((confirmedOrders.length / totalTickets) * 100) : 0}%` }} />
                        </div>
                        <b className="pbd-row-count">{confirmedOrders.length}</b>
                      </div>

                      <div className="pbd-progress-row">
                        <div className="pbd-row-label">
                          <span className="pbd-color-dot red" />
                          <span className="pbd-lbl-name">New / Received</span>
                        </div>
                        <div className="pbd-bar-track">
                          <div className="pbd-bar-fill red" style={{ width: `${totalTickets ? Math.round((newOrders.length / totalTickets) * 100) : 0}%` }} />
                        </div>
                        <b className="pbd-row-count">{newOrders.length}</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: KITCHEN & ORDERS */}
            {activeSection === 'orders' && (
              <div className="pbd-orders-canvas">
                {/* Kitchen Control Bar */}
                <div className="pbd-sound-strip">
                  <div className="sound-strip-left">
                    <span className={`sound-ring-dot ${soundEnabled ? 'on' : 'off'}`} />
                    <span><b>{currentBranch.short} Chime:</b> {soundEnabled ? 'Active (Dual-tone ding-dong)' : 'Muted'}</span>
                  </div>
                  <div className="sound-strip-btns">
                    <button className="btn-sound-small" onClick={() => { playKitchenChime(); say('Testing chime...') }}>
                      Test Chime
                    </button>
                    <button className="btn-sound-small" onClick={() => setSoundEnabled(!soundEnabled)}>
                      {soundEnabled ? 'Mute' : 'Unmute'}
                    </button>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="pbd-filter-row">
                  <div className="pbd-branch-chips">
                    <button
                      className={`branch-chip-btn ${kitchenFilter === 'active' ? 'on' : ''}`}
                      onClick={() => setKitchenFilter('active')}
                    >
                      Active Tickets ({activeOrders.length})
                    </button>
                    <button
                      className={`branch-chip-btn ${kitchenFilter === '0' ? 'on' : ''}`}
                      onClick={() => setKitchenFilter('0')}
                    >
                      New ({newOrders.length})
                    </button>
                    <button
                      className={`branch-chip-btn ${kitchenFilter === '2' ? 'on' : ''}`}
                      onClick={() => setKitchenFilter('2')}
                    >
                      Cooking ({cookingOrders.length})
                    </button>
                    <button
                      className={`branch-chip-btn ${kitchenFilter === '3' ? 'on' : ''}`}
                      onClick={() => setKitchenFilter('3')}
                    >
                      Ready for Pickup ({readyOrders.length})
                    </button>
                    <button
                      className={`branch-chip-btn ${kitchenFilter === 'all' ? 'on' : ''}`}
                      onClick={() => setKitchenFilter('all')}
                    >
                      All ({branchOrders.length})
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Search ref #, customer, room..."
                    value={searchOrder}
                    onChange={e => setSearchOrder(e.target.value)}
                    className="pbd-search-input"
                  />
                </div>

                {/* Orders Grid */}
                <div className="pbd-orders-grid">
                  {displayedOrders.length === 0 ? (
                    <div className="branch-empty-box">
                      <p>No tickets currently match this filter for {currentBranch.short}.</p>
                    </div>
                  ) : (
                    displayedOrders.map(o => {
                      const st = getStatusBadge(o.status)
                      const dispatchUrl = buildOrderWhatsAppUrl(o)
                      const cleanPhone = (o.phone || '').replace(/\D/g, '')
                      const fullPhone = cleanPhone.startsWith('0') ? '233' + cleanPhone.slice(1) : cleanPhone
                      const custMsgUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(`Hello ${o.name}! Greetings from Lady 3D's Catering (${currentBranch.short}). Your order #${o.ref} is ${st.label.toLowerCase()}. Thank you!`)}`

                      return (
                        <div key={o.ref} className={`pbd-order-card status-border-${o.status}`}>
                          <div className="pbd-order-head">
                            <span className="pbd-order-ref">#{o.ref}</span>
                            <span className={`pbd-status-badge ${st.cls}`}>{st.label}</span>
                          </div>

                          <div className="pbd-order-customer-box">
                            <div className="cust-title-row">
                              <strong>{o.name}</strong>
                              <span className="cust-ph">{o.phone}</span>
                            </div>
                            {o.address && (
                              <div className="cust-addr">Location: <b>{o.address}</b></div>
                            )}
                            <div className="cust-quick-links">
                              <a href={custMsgUrl} target="_blank" rel="noopener noreferrer" className="btn-wa-link">
                                WhatsApp Customer
                              </a>
                              <a href={`tel:${o.phone}`} className="btn-call-link">Call</a>
                            </div>
                          </div>

                          <div className="pbd-items-box">
                            {(o.items || []).map((it, idx) => (
                              <div key={idx} className="pbd-dish-line">
                                <span><b>{it.qty}×</b> {it.name}</span>
                                <span>{money((it.price || it.unitPrice || 0) * it.qty)}</span>
                                {it.extras && it.extras.length > 0 && (
                                  <div className="pbd-extras-badges">
                                    {it.extras.map((ex, exIdx) => (
                                      <span key={exIdx} className="extra-pill">+ {ex.name}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="pbd-total-row">
                            <span>Total: <b>{money(o.total)}</b></span>
                            {o.paid ? (
                              <span className="paid-pill">Paid</span>
                            ) : o.pay === 'momo' ? (
                              <span className="unpaid-pill">Paystack confirmation pending</span>
                            ) : (
                              <span className="unpaid-pill">Cash</span>
                            )}
                          </div>

                          <div className="pbd-card-actions">
                            <a
                              href={dispatchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-pbd-dispatch"
                              title="Send receipt to branch kitchen via WhatsApp"
                            >
                              WhatsApp Kitchen
                            </a>
                            {o.orderStatus === 'pending_payment' ? (
                              <span className="unpaid-pill">Awaiting Paystack payment</span>
                            ) : o.status === 3 && o.orderType === 'delivery' ? (
                              <button className="btn-pbd-advance" onClick={() => go('/delivery')}>Open Delivery Desk →</button>
                            ) : o.status < 4 ? (
                              <button
                                className="btn-pbd-advance"
                                onClick={async () => {
                                  try {
                                    await setStatus(o.ref, o.status + 1)
                                    say(`Moved to ${STATUSES[o.status + 1]?.label || 'Next'}`)
                                  } catch { /* The provider already reports the server error. */ }
                                }}
                              >
                                {getNextLabel(o.status)}
                              </button>
                            ) : (
                              <span className="completed-tag">Completed</span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* SECTION 3: DAILY MENU & STOCK */}
            {activeSection === 'stock' && (
              <div className="pbd-white-card">
                <div className="pbd-card-head-row">
                  <div>
                    <h3>{currentBranch.short} Daily Menu, Prices & Stock Control</h3>
                    <p className="muted small">
                      Set {currentBranch.short} prices and daily stock. Catalogue changes are available to owners.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className="branch-pill-tag">{branchMeals.length} Dishes</span>
                    {staffUser?.role === 'Owner' && <button
                      onClick={() => setShowAddModal(true)}
                      style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                    >
                      + Add New Dish
                    </button>}
                  </div>
                </div>

                <div className="pbd-table-wrap mt-3">
                  <table className="pbd-table">
                    <thead>
                      <tr>
                        <th>Dish Photo</th>
                        <th>Meal Name & Description</th>
                        <th>Category</th>
                        <th>Base Price</th>
                        <th>{currentBranch.short} Price</th>
                        <th>Stock Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menu.map(m => {
                        const isSoldOut = m.avail && m.avail[lockedBranchId] === false
                        const branchPrice = m.prices?.[lockedBranchId] ?? ''

                        return (
                          <tr key={m.id} className={isSoldOut ? 'row-sold-out' : ''}>
                            <td>
                              <img
                                src={m.img || '/lady3d-logo.jpg'}
                                alt={m.name}
                                className="menu-thumb-pbd"
                                onError={e => { e.target.src = '/lady3d-logo.jpg' }}
                              />
                            </td>
                            <td>
                              <strong>{m.name}</strong>
                              <small className="muted block">{m.desc?.slice(0, 50)}...</small>
                            </td>
                            <td>
                              <span className="cat-badge-pbd">{m.cat}</span>
                            </td>
                            <td>{money(m.price)}</td>
                            <td>
                              <div className="inline-price-cell">
                                <span>GH₵</span>
                                <input
                                  type="number"
                                  placeholder={m.price}
                                  value={priceDrafts[m.id] ?? branchPrice}
                                  onChange={e => setPriceDrafts(current => ({ ...current, [m.id]: e.target.value }))}
                                  onBlur={e => { if ((e.target.value === '' && branchPrice !== '') || (e.target.value !== '' && Number(e.target.value) !== Number(branchPrice || m.price))) updateBranchPrice(m.id, e.target.value) }}
                                  className="pbd-mini-input"
                                  title="Leave empty to use base price"
                                />
                              </div>
                            </td>
                            <td>
                              <span className={`stock-status-tag ${isSoldOut ? 'sold-out' : 'in-stock'}`}>
                                {isSoldOut ? 'Sold Out Today' : 'In Stock / Ready'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className={`btn-stock-toggle ${isSoldOut ? 'btn-restock' : 'btn-mark-sold'}`}
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                  onClick={() => toggleDishStock(m.id)}
                                >
                                  {isSoldOut ? 'Restore' : 'Sold Out'}
                                </button>
                                {staffUser?.role === 'Owner' && <>
                                <button
                                  style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}
                                  onClick={() => setEditingMeal({
                                    ...m,
                                    branchPrice: m.prices?.[lockedBranchId] ?? m.price
                                  })}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn-del-sm"
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                  onClick={() => handleDeleteDish(m)}
                                >
                                  Delete
                                </button></>}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ADD MEAL MODAL */}
                {showAddModal && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
                        + Add New Dish to Menu
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Meal Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Fufu with Goat Light Soup"
                            value={newMeal.name}
                            onChange={e => setNewMeal({ ...newMeal, name: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Category</label>
                            <select
                              value={newMeal.cat}
                              onChange={e => setNewMeal({ ...newMeal, cat: e.target.value })}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                            >
                              {cats.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Price (GH₵) *</label>
                            <input
                              type="number"
                              placeholder="45"
                              value={newMeal.price}
                              onChange={e => setNewMeal({ ...newMeal, price: e.target.value })}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Photo URL (Optional)</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={newMeal.img}
                            onChange={e => setNewMeal({ ...newMeal, img: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Description</label>
                          <textarea
                            rows="2"
                            placeholder="Description..."
                            value={newMeal.desc}
                            onChange={e => setNewMeal({ ...newMeal, desc: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                        <button
                          onClick={() => setShowAddModal(false)}
                          style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          disabled={busy}
                          onClick={handleAddDish}
                          style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          {busy ? 'Saving...' : 'Add Dish'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* EDIT MEAL MODAL */}
                {editingMeal && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
                        Edit Dish · {editingMeal.name}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Meal Name</label>
                          <input
                            type="text"
                            value={editingMeal.name}
                            onChange={e => setEditingMeal({ ...editingMeal, name: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Category</label>
                            <select
                              value={editingMeal.cat}
                              onChange={e => setEditingMeal({ ...editingMeal, cat: e.target.value })}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                            >
                              {cats.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Base Price (GH₵)</label>
                            <input
                              type="number"
                              value={editingMeal.price}
                              onChange={e => setEditingMeal({ ...editingMeal, price: e.target.value })}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7' }}>
                            {currentBranch.short} Price (GH₵)
                          </label>
                          <input
                            type="number"
                            value={editingMeal.branchPrice ?? editingMeal.price}
                            onChange={e => setEditingMeal({ ...editingMeal, branchPrice: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1.5px solid #0284c7', marginTop: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Description</label>
                          <textarea
                            rows="2"
                            value={editingMeal.desc || ''}
                            onChange={e => setEditingMeal({ ...editingMeal, desc: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Photo URL</label>
                          <input
                            type="text"
                            value={editingMeal.img || ''}
                            onChange={e => setEditingMeal({ ...editingMeal, img: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                        <button
                          onClick={() => setEditingMeal(null)}
                          style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          disabled={busy}
                          onClick={handleSaveDishEdit}
                          style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          {busy ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: WALK-IN QUICK POS */}
            {activeSection === 'pos' && (
              <div className="pbd-white-card">
                <div className="pbd-card-head-row">
                  <div>
                    <h3>Branch Counter POS (Walk-In & Phone Orders)</h3>
                    <p className="muted small">
                      Punch in walk-in meals directly at the {currentBranch.short} counter.
                    </p>
                  </div>
                </div>

                <div className="branch-pos-grid mt-3">
                  <div className="pos-form-column">
                    <label>
                      <span className="field-label-small">Select Food Item *</span>
                      <select
                        value={posMealId || ''}
                        onChange={e => setPosMealId(+e.target.value)}
                        className="pbd-select full-width"
                      >
                        <option value="">-- Choose dish from {currentBranch.short} menu --</option>
                        {branchMeals.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({money(m.prices?.[lockedBranchId] ?? m.price)})
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="row gap mt-2">
                      <label className="flex-grow">
                        <span className="field-label-small">Quantity</span>
                        <input
                          type="number"
                          min="1"
                          value={posQty}
                          onChange={e => setPosQty(Math.max(1, +e.target.value))}
                          className="pbd-input full-width"
                        />
                      </label>

                      <label className="flex-grow">
                        <span className="field-label-small">Payment Method</span>
                        <select
                          value={posPayType}
                          onChange={e => setPosPayType(e.target.value)}
                          className="pbd-select full-width"
                        >
                          <option value="cash">Cash on Counter</option>
                          <option value="momo">Paystack (MoMo / Card)</option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-2">
                      <span className="field-label-small">Available Extras / Add-ons</span>
                      <div className="pos-extras-checklist">
                        {EXTRAS.map(ex => {
                          const checked = posExtras.some(e => e.id === ex.id)
                          return (
                            <label key={ex.id} className="pos-extra-label">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  if (checked) {
                                    setPosExtras(posExtras.filter(e => e.id !== ex.id))
                                  } else {
                                    setPosExtras([...posExtras, ex])
                                  }
                                }}
                              />
                              <span>{ex.name} (+{money(ex.price)})</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    <div className="row gap mt-2">
                      <label className="flex-grow">
                        <span className="field-label-small">Customer Name *</span>
                        <input
                          placeholder="e.g. Ama Mensah / Room 14"
                          value={posCustName}
                          onChange={e => setPosCustName(e.target.value)}
                          className="pbd-input full-width"
                        />
                      </label>

                      <label className="flex-grow">
                        <span className="field-label-small">Customer Phone (Optional)</span>
                        <input
                          placeholder="024 123 4567"
                          value={posCustPhone}
                          onChange={e => setPosCustPhone(e.target.value)}
                          className="pbd-input full-width"
                        />
                      </label>
                    </div>

                    {posPayType === 'momo' && <label className="mt-2 block">
                      <span className="field-label-small">Customer Email for Paystack Receipt *</span>
                      <input type="email" required placeholder="customer@example.com" value={posCustEmail} onChange={e => setPosCustEmail(e.target.value)} className="pbd-input full-width" />
                    </label>}

                    <label className="mt-2 block">
                      <span className="field-label-small">Collection note / table (Optional)</span>
                      <input
                        placeholder="e.g. Table 4 or customer pickup note"
                        value={posLocation}
                        onChange={e => setPosLocation(e.target.value)}
                        className="pbd-input full-width"
                      />
                    </label>

                    {posPayType === 'momo' && <label className="mt-2 block">
                      <span className="field-label-small">Customer email for Paystack checkout</span>
                      <input type="email" value={posCustEmail} onChange={e => setPosCustEmail(e.target.value)} className="pbd-input full-width" placeholder="customer@example.com" />
                    </label>}

                    <button className="btn-pos-submit mt-3" onClick={handlePosSubmit} disabled={posSubmitting}>
                      {posSubmitting ? <><span className="pbd-spinner-sm" style={{ marginRight: '8px' }} /> Submitting to Kitchen...</> : 'Dispatch Walk-In Order to Kitchen →'}
                    </button>
                  </div>

                  {/* Order Preview Ticket */}
                  <div className="pos-ticket-preview">
                    <h4>Order Ticket Preview</h4>
                    <div className="pos-ticket-paper">
                      <div className="paper-head">
                        <strong>LADY 3D’S CATERING</strong>
                        <span>{currentBranch.name}</span>
                        <small>Walk-In Slip</small>
                      </div>
                      <hr className="ticket-divider" />
                      <div className="paper-body">
                        <p><b>Customer:</b> {posCustName || 'Counter Guest'}</p>
                        <p><b>Collection:</b> {posLocation || 'Counter Pickup'}</p>
                        <p><b>Phone:</b> {posCustPhone || 'Walk-In'}</p>
                        <hr className="ticket-divider" />
                        {posMealId ? (
                          <div>
                            {(() => {
                              const m = branchMeals.find(x => x.id === posMealId)
                              const p = m ? (m.prices?.[lockedBranchId] ?? m.price) : 0
                              const extrasSum = posExtras.reduce((s, e) => s + e.price, 0)
                              const total = (p + extrasSum) * posQty
                              return (
                                <>
                                  <div className="paper-line">
                                    <span>{posQty}x {m?.name}</span>
                                    <b>{money(p * posQty)}</b>
                                  </div>
                                  {posExtras.map((e, i) => (
                                    <div key={i} className="paper-extra">
                                      <span>+ {e.name}</span>
                                      <span>{money(e.price)}</span>
                                    </div>
                                  ))}
                                  <hr className="ticket-divider" />
                                  <div className="paper-total">
                                    <span>Total:</span>
                                    <b>{money(total)}</b>
                                  </div>
                                  <span className="paper-pay">Payment: {posPayType === 'cash' ? 'Cash' : 'Paystack'}</span>
                                </>
                              )
                            })()}
                          </div>
                        ) : (
                          <p className="muted small">Select a meal from the menu to calculate bill.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: BRANCH STAFF ROSTER */}
            {activeSection === 'staff' && (
              <div className="pbd-white-card">
                <div className="pbd-card-head-row">
                  <div>
                    <h3>Staff Roster for {currentBranch.short}</h3>
                    <p className="muted small">
                      Team members assigned to this kitchen, on-duty shift status, and emergency communication.
                    </p>
                  </div>
                </div>

                <p className="muted small mt-2">Staff accounts and passwords are managed in Staff Management. This list shows saved accounts assigned to this branch.</p>

                <div className="branch-staff-grid mt-3">
                  {branchStaffList.map(s => {
                    const cleanPhone = (s.phone || '').replace(/\D/g, '')
                    const waUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '233' + cleanPhone.slice(1) : cleanPhone}`

                    return (
                      <div key={s.id} className="branch-staff-card">
                        <div className="staff-avatar-circle">
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="staff-meta">
                          <strong>{s.name}</strong>
                          <span className="role-tag-badge">{s.role}</span>
                          <span className="staff-ph">{s.phone}</span>
                        </div>
                        <div className="staff-duty-toggle">
                          <label className="pbd-switch">
                            <input
                              type="checkbox"
                              checked={s.active}
                              disabled={staffUser?.role !== 'Owner'}
                              onChange={async () => {
                                try {
                                  const { staff: updated } = await api(`/admin/staff/${s.id}`, { method: 'PATCH', body: JSON.stringify({ active: !s.active }) })
                                  setStaff(staff.map(x => x.id === s.id ? updated : x))
                                  say('Staff status saved')
                                } catch (error) { say(error.message) }
                              }}
                            />
                            <span className="pbd-slider" />
                          </label>
                          <span className={`duty-text ${s.active ? 'on' : 'off'}`}>
                            {s.active ? 'On Shift' : 'Off Duty'}
                          </span>
                        </div>
                        <div className="staff-actions-row">
                          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn-wa-link">
                            WhatsApp
                          </a>
                          <a href={`tel:${s.phone}`} className="btn-call-link">
                            Call
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* SECTION 6: CASH & PAYSTACK DRAWER */}
            {activeSection === 'drawer' && (
              <div className="pbd-white-card">
                <div className="pbd-card-head-row">
                  <div>
                    <h3>Cash Drawer & Paystack Ledger ({currentBranch.short})</h3>
                    <p className="muted small">
                      Physical cash in the branch drawer vs Mobile Money payments verified today.
                    </p>
                  </div>
                  <span className="chart-week-badge">Total Collected: {money(branchRevenue)}</span>
                </div>

                <div className="drawer-summary-cards mt-2">
                  <div className="drawer-card cash">
                    <span className="drawer-lbl">Physical Cash in Drawer</span>
                    <b className="drawer-val">{money(cashTotal)}</b>
                    <small>{completedOrders.filter(o => o.pay === 'cash').length} Cash Orders Dispatched</small>
                  </div>

                  <div className="drawer-card momo">
                    <span className="drawer-lbl">Mobile Money (MTN / Telecel)</span>
                    <b className="drawer-val">{money(momoTotal)}</b>
                    <small>{completedOrders.filter(o => o.pay === 'momo').length} Paystack Orders Verified</small>
                  </div>
                </div>

                <h4 className="mt-3 mb-2">Today's Transactions at {currentBranch.short}</h4>
                <div className="pbd-table-wrap">
                  <table className="pbd-table">
                    <thead>
                      <tr>
                        <th>Ref #</th>
                        <th>Customer</th>
                        <th>Time</th>
                        <th>Method</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchOrders.map(o => (
                        <tr key={o.ref}>
                          <td><b>#{o.ref}</b></td>
                          <td>{o.name} ({o.phone})</td>
                          <td>{o.time || '12:00'}</td>
                          <td>{o.pay === 'momo' ? 'Paystack' : 'Cash'}</td>
                          <td><b>{money(o.total)}</b></td>
                          <td>
                            <span className={`ticket-paid-tag ${o.paid ? 'paid' : 'unpaid'}`}>
                              {o.paid ? 'Paid & Verified' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 7: BRANCH NOTICE BOARD */}
            {activeSection === 'notice' && (
              <div className="pbd-white-card">
                <div className="pbd-card-head-row">
                  <div>
                    <h3>{currentBranch.short} Notice Board & Announcements</h3>
                    <p className="muted small">
                      Broadcast announcements specific to customers visiting {currentBranch.name}.
                    </p>
                  </div>
                </div>

                <div className="branch-notice-box mt-3">
                  <label>
                    <span className="field-label-small">Current Live Announcement for {currentBranch.short}</span>
                    <textarea
                      rows="3"
                      className="pbd-input full-width"
                      defaultValue={currentBranchStatus.notice}
                      id="branchNoticeInput"
                      placeholder="e.g. Fresh batch of steaming hot Banku & Tilapia ready! Free Sobolo for first 10 students."
                    />
                  </label>

                  <button
                    className="btn-pbd-action mt-2"
                    onClick={() => {
                      const val = document.getElementById('branchNoticeInput')?.value || ''
                      saveBranchNotice(val)
                    }}
                  >
                    Save & Broadcast Announcement
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        </div>
    </div>
  )
}
