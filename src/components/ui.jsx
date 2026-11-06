import { useState, useEffect } from 'react'
import { money, useApp } from '../store.jsx'
import { BRANCHES, EXTRAS } from '../data.js'

export const Link = ({ to, children, className = '', ...p }) => (
  <a href={'#' + to} className={className} {...p}>{children}</a>
)

export function Wordmark({ light = false, compact = false }) {
  return (
    <span className={`brand-mark ${light ? 'light' : ''} ${compact ? 'compact' : ''}`}>
      <div className="brand-logo-wrap">
        <img src="/lady3d-logo.jpg" alt="Lady 3D's" className="brand-logo-img" />
      </div>
      {!compact && (
        <span className="brand-text-block">
          <b className="brand-title">LADY 3D’S</b>
          <i className="brand-sub">CATERING SERVICES</i>
        </span>
      )}
    </span>
  )
}

export function Food({ item, className = '' }) {
  const [err, setErr] = useState(false)
  if (item?.img && !err) {
    return (
      <div className={`food-img-frame ${className}`}>
        <img
          className="food-photo"
          src={item.img}
          alt={item.name}
          loading="lazy"
          onError={() => setErr(true)}
        />
      </div>
    )
  }
  const h = item?.hue || 15
  return (
    <div className={`food-img-frame placeholder ${className}`} style={{ background: `hsl(${h} 65% 94%)` }}>
      <svg viewBox="0 0 100 100" className="food-svg">
        <circle cx="50" cy="52" r="38" fill="#fff" />
        <circle cx="50" cy="52" r="30" fill="none" stroke={`hsl(${h} 50% 88%)`} strokeWidth="3" />
        <ellipse cx="50" cy="50" rx="22" ry="16" fill={`hsl(${h} 75% 45%)`} />
        <circle cx="43" cy="46" r="6" fill={`hsl(${h} 80% 60%)`} />
        <circle cx="57" cy="52" r="7" fill={`hsl(${(h + 30) % 360} 70% 36%)`} />
        <circle cx="50" cy="42" r="4" fill="#fff" opacity=".8" />
      </svg>
    </div>
  )
}

export function DishCard({ it, onOpenModal }) {
  const { price, ok, add, favs, toggleFav, setActiveFood } = useApp()
  const av = ok(it)
  const isFav = favs.includes(it.id)
  const itemPrice = price(it)

  const handleCardClick = (e) => {
    // Only open modal if not clicking action buttons
    if (e.target.closest('button')) return
    if (onOpenModal) onOpenModal(it)
    else setActiveFood(it)
  }

  return (
    <article className={`dish-card-modern ${av ? '' : 'sold-out'}`} onClick={handleCardClick}>
      <div className="dish-media-container">
        <Food item={it} className="dish-card-img" />
        <button
          type="button"
          className={`dish-fav-btn ${isFav ? 'active' : ''}`}
          aria-label="Add to favorites"
          onClick={(e) => {
            e.stopPropagation()
            toggleFav(it.id)
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill={isFav ? '#9E1B24' : 'none'} stroke={isFav ? '#9E1B24' : '#6B7280'} strokeWidth="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        {it.tag && <span className="dish-tag-badge">{it.tag}</span>}
      </div>

      <div className="dish-content-box">
        <div className="dish-meta-row">
          <span className="dish-category-label">{it.cat}</span>
          <span className="dish-rating-pill">
            <span className="star-icon">★</span> {it.rating || 4.9}
          </span>
        </div>

        <h3 className="dish-name">{it.name}</h3>
        <p className="dish-description">{it.desc}</p>

        <div className="dish-bottom-bar">
          <div className="dish-price-wrap">
            <span className="dish-currency-label">Price</span>
            <strong className="dish-price-value">{money(itemPrice)}</strong>
          </div>

          {av ? (
            <button
              type="button"
              className="dish-add-btn"
              aria-label={`Add ${it.name} to basket`}
              onClick={(e) => {
                e.stopPropagation()
                add(it.id, 1)
              }}
            >
              <span className="plus-sign">+</span>
            </button>
          ) : (
            <span className="dish-status-soldout">Unavailable</span>
          )}
        </div>
      </div>
    </article>
  )
}

export function BranchPicker({ variant = 'default' }) {
  const { branch, setBranch, say } = useApp()
  return (
    <div className={`branch-selector-wrap ${variant}`}>
      <span className="branch-pin-icon">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
        </svg>
      </span>
      <select
        className="branch-native-select"
        value={branch || ''}
        onChange={e => {
          setBranch(e.target.value)
          say(`Branch changed to ${BRANCHES.find(b => b.id === e.target.value)?.name}`)
        }}
        aria-label="Select catering branch"
      >
        <option value="" disabled>Choose campus or city</option>
        {BRANCHES.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <span className="branch-arrow">▾</span>
    </div>
  )
}

export function CategoryIcon({ catKey }) {
  if (catKey === 'rice') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M12 4C7.58 4 4 7.58 4 12c0 1.25.32 2.43.88 3.47L2 20h20l-2.88-4.53C19.68 14.43 20 13.25 20 12c0-4.42-3.58-8-8-8zm-6 8c0-3.31 2.69-6 6-6s6 2.69 6 6H6z"/>
      </svg>
    )
  }
  if (catKey === 'waakye') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    )
  }
  if (catKey === 'swallow') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M12 2a9 9 0 0 0-9 9c0 3.87 2.46 7.16 5.92 8.4-.28-.7-.42-1.47-.42-2.28 0-3.31 2.69-6 6-6s6 2.69 6 6c0 .81-.14 1.58-.42 2.28A9.002 9.002 0 0 0 21 11a9 9 0 0 0-9-9zm0 11c-2.21 0-4 1.79-4 4 0 2.21 1.79 4 4 4s4-1.79 4-4c0-2.21-1.79-4-4-4z"/>
      </svg>
    )
  }
  if (catKey === 'stews') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M19 5h-2V3a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2H5a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3h.14A8.006 8.006 0 0 0 11 19.93V22h2v-2.07A8.006 8.006 0 0 0 18.86 13H19a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3zm-6-1v1h-2V4h2zM4 10V8a1 1 0 0 1 1-1h1v4H5a1 1 0 0 1-1-1zm16 0a1 1 0 0 1-1 1h-1V7h1a1 1 0 0 1 1 1v2z"/>
      </svg>
    )
  }
  if (catKey === 'drinks') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M20 3H4v2l3 5.5V20c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-9.5L20 5V3zm-5 17H9v-9h6v9zm2.4-11H6.6l-1.6-3h14l-1.6 3z"/>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M8.1 13.34l2.83-2.83L3.91 3.5a4.008 4.008 0 0 0 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L14.88 11.53z" />
    </svg>
  )
}

