import { useApp } from '../../store.jsx'
import { Link } from '../../components/ui.jsx'

export default function DashboardsDirectory() {
  const { staffUser, staffLogout, say } = useApp()

  const portals = [
    {
      title: 'Master Admin Dashboard',
      path: '/admin/overview',
      role: 'Owner (Central Admin) & Managers',
      desc: 'Central control for both branches. Manage daily menu, categories, branch prices, delivery zones, staff roles, capacity limits, and consolidated sales reports.',
      color: '#dc2626',
      badge: 'Full Access',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      )
    },
    {
      title: 'Catholic University Annex Console',
      path: '/branch/cug',
      role: 'CUG Branch Manager & Cashier',
      desc: 'Locked to CUG Fiapre Campus operations. Counter walk-in POS, campus kitchen queue, student deliveries, cash drawer, and CUG daily menu availability.',
      color: '#0284c7',
      badge: 'Fiapre Campus',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    {
      title: 'Sunyani Main Branch Console',
      path: '/branch/sunyani',
      role: 'Sunyani Main Manager & Cashier',
      desc: 'Locked to Sunyani Market Circle operations. Counter POS, town deliveries, cash & MoMo reconciliations, and local dishes pricing.',
      color: '#d97706',
      badge: 'Market Circle',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      )
    },
    {
      title: 'Kitchen Order Display System',
      path: '/kitchen',
      role: 'Kitchen Chefs & Line Staff',
      desc: 'High-contrast real-time kitchen tablet display. Audio bell chimes on new orders, order advancement (Cooking → Ready), and live daily portions tracker (Prepared/Sold/Remaining).',
      color: '#10b981',
      badge: 'Kitchen Tablet',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      )
    },
    {
      title: 'Delivery & Dispatch Hub',
      path: '/delivery',
      role: 'Dispatchers & Delivery Riders',
      desc: 'Assign authorized dispatch riders, track in-transit deliveries, view hostel/street addresses, record customer contact, confirm delivery, and configure delivery zones & fees.',
      color: '#6366f1',
      badge: 'Riders & Dispatch',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18.5" cy="17.5" r="3.5"/>
          <circle cx="5.5" cy="17.5" r="3.5"/>
          <circle cx="15" cy="5" r="1"/>
          <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
        </svg>
      )
    }
  ]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#fee2e2', color: '#991b1b', padding: '6px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>
          <span>LADY 3D’S OPERATIONAL CONSOLES</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b', margin: '0 0 10px 0' }}>
          All Platform Dashboards & Portals
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '650px', margin: '0 auto' }}>
          Quick access to all 4 interconnected operations portals for management, kitchen, dispatch riders, and branch teams.
        </p>

        {staffUser ? (
          <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '12px', background: '#f1f5f9', padding: '8px 18px', borderRadius: '10px' }}>
            <span style={{ fontSize: '14px', color: '#334155' }}>
              Signed in as: <b>{staffUser.name}</b> (<span style={{ color: '#dc2626', fontWeight: 700 }}>{staffUser.role}</span> · {staffUser.assignedBranch?.toUpperCase() || 'ALL'})
            </span>
            <button
              onClick={() => staffLogout().then(() => say('Signed out'))}
              style={{ background: '#e2e8f0', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div style={{ marginTop: '16px' }}>
            <Link to="/staff-login" style={{ display: 'inline-block', background: '#dc2626', color: '#fff', textDecoration: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '14px' }}>
              Sign In to Staff Account →
            </Link>
          </div>
        )}
      </div>

      {/* Grid of Portals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {portals.map(p => (
          <div
            key={p.path}
            style={{
              background: '#fff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: p.color, background: p.color + '18', padding: '4px 10px', borderRadius: '6px' }}>
                  {p.badge}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>{p.path}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ color: p.color, display: 'inline-flex' }}>{p.icon}</span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {p.title}
                </h2>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '12px' }}>
                Target Role: <span style={{ color: '#334155' }}>{p.role}</span>
              </div>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                {p.desc}
              </p>
            </div>

            <Link
              to={p.path}
              style={{
                display: 'block',
                textAlign: 'center',
                background: p.color,
                color: '#fff',
                textDecoration: 'none',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '14px',
                boxShadow: `0 4px 12px ${p.color}40`
              }}
            >
              Open {p.title} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
