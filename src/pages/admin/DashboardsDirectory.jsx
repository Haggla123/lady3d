import { useApp } from '../../store.jsx'
import { Link } from '../../components/ui.jsx'

export default function DashboardsDirectory() {
  const { staffUser, staffLogout, say } = useApp()

  const portals = [
    {
      title: '👑 Master Admin Dashboard',
      path: '/admin/overview',
      role: 'Owner (Central Admin) & Managers',
      desc: 'Central control for both branches. Manage daily menu, categories, branch prices, delivery zones, staff roles, capacity limits, and consolidated sales reports.',
      color: '#dc2626',
      badge: 'Full Access'
    },
    {
      title: '🏫 Catholic University Annex Console',
      path: '/branch/cug',
      role: 'CUG Branch Manager & Cashier',
      desc: 'Locked to CUG Fiapre Campus operations. Counter walk-in POS, campus kitchen queue, student deliveries, cash drawer, and CUG daily menu availability.',
      color: '#0284c7',
      badge: 'Fiapre Campus'
    },
    {
      title: '🏙️ Sunyani Main Branch Console',
      path: '/branch/sunyani',
      role: 'Sunyani Main Manager & Cashier',
      desc: 'Locked to Sunyani Market Circle operations. Counter POS, town deliveries, cash & MoMo reconciliations, and local dishes pricing.',
      color: '#d97706',
      badge: 'Market Circle'
    },
    {
      title: '🍳 Kitchen Order Display System',
      path: '/kitchen',
      role: 'Kitchen Chefs & Line Staff',
      desc: 'High-contrast real-time kitchen tablet display. Audio bell chimes on new orders, order advancement (Cooking → Ready), and live daily portions tracker (Prepared/Sold/Remaining).',
      color: '#10b981',
      badge: 'Kitchen Tablet'
    },
    {
      title: '🛵 Delivery & Dispatch Hub',
      path: '/delivery',
      role: 'Dispatchers & Delivery Riders',
      desc: 'Assign authorized dispatch riders, track in-transit deliveries, view hostel/street addresses, record customer contact, confirm delivery, and configure delivery zones & fees.',
      color: '#6366f1',
      badge: 'Riders & Dispatch'
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

              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: '#0f172a' }}>
                {p.title}
              </h2>
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
              Open {p.title.split(' ')[1]} Portal →
            </Link>
          </div>
        ))}
      </div>

      {/* Demo Credentials Box */}
      <div style={{ marginTop: '40px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 10px 0', color: '#1e293b' }}>
          💡 Staff Login & Testing Credentials
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
          You can sign in directly at <Link to="/staff-login" style={{ color: '#dc2626', fontWeight: 700 }}>/#/staff-login</Link> using your owner credentials or these seeded test accounts:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '13px' }}>
          <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <b style={{ color: '#0284c7' }}>Branch Manager (CUG):</b><br />
            Email: <code>manager.cug@lady3d.local</code><br />
            Pass: <code>StaffPass123!</code>
          </div>
          <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <b style={{ color: '#10b981' }}>Kitchen Staff (CUG):</b><br />
            Email: <code>kitchen.cug@lady3d.local</code><br />
            Pass: <code>StaffPass123!</code>
          </div>
          <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <b style={{ color: '#6366f1' }}>Dispatch Rider (CUG):</b><br />
            Email: <code>driver.cug@lady3d.local</code><br />
            Pass: <code>StaffPass123!</code>
          </div>
          <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <b style={{ color: '#d97706' }}>Branch Manager (Sunyani):</b><br />
            Email: <code>manager.sunyani@lady3d.local</code><br />
            Pass: <code>StaffPass123!</code>
          </div>
        </div>
      </div>
    </div>
  )
}