export const Stars = ({ n = 5 }) => (
  <span className="modern-stars" aria-label={`${n} stars`}>
    {[...Array(5)].map((_, i) => (
      <span key={i} className={i < n ? 'star-filled' : 'star-empty'}>★</span>
    ))}
  </span>
)

export function FoodDetailModal({ item, onClose }) {
  const { price, ok, add, branch, setBranch, say, favs, toggleFav } = useApp()
  const [qty, setQty] = useState(1)
  const [selectedExtras, setSelectedExtras] = useState([])

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  if (!item) return null

  const isFav = favs.includes(item.id)
  const isAvail = ok(item)
  const basePrice = price(item)
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + (e.price || 0), 0)
  const totalUnitPrice = basePrice + extrasTotal
  const otherBranch = item.avail?.['sunyani'] ? 'sunyani' : 'cug'
  const otherBranchName = BRANCHES.find(b => b.id === otherBranch)?.name || 'Other Branch'
  const otherBranchShort = BRANCHES.find(b => b.id === otherBranch)?.short || 'Other'

  const toggleExtra = (extra) => {
    if (selectedExtras.some(e => e.id === extra.id)) {
      setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id))
    } else {
      setSelectedExtras([...selectedExtras, extra])
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Handle bar on top */}
        <div className="modal-sheet-handle-bar">
          <div className="modal-sheet-handle" />
        </div>

        {/* Floating close button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close details">
          ✕
        </button>

        {/* Scrollable Modal Content */}
        <div className="modal-scroll-body">
          <div className="modal-hero-photo">
            <Food item={item} className="modal-photo-img" />
            <button
              type="button"
              className={`modal-fav-btn ${isFav ? 'active' : ''}`}
              onClick={() => toggleFav(item.id)}
              aria-label="Save to favorites"
            >
              ♥
            </button>
            <div className="modal-photo-gradient-overlay" />
          </div>

          <div className="modal-body-content">
            <div className="modal-header-row">
              <div className="modal-header-left">
                <div className="modal-tag-row">
                  <span className="modal-cat-pill">{item.cat}</span>
                  <span className="modal-branch-pill">📍 {BRANCHES.find(b => b.id === branch)?.short || 'Campus'}</span>
                </div>
                <h2 className="modal-food-title">{item.name}</h2>
                <div className="modal-base-price">{money(basePrice)}</div>
              </div>
              <div className="modal-rating-badge">
                <span className="modal-rating-score">★ {item.rating || 4.9}</span>
                <span className="modal-rating-count">({item.reviews || 85} reviews)</span>
              </div>
            </div>

            <div className="modal-specs-row">
              <span className="spec-item">⏱️ Prep: {item.prepTime || '15 min'}</span>
              <span className="spec-item">✨ Made Fresh Daily</span>
              <span className="spec-item">🔥 Hot & Ready</span>
            </div>

            <p className="modal-full-desc">{item.desc}</p>

            {!isAvail && (
              <div className="modal-alert-box branch-switch-card">
                <div className="alert-text-block">
                  <b>Sold exclusively at {otherBranchName}</b>
                  <p>
                    {otherBranch === 'sunyani'
                      ? 'This authentic dish is featured on our Main Branch Signboard (Market Circle).'
                      : 'This meal is prepared fresh on campus (from our Campus Flyer).'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-switch-branch-pill"
                  onClick={() => {
                    setBranch(otherBranch)
                    say(`Switched to ${otherBranchName}`)
                  }}
                >
                  Switch to {otherBranchShort} to Order →
                </button>
              </div>
            )}

            {/* Extras & Sides Section */}
            {!item.isExtra && EXTRAS && EXTRAS.length > 0 && (
              <div className="modal-extras-section">
                <div className="extras-section-header">
                  <div>
                    <h3 className="extras-section-title">Add Extras & Sides</h3>
                    <p className="extras-section-sub">Customize your meal with extra protein, soups, or sides</p>
                  </div>
                  {selectedExtras.length > 0 && (
                    <span className="extras-count-badge">+{selectedExtras.length} selected</span>
                  )}
                </div>

                <div className="extras-grid-selector">
                  {EXTRAS.map(extra => {
                    const isChecked = selectedExtras.some(e => e.id === extra.id)
                    return (
                      <button
                        key={extra.id}
                        type="button"
                        className={`extra-option-btn ${isChecked ? 'active' : ''}`}
                        onClick={() => toggleExtra(extra)}
                      >
                        <div className="extra-option-top">
                          <span className="extra-check-box">
                            {isChecked ? (
                              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                            )}
                          </span>
                          <span className="extra-option-price">+{money(extra.price)}</span>
                        </div>
                        <span className="extra-option-name">{extra.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pinned Bottom Actions Bar */}
        <div className="modal-bottom-actions">
          <div className="modal-stepper">
            <button
              type="button"
              onClick={() => setQty(Math.max(1, qty - 1))}
              aria-label="Decrease quantity"
              disabled={qty <= 1}
            >
              −
            </button>
            <span className="stepper-count">{qty}</span>
            <button
              type="button"
              onClick={() => setQty(qty + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="btn-modal-add"
            disabled={!isAvail}
            onClick={() => {
              add(item.id, qty, selectedExtras)
              onClose()
            }}
          >
            <span className="btn-modal-add-label">
              {isAvail ? 'Add to Basket' : 'Unavailable at Branch'}
            </span>
            {isAvail && (
              <b className="btn-modal-add-price">{money(totalUnitPrice * qty)}</b>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function BottomNavBar({ activePath = '/' }) {
  const { count, user } = useApp()
  const base = activePath.split('/')[1] || ''

  const tabs = [
    {
      id: '',
      label: 'Home',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      )
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M8.1 13.34l2.83-2.83L3.91 3.5a4.008 4.008 0 0 0 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L14.88 11.53z" />
        </svg>
      )
    },
    {
      id: 'cart',
      label: 'Basket',
      badge: count,
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      )
    },
    {
      id: 'track',
      label: 'Track',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M19 8h-1V5h-3v3H7a4 4 0 0 0-4 4v7h2a3 3 0 0 0 6 0h4a3 3 0 0 0 6 0h2v-6l-4-5zm-11 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
        </svg>
      )
    },
    {
      id: 'account',
      label: 'Account',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )
    }
  ]

  return (
    <nav className="bottom-nav-bar" aria-label="App Navigation">
      <div className="bottom-nav-container">
        {tabs.map(tab => {
          const isActive = base === tab.id
          const isCart = tab.id === 'cart'

          if (isCart) {
            return (
              <Link
                key={tab.id}
                to="/cart"
                className={`bottom-nav-item bottom-nav-cart-prominent ${isActive ? 'active' : ''}`}
                aria-label={`Basket with ${count} items`}
              >
                <div className="bottom-cart-circle">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                  {count > 0 && <span className="bottom-cart-badge">{count}</span>}
                </div>
                <span className="bottom-nav-label bottom-cart-label">Basket</span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.id}
              to={tab.id ? `/${tab.id}` : '/'}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="bottom-nav-icon-wrap">
                {tab.icon}
              </div>
              <span className="bottom-nav-label">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function MobileTopNav({ activePath = '/' }) {
  const { count, user, branch, setBranch } = useApp()
  const seg = activePath.split('?')[0].split('/').filter(Boolean)
  const isHome = !seg.length

  const getTitle = () => {
    if (!seg.length) return "Lady 3D's"
    if (seg[0] === 'menu') return 'Our Menu'
    if (seg[0] === 'cart') return 'Order Basket'
    if (seg[0] === 'checkout') return 'Checkout'
    if (seg[0] === 'track') return 'Track Order'
    if (seg[0] === 'account') return user ? 'My Account' : 'Account'
    if (seg[0] === 'community') return 'Community'
    if (seg[0] === 'food') return 'Meal Details'
    if (seg[0] === 'success') return 'Order Confirmed'
    return "Lady 3D's"
  }

  const getBackTarget = () => {
    if (seg[0] === 'checkout') return '/cart'
    if (seg[0] === 'food') return '/menu'
    return '/'
  }

  return (
    <header className="mobile-app-top-header" aria-label="Mobile Navigation">
      <div className="mobile-header-inner">
        {isHome ? (
          <Link to="/" className="mobile-header-brand-link">
            <img src="/lady3d-logo.jpg" alt="Lady 3D's" className="mobile-header-logo-img" />
            <div className="mobile-brand-titles">
              <b className="mobile-brand-head">LADY 3D’S</b>
              <span className="mobile-brand-subhead">CATERING SERVICES</span>
            </div>
          </Link>
        ) : (
          <div className="mobile-header-left-slot">
            <Link to={getBackTarget()} className="mobile-header-back-btn" aria-label="Go back">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            </Link>
            <h1 className="mobile-header-title">{getTitle()}</h1>
          </div>
        )}

        <div className="mobile-header-right-slot">
          <Link to="/community" className="mobile-action-circle" title="Community & Reviews" aria-label="Community">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </Link>
          <Link to="/account" className="mobile-action-circle" title="Account profile" aria-label="Account">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  )
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" className="google-svg-icon">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
    </svg>
  )
}

export function GoogleAuthModal({ isOpen, onClose, onSelectAccount }) {
  if (!isOpen) return null

  const demoAccounts = [
    {
      name: 'Julie Martin',
      email: 'julie.martin@cug.edu.gh',
      phone: '0241234567',
      googleAuth: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      tag: 'Catholic University of Ghana'
    },
    {
      name: 'Kofi Mensah',
      email: 'kofi.mensah@gmail.com',
      phone: '0244112233',
      googleAuth: true,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      tag: 'Personal Google Account'
    }
  ]

  return (
    <div className="google-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="google-modal-card" onClick={e => e.stopPropagation()}>
        <div className="google-modal-header">
          <div className="google-header-brand">
            <GoogleIcon />
            <span>Google Accounts</span>
          </div>
          <button className="google-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="google-modal-titles">
          <h3>Sign in with Google</h3>
          <p>Choose an account to continue to <b>Lady 3D’s Catering Services</b></p>
        </div>

        <div className="google-accounts-list">
          {demoAccounts.map(acc => (
            <button
              key={acc.email}
              className="google-account-tile"
              onClick={() => onSelectAccount(acc)}
            >
              <img src={acc.avatar} alt={acc.name} className="google-avatar-img" />
              <div className="google-acc-info">
                <b className="google-acc-name">{acc.name}</b>
                <span className="google-acc-email">{acc.email}</span>
                <small className="google-acc-tag">{acc.tag}</small>
              </div>
              <span className="google-acc-arrow">→</span>
            </button>
          ))}

          <button
            className="google-account-tile use-another"
            onClick={() => {
              const customEmail = window.prompt('Enter your Google email address:', 'student@cug.edu.gh')
              if (customEmail && customEmail.includes('@')) {
                const namePart = customEmail.split('@')[0].replace(/[._]/g, ' ')
                const formattedName = namePart.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                onSelectAccount({
                  name: formattedName || 'Student User',
                  email: customEmail,
                  phone: '0240000000',
                  googleAuth: true,
                  avatar: ''
                })
              }
            }}
          >
            <div className="google-avatar-icon-placeholder">+</div>
            <div className="google-acc-info">
              <b className="google-acc-name">Use another Google account</b>
              <span className="google-acc-email">Sign in with campus or personal Gmail</span>
            </div>
          </button>
        </div>

        <div className="google-modal-footer">
          <p>
            To continue, Google will share your name, email address and profile photo with Lady 3D’s Catering in accordance with our Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
