import { useEffect, useState } from 'react'
import { go, money, useApp, useHash } from './store.jsx'
import { Link, Wordmark, BranchPicker, BottomNavBar, FoodDetailModal, GoogleAuthModal } from './components/ui.jsx'
import { Onboarding, Home, Menu, FoodPage, Cart, Checkout, OrderSuccess, Track, Account, Community, SignIn, SignUp } from './pages/Customer.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  const h = useHash()
  const { count, toast, user, activeFood, setActiveFood, deviceFrame, setDeviceFrame, googleModal, setGoogleModal, loginGoogle } = useApp()
  const path = h.split('?')[0]
  const seg = path.split('/').filter(Boolean)

  // Loading & Onboarding sequence states
  // 1. Loading splash (1.8s) -> 2. Onboarding welcome -> 3. Main app
  const [splashDone, setSplashDone] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashDone(true)
    }, 1800)
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

  // Sequence Step 1: Loading / Splash Page (Matches Bon Appétit Splash)
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

  // Sequence Step 2: Onboarding Page (Only if the person is NOT logged in)
  // If the person has logged in, after the loading page, it takes them directly to the homepage!
  if (!onboardingDone && !user) {
    return (
      <div className={`app-shell ${deviceFrame ? 'device-frame-mode' : ''}`}>
        <div className="phone-device-wrapper">
          {deviceFrame && (
            <div className="device-status-bar">
              <span className="status-time">9:41</span>
              <div className="status-notch" />
              <div className="status-icons">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/></svg>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4z"/></svg>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 5v14H7V5h10m1-2H6c-.55 0-1 .45-1 1v16c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zm-4-2h-4v2h4V1z"/></svg>
              </div>
            </div>
          )}
          <Onboarding
            onStart={() => {
              setOnboardingDone(true)
              go('/')
            }}
            onSignIn={() => {
              setOnboardingDone(true)
              go('/login')
            }}
            onSignUp={() => {
              setOnboardingDone(true)
              go('/signup')
            }}
          />
        </div>
      </div>
    )
  }

  // Sequence Step 3: Main Application Experience
  let pageContent
  if (!seg.length) pageContent = <Home />
  else if (seg[0] === 'menu') pageContent = <Menu key={h} />
  else if (seg[0] === 'food') pageContent = <FoodPage id={seg[1]} />
  else if (seg[0] === 'cart') pageContent = <Cart />
  else if (seg[0] === 'checkout') pageContent = <Checkout />
  else if (seg[0] === 'track') pageContent = <Track key={seg[1]} refId={seg[1]} />
  else if (seg[0] === 'account') pageContent = <Account />
  else if (seg[0] === 'login') pageContent = <SignIn />
  else if (seg[0] === 'signup') pageContent = <SignUp />
  else if (seg[0] === 'community') pageContent = <Community />
  else pageContent = <div className="wrap sec"><p className="empty-subtext">Page not found.</p></div>

  const isHome = !seg.length

  return (
    <div className={`app-shell ${deviceFrame ? 'device-frame-mode' : ''}`}>
      {/* Viewport Frame Toggle Controller */}
      <div className="device-toggle-float">
        <button
          className="btn-toggle-device"
          onClick={() => setDeviceFrame(!deviceFrame)}
          title="Toggle between Mobile App Frame and Full Screen"
        >
          {deviceFrame ? 'Desktop View' : 'Mobile App View'}
        </button>
        <button
          className="btn-replay-intro"
          onClick={() => {
            setSplashDone(false)
            setOnboardingDone(false)
          }}
          title="Replay sequence from the beginning"
        >
          Replay Sequence
        </button>
      </div>

      <div className="phone-device-wrapper">
        {/* Mobile Device Status Bar */}
        {deviceFrame && (
          <div className="device-status-bar">
            <span className="status-time">9:41</span>
            <div className="status-notch" />
            <div className="status-icons">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/></svg>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4z"/></svg>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 5v14H7V5h10m1-2H6c-.55 0-1 .45-1 1v16c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zm-4-2h-4v2h4V1z"/></svg>
            </div>
          </div>
        )}

        {/* Top Header Navigation - Shown only in desktop view since mobile has the bottom nav */}
        {!deviceFrame && (
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
        )}

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

        {/* Bottom Navigation Bar */}
        <BottomNavBar activePath={path} />

        {/* Footer */}
        <footer className="modern-footer">
          <div className="footer-container">
            <div className="footer-top-row">
              <Wordmark light />
              <div className="footer-links">
                <Link to="/admin/overview" className="footer-admin-link">Staff & Owner Admin</Link>
                <button
                  className="footer-replay-link"
                  onClick={() => {
                    setSplashDone(false)
                    setOnboardingDone(false)
                  }}
                >
                  Restart Loading Sequence
                </button>
              </div>
            </div>
            <p className="footer-disclaimer">
              © {new Date().getFullYear()} Lady 3D’s Catering Services · Catholic University of Ghana & Sunyani.
            </p>
          </div>
        </footer>

        {/* Toast Notification */}
        {toast && <div className="toast-pill">{toast}</div>}
      </div>
    </div>
  )
}
