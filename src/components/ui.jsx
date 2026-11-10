import { useState, useEffect, Component } from 'react'
import { money, useApp, go } from '../store.jsx'
import { BRANCHES, EXTRAS } from '../data.js'

export const Link = ({ to = '/', children, className = '', onClick, ...p }) => {
  const isStringTarget = typeof to === 'string'
  const isExternalTarget = isStringTarget && (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(to))
  const target = isStringTarget && !isExternalTarget && !to.startsWith('/') ? '/' + to : to
  const handleClick = e => {
    if (onClick) onClick(e)
    if (!e.defaultPrevented && isStringTarget && !isExternalTarget && (p.target == null || p.target === '_self') && p.download == null && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
      e.preventDefault()
      go(target)
    }
  }
  return (
    <a href={target} onClick={handleClick} className={className} {...p}>{children}</a>
  )
}

export function Wordmark({ light = false, compact = false }) {
  const app = useApp()
  const businessName = app?.settings?.businessName || "Lady 3D's Catering Services"
  const parts = businessName.split("'s ")
  const title = parts.length > 1 ? `${parts[0]}'S` : businessName.toUpperCase()
  const sub = parts.length > 1 ? parts.slice(1).join(' ').toUpperCase() : 'CATERING SERVICES'
  return (
    <span className={`brand-mark ${light ? 'light' : ''} ${compact ? 'compact' : ''}`}>
      <div className="brand-logo-wrap">
        <img src="/lady3d-logo.jpg" alt={businessName} className="brand-logo-img" />
      </div>
      {!compact && (
        <span className="brand-text-block">
          <b className="brand-title">{title}</b>
          <i className="brand-sub">{sub}</i>
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
  const { price, ok, favs, toggleFav, setActiveFood } = useApp()
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
              aria-label={`Customize ${it.name} and add to basket`}
              onClick={(e) => {
                e.stopPropagation()
                if (onOpenModal) onOpenModal(it)
                else setActiveFood(it)
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
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 2c-.55 0-1 .45-1 1 0 1.1-.9 2-2 2-.55 0-1 .45-1 1s.45 1 1 1c2.21 0 4-1.79 4-4 0-.55-.45-1-1-1zm4 2c-.55 0-1 .45-1 1 0 1.1-.9 2-2 2-.55 0-1 .45-1 1s.45 1 1 1c2.21 0 4-1.79 4-4 0-.55-.45-1-1-1zM2 13.5C2 17.64 5.36 21 9.5 21h5c4.14 0 7.5-3.36 7.5-7.5H2zm3-1.5c.3-2.5 3.2-4.5 7-4.5s6.7 2 7 4.5H5z"/>
      </svg>
    )
  }
  if (catKey === 'waakye') {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4h-2zm-3.5 6a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0zm2 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z"/>
      </svg>
    )
  }
  if (catKey === 'swallow') {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 3a4 4 0 0 0-4 4c0 .35.05.69.13 1.01A8.995 8.995 0 0 0 3 15c0 4.41 3.59 8 8 8s8-3.59 8-8a8.995 8.995 0 0 0-5.13-6.99c.08-.32.13-.66.13-1.01a4 4 0 0 0-4-4zm0 2a2 2 0 0 1 2 2c0 .32-.07.62-.2.9A4.98 4.98 0 0 0 12 7.5c-.65 0-1.26.15-1.8.4-.13-.28-.2-.58-.2-.9a2 2 0 0 1 2-2zm-1 9a2 2 0 1 1 2 0 2 2 0 0 1-2 0z"/>
      </svg>
    )
  }
  if (catKey === 'stews') {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M19 8h-1.1A6.99 6.99 0 0 0 13 4.14V3h2V1H9v2h2v1.14A6.99 6.99 0 0 0 6.1 8H5c-1.66 0-3 1.34-3 3v2c0 1.3.84 2.4 2 2.82V17c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4v-1.18c1.16-.42 2-1.52 2-2.82v-2c0-1.66-1.34-3-3-3zm-15 4v-1c0-.55.45-1 1-1h1.05c-.03.33-.05.66-.05 1s.02.67.05 1H5c-.55 0-1-.45-1-1zm14 5c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-2.13c1.68 1.32 3.76 2.13 6 2.13s4.32-.81 6-2.13V17zm2-5c0 .55-.45 1-1 1h-1.05c.03-.33.05-.66.05-1s-.02-.67-.05-1H19c.55 0 1 .45 1 1z"/>
      </svg>
    )
  }
  if (catKey === 'drinks') {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M19.34 5.34l-1.41-1.41-2.93 2.93L13 2H9v4H5v2l1.64 12.3c.18 1.34 1.33 2.36 2.68 2.36h5.36c1.35 0 2.5-1.02 2.68-2.36L19 8h-2.14l2.48-2.66zM8.32 18.66L7.16 10h9.68l-1.16 8.66c-.06.45-.44.79-.89.79H9.21c-.45 0-.83-.34-.89-.79z"/>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-8.03c2.09-.13 3.75-1.85 3.75-3.97V2h-2v7zm5-3v8h2.5V22h2.5V2c-2.76 0-5 2.24-5 4z" />
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
                  <span className="modal-branch-pill">{BRANCHES.find(b => b.id === branch)?.short || 'Campus'}</span>
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
              <span className="spec-item">Made Fresh Daily</span>
              <span className="spec-item">Hot & Ready</span>
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
  const { count, user, branch, setBranch, isNetworkBusy, refreshAllData, say } = useApp()
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
          {isNetworkBusy && (
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }} title="Syncing data...">
              <span className="pbd-spinner-sm" style={{ width: 16, height: 16 }} />
            </div>
          )}
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



