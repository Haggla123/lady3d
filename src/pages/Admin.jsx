import { useState, useEffect, useRef } from 'react'
import { money, useApp, go } from '../store.jsx'
import { Link, LoadingSpinner } from '../components/ui.jsx'
import { ADMIN_NAV, BRANCHES, ROLES, STATUSES, getBranchWhatsApp, buildOrderWhatsAppUrl } from '../data.js'
import BranchDashboard from './BranchDashboard.jsx'
import DeliveryDashboard from './delivery/DeliveryDashboard.jsx'
import KitchenDashboard from './kitchen/KitchenDashboard.jsx'

// Synthesized dual-tone restaurant kitchen chime using Web Audio API
export function playKitchenChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    // Tone 1: High crisp ding (587.33 Hz - D5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)
    gain1.gain.setValueAtTime(0.28, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.35)

    // Tone 2: Warm resonant dong (880 Hz - A5)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(880, now + 0.12)
    gain2.gain.setValueAtTime(0.32, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.65)
  } catch (e) {
    console.warn('Audio chime notice:', e)
  }
}

const getStatusObj = s => STATUSES[s] || { label: 'Received', desc: '', step: '1' }
const bn = id => BRANCHES.find(b => b.id === id)?.short || 'Sunyani Main'
const branchObj = id => BRANCHES.find(b => b.id === id) || BRANCHES[0]

// Sidebar SVG Icons
function NavIcon({ name }) {
  const p = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }
  switch (name) {
    case 'overview':
      return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
    case 'orders':
      return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    case 'branch-dashboards':
      return <svg {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
    case 'menu':
      return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    case 'categories':
      return <svg {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>
    case 'branches':
      return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    case 'customers':
      return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
    case 'loyalty':
      return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    case 'promos':
      return <svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
    case 'payments':
      return <svg {...p}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    case 'analytics':
      return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    case 'reviews':
      return <svg {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
    case 'staff':
      return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    case 'delivery':
      return <svg {...p}><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
    case 'inventory':
      return <svg {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
    case 'settings':
      return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    default:
      return <svg {...p}><circle cx="12" cy="12" r="10"/></svg>
  }
}

// Modern Table wrapper
const Table = ({ head, rows }) => (
  <div className="pbd-table-wrap">
    <table className="pbd-table">
      <thead>
        <tr>{head.map(h => <th key={h}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => <td key={j}>{c}</td>)}
            </tr>
          ))
        ) : (
          <tr><td colSpan={head.length} className="tbl-empty">No records found.</td></tr>
        )}
      </tbody>
    </table>
  </div>
)

