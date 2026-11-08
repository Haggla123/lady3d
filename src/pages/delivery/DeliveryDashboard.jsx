import { useState, useEffect } from 'react'
import { api } from '../../services/api/client.js'
import { money } from '../../utils/money.js'
import { DELIVERY_STATUS_MAP, ORDER_STATUS_MAP, BRANCHES } from '../../data.js'
import { Link } from '../../components/ui.jsx'
import { useApp, go } from '../../store.jsx'

// Clean SVG Icons to replace emojis
function IconBike({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18.5" cy="17.5" r="3.5"/>
      <circle cx="5.5" cy="17.5" r="3.5"/>
      <circle cx="15" cy="5" r="1"/>
      <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
    </svg>
  )
}

function IconPackage({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  )
}

function IconMapPin({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

function IconPhone({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}

function IconUser({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function IconMap({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  )
}

function IconGrid({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  )
}

function IconArrowLeft({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  )
}

function IconLogOut({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function IconRefresh({ size = 16, color = 'currentColor', spin = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: spin ? 'spin 1s linear infinite' : 'none' }}>
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  )
}

function IconCheckCircle({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

function IconAlertTriangle({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function IconSearch({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

export default function DeliveryDashboard({ branchId: initialBranch = 'all', staffUser }) {
  const { staffLogout, say } = useApp()
  const [selectedBranch, setSelectedBranch] = useState(initialBranch)
  const [orders, setOrders] = useState([])
  const [zones, setZones] = useState([])
  const [drivers, setDrivers] = useState([])
  const [driverChoice, setDriverChoice] = useState({})
  const canManage = ['Owner', 'Manager'].includes(staffUser?.role)
  const canChooseBranch = canManage && (staffUser?.role === 'Owner' || staffUser?.assignedBranch === 'all')
  const [activeTab, setActiveTab] = useState('deliveries') // 'deliveries' | 'zones'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'awaiting' | 'transit' | 'delivered' | 'failed'
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [failModalRef, setFailModalRef] = useState(null)
  const [failReason, setFailReason] = useState('')

  // Zone creation form state
  const [newZone, setNewZone] = useState({
    id: '', branchId: initialBranch === 'sunyani' ? 'sunyani' : 'cug', name: '', fee: 5, minOrderValue: 20, estimatedMinutes: '20-30 mins', active: true
  })

  const notify = (text, type = 'success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 4000)
  }

  const handleLogout = async () => {
    try {
      if (staffLogout) await staffLogout()
      if (say) say('Signed out from delivery portal')
      go('/staff-login')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordRes, zoneRes, staffRes] = await Promise.all([
        api('/delivery/orders'),
        api(`/delivery/zones${selectedBranch === 'all' ? '' : `?branch=${selectedBranch}`}`),
        canManage ? api('/admin/staff') : Promise.resolve({ staff: [] })
      ])
      let list = ordRes.orders || []
      if (selectedBranch !== 'all') {
        list = list.filter(o => o.branch === selectedBranch)
      }
      setOrders(list)
      setZones(zoneRes.zones || [])
      setDrivers((staffRes.staff || []).filter(person => person.role === 'Driver' && person.active !== false && (person.branch === 'all' || person.branch === selectedBranch || selectedBranch === 'all')))
    } catch (err) {
      console.error('Delivery refresh error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const timer = setInterval(loadData, 10000)
    return () => clearInterval(timer)
  }, [selectedBranch, canManage])

  const handleAssign = async (ref) => {
    const driverId = driverChoice[ref]
    if (!driverId) return notify('Select an active rider account first.', 'error')
    const driver = drivers.find(person => person.id === driverId)
    if (!driver) return notify('That rider is not available for this branch.', 'error')
    try {
      await api(`/delivery/orders/${ref}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ driverId })
      })
      notify(`Assigned ${driver.name} to order ${ref}`)
      await loadData()
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  const handlePickup = async (ref) => {
    try {
      await api(`/delivery/orders/${ref}/pickup`, { method: 'PATCH' })
      notify(`Order ${ref} picked up by rider and out for delivery`)
      await loadData()
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  const handleDeliver = async (ref) => {
    try {
      await api(`/delivery/orders/${ref}/deliver`, { method: 'PATCH' })
      notify(`Order ${ref} marked delivered!`)
      await loadData()
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  const handleFail = async () => {
    if (!failReason.trim()) return
    try {
      await api(`/delivery/orders/${failModalRef}/fail`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: failReason })
      })
      notify(`Failure report recorded for ${failModalRef}`)
      setFailModalRef(null)
      setFailReason('')
      await loadData()
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  const handleCreateZone = async (e) => {
    e.preventDefault()
    try {
      await api('/admin/delivery/zones', {
        method: 'POST',
        body: JSON.stringify(newZone)
      })
      notify(`Delivery zone "${newZone.name}" created!`)
      setNewZone({ id: '', branchId: selectedBranch === 'sunyani' ? 'sunyani' : 'cug', name: '', fee: 5, minOrderValue: 20, estimatedMinutes: '20-30 mins', active: true })
      await loadData()
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  // Filter orders by status and search query
  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'awaiting') {
      if (!['awaiting_assignment', 'assigned', 'awaiting_pickup'].includes(o.deliveryStatus)) return false
    } else if (statusFilter === 'transit') {
      if (!['picked_up', 'in_transit'].includes(o.deliveryStatus)) return false
    } else if (statusFilter === 'delivered') {
      if (o.deliveryStatus !== 'delivered') return false
    } else if (statusFilter === 'failed') {
      if (o.deliveryStatus !== 'failed_delivery') return false
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim()
      const matchRef = o.ref?.toLowerCase().includes(q)
      const matchName = o.name?.toLowerCase().includes(q)
      const matchPhone = o.phone?.toLowerCase().includes(q)
      const matchAddr = (o.deliveryDetails?.address || o.address || '').toLowerCase().includes(q)
      const matchRider = (o.deliveryAssignment?.driverName || '').toLowerCase().includes(q)
      return matchRef || matchName || matchPhone || matchAddr || matchRider
    }
    return true
  })

  // Summary counts
  const awaitingCount = orders.filter(o => ['awaiting_assignment', 'assigned', 'awaiting_pickup'].includes(o.deliveryStatus)).length
  const transitCount = orders.filter(o => ['picked_up', 'in_transit'].includes(o.deliveryStatus)).length
  const deliveredCount = orders.filter(o => o.deliveryStatus === 'delivered').length
  const failedCount = orders.filter(o => o.deliveryStatus === 'failed_delivery').length

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'awaiting_assignment':
        return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d', label: 'Awaiting Rider' }
      case 'assigned':
        return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', label: 'Rider Assigned' }
      case 'awaiting_pickup':
        return { bg: '#e0f2fe', color: '#0284c7', border: '#bae6fd', label: 'Ready for Pickup' }
      case 'picked_up':
      case 'in_transit':
        return { bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe', label: 'Out for Delivery' }
      case 'delivered':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', label: 'Delivered' }
      case 'failed_delivery':
        return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca', label: 'Delivery Issue' }
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: status || 'Pending' }
    }
  }

  return (
    <div style={{ background: '#fbf8f4', minHeight: '100vh', color: '#1c1917', padding: '24px 20px', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        {/* Top Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #efe6dc', paddingBottom: '20px', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src="/lady3d-logo.jpg" alt="Lady 3D's Catering" style={{ width: 48, height: 48, borderRadius: 12, border: '2px solid #80141b', objectFit: 'cover' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#80141b', display: 'inline-flex' }}>
                  <IconBike size={22} color="#80141b" />
                </span>
                <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#80141b', letterSpacing: '-0.02em' }}>
                  Delivery & Dispatch Operations
                </h1>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#78716c' }}>
                Rider dispatching, live tracking and delivery zone controls
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Branch Switcher */}
            {canChooseBranch && (
              <div style={{ background: '#ffffff', padding: '4px', borderRadius: '10px', display: 'flex', border: '1px solid #e7dfd5', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <button
                  onClick={() => setSelectedBranch('all')}
                  style={{
                    background: selectedBranch === 'all' ? '#80141b' : 'transparent',
                    color: selectedBranch === 'all' ? '#ffffff' : '#574f4a',
                    border: 'none', padding: '6px 14px', borderRadius: '7px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  All Branches
                </button>
                <button
                  onClick={() => setSelectedBranch('cug')}
                  style={{
                    background: selectedBranch === 'cug' ? '#80141b' : 'transparent',
                    color: selectedBranch === 'cug' ? '#ffffff' : '#574f4a',
                    border: 'none', padding: '6px 14px', borderRadius: '7px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  CUG Campus
                </button>
                <button
                  onClick={() => setSelectedBranch('sunyani')}
                  style={{
                    background: selectedBranch === 'sunyani' ? '#80141b' : 'transparent',
                    color: selectedBranch === 'sunyani' ? '#ffffff' : '#574f4a',
                    border: 'none', padding: '6px 14px', borderRadius: '7px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  Sunyani Main
                </button>
              </div>
            )}

            {/* Live syncing status indicator */}
            {loading && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#80141B', fontSize: '12px', fontWeight: 700, padding: '6px 12px', background: '#FDF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
                <span className="pbd-spinner-sm" style={{ width: 14, height: 14 }} />
                <span>Syncing riders...</span>
              </div>
            )}

            {/* Navigation Links */}
            <Link
              to="/dashboards"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                color: '#574f4a', textDecoration: 'none', background: '#ffffff',
                border: '1px solid #e7dfd5', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600
              }}
            >
              <IconGrid size={15} color="#78716c" />
              <span>Portals Directory</span>
            </Link>

            {canManage && (
              <Link
                to="/admin/overview"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  color: '#574f4a', textDecoration: 'none', background: '#ffffff',
                  border: '1px solid #e7dfd5', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600
                }}
              >
                <IconArrowLeft size={15} color="#78716c" />
                <span>Admin Console</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                color: '#dc2626', background: '#ffffff', border: '1px solid #fecaca',
                padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <IconLogOut size={15} color="#dc2626" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 18px', border: '1px solid #efe6dc', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', marginBottom: '4px' }}>Total Deliveries</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#1c1917' }}>{orders.length}</div>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 18px', border: '1px solid #efe6dc', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', marginBottom: '4px' }}>Awaiting Rider</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#b45309' }}>{awaitingCount}</div>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 18px', border: '1px solid #efe6dc', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', marginBottom: '4px' }}>Out for Delivery</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#6d28d9' }}>{transitCount}</div>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 18px', border: '1px solid #efe6dc', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', marginBottom: '4px' }}>Completed Today</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#15803d' }}>{deliveredCount}</div>
          </div>
          {canManage && (
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 18px', border: '1px solid #efe6dc', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', marginBottom: '4px' }}>Active Riders</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0369a1' }}>{drivers.length}</div>
            </div>
          )}
        </div>

        {/* Tab & Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('deliveries')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '9px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                background: activeTab === 'deliveries' ? '#80141b' : '#ffffff',
                color: activeTab === 'deliveries' ? '#ffffff' : '#574f4a',
                boxShadow: activeTab === 'deliveries' ? '0 2px 6px rgba(128,20,27,0.2)' : 'none',
                border: activeTab === 'deliveries' ? 'none' : '1px solid #e7dfd5'
              }}
            >
              <IconPackage size={17} color={activeTab === 'deliveries' ? '#ffffff' : '#78716c'} />
              <span>Active Deliveries ({orders.length})</span>
            </button>
            {canManage && (
              <button
                onClick={() => setActiveTab('zones')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 18px', borderRadius: '9px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                  background: activeTab === 'zones' ? '#80141b' : '#ffffff',
                  color: activeTab === 'zones' ? '#ffffff' : '#574f4a',
                  boxShadow: activeTab === 'zones' ? '0 2px 6px rgba(128,20,27,0.2)' : 'none',
                  border: activeTab === 'zones' ? 'none' : '1px solid #e7dfd5'
                }}
              >
                <IconMap size={17} color={activeTab === 'zones' ? '#ffffff' : '#78716c'} />
                <span>Delivery Zones & Fees ({zones.length})</span>
              </button>
            )}
          </div>

          {activeTab === 'deliveries' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Search input */}
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex' }}>
                  <IconSearch size={15} color="#9ca3af" />
                </span>
                <input
                  type="text"
                  placeholder="Search order ref, customer, phone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px 8px 32px', borderRadius: '8px',
                    border: '1px solid #d1d5db', background: '#ffffff', fontSize: '13px', color: '#1c1917', outline: 'none'
                  }}
                />
              </div>

              {/* Status pill filter */}
              <div style={{ display: 'flex', gap: '4px', background: '#ffffff', padding: '3px', borderRadius: '8px', border: '1px solid #e7dfd5' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'awaiting', label: `Pending (${awaitingCount})` },
                  { id: 'transit', label: `In Transit (${transitCount})` },
                  { id: 'delivered', label: `Delivered (${deliveredCount})` },
                  ...(failedCount > 0 || statusFilter === 'failed' ? [{ id: 'failed', label: `Issues (${failedCount})` }] : [])
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    style={{
                      background: statusFilter === tab.id ? '#f3f4f6' : 'transparent',
                      color: statusFilter === tab.id ? '#111827' : '#6b7280',
                      fontWeight: statusFilter === tab.id ? 700 : 500,
                      border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Global Alert Notification */}
        {msg && (
          <div style={{
            background: msg.type === 'error' ? '#fef2f2' : '#ecfdf5',
            color: msg.type === 'error' ? '#991b1b' : '#065f46',
            border: `1px solid ${msg.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {msg.type === 'error' ? (
              <IconAlertTriangle size={18} color="#dc2626" />
            ) : (
              <IconCheckCircle size={18} color="#059669" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* TAB 1: DELIVERIES LIST */}
        {activeTab === 'deliveries' && (
          <div>
            {filteredOrders.length === 0 ? (
              <div style={{ background: '#ffffff', padding: '48px 24px', borderRadius: '14px', textAlign: 'center', border: '1px solid #efe6dc', color: '#78716c' }}>
                <div style={{ margin: '0 auto 12px', width: 44, height: 44, borderRadius: '50%', background: '#f5f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconPackage size={22} color="#a8a29e" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: '#292524' }}>No delivery orders found</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  {searchTerm ? 'No orders match your search criteria.' : 'There are currently no active deliveries in this queue.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
                {filteredOrders.map(o => {
                  const badge = getStatusBadgeStyle(o.deliveryStatus)
                  const kitchenReady = o.orderStatus === 'ready_for_dispatch'
                  const kitchenText = o.orderStatus === 'ready_for_dispatch' ? 'Kitchen Packed & Ready' : (o.orderStatus === 'preparing' ? 'Cooking in Kitchen' : 'Kitchen Queue')

                  return (
                    <div
                      key={o.ref}
                      style={{
                        background: '#ffffff',
                        borderRadius: '14px',
                        padding: '20px',
                        border: '1px solid #efe6dc',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        {/* Top Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <span style={{ fontSize: '17px', fontWeight: 800, color: '#80141b', letterSpacing: '-0.01em' }}>{o.ref}</span>
                            <div style={{ fontSize: '11px', color: '#78716c', marginTop: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
                              {BRANCHES.find(b => b.id === o.branch)?.name || o.branch}
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, padding: '3px 9px', borderRadius: '6px', fontWeight: 700 }}>
                            {badge.label}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fafaf9', borderRadius: '8px', border: '1px solid #f5f5f4', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IconUser size={15} color="#78716c" />
                            <b style={{ fontSize: '14px', color: '#1c1917' }}>{o.name}</b>
                          </div>
                          <a
                            href={`tel:${o.phone}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              color: '#0369a1', textDecoration: 'none', fontSize: '13px', fontWeight: 700,
                              background: '#f0f9ff', padding: '3px 8px', borderRadius: '6px', border: '1px solid #bae6fd'
                            }}
                          >
                            <IconPhone size={13} color="#0369a1" />
                            <span>{o.phone}</span>
                          </a>
                        </div>

                        {/* Destination Address Block */}
                        <div style={{ background: '#fcfbf9', borderRadius: '10px', padding: '12px', marginBottom: '14px', border: '1px solid #efe6dc' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Delivery Destination</div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917', marginTop: '3px' }}>
                            {o.deliveryDetails?.zoneName || 'Branch Delivery Zone'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '13px', color: '#44403c', marginTop: '4px' }}>
                            <span style={{ color: '#80141b', flexShrink: 0, marginTop: '2px' }}>
                              <IconMapPin size={14} color="#80141b" />
                            </span>
                            <span>{o.deliveryDetails?.address || o.address}</span>
                          </div>
                          {o.deliveryDetails?.instructions && (
                            <div style={{ fontSize: '12px', color: '#b45309', background: '#fef3c7', padding: '4px 8px', borderRadius: '6px', marginTop: '6px' }}>
                              Note: {o.deliveryDetails.instructions}
                            </div>
                          )}
                        </div>

                        {/* Order Items */}
                        <div style={{ fontSize: '13px', color: '#44403c', marginBottom: '12px', borderBottom: '1px solid #f5f5f4', paddingBottom: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', marginBottom: '4px' }}>Order Meals</div>
                          {o.items.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <span><b>{it.qty}x</b> {it.name}</span>
                              {it.extras?.length > 0 && (
                                <span style={{ fontSize: '11px', color: '#78716c' }}>+{it.extras.map(e => e.name).join(', ')}</span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Financials & Kitchen Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginBottom: '14px' }}>
                          <div>
                            <span style={{ color: '#78716c' }}>Total:</span> <b style={{ fontSize: '15px', color: '#1c1917' }}>{money(o.total)}</b>
                            <span style={{ fontSize: '12px', color: '#a8a29e', marginLeft: '4px' }}>(Fee: {money(o.deliveryFee)})</span>
                          </div>
                          <span style={{
                            fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                            color: o.paymentStatus === 'paid' ? '#15803d' : '#b45309',
                            background: o.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7',
                            padding: '2px 7px', borderRadius: '4px'
                          }}>
                            {o.pay === 'momo' ? 'Mobile Money' : 'Cash'} · {o.paymentStatus}
                          </span>
                        </div>

                        {/* Kitchen Preparation Tag */}
                        <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: kitchenReady ? '#15803d' : '#b45309', background: kitchenReady ? '#f0fdf4' : '#fffbeb', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${kitchenReady ? '#bbf7d0' : '#fef3c7'}`, marginBottom: '14px' }}>
                          <IconPackage size={14} color={kitchenReady ? '#15803d' : '#b45309'} />
                          <span>Kitchen: <b>{kitchenText}</b></span>
                        </div>

                        {/* Assigned Rider Info */}
                        {o.deliveryAssignment?.driverName && (
                          <div style={{ fontSize: '12px', background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1', padding: '8px 12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <IconBike size={15} color="#0369a1" />
                              <span>Rider: <b>{o.deliveryAssignment.driverName}</b></span>
                            </div>
                            {o.deliveryAssignment.driverPhone && (
                              <a href={`tel:${o.deliveryAssignment.driverPhone}`} style={{ color: '#0369a1', fontWeight: 700, textDecoration: 'none', fontSize: '11px' }}>
                                {o.deliveryAssignment.driverPhone}
                              </a>
                            )}
                          </div>
                        )}

                        {o.deliveryAssignment?.failureReason && (
                          <div style={{ fontSize: '12px', background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '8px 12px', borderRadius: '8px', marginBottom: '16px' }}>
                            <b>Reported Issue:</b> {o.deliveryAssignment.failureReason}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons based on delivery workflow */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #f5f5f4' }}>
                        {canManage && ['awaiting_assignment', 'failed_delivery'].includes(o.deliveryStatus) && (
                          <>
                            <select
                              value={driverChoice[o.ref] || ''}
                              onChange={event => setDriverChoice(current => ({ ...current, [o.ref]: event.target.value }))}
                              aria-label={`Rider for ${o.ref}`}
                              style={{ flex: 1, minWidth: '150px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#ffffff', fontSize: '13px', color: '#1c1917' }}
                            >
                              <option value="">Select rider…</option>
                              {drivers.filter(driver => driver.branch === 'all' || driver.branch === o.branch).map(driver => (
                                <option key={driver.id} value={driver.id}>{driver.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssign(o.ref)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                background: '#0284c7', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                              }}
                            >
                              <IconUser size={15} color="#ffffff" />
                              <span>{o.deliveryStatus === 'failed_delivery' ? 'Reassign Rider' : 'Assign Rider'}</span>
                            </button>
                          </>
                        )}

                        {['assigned', 'awaiting_pickup'].includes(o.deliveryStatus) && (
                          <button
                            onClick={() => handlePickup(o.ref)}
                            style={{
                              width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                              background: '#80141b', color: '#ffffff', border: 'none', padding: '11px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(128,20,27,0.2)'
                            }}
                          >
                            <IconPackage size={17} color="#ffffff" />
                            <span>Confirm Pickup from Kitchen</span>
                          </button>
                        )}

                        {['picked_up', 'in_transit'].includes(o.deliveryStatus) && (
                          <>
                            <button
                              onClick={() => handleDeliver(o.ref)}
                              style={{
                                flex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                background: '#16a34a', color: '#ffffff', border: 'none', padding: '10px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(22,163,74,0.2)'
                              }}
                            >
                              <IconCheckCircle size={16} color="#ffffff" />
                              <span>Confirm Delivered</span>
                            </button>
                            <button
                              onClick={() => setFailModalRef(o.ref)}
                              style={{
                                flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                background: '#ffffff', color: '#dc2626', border: '1px solid #fca5a5', padding: '10px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
                              }}
                            >
                              <IconAlertTriangle size={15} color="#dc2626" />
                              <span>Issue</span>
                            </button>
                          </>
                        )}

                        {o.deliveryStatus === 'delivered' && (
                          <div style={{ width: '100%', textAlign: 'center', color: '#16a34a', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px' }}>
                            <IconCheckCircle size={16} color="#16a34a" />
                            <span>Delivered & Completed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ZONES & FEES CONFIGURATION */}
        {activeTab === 'zones' && canManage && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #efe6dc', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#1c1917' }}>Approved Delivery Zones & Fees</h2>
                  <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#78716c' }}>
                    Active branch coverage areas with delivery tariffs and student minimum order thresholds
                  </p>
                </div>
                <span style={{ fontSize: '12px', background: '#f5f5f4', color: '#574f4a', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                  {zones.length} Zones Total
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#fbf8f4', borderBottom: '1px solid #efe6dc' }}>
                      <th style={{ padding: '12px 14px', color: '#574f4a', fontWeight: 700 }}>Zone ID</th>
                      <th style={{ padding: '12px 14px', color: '#574f4a', fontWeight: 700 }}>Branch</th>
                      <th style={{ padding: '12px 14px', color: '#574f4a', fontWeight: 700 }}>Zone Name</th>
                      <th style={{ padding: '12px 14px', color: '#574f4a', fontWeight: 700 }}>Delivery Fee</th>
                      <th style={{ padding: '12px 14px', color: '#574f4a', fontWeight: 700 }}>Min Order</th>
                      <th style={{ padding: '12px 14px', color: '#574f4a', fontWeight: 700 }}>Est. Time</th>
                      <th style={{ padding: '12px 14px', color: '#574f4a', fontWeight: 700 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map(z => (
                      <tr key={z.id} style={{ borderBottom: '1px solid #f5f5f4' }}>
                        <td style={{ padding: '12px 14px', color: '#78716c', fontFamily: 'monospace', fontSize: '12px' }}>{z.id}</td>
                        <td style={{ padding: '12px 14px', textTransform: 'uppercase', fontWeight: 700, fontSize: '12px', color: '#80141b' }}>{z.branchId}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1c1917' }}>{z.name}</td>
                        <td style={{ padding: '12px 14px', color: '#80141b', fontWeight: 800 }}>{money(z.fee)}</td>
                        <td style={{ padding: '12px 14px', color: '#574f4a' }}>{money(z.minOrderValue)}</td>
                        <td style={{ padding: '12px 14px', color: '#78716c', fontSize: '13px' }}>{z.estimatedMinutes}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            background: z.active ? '#dcfce7' : '#fee2e2',
                            color: z.active ? '#15803d' : '#991b1b',
                            padding: '3px 8px', borderRadius: '5px', fontSize: '12px', fontWeight: 700
                          }}>
                            {z.active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Create new zone form */}
            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', border: '1px solid #efe6dc', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <IconMapPin size={18} color="#80141b" />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#80141b' }}>Add Delivery Zone</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#78716c', margin: '0 0 16px 0' }}>
                Define a new hostel, hall, or residential zone for dispatch calculations.
              </p>

              <form onSubmit={handleCreateZone} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#574f4a', display: 'block', marginBottom: '4px' }}>Branch Assignment</label>
                  <select
                    value={newZone.branchId}
                    onChange={e => setNewZone({ ...newZone, branchId: e.target.value })}
                    style={{ width: '100%', background: '#ffffff', color: '#1c1917', border: '1px solid #d1d5db', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
                  >
                    <option value="cug">Catholic University (CUG Fiapre)</option>
                    <option value="sunyani">Sunyani Main Branch</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#574f4a', display: 'block', marginBottom: '4px' }}>Zone Slug (ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cug-hall-4"
                    value={newZone.id}
                    onChange={e => setNewZone({ ...newZone, id: e.target.value })}
                    style={{ width: '100%', background: '#ffffff', color: '#1c1917', border: '1px solid #d1d5db', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#574f4a', display: 'block', marginBottom: '4px' }}>Zone Title & Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Faculty Block & Staff Quarters"
                    value={newZone.name}
                    onChange={e => setNewZone({ ...newZone, name: e.target.value })}
                    style={{ width: '100%', background: '#ffffff', color: '#1c1917', border: '1px solid #d1d5db', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#574f4a', display: 'block', marginBottom: '4px' }}>Fee (GH₵)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newZone.fee}
                      onChange={e => setNewZone({ ...newZone, fee: Number(e.target.value) })}
                      style={{ width: '100%', background: '#ffffff', color: '#1c1917', border: '1px solid #d1d5db', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#574f4a', display: 'block', marginBottom: '4px' }}>Min Order (GH₵)</label>
                    <input
                      type="number"
                      min="0"
                      value={newZone.minOrderValue}
                      onChange={e => setNewZone({ ...newZone, minOrderValue: Number(e.target.value) })}
                      style={{ width: '100%', background: '#ffffff', color: '#1c1917', border: '1px solid #d1d5db', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#574f4a', display: 'block', marginBottom: '4px' }}>Est. Delivery Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 15-25 mins"
                    value={newZone.estimatedMinutes}
                    onChange={e => setNewZone({ ...newZone, estimatedMinutes: e.target.value })}
                    style={{ width: '100%', background: '#ffffff', color: '#1c1917', border: '1px solid #d1d5db', padding: '9px 12px', borderRadius: '8px', fontSize: '13px' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: '#80141b', color: '#ffffff', border: 'none', padding: '11px', borderRadius: '8px',
                    fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginTop: '6px', boxShadow: '0 2px 6px rgba(128,20,27,0.2)'
                  }}
                >
                  Save Delivery Zone
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Failure Reason Modal */}
        {failModalRef && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '14px', width: '100%', maxWidth: '440px', border: '1px solid #fca5a5', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <IconAlertTriangle size={20} color="#dc2626" />
                <h3 style={{ margin: 0, color: '#dc2626', fontSize: '17px', fontWeight: 800 }}>Report Delivery Issue · {failModalRef}</h3>
              </div>
              <p style={{ fontSize: '13px', color: '#574f4a', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                Please provide the reason this order could not be completed (e.g. customer phone unreachable, incorrect hostel location):
              </p>
              <textarea
                rows="3"
                value={failReason}
                onChange={e => setFailReason(e.target.value)}
                placeholder="Describe the issue encountered..."
                style={{ width: '100%', background: '#ffffff', color: '#1c1917', border: '1px solid #d1d5db', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setFailModalRef(null)}
                  style={{ background: '#f5f5f4', color: '#574f4a', border: '1px solid #d6d3d1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFail}
                  style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
