import { useEffect, useState } from 'react'
import { go, money, useApp, useHash } from './store.jsx'
import { Link, Wordmark, BranchPicker, BottomNavBar, FoodDetailModal } from './components/ui.jsx'
import { Onboarding, Home, Menu, FoodPage, Cart, Checkout, Track, Account, Community } from './pages/Customer.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  const h = useHash()
  const { count, toast, user, activeFood, setActiveFood, deviceFrame, setDeviceFrame } = useApp()
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

  // Sequence Step 2: Onboarding Page (Matches SnapEats Screen 1)
  if (!onboardingDone) {
    return (
      <div className={`app-shell ${deviceFrame ? 'device-frame-mode' : ''}`}>
        <div className="phone-device-wrapper">
          {deviceFrame && (
            <div className="device-status-bar">
              <span className="status-time">9:41</span>
              <div className="status-notch" />
              <div className="status-icons">
                <span>📶</span>
                <span>🛜</span>
                <span>🔋</span>
              </div>
            </div>
          )}
          <Onboarding onStart={() => setOnboardingDone(true)} />
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
          {deviceFrame ? '🖥️ Desktop View' : '📱 Mobile App View'}
        </button>
        <button
          className="btn-replay-intro"
          onClick={() => {
            setSplashDone(false)
            setOnboardingDone(false)
          }}
          title="Replay sequence from the beginning"
        >
          🔄 Replay Sequence
        </button>
      </div>

      <div className="phone-device-wrapper">
        {/* Mobile Device Status Bar */}
        {deviceFrame && (
          <div className="device-status-bar">
            <span className="status-time">9:41</span>
            <div className="status-notch" />
            <div className="status-icons">
              <span>📶</span>
              <span>🛜</span>
              <span>🔋</span>
            </div>
          </div>
        )}

        {/* Top Header Navigation */}
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
                <span className="basket-icon">🛍️</span>
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