// Interactive Donut Chart Component
function DonutChart({ data, total }) {
  const r = 54
  const c = 2 * Math.PI * r
  let accumulatedOffset = 0

  return (
    <div className="pbd-donut-wrap">
      <svg width="150" height="150" viewBox="0 0 150 150" className="pbd-donut-svg">
        <circle cx="75" cy="75" r={r} fill="transparent" stroke="#FEEBEB" strokeWidth="18" />
        {data.map((seg, idx) => {
          const pct = seg.val / (total || 1)
          const strokeDash = pct * c
          const dashOffset = -accumulatedOffset
          accumulatedOffset += strokeDash
          return (
            <circle
              key={idx}
              cx="75"
              cy="75"
              r={r}
              fill="transparent"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${strokeDash} ${c - strokeDash}`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 75 75)"
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

// 1. Overview Dashboard
function Overview() {
  const { orders, say } = useApp()
  const act = orders.filter(o => o.status < 4)
  const cooking = orders.filter(o => o.status === 2)
  const ready = orders.filter(o => o.status === 3)
  const newOrders = orders.filter(o => o.status === 0)
  const confirmed = orders.filter(o => o.status === 1)
  const rev = orders.filter(o => o.status === 4 && o.paid).reduce((s, o) => s + o.total, 0)
  const totalMeals = orders.length

  // Donut data with signature brand colors
  const donutData = [
    { label: 'Ready for Pickup', val: ready.length, color: '#22C55E' },
    { label: 'Cooking on Stove', val: cooking.length, color: '#3B82F6' },
    { label: 'Confirmed / Queued', val: confirmed.length, color: '#EAB308' },
    { label: 'New / Received', val: newOrders.length, color: '#80141B' },
  ]

  return (
    <div className="pbd-overview-canvas">
      {/* Hero Welcome Banner (Signature Lady 3D Red) */}
      <div className="pbd-hero-banner">
        <div className="pbd-hero-content">
          <h2 className="pbd-hero-title">Welcome back, Lady 3D!</h2>
          <p className="pbd-hero-desc">
            Catholic University & Sunyani Main kitchens are live with {act.length} active orders awaiting or in preparation.
          </p>
          <div className="pbd-hero-buttons">
            <Link to="/admin/orders" className="pbd-btn-hero-white">
              View Active Orders →
            </Link>
            <button
              className="pbd-btn-hero-white"
              onClick={() => {
                playKitchenChime()
                say('Ding-Dong! Kitchen bell chime tested')
              }}
            >
              Test Kitchen Chime
            </button>
          </div>
        </div>

        <div className="pbd-hero-avatar-frame">
          <img
            src="/lady3d-logo.jpg"
            alt="Lady 3D Lead"
            className="pbd-hero-avatar-img"
          />
        </div>
      </div>

      {/* Row of 4 KPI Metric Cards */}
      <div className="pbd-kpi-row">
        <div className="pbd-kpi-pill-card">
          <div className="pbd-kpi-icon-tan">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          </div>
          <div className="pbd-kpi-meta">
            <b className="pbd-kpi-val">{act.length}</b>
            <span className="pbd-kpi-tag">Active Orders</span>
          </div>
        </div>

        <div className="pbd-kpi-pill-card">
          <div className="pbd-kpi-icon-tan">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          </div>
          <div className="pbd-kpi-meta">
            <b className="pbd-kpi-val">{totalMeals}</b>
            <span className="pbd-kpi-tag">Orders Loaded</span>
          </div>
        </div>

        <div className="pbd-kpi-pill-card">
          <div className="pbd-kpi-icon-tan">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
          </div>
          <div className="pbd-kpi-meta">
            <b className="pbd-kpi-val">{orders.filter(o => o.status === 4).length}</b>
            <span className="pbd-kpi-tag">Completed</span>
          </div>
        </div>

        <div className="pbd-kpi-pill-card">
          <div className="pbd-kpi-icon-tan">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
          </div>
          <div className="pbd-kpi-meta">
            <b className="pbd-kpi-val">{money(rev)}</b>
            <span className="pbd-kpi-tag">Sales Collected</span>
          </div>
        </div>
      </div>

      {/* Large Executive Workflow Card with Donut Chart */}
      <div className="pbd-executive-card">
        <div className="pbd-card-head-row">
          <h3 className="pbd-card-title">Kitchen & Order Workflow</h3>
          <span className="pbd-card-subtitle">{totalMeals} orders loaded</span>
        </div>

        <div className="pbd-donut-progress-split">
          <DonutChart data={donutData} total={totalMeals} />

          <div className="pbd-progress-rows-stack">
            <div className="pbd-progress-row">
              <div className="pbd-row-label">
                <span className="pbd-color-dot green" />
                <span className="pbd-lbl-name">Ready for Pickup</span>
              </div>
              <div className="pbd-bar-track">
                <div className="pbd-bar-fill green" style={{ width: `${totalMeals ? Math.round((ready.length / totalMeals) * 100) : 0}%` }} />
              </div>
              <b className="pbd-row-count">{ready.length}</b>
            </div>

            <div className="pbd-progress-row">
              <div className="pbd-row-label">
                <span className="pbd-color-dot blue" />
                <span className="pbd-lbl-name">Cooking on Stove</span>
              </div>
              <div className="pbd-bar-track">
                <div className="pbd-bar-fill blue" style={{ width: `${totalMeals ? Math.round((cooking.length / totalMeals) * 100) : 0}%` }} />
              </div>
              <b className="pbd-row-count">{cooking.length}</b>
            </div>

            <div className="pbd-progress-row">
              <div className="pbd-row-label">
                <span className="pbd-color-dot yellow" />
                <span className="pbd-lbl-name">Confirmed / Queued</span>
              </div>
              <div className="pbd-bar-track">
                <div className="pbd-bar-fill yellow" style={{ width: `${totalMeals ? Math.round((confirmed.length / totalMeals) * 100) : 0}%` }} />
              </div>
              <b className="pbd-row-count">{confirmed.length}</b>
            </div>

            <div className="pbd-progress-row">
              <div className="pbd-row-label">
                <span className="pbd-color-dot red" />
                <span className="pbd-lbl-name">New / Received</span>
              </div>
              <div className="pbd-bar-track">
                <div className="pbd-bar-fill red" style={{ width: `${totalMeals ? Math.round((newOrders.length / totalMeals) * 100) : 0}%` }} />
              </div>
              <b className="pbd-row-count">{newOrders.length}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 2. Kitchen & Orders (Kanban + Branch Tabs + Search + Audio Alert + 1-Tap WhatsApp Dispatch)
function Orders() {
  const { orders, setStatus, say, refreshAllData, settings } = useApp()
  const [branchFilter, setBranchFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [searchVal, setSearchVal] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(() => settings?.orderNotificationSound !== false)
  useEffect(() => {
    setSoundEnabled(settings?.orderNotificationSound !== false)
  }, [settings?.orderNotificationSound])
  const [advancingRef, setAdvancingRef] = useState(null)
  const prevOrdersCount = useRef(orders.length)

  useEffect(() => {
    if (orders.length > prevOrdersCount.current) {
      if (soundEnabled) {
        playKitchenChime()
        say('Ding-Dong! New order received!')
      }
    }
    prevOrdersCount.current = orders.length
  }, [orders.length, soundEnabled, say])

  const orderStep = order => {
    if (Number.isInteger(order.status)) return order.status
    const statusSteps = {
      pending_payment: 0,
      confirmed: 1,
      preparing: 2,
      ready_for_collection: 3,
      ready_for_dispatch: 3,
      out_for_delivery: 3,
      delivered: 4,
      collected: 4,
      cancelled: 4,
      rejected: 4
    }
    return statusSteps[order.orderStatus] ?? 0
  }

  const branchFiltered = orders.filter(o => branchFilter === 'all' || o.branch === branchFilter)
  const displayedOrders = branchFiltered.filter(o => {
    const matchesStatus = orderStep(o) < 4

    const q = searchVal.trim().toLowerCase()
    const matchesSearch = !q ||
      (o.ref || '').toLowerCase().includes(q) ||
      (o.name || '').toLowerCase().includes(q) ||
      (o.phone && o.phone.includes(q)) ||
      (o.address && o.address.toLowerCase().includes(q))

    return matchesStatus && matchesSearch
  })

  const getStatusColor = s => {
    switch (s) {
      case 0: return { label: 'New / Received', cls: 'st-0' }
      case 1: return { label: 'Confirmed', cls: 'st-1' }
      case 2: return { label: 'Cooking in Kitchen', cls: 'st-2' }
      case 3: return { label: 'Ready for Pickup', cls: 'st-3' }
      case 4: return { label: 'Collected / Done', cls: 'st-4' }
      default: return { label: 'Processing', cls: 'st-0' }
    }
  }

  const activeOrderCount = rows => rows.filter(order => orderStep(order) < 4).length

  const getNextActionLabel = s => {
    switch (s) {
      case 0: return 'Confirm Order →'
      case 1: return 'Start Cooking (Kitchen) →'
      case 2: return 'Mark Ready for Pickup →'
      case 3: return 'Mark Collected / Delivered'
      default: return 'Completed'
    }
  }

  const openCustomerWhatsApp = (order) => {
    const cleanPhone = (order.phone || '').replace(/\D/g, '')
    const fullPhone = cleanPhone.startsWith('0') ? '233' + cleanPhone.slice(1) : cleanPhone
    const text = encodeURIComponent(
      `Hello ${order.name}, this is Lady 3D's Catering Services! Your order #${order.ref} (${order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}) is ${getStatusObj(order.status).label.toLowerCase()}. Thank you!`
    )
    window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank')
  }

  return (
    <div className="pbd-orders-canvas">
      {/* Sound Alert Bar */}
      <div className="pbd-sound-strip">
        <div className="sound-strip-left">
          <span className={`sound-ring-dot ${soundEnabled ? 'on' : 'off'}`} />
          <span><b>Kitchen Sound Alert:</b> {soundEnabled ? 'Active (Dual-tone chime on new order)' : 'Muted'}</span>
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

      {/* Filter and Search Bar */}
      <div className="pbd-filter-row">
        <div className="pbd-branch-chips">
          <button className={`branch-chip-btn ${branchFilter === 'all' ? 'on' : ''}`} onClick={() => setBranchFilter('all')}>
            All Branches ({activeOrderCount(orders)})
          </button>
          <button className={`branch-chip-btn ${branchFilter === 'cug' ? 'on' : ''}`} onClick={() => setBranchFilter('cug')}>
            Catholic University ({activeOrderCount(orders.filter(o => o.branch === 'cug'))})
          </button>
          <button className={`branch-chip-btn ${branchFilter === 'sunyani' ? 'on' : ''}`} onClick={() => setBranchFilter('sunyani')}>
            Sunyani Main ({activeOrderCount(orders.filter(o => o.branch === 'sunyani'))})
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by Ref #, customer, phone..."
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          className="pbd-search-input"
        />
      </div>

      {/* Orders Grid */}
      <div className="pbd-orders-grid">
        {displayedOrders.length === 0 && (
          <div className="pbd-empty-orders" role="status">
            <strong>{searchVal.trim() ? 'No orders match your search.' : 'No active orders at this branch.'}</strong>
            <span>{searchVal.trim() ? 'Try a different reference, customer name, or phone number.' : 'Completed orders are hidden from the kitchen queue.'}</span>
            {searchVal.trim() && <button className="btn-sound-small" onClick={() => setSearchVal('')}>Clear search</button>}
          </div>
        )}
        {displayedOrders.map(o => {
          const status = orderStep(o)
          const stInfo = getStatusColor(status)
          const targetBranch = branchObj(o.branch)
          const dispatchWhatsAppUrl = buildOrderWhatsAppUrl(o)

          return (
            <div key={o.ref} className={`pbd-order-card status-border-${status}`}>
              <div className="pbd-order-head">
                <span className="pbd-order-ref">#{o.ref}</span>
                <span className={`pbd-status-badge ${stInfo.cls}`}>{stInfo.label}</span>
              </div>

              <div className="pbd-order-customer-box">
                <div className="cust-title-row">
                  <strong>{o.name}</strong>
                  <span className="cust-ph">{o.phone}</span>
                </div>
                {o.address && (
                  <div className="cust-addr">Delivery: <b>{o.address}</b></div>
                )}
                <div className="cust-quick-links">
                  <button className="btn-wa-link" onClick={() => openCustomerWhatsApp(o)}>WhatsApp Customer</button>
                  <a href={`tel:${o.phone}`} className="btn-call-link">Call</a>
                </div>
              </div>

              <div className="pbd-items-box">
                {o.items.map((it, idx) => (
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
                  <span className="unpaid-pill">Mobile Money pending provider confirmation</span>
                ) : (
                  <span className="unpaid-pill">Cash</span>
                )}
              </div>

              <div className="pbd-card-actions">
                <a
                  href={dispatchWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pbd-dispatch"
                  title="Send receipt to branch kitchen phone via WhatsApp"
                >
                  WhatsApp Kitchen
                </a>
                {o.orderStatus === 'pending_payment' ? (
                  <span className="unpaid-pill">Awaiting Paystack payment</span>
                ) : status === 3 && o.orderType === 'delivery' ? (
                  <button className="btn-pbd-advance" onClick={() => go('/delivery')}>Open Delivery Desk →</button>
                ) : status < 4 ? (
                  <button
                    className="btn-pbd-advance"
                    disabled={advancingRef === o.ref}
                    onClick={async () => {
                      setAdvancingRef(o.ref)
                      try {
                        await setStatus(o.ref, status + 1)
                        say(`Moved to ${getStatusObj(status + 1).label}`)
                      } catch { /* The provider already reports the server error. */ }
                      finally { setAdvancingRef(null) }
                    }}
                  >
                    {advancingRef === o.ref ? (
                      <>
                        <span className="pbd-spinner-sm" /> Updating...
                      </>
                    ) : (
                      getNextActionLabel(status)
                    )}
                  </button>
                ) : (
                  <span className="completed-tag">Completed</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 3. Menu Management (Adding Food, Editing Prices, Deleting, Categories)
function MenuAdmin() {
  const { menu, setMenu, cats, say, api, refreshAllData } = useApp()
  const [n, setN] = useState({ name: '', price: '', cat: cats[0] || 'Local Dishes', img: '', desc: '', availCug: true, availSunyani: true })
  const [filterCat, setFilterCat] = useState('All')
  const [searchMeal, setSearchMeal] = useState('')
  const [editingMeal, setEditingMeal] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleAdd = async () => {
    if (!n.name.trim() || !n.price) return say('Please enter food name and price')
    setBusy(true)
    try {
      const payload = {
        name: n.name.trim(),
        cat: n.cat,
        price: +n.price,
        img: n.img.trim() || 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
        desc: n.desc.trim() || 'Freshly prepared meal with authentic Ghanaian spices',
        avail: { cug: n.availCug, sunyani: n.availSunyani },
        prices: { cug: +n.price, sunyani: +n.price }
      }
      const res = await api('/admin/menu', { method: 'POST', body: JSON.stringify(payload) })
      setMenu([res.item || { ...payload, id: Date.now() }, ...menu])
      setN({ name: '', price: '', cat: cats[0] || 'Local Dishes', img: '', desc: '', availCug: true, availSunyani: true })
      say(`Dish "${payload.name}" added to menu successfully!`)
    } catch (err) {
      say(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingMeal?.name?.trim() || !editingMeal?.price) return say('Name and price are required')
    setBusy(true)
    try {
      const updateData = {
        name: editingMeal.name.trim(),
        cat: editingMeal.cat,
        price: +editingMeal.price,
        desc: editingMeal.desc,
        img: editingMeal.img,
        avail: editingMeal.avail || { cug: true, sunyani: true },
        prices: {
          cug: editingMeal.prices?.cug !== undefined && editingMeal.prices?.cug !== '' ? +editingMeal.prices.cug : +editingMeal.price,
          sunyani: editingMeal.prices?.sunyani !== undefined && editingMeal.prices?.sunyani !== '' ? +editingMeal.prices.sunyani : +editingMeal.price
        }
      }
      await api('/admin/menu/' + editingMeal.id, { method: 'PUT', body: JSON.stringify(updateData) })
      setMenu(menu.map(m => m.id === editingMeal.id ? { ...m, ...updateData } : m))
      say(`Dish "${updateData.name}" updated successfully!`)
      setEditingMeal(null)
    } catch (err) {
      say(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (m) => {
    if (!confirm(`Are you sure you want to permanently delete "${m.name}" from the menu?`)) return
    try {
      await api('/admin/menu/' + m.id, { method: 'DELETE' })
      setMenu(menu.filter(x => x.id !== m.id))
      say(`Dish "${m.name}" deleted from menu`)
    } catch (err) {
      say(err.message)
    }
  }

  const displayedMenu = menu.filter(m => {
    const matchCat = filterCat === 'All' || m.cat === filterCat
    const matchSearch = !searchMeal || m.name.toLowerCase().includes(searchMeal.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="pbd-menu-canvas">
      {/* Add New Meal Form Card */}
      <div className="pbd-white-card">
        <div className="pbd-card-head-row">
          <h3>Add New Dish to Menu</h3>
          <span className="muted small">Syncs instantly across mobile app & kitchen view</span>
        </div>

        <div className="pbd-add-meal-grid">
          <label>
            <span className="field-label-small">Meal Name *</span>
            <input
              placeholder="e.g. Banku & Okro Soup with Crab"
              value={n.name}
              onChange={e => setN({ ...n, name: e.target.value })}
              className="pbd-input"
            />
          </label>

          <label>
            <span className="field-label-small">Base Price (GH₵) *</span>
            <input
              type="number"
              placeholder="40"
              value={n.price}
              onChange={e => setN({ ...n, price: e.target.value })}
              className="pbd-input"
            />
          </label>

          <label>
            <span className="field-label-small">Category</span>
            <select
              value={n.cat}
              onChange={e => setN({ ...n, cat: e.target.value })}
              className="pbd-select"
            >
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label>
            <span className="field-label-small">Photo URL (Optional)</span>
            <input
              placeholder="https://images.unsplash.com/..."
              value={n.img}
              onChange={e => setN({ ...n, img: e.target.value })}
              className="pbd-input"
            />
          </label>
        </div>

        <div className="pbd-form-row-extra mt-2">
          <input
            placeholder="Short meal description or ingredients..."
            value={n.desc}
            onChange={e => setN({ ...n, desc: e.target.value })}
            className="pbd-input flex-grow"
          />

          <div className="branch-checks-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={n.availCug}
                onChange={e => setN({ ...n, availCug: e.target.checked })}
              />
              <span>CUG Campus</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={n.availSunyani}
                onChange={e => setN({ ...n, availSunyani: e.target.checked })}
              />
              <span>Sunyani Main</span>
            </label>
          </div>

          <button className="btn-pbd-action" disabled={busy} onClick={handleAdd}>
            {busy ? 'Saving...' : '+ Add Food to Menu'}
          </button>
        </div>
      </div>

      {/* Menu Inventory List */}
      <div className="pbd-white-card mt-3">
        <div className="pbd-filter-bar-header">
          <div className="pbd-cat-chips">
            <button className={`branch-chip-btn ${filterCat === 'All' ? 'on' : ''}`} onClick={() => setFilterCat('All')}>
              All ({menu.length})
            </button>
            {cats.map(c => (
              <button key={c} className={`branch-chip-btn ${filterCat === c ? 'on' : ''}`} onClick={() => setFilterCat(c)}>
                {c} ({menu.filter(m => m.cat === c).length})
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search meals..."
              value={searchMeal}
              onChange={e => setSearchMeal(e.target.value)}
              className="pbd-search-input"
            />
          </div>
        </div>

        {menu.length === 0 ? (
          <div className="pbd-card mt-3">
            <LoadingSpinner text="Loading menu catalog..." />
          </div>
        ) : (
          <Table
            head={['Dish Photo', 'Meal Name & Description', 'Category', 'Base Price', 'Branch Prices', 'Availability', 'Actions']}
            rows={displayedMenu.map(m => [
            <img
              key="img"
              src={m.img || '/lady3d-logo.jpg'}
              alt={m.name}
              className="menu-thumb-pbd"
              onError={e => { e.target.src = '/lady3d-logo.jpg' }}
            />,
            <div key="name">
              <strong>{m.name}</strong>
              <small className="muted block">{m.desc?.slice(0, 60)}...</small>
            </div>,
            <span key="c" className="cat-badge-pbd">{m.cat}</span>,
            <div key="p" style={{ fontWeight: 700 }}>
              GH₵{Number(m.price).toFixed(2)}
            </div>,
            <div key="bp" style={{ fontSize: '12px' }}>
              <div>CUG: <b>GH₵{Number(m.prices?.cug ?? m.price).toFixed(2)}</b></div>
              <div>Sunyani: <b>GH₵{Number(m.prices?.sunyani ?? m.price).toFixed(2)}</b></div>
            </div>,
            <div key="av" className="avail-badges-row">
              <span className={`avail-tag ${m.avail?.cug !== false ? 'active' : ''}`}>CUG</span>
              <span className={`avail-tag ${m.avail?.sunyani !== false ? 'active' : ''}`}>Sunyani</span>
            </div>,
            <div key="act" style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn-stock-toggle btn-restock"
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={() => setEditingMeal({
                  ...m,
                  prices: m.prices || { cug: m.price, sunyani: m.price },
                  avail: m.avail || { cug: true, sunyani: true }
                })}
              >
                Edit
              </button>
              <button
                className="btn-del-sm"
                onClick={() => handleDelete(m)}
              >
                Delete
              </button>
            </div>
          ])}
        />
        )}
      </div>

      {/* EDIT DISH MODAL */}
      {editingMeal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '560px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
                Edit Dish · {editingMeal.name}
              </h3>
              <button onClick={() => setEditingMeal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
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

              {/* Branch Specific Pricing */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Branch-Specific Prices (GH₵)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b' }}>CUG Campus Price</label>
                    <input
                      type="number"
                      placeholder={editingMeal.price}
                      value={editingMeal.prices?.cug ?? ''}
                      onChange={e => setEditingMeal({
                        ...editingMeal,
                        prices: { ...(editingMeal.prices || {}), cug: e.target.value }
                      })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '2px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b' }}>Sunyani Main Price</label>
                    <input
                      type="number"
                      placeholder={editingMeal.price}
                      value={editingMeal.prices?.sunyani ?? ''}
                      onChange={e => setEditingMeal({
                        ...editingMeal,
                        prices: { ...(editingMeal.prices || {}), sunyani: e.target.value }
                      })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '2px' }}
                    />
                  </div>
                </div>
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

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Description</label>
                <textarea
                  rows="3"
                  value={editingMeal.desc || ''}
                  onChange={e => setEditingMeal({ ...editingMeal, desc: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </div>

              {/* Branch Availability toggles */}
              <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={editingMeal.avail?.cug !== false}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      avail: { ...(editingMeal.avail || {}), cug: e.target.checked }
                    })}
                  />
                  <span>Available at CUG Campus</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={editingMeal.avail?.sunyani !== false}
                    onChange={e => setEditingMeal({
                      ...editingMeal,
                      avail: { ...(editingMeal.avail || {}), sunyani: e.target.checked }
                    })}
                  />
                  <span>Available at Sunyani Main</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <button
                onClick={() => setEditingMeal(null)}
                style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={handleSaveEdit}
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
              >
                {busy ? 'Saving...' : 'Save Dish Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 4. Categories Management Tab (Dedicated)
function Categories() {
  const { cats, setCats, menu, say } = useApp()
  const [newCat, setNewCat] = useState('')

  const handleAddCat = async () => {
    if (!newCat.trim()) return say('Enter a category name')
    if (cats.includes(newCat.trim())) return say('Category already exists')
    try {
      await setCats([...cats, newCat.trim()])
      setNewCat('')
      say(`Category "${newCat.trim()}" added!`)
    } catch (error) { say(error.message) }
  }

  const handleDeleteCat = async c => {
    if (confirm(`Delete category "${c}"? Items in it will need reassignment.`)) {
      try {
        await setCats(cats.filter(x => x !== c))
        say(`Category "${c}" removed`)
      } catch (error) { say(error.message) }
    }
  }

  return (
    <div className="pbd-white-card">
      <div className="pbd-card-head-row">
        <h3>Food Categories Manager</h3>
        <span className="muted small">Organize meals into browsable customer categories</span>
      </div>

      <div className="row gap mt-2">
        <input
          placeholder="New Category Name (e.g. Grills & Barbecue, Drinks)"
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          className="pbd-input flex-grow"
        />
        <button className="btn-pbd-action" onClick={handleAddCat}>
          + Add Category
        </button>
      </div>

      <div className="pbd-cats-grid mt-3">
        {cats.map(c => {
          const itemCount = menu.filter(m => m.cat === c).length
          return (
            <div key={c} className="pbd-cat-item-card">
              <div>
                <strong>{c}</strong>
                <span className="muted small block">{itemCount} dishes assigned</span>
              </div>
              <button
                className="btn-del-sm"
                onClick={() => handleDeleteCat(c)}
                title="Delete Category"
              >
                Delete
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 5. Branch Menu Matrix (Toggle per Branch & Custom Branch Prices)
function Branches() {
  const { menu, setMenu, say } = useApp()
  const up = (id, fn) => setMenu(menu.map(m => m.id === id ? fn(m) : m))

  return (
    <div className="pbd-white-card">
      <div className="pbd-card-head-row">
        <div>
          <h3>Branch Availability & Pricing Matrix</h3>
          <p className="muted small">
            Catholic University Campus Annex (the flyer dishes) vs Sunyani Main Branch (the full signboard dishes). Custom prices override base menu price.
          </p>
        </div>
        <button
          className="btn-sound-small"
          onClick={() => {
            setMenu(menu.map(m => ({ ...m, avail: { cug: true, sunyani: true } })))
            say('All meals enabled for both branches')
          }}
        >
          Enable All for Both Branches
        </button>
      </div>

      <Table
        head={['Meal Name', 'CUG Campus Available', 'CUG Price (GH₵)', 'Sunyani Main Available', 'Sunyani Price (GH₵)']}
        rows={menu.map(m => [
          <div key="n">
            <strong>{m.name}</strong>
            <small className="muted block">Base: {money(m.price)}</small>
          </div>,
          <label key="ca" className="pbd-switch">
            <input
              type="checkbox"
              checked={!!m.avail?.cug}
              onChange={e => up(m.id, x => ({ ...x, avail: { ...x.avail, cug: e.target.checked } }))}
            />
            <span className="pbd-slider" />
          </label>,
          <input
            key="cp"
            type="number"
            placeholder={m.price}
            value={m.prices?.cug ?? ''}
            onChange={e => up(m.id, x => ({ ...x, prices: { ...x.prices, cug: e.target.value === '' ? undefined : +e.target.value } }))}
            className="pbd-mini-input"
          />,
          <label key="sa" className="pbd-switch">
            <input
              type="checkbox"
              checked={!!m.avail?.sunyani}
              onChange={e => up(m.id, x => ({ ...x, avail: { ...x.avail, sunyani: e.target.checked } }))}
            />
            <span className="pbd-slider" />
          </label>,
          <input
            key="sp"
            type="number"
            placeholder={m.price}
            value={m.prices?.sunyani ?? ''}
            onChange={e => up(m.id, x => ({ ...x, prices: { ...x.prices, sunyani: e.target.value === '' ? undefined : +e.target.value } }))}
            className="pbd-mini-input"
          />
        ])}
      />
    </div>
  )
}

// 6. Customers Directory (Adding Customers, Editing Points, WhatsApp Contact)
function Customers() {
  const { customers, setCustomersState, say, api } = useApp()
  const [newCust, setNewCust] = useState({ name: '', phone: '', branch: 'cug', points: 10, status: 'Regular' })
  const [searchCust, setSearchCust] = useState('')
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [adjustingId, setAdjustingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    api('/admin/customers')
      .then(res => {
        if (alive && Array.isArray(res?.customers)) {
          setCustomersState(res.customers)
        }
      })
      .catch(error => {
        if (alive) say(error.message, { type: 'error' })
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => { alive = false }
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const res = await api('/admin/customers')
      if (Array.isArray(res?.customers)) {
        setCustomersState(res.customers)
        say(`Refreshed ${res.customers.length} registered customers`)
      }
    } catch (err) {
      say(err.message, { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomer = async () => {
    if (!newCust.name.trim() || !newCust.phone.trim()) return say('Please enter customer name and phone', { type: 'error' })
    setAdding(true)
    try {
      const res = await api('/admin/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: newCust.name.trim(),
          phone: newCust.phone.trim(),
          branch: newCust.branch,
          points: +newCust.points || 0,
          status: newCust.status
        })
      })
      const added = res.customer || {
        id: Date.now(),
        name: newCust.name.trim(),
        phone: newCust.phone.trim(),
        branch: newCust.branch,
        ordersCount: 0,
        spent: 0,
        points: +newCust.points || 0,
        status: newCust.status
      }
      setCustomersState(prev => [added, ...prev])
      setNewCust({ name: '', phone: '', branch: 'cug', points: 10, status: 'Regular' })
      say(`Customer "${added.name}" registered!`)
    } catch (error) {
      say(error.message, { type: 'error' })
    } finally {
      setAdding(false)
    }
  }

  const handleAdjustPoints = async (id, delta) => {
    setAdjustingId(id)
    try {
      const res = await api(`/admin/customers/${id}/points`, {
        method: 'PATCH',
        body: JSON.stringify({ delta })
      })
      const newPoints = typeof res?.points === 'number' ? res.points : null
      setCustomersState(prev => prev.map(c => {
        if (c.id === id) {
          const updatedPts = newPoints !== null ? newPoints : Math.max(0, (c.points || 0) + delta)
          return { ...c, points: updatedPts, status: updatedPts >= 50 ? 'VIP Member' : c.status }
        }
        return c
      }))
      say(`Points updated (${delta > 0 ? '+' : ''}${delta})`)
    } catch (error) {
      say(error.message, { type: 'error' })
    } finally {
      setAdjustingId(null)
    }
  }

  const handleDeleteCust = async (id, name) => {
    if (confirm(`Remove customer "${name}"?`)) {
      setDeletingId(id)
      try {
        await api(`/admin/customers/${id}`, { method: 'DELETE' })
        setCustomersState(prev => prev.filter(c => c.id !== id))
        say(`Removed ${name}`)
      } catch (error) {
        say(error.message, { type: 'error' })
      } finally {
        setDeletingId(null)
      }
    }
  }

  const filtered = customers.filter(c => 
    !searchCust ||
    (c.name && c.name.toLowerCase().includes(searchCust.toLowerCase())) ||
    (c.phone && c.phone.includes(searchCust)) ||
    (c.email && c.email.toLowerCase().includes(searchCust.toLowerCase()))
  )

  const vipCount = customers.filter(c => (c.points || 0) >= 50).length
  const clubCount = customers.filter(c => (c.points || 0) > 0).length

  return (
    <div className="pbd-white-card">
      <div className="pbd-card-head-row">
        <div>
          <h3>Registered Customers & Loyalty Club Directory</h3>
          <p className="muted small">Manage food club points, preferred campus branches, and direct communication.</p>
        </div>
      </div>

      <div className="pbd-stats-pill-row">
        <span className="pbd-stat-pill">Total Customers: <b>{customers.length}</b></span>
        <span className="pbd-stat-pill">Points Club Members: <b>{clubCount}</b></span>
        <span className="pbd-stat-pill">VIP Gold Members (50+ pts): <b>{vipCount}</b></span>
      </div>

      {/* Add Customer Card */}
      <div className="pbd-add-meal-grid mt-2 mb-3">
        <input
          placeholder="Customer Name"
          value={newCust.name}
          onChange={e => setNewCust({ ...newCust, name: e.target.value })}
          className="pbd-input"
          disabled={adding}
        />
        <input
          placeholder="Phone (e.g. 024 123 4567)"
          value={newCust.phone}
          onChange={e => setNewCust({ ...newCust, phone: e.target.value })}
          className="pbd-input"
          disabled={adding}
        />
        <select
          value={newCust.branch}
          onChange={e => setNewCust({ ...newCust, branch: e.target.value })}
          className="pbd-select"
          disabled={adding}
        >
          <option value="cug">Catholic University (Annex)</option>
          <option value="sunyani">Sunyani Main Branch</option>
        </select>
        <select
          value={newCust.status}
          onChange={e => setNewCust({ ...newCust, status: e.target.value })}
          className="pbd-select"
          disabled={adding}
        >
          <option value="Regular">Regular</option>
          <option value="VIP Member">VIP Member</option>
          <option value="New Customer">New Customer</option>
        </select>
        <button className="btn-pbd-action" disabled={adding} onClick={handleAddCustomer}>
          {adding ? (
            <>
              <span className="pbd-spinner-sm" />
              Registering...
            </>
          ) : (
            '+ Register Customer'
          )}
        </button>
      </div>

      <div className="mb-2">
        <input
          type="text"
          placeholder="Search by customer name, phone, or email..."
          value={searchCust}
          onChange={e => setSearchCust(e.target.value)}
          className="pbd-search-input"
        />
      </div>

      {loading && customers.length === 0 ? (
        <div className="pbd-loading-container">
          <span className="pbd-spinner" />
          <span>Loading customer directory from database...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="pbd-empty-state">
          <div className="pbd-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <h4 style={{ margin: '0 0 6px 0', color: '#1E293B' }}>No registered customers found</h4>
          <p className="muted small" style={{ maxWidth: '420px', margin: '0 auto' }}>
            {searchCust ? `No customer matched "${searchCust}". Try clearing your search.` : 'When customers sign up on the website or you register them above, their account, orders, and points will appear here.'}
          </p>
        </div>
      ) : (
        <Table
          head={['Customer Name', 'Phone', 'Branch', 'Orders', 'Points Balance', 'Member Tier', 'WhatsApp', 'Actions']}
          rows={filtered.map(c => [
            <div key="n">
              <strong>{c.name}</strong>
              {c.email && !c.email.endsWith('@lady3d.local') && (
                <div className="muted small" style={{ fontSize: '11px' }}>{c.email}</div>
              )}
            </div>,
            <span key="p">{c.phone}</span>,
            <span key="b" className={`branch-pill-sm ${c.branch}`}>{bn(c.branch)}</span>,
            <b key="o">{c.ordersCount || 0}</b>,
            <div key="pt" className="inline-points-editor">
              <button
                className="btn-pts-adjust"
                disabled={adjustingId === c.id}
                onClick={() => handleAdjustPoints(c.id, -5)}
                title="Deduct 5 points"
              >
                -5
              </button>
              <span className="points-badge-gold">{c.points || 0} pts</span>
              <button
                className="btn-pts-adjust"
                disabled={adjustingId === c.id}
                onClick={() => handleAdjustPoints(c.id, 5)}
                title="Award 5 points"
              >
                +5
              </button>
            </div>,
            <span key="t" className="vip-tag">{c.status}</span>,
            <a
              key="w"
              href={`https://wa.me/${(c.phone || '').replace(/\D/g, '').replace(/^0/, '233')}?text=Hello%20${encodeURIComponent(c.name)},%20greetings%20from%20Lady%203D's%20Catering!`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa-link"
            >
              Message
            </a>,
            <button
              key="d"
              className="btn-del-sm"
              disabled={deletingId === c.id}
              onClick={() => handleDeleteCust(c.id, c.name)}
            >
              {deletingId === c.id ? 'Deleting...' : 'Delete'}
            </button>
          ])}
        />
      )}
    </div>
  )
}

// 7. Staff & Roles Management Tab (Adding Staff, Changing Roles, View As)
function Staff() {
  const { say, api } = useApp()
  const [staff, setStaff] = useState([])
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'Cashier', branch: 'cug', phone: '' })
  const [editingStaff, setEditingStaff] = useState(null)
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [addingStaff, setAddingStaff] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  const loadStaff = async () => {
    setLoadingStaff(true)
    try {
      const { staff: rows } = await api('/admin/staff')
      setStaff(rows || [])
    } catch (error) {
      say(error.message, { type: 'error' })
    } finally {
      setLoadingStaff(false)
    }
  }

  useEffect(() => { loadStaff() }, [])

  const handleAddStaff = async () => {
    if (!newStaff.name.trim() || !newStaff.email.trim() || !newStaff.phone.trim() || newStaff.password.length < 10) return say('Enter the staff details and a password with at least 10 characters', { type: 'error' })
    setAddingStaff(true)
    try {
      const { staff: added } = await api('/admin/staff', { method: 'POST', body: JSON.stringify(newStaff) })
      setStaff(rows => [added, ...rows])
      setNewStaff({ name: '', email: '', password: '', role: 'Cashier', branch: 'cug', phone: '' })
      say(`Staff account created for ${added.name}.`)
    } catch (error) {
      say(error.message, { type: 'error' })
    } finally {
      setAddingStaff(false)
    }
  }

  const handleDeleteStaff = (id, name) => {
    if (confirm(`Remove staff member "${name}"?`)) {
      api(`/admin/staff/${id}`, { method: 'PATCH', body: JSON.stringify({ active: false }) })
        .then(({ staff: updated }) => setStaff(rows => rows.map(row => row.id === id ? updated : row)))
        .then(() => say(`Disabled ${name}'s sign-in.`))
        .catch(error => say(error.message))
    }
  }

  const handleToggleActive = (member) => {
    api(`/admin/staff/${member.id}`, { method: 'PATCH', body: JSON.stringify({ active: !member.active }) })
      .then(({ staff: updated }) => setStaff(rows => rows.map(row => row.id === member.id ? updated : row)))
      .catch(error => say(error.message))
  }

  const handleSaveStaff = async () => {
    if (!editingStaff.name.trim() || !editingStaff.email.trim() || !editingStaff.phone.trim()) return say('Enter the staff name, email and phone number', { type: 'error' })
    if (editingStaff.password && editingStaff.password.length < 10) return say('Use a temporary password with at least 10 characters', { type: 'error' })
    const payload = {
      name: editingStaff.name.trim(),
      email: editingStaff.email.trim(),
      phone: editingStaff.phone.trim(),
      role: editingStaff.role,
      branch: editingStaff.branch,
      ...(editingStaff.password ? { password: editingStaff.password } : {})
    }
    setSavingEdit(true)
    try {
      const { staff: updated } = await api(`/admin/staff/${editingStaff.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      setStaff(rows => rows.map(row => row.id === updated.id ? updated : row))
      setEditingStaff(null)
      say(`Updated ${updated.name}'s account.`)
    } catch (error) {
      say(error.message, { type: 'error' })
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="pbd-white-card">
      <div className="pbd-card-head-row">
        <div>
          <h3>Staff Roster & Permissions Management</h3>
          <p className="muted small">Create real staff sign-ins, assign a branch and disable accounts when access should end.</p>
        </div>
      </div>

      {/* Add Staff Form */}
      <div className="pbd-add-meal-grid mt-2 mb-3">
        <label>
          <span className="field-label-small">Staff Name *</span>
          <input
            placeholder="e.g. Kwame Mensah"
            value={newStaff.name}
            onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
            className="pbd-input"
            disabled={addingStaff}
          />
        </label>

        <label>
          <span className="field-label-small">Staff Email *</span>
          <input
            type="email"
            placeholder="name@example.com"
            value={newStaff.email}
            onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
            className="pbd-input"
            disabled={addingStaff}
          />
        </label>

        <label>
          <span className="field-label-small">Temporary Password *</span>
          <input
            type="password"
            minLength={10}
            autoComplete="new-password"
            placeholder="At least 10 characters"
            value={newStaff.password}
            onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
            className="pbd-input"
            disabled={addingStaff}
          />
        </label>

        <label>
          <span className="field-label-small">Assigned Role *</span>
          <select
            value={newStaff.role}
            onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
            className="pbd-select"
            disabled={addingStaff}
          >
            <option value="Cashier">Cashier</option>
            <option value="Manager">Manager</option>
            <option value="Kitchen">Kitchen</option>
            <option value="Driver">Driver</option>
          </select>
        </label>

        <label>
          <span className="field-label-small">Branch</span>
          <select
            value={newStaff.branch}
            onChange={e => setNewStaff({ ...newStaff, branch: e.target.value })}
            className="pbd-select"
            disabled={addingStaff}
          >
            <option value="cug">Catholic University (Annex)</option>
            <option value="sunyani">Sunyani Main Branch</option>
          </select>
        </label>

        <label>
          <span className="field-label-small">Phone Number *</span>
          <input
            placeholder="024 123 4567"
            value={newStaff.phone}
            onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
            className="pbd-input"
            disabled={addingStaff}
          />
        </label>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn-pbd-action full-width" disabled={addingStaff} onClick={handleAddStaff}>
            {addingStaff ? (
              <>
                <span className="pbd-spinner-sm" /> Adding Staff...
              </>
            ) : (
              '+ Add Staff Member'
            )}
          </button>
        </div>
      </div>

      {editingStaff && (
        <div className="pbd-white-card mt-2" style={{ border: '1px solid #cbd5e1' }}>
          <h4>Edit staff account: {editingStaff.name}</h4>
          <div className="pbd-add-meal-grid mt-2">
            <label><span className="field-label-small">Staff Name</span><input className="pbd-input" value={editingStaff.name} onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })} disabled={savingEdit} /></label>
            <label><span className="field-label-small">Sign-in Email</span><input type="email" className="pbd-input" value={editingStaff.email} onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })} disabled={savingEdit} /></label>
            <label><span className="field-label-small">Phone Number</span><input className="pbd-input" value={editingStaff.phone} onChange={e => setEditingStaff({ ...editingStaff, phone: e.target.value })} disabled={savingEdit} /></label>
            <label><span className="field-label-small">Role</span><select className="pbd-select" value={editingStaff.role} onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value })}><option value="Manager">Manager</option><option value="Kitchen">Kitchen</option><option value="Driver">Driver</option><option value="Cashier">Cashier</option></select></label>
            <label><span className="field-label-small">Assigned Branch</span><select className="pbd-select" value={editingStaff.branch} onChange={e => setEditingStaff({ ...editingStaff, branch: e.target.value })}><option value="cug">Catholic University (Annex)</option><option value="sunyani">Sunyani Main Branch</option><option value="all">All Branches</option></select></label>
            <label><span className="field-label-small">Reset Password (optional)</span><input type="password" minLength={10} autoComplete="new-password" className="pbd-input" placeholder="Leave blank to keep current" value={editingStaff.password} onChange={e => setEditingStaff({ ...editingStaff, password: e.target.value })} disabled={savingEdit} /></label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-pbd-action" disabled={savingEdit} onClick={handleSaveStaff}>
              {savingEdit ? 'Saving account...' : 'Save account'}
            </button>
            <button className="btn-pbd-action" disabled={savingEdit} onClick={() => setEditingStaff(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loadingStaff && staff.length === 0 ? (
        <div className="pbd-loading-container">
          <span className="pbd-spinner" />
          <span>Loading staff roster...</span>
        </div>
      ) : staff.length === 0 ? (
        <div className="pbd-empty-state">
          <h4 style={{ margin: '0 0 6px 0', color: '#1E293B' }}>No staff members found</h4>
          <p className="muted small">Add staff above to grant role-based console access.</p>
        </div>
      ) : (
        <Table
          head={['Staff Member', 'Sign-in Email', 'Role', 'Assigned Branch', 'Contact Phone', 'Active Status', 'Actions']}
          rows={staff.map(s => [
            <strong key="n">{s.name}</strong>,
            <span key="e">{s.email}</span>,
            <span key="r" className="role-tag-badge">{s.role}</span>,
            <span key="b">{s.branch === 'all' ? 'All Branches' : bn(s.branch)}</span>,
            <span key="p">{s.phone}</span>,
            <label key="act" className="pbd-switch">
              <input
                type="checkbox"
                checked={s.active}
                onChange={() => handleToggleActive(s)}
              />
              <span className="pbd-slider" />
            </label>,
            <div key="actions" style={{ display: 'flex', gap: 6 }}><button className="btn-del-sm" onClick={() => setEditingStaff({ ...s, password: '' })}>Edit</button><button className="btn-del-sm" onClick={() => handleDeleteStaff(s.id, s.name)}>Disable</button></div>
          ])}
        />
      )}
    </div>
  )
}

// 8. Loyalty & Rewards Engine (Rules Configuration & Reward Tiers)
function Loyalty() {
  const { loyaltyRules, setLoyaltyRules, say } = useApp()
  const [rules, setRules] = useState(loyaltyRules)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!Number.isFinite(rules.spendPerPoint) || rules.spendPerPoint < 1 || !Number.isFinite(rules.rewardThreshold) || rules.rewardThreshold < 1) {
      say('Spend per point and reward threshold must both be at least 1.', { type: 'error' })
      return
    }
    setSaving(true)
    try {
      await setLoyaltyRules(rules)
      say('Loyalty & reward rules saved!')
    } catch (error) { say(error.message, { type: 'error' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="pbd-white-card">
      <div className="pbd-card-head-row">
        <div>
          <h3>Lady 3D Food Club Points Configuration</h3>
          <p className="muted small">Define point accrual rates and threshold for free plate rewards.</p>
        </div>
      </div>

      <div className="pbd-loyalty-fields mt-3">
        <label>
          <span>Spend per 1 Loyalty Point (GH₵)</span>
          <input
            type="number"
            min="1"
            value={rules.spendPerPoint}
            onChange={e => setRules({ ...rules, spendPerPoint: +e.target.value })}
            className="pbd-input"
          />
        </label>

        <label>
          <span>Points Required for Free Plate</span>
          <input
            type="number"
            min="1"
            value={rules.rewardThreshold}
            onChange={e => setRules({ ...rules, rewardThreshold: +e.target.value })}
            className="pbd-input"
          />
        </label>

        <label>
          <span>Welcome Coupon Discount (%)</span>
          <input
            type="number"
            value={rules.promoDiscount}
            onChange={e => setRules({ ...rules, promoDiscount: +e.target.value })}
            className="pbd-input"
          />
        </label>
      </div>

      <button className="btn-pbd-action mt-3" disabled={saving} onClick={handleSave}>
        {saving ? (
          <>
            <span className="pbd-spinner-sm" /> Saving Rules...
          </>
        ) : (
          'Save Rules Configuration'
        )}
      </button>
    </div>
  )
}

// 9. Promotions & Vouchers
function Promos() {
  const { promos, setPromos, say, api } = useApp()
  const emptyPromo = { code: '', label: '', bannerText: '', discount: 0.1, enabled: true }
  const [form, setForm] = useState(emptyPromo)
  const [editingId, setEditingId] = useState(null)
  const [savingPromoId, setSavingPromoId] = useState(null)

  const loadPromos = async () => {
    try {
      const { promos: rows } = await api('/admin/promos')
      if (Array.isArray(rows)) {
        setPromos(rows.map(r => ({ ...r, id: String(r.id || r._id || r.code) })))
      }
    } catch (error) {
      say(error.message)
    }
  }

  useEffect(() => {
    loadPromos()
  }, [])

  const savePromo = async () => {
    try {
      const payload = { ...form, discount: Number(form.discount) }
      if (editingId) {
        const { promo } = await api(`/admin/promos/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) })
        const normalized = { ...promo, id: String(promo.id || promo._id || promo.code) }
        setPromos(rows => rows.map(row => (row.id === editingId || row._id === editingId || row.code === editingId) ? normalized : row))
        say('Promotion updated successfully')
      } else {
        const { promo } = await api('/admin/promos', { method: 'POST', body: JSON.stringify(payload) })
        const normalized = { ...promo, id: String(promo.id || promo._id || promo.code) }
        setPromos(rows => [normalized, ...rows.filter(r => r.code !== normalized.code)])
        say('Promotion created successfully')
      }
      setForm(emptyPromo)
      setEditingId(null)
    } catch (error) { say(error.message) }
  }

  return (
    <div className="pbd-white-card">
      <div className="pbd-card-head-row">
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Promotions & Banner Codes</h3>
          <span className="muted small">Manage homepage announcements & student discount vouchers</span>
        </div>
      </div>

      <div id="promo-editor" className="pbd-add-meal-grid mt-2" style={{ background: '#FAF7F4', padding: '16px', borderRadius: '12px', border: '1px solid #EFE6DC' }}>
        <label><span className="field-label-small">Voucher Code</span><input className="pbd-input" placeholder="e.g. STUDENT10" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} /></label>
        <label><span className="field-label-small">Promotion Name</span><input className="pbd-input" placeholder="Student discount" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></label>
        <label><span className="field-label-small">Discount (%)</span><input className="pbd-input" type="number" min="0" max="80" value={Math.round(form.discount * 100)} onChange={e => setForm({ ...form, discount: Number(e.target.value) / 100 })} /></label>
        <label><span className="field-label-small">Customer Banner Message</span><input className="pbd-input" maxLength="240" placeholder="Use this code on your next order" value={form.bannerText} onChange={e => setForm({ ...form, bannerText: e.target.value })} /></label>
        <div className="row gap" style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
          <button className="btn-pbd-action" onClick={savePromo}>{editingId ? 'Save Changes' : '+ Add Promotion'}</button>
          {editingId && <button className="btn-del-sm" onClick={() => { setEditingId(null); setForm(emptyPromo) }}>Cancel</button>}
        </div>
      </div>

      <p className="muted small mt-2">Changes save directly to database. Paused promotions are safely kept in storage but disappear from the customer banner and checkout.</p>

      <div className="pbd-promos-list mt-3">
        {promos.map(p => {
          const promoId = String(p.id || p._id || p.code)
          const isPaused = p.enabled === false
          return (
            <div key={promoId} className="pbd-promo-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '14px 16px', background: '#FFFFFF', border: '1px solid #EFE6DC', borderRadius: '10px', marginBottom: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '15px', color: '#1C1917' }}>{p.label} ({p.code})</strong>
                  <span style={{
                    background: isPaused ? '#FEE2E2' : '#DCFCE7',
                    color: isPaused ? '#991B1B' : '#15803D',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase'
                  }}>
                    {isPaused ? 'Paused' : 'Active'}
                  </span>
                </div>
                <p className="muted small" style={{ margin: '4px 0 0 0', color: '#78716C' }}>
                  {Math.round((p.discount || 0) * 100)}% off · {p.bannerText || 'No banner message'}
                </p>
              </div>

              <div className="row gap align-center">
                <button
                  className="btn-del-sm"
                  disabled={savingPromoId === promoId}
                  style={{
                    background: isPaused ? '#DCFCE7' : '#FEE2E2',
                    color: isPaused ? '#15803D' : '#991B1B',
                    border: 'none',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  onClick={async () => {
                    setSavingPromoId(promoId)
                    try {
                      const nextEnabled = p.enabled === false
                      const { promo } = await api(`/admin/promos/${promoId}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ enabled: nextEnabled })
                      })
                      const normalized = { ...promo, id: String(promo.id || promo._id || promo.code) }
                      setPromos(rows => rows.map(x => (x.id === promoId || x._id === promoId || x.code === p.code) ? normalized : x))
                      say(normalized.enabled !== false ? `${normalized.code} is active` : `${normalized.code} is paused`)
                    } catch (error) { say(error.message) }
                    finally { setSavingPromoId(null) }
                  }}
                >
                  {savingPromoId === promoId ? 'Saving…' : isPaused ? 'Enable' : 'Pause'}
                </button>

                <button
                  className="btn-del-sm"
                  style={{ background: '#F5EFEB', color: '#44403C', border: '1px solid #E5D9CE', fontWeight: 700, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                  onClick={() => {
                    setEditingId(promoId)
                    setForm({
                      code: p.code,
                      label: p.label,
                      bannerText: p.bannerText || '',
                      discount: p.discount,
                      enabled: p.enabled !== false
                    })
                    document.getElementById('promo-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}
                >
                  Edit
                </button>

                <button
                  className="btn-del-sm"
                  style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', fontWeight: 700, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                  onClick={async () => {
                    if (!confirm(`Delete promotion ${p.code}?`)) return
                    try {
                      await api(`/admin/promos/${promoId}`, { method: 'DELETE' })
                      setPromos(rows => rows.filter(x => x.id !== promoId && x._id !== promoId && x.code !== p.code))
                      say('Promotion deleted')
                    } catch (error) { say(error.message) }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 10. Paystack payments queue
function Payments() {
  const { orders, markPaid, say } = useApp()
  const [filterPay, setFilterPay] = useState('all')

  const displayedOrders = orders.filter(o => {
    if (filterPay === 'momo-pending') return o.pay === 'momo' && !o.paid
    if (filterPay === 'paid') return o.paid
    if (filterPay === 'cash') return o.pay === 'cash'
    return true
  })

  return (
    <div className="pbd-white-card">
      <div className="pbd-card-head-row">
        <div>
          <h3>Paystack Payment Queue</h3>
          <p className="muted small">Paystack confirms online payments automatically after verification.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="pbd-cat-chips">
            <button className={`branch-chip-btn ${filterPay === 'all' ? 'on' : ''}`} onClick={() => setFilterPay('all')}>
              All ({orders.length})
            </button>
            <button className={`branch-chip-btn ${filterPay === 'momo-pending' ? 'on' : ''}`} onClick={() => setFilterPay('momo-pending')}>
              Paystack Pending ({orders.filter(o => o.pay === 'momo' && !o.paid).length})
            </button>
            <button className={`branch-chip-btn ${filterPay === 'paid' ? 'on' : ''}`} onClick={() => setFilterPay('paid')}>
              Verified Paid ({orders.filter(o => o.paid).length})
            </button>
          </div>
        </div>
      </div>

      <Table
        head={['Ref #', 'Customer Name', 'Phone', 'Branch', 'Total Amount', 'Method', 'Status', 'Verification Action']}
        rows={displayedOrders.map(o => [
          <b key="r">#{o.ref}</b>,
          <strong key="c">{o.name}</strong>,
          <span key="p">{o.phone}</span>,
          <span key="b">{bn(o.branch)}</span>,
          <strong key="t">{money(o.total)}</strong>,
          <span key="m">{o.pay === 'momo' ? 'Paystack' : 'Cash on Delivery'}</span>,
          <span key="s" className={`paid-pill ${o.paid ? 'paid' : 'unpaid'}`}>
            {o.paid ? 'Verified Paid' : 'Pending Verification'}
          </span>,
          <span key="a">{o.paid ? <span className="verified-text">Provider verified</span> : <span>Awaiting provider confirmation</span>}</span>
        ])}
      />
    </div>
  )
}

// 11. Sales Analytics & Top Dishes
function Analytics() {
  const { orders } = useApp()
  const days = [
    { day: 'Mon', sales: 620 }, { day: 'Tue', sales: 740 }, { day: 'Wed', sales: 580 },
    { day: 'Thu', sales: 890 }, { day: 'Fri', sales: 1120 }, { day: 'Sat', sales: 840 }, { day: 'Sun', sales: 460 },
  ]
  const max = 1120

  const totalRev = orders.filter(o => o.paid).reduce((s, o) => s + o.total, 0)

  return (
    <div className="pbd-white-card">
      <div className="pbd-card-head-row">
        <div>
          <h3>Weekly Sales Analytics</h3>
          <p className="muted small">Revenue trends across Catholic University Annex and Sunyani Main.</p>
        </div>
        <span className="chart-week-badge">Verified Revenue: {money(totalRev)}</span>
      </div>

      <div className="pbd-chart-box">
        {days.map(d => (
          <div key={d.day} className="pbd-chart-col">
            <div className="pbd-bar-bg">
              <div className="pbd-bar-colored" style={{ height: `${(d.sales / max) * 100}%` }} />
            </div>
            <span className="pbd-col-day">{d.day}</span>
            <b className="pbd-col-val">{d.sales}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

// 12. Reviews & Feedback (Moderate, Add Review, Toggle Visible)
function Reviews() {
  const { reviews, setReviews, say, api } = useApp()
  const [reviewRows, setReviewRows] = useState([])
  const [reviewLoadStatus, setReviewLoadStatus] = useState('loading')
  const [reviewLoadError, setReviewLoadError] = useState('')
  const [pendingReviewIds, setPendingReviewIds] = useState(() => new Set())
  const [newReview, setNewReview] = useState({ who: '', stars: 5, text: '' })

  useEffect(() => {
    let cancelled = false
    const loadReviews = async () => {
      try {
        const response = await api('/admin/reviews')
        if (cancelled) return
        if (!Array.isArray(response?.reviews)) {
          const message = 'The server returned an invalid reviews list.'
          setReviewLoadError(message)
          setReviewLoadStatus('error')
          say(message, { type: 'error' })
          return
        }
        setReviewRows(response.reviews)
        setReviewLoadStatus('ready')
      } catch (error) {
        if (cancelled) return
        setReviewLoadError(error.message)
        setReviewLoadStatus('error')
        say(error.message, { type: 'error' })
      }
    }
    loadReviews()
    return () => { cancelled = true }
  }, [])

  const handleAddReview = async () => {
    if (!newReview.who.trim() || !newReview.text.trim()) return say('Please enter reviewer name and feedback')
    try {
      const { review } = await api('/admin/reviews', { method: 'POST', body: JSON.stringify({ ...newReview, stars: +newReview.stars }) })
      if (!review) throw new Error('The server did not return the new review.')
      setReviewRows(rows => [review, ...rows])
      setReviews(rows => [review, ...rows])
      setNewReview({ who: '', stars: 5, text: '' })
      say('Review added!')
    } catch (error) { say(error.message) }
  }

  const handleDeleteReview = async id => {
    if (confirm('Delete this review?')) {
      try {
        await api(`/admin/reviews/${id}`, { method: 'DELETE' })
        setReviewRows(rows => rows.filter(review => review.id !== id))
        setReviews(rows => rows.filter(review => review.id !== id))
        say('Review removed')
      } catch (error) { say(error.message) }
    }
  }

  return (
    <div className="pbd-white-card">
      <div className="pbd-card-head-row">
        <h3>Customer Testimonials & Moderation</h3>
        <span className="muted small">Control what feedback appears on customer website</span>
      </div>

      {/* Add Review Form */}
      <div className="pbd-add-meal-grid mt-2 mb-3">
        <input
          placeholder="Customer Name (e.g. Ama Mensah - CUG Student)"
          value={newReview.who}
          onChange={e => setNewReview({ ...newReview, who: e.target.value })}
          className="pbd-input"
        />
        <select
          value={newReview.stars}
          onChange={e => setNewReview({ ...newReview, stars: e.target.value })}
          className="pbd-select"
        >
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
        </select>
        <input
          placeholder="Testimonial text..."
          value={newReview.text}
          onChange={e => setNewReview({ ...newReview, text: e.target.value })}
          className="pbd-input"
        />
        <button className="btn-pbd-action" onClick={handleAddReview}>
          + Add Testimonial
        </button>
      </div>

      {reviewLoadStatus === 'loading' && <p role="status" className="muted small">Loading reviews…</p>}
      {reviewLoadStatus === 'error' && <p role="alert" className="small" style={{ color: 'var(--primary)' }}>Could not load reviews: {reviewLoadError}</p>}

      <Table
        head={['Customer / Order', 'Rating', 'Testimonial', 'Public Display', 'Actions']}
        rows={reviewLoadStatus === 'ready' ? reviewRows.map(r => [
          <div key="w"><strong>{r.who}</strong>{r.itemName && <div className="muted small">{r.itemName} · {r.orderRef}</div>}</div>,
          <span key="s" className="stars-gold">{'★'.repeat(r.stars)}</span>,
          <p key="t" className="small">{r.text}</p>,
          <label key="sw" className="pbd-switch">
            <input
              type="checkbox"
              checked={r.show}
              disabled={pendingReviewIds.has(r.id)}
              onChange={async () => {
                setPendingReviewIds(ids => new Set(ids).add(r.id))
                try {
                  const { review } = await api(`/admin/reviews/${r.id}`, { method: 'PATCH', body: JSON.stringify({ show: !r.show }) })
                  setReviewRows(rows => rows.map(item => item.id === review.id ? review : item))
                  setReviews(rows => rows.map(item => item.id === review.id ? review : item))
                  say('Review visibility updated')
                } catch (error) { say(error.message) }
                finally { setPendingReviewIds(ids => { const next = new Set(ids); next.delete(r.id); return next }) }
              }}
            />
            <span className="pbd-slider" />
          </label>,
          <button
            key="d"
            className="btn-del-sm"
            onClick={() => handleDeleteReview(r.id)}
          >
            Delete
          </button>
        ]) : []}
      />
    </div>
  )
}

// 13. Settings Tab (Official Numbers, WhatsApp, Hours, Business Identity)
function Settings() {
  const { settings, setSettings, say, api } = useApp()
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

  const [s, setS] = useState(() => ({ ...defaultSettings, ...(settings || {}) }))
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (settings) {
      setS(prev => ({ ...prev, ...settings }))
    }
    // Fetch fresh state from server
    if (api) {
      api('/admin/state')
        .then(({ state }) => {
          if (state?.settings) {
            setS(prev => ({ ...prev, ...state.settings }))
          }
        })
        .catch(() => {})
    }
  }, [settings])

  const handleSave = async (e) => {
    e?.preventDefault()
    setSaving(true)
    setSavedSuccess(false)
    try {
      if (setSettings) await setSettings(s)
      else if (api) await api('/admin/state/settings', { method: 'PUT', body: JSON.stringify({ value: s }) })
      say('Official store settings saved successfully!')
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 4000)
    } catch (err) {
      say(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Reset settings to Lady 3D official defaults?')) {
      setS(defaultSettings)
      say('Settings reset to defaults. Click Save to persist.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {savedSuccess && (
        <div style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '12px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Store settings saved successfully and live across customer and staff consoles!</span>
        </div>
      )}

      {/* Card 1: Business Identity & Schedule */}
      <div className="pbd-white-card">
        <div className="pbd-card-head-row">
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Business Identity & Operating Hours</h3>
            <span className="muted small">Brand title, working hours, and operational currency</span>
          </div>
        </div>

        <div className="pbd-settings-grid">
          <label>
            <span className="field-label-small">Business Name</span>
            <input
              value={s.businessName || ''}
              onChange={e => setS({ ...s, businessName: e.target.value })}
              className="pbd-input"
              placeholder="e.g. Lady 3D's Catering Services"
            />
          </label>

          <label>
            <span className="field-label-small">Operating Schedule / Hours</span>
            <input
              value={s.hours || ''}
              onChange={e => setS({ ...s, hours: e.target.value })}
              className="pbd-input"
              placeholder="e.g. Mon - Sat: 8:00 AM - 9:00 PM"
            />
          </label>

          <label>
            <span className="field-label-small">Currency Symbol</span>
            <input
              value={s.currency || ''}
              onChange={e => setS({ ...s, currency: e.target.value })}
              className="pbd-input"
              placeholder="GH₵"
            />
          </label>

          <label>
            <span className="field-label-small">Support / Inquiries Email</span>
            <input
              type="email"
              value={s.supportEmail || ''}
              onChange={e => setS({ ...s, supportEmail: e.target.value })}
              className="pbd-input"
              placeholder="e.g. info@lady3d.com"
            />
          </label>

          <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={s.orderNotificationSound !== false}
              onChange={e => setS({ ...s, orderNotificationSound: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#80141b', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
              Enable Kitchen Order Chime / Alert Sound (Dual-tone ding-dong on incoming orders)
            </span>
          </label>
        </div>
      </div>

      {/* Card 2: Branch WhatsApp Hotlines & Physical Addresses */}
      <div className="pbd-white-card">
        <div className="pbd-card-head-row">
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Branch WhatsApp Hotlines & Locations</h3>
            <span className="muted small">These numbers power the 1-tap WhatsApp Kitchen Order Dispatch & receipt routing</span>
          </div>
        </div>

        <div className="pbd-settings-grid">
          <label>
            <span className="field-label-small">Catholic University Annex (CUG) WhatsApp</span>
            <input
              value={s.cugWhatsapp || ''}
              onChange={e => setS({ ...s, cugWhatsapp: e.target.value })}
              className="pbd-input"
              placeholder="053 129 9243"
            />
          </label>

          <label>
            <span className="field-label-small">CUG Campus Location / Address</span>
            <input
              value={s.cugAddress || ''}
              onChange={e => setS({ ...s, cugAddress: e.target.value })}
              className="pbd-input"
              placeholder="Fiapre Campus, Catholic University of Ghana"
            />
          </label>

          <label>
            <span className="field-label-small">Sunyani Main Branch WhatsApp</span>
            <input
              value={s.sunyaniWhatsapp || ''}
              onChange={e => setS({ ...s, sunyaniWhatsapp: e.target.value })}
              className="pbd-input"
              placeholder="053 129 9243"
            />
          </label>

          <label>
            <span className="field-label-small">Sunyani Main Location / Address</span>
            <input
              value={s.sunyaniAddress || ''}
              onChange={e => setS({ ...s, sunyaniAddress: e.target.value })}
              className="pbd-input"
              placeholder="Market Circle / Main Road, Sunyani"
            />
          </label>
        </div>
      </div>

      {/* Card 3: Direct Phone & Event Booking Lines */}
      <div className="pbd-white-card">
        <div className="pbd-card-head-row">
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Catering Bookings & General Enquiries</h3>
            <span className="muted small">Phone lines displayed on customer checkout receipts and footer</span>
          </div>
        </div>

        <div className="pbd-settings-grid">
          <label>
            <span className="field-label-small">Catering Bookings Line</span>
            <input
              value={s.cateringPhone || ''}
              onChange={e => setS({ ...s, cateringPhone: e.target.value })}
              className="pbd-input"
              placeholder="024 465 0474"
            />
          </label>

          <label>
            <span className="field-label-small">General Phone Line</span>
            <input
              value={s.generalPhone || ''}
              onChange={e => setS({ ...s, generalPhone: e.target.value })}
              className="pbd-input"
              placeholder="027 691 3089"
            />
          </label>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pbd-white-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button
          type="button"
          className="btn-del-sm"
          onClick={handleReset}
          style={{ background: '#F5EFEB', color: '#57534E', border: '1px solid #E5D9CE', padding: '10px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
        >
          Reset to Defaults
        </button>

        <button
          type="button"
          className="btn-pbd-action"
          disabled={saving}
          onClick={handleSave}
          style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 800, borderRadius: '8px', cursor: 'pointer' }}
        >
          {saving ? 'Saving Settings…' : 'Save Business Settings'}
        </button>
      </div>

    </div>
  )
}

// Branch Consoles Directory for Admin
function BranchConsoleDirectory() {
  const { orders, settings } = useApp()
  const cugOrders = orders.filter(o => o.branch === 'cug' && o.status < 4)
  const sunyaniOrders = orders.filter(o => o.branch === 'sunyani' && o.status < 4)

  return (
    <div className="pbd-white-card">
      <div className="pbd-card-head-row">
        <div>
          <h3>Branch Operations Consoles</h3>
          <p className="muted small">
            Open dedicated branch consoles. Each branch console has a static sidebar and is locked strictly to that branch.
          </p>
        </div>
      </div>

      <div className="branch-consoles-cards-grid mt-3">
        {/* Sunyani Main Branch Card */}
        <div className="branch-console-card">
          <div className="console-card-top">
            <span className="branch-pill-tag">Market Circle</span>
            <span className="branch-active-count">{sunyaniOrders.length} Active Tickets</span>
          </div>
          <div className="console-photo-frame">
            <img src="/main-branch-signboard.jpg" alt="Sunyani Main Branch" className="console-img" />
          </div>
          <div className="console-meta">
            <h4>Sunyani (Main Branch)</h4>
            <p className="small muted">{settings?.sunyaniAddress || 'Market Circle / Main Road, Sunyani'}</p>
            <p className="small">WhatsApp Kitchen: <b>{settings?.sunyaniWhatsapp || '053 129 9243'}</b></p>
            <div className="console-badges-row">
              <span className="badge-chip">Local & Continental Dishes</span>
              <span className="badge-chip">Counter POS</span>
              <span className="badge-chip">Sunyani Only (Locked)</span>
            </div>
          </div>
          <Link to="/branch/sunyani" className="btn-open-console">
            Open Sunyani Branch Console →
          </Link>
        </div>

        {/* Catholic University Campus Annex Card */}
        <div className="branch-console-card">
          <div className="console-card-top">
            <span className="branch-pill-tag">Fiapre Campus</span>
            <span className="branch-active-count">{cugOrders.length} Active Tickets</span>
          </div>
          <div className="console-photo-frame">
            <img src="/campus-branch-flyer.jpg" alt="Catholic University Annex" className="console-img" />
          </div>
          <div className="console-meta">
            <h4>Catholic University (Campus Annex)</h4>
            <p className="small muted">{settings?.cugAddress || 'Fiapre Campus, Catholic University of Ghana, Sunyani'}</p>
            <p className="small">WhatsApp Kitchen: <b>{settings?.cugWhatsapp || '053 129 9243'}</b></p>
            <div className="console-badges-row">
              <span className="badge-chip">Student & Faculty Packs</span>
              <span className="badge-chip">Campus Delivery</span>
              <span className="badge-chip">CUG Only (Locked)</span>
            </div>
          </div>
          <Link to="/branch/cug" className="btn-open-console">
            Open Catholic University Console →
          </Link>
        </div>
      </div>
    </div>
  )
}

// All Tab Views Directory
const VIEWS = {
  overview: Overview,
  orders: Orders,
  delivery: DeliveryDashboard,
  inventory: KitchenDashboard,
  'branch-dashboards': BranchConsoleDirectory,
  menu: MenuAdmin,
  categories: Categories,
  branches: Branches,
  customers: Customers,
  loyalty: Loyalty,
  promos: Promos,
  payments: Payments,
  analytics: Analytics,
  reviews: Reviews,
  staff: Staff,
  settings: Settings
}

// Main Admin Component with Red & White Theme + Logout functionality
export default function Admin({ section = 'overview' }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { role, staffUser, staffLogout, say } = useApp()
  const allowed = (ROLES[role] || []).includes(section)
  const ActiveView = VIEWS[section] || Overview

  const handleLogout = () => {
    staffLogout().then(() => { say('Signed out from Admin portal'); go('/staff-login') }).catch(error => say(error.message))
  }

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
              <span className="pbd-brand-sub-text">CATERING SERVICES</span>
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

          {/* Navigation Links with Red & White Theme */}
          <nav className="pbd-nav-list">
            {ADMIN_NAV.map(([k, n]) => {
              const isActive = k === section
              const isAccessible = (ROLES[role] || []).includes(k)
              return (
                <Link
                  key={k}
                  to={`/admin/${k}`}
                  className={`pbd-nav-item ${isActive ? 'active' : ''} ${!isAccessible ? 'disabled' : ''}`}
                >
                  <span className="pbd-nav-icon">
                    <NavIcon name={k} />
                  </span>
                  <span className="pbd-nav-label">{n}</span>
                </Link>
              )
            })}
          </nav>

          {/* Bottom Profile Pill & Logout */}
          <div className="pbd-sidebar-bottom">
            <div className="pbd-user-profile-pill">
              <div className="pbd-profile-avatar-wrap">
                <img
                  src="/lady3d-logo.jpg"
                  alt="Lady 3D"
                  className="pbd-profile-avatar"
                />
                <span className="pbd-green-dot" />
              </div>
              <div className="pbd-profile-info">
                <span className="pbd-user-name">Lady 3D</span>
                <span className="pbd-user-status">Online · {role}</span>
              </div>
            </div>

            {/* Actions: Customer App & Logout Button */}
            <div className="pbd-sidebar-actions-stack">
              <Link to="/" className="pbd-back-customer-link">
                ← Customer App
              </Link>
              <button
                className="pbd-logout-btn"
                onClick={handleLogout}
                title="Log out of Admin"
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

        {/* Panel 2: Center White Main Content */}
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
              <h1 className="pbd-page-heading">
                {ADMIN_NAV.find(n => n[0] === section)?.[1] || 'Dashboard'}
              </h1>
            </div>

            <div className="pbd-header-right">
              <span className="pbd-role-pill">Signed in: {staffUser?.name} · {role}</span>

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
            {allowed ? (
              <ActiveView />
            ) : (
              <div className="pbd-restricted-box">
                <h3>Access Restricted</h3>
                <p>Your current role ({role}) does not have permission to access this section.</p>
                <Link to="/staff-login" className="btn-pbd-action">Sign in with an authorized role</Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
