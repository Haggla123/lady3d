import { useState, useEffect, useRef } from 'react'
import { money, useApp, go } from '../store.jsx'
import { Link } from '../components/ui.jsx'
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

  const {
    menu,
    setMenu,
    orders,
    setOrders,
    setStatus,
    markPaid,
    staff,
    setStaff,
    branchStatus,
    setBranchStatus,
    logoutUser,
    say
  } = useApp()

  const [activeSection, setActiveSection] = useState(section || 'overview')
  const [kitchenFilter, setKitchenFilter] = useState('active')
  const [searchOrder, setSearchOrder] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Walk-in POS state
  const [posMealId, setPosMealId] = useState(null)
  const [posQty, setPosQty] = useState(1)
  const [posExtras, setPosExtras] = useState([])
  const [posCustName, setPosCustName] = useState('')
  const [posCustPhone, setPosCustPhone] = useState('')
  const [posLocation, setPosLocation] = useState('')
  const [posPayType, setPosPayType] = useState('cash')

  // New staff state for branch
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffRole, setNewStaffRole] = useState('Kitchen Chef')
  const [newStaffPhone, setNewStaffPhone] = useState('')

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
  const branchRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const cashTotal = completedOrders.filter(o => o.pay === 'cash').reduce((sum, o) => sum + (o.total || 0), 0)
  const momoTotal = completedOrders.filter(o => o.pay === 'momo').reduce((sum, o) => sum + (o.total || 0), 0)

  // Meals for this branch
  const branchMeals = menu.filter(m => !m.avail || m.avail[lockedBranchId] !== false)

  // Staff assigned to this branch
  const branchStaffList = staff.filter(s => s.branch === lockedBranchId || s.branch === 'all')

  const handleLogout = () => {
    logoutUser()
    say('Signed out from branch portal')
    go('/login')
  }

  const toggleBranchOpen = () => {
    const updated = {
      ...branchStatus,
      [lockedBranchId]: {
        ...currentBranchStatus,
        open: !currentBranchStatus.open
      }
    }
    setBranchStatus(updated)
    say(`${currentBranch.short} kitchen is now ${!currentBranchStatus.open ? 'OPEN & ACCEPTING ORDERS' : 'PAUSED / CLOSED'}`)
  }

  const saveBranchNotice = (noticeText) => {
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

  const toggleDishStock = (dishId) => {
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

  const updateBranchPrice = (dishId, newPrice) => {
    setMenu(menu.map(m => {
      if (m.id === dishId) {
        const prices = m.prices || {}
        return {
          ...m,
          prices: {
            ...prices,
            [lockedBranchId]: newPrice === '' ? undefined : +newPrice
          }
        }
      }
      return m
    }))
  }

  // POS Walk-in submit
  const handlePosSubmit = () => {
    const selectedMeal = branchMeals.find(m => m.id === posMealId) || branchMeals[0]
    if (!selectedMeal) return say('Please select a meal')
    if (!posCustName.trim()) return say('Please enter customer name or location')

    const mealPrice = selectedMeal.prices?.[lockedBranchId] ?? selectedMeal.price
    const extrasTotal = posExtras.reduce((sum, e) => sum + e.price, 0)
    const lineTotal = (mealPrice * posQty) + extrasTotal

    const newOrder = {
      ref: `POS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      name: posCustName.trim(),
      phone: posCustPhone.trim() || 'Counter Walk-In',
      address: posLocation.trim() || `${currentBranch.short} Counter Pickup`,
      branch: lockedBranchId,
      orderType: posLocation.trim() ? 'delivery' : 'pickup',
      items: [
        {
          id: selectedMeal.id,
          name: selectedMeal.name,
          qty: posQty,
          price: mealPrice,
          extras: posExtras
        }
      ],
      total: lineTotal,
      pay: posPayType,
      paid: posPayType === 'cash',
      status: 1, // Confirmed
      time: new Date().toTimeString().slice(0, 5)
    }

    setOrders([newOrder, ...orders])
    playKitchenChime()
    say(`Walk-in order #${newOrder.ref} added to kitchen queue!`)

    setPosCustName('')
    setPosCustPhone('')
    setPosLocation('')
    setPosExtras([])
    setPosQty(1)
  }

  // Add staff member to this branch
  const handleAddBranchStaff = () => {
    if (!newStaffName.trim() || !newStaffPhone.trim()) return say('Enter staff name and phone number')
    const added = {
      id: Date.now(),
      name: newStaffName.trim(),
      role: newStaffRole,
      branch: lockedBranchId,
      phone: newStaffPhone.trim(),
      active: true
    }
    setStaff([...staff, added])
    setNewStaffName('')
    setNewStaffPhone('')
    say(`Staff "${added.name}" added to ${currentBranch.short}!`)
  }

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
    { key: 'drawer', label: 'Cash & MoMo Drawer' },
    { key: 'notice', label: 'Branch Notice Board' }
  ]

  // Donut data for branch
  const donutData = [
    { label: 'Ready for Pickup', val: readyOrders.length || 2, color: '#22C55E' },
    { label: 'Cooking on Stove', val: cookingOrders.length || 3, color: '#3B82F6' },
    { label: 'Confirmed / Queued', val: confirmedOrders.length || 1, color: '#EAB308' },
    { label: 'New / Received', val: newOrders.length || 1, color: '#80141B' },
  ]
  const totalTickets = branchOrders.length || 7

  return (
    <div className="pbd-canvas-wrapper">
      <div className="pbd-dashboard-shell">
        {/* Panel 1: Left Signature Red Sidebar (Static / Fixed - Just like Admin) */}
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

        {/* Panel 2: Center Main Content (Static Header, Scrollable View) */}
        <main className="pbd-main-content">
          <header className="pbd-content-header">
            <div>
              <h1 className="pbd-page-heading">
                {BRANCH_NAV_ITEMS.find(n => n.key === activeSection)?.label || 'Branch Console'}
              </h1>
              <span className="muted small">
                {currentBranch.name} · {currentBranch.address}
              </span>
            </div>

            <div className="pbd-header-right">
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
                      📍 {currentBranch.address} · WhatsApp Kitchen: <b>{currentBranch.whatsapp}</b>
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
                          <div className="pbd-bar-fill green" style={{ width: `${Math.round(((readyOrders.length || 2) / totalTickets) * 100)}%` }} />
                        </div>
                        <b className="pbd-row-count">{readyOrders.length}</b>
                      </div>

                      <div className="pbd-progress-row">
                        <div className="pbd-row-label">
                          <span className="pbd-color-dot blue" />
                          <span className="pbd-lbl-name">Cooking on Stove</span>
                        </div>
                        <div className="pbd-bar-track">
                          <div className="pbd-bar-fill blue" style={{ width: `${Math.round(((cookingOrders.length || 3) / totalTickets) * 100)}%` }} />
                        </div>
                        <b className="pbd-row-count">{cookingOrders.length}</b>
                      </div>

                      <div className="pbd-progress-row">
                        <div className="pbd-row-label">
                          <span className="pbd-color-dot yellow" />
                          <span className="pbd-lbl-name">Confirmed / Queued</span>
                        </div>
                        <div className="pbd-bar-track">
                          <div className="pbd-bar-fill yellow" style={{ width: `${Math.round(((confirmedOrders.length || 1) / totalTickets) * 100)}%` }} />
                        </div>
                        <b className="pbd-row-count">{confirmedOrders.length}</b>
                      </div>

                      <div className="pbd-progress-row">
                        <div className="pbd-row-label">
                          <span className="pbd-color-dot red" />
                          <span className="pbd-lbl-name">New / Received</span>
                        </div>
                        <div className="pbd-bar-track">
                          <div className="pbd-bar-fill red" style={{ width: `${Math.round(((newOrders.length || 1) / totalTickets) * 100)}%` }} />
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
                              <div className="cust-addr">📍 Location: <b>{o.address}</b></div>
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
                              <button
                                className="btn-momo-pay"
                                onClick={() => {
                                  markPaid(o.ref)
                                  say(`Order #${o.ref} marked MoMo Paid`)
                                }}
                              >
                                Confirm MoMo
                              </button>
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
                            {o.status < 4 ? (
                              <button
                                className="btn-pbd-advance"
                                onClick={() => {
                                  setStatus(o.ref, o.status + 1)
                                  say(`Moved to ${STATUSES[o.status + 1]?.label || 'Next'}`)
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
                    <h3>{currentBranch.short} Daily Menu & Stock Control</h3>
                    <p className="muted small">
                      Mark dishes In Stock or Sold Out for {currentBranch.short}. Set custom branch prices.
                    </p>
                  </div>
                  <span className="branch-pill-tag">{branchMeals.length} Dishes Available</span>
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
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchMeals.map(m => {
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
                                  value={branchPrice}
                                  onChange={e => updateBranchPrice(m.id, e.target.value)}
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
                              <button
                                className={`btn-stock-toggle ${isSoldOut ? 'btn-restock' : 'btn-mark-sold'}`}
                                onClick={() => toggleDishStock(m.id)}
                              >
                                {isSoldOut ? 'Mark In Stock' : 'Mark Sold Out'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
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
                          <option value="momo">MTN / Telecel MoMo</option>
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

                    <label className="mt-2 block">
                      <span className="field-label-small">Delivery Location / Table (Optional)</span>
                      <input
                        placeholder="e.g. Hall 2 Annex Room 14 (or leave blank for Counter Pickup)"
                        value={posLocation}
                        onChange={e => setPosLocation(e.target.value)}
                        className="pbd-input full-width"
                      />
                    </label>

                    <button className="btn-pos-submit mt-3" onClick={handlePosSubmit}>
                      Dispatch Walk-In Order to Kitchen →
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
                        <p><b>Location:</b> {posLocation || 'Counter Pickup'}</p>
                        <p><b>Phone:</b> {posCustPhone || 'Walk-In'}</p>
                        <hr className="ticket-divider" />
                        {posMealId ? (
                          <div>
                            {(() => {
                              const m = branchMeals.find(x => x.id === posMealId)
                              const p = m ? (m.prices?.[lockedBranchId] ?? m.price) : 0
                              const extrasSum = posExtras.reduce((s, e) => s + e.price, 0)
                              const total = (p * posQty) + extrasSum
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
                                  <span className="paper-pay">Payment: {posPayType === 'cash' ? 'Cash' : 'MoMo'}</span>
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

                <div className="branch-add-staff-strip mt-2">
                  <input
                    placeholder="Staff Member Name"
                    value={newStaffName}
                    onChange={e => setNewStaffName(e.target.value)}
                    className="pbd-input"
                  />
                  <select
                    value={newStaffRole}
                    onChange={e => setNewStaffRole(e.target.value)}
                    className="pbd-select"
                  >
                    <option value="Kitchen Chef">Kitchen Chef</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Manager">Kitchen Supervisor</option>
                    <option value="Delivery Rider">Delivery Rider</option>
                  </select>
                  <input
                    placeholder="Phone (024 123 4567)"
                    value={newStaffPhone}
                    onChange={e => setNewStaffPhone(e.target.value)}
                    className="pbd-input"
                  />
                  <button className="btn-pbd-action" onClick={handleAddBranchStaff}>
                    + Assign to {currentBranch.short}
                  </button>
                </div>

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
                              onChange={() => {
                                setStaff(staff.map(x => x.id === s.id ? { ...x, active: !x.active } : x))
                                say(`Staff status updated`)
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

            {/* SECTION 6: CASH & MOMO DRAWER */}
            {activeSection === 'drawer' && (
              <div className="pbd-white-card">
                <div className="pbd-card-head-row">
                  <div>
                    <h3>Cash Drawer & MoMo Ledger ({currentBranch.short})</h3>
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
                    <small>{completedOrders.filter(o => o.pay === 'momo').length} MoMo Orders Verified</small>
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
                          <td>{o.pay === 'momo' ? 'Mobile Money (MoMo)' : 'Cash'}</td>
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

        {/* Panel 3: Right Activity Panel (Feed Tailored strictly to this branch) */}
        <aside className="pbd-activity-panel">
          <div className="pbd-activity-header">
            <h3 className="pbd-activity-title">{currentBranch.short} Feed</h3>
            <span className="muted small">Live kitchen dispatch feed</span>
          </div>

          <div className="pbd-activity-section">
            <div className="pbd-subhead-row">
              <span className="pbd-subhead-title">
                {lockedBranchId === 'sunyani' ? 'Market Circle pickups' : 'Campus deliveries'}
              </span>
              <button
                onClick={() => setActiveSection('orders')}
                className="pbd-view-all"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View all
              </button>
            </div>

            {lockedBranchId === 'sunyani' ? (
              <>
                <div className="pbd-activity-card">
                  <div className="pbd-date-box">
                    <span className="pbd-date-num">1</span>
                    <span className="pbd-date-mo">TODAY</span>
                  </div>
                  <div className="pbd-act-meta">
                    <h4 className="pbd-act-title">Banku & Tilapia Pack</h4>
                    <span className="pbd-act-time">Market Circle Counter Pickup</span>
                  </div>
                </div>

                <div className="pbd-activity-card">
                  <div className="pbd-date-box">
                    <span className="pbd-date-num">2</span>
                    <span className="pbd-date-mo">TODAY</span>
                  </div>
                  <div className="pbd-act-meta">
                    <h4 className="pbd-act-title">Fufu & Goat Light Soup</h4>
                    <span className="pbd-act-time">Takeaway Pack · Sunyani Town</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="pbd-activity-card">
                  <div className="pbd-date-box">
                    <span className="pbd-date-num">1</span>
                    <span className="pbd-date-mo">TODAY</span>
                  </div>
                  <div className="pbd-act-meta">
                    <h4 className="pbd-act-title">Waakye with Egg & Wele</h4>
                    <span className="pbd-act-time">Hall 2 Annex Room 14 (CUG)</span>
                  </div>
                </div>

                <div className="pbd-activity-card">
                  <div className="pbd-date-box">
                    <span className="pbd-date-num">2</span>
                    <span className="pbd-date-mo">TODAY</span>
                  </div>
                  <div className="pbd-act-meta">
                    <h4 className="pbd-act-title">Fried Rice & Chicken Pack</h4>
                    <span className="pbd-act-time">Faculty Room 4 (Fiapre Campus)</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="pbd-activity-section">
            <div className="pbd-subhead-row">
              <span className="pbd-subhead-title">Latest Payments ({currentBranch.short})</span>
            </div>

            <div className="pbd-shoutout-card">
              <div className="pbd-avatar-wrap">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" alt="Customer" className="pbd-avatar-img" />
                <span className="pbd-green-dot" />
              </div>
              <div className="pbd-shout-meta">
                <strong>{lockedBranchId === 'sunyani' ? 'Yaw Manu' : 'Kofi Mensah'}</strong>
                <p>Paid GH₵ {lockedBranchId === 'sunyani' ? '45 via MoMo' : '60 via MoMo'}</p>
              </div>
            </div>

            <div className="pbd-shoutout-card">
              <div className="pbd-avatar-wrap">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" alt="Customer" className="pbd-avatar-img" />
                <span className="pbd-green-dot" />
              </div>
              <div className="pbd-shout-meta">
                <strong>{lockedBranchId === 'sunyani' ? 'Julie Martin' : 'Ama Boateng'}</strong>
                <p>Paid Cash on Counter</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
