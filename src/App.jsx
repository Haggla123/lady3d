import { useEffect, useState } from 'react'
import { go, money, useApp, useHash } from './store.jsx'
import { Link, Wordmark, BranchPicker, BottomNavBar, MobileTopNav, FoodDetailModal, ActionToast, GlobalNetworkBar } from './components/ui.jsx'
import { Onboarding, Home, Menu, FoodPage, Cart, Checkout, OrderSuccess, Track, Account, Community, SignIn, SignUp } from './pages/Customer.jsx'
import Admin from './pages/Admin.jsx'
import BranchDashboard from './pages/BranchDashboard.jsx'
import KitchenDashboard from './pages/kitchen/KitchenDashboard.jsx'
import DeliveryDashboard from './pages/delivery/DeliveryDashboard.jsx'
import DashboardsDirectory from './pages/admin/DashboardsDirectory.jsx'

function StaffLoginPage() {
  const { staffLogin, say } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const signIn = async event => {
    event.preventDefault()
    const cleanIdentifier = email.trim()
    if (!cleanIdentifier) return say('Please enter your email or username', { type: 'error', title: 'Notice' })
    if (!password) return say('Please enter your password', { type: 'error', title: 'Notice' })
    setBusy(true)
    try {
      const session = await staffLogin(cleanIdentifier, password)
      if (session.role === 'Kitchen') go('/kitchen')
      else if (session.role === 'Driver') go('/delivery')
      else if (session.role === 'Cashier') go('/branch/' + (session.assignedBranch === 'sunyani' ? 'sunyani' : 'cug') + '/pos')
      else if (session.role === 'Owner' || session.role === 'Manager') go('/admin')
      else go('/admin')
    }
    catch (error) { say(error.message, { type: 'error', title: 'Sign-in Failed' }) }
    finally { setBusy(false) }
  }
  return (
    <div className="auth-modern-screen">
      <div className="auth-card-container">
        <h1 className="auth-title">Staff sign in</h1>
        <p className="auth-subtitle">Use your staff account or admin credentials to sign in.</p>
        <form className="auth-form-fields" onSubmit={signIn}>
          <label className="input-field-wrap">
            <span>Email or username</span>
            <input
              type="text"
              inputMode="email"
              autoComplete="username"
              placeholder="e.g. owner@lady3d.local or admin"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>
          <label className="input-field-wrap">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
          <button className="btn-auth-submit" disabled={busy}>
            {busy ? <><span className="pbd-spinner-sm" style={{ marginRight: '8px' }} /> Signing in…</> : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const h = useHash()
  const { count, toast, user, activeFood, setActiveFood, staffUser, authReady, isNetworkBusy, refreshAllData, say } = useApp()
  const path = h.split('?')[0]
  const seg = path.split('/').filter(Boolean)

  // Loading & Onboarding sequence states:
  // 1. Loading splash badge (1.5s) on enter or refresh
  // 2. Onboarding remembered in localStorage: refreshing never resets the user to the start!
  const [splashDone, setSplashDone] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('lady3d_onboarded') === 'true'
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashDone(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // If user accesses /kitchen directly
  if (seg[0] === 'kitchen') {
    if (!authReady) return <div className="wrap sec">Checking kitchen session…</div>
    if (!staffUser) return <><GlobalNetworkBar /><StaffLoginPage /><ActionToast /></>
    if (!['Owner', 'Manager', 'Kitchen'].includes(staffUser.role)) return <div className="wrap sec"><h1>Kitchen access restricted</h1><p>Your staff role cannot manage kitchen orders.</p></div>
    return (
      <>
        <GlobalNetworkBar />
        <KitchenDashboard branchId={staffUser.role === 'Owner' || staffUser.assignedBranch === 'all' ? (seg[1] || 'cug') : staffUser.assignedBranch} staffUser={staffUser} />
        <ActionToast />
      </>
    )
  }

  // If user accesses /delivery directly
  if (seg[0] === 'delivery') {
    if (!authReady) return <div className="wrap sec">Checking rider session…</div>
    if (!staffUser) return <><GlobalNetworkBar /><StaffLoginPage /><ActionToast /></>
    if (!['Owner', 'Manager', 'Driver'].includes(staffUser.role)) return <div className="wrap sec"><h1>Delivery access restricted</h1><p>Your staff role cannot manage deliveries.</p></div>
    return (
      <>
        <GlobalNetworkBar />
        <DeliveryDashboard branchId={staffUser.role === 'Owner' || staffUser.assignedBranch === 'all' ? (seg[1] || 'all') : staffUser.assignedBranch} staffUser={staffUser} />
        <ActionToast />
      </>
    )
  }

  // If user accesses /admin directly
  if (seg[0] === 'admin') {
    if (!authReady) return <div className="wrap sec">Checking staff session…</div>
    if (!staffUser) return <><GlobalNetworkBar /><StaffLoginPage /><ActionToast /></>
    if (!['Owner', 'Manager'].includes(staffUser.role)) return <div className="wrap sec"><h1>Admin access restricted</h1><p>Your staff role cannot open administration.</p></div>
    return (
      <>
        <GlobalNetworkBar />
        <Admin section={seg[1]} />
        <ActionToast />
      </>
    )
  }

  // If user accesses /branch, /branch/sunyani, or /branch/cug directly
  if (seg[0] === 'branch') {
    if (!authReady) return <div className="wrap sec">Checking staff session…</div>
    if (!staffUser) return <><GlobalNetworkBar /><StaffLoginPage /><ActionToast /></>
    if (!['Owner', 'Manager', 'Cashier'].includes(staffUser.role)) return <div className="wrap sec"><h1>Branch access restricted</h1><p>Your staff role cannot access branch operations.</p></div>
    const branchTarget = seg[1] === 'sunyani' ? 'sunyani' : 'cug'
    if (staffUser.assignedBranch && staffUser.assignedBranch !== 'all' && staffUser.assignedBranch !== branchTarget) {
      return <div className="wrap sec"><h1>Branch access restricted</h1><p>Your staff account is assigned to another branch.</p></div>
    }
    return (
      <>
        <GlobalNetworkBar />
        <BranchDashboard branchId={branchTarget} section={seg[2] || (staffUser.role === 'Cashier' ? 'pos' : 'overview')} />
        <ActionToast />
      </>
    )
  }

  // Sequence Step 1: Loading / Splash Page
  if (!splashDone) {
    return (
      <div className="splash-screen-root" onClick={() => setSplashDone(true)} title="Click to skip">
        <div className="splash-card-content">
          <div className="splash-logo-container">
            <img src="/lady3d-logo.jpg" alt="Lady 3D's Catering Services" className="splash-logo-image" />
          </div>
          <h1 className="splash-brand-title">LADY 3D’S</h1>
          <p className="splash-brand-subtitle">CATERING SERVICES</p>
          <div className="splash-progress-track">
            <div className="splash-progress-fill" />
          </div>
          <p className="splash-tagline">Good Food · Great Taste · Every Time</p>
        </div>
      </div>
    )
  }

  // Sequence Step 2: Onboarding Page - ONLY for brand-new first-time visitors on root path
  // Refreshing NEVER resets to the start sequence!
  const isFirstTimeVisitor = !onboardingDone && !user && seg.length === 0
  if (isFirstTimeVisitor) {
    const handleFinish = (target = '/') => {
      localStorage.setItem('lady3d_onboarded', 'true')
      setOnboardingDone(true)
      go(target)
    }

    return (
      <div className="app-shell">
        <div className="phone-device-wrapper">
          <Onboarding
            onStart={() => handleFinish('/')}
            onSignIn={() => handleFinish('/login')}
            onSignUp={() => handleFinish('/signup')}
          />
        </div>
      </div>
    )
  }

  // Sequence Step 3: Main Application Experience (Preserved on refresh)
  let pageContent
  if (!seg.length) pageContent = <Home />
  else if (seg[0] === 'staff-login') pageContent = <StaffLoginPage />
  else if (seg[0] === 'menu') pageContent = <Menu key={h} />
  else if (seg[0] === 'food') pageContent = <FoodPage id={seg[1]} />
  else if (seg[0] === 'cart') pageContent = <Cart />
  else if (seg[0] === 'checkout') pageContent = <Checkout />
  else if (seg[0] === 'success') pageContent = <OrderSuccess key={seg[1]} refId={seg[1]} />
  else if (seg[0] === 'track') pageContent = <Track key={seg[1]} refId={seg[1]} />
  else if (seg[0] === 'account') pageContent = <Account />
  else if (seg[0] === 'login') pageContent = <SignIn />
  else if (seg[0] === 'signup') pageContent = <SignUp />
  else if (seg[0] === 'community') pageContent = <Community />
  else if (seg[0] === 'dashboards' || seg[0] === 'portals') {
    if (!staffUser) pageContent = <StaffLoginPage />
    else pageContent = <DashboardsDirectory />
  }
  else pageContent = <div className="wrap sec"><p className="empty-subtext">Page not found.</p></div>

  return (
    <div className="app-shell">
      <GlobalNetworkBar />
      <div className="phone-device-wrapper">
        {/* Top Header Navigation for Desktop Screens */}
        <header className="modern-top-nav">
          <div className="top-nav-container">
            <Link to="/" className="top-brand-link">
              <Wordmark />
            </Link>

            <div className="top-nav-links-desktop">
              <Link to="/menu" className={seg[0] === 'menu' ? 'active' : ''}>Menu</Link>
              <Link to="/community" className={seg[0] === 'community' ? 'active' : ''}>Community</Link>
              <Link to="/track" className={seg[0] === 'track' ? 'active' : ''}>Track Order</Link>
              <Link to="/account" className={seg[0] === 'account' ? 'active' : ''}>{user ? 'Account' : 'Log in'}</Link>
            </div>

            <div className="top-nav-right-actions">
              {staffUser && ['Owner', 'Manager'].includes(staffUser.role) && (
                <Link
                  to="/admin/overview"
                  className="top-admin-badge-btn"
                  title="Open Admin Console"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#80141B',
                    color: '#FFFFFF',
                    padding: '7px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                    boxShadow: '0 2px 6px rgba(128, 20, 27, 0.25)'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  <span>Admin Console</span>
                </Link>
              )}
              {staffUser && staffUser.role === 'Cashier' && (
                <Link
                  to={`/branch/${staffUser.assignedBranch || 'cug'}/pos`}
                  className="top-admin-badge-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#0284C7',
                    color: '#FFFFFF',
                    padding: '7px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    textDecoration: 'none'
                  }}
                >
                  <span>Branch POS</span>
                </Link>
              )}
              {staffUser && staffUser.role === 'Kitchen' && (
                <Link
                  to="/kitchen"
                  className="top-admin-badge-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#15803D',
                    color: '#FFFFFF',
                    padding: '7px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    textDecoration: 'none'
                  }}
                >
                  <span>Kitchen Display</span>
                </Link>
              )}
              {staffUser && staffUser.role === 'Driver' && (
                <Link
                  to="/delivery"
                  className="top-admin-badge-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#6366F1',
                    color: '#FFFFFF',
                    padding: '7px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    textDecoration: 'none'
                  }}
                >
                  <span>Delivery Portal</span>
                </Link>
              )}
              <button
                type="button"
                className="top-refresh-header-btn"
                onClick={async () => {
                  say('Refreshing latest data...')
                  await refreshAllData()
                }}
                disabled={isNetworkBusy}
                title="Refresh menu and orders"
              >
                <svg className={`pbd-refresh-icon ${isNetworkBusy ? 'spinning' : ''}`} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span>{isNetworkBusy ? 'Syncing...' : 'Refresh'}</span>
              </button>
              <Link to="/cart" className="top-basket-pill" aria-label="Cart">
                <span className="basket-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
                </span>
                <span className="basket-label">Basket</span>
                <b className="basket-badge">{count}</b>
              </Link>
            </div>
          </div>
        </header>

        {/* Mobile Top App Header (Native App Bar on Phones) */}
        <MobileTopNav activePath={path} />

        {/* Main Content Pane */}
        <main className="modern-main-content">
          {pageContent}
        </main>

        {/* Modal for Food Details */}
        {activeFood && (
          <FoodDetailModal item={activeFood} onClose={() => setActiveFood(null)} />
        )}

        {/* Footer - Strictly hidden in phone view / mobile */}
        <footer className="modern-footer desktop-only-footer">
          <div className="footer-container">
            <div className="footer-top-row">
              <Wordmark light />
              <div className="footer-links">
                <Link to="/admin/overview" className="footer-admin-link">Master Admin</Link>
                <Link to="/branch/cug" className="footer-admin-link">CUG Campus Kitchen</Link>
                <Link to="/branch/sunyani" className="footer-admin-link">Sunyani Main Kitchen</Link>
              </div>
            </div>
            <p className="footer-disclaimer">
              © {new Date().getFullYear()} Lady 3D’s Catering Services · Catholic University of Ghana & Sunyani.
            </p>
          </div>
        </footer>

        {/* Static Bottom Navigation Bar (Always at the very bottom of the screen) */}
        <BottomNavBar activePath={path} />

        {/* Toast Notification */}
        <ActionToast />
      </div>
    </div>
  )
}
