import { useApp, money } from '../../store.jsx'

export function DeliveryZoneSelector({ className = '' }) {
  const { branch, deliveryZones, selectedZoneId, setSelectedZoneId, orderType, setOrderType } = useApp()

  if (orderType !== 'delivery') return null

  const applicableZones = deliveryZones.filter(z => z.branchId === branch && z.active)

  return (
    <div className={`delivery-zone-selector-wrap ${className}`} style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
        Select Delivery Zone & Campus Area
      </label>
      <select
        value={selectedZoneId}
        onChange={e => setSelectedZoneId(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1.5px solid #cbd5e1',
          fontSize: '14px',
          background: '#fff',
          fontWeight: 600
        }}
      >
        {applicableZones.map(zone => (
          <option key={zone.id} value={zone.id}>
            {zone.name} (+{money(zone.fee)} delivery fee · {zone.estimatedMinutes})
          </option>
        ))}
      </select>
    </div>
  )
}
