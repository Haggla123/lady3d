import { useState, useEffect } from 'react'
import { api } from '../../services/api/client.js'
import { playKitchenChime } from '../../services/notifications/chime.js'
import { money } from '../../utils/money.js'
import { ORDER_STATUS_MAP, BRANCHES } from '../../data.js'
import { Link } from '../../components/ui.jsx'

export default function KitchenDashboard({ branchId: propBranch = 'cug' }) {
  const [selectedBranch, setSelectedBranch] = useState(propBranch)
  const [orders, setOrders] = useState([])
  const [availability, setAvailability] = useState([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState('queue') // 'queue' | 'stock'
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  const notify = msg => {
    setStatusMsg(msg)
    setTimeout(() => setStatusMsg(''), 4000)
  }

  const loadData = async () => {
    try {
      const [ordRes, availRes] = await Promise.all([
        api('/kitchen/orders'),
        api(`/kitchen/availability?branch=${selectedBranch}`)
      ])
      const filtered = (ordRes.orders || []).filter(o => o.branch === selectedBranch)
      if (soundEnabled && filtered.some(o => o.orderStatus === 'confirmed' && !orders.find(prev => prev.ref === o.ref))) {
        playKitchenChime()
      }
      setOrders(filtered)
      setAvailability(availRes.records || [])
    } catch (err) {
      console.error('Kitchen refresh failed:', err.message)
    }
  }

  useEffect(() => {
    loadData()
    const timer = setInterval(loadData, 8000)
    return () => clearInterval(timer)
  }, [selectedBranch, soundEnabled])

  const handleAction = async (ref, action) => {
    setLoading(true)
    try {
      await api(`/kitchen/orders/${ref}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ action })
      })
      notify(`Order ${ref} updated!`)
      await loadData()
    } catch (err) {
      notify(err.message)
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
      notify('Stock portions updated')
      await loadData()
    } catch (err) {
      notify(err.message)
    }
  }

  const confirmedOrders = orders.filter(o => o.orderStatus === 'confirmed')
  const preparingOrders = orders.filter(o => o.orderStatus === 'preparing')
  const readyOrders = orders.filter(o => ['ready_for_collection', 'ready_for_dispatch'].includes(o.orderStatus))

  const currentBranchObj = BRANCHES.find(b => b.id === selectedBranch) || BRANCHES[0]

  return (
    <div className="kitchen-portal-root" style={{ background: '#0f172a', minHeight: '100vh', color: '#f8fafc', padding: '20px' }}>
      {/* Header bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="/lady3d-logo.jpg" alt="Lady 3D" style={{ width: 44, height: 44, borderRadius: 10, border: '2px solid #ef4444' }} />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>
              🍳 KITCHEN ORDER DISPLAY · {currentBranchObj.name.toUpperCase()}
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Real-time preparation queue & daily food portions</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Branch Switcher */}
          <div style={{ background: '#1e293b', padding: '4px', borderRadius: '8px', display: 'flex', border: '1px solid #334155' }}>
            <button
              onClick={() => setSelectedBranch('cug')}
              style={{
                background: selectedBranch === 'cug' ? '#ef4444' : 'transparent',
                color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              CUG Campus
            </button>
            <button
              onClick={() => setSelectedBranch('sunyani')}
              style={{
                background: selectedBranch === 'sunyani' ? '#ef4444' : 'transparent',
                color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Sunyani Main
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => { setSoundEnabled(!soundEnabled); playKitchenChime() }}
            style={{
              background: soundEnabled ? '#10b981' : '#475569',
              color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
            }}
          >
            🔔 {soundEnabled ? 'Chime ON' : 'Chime OFF'}
          </button>

          {/* Navigation Links */}
          <Link to="/admin/overview" style={{ color: '#cbd5e1', textDecoration: 'none', background: '#1e293b', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}>
            ← Admin Console
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('queue')}
          style={{
            padding: '10px 20px', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer',
            background: activeTab === 'queue' ? '#ef4444' : '#1e293b', color: '#fff'
          }}
        >
          📋 Active Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          style={{
            padding: '10px 20px', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer',
            background: activeTab === 'stock' ? '#ef4444' : '#1e293b', color: '#fff'
          }}
        >
          🍲 Daily Stock & Portions Tracker ({availability.length})
        </button>
      </div>

      {statusMsg && (
        <div style={{ background: '#3b82f6', color: '#fff', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>
          {statusMsg}
        </div>
      )}

      {/* TAB 1: KITCHEN WORKFLOW QUEUE */}
      {activeTab === 'queue' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Column 1: New Confirmed Orders */}
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '16px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#60a5fa' }}>
                1. NEW ORDERS ({confirmedOrders.length})
              </h2>
              <span style={{ fontSize: '12px', background: '#1e3a8a', color: '#93c5fd', padding: '2px 8px', borderRadius: '12px' }}>Awaiting Cooking</span>
            </div>

            {confirmedOrders.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '30px 0' }}>No new confirmed orders right now.</p>
            ) : (
              confirmedOrders.map(o => (
                <div key={o.ref} style={{ background: '#0f172a', borderRadius: '10px', padding: '14px', marginBottom: '14px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <b style={{ color: '#f8fafc', fontSize: '16px' }}>{o.ref}</b>
                    <span style={{ fontSize: '12px', background: o.orderType === 'delivery' ? '#0369a1' : '#065f46', color: '#fff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                      {o.orderType}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                    Customer: <b style={{ color: '#fff' }}>{o.name}</b> ({o.phone})
                  </div>
                  {o.orderType === 'delivery' && (
                    <div style={{ fontSize: '12px', background: '#1e293b', padding: '6px 8px', borderRadius: '6px', color: '#38bdf8', marginBottom: '8px' }}>
                      📍 {o.deliveryDetails?.zoneName}: <b>{o.deliveryDetails?.address}</b>
                    </div>
                  )}
                  {o.note && (
                    <div style={{ fontSize: '12px', background: '#451a03', padding: '6px 8px', borderRadius: '6px', color: '#fbbf24', marginBottom: '8px' }}>
                      Note: {o.note}
                    </div>
                  )}

                  <div style={{ borderTop: '1px dashed #334155', paddingTop: '8px', marginBottom: '10px' }}>
                    {o.items.map((it, idx) => (
                      <div key={idx} style={{ fontSize: '14px', color: '#f1f5f9', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span><b>{it.qty}x</b> {it.name}</span>
                        {it.extras?.length > 0 && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>+ {it.extras.map(e => e.name).join(', ')}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    disabled={loading}
                    onClick={() => handleAction(o.ref, 'start_cooking')}
                    style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '14px' }}
                  >
                    🔥 Start Cooking
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Column 2: In Preparation */}
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '16px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '2px solid #8b5cf6', paddingBottom: '8px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#a78bfa' }}>
                2. COOKING NOW ({preparingOrders.length})
              </h2>
              <span style={{ fontSize: '12px', background: '#4c1d95', color: '#c4b5fd', padding: '2px 8px', borderRadius: '12px' }}>In Progress</span>
            </div>

            {preparingOrders.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '30px 0' }}>No meals currently in the kitchen pan.</p>
            ) : (
              preparingOrders.map(o => (
                <div key={o.ref} style={{ background: '#0f172a', borderRadius: '10px', padding: '14px', marginBottom: '14px', border: '1px solid #8b5cf6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <b style={{ color: '#f8fafc', fontSize: '16px' }}>{o.ref}</b>
                    <span style={{ fontSize: '12px', background: o.orderType === 'delivery' ? '#0369a1' : '#065f46', color: '#fff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                      {o.orderType}
                    </span>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    {o.items.map((it, idx) => (
                      <div key={idx} style={{ fontSize: '14px', color: '#f1f5f9', marginBottom: '4px' }}>
                        <b>{it.qty}x</b> {it.name}
                        {it.extras?.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#a78bfa', paddingLeft: '14px' }}>
                            {it.extras.map(e => e.name).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    disabled={loading}
                    onClick={() => handleAction(o.ref, 'mark_ready')}
                    style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '14px' }}
                  >
                    ✅ Mark Ready for {o.orderType === 'delivery' ? 'Dispatch' : 'Pickup'}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Column 3: Ready Orders */}
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '16px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '2px solid #10b981', paddingBottom: '8px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#34d399' }}>
                3. READY & DISPATCH ({readyOrders.length})
              </h2>
              <span style={{ fontSize: '12px', background: '#064e3b', color: '#6ee7b7', padding: '2px 8px', borderRadius: '12px' }}>Packed</span>
            </div>

            {readyOrders.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '30px 0' }}>No ready meals awaiting handover.</p>
            ) : (
              readyOrders.map(o => (
                <div key={o.ref} style={{ background: '#0f172a', borderRadius: '10px', padding: '14px', marginBottom: '14px', border: '1px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <b style={{ color: '#f8fafc', fontSize: '16px' }}>{o.ref}</b>
                    <span style={{ fontSize: '12px', background: o.orderType === 'delivery' ? '#0284c7' : '#059669', color: '#fff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                      {o.orderType}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                    Customer: <b style={{ color: '#fff' }}>{o.name}</b> ({o.phone})
                  </div>
                  <div style={{ fontSize: '12px', color: '#10b981', marginBottom: '10px' }}>
                    Status: <b>{ORDER_STATUS_MAP[o.orderStatus]?.label || o.orderStatus}</b>
                  </div>

                  {o.orderType === 'collection' ? (
                    <button
                      disabled={loading}
                      onClick={() => handleAction(o.ref, 'complete_pickup')}
                      style={{ width: '100%', background: '#059669', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '14px' }}
                    >
                      🤝 Hand Over & Complete Pickup
                    </button>
                  ) : (
                    <div style={{ background: '#1e293b', padding: '8px', borderRadius: '6px', fontSize: '12px', textAlign: 'center', color: '#38bdf8' }}>
                      🛵 Rider queue: {o.deliveryStatus || 'Awaiting rider'}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE DAILY STOCK & PORTION TRACKER */}
      {activeTab === 'stock' && (
        <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
              Live Daily Portions Management ({selectedBranch.toUpperCase()})
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
              Formula: <b>Remaining = Prepared - Reserved - Sold</b>. When remaining reaches 0, ordering automatically locks.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '2px solid #334155' }}>
                  <th style={{ padding: '12px' }}>Meal Item</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Prepared</th>
                  <th style={{ padding: '12px' }}>Reserved</th>
                  <th style={{ padding: '12px' }}>Sold</th>
                  <th style={{ padding: '12px' }}>Remaining</th>
                  <th style={{ padding: '12px' }}>Quick Adjust</th>
                </tr>
              </thead>
              <tbody>
                {availability.map(item => {
                  const remaining = Math.max(0, item.quantityPrepared - item.quantityReserved - item.quantitySold)
                  const isSoldOut = item.status === 'sold_out' || remaining <= 0

                  return (
                    <tr key={item.mealId} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px', fontWeight: 700 }}>{item.mealName}</td>
                      <td style={{ padding: '12px' }}>
                        <select
                          value={item.status}
                          onChange={e => handleStockUpdate(item.mealId, { status: e.target.value })}
                          style={{
                            background: item.status === 'available' ? '#064e3b' : '#7f1d1d',
                            color: '#fff', border: '1px solid #475569', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: 700
                          }}
                        >
                          <option value="available">Available</option>
                          <option value="sold_out">Sold Out</option>
                          <option value="temporarily_paused">Temporarily Paused</option>
                          <option value="unavailable_today">Unavailable Today</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700 }}>{item.quantityPrepared}</td>
                      <td style={{ padding: '12px', color: '#f59e0b', fontWeight: 700 }}>{item.quantityReserved}</td>
                      <td style={{ padding: '12px', color: '#10b981', fontWeight: 700 }}>{item.quantitySold}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          background: isSoldOut ? '#ef4444' : '#10b981',
                          color: '#fff', padding: '3px 10px', borderRadius: '12px', fontWeight: 800, fontSize: '13px'
                        }}>
                          {remaining} left
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleStockUpdate(item.mealId, { addPrepared: 10 })}
                            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}
                            title="Cooked 10 more portions"
                          >
                            +10 Cooked
                          </button>
                          <button
                            onClick={() => handleStockUpdate(item.mealId, { status: item.status === 'sold_out' ? 'available' : 'sold_out' })}
                            style={{ background: item.status === 'sold_out' ? '#10b981' : '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 700 }}
                          >
                            {item.status === 'sold_out' ? 'Restore' : 'Sold Out'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