export function ActionToast() {
  const { toast, dismissToast } = useApp()
  if (!toast) return null

  const isObject = typeof toast === 'object' && toast !== null
  const title = isObject ? (toast.title || '') : ''
  const message = isObject ? (toast.message || '') : String(toast)
  const type = isObject ? (toast.type || 'success') : 'success'
  const actionLabel = isObject ? toast.actionLabel : null
  const actionPath = isObject ? toast.actionPath : null

  return (
    <div className="action-toast-portal">
      <div className={`action-toast-card toast-${type}`} role="alert" aria-live="assertive">
        <div className="action-toast-icon-wrap">
          {type === 'basket' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
              <path d="M3 6h18"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          ) : type === 'error' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          ) : type === 'info' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          )}
        </div>

        <div className="action-toast-body">
          {title && <h4 className="action-toast-title">{title}</h4>}
          <p className="action-toast-message">{message}</p>
          {actionLabel && actionPath && (
            <div className="action-toast-actions">
              <Link to={actionPath} onClick={dismissToast} className="action-toast-link">
                <span>{actionLabel}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={dismissToast}
          className="action-toast-close"
          title="Dismiss notification"
          aria-label="Close notification"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="action-toast-progress-bar" />
      </div>
    </div>
  )
}

export function GlobalNetworkBar() {
  const { isNetworkBusy } = useApp()
  if (!isNetworkBusy) return null
  return (
    <>
      <div className="global-network-loader-bar" role="progressbar" aria-label="Loading data" aria-busy="true">
        <div className="global-network-loader-pulse" />
      </div>
      <div className="global-sync-spinner-pill" role="status" aria-live="polite">
        <span className="pbd-spinner-sm" />
        <span>Loading...</span>
      </div>
    </>
  )
}

export function LoadingSpinner({ size = 'md', text = '', color = 'red', inline = false }) {
  const sizeCls = size === 'sm' ? 'pbd-spinner-sm' : size === 'lg' ? 'pbd-spinner-lg' : 'pbd-spinner'
  const colorCls = color === 'white' ? 'pbd-spinner-white' : color === 'dark' ? 'pbd-spinner-dark' : ''
  if (inline) {
    return (
      <span className="loading-inline-wrap">
        <span className={`${sizeCls} ${colorCls}`} />
        {text && <span className="loading-inline-text">{text}</span>}
      </span>
    )
  }
  return (
    <div className="pbd-loading-container">
      <span className={`${sizeCls} ${colorCls}`} />
      {text && <span className="pbd-loading-text">{text}</span>}
    </div>
  )
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="cart-empty-screen" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p style={{ color: '#64748b', margin: '12px auto 24px', maxWidth: '420px' }}>
            We encountered an unexpected error displaying this section. Please try again or return to the menu.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-order-cta"
              style={{ width: 'auto', padding: '10px 20px' }}
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              Reload Page
            </button>
            <Link
              to="/menu"
              className="btn-back-step"
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              Browse Menu
            </Link>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

