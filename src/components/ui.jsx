import { useState } from 'react'
import { money, useApp } from '../store.jsx'
import { BRANCHES } from '../data.js'

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
      <span className="branch-pin-icon">📍</span>
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

export const Stars = ({ n = 5 }) => (
  <span className="modern-stars" aria-label={`${n} stars`}>
    {[...Array(5)].map((_, i) => (
      <span key={i} className={i < n ? 'star-filled' : 'star-empty'}>★</span>
    ))}
  </span>
)

export function FoodDetailModal({ item, onClose }) {
  const { price, ok, add, branch, favs, toggleFav } = useApp()
  const [qty, setQty] = useState(1)
  if (!item) return null

  const isFav = favs.includes(item.id)
  const isAvail = ok(item)
  const itemPrice = price(item)

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-sheet-handle" />
        <button className="modal-close-btn" onClick={onClose} aria-label="Close details">✕</button>

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
        </div>

        <div className="modal-body-content">
          <div className="modal-header-row">
            <div>
              <span className="modal-cat-pill">{item.cat}</span>
              <h2 className="modal-food-title">{item.name}</h2>
            </div>
            <div className="modal-rating-badge">
              <span>★ {item.rating || 4.9}</span>
              <small>({item.reviews || 85} reviews)</small>
            </div>
          </div>

          <div className="modal-specs-row">
            <span className="spec-item">⏱️ Prep: {item.prepTime || '15 min'}</span>
            <span className="spec-item">🔥 Made fresh to order</span>
            <span className="spec-item">📍 {BRANCHES.find(b => b.id === branch)?.short || 'Campus'}</span>
          </div>

          <p className="modal-full-desc">{item.desc}</p>

          {!isAvail && (
            <div className="modal-alert-box">
              ⚠️ Currently not available at this branch today. Switch branch to order.
            </div>
          )}

          <div className="modal-bottom-actions">
            <div className="modal-stepper">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity">−</button>
              <span className="stepper-count">{qty}</span>
              <button onClick={() => setQty(qty + 1)} aria-label="Increase quantity">+</button>
            </div>

            <button
              className="btn-modal-add"
              disabled={!isAvail}
              onClick={() => {
                add(item.id, qty)
                onClose()
              }}
            >
              <span>Add to Basket</span>
              <b>{money(itemPrice * qty)}</b>
            </button>
          </div>
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
          return (
            <Link
              key={tab.id}
              to={tab.id ? `/${tab.id}` : '/'}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="bottom-nav-icon-wrap">
                {tab.icon}
                {tab.badge > 0 && <span className="bottom-nav-badge">{tab.badge}</span>}
              </div>
              <span className="bottom-nav-label">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
