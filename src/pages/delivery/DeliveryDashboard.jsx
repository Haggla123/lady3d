import { useState, useEffect } from 'react'
import { api } from '../../services/api/client.js'
import { money } from '../../utils/money.js'
import { DELIVERY_STATUS_MAP, ORDER_STATUS_MAP, BRANCHES } from '../../data.js'
import { Link } from '../../components/ui.jsx'

export default function DeliveryDashboard({ branchId: initialBranch = 'all', staffUser }) {
  const [selectedBranch, setSelectedBranch] = useState(initialBranch)
  const [orders, setOrders] = useState([])
  const [zones, setZones] = useState([])
  const [drivers, setDrivers] = useState([])
  const [driverChoice, setDriverChoice] = useState({})
  const canManage = ['Owner', 'Manager'].includes(staffUser?.role)
  const canChooseBranch = canManage && (staffUser?.role === 'Owner' || staffUser?.assignedBranch === 'all')
  const [activeTab, setActiveTab] = useState('deliveries') // 'deliveries' | 'zones'
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [failModalRef, setFailModalRef] = useState(null)
  const [failReason, setFailReason] = useState('')

  // Zone creation form state
  const [newZone, setNewZone] = useState({
    id: '', branchId: initialBranch === 'sunyani' ? 'sunyani' : 'cug', name: '', fee: 5, minOrderValue: 20, estimatedMinutes: '20-30 mins', active: true
  })

  const notify = text => {
    setMsg(text)
    setTimeout(() => setMsg(''), 4000)
  }

  const loadData = async () => {
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
    }
  }

  useEffect(() => {
    loadData()
    const timer = setInterval(loadData, 10000)
    return () => clearInterval(timer)
  }, [selectedBranch, canManage])

  const handleAssign = async (ref) => {
    const driverId = driverChoice[ref]
    if (!driverId) return notify('Select an active rider account first.')
    const driver = drivers.find(person => person.id === driverId)
    if (!driver) return notify('That rider is not available for this branch.')
    try {
      await api(`/delivery/orders/${ref}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ driverId })
      })
      notify(`Assigned ${driver.name} to order ${ref}`)
      await loadData()
    } catch (err) {
      notify(err.message)
    }
  }

  const handlePickup = async (ref) => {
    try {
      await api(`/delivery/orders/${ref}/pickup`, { method: 'PATCH' })
      notify(`Order ${ref} picked up by rider and out for delivery`)
      await loadData()
    } catch (err) {
      notify(err.message)
    }
  }

  const handleDeliver = async (ref) => {
    try {
      await api(`/delivery/orders/${ref}/deliver`, { method: 'PATCH' })
      notify(`Order ${ref} marked delivered!`)
      await loadData()
    } catch (err) {
      notify(err.message)
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
      notify(err.message)
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
      notify(err.message)
    }
  }

  return (
    <div style={{ background: '#090d16', minHeight: '100vh', color: '#f1f5f9', padding: '24px' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/lady3d-logo.jpg" alt="Lady 3D" style={{ width: 44, height: 44, borderRadius: 10, border: '2px solid #0284c7' }} />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#38bdf8' }}>
              🛵 DELIVERY & DISPATCH OPERATIONS
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Rider dispatching, live tracking & delivery zone controls</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {canChooseBranch && <div style={{ background: '#1e293b', padding: '4px', borderRadius: '8px', display: 'flex' }}>
            <button
              onClick={() => setSelectedBranch('all')}
              style={{
                background: selectedBranch === 'all' ? '#0284c7' : 'transparent',
                color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              All Branches
            </button>
            <button
              onClick={() => setSelectedBranch('cug')}
              style={{
                background: selectedBranch === 'cug' ? '#0284c7' : 'transparent',
                color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              CUG Campus
            </button>
            <button
              onClick={() => setSelectedBranch('sunyani')}
              style={{
                background: selectedBranch === 'sunyani' ? '#0284c7' : 'transparent',
                color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Sunyani Main
            </button>
          </div>}

          {canManage && <Link to="/admin/overview" style={{ color: '#cbd5e1', textDecoration: 'none', background: '#1e293b', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
            ← Admin Console
          </Link>}
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('deliveries')}
          style={{
            padding: '10px 20px', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer',
            background: activeTab === 'deliveries' ? '#0284c7' : '#1e293b', color: '#fff'
          }}
        >
          📦 Active Deliveries ({orders.length})
        </button>
        {canManage && <button
          onClick={() => setActiveTab('zones')}
          style={{
            padding: '10px 20px', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer',
            background: activeTab === 'zones' ? '#0284c7' : '#1e293b', color: '#fff'
          }}
        >
          🗺️ Delivery Zones & Fees ({zones.length})
        </button>}
      </div>

      {msg && (
        <div style={{ background: '#0284c7', color: '#fff', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* TAB 1: DELIVERIES LIST */}
      {activeTab === 'deliveries' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
          {orders.length === 0 ? (
            <div style={{ background: '#1e293b', padding: '40px', borderRadius: '12px', textAlign: 'center', gridColumn: '1 / -1', color: '#94a3b8' }}>
              No active delivery orders for the selected branch.
            </div>
          ) : (
            orders.map(o => {
              const dMap = DELIVERY_STATUS_MAP[o.deliveryStatus] || { label: o.deliveryStatus, color: '#94a3b8' }
              const oMap = ORDER_STATUS_MAP[o.orderStatus] || { label: o.orderStatus, color: '#94a3b8' }

              return (
                <div key={o.ref} style={{ background: '#1e293b', borderRadius: '12px', padding: '18px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>{o.ref}</span>
                      <span style={{ fontSize: '12px', background: dMap.color + '22', color: dMap.color, border: `1px solid ${dMap.color}`, padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        {dMap.label}
                      </span>
                    </div>

                    {/* Customer info */}
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                      Customer: <b>{o.name}</b> · <a href={`tel:${o.phone}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>📞 {o.phone}</a>
                    </div>

                    {/* Address block */}
                    <div style={{ background: '#0f172a', borderRadius: '8px', padding: '10px', marginBottom: '12px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Destination:</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                        {o.deliveryDetails?.zoneName}
                      </div>
                      <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px' }}>
                        📍 {o.deliveryDetails?.address || o.address}
                      </div>
                      {o.deliveryDetails?.instructions && (
                        <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '4px' }}>
                          Note: {o.deliveryDetails.instructions}
                        </div>
                      )}
                    </div>

                    {/* Items & Payment */}
                    <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '10px' }}>
                      Meals: {o.items.map(it => `${it.qty}x ${it.name}`).join(', ')}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid #334155', paddingTop: '8px', marginBottom: '14px' }}>
                      <span>Total: <b>{money(o.total)}</b> (Fee: {money(o.deliveryFee)})</span>
                      <span style={{ color: o.paymentStatus === 'paid' ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                        {o.pay.toUpperCase()} · {o.paymentStatus.toUpperCase()}
                      </span>
                    </div>

                    {/* Assigned Rider */}
                    {o.deliveryAssignment?.driverName && (
                      <div style={{ fontSize: '12px', background: '#0c4a6e', color: '#bae6fd', padding: '6px 10px', borderRadius: '6px', marginBottom: '14px' }}>
                        🛵 Rider: <b>{o.deliveryAssignment.driverName}</b> ({o.deliveryAssignment.driverPhone || 'On route'})
                      </div>
                    )}
                  </div>

                  {/* Action Buttons based on delivery state */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {canManage && ['awaiting_assignment', 'failed_delivery'].includes(o.deliveryStatus) && (
                      <>
                      <select value={driverChoice[o.ref] || ''} onChange={event => setDriverChoice(current => ({ ...current, [o.ref]: event.target.value }))} aria-label={`Rider for ${o.ref}`} style={{ flex: 1, padding: '9px', borderRadius: '8px' }}>
                        <option value="">Select rider…</option>
                        {drivers.filter(driver => driver.branch === 'all' || driver.branch === o.branch).map(driver => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                      </select>
                      <button
                        onClick={() => handleAssign(o.ref)}
                        style={{ flex: 1, background: '#0284c7', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        👤 {o.deliveryStatus === 'failed_delivery' ? 'Reassign Rider' : 'Assign Rider'}
                      </button>
                      </>
                    )}

                    {['assigned', 'awaiting_pickup'].includes(o.deliveryStatus) && (
                      <button
                        onClick={() => handlePickup(o.ref)}
                        style={{ flex: 1, background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        📦 Confirm Pickup from Kitchen
                      </button>
                    )}

                    {['picked_up', 'in_transit'].includes(o.deliveryStatus) && (
                      <>
                        <button
                          onClick={() => handleDeliver(o.ref)}
                          style={{ flex: 2, background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          ✅ Confirm Delivered
                        </button>
                        <button
                          onClick={() => setFailModalRef(o.ref)}
                          style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          ⚠️ Issue
                        </button>
                      </>
                    )}

                    {o.deliveryStatus === 'delivered' && (
                      <div style={{ width: '100%', textAlign: 'center', color: '#10b981', fontWeight: 700, fontSize: '13px' }}>
                        ✓ Completed & Closed
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* TAB 2: ZONES & FEES CONFIGURATION */}
      {activeTab === 'zones' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0' }}>Approved Delivery Zones & Fees</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', borderBottom: '2px solid #334155' }}>
                    <th style={{ padding: '10px' }}>Zone ID</th>
                    <th style={{ padding: '10px' }}>Branch</th>
                    <th style={{ padding: '10px' }}>Zone Name</th>
                    <th style={{ padding: '10px' }}>Delivery Fee</th>
                    <th style={{ padding: '10px' }}>Min Order</th>
                    <th style={{ padding: '10px' }}>Est. Time</th>
                    <th style={{ padding: '10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map(z => (
                    <tr key={z.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '10px', color: '#94a3b8' }}>{z.id}</td>
                      <td style={{ padding: '10px', textTransform: 'uppercase', fontWeight: 700 }}>{z.branchId}</td>
                      <td style={{ padding: '10px', fontWeight: 700 }}>{z.name}</td>
                      <td style={{ padding: '10px', color: '#38bdf8', fontWeight: 800 }}>{money(z.fee)}</td>
                      <td style={{ padding: '10px' }}>{money(z.minOrderValue)}</td>
                      <td style={{ padding: '10px' }}>{z.estimatedMinutes}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ background: z.active ? '#064e3b' : '#7f1d1d', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
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
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px 0', color: '#38bdf8' }}>+ Add New Delivery Zone</h3>
            <form onSubmit={handleCreateZone} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Branch</label>
                <select
                  value={newZone.branchId}
                  onChange={e => setNewZone({ ...newZone, branchId: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '6px', marginTop: '4px' }}
                >
                  <option value="cug">Catholic University (CUG)</option>
                  <option value="sunyani">Sunyani Main Branch</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Zone ID (slug)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. cug-hall-3"
                  value={newZone.id}
                  onChange={e => setNewZone({ ...newZone, id: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '6px', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Zone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Faculty Block & Cafeteria Area"
                  value={newZone.name}
                  onChange={e => setNewZone({ ...newZone, name: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '6px', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Fee (GH₵)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newZone.fee}
                    onChange={e => setNewZone({ ...newZone, fee: Number(e.target.value) })}
                    style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '6px', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Min Order (GH₵)</label>
                  <input
                    type="number"
                    min="0"
                    value={newZone.minOrderValue}
                    onChange={e => setNewZone({ ...newZone, minOrderValue: Number(e.target.value) })}
                    style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '6px', marginTop: '4px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', marginTop: '8px' }}
              >
                Save Delivery Zone
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Failure Reason Modal */}
      {failModalRef && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '440px', border: '1px solid #ef4444' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#ef4444' }}>Report Delivery Issue · {failModalRef}</h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1' }}>Please provide the reason the order could not be completed (e.g., customer unreachable, invalid hostel location):</p>
            <textarea
              rows="3"
              value={failReason}
              onChange={e => setFailReason(e.target.value)}
              placeholder="Explain what happened..."
              style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setFailModalRef(null)}
                style={{ background: '#475569', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleFail}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
