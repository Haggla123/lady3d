import { useState, useEffect, useMemo, useRef } from 'react'
import { api } from '../../services/api/client.js'
import { playKitchenChime } from '../../services/notifications/chime.js'
import { money } from '../../utils/money.js'
import { ORDER_STATUS_MAP, BRANCHES } from '../../data.js'
import { Link } from '../../components/ui.jsx'
import { useApp } from '../../store.jsx'

// Clean SVG Icons (no emojis)
function IconChefHat({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
      <line x1="6" y1="17" x2="18" y2="17"/>
    </svg>
  )
}

function IconUtensils({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/>
      <path d="M15 11v11"/>
      <path d="M5 2v4a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2"/>
      <path d="M8 9v13"/>
    </svg>
  )
}

function IconClipboard({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  )
}

function IconFlame({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  )
}

function IconBell({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

function IconBellOff({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      <path d="M18.63 13A17.89 17.89 0 0 1 18 8"/>
      <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/>
      <path d="M18 8a6 6 0 0 0-9.33-5"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function IconCheck({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconCheckCircle({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

function IconCheckCheck({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 7 17l-5-5"/>
      <path d="m22 10-7.5 7.5L13 16"/>
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

function IconArrowLeft({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
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

function IconFilter({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  )
}

function IconPlus({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function IconMinus({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function IconMapPin({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

function IconPhone({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}

function IconClock({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function IconAlertTriangle({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function IconBike({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18.5" cy="17.5" r="3.5"/>
      <circle cx="5.5" cy="17.5" r="3.5"/>
      <circle cx="15" cy="5" r="1"/>
      <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
    </svg>
  )
}

export default function KitchenDashboard({ branchId: propBranch = 'cug', staffUser }) {
  const { settings } = useApp() || {}
  const [selectedBranch, setSelectedBranch] = useState(propBranch)
  const [orders, setOrders] = useState([])
  const [availability, setAvailability] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [soundEnabled, setSoundEnabled] = useState(() => settings?.orderNotificationSound !== false)
  const [activeTab, setActiveTab] = useState('queue') // 'queue' | 'stock'
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const activeLoads = useRef(0)
  const [statusMsg, setStatusMsg] = useState({ text: '', type: 'info' })

  // Stock Filter states
  const [stockSearch, setStockSearch] = useState('')
  const [stockCategoryFilter, setStockCategoryFilter] = useState('all')
  const [stockStatusFilter, setStockStatusFilter] = useState('all') // 'all' | 'in_stock' | 'low_stock' | 'sold_out'
  const [exactPortionInputs, setExactPortionInputs] = useState({})

  const notify = (text, type = 'info') => {
    setStatusMsg({ text, type })
    setTimeout(() => setStatusMsg({ text: '', type: 'info' }), 4000)
  }

  const loadData = async () => {
    activeLoads.current += 1
    setRefreshing(true)
    try {
      const [ordRes, availRes, menuRes] = await Promise.all([
        api('/kitchen/orders'),
        api(`/kitchen/availability?branch=${selectedBranch}`),
        api('/menu').catch(() => null)
      ])

      const filtered = (ordRes.orders || []).filter(o => o.branch === selectedBranch)
      if (soundEnabled && filtered.some(o => o.orderStatus === 'confirmed' && !orders.find(prev => prev.ref === o.ref))) {
        playKitchenChime()
      }
      setOrders(filtered)
      setAvailability(availRes.records || [])
      if (menuRes?.items) setMenuItems(menuRes.items)
    } catch (err) {
      console.error('Kitchen refresh failed:', err.message)
    } finally {
      activeLoads.current -= 1
      if (activeLoads.current === 0) setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    const timer = setInterval(() => loadData(), 8000)
    return () => clearInterval(timer)
  }, [selectedBranch, soundEnabled])

  const handleAction = async (ref, action) => {
    setLoading(true)
    try {
      await api(`/kitchen/orders/${ref}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ action })
      })
      notify(`Order ${ref} updated successfully!`, 'success')
      await loadData()
    } catch (err) {
      notify(err.message || 'Failed to update order status', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStockUpdate = async (mealId, update) => {
    try {
      await api(`/kitchen/availability/${mealId}?branch=${selectedBranch}`, {
        method: 'PATCH',
        body: JSON.stringify(update)
      })
      notify('Stock portions updated', 'success')
      await loadData()
      return true
    } catch (err) {
      notify(err.message || 'Stock update failed', 'error')
      return false
    }
  }

  const handleBatchAddPortions = async (delta) => {
    try {
      const targetItems = filteredStockList.filter(item => item.status !== 'unavailable_today')
      if (targetItems.length === 0) return
      const outcomes = await Promise.allSettled(
        targetItems.map(item =>
          api(`/kitchen/availability/${item.mealId}?branch=${selectedBranch}`, {
            method: 'PATCH',
            body: JSON.stringify({ addPrepared: delta })
          })
        )
      )
      const rejectedCount = outcomes.filter(o => o.status === 'rejected').length
      if (rejectedCount > 0) {
        notify(`Failed to update ${rejectedCount} item(s)`, 'error')
      } else {
        notify(`Added +${delta} portions to ${targetItems.length} dishes`, 'success')
      }
    } catch (err) {
      notify(err.message || 'Batch update failed', 'error')
    } finally {
      await loadData()
    }
  }

  const handleSetExactPortions = async (mealId) => {
    const val = parseInt(exactPortionInputs[mealId], 10)
    if (isNaN(val) || val < 0) {
      notify('Please enter a valid non-negative number of portions', 'error')
      return
    }
    const success = await handleStockUpdate(mealId, { setPrepared: val })
    if (success) {
      setExactPortionInputs(prev => ({ ...prev, [mealId]: '' }))
    }
  }

  const confirmedOrders = orders.filter(o => o.orderStatus === 'confirmed')
  const preparingOrders = orders.filter(o => o.orderStatus === 'preparing')
  const readyOrders = orders.filter(o => ['ready_for_collection', 'ready_for_dispatch'].includes(o.orderStatus))

  const currentBranchObj = BRANCHES.find(b => b.id === selectedBranch) || BRANCHES[0]

  // Enrich stock with category & pricing from menu
  const enrichedStock = useMemo(() => {
    const menuMap = new Map((menuItems || []).map(m => [m.id, m]))
    return availability.map(item => {
      const menuData = menuMap.get(item.mealId)
      const remaining = Math.max(0, item.quantityPrepared - item.quantityReserved - item.quantitySold)
      const isSoldOut = item.status === 'sold_out' || (item.status === 'available' && remaining <= 0)
      const isLowStock = item.status === 'available' && !isSoldOut && remaining <= 5
      return {
        ...item,
        category: menuData?.category || 'Main Dishes',
        price: menuData?.price || 0,
        description: menuData?.description || '',
        remaining,
        isSoldOut,
        isLowStock
      }
    })
  }, [availability, menuItems])

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set(enrichedStock.map(i => i.category))
    return Array.from(set).filter(Boolean)
  }, [enrichedStock])

  // Filtered stock list
  const filteredStockList = useMemo(() => {
    return enrichedStock.filter(item => {
      if (stockCategoryFilter !== 'all' && item.category !== stockCategoryFilter) return false
      if (stockSearch.trim()) {
        const query = stockSearch.toLowerCase()
        const matchesName = item.mealName?.toLowerCase().includes(query)
        const matchesCat = item.category?.toLowerCase().includes(query)
        if (!matchesName && !matchesCat) return false
      }
      if (stockStatusFilter === 'in_stock') {
        if (item.isSoldOut || item.status !== 'available') return false
      } else if (stockStatusFilter === 'low_stock') {
        if (!item.isLowStock) return false
      } else if (stockStatusFilter === 'sold_out') {
        if (!item.isSoldOut && item.status !== 'sold_out') return false
      }
      return true
    })
  }, [enrichedStock, stockCategoryFilter, stockSearch, stockStatusFilter])

  // Stock KPI Summary
  const stockKpis = useMemo(() => {
    const totalDishes = enrichedStock.length
    const totalPrepared = enrichedStock.reduce((acc, i) => acc + (i.quantityPrepared || 0), 0)
    const totalReserved = enrichedStock.reduce((acc, i) => acc + (i.quantityReserved || 0), 0)
    const totalSold = enrichedStock.reduce((acc, i) => acc + (i.quantitySold || 0), 0)
    const totalRemaining = enrichedStock.reduce((acc, i) => acc + (i.status === 'available' ? (i.remaining || 0) : 0), 0)
    const lowStockCount = enrichedStock.filter(i => i.isLowStock).length
    const soldOutCount = enrichedStock.filter(i => i.isSoldOut).length
    return { totalDishes, totalPrepared, totalReserved, totalSold, totalRemaining, lowStockCount, soldOutCount }
  }, [enrichedStock])

  return (
    <div style={{ background: '#FBF8F4', minHeight: '100vh', color: '#1C1917', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
      
      {/* Top Application Header */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #EFE6DC',
        padding: '14px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 2px 8px rgba(128, 20, 27, 0.04)'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Brand Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src="/lady3d-logo.jpg"
              alt="Lady 3D Catering"
              style={{ width: 44, height: 44, borderRadius: 10, border: '2px solid #80141B', objectFit: 'cover' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#FDF2F2',
                  color: '#80141B',
                  fontWeight: 800,
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  <IconChefHat size={14} color="#80141B" /> Kitchen Portal
                </span>
                <span style={{ fontSize: '12px', color: '#78716C', fontWeight: 600 }}>·</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#44403C' }}>{currentBranchObj.name}</span>
              </div>
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#1C1917', margin: '2px 0 0 0', letterSpacing: '-0.02em' }}>
                Daily Stock & Kitchen Order Display
              </h1>
            </div>
          </div>

          {/* Controls & Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* Branch Switcher (for Owner / multi-branch staff) */}
            {(staffUser?.role === 'Owner' || staffUser?.assignedBranch === 'all') && (
              <div style={{ background: '#F5EFEB', padding: '3px', borderRadius: '8px', display: 'flex', border: '1px solid #E5D9CE' }}>
                <button
                  onClick={() => setSelectedBranch('cug')}
                  style={{
                    background: selectedBranch === 'cug' ? '#80141B' : 'transparent',
                    color: selectedBranch === 'cug' ? '#FFFFFF' : '#57534E',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  CUG Campus
                </button>
                <button
                  onClick={() => setSelectedBranch('sunyani')}
                  style={{
                    background: selectedBranch === 'sunyani' ? '#80141B' : 'transparent',
                    color: selectedBranch === 'sunyani' ? '#FFFFFF' : '#57534E',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Sunyani Main
                </button>
              </div>
            )}

            {/* Live syncing status indicator */}
            {refreshing && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#80141B', fontSize: '12px', fontWeight: 700, padding: '6px 12px', background: '#FDF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
                <span className="pbd-spinner-sm" style={{ width: 14, height: 14 }} />
                <span>Syncing queue...</span>
              </div>
            )}

            {/* Audio Chime Toggle */}
            <button
              onClick={() => {
                const nextState = !soundEnabled
                setSoundEnabled(nextState)
                if (nextState) playKitchenChime()
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: soundEnabled ? '#F0FDF4' : '#F5EFEB',
                color: soundEnabled ? '#15803D' : '#78716C',
                border: `1px solid ${soundEnabled ? '#BBF7D0' : '#E5D9CE'}`,
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {soundEnabled ? <IconBell size={16} color="#15803D" /> : <IconBellOff size={16} color="#78716C" />}
              <span>{soundEnabled ? 'Chime Active' : 'Chime Muted'}</span>
            </button>

            {/* Admin Console Link */}
            <Link
              to="/admin/overview"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#80141B',
                textDecoration: 'none',
                background: '#FDF2F2',
                border: '1px solid #F8D7DA',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              <IconArrowLeft size={15} color="#80141B" />
              <span>Admin Console</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
        
        {/* Status Notification Banner */}
        {statusMsg.text && (
          <div style={{
            background: statusMsg.type === 'error' ? '#FEE2E2' : statusMsg.type === 'success' ? '#DCFCE7' : '#E0F2FE',
            color: statusMsg.type === 'error' ? '#991B1B' : statusMsg.type === 'success' ? '#166534' : '#0369A1',
            border: `1px solid ${statusMsg.type === 'error' ? '#F87171' : statusMsg.type === 'success' ? '#86EFAC' : '#7DD3FC'}`,
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
          }}>
            {statusMsg.type === 'error' ? <IconAlertTriangle size={18} color="#991B1B" /> : <IconCheckCircle size={18} color="#166534" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Primary View Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #EFE6DC',
          marginBottom: '24px',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('queue')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                borderBottom: activeTab === 'queue' ? '3px solid #80141B' : '3px solid transparent',
                background: 'transparent',
                color: activeTab === 'queue' ? '#80141B' : '#78716C',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <IconClipboard size={18} color={activeTab === 'queue' ? '#80141B' : '#78716C'} />
              <span>Active Orders Queue</span>
              <span style={{
                background: activeTab === 'queue' ? '#80141B' : '#EFE6DC',
                color: activeTab === 'queue' ? '#FFFFFF' : '#57534E',
                fontSize: '12px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('stock')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                borderBottom: activeTab === 'stock' ? '3px solid #80141B' : '3px solid transparent',
                background: 'transparent',
                color: activeTab === 'stock' ? '#80141B' : '#78716C',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <IconUtensils size={18} color={activeTab === 'stock' ? '#80141B' : '#78716C'} />
              <span>Daily Stock & Portions Tracker</span>
              <span style={{
                background: activeTab === 'stock' ? '#80141B' : '#EFE6DC',
                color: activeTab === 'stock' ? '#FFFFFF' : '#57534E',
                fontSize: '12px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {availability.length}
              </span>
            </button>
          </div>

          <div style={{ fontSize: '13px', color: '#78716C', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconClock size={14} color="#78716C" />
            <span>Auto-refreshing every 8s</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: KITCHEN WORKFLOW QUEUE                                  */}
        {/* ============================================================== */}
        {activeTab === 'queue' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '24px',
              alignItems: 'start'
            }}>
              
              {/* Column 1: New Confirmed Orders */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #EFE6DC',
                boxShadow: '0 2px 10px rgba(128, 20, 27, 0.04)',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: '#FDF2F2',
                  borderBottom: '1px solid #F8D7DA',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#DC2626' }} />
                    <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#80141B' }}>
                      1. New Confirmed Orders
                    </h2>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    background: '#80141B',
                    color: '#FFFFFF',
                    padding: '3px 10px',
                    borderRadius: '12px'
                  }}>
                    {confirmedOrders.length}
                  </span>
                </div>

                <div style={{ padding: '16px', maxHeight: '720px', overflowY: 'auto' }}>
                  {confirmedOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#A8A29E' }}>
                      <IconClipboard size={32} color="#D6D3D1" />
                      <p style={{ margin: '12px 0 0 0', fontSize: '14px', fontWeight: 600 }}>No new incoming orders awaiting prep</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>New customer orders will chime instantly</p>
                    </div>
                  ) : (
                    confirmedOrders.map(o => (
                      <div
                        key={o.ref}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: '12px',
                          padding: '16px',
                          marginBottom: '14px',
                          border: '1px solid #EFE6DC',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#1C1917', letterSpacing: '-0.01em' }}>
                              #{o.ref}
                            </span>
                            <div style={{ fontSize: '12px', color: '#78716C', marginTop: '2px' }}>
                              Placed {new Date(o.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            background: o.orderType === 'delivery' ? '#EDE9FE' : '#FEF9C3',
                            color: o.orderType === 'delivery' ? '#6D28D9' : '#854D0E',
                            border: `1px solid ${o.orderType === 'delivery' ? '#DDD6FE' : '#FEF08A'}`,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            {o.orderType === 'delivery' ? 'Campus Delivery' : 'Counter Pickup'}
                          </span>
                        </div>

                        {/* Customer & Destination Details */}
                        <div style={{ background: '#FBF8F4', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1C1917', fontWeight: 700 }}>
                            <span>{o.name}</span>
                            <span style={{ color: '#78716C', fontWeight: 500 }}>·</span>
                            <a href={`tel:${o.phone}`} style={{ color: '#80141B', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <IconPhone size={12} color="#80141B" /> {o.phone}
                            </a>
                          </div>

                          {o.orderType === 'delivery' && o.deliveryDetails && (
                            <div style={{ marginTop: '6px', color: '#44403C', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                              <IconMapPin size={13} color="#80141B" />
                              <span>{o.deliveryDetails.zoneName} · <b>{o.deliveryDetails.address}</b></span>
                            </div>
                          )}

                          {o.note && (
                            <div style={{
                              marginTop: '8px',
                              background: '#FFFBEB',
                              color: '#92400E',
                              border: '1px solid #FDE68A',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}>
                              Note: {o.note}
                            </div>
                          )}
                        </div>

                        {/* Meal Items Checklist */}
                        <div style={{ borderTop: '1px solid #EFE6DC', paddingTop: '10px', marginBottom: '14px' }}>
                          {(o.items || []).map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px', fontSize: '14px' }}>
                              <div>
                                <span style={{
                                  display: 'inline-block',
                                  background: '#F5EFEB',
                                  color: '#1C1917',
                                  fontWeight: 800,
                                  fontSize: '12px',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  marginRight: '6px'
                                }}>
                                  {it.qty}x
                                </span>
                                <span style={{ fontWeight: 700, color: '#1C1917' }}>{it.name}</span>
                                {it.extras?.length > 0 && (
                                  <div style={{ fontSize: '12px', color: '#78716C', paddingLeft: '28px', marginTop: '2px' }}>
                                    + {it.extras.map(e => e.name).join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Primary Action Button */}
                        <button
                          disabled={loading}
                          onClick={() => handleAction(o.ref, 'start_cooking')}
                          style={{
                            width: '100%',
                            background: '#80141B',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 6px rgba(128, 20, 27, 0.2)',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <IconFlame size={16} color="#FFFFFF" />
                          <span>Start Cooking</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: In Preparation */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #EFE6DC',
                boxShadow: '0 2px 10px rgba(128, 20, 27, 0.04)',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: '#FFFBEB',
                  borderBottom: '1px solid #FDE68A',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D97706' }} />
                    <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#92400E' }}>
                      2. Cooking in Kitchen
                    </h2>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    background: '#D97706',
                    color: '#FFFFFF',
                    padding: '3px 10px',
                    borderRadius: '12px'
                  }}>
                    {preparingOrders.length}
                  </span>
                </div>

                <div style={{ padding: '16px', maxHeight: '720px', overflowY: 'auto' }}>
                  {preparingOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#A8A29E' }}>
                      <IconFlame size={32} color="#D6D3D1" />
                      <p style={{ margin: '12px 0 0 0', fontSize: '14px', fontWeight: 600 }}>Kitchen stoves are ready</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Click "Start Cooking" on new orders to move them here</p>
                    </div>
                  ) : (
                    preparingOrders.map(o => (
                      <div
                        key={o.ref}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: '12px',
                          padding: '16px',
                          marginBottom: '14px',
                          border: '1px solid #FDE68A',
                          boxShadow: '0 2px 6px rgba(217, 119, 6, 0.08)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#1C1917', letterSpacing: '-0.01em' }}>
                              #{o.ref}
                            </span>
                            <div style={{ fontSize: '12px', color: '#D97706', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <IconClock size={12} color="#D97706" /> In preparation
                            </div>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            background: o.orderType === 'delivery' ? '#EDE9FE' : '#FEF9C3',
                            color: o.orderType === 'delivery' ? '#6D28D9' : '#854D0E',
                            border: `1px solid ${o.orderType === 'delivery' ? '#DDD6FE' : '#FEF08A'}`,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            textTransform: 'uppercase'
                          }}>
                            {o.orderType === 'delivery' ? 'Campus Delivery' : 'Counter Pickup'}
                          </span>
                        </div>

                        <div style={{ background: '#FBF8F4', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
                          <span style={{ fontWeight: 700, color: '#1C1917' }}>{o.name}</span>
                          <span style={{ color: '#78716C' }}> ({o.phone})</span>
                          {o.note && (
                            <div style={{ marginTop: '6px', color: '#B45309', fontSize: '12px', fontWeight: 600 }}>
                              Note: {o.note}
                            </div>
                          )}
                        </div>

                        <div style={{ borderTop: '1px solid #EFE6DC', paddingTop: '10px', marginBottom: '14px' }}>
                          {(o.items || []).map((it, idx) => (
                            <div key={idx} style={{ marginBottom: '6px', fontSize: '14px' }}>
                              <span style={{
                                display: 'inline-block',
                                background: '#FEF3C7',
                                color: '#92400E',
                                fontWeight: 800,
                                fontSize: '12px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                marginRight: '6px'
                              }}>
                                {it.qty}x
                              </span>
                              <span style={{ fontWeight: 700, color: '#1C1917' }}>{it.name}</span>
                              {it.extras?.length > 0 && (
                                <div style={{ fontSize: '12px', color: '#78716C', paddingLeft: '28px', marginTop: '2px' }}>
                                  + {it.extras.map(e => e.name).join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <button
                          disabled={loading}
                          onClick={() => handleAction(o.ref, 'mark_ready')}
                          style={{
                            width: '100%',
                            background: '#15803D',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 6px rgba(21, 128, 61, 0.2)'
                          }}
                        >
                          <IconCheckCircle size={16} color="#FFFFFF" />
                          <span>Mark Ready for {o.orderType === 'delivery' ? 'Dispatch' : 'Pickup'}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 3: Ready Orders */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid #EFE6DC',
                boxShadow: '0 2px 10px rgba(128, 20, 27, 0.04)',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: '#F0FDF4',
                  borderBottom: '1px solid #BBF7D0',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16A34A' }} />
                    <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#166534' }}>
                      3. Ready & Handover / Dispatch
                    </h2>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    background: '#16A34A',
                    color: '#FFFFFF',
                    padding: '3px 10px',
                    borderRadius: '12px'
                  }}>
                    {readyOrders.length}
                  </span>
                </div>

                <div style={{ padding: '16px', maxHeight: '720px', overflowY: 'auto' }}>
                  {readyOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#A8A29E' }}>
                      <IconCheckCircle size={32} color="#D6D3D1" />
                      <p style={{ margin: '12px 0 0 0', fontSize: '14px', fontWeight: 600 }}>No packed meals awaiting handover</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Packed orders appear here for collection or rider pickup</p>
                    </div>
                  ) : (
                    readyOrders.map(o => (
                      <div
                        key={o.ref}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: '12px',
                          padding: '16px',
                          marginBottom: '14px',
                          border: '1px solid #BBF7D0',
                          boxShadow: '0 2px 6px rgba(22, 163, 74, 0.08)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#1C1917', letterSpacing: '-0.01em' }}>
                              #{o.ref}
                            </span>
                            <div style={{ fontSize: '12px', color: '#15803D', fontWeight: 700, marginTop: '2px' }}>
                              {ORDER_STATUS_MAP[o.orderStatus]?.label || o.orderStatus}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            background: o.orderType === 'delivery' ? '#EDE9FE' : '#FEF9C3',
                            color: o.orderType === 'delivery' ? '#6D28D9' : '#854D0E',
                            border: `1px solid ${o.orderType === 'delivery' ? '#DDD6FE' : '#FEF08A'}`,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            textTransform: 'uppercase'
                          }}>
                            {o.orderType === 'delivery' ? 'Campus Delivery' : 'Counter Pickup'}
                          </span>
                        </div>

                        <div style={{ background: '#FBF8F4', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
                          <span style={{ fontWeight: 700, color: '#1C1917' }}>{o.name}</span>
                          <span style={{ color: '#78716C' }}> ({o.phone})</span>
                        </div>

                        <div style={{ borderTop: '1px solid #EFE6DC', paddingTop: '10px', marginBottom: '14px' }}>
                          {(o.items || []).map((it, idx) => (
                            <div key={idx} style={{ marginBottom: '4px', fontSize: '13px', color: '#44403C' }}>
                              <b>{it.qty}x</b> {it.name}
                            </div>
                          ))}
                        </div>

                        {o.orderType === 'collection' ? (
                          <button
                            disabled={loading}
                            onClick={() => handleAction(o.ref, 'complete_pickup')}
                            style={{
                              width: '100%',
                              background: '#15803D',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '12px',
                              borderRadius: '8px',
                              fontWeight: 800,
                              fontSize: '14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              boxShadow: '0 2px 6px rgba(21, 128, 61, 0.2)'
                            }}
                          >
                            <IconCheckCheck size={16} color="#FFFFFF" />
                            <span>Complete Counter Pickup</span>
                          </button>
                        ) : (
                          <div style={{
                            background: '#F0F9FF',
                            border: '1px solid #BAE6FD',
                            padding: '12px',
                            borderRadius: '8px',
                            textAlign: 'center'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#0369A1', fontWeight: 700, fontSize: '13px' }}>
                              <IconBike size={16} color="#0369A1" />
                              <span>Rider Dispatch Queue</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#57534E', marginTop: '4px' }}>
                              Status: <b>{o.deliveryStatus || 'Awaiting rider pickup'}</b>
                            </div>
                            {o.deliveryAssignment?.driverName && (
                              <div style={{ fontSize: '12px', color: '#0284C7', fontWeight: 700, marginTop: '2px' }}>
                                Assigned Rider: {o.deliveryAssignment.driverName}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: DAILY STOCK & PORTIONS TRACKER                          */}
        {/* ============================================================== */}
        {activeTab === 'stock' && (
          <div>
            
            {/* KPI Metric Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
              marginBottom: '24px'
            }}>
              
              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '16px', border: '1px solid #EFE6DC', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tracked Dishes</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#1C1917', marginTop: '4px' }}>{stockKpis.totalDishes}</div>
                <div style={{ fontSize: '12px', color: '#A8A29E', marginTop: '2px' }}>Today's menu pool</div>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '16px', border: '1px solid #EFE6DC', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Prepared</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#80141B', marginTop: '4px' }}>{stockKpis.totalPrepared}</div>
                <div style={{ fontSize: '12px', color: '#A8A29E', marginTop: '2px' }}>Kitchen batches cooked</div>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '16px', border: '1px solid #EFE6DC', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reserved in Cart / Queue</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>{stockKpis.totalReserved}</div>
                <div style={{ fontSize: '12px', color: '#A8A29E', marginTop: '2px' }}>Unfulfilled active orders</div>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '16px', border: '1px solid #EFE6DC', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Sold & Served</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803D', marginTop: '4px' }}>{stockKpis.totalSold}</div>
                <div style={{ fontSize: '12px', color: '#A8A29E', marginTop: '2px' }}>Dispatched or collected</div>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '16px', border: '1px solid #EFE6DC', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Portions Available</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: stockKpis.totalRemaining > 0 ? '#15803D' : '#DC2626', marginTop: '4px' }}>
                  {stockKpis.totalRemaining}
                </div>
                <div style={{ fontSize: '12px', color: '#A8A29E', marginTop: '2px' }}>Ready to order</div>
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '16px', border: '1px solid #EFE6DC', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stock Alerts</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: stockKpis.lowStockCount > 0 ? '#D97706' : '#78716C' }}>
                    {stockKpis.lowStockCount} Low
                  </span>
                  <span style={{ color: '#D6D3D1' }}>/</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: stockKpis.soldOutCount > 0 ? '#DC2626' : '#78716C' }}>
                    {stockKpis.soldOutCount} Out
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#A8A29E', marginTop: '2px' }}>Need restock or cook</div>
              </div>

            </div>

            {/* Filter & Batch Action Toolbar */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #EFE6DC',
              padding: '16px 20px',
              marginBottom: '20px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px'
            }}>
              
              {/* Search & Category Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
                
                {/* Search Bar */}
                <div style={{ position: 'relative', minWidth: '220px', maxWidth: '320px', flex: 1 }}>
                  <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <IconSearch size={15} color="#A8A29E" />
                  </div>
                  <input
                    type="text"
                    value={stockSearch}
                    onChange={e => setStockSearch(e.target.value)}
                    placeholder="Search dishes..."
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      borderRadius: '8px',
                      border: '1px solid #E5D9CE',
                      fontSize: '13px',
                      outline: 'none',
                      background: '#FDFCFB'
                    }}
                  />
                  {stockSearch && (
                    <button
                      onClick={() => setStockSearch('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#78716C',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Dropdown */}
                {categories.length > 0 && (
                  <select
                    value={stockCategoryFilter}
                    onChange={e => setStockCategoryFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E5D9CE',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#44403C',
                      background: '#FDFCFB',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">All Categories ({categories.length})</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}

                {/* Status Filter Buttons */}
                <div style={{ display: 'flex', background: '#F5EFEB', padding: '3px', borderRadius: '8px', border: '1px solid #E5D9CE' }}>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'in_stock', label: 'In Stock' },
                    { id: 'low_stock', label: 'Low Stock (≤5)' },
                    { id: 'sold_out', label: 'Sold Out' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setStockStatusFilter(tab.id)}
                      style={{
                        background: stockStatusFilter === tab.id ? '#80141B' : 'transparent',
                        color: stockStatusFilter === tab.id ? '#FFFFFF' : '#57534E',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

              </div>

              {/* Batch Increment Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#78716C' }}>Batch Cook:</span>
                <button
                  onClick={() => handleBatchAddPortions(10)}
                  title="Add +10 portions to all currently visible available items"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#FDF2F2',
                    color: '#80141B',
                    border: '1px solid #F8D7DA',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <IconPlus size={12} color="#80141B" /> +10 All
                </button>
                <button
                  onClick={() => handleBatchAddPortions(25)}
                  title="Add +25 portions to all currently visible available items"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#FDF2F2',
                    color: '#80141B',
                    border: '1px solid #F8D7DA',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <IconPlus size={12} color="#80141B" /> +25 All
                </button>
              </div>

            </div>

            {/* Formula Explanation Callout */}
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              padding: '10px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div>
                <b>Portion Formula:</b> Remaining Available = <b>Prepared</b> - <b>Reserved (in carts/orders)</b> - <b>Sold</b>.
                When remaining drops to 0, ordering automatically locks to prevent overbooking.
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>
                Showing <b>{filteredStockList.length}</b> of {enrichedStock.length} items
              </div>
            </div>

            {/* Stock Items Table */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #EFE6DC',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#F5EFEB', borderBottom: '1px solid #E5D9CE', color: '#44403C' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Meal Item</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status Mode</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Prepared</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Reserved</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Sold</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Remaining</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Cook Adjust</th>
                      <th style={{ padding: '14px 16px', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Exact Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockList.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '48px 20px', color: '#A8A29E' }}>
                          <IconUtensils size={32} color="#D6D3D1" />
                          <p style={{ margin: '12px 0 0 0', fontWeight: 600 }}>No dishes matched your filter criteria</p>
                        </td>
                      </tr>
                    ) : (
                      filteredStockList.map((item, idx) => {
                        return (
                          <tr
                            key={item.mealId}
                            style={{
                              borderBottom: '1px solid #EFE6DC',
                              background: idx % 2 === 0 ? '#FFFFFF' : '#FCFAF7',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            {/* Meal Name & Price */}
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 800, color: '#1C1917', fontSize: '15px' }}>{item.mealName}</div>
                              {item.price > 0 && (
                                <div style={{ fontSize: '12px', color: '#78716C', marginTop: '2px' }}>
                                  {money(item.price)}
                                </div>
                              )}
                            </td>

                            {/* Category Badge */}
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                background: '#F5EFEB',
                                color: '#57534E',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em'
                              }}>
                                {item.category}
                              </span>
                            </td>

                            {/* Status Selector */}
                            <td style={{ padding: '14px 16px' }}>
                              <select
                                value={item.status}
                                onChange={e => handleStockUpdate(item.mealId, { status: e.target.value })}
                                style={{
                                  background: item.status === 'available' ? '#F0FDF4' : item.status === 'sold_out' ? '#FEF2F2' : '#FFFBEB',
                                  color: item.status === 'available' ? '#166534' : item.status === 'sold_out' ? '#991B1B' : '#92400E',
                                  border: `1px solid ${item.status === 'available' ? '#BBF7D0' : item.status === 'sold_out' ? '#FCA5A5' : '#FDE68A'}`,
                                  borderRadius: '6px',
                                  padding: '5px 8px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  outline: 'none'
                                }}
                              >
                                <option value="available">Available</option>
                                <option value="sold_out">Sold Out</option>
                                <option value="temporarily_paused">Temporarily Paused</option>
                                <option value="unavailable_today">Unavailable Today</option>
                              </select>
                            </td>

                            {/* Prepared */}
                            <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, fontSize: '15px', color: '#1C1917' }}>
                              {item.quantityPrepared}
                            </td>

                            {/* Reserved */}
                            <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, fontSize: '15px', color: '#D97706' }}>
                              {item.quantityReserved}
                            </td>

                            {/* Sold */}
                            <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, fontSize: '15px', color: '#15803D' }}>
                              {item.quantitySold}
                            </td>

                            {/* Remaining Badge */}
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block',
                                minWidth: '70px',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontWeight: 800,
                                fontSize: '13px',
                                background: item.isSoldOut ? '#FEE2E2' : item.isLowStock ? '#FEF3C7' : '#DCFCE7',
                                color: item.isSoldOut ? '#991B1B' : item.isLowStock ? '#B45309' : '#15803D',
                                border: `1px solid ${item.isSoldOut ? '#FCA5A5' : item.isLowStock ? '#FDE68A' : '#86EFAC'}`
                              }}>
                                {item.remaining} {item.remaining === 1 ? 'portion' : 'portions'}
                              </span>
                            </td>

                            {/* Quick Increment Controls */}
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => handleStockUpdate(item.mealId, { addPrepared: 5 })}
                                  title="Add 5 portions cooked"
                                  style={{
                                    background: '#FFFFFF',
                                    color: '#44403C',
                                    border: '1px solid #E5D9CE',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  +5
                                </button>
                                <button
                                  onClick={() => handleStockUpdate(item.mealId, { addPrepared: 10 })}
                                  title="Add 10 portions cooked"
                                  style={{
                                    background: '#80141B',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  +10
                                </button>
                                <button
                                  onClick={() => handleStockUpdate(item.mealId, { addPrepared: 25 })}
                                  title="Add 25 portions cooked"
                                  style={{
                                    background: '#FFFFFF',
                                    color: '#80141B',
                                    border: '1px solid #80141B',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  +25
                                </button>
                                <button
                                  onClick={() => handleStockUpdate(item.mealId, { status: item.status === 'sold_out' ? 'available' : 'sold_out' })}
                                  style={{
                                    background: item.status === 'sold_out' ? '#DCFCE7' : '#FEE2E2',
                                    color: item.status === 'sold_out' ? '#15803D' : '#991B1B',
                                    border: `1px solid ${item.status === 'sold_out' ? '#86EFAC' : '#FCA5A5'}`,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {item.status === 'sold_out' ? 'Restore' : 'Mark Out'}
                                </button>
                              </div>
                            </td>

                            {/* Exact Portions Setter */}
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="500"
                                  placeholder="Exact"
                                  value={exactPortionInputs[item.mealId] ?? ''}
                                  onChange={e => {
                                    const val = e.target.value
                                    setExactPortionInputs(prev => ({ ...prev, [item.mealId]: val }))
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSetExactPortions(item.mealId)
                                  }}
                                  style={{
                                    width: '64px',
                                    padding: '4px 6px',
                                    borderRadius: '6px',
                                    border: '1px solid #E5D9CE',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    outline: 'none'
                                  }}
                                />
                                <button
                                  onClick={() => handleSetExactPortions(item.mealId)}
                                  disabled={!exactPortionInputs[item.mealId]}
                                  style={{
                                    background: exactPortionInputs[item.mealId] ? '#15803D' : '#F5EFEB',
                                    color: exactPortionInputs[item.mealId] ? '#FFFFFF' : '#A8A29E',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: exactPortionInputs[item.mealId] ? 'pointer' : 'default'
                                  }}
                                >
                                  Set
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  )
}
