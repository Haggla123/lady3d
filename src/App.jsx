import { useEffect, useState } from 'react'
import { go, money, useApp, useHash } from './store.jsx'
import { Link, Wordmark, BranchPicker, BottomNavBar, FoodDetailModal, GoogleAuthModal } from './components/ui.jsx'
import { Onboarding, Home, Menu, FoodPage, Cart, Checkout, OrderSuccess, Track, Account, Community, SignIn, SignUp } from './pages/Customer.jsx'
import Admin from './pages/Admin.jsx'
import BranchDashboard from './pages/BranchDashboard.jsx'

export default function App() {
  const h = useHash()
  const { count, toast, user, activeFood, setActiveFood, googleModal, setGoogleModal, loginGoogle } = useApp()
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

  // If user accesses /admin directly
  if (seg[0] === 'admin') {
    return (
      <>
        <Admin section={seg[1]} />
        {toast && <div className="toast-pill">{toast}</div>}
      </>
    )
  }

  // If user accesses /branch, /branch/sunyani, or /branch/cug directly
  if (seg[0] === 'branch') {
    const branchTarget = seg[1] === 'sunyani' ? 'sunyani' : 'cug'
    return (
      <>
        <BranchDashboard branchId={branchTarget} section={seg[2] || 'overview'} />
        {toast && <div className="toast-pill">{toast}</div>}
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
  else pageContent = <div className="wrap sec"><p className="empty-subtext">Page not found.</p></div>

  return (
    <div className="app-shell">
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

        {/* Main Content Pane */}
        <main className="modern-main-content">
          {pageContent}
        </main>

        {/* Modal for Food Details */}
        {activeFood && (
          <FoodDetailModal item={activeFood} onClose={() => setActiveFood(null)} />
        )}

        {/* Modal for Google Authentication */}
        <GoogleAuthModal
          isOpen={googleModal}
          onClose={() => setGoogleModal(false)}
          onSelectAccount={loginGoogle}
        />

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
        {toast && <div className="toast-pill">{toast}</div>}
      </div>
    </div>
  )
}
