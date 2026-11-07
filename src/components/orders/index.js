import { ORDER_STATUS_MAP, PAYMENT_STATUS_MAP, DELIVERY_STATUS_MAP } from '../../data.js'

export function OrderStatusBadge({ status, type = 'order' }) {
  const map = type === 'payment'
    ? PAYMENT_STATUS_MAP
    : type === 'delivery'
      ? DELIVERY_STATUS_MAP
      : ORDER_STATUS_MAP
  const conf = map[status] || { label: status, color: '#64748b' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 700,
      background: conf.color + '22',
      color: conf.color,
      border: `1px solid ${conf.color}`
    }}>
      {conf.label}
    </span>
  )
}
