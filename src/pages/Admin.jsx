import { useState, useEffect, useRef } from 'react'
import { money, useApp, go } from '../store.jsx'
import { Link } from '../components/ui.jsx'
import { ADMIN_NAV, BRANCHES, ROLES, STATUSES, getBranchWhatsApp, buildOrderWhatsAppUrl } from '../data.js'
import BranchDashboard from './BranchDashboard.jsx'

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
  const rev = orders.filter(o => o.status === 4).reduce((s, o) => s + o.total, 0)
  const totalMeals = orders.length || 45

  // Donut data with signature brand colors
  const donutData = [
    { label: 'Ready for Pickup', val: ready.length || 10, color: '#22C55E' },
    { label: 'Cooking on Stove', val: cooking.length || 20, color: '#3B82F6' },
    { label: 'Confirmed / Queued', val: confirmed.length || 7, color: '#EAB308' },
    { label: 'New / Received', val: newOrders.length || 8, color: '#80141B' },
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
            <span className="pbd-kpi-tag">Orders Today</span>
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
          <span className="pbd-card-subtitle">{totalMeals} meals processed</span>
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
                <div className="pbd-bar-fill green" style={{ width: `${Math.round(((ready.length || 10) / totalMeals) * 100)}%` }} />
              </div>
              <b className="pbd-row-count">{ready.length || 10}</b>
            </div>

            <div className="pbd-progress-row">
              <div className="pbd-row-label">
                <span className="pbd-color-dot blue" />
                <span className="pbd-lbl-name">Cooking on Stove</span>
              </div>
              <div className="pbd-bar-track">
                <div className="pbd-bar-fill blue" style={{ width: `${Math.round(((cooking.length || 20) / totalMeals) * 100)}%` }} />
              </div>
              <b className="pbd-row-count">{cooking.length || 20}</b>
            </div>

            <div className="pbd-progress-row">
              <div className="pbd-row-label">
                <span className="pbd-color-dot yellow" />
                <span className="pbd-lbl-name">Confirmed / Queued</span>
              </div>
              <div className="pbd-bar-track">
                <div className="pbd-bar-fill yellow" style={{ width: `${Math.round(((confirmed.length || 7) / totalMeals) * 100)}%` }} />
              </div>
              <b className="pbd-row-count">{confirmed.length || 7}</b>
            </div>

            <div className="pbd-progress-row">
              <div className="pbd-row-label">
                <span className="pbd-color-dot red" />
                <span className="pbd-lbl-name">New / Received</span>
              </div>
              <div className="pbd-bar-track">
                <div className="pbd-bar-fill red" style={{ width: `${Math.round(((newOrders.length || 8) / totalMeals) * 100)}%` }} />
              </div>
              <b className="pbd-row-count">{newOrders.length || 8}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 2. Kitchen & Orders (Kanban + Branch Tabs + Search + Audio Alert + 1-Tap WhatsApp Dispatch)
function Orders() {
  const { orders, setStatus, markPaid, say } = useApp()
  const [branchFilter, setBranchFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [searchVal, setSearchVal] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
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

  const branchFiltered = orders.filter(o => branchFilter === 'all' || o.branch === branchFilter)
  const displayedOrders = branchFiltered.filter(o => {
    let matchesStatus = true
    if (statusFilter === 'active') matchesStatus = o.status < 4
    else if (statusFilter === 'all') matchesStatus = true
    else matchesStatus = o.status === +statusFilter

    const q = searchVal.trim().toLowerCase()
    const matchesSearch = !q || 
      o.ref.toLowerCase().includes(q) ||
      o.name.toLowerCase().includes(q) ||
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
            All Branches ({orders.length})
          </button>
          <button className={`branch-chip-btn ${branchFilter === 'cug' ? 'on' : ''}`} onClick={() => setBranchFilter('cug')}>
            Catholic University ({orders.filter(o => o.branch === 'cug').length})
          </button>
          <button className={`branch-chip-btn ${branchFilter === 'sunyani' ? 'on' : ''}`} onClick={() => setBranchFilter('sunyani')}>
            Sunyani Main ({orders.filter(o => o.branch === 'sunyani').length})
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
        {displayedOrders.map(o => {
          const stInfo = getStatusColor(o.status)
          const targetBranch = branchObj(o.branch)
          const dispatchWhatsAppUrl = buildOrderWhatsAppUrl(o)

          return (
            <div key={o.ref} className={`pbd-order-card status-border-${o.status}`}>
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
                  <button className="btn-momo-pay" onClick={() => { markPaid(o.ref); say(`Order #${o.ref} marked paid`) }}>
                    Confirm MoMo
                  </button>
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
                {o.status < 4 ? (
                  <button
                    className="btn-pbd-advance"
                    onClick={() => { setStatus(o.ref, o.status + 1); say(`Moved to ${getStatusObj(o.status + 1).label}`) }}
                  >
                    {getNextActionLabel(o.status)}
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
  const { menu, setMenu, cats, say } = useApp()
  const [n, setN] = useState({ name: '', price: '', cat: cats[0] || 'Local Dishes', img: '', desc: '', availCug: true, availSunyani: true })
  const [filterCat, setFilterCat] = useState('All')
  const [searchMeal, setSearchMeal] = useState('')

  const handleAdd = () => {
    if (!n.name.trim() || !n.price) return say('Please enter food name and price')
    const newMeal = {
      id: Date.now(),
      name: n.name.trim(),
      cat: n.cat,
      price: +n.price,
      img: n.img.trim() || 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
      desc: n.desc.trim() || 'Freshly prepared meal with authentic Ghanaian spices',
      avail: { cug: n.availCug, sunyani: n.availSunyani },
      prices: {}
    }
    setMenu([newMeal, ...menu])
    setN({ name: '', price: '', cat: cats[0] || 'Local Dishes', img: '', desc: '', availCug: true, availSunyani: true })
    say(`Dish "${newMeal.name}" added to menu successfully!`)
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

          <button className="btn-pbd-action" onClick={handleAdd}>
            + Add Food to Menu
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

          <input
            type="text"
            placeholder="Search meals..."
            value={searchMeal}
            onChange={e => setSearchMeal(e.target.value)}
            className="pbd-search-input"
          />
        </div>

        <Table
          head={['Dish Photo', 'Meal Name & Description', 'Category', 'Price (GH₵)', 'Availability', 'Actions']}
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
            <div key="p" className="inline-price-cell">
              <span>GH₵</span>
              <input
                type="number"
                className="pbd-mini-input"
                value={m.price}
                onChange={e => setMenu(menu.map(x => x.id === m.id ? { ...x, price: +e.target.value } : x))}
              />
            </div>,
            <div key="av" className="avail-badges-row">
              <span className={`avail-tag ${m.avail?.cug ? 'active' : ''}`}>CUG</span>
              <span className={`avail-tag ${m.avail?.sunyani ? 'active' : ''}`}>Sunyani</span>
            </div>,
            <button
              key="d"
              className="btn-del-sm"
              onClick={() => {
                if (confirm(`Remove "${m.name}" from the menu?`)) {
                  setMenu(menu.filter(x => x.id !== m.id))
                  say(`Dish "${m.name}" deleted`)
                }
              }}
            >
              Delete
            </button>
          ])}
        />
      </div>
    </div>
  )
}

// 4. Categories Management Tab (Dedicated)
function Categories() {
  const { cats, setCats, menu, say } = useApp()
  const [newCat, setNewCat] = useState('')

  const handleAddCat = () => {
    if (!newCat.trim()) return say('Enter a category name')
    if (cats.includes(newCat.trim())) return say('Category already exists')
    setCats([...cats, newCat.trim()])
    setNewCat('')
    say(`Category "${newCat.trim()}" added!`)
  }

  const handleDeleteCat = (c) => {
    if (confirm(`Delete category "${c}"? Items in it will need reassignment.`)) {
      setCats(cats.filter(x => x !== c))
      say(`Category "${c}" removed`)
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
  const { customers, setCustomers, say } = useApp()
  const [newCust, setNewCust] = useState({ name: '', phone: '', branch: 'cug', points: 10, status: 'Regular' })
  const [searchCust, setSearchCust] = useState('')

  const handleAddCustomer = () => {
    if (!newCust.name.trim() || !newCust.phone.trim()) return say('Please enter customer name and phone')
    const added = {
      id: Date.now(),
      name: newCust.name.trim(),
      phone: newCust.phone.trim(),
      branch: newCust.branch,
      ordersCount: 1,
      spent: 35,
      points: +newCust.points || 0,
      status: newCust.status
    }
    setCustomers([added, ...customers])
    setNewCust({ name: '', phone: '', branch: 'cug', points: 10, status: 'Regular' })
    say(`Customer "${added.name}" registered!`)
  }

  const handleAdjustPoints = (id, delta) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, points: Math.max(0, c.points + delta) } : c))
    say(`Points updated (${delta > 0 ? '+' : ''}${delta})`)
  }

  const handleDeleteCust = (id, name) => {
    if (confirm(`Remove customer "${name}"?`)) {
      setCustomers(customers.filter(c => c.id !== id))
      say(`Removed ${name}`)
    }
  }

  const filtered = customers.filter(c => 
    !searchCust ||
    c.name.toLowerCase().includes(searchCust.toLowerCase()) ||
    c.phone.includes(searchCust)
  )

  return (
    <div className="pbd-white-card">
      <div className="pbd-card-head-row">
        <div>
          <h3>Registered Customers & Loyalty Club Directory</h3>
          <p className="muted small">Manage food club points, preferred campus branches, and direct communication.</p>
        </div>
      </div>

      {/* Add Customer Card */}
      <div className="pbd-add-meal-grid mt-2 mb-3">
        <input
          placeholder="Customer Name"
          value={newCust.name}
          onChange={e => setNewCust({ ...newCust, name: e.target.value })}
          className="pbd-input"
        />
        <input
          placeholder="Phone (e.g. 024 123 4567)"
          value={newCust.phone}
          onChange={e => setNewCust({ ...newCust, phone: e.target.value })}
          className="pbd-input"
        />
        <select
          value={newCust.branch}
          onChange={e => setNewCust({ ...newCust, branch: e.target.value })}
          className="pbd-select"
        >
          <option value="cug">Catholic University (Annex)</option>
          <option value="sunyani">Sunyani Main Branch</option>
        </select>
        <select
          value={newCust.status}
          onChange={e => setNewCust({ ...newCust, status: e.target.value })}
          className="pbd-select"
        >
          <option value="Regular">Regular</option>
          <option value="VIP Member">VIP Member</option>
          <option value="New Customer">New Customer</option>
        </select>
        <button className="btn-pbd-action" onClick={handleAddCustomer}>
          + Register Customer
        </button>
      </div>

      <div className="mb-2">
        <input
          type="text"
          placeholder="Search by customer name or phone..."
          value={searchCust}
          onChange={e => setSearchCust(e.target.value)}
          className="pbd-search-input"
        />
      </div>

      <Table
        head={['Customer Name', 'Phone', 'Branch', 'Orders', 'Points Balance', 'Member Tier', 'WhatsApp', 'Actions']}
        rows={filtered.map(c => [
          <strong key="n">{c.name}</strong>,
          <span key="p">{c.phone}</span>,
          <span key="b" className={`branch-pill-sm ${c.branch}`}>{bn(c.branch)}</span>,
          <b key="o">{c.ordersCount}</b>,
          <div key="pt" className="inline-points-editor">
            <button className="btn-pts-adjust" onClick={() => handleAdjustPoints(c.id, -5)} title="Deduct 5 points">-5</button>
            <span className="points-badge-gold">{c.points} pts</span>
            <button className="btn-pts-adjust" onClick={() => handleAdjustPoints(c.id, 5)} title="Award 5 points">+5</button>
          </div>,
          <span key="t" className="vip-tag">{c.status}</span>,
          <a
            key="w"
            href={`https://wa.me/${c.phone.replace(/\D/g, '').replace(/^0/, '233')}?text=Hello%20${c.name},%20greetings%20from%20Lady%203D's%20Catering!`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-wa-link"
          >
            Message
          </a>,
          <button key="d" className="btn-del-sm" onClick={() => handleDeleteCust(c.id, c.name)}>
            Delete
          </button>
        ])}
      />
    </div>
  )
}

// 7. Staff & Roles Management Tab (Adding Staff, Changing Roles, View As)
function Staff() {
  const { staff, setStaff, role, setRole, say } = useApp()
  const [newStaff, setNewStaff] = useState({ name: '', role: 'Cashier', branch: 'cug', phone: '' })

  const handleAddStaff = () => {
    if (!newStaff.name.trim() || !newStaff.phone.trim()) return say('Please enter staff name and phone')
    const added = {
      id: Date.now(),
      name: newStaff.name.trim(),
      role: newStaff.role,
      branch: newStaff.branch,
      phone: newStaff.phone.trim(),
      active: true
    }
    setStaff([...staff, added])
    setNewStaff({ name: '', role: 'Cashier', branch: 'cug', phone: '' })
    say(`Staff member "${added.name}" added as ${added.role}!`)
  }

  const handleDeleteStaff = (id, name) => {
    if (confirm(`Remove staff member "${name}"?`)) {
      setStaff(staff.filter(s => s.id !== id))
      say(`Removed ${name}`)
    }
  }

  const handleToggleActive = (id) => {
    setStaff(staff.map(s => s.id === id ? { ...s, active: !s.active } : s))
    say('Staff status updated')
  }

  return (
    <div className="pbd-white-card">
      <div className="pbd-card-head-row">
        <div>
          <h3>Staff Roster & Permissions Management</h3>
          <p className="muted small">Add staff members, assign kitchen roles, and simulate role permissions.</p>
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
          />
        </label>

        <label>
          <span className="field-label-small">Assigned Role *</span>
          <select
            value={newStaff.role}
            onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
            className="pbd-select"
          >
            {Object.keys(ROLES).map(r => <option key={r} value={r}>{r}</option>)}
            <option value="Kitchen Chef">Kitchen Chef</option>
          </select>
        </label>

        <label>
          <span className="field-label-small">Branch</span>
          <select
            value={newStaff.branch}
            onChange={e => setNewStaff({ ...newStaff, branch: e.target.value })}
            className="pbd-select"
          >
            <option value="all">All Branches</option>
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
          />
        </label>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn-pbd-action full-width" onClick={handleAddStaff}>
            + Add Staff Member
          </button>
        </div>
      </div>

      <Table
        head={['Staff Member', 'Role', 'Assigned Branch', 'Contact Phone', 'Active Status', 'Simulate View', 'Actions']}
        rows={staff.map(s => [
          <strong key="n">{s.name}</strong>,
          <span key="r" className="role-tag-badge">{s.role}</span>,
          <span key="b">{s.branch === 'all' ? 'All Branches' : bn(s.branch)}</span>,
          <span key="p">{s.phone}</span>,
          <label key="act" className="pbd-switch">
            <input
              type="checkbox"
              checked={s.active}
              onChange={() => handleToggleActive(s.id)}
            />
            <span className="pbd-slider" />
          </label>,
          <button
            key="v"
            className={`btn-sound-small ${role === s.role ? 'on' : ''}`}
            onClick={() => {
              setRole(s.role in ROLES ? s.role : 'Cashier')
              say(`Now viewing dashboard as ${s.role}`)
            }}
          >
            {role === s.role ? 'Currently Viewing' : `View as ${s.role}`}
          </button>,
          <button
            key="d"
            className="btn-del-sm"
            onClick={() => handleDeleteStaff(s.id, s.name)}
          >
            Delete
          </button>
        ])}
      />
    </div>
  )
}

// 8. Loyalty & Rewards Engine (Rules Configuration & Reward Tiers)
function Loyalty() {
  const { loyaltyRules, setLoyaltyRules, say } = useApp()
  const [rules, setRules] = useState(loyaltyRules)

  const handleSave = () => {
    setLoyaltyRules(rules)
    say('Loyalty & reward rules saved!')
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
            value={rules.spendPerPoint}
            onChange={e => setRules({ ...rules, spendPerPoint: +e.target.value })}
            className="pbd-input"
          />
        </label>

        <label>
          <span>Points Required for Free Plate</span>
          <input
            type="number"
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

      <button className="btn-pbd-action mt-3" onClick={handleSave}>
        Save Rules Configuration
      </button>
    </div>
  )
}

// 9. Promotions & Vouchers
function Promos() {
  const { promos, setPromos, say } = useApp()
  const [t, setT] = useState('')

  return (
    <div className="pbd-white-card">
      <div className="pbd-card-head-row">
        <h3>Promotions & Banner Codes</h3>
        <span className="muted small">Manage homepage announcements & student discount banners</span>
      </div>

      <div className="row gap mt-2">
        <input
          placeholder="Promo Banner (e.g. CUG Exam Week: 10% off with code STUDENT10)"
          value={t}
          onChange={e => setT(e.target.value)}
          className="pbd-input flex-grow"
        />
        <button
          className="btn-pbd-action"
          onClick={() => {
            if (t.trim()) {
              setPromos([...promos, { id: Date.now(), name: t.trim(), on: true }])
              setT('')
              say('Promotion banner added!')
            }
          }}
        >
          + Add Banner
        </button>
      </div>

      <div className="pbd-promos-list mt-3">
        {promos.map(p => (
          <div key={p.id} className="pbd-promo-item">
            <strong>{p.name}</strong>
            <div className="row gap align-center">
              <label className="pbd-switch">
                <input
                  type="checkbox"
                  checked={p.on}
                  onChange={() => setPromos(promos.map(x => x.id === p.id ? { ...x, on: !x.on } : x))}
                />
                <span className="pbd-slider" />
              </label>
              <button
                className="btn-del-sm"
                onClick={() => {
                  setPromos(promos.filter(x => x.id !== p.id))
                  say('Promotion deleted')
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 10. MoMo Payments Queue (Reconcile, Verify, Manual Cash/MoMo)
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
          <h3>Mobile Money (MoMo) Reconciliation Queue</h3>
          <p className="muted small">Match incoming customer MTN MoMo & Telecel payments.</p>
        </div>

        <div className="pbd-cat-chips">
          <button className={`branch-chip-btn ${filterPay === 'all' ? 'on' : ''}`} onClick={() => setFilterPay('all')}>
            All ({orders.length})
          </button>
          <button className={`branch-chip-btn ${filterPay === 'momo-pending' ? 'on' : ''}`} onClick={() => setFilterPay('momo-pending')}>
            MoMo Pending ({orders.filter(o => o.pay === 'momo' && !o.paid).length})
          </button>
          <button className={`branch-chip-btn ${filterPay === 'paid' ? 'on' : ''}`} onClick={() => setFilterPay('paid')}>
            Verified Paid ({orders.filter(o => o.paid).length})
          </button>
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
          <span key="m">{o.pay === 'momo' ? 'MTN MoMo' : 'Cash on Delivery'}</span>,
          <span key="s" className={`paid-pill ${o.paid ? 'paid' : 'unpaid'}`}>
            {o.paid ? 'Verified Paid' : 'Pending Verification'}
          </span>,
          <span key="a">
            {!o.paid ? (
              <button
                className="btn-momo-pay"
                onClick={() => {
                  markPaid(o.ref)
                  say(`Order #${o.ref} marked verified & paid!`)
                }}
              >
                Mark Paid ✓
              </button>
            ) : (
              <span className="verified-text">Verified</span>
            )}
          </span>
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
  const { reviews, setReviews, say } = useApp()
  const [newReview, setNewReview] = useState({ who: '', stars: 5, text: '' })

  const handleAddReview = () => {
    if (!newReview.who.trim() || !newReview.text.trim()) return say('Please enter reviewer name and feedback')
    const added = {
      id: Date.now(),
      who: newReview.who.trim(),
      stars: +newReview.stars,
      text: newReview.text.trim(),
      show: true,
      time: 'Just now'
    }
    setReviews([added, ...reviews])
    setNewReview({ who: '', stars: 5, text: '' })
    say('Review added!')
  }

  const handleDeleteReview = (id) => {
    if (confirm('Delete this review?')) {
      setReviews(reviews.filter(r => r.id !== id))
      say('Review removed')
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

      <Table
        head={['Customer Name', 'Rating', 'Testimonial', 'Public Display', 'Actions']}
        rows={reviews.map(r => [
          <strong key="w">{r.who}</strong>,
          <span key="s" className="stars-gold">{'★'.repeat(r.stars)}</span>,
          <p key="t" className="small">{r.text}</p>,
          <label key="sw" className="pbd-switch">
            <input
              type="checkbox"
              checked={r.show}
              onChange={() => {
                setReviews(reviews.map(x => x.id === r.id ? { ...x, show: !x.show } : x))
                say(`Review visibility updated`)
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
        ])}
      />
    </div>
  )
}

// 13. Settings Tab (Official Numbers, WhatsApp, Hours)
function Settings() {
  const { settings, setSettings, say } = useApp()
  const [s, setS] = useState(settings)

  const handleSave = () => {
    setSettings(s)
    say('Official store settings saved successfully!')
  }

  return (
    <div className="pbd-white-card">
      <div className="pbd-card-head-row">
        <h3>Branch Hotlines & Official Contacts</h3>
        <span className="muted small">These numbers power the 1-tap WhatsApp Kitchen Dispatch</span>
      </div>

      <div className="pbd-settings-grid">
        <label>
          <span>Business Name</span>
          <input
            value={s.businessName}
            onChange={e => setS({ ...s, businessName: e.target.value })}
            className="pbd-input"
          />
        </label>
        <label>
          <span>Catholic University Annex WhatsApp</span>
          <input
            value={s.cugWhatsapp}
            onChange={e => setS({ ...s, cugWhatsapp: e.target.value })}
            className="pbd-input"
          />
        </label>
        <label>
          <span>Sunyani Main Branch WhatsApp</span>
          <input
            value={s.sunyaniWhatsapp}
            onChange={e => setS({ ...s, sunyaniWhatsapp: e.target.value })}
            className="pbd-input"
          />
        </label>
        <label>
          <span>Catering Bookings Line</span>
          <input
            value={s.cateringPhone}
            onChange={e => setS({ ...s, cateringPhone: e.target.value })}
            className="pbd-input"
          />
        </label>
        <label>
          <span>General Phone Line</span>
          <input
            value={s.generalPhone}
            onChange={e => setS({ ...s, generalPhone: e.target.value })}
            className="pbd-input"
          />
        </label>
        <label>
          <span>Operating Hours</span>
          <input
            value={s.hours}
            onChange={e => setS({ ...s, hours: e.target.value })}
            className="pbd-input"
          />
        </label>
      </div>

      <button className="btn-pbd-action mt-3" onClick={handleSave}>
        Save Business Settings
      </button>
    </div>
  )
}

// Branch Consoles Directory for Admin
function BranchConsoleDirectory() {
  const { orders } = useApp()
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
            <p className="small muted">Market Circle / Main Road, Sunyani</p>
            <p className="small">WhatsApp Kitchen: <b>053 129 9243</b></p>
            <div className="console-badges-row">
              <span className="badge-chip">Local & Continental Dishes</span>
              <span className="badge-chip">Counter POS</span>
              <span className="badge-chip">🔒 Sunyani Only (Locked)</span>
            </div>
          </div>
          <a href="#/branch/sunyani" className="btn-open-console">
            Open Sunyani Branch Console →
          </a>
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
            <p className="small muted">Fiapre Campus, Catholic University of Ghana, Sunyani</p>
            <p className="small">WhatsApp Kitchen: <b>053 129 9243</b></p>
            <div className="console-badges-row">
              <span className="badge-chip">Student & Faculty Packs</span>
              <span className="badge-chip">Campus Delivery</span>
              <span className="badge-chip">🔒 CUG Only (Locked)</span>
            </div>
          </div>
          <a href="#/branch/cug" className="btn-open-console">
            Open Catholic University Console →
          </a>
        </div>
      </div>
    </div>
  )
}

// All Tab Views Directory
const VIEWS = {
  overview: Overview,
  orders: Orders,
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

// Right Activity Panel Component
function RightActivityPanel() {
  const { orders } = useApp()

  return (
    <aside className="pbd-activity-panel">
      <div className="pbd-activity-header">
        <h3 className="pbd-activity-title">Live Kitchen Feed</h3>
      </div>

      {/* Upcoming Deliveries & Pickups */}
      <div className="pbd-activity-section">
        <div className="pbd-subhead-row">
          <span className="pbd-subhead-title">Upcoming pickups</span>
          <Link to="/admin/orders" className="pbd-view-all">View all</Link>
        </div>

        <div className="pbd-activity-card">
          <div className="pbd-date-box">
            <span className="pbd-date-num">13</span>
            <span className="pbd-date-mo">MAY</span>
          </div>
          <div className="pbd-act-meta">
            <h4 className="pbd-act-title">Waakye Special</h4>
            <span className="pbd-act-time">1:00 PM – 1:30 PM • Mary Rose</span>
          </div>
        </div>

        <div className="pbd-activity-card">
          <div className="pbd-date-box">
            <span className="pbd-date-num">5</span>
            <span className="pbd-date-mo">APR</span>
          </div>
          <div className="pbd-act-meta">
            <h4 className="pbd-act-title">Jollof & Chicken Pack</h4>
            <span className="pbd-act-time">4:00 PM – 4:30 PM • Jerome Brown</span>
          </div>
        </div>
      </div>

      {/* Upcoming Campus Orders */}
      <div className="pbd-activity-section">
        <div className="pbd-subhead-row">
          <span className="pbd-subhead-title">Campus deliveries</span>
          <Link to="/admin/orders" className="pbd-view-all">View all</Link>
        </div>

        <div className="pbd-activity-card">
          <div className="pbd-date-box">
            <span className="pbd-date-num">10</span>
            <span className="pbd-date-mo">MAY</span>
          </div>
          <div className="pbd-act-meta">
            <h4 className="pbd-act-title">Hall 2 Annex (CUG)</h4>
            <span className="pbd-act-time">3:00 PM – 3:30 PM</span>
          </div>
        </div>

        <div className="pbd-activity-card">
          <div className="pbd-date-box">
            <span className="pbd-date-num">12</span>
            <span className="pbd-date-mo">MAY</span>
          </div>
          <div className="pbd-act-meta">
            <h4 className="pbd-act-title">Faculty Room 4</h4>
            <span className="pbd-act-time">12:00 PM – 12:30 PM</span>
          </div>
        </div>
      </div>

      {/* Latest Shoutouts / MoMo */}
      <div className="pbd-activity-section">
        <div className="pbd-subhead-row">
          <span className="pbd-subhead-title">Latest shoutouts</span>
          <Link to="/admin/reviews" className="pbd-view-all">View all</Link>
        </div>

        <div className="pbd-shoutout-card">
          <div className="pbd-avatar-wrap">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80" alt="Adam" className="pbd-avatar-img" />
            <span className="pbd-green-dot" />
          </div>
          <div className="pbd-shout-meta">
            <strong>Adam Willson</strong>
            <p>Sent MoMo GH₵ 60 for Waakye</p>
          </div>
        </div>

        <div className="pbd-shoutout-card">
          <div className="pbd-avatar-wrap">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" alt="Johnny" className="pbd-avatar-img" />
            <span className="pbd-green-dot" />
          </div>
          <div className="pbd-shout-meta">
            <strong>Johnny Fox</strong>
            <p>Rated 5★ for Fried Fish</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// Main Admin Component with Red & White Theme + Logout functionality
export default function Admin({ section = 'overview' }) {
  const { role, setRole, logoutUser, say } = useApp()
  const allowed = (ROLES[role] || ROLES.Owner).includes(section)
  const ActiveView = VIEWS[section] || Overview

  const handleLogout = () => {
    logoutUser()
    say('Signed out from Admin portal')
    go('/login')
  }

  return (
    <div className="pbd-canvas-wrapper">
      <div className="pbd-dashboard-shell">
        {/* Panel 1: Left Signature Red Sidebar */}
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
          </div>

          {/* Navigation Links with Red & White Theme */}
          <nav className="pbd-nav-list">
            {ADMIN_NAV.map(([k, n]) => {
              const isActive = k === section
              const isAccessible = (ROLES[role] || ROLES.Owner).includes(k)
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

        {/* Panel 2: Center White Main Content */}
        <main className="pbd-main-content">
          <header className="pbd-content-header">
            <h1 className="pbd-page-heading">
              {ADMIN_NAV.find(n => n[0] === section)?.[1] || 'Dashboard'}
            </h1>

            <div className="pbd-header-right">
              <label className="pbd-role-pill">
                <span>View as:</span>
                <select value={role} onChange={e => setRole(e.target.value)}>
                  {Object.keys(ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>

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
                <button className="btn-pbd-action" onClick={() => setRole('Owner')}>Switch to Owner</button>
              </div>
            )}
          </div>
        </main>

        {/* Panel 3: Right Warm Almond Activity Sidebar */}
        <RightActivityPanel />
      </div>
    </div>
  )
}
