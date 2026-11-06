import { useState } from 'react'
import { go, money, useApp } from '../store.jsx'
import { Link, Food, DishCard, BranchPicker, Stars, GoogleIcon, CategoryIcon } from '../components/ui.jsx'
import { STATUSES, BRANCHES, CATEGORIES_WITH_ICONS, PROMO_CODES, EXTRAS, buildOrderWhatsAppUrl } from '../data.js'

// 1. Onboarding / Get Started Sequence (SnapEats Screen 1)
export function Onboarding({ onStart, onSignIn, onSignUp }) {
  const [slide, setSlide] = useState(0)
  const slides = [
    {
      title: "Good Food & Great Taste Made Easy with Lady 3D’s!",
      desc: "Delicious Ghanaian meals in one click with Lady 3D's Catering! Place orders for authentic waakye, smoky jollof, fresh banku and chilled drinks — fast and convenient."
    },
    {
      title: "Fast Campus Pickup & Doorstep Delivery in Sunyani",
      desc: "Skip long queues between lectures. Order ahead from Catholic University (Fiapre Annex) or Sunyani Main branch and pick up hot meals ready in minutes."
    },
    {
      title: "Earn Loyalty Points With Every Delicious Order",
      desc: "Collect points with every meal you enjoy. Reach 50 points for a completely free plate and get special birthday treats and campus promo discounts."
    }
  ]

  const curr = slides[slide]

  return (
    <div className="onboarding-screen">
      <div className="onboarding-top-arch">
        <div className="onboarding-pattern-watermark" />
        <div className="onboarding-brand-pill">
          <img src="/lady3d-logo.jpg" alt="Lady 3D" className="onboarding-logo-mini" />
          <span>LADY 3D’S CATERING</span>
        </div>
        <div className="onboarding-hero-image-wrap">
          <img
            src="/lady3d-logo.jpg"
            alt="Lady 3D's Catering Services"
            className="onboarding-hero-img onboarding-logo-display"
          />
        </div>
      </div>

      <div className="onboarding-card-body">
        <div className="onboarding-dots-row">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`onboarding-dot ${i === slide ? 'active' : ''}`}
              onClick={() => setSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <h1 className="onboarding-headline">{curr.title}</h1>
        <p className="onboarding-description">{curr.desc}</p>

        <div className="onboarding-actions-group">
          {slide < slides.length - 1 ? (
            <div className="onboarding-dual-btns">
              <button className="btn-secondary-ghost" onClick={() => setSlide(slides.length - 1)}>
                Skip
              </button>
              <button className="btn-primary-pill" onClick={() => setSlide(slide + 1)}>
                Next <span>→</span>
              </button>
            </div>
          ) : (
            <div className="onboarding-auth-actions">
              <button className="btn-primary-pill full-width" onClick={onSignUp}>
                Sign Up & Get 20% Off <span>→</span>
              </button>
              <button className="btn-secondary-pill full-width" onClick={onSignIn}>
                Sign In with Existing Account
              </button>
              <button className="btn-guest-browse" onClick={onStart}>
                Skip & explore menu as guest →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 2. Modern Home Page (SnapEats Screen 2 + Arby's + Bon Appétit)
export function Home() {
  const { menu, branch, setBranch, orderType, setOrderType, applyPromo, setActiveFood, add, promos, user } = useApp()
  const [activeCat, setActiveCat] = useState('All')
  const [searchVal, setSearchVal] = useState('')

  const activeBranch = BRANCHES.find(b => b.id === branch) || BRANCHES[0]
  const otherBranch = BRANCHES.find(b => b.id !== (branch || 'cug')) || BRANCHES[1]

  // Filter dishes strictly for current active branch
  const currentBranchDishes = menu.filter(m => !m.isExtra && (!branch || m.avail[branch]))
  const filteredDishes = currentBranchDishes.filter(m => {
    const matchCat = activeCat === 'All' || m.cat === activeCat
    const matchSearch = !searchVal || m.name.toLowerCase().includes(searchVal.toLowerCase()) || m.desc.toLowerCase().includes(searchVal.toLowerCase())
    return matchCat && matchSearch
  })

  const popularPicks = currentBranchDishes.slice(0, 4)
  const mealOfTheDay = currentBranchDishes.find(m => m.tag === 'Meal of the Day') || currentBranchDishes[0] || menu[1]
  const displayDishes = (searchVal || activeCat !== 'All') ? filteredDishes : popularPicks

  return (
    <div className="home-modern-view">
      {/* Top Location & Delivery Bar */}
      <section className="home-top-bar">
        <div className="location-info-block">
          <span className="delivery-to-label">Deliver to</span>
          <div className="location-dropdown-row">
            <span className="loc-pin-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
            </span>
            <select
              className="location-select"
              value={branch || 'cug'}
              onChange={e => setBranch(e.target.value)}
              aria-label="Delivery location"
            >
              {BRANCHES.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <span className="loc-chevron">▾</span>
          </div>
        </div>

        <div className="delivery-toggle-pill">
          <button
            className={`toggle-option ${orderType === 'delivery' ? 'active' : ''}`}
            onClick={() => setOrderType('delivery')}
          >
            Delivery
          </button>
          <button
            className={`toggle-option ${orderType === 'pickup' ? 'active' : ''}`}
            onClick={() => setOrderType('pickup')}
          >
            Pickup
          </button>
        </div>
      </section>

      {/* Hero Promo Banner */}
      <section className="promo-banner-card">
        <div className="promo-banner-content">
          <span className="promo-badge-tag">SPECIAL VOUCHER</span>
          <h2 className="promo-banner-title">
            Up to <span>20% OFF</span><br />Campus Orders!
          </h2>
          <p className="promo-banner-sub">Use voucher <b>WELCOME20</b> on all fresh Ghanaian meals</p>
          <div className="promo-banner-actions">
            <button
              className="btn-claim-voucher"
              onClick={() => {
                applyPromo('WELCOME20')
                go('/menu')
              }}
            >
              Claim Voucher →
            </button>
          </div>
        </div>
        <div className="promo-banner-media">
          <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
            alt="Delicious Meal Bowl"
            className="promo-food-image"
          />
        </div>
      </section>

      {/* Search Input Bar */}
      <section className="search-bar-section">
        <div className="search-input-box">
          <span className="search-glass-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            type="text"
            placeholder="Craving something special? Find it here..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            aria-label="Search food"
          />
          {searchVal && (
            <button className="search-clear-btn" onClick={() => setSearchVal('')}>✕</button>
          )}
        </div>
      </section>

      {/* Category Icons Row (SnapEats style) */}
      <section className="categories-icon-strip">
        <div className="categories-scroll-row">
          {CATEGORIES_WITH_ICONS.map(cat => {
            const isSelected = activeCat === cat.name
            return (
              <button
                key={cat.name}
                className={`category-item-chip ${isSelected ? 'active' : ''}`}
                onClick={() => setActiveCat(cat.name)}
              >
                <div className="category-icon-circle">
                  <CategoryIcon catKey={cat.key} />
                </div>
                <span className="category-name-text">{cat.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Favorites Just for You / Popular Picks */}
      <section className="home-dishes-section">
        <div className="section-title-row">
          <div>
            <span className="eyebrow-accent">FAVORITES JUST FOR YOU</span>
            <h2 className="section-main-heading">Popular Picks</h2>
          </div>
          <Link to="/menu" className="view-all-link">View All →</Link>
        </div>

        {displayDishes.length > 0 ? (
          <div className="dishes-grid-cards">
            {displayDishes.map(dish => (
              <DishCard key={dish.id} it={dish} />
            ))}
          </div>
        ) : (
          <div className="empty-state-card py-4">
            <p>No dishes found for this category at {activeBranch.short}.</p>
            <button className="btn-reset-filters" onClick={() => { setActiveCat('All'); setSearchVal(''); }}>
              Show All {activeBranch.short} Meals
            </button>
          </div>
        )}
      </section>

      {/* Official Extras Strip */}
      <section className="home-extras-strip-section">
        <div className="section-title-row">
          <div>
            <span className="eyebrow-accent">DELICIOUS ADD-ONS</span>
            <h2 className="section-main-heading">Extras & Sides</h2>
            <p className="section-subtext">Add extra portions of chicken, cow feet, towel, soups, or banku.</p>
          </div>
        </div>
        <div className="extras-cards-scroll">
          {EXTRAS.map(ex => (
            <div key={ex.id} className="extra-scroll-card" onClick={() => setActiveFood(ex)}>
              <div className="extra-card-thumb">
                <Food item={ex} className="extra-photo" />
              </div>
              <div className="extra-card-info">
                <h4 className="extra-card-name">{ex.name}</h4>
                <b className="extra-card-price">{money(ex.price)}</b>
              </div>
              <button
                type="button"
                className="btn-add-extra-plus"
                aria-label={`Add ${ex.name}`}
                onClick={(e) => {
                  e.stopPropagation()
                  add(ex.id, 1)
                }}
              >
                +
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Meal of the Day Feature Card */}
      {mealOfTheDay && (
        <section className="motd-banner-section" onClick={() => setActiveFood(mealOfTheDay)}>
          <div className="motd-image-col">
            <Food item={mealOfTheDay} className="motd-dish-photo" />
          </div>
          <div className="motd-info-col">
            <div className="motd-pill-badge">TODAY'S SPECIAL</div>
            <h3 className="motd-title">{mealOfTheDay.name}</h3>
            <p className="motd-desc">{mealOfTheDay.desc}</p>
            <div className="motd-price-row">
              <span className="motd-price-tag">{money(mealOfTheDay.price)}</span>
              <button className="btn-motd-order">Order Now ↗</button>
            </div>
          </div>
        </section>
      )}

      {/* Lady 3D Loyalty Rewards Banner (Arby's style) */}
      <section className="loyalty-rewards-banner">
        <div className="rewards-icon-badge">
          <span className="rewards-monogram-3d">3D</span>
        </div>
        <div className="rewards-text-col">
          <h3 className="rewards-banner-title">LADY 3D REWARDS</h3>
          <p className="rewards-banner-desc">
            Earn points with every order and unlock free plates, birthday drinks and VIP student discounts.
          </p>
        </div>
        <Link to="/account" className="btn-rewards-join">
          View Club →
        </Link>
      </section>
    </div>
  )
}

// 3. Modern Menu Screen
export function Menu() {
  const { menu, cats, ok, branch } = useApp()
  const init = new URLSearchParams((location.hash.split('?')[1]) || '').get('cat') || 'All'
  const [cat, setCat] = useState(init)
  const [q, setQ] = useState('')
  const [maxPrice, setMaxPrice] = useState(100)

  // Strictly filter by current selected branch!
  const list = menu.filter(m => {
    const matchBranch = !branch || ok(m)
    const matchCat = cat === 'All' || m.cat === cat
    const matchSearch = !q || m.name.toLowerCase().includes(q.toLowerCase()) || m.desc.toLowerCase().includes(q.toLowerCase())
    const matchPrice = m.price <= maxPrice
    return matchBranch && matchCat && matchSearch && matchPrice
  })

  return (
    <div className="menu-modern-page">
      <div className="menu-header-bar">
        <div>
          <span className="eyebrow-accent">EXPLORE OUR KITCHEN</span>
          <h1 className="menu-page-title">Lady 3D’s Menu</h1>
        </div>
        <BranchPicker />
      </div>

      <div className="menu-search-filter-box">
        <div className="search-input-box">
          <span className="search-glass-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            placeholder="Search waakye, jollof, banku, tilapia..."
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search meals"
          />
          {q && <button className="search-clear-btn" onClick={() => setQ('')}>✕</button>}
        </div>

        <div className="menu-filter-controls">
          <div className="menu-branch-indicator-tag">
            <span className="branch-dot-live" />
            <span>Serving at <b>{BRANCHES.find(b => b.id === (branch || 'cug'))?.name}</b></span>
          </div>
          <div className="price-slider-group">
            <span className="slider-label">Max: {money(maxPrice)}</span>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={maxPrice}
              onChange={e => setMaxPrice(+e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="menu-category-tabs">
        {['All', ...cats].map(c => (
          <button
            key={c}
            className={`menu-tab-btn ${c === cat ? 'active' : ''}`}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {list.length > 0 ? (
        <div className="dishes-grid-cards">
          {list.map(dish => (
            <DishCard key={dish.id} it={dish} />
          ))}
        </div>
      ) : (
        <div className="empty-state-card">
          <h3>No dishes found</h3>
          <p>Try resetting the category filter or searching for another dish.</p>
          <button className="btn-reset-filters" onClick={() => { setCat('All'); setQ(''); setMaxPrice(100); }}>
            Reset Filters
          </button>
        </div>
      )}
    </div>
  )
}

// 4. Food Detail Page
export function FoodPage({ id }) {
  const { menu, price, ok, add, branch, setBranch, say, favs, toggleFav } = useApp()
  const it = menu.find(m => m.id === +id)
  const [qty, setQty] = useState(1)
  const [selectedExtras, setSelectedExtras] = useState([])

  if (!it) {
    return (
      <div className="empty-state-card">
        <h3>Meal not found</h3>
        <Link to="/menu" className="btn-primary-pill">Back to Menu</Link>
      </div>
    )
  }

  const isAvail = ok(it)
  const isFav = favs.includes(it.id)
  const basePrice = price(it)
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + (e.price || 0), 0)
  const totalUnitPrice = basePrice + extrasTotal
  const otherBranch = it.avail?.['sunyani'] ? 'sunyani' : 'cug'
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
    <div className="food-detail-fullpage">
      <Link to="/menu" className="back-nav-link">← Back to Menu</Link>

      <div className="food-detail-card-layout">
        <div className="detail-media-pane">
          <Food item={it} className="detail-main-img" />
          <button
            type="button"
            className={`detail-fav-btn ${isFav ? 'active' : ''}`}
            onClick={() => toggleFav(it.id)}
            aria-label="Toggle favorite"
          >
            ♥
          </button>
        </div>

        <div className="detail-info-pane">
          <div className="detail-category-row">
            <span className="modal-cat-pill">{it.cat}</span>
            <span className="detail-rating-tag">★ {it.rating || 4.9} ({it.reviews || 85} reviews)</span>
          </div>

          <h1 className="detail-meal-title">{it.name}</h1>
          <p className="detail-meal-price">{money(basePrice)}</p>
          <p className="detail-desc-text">{it.desc}</p>

          <div className="detail-specs-box">
            <div className="spec-tile">
              <div>
                <b>{it.prepTime || '15 min'}</b>
                <small>Average Prep</small>
              </div>
            </div>
            <div className="spec-tile">
              <div>
                <b>{BRANCHES.find(b => b.id === branch)?.short || 'Campus'}</b>
                <small>Branch</small>
              </div>
            </div>
            <div className="spec-tile">
              <div>
                <b>100% Fresh</b>
                <small>Cooked Daily</small>
              </div>
            </div>
          </div>

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

          {/* Add Extras Section */}
          {!it.isExtra && EXTRAS && EXTRAS.length > 0 && (
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
                      <span className="extra-check-box">{isChecked ? '✓' : '+'}</span>
                      <span className="extra-option-name">{extra.name}</span>
                      <b className="extra-option-price">+{money(extra.price)}</b>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="detail-action-bar">
            <div className="modal-stepper">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="stepper-count">{qty}</span>
              <button onClick={() => setQty(qty + 1)}>+</button>
            </div>

            <button
              className="btn-modal-add grow"
              disabled={!isAvail}
              onClick={() => add(it.id, qty, selectedExtras)}
            >
              <span>Add to Basket</span>
              <b>{money(totalUnitPrice * qty)}</b>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 5. Modern Cart / Order Page (SnapEats Screen 3)
export function Cart() {
  const { lines, setQty, subtotal, discount, deliveryFee, total, price, ok, count, promoCode, promoError, applyPromo, removePromo, orderType, setOrderType } = useApp()
  const [promoInput, setPromoInput] = useState('')

  if (!count) {
    return (
      <div className="cart-empty-screen">
        <div className="empty-cart-illu">
          <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <h2>Your basket is empty</h2>
        <p>Looks like you haven't added any delicious meals to your basket yet.</p>
        <Link to="/menu" className="btn-order-cta" style={{ maxWidth: '280px', margin: '0 auto' }}>
          Browse Menu Now
        </Link>
      </div>
    )
  }

  return (
    <div className="cart-modern-screen">
      {/* Top Header Row */}
      <div className="cart-header-row">
        <Link to="/menu" className="cart-back-btn">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Menu
        </Link>
        <h1 className="cart-main-title">Order Basket</h1>
        <span className="cart-badge-count">{count} {count === 1 ? 'item' : 'items'}</span>
      </div>

      {/* Delivery / Pickup selector */}
      <div className="cart-mode-selector">
        <button
          type="button"
          className={`cart-mode-btn ${orderType === 'delivery' ? 'active' : ''}`}
          onClick={() => setOrderType('delivery')}
        >
          🛵 Campus Delivery
        </button>
        <button
          type="button"
          className={`cart-mode-btn ${orderType === 'pickup' ? 'active' : ''}`}
          onClick={() => setOrderType('pickup')}
        >
          🥡 Counter Pickup
        </button>
      </div>

      {/* Delivery Notice Pill */}
      <div className="cart-mode-info-banner">
        {orderType === 'delivery' ? (
          <span>
            🚀 Express campus delivery (15–25 mins). {subtotal >= 80 ? (
              <b className="free-tag">🎉 FREE delivery unlocked!</b>
            ) : (
              <span>Add <b>{money(Math.max(0, 80 - subtotal))}</b> more for FREE delivery.</span>
            )}
          </span>
        ) : (
          <span>🏪 Ready for instant pickup at kitchen counter in 10–15 mins.</span>
        )}
      </div>

      {/* Cart Items List */}
      <div className="cart-items-list">
        {lines.map(line => {
          const isLineAvail = ok(line.it)
          const lineId = line.lineId || line.id
          return (
            <div key={lineId} className={`cart-item-card ${isLineAvail ? '' : 'line-warn'}`}>
              {/* Top Row: Photo + Food Info + Trash Button */}
              <div className="cart-item-main-row">
                <div className="cart-item-photo">
                  <Food item={line.it} />
                </div>

                <div className="cart-item-content">
                  <div className="cart-item-header">
                    <h3 className="cart-item-title">{line.it.name}</h3>
                    <button
                      className="cart-item-remove-btn"
                      onClick={() => setQty(lineId, 0)}
                      aria-label="Remove item"
                      title="Remove from basket"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>

                  {line.extrasList && line.extrasList.length > 0 && (
                    <div className="cart-item-extras">
                      {line.extrasList.map((ex, i) => (
                        <span key={i} className="cart-extra-chip">+ {ex.name}</span>
                      ))}
                    </div>
                  )}

                  <span className="cart-unit-price">{money(line.unitPrice || price(line.it))} each</span>

                  {!isLineAvail && (
                    <div className="cart-item-warn-banner">
                      ⚠️ Unavailable at selected branch
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Quantity Stepper & Line Total */}
              <div className="cart-item-footer-row">
                <div className="cart-stepper-control">
                  <button onClick={() => setQty(lineId, line.qty - 1)} aria-label="Decrease quantity">−</button>
                  <span className="stepper-count">{line.qty}</span>
                  <button onClick={() => setQty(lineId, line.qty + 1)} aria-label="Increase quantity">+</button>
                </div>

                <div className="cart-item-total-price">
                  <span className="line-total-caption">Total:</span>
                  <strong className="line-total-amount">{money(line.lineTotal || (price(line.it) * line.qty))}</strong>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add more items shortcut */}
      <Link to="/menu" className="btn-add-more-items">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        Add More Food or Drinks
      </Link>

      {/* Promo Code Input Box */}
      <div className="promo-voucher-box">
        <div className="promo-box-header">
          <span className="promo-ticket-icon">🎟️</span>
          <div>
            <h4 className="promo-box-title">Have a Promocode or Voucher?</h4>
            <p className="promo-box-sub">Apply student & first-order discounts</p>
          </div>
        </div>

        <div className="promo-input-row">
          <input
            type="text"
            placeholder="Enter promo code (e.g. WELCOME20)"
            value={promoInput || promoCode}
            onChange={e => setPromoInput(e.target.value.toUpperCase())}
          />
          {promoCode ? (
            <button className="btn-promo-remove" onClick={removePromo}>Remove</button>
          ) : (
            <button className="btn-promo-apply" onClick={() => applyPromo(promoInput)}>Apply</button>
          )}
        </div>

        {promoCode && (
          <p className="promo-success-msg">✓ Promocode <b>{promoCode}</b> applied successfully!</p>
        )}
        {promoError && (
          <p className="promo-error-msg">{promoError}</p>
        )}

        <div className="promo-suggestions-row">
          <span className="suggest-hint">Quick apply:</span>
          {Object.keys(PROMO_CODES).map(code => (
            <button
              key={code}
              className={`promo-chip-quick ${promoCode === code ? 'active' : ''}`}
              onClick={() => applyPromo(code)}
            >
              {code} {PROMO_CODES[code]?.discount ? `(-${PROMO_CODES[code].discount * 100}%)` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Order Pricing Summary */}
      <div className="cart-totals-card">
        <h4 className="totals-card-title">Order Summary</h4>
        <div className="totals-row">
          <span>Subtotal</span>
          <span>{money(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="totals-row discount-row">
            <span>Promocode Discount ({promoCode})</span>
            <span className="discount-val">-{money(discount)}</span>
          </div>
        )}
        <div className="totals-row">
          <span>{orderType === 'delivery' ? 'Campus Delivery' : 'Counter Pickup'}</span>
          <span>{deliveryFee > 0 ? money(deliveryFee) : <span className="free-val">FREE</span>}</span>
        </div>
        <hr className="totals-divider" />
        <div className="totals-row total-highlight">
          <b>Total to Pay</b>
          <b className="total-num">{money(total)}</b>
        </div>
        <p className="totals-note">All taxes & packaging fees included.</p>
      </div>

      {/* Proceed to Checkout CTA */}
      <Link to="/checkout" className="btn-order-cta">
        Proceed to Checkout · {money(total)} <span>→</span>
      </Link>
    </div>
  )
}

// 6. Checkout Flow
export function Checkout() {
  const { lines, subtotal, discount, deliveryFee, total, price, ok, branch, place, user, setQty, orderType, setOrderType } = useApp()
  const [f, setF] = useState({
    name: user?.name || 'Julie Martin',
    phone: '0241234567',
    pay: 'momo',
    address: 'Hall 3, Room 14, Catholic University Fiapre',
    note: ''
  })
  const [step, setStep] = useState(1)
  const [err, setErr] = useState('')

  const bad = lines.filter(l => branch && !ok(l.it))

  if (!lines.length) {
    return (
      <div className="cart-empty-screen">
        <h2>No items to checkout</h2>
        <p>Your basket is currently empty. Please choose your favorite meals first.</p>
        <Link to="/menu" className="btn-order-cta" style={{ maxWidth: '280px', margin: '0 auto' }}>
          Browse Menu Now
        </Link>
      </div>
    )
  }

  const next = () => {
    if (!branch) return setErr('Please choose a branch.')
    if (bad.length) return setErr('Please remove items unavailable at this branch.')
    if (!f.name.trim() || !/^0\d{9}$/.test(f.phone.replace(/\s+/g, ''))) {
      return setErr('Please enter your full name and valid 10-digit phone number (e.g. 0241234567).')
    }
    setErr('')
    setStep(2)
  }

  const submit = () => {
    if (bad.length) return setStep(1)
    const ref = place(f)
    go('/success/' + ref)
  }

  return (
    <div className="checkout-modern-screen">
      {/* Top Header & Breadcrumbs */}
      <div className="checkout-header-step">
        <Link to="/cart" className="cart-back-btn">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Basket
        </Link>
        <h1 className="checkout-title">Checkout</h1>
        <div className="checkout-progress-steps">
          <span className={`step-dot ${step === 1 ? 'current' : 'done'}`}>1. Details</span>
          <span className="step-sep">→</span>
          <span className={`step-dot ${step === 2 ? 'current' : ''}`}>2. Confirm</span>
        </div>
      </div>

      <div className="checkout-form-card">
        {step === 1 ? (
          <>
            {/* Step 1 Section: Branch & Delivery Option */}
            <div className="form-group-section">
              <label className="field-group-title">1. Branch & Fulfillment Mode</label>
              <BranchPicker />

              <div className="cart-mode-selector mt-2">
                <button
                  type="button"
                  className={`cart-mode-btn ${orderType === 'delivery' ? 'active' : ''}`}
                  onClick={() => setOrderType('delivery')}
                >
                  🛵 Campus Delivery
                </button>
                <button
                  type="button"
                  className={`cart-mode-btn ${orderType === 'pickup' ? 'active' : ''}`}
                  onClick={() => setOrderType('pickup')}
                >
                  🥡 Counter Pickup
                </button>
              </div>
            </div>

            {/* Step 1 Section: Contact & Delivery Info */}
            <div className="form-group-section">
              <label className="field-group-title">2. Contact & Delivery Location</label>
              
              <label className="input-field-wrap">
                <span>Full Name</span>
                <input
                  value={f.name}
                  onChange={e => setF({ ...f, name: e.target.value })}
                  placeholder="e.g. Julie Martin"
                />
              </label>

              <label className="input-field-wrap">
                <span>Phone Number (for SMS & WhatsApp dispatch)</span>
                <input
                  type="tel"
                  value={f.phone}
                  onChange={e => setF({ ...f, phone: e.target.value })}
                  placeholder="024 123 4567"
                />
              </label>

              {orderType === 'delivery' && (
                <label className="input-field-wrap">
                  <span>Hostel / Block & Room Number</span>
                  <input
                    value={f.address}
                    onChange={e => setF({ ...f, address: e.target.value })}
                    placeholder="e.g. Hall 3, Block B, Room 14 (CUG Fiapre)"
                  />
                </label>
              )}

              <label className="input-field-wrap">
                <span>Order Note or Cooking Instructions (Optional)</span>
                <input
                  value={f.note || ''}
                  onChange={e => setF({ ...f, note: e.target.value })}
                  placeholder="e.g. Less pepper, extra shito, call on arrival"
                />
              </label>
            </div>

            {/* Step 1 Section: Payment Method */}
            <div className="form-group-section">
              <label className="field-group-title">3. Payment Method</label>
              <div className="payment-options-grid">
                <label className={`payment-card-opt ${f.pay === 'momo' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="pay"
                    checked={f.pay === 'momo'}
                    onChange={() => setF({ ...f, pay: 'momo' })}
                  />
                  <div className="payment-opt-info">
                    <div className="payment-title-row">
                      <b>📱 Mobile Money (MTN / Telecel / AT)</b>
                      <span className="pay-badge-popular">Instant</span>
                    </div>
                    <small>Payment authorization prompt sent to your phone</small>
                  </div>
                </label>

                <label className={`payment-card-opt ${f.pay === 'cash' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="pay"
                    checked={f.pay === 'cash'}
                    onChange={() => setF({ ...f, pay: 'cash' })}
                  />
                  <div className="payment-opt-info">
                    <div className="payment-title-row">
                      <b>💵 Pay on Delivery / Counter</b>
                    </div>
                    <small>Pay with cash or MoMo directly when food is received</small>
                  </div>
                </label>
              </div>
            </div>

            {bad.length > 0 && (
              <div className="checkout-alert-box">
                {bad.map(l => (
                  <p key={l.id}>
                    <span className="alert-symbol">!</span> <b>{l.it.name}</b> is not available at {BRANCHES.find(b => b.id === branch)?.short}.
                    <button className="btn-link-remove" onClick={() => setQty(l.id, 0)}>Remove</button>
                  </p>
                ))}
              </div>
            )}

            {err && <div className="checkout-error-pill">{err}</div>}

            <button className="btn-order-cta" onClick={next}>
              Review Order Details <span>→</span>
            </button>
          </>
        ) : (
          <div className="checkout-review-step">
            <h3 className="review-heading">Review & Confirm Your Order</h3>

            {/* Order Items Preview */}
            <div className="review-items-box">
              <span className="review-box-title">Order Items ({lines.length})</span>
              {lines.map(l => {
                const lineId = l.lineId || l.id
                return (
                  <div key={lineId} className="review-item-row">
                    <div className="review-item-left">
                      <b>{l.qty} × {l.it.name}</b>
                      {l.extrasList && l.extrasList.length > 0 && (
                        <span className="review-extras-note">
                          +{l.extrasList.map(e => e.name).join(', ')}
                        </span>
                      )}
                    </div>
                    <b className="review-item-price">{money(l.lineTotal || (price(l.it) * l.qty))}</b>
                  </div>
                )
              })}
            </div>

            {/* Delivery & Contact Note */}
            <div className="review-delivery-note">
              <div className="review-note-row">
                <b>📍 Branch:</b> <span>{BRANCHES.find(b => b.id === branch)?.name}</span>
              </div>
              <div className="review-note-row">
                <b>👤 Contact:</b> <span>{f.name} ({f.phone})</span>
              </div>
              <div className="review-note-row">
                <b>🛵 Mode:</b> <span>{orderType === 'delivery' ? 'Campus Delivery' : 'Counter Pickup'}</span>
              </div>
              {orderType === 'delivery' && (
                <div className="review-note-row">
                  <b>🏠 Address:</b> <span>{f.address}</span>
                </div>
              )}
              {f.note && (
                <div className="review-note-row">
                  <b>📝 Note:</b> <span>{f.note}</span>
                </div>
              )}
              <div className="review-note-row">
                <b>💳 Payment:</b> <span>{f.pay === 'momo' ? 'Mobile Money (Prompt on Phone)' : 'Pay on Delivery / Counter'}</span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="review-breakdown-box">
              <div className="review-row">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="review-row discount-text">
                  <span>Voucher Discount ({promoCode})</span>
                  <span>-{money(discount)}</span>
                </div>
              )}
              <div className="review-row">
                <span>{orderType === 'delivery' ? 'Campus Delivery' : 'Pickup Fee'}</span>
                <span>{deliveryFee > 0 ? money(deliveryFee) : 'FREE'}</span>
              </div>
              <hr className="review-divider" />
              <div className="review-row total-row">
                <b>Total Amount to Pay</b>
                <b className="total-highlight-val">{money(total)}</b>
              </div>
            </div>

            <div className="review-action-btns">
              <button className="btn-back-step" onClick={() => setStep(1)}>
                ← Back to Edit
              </button>
              <button className="btn-order-cta grow" onClick={submit}>
                Confirm & Place Order · {money(total)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 6b. Order Success Confirmation Screen
export function OrderSuccess({ refId }) {
  const { orders } = useApp()
  const currentRef = (refId || '').toUpperCase()
  const order = orders.find(x => x.ref === currentRef) || orders[0]
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (order?.ref) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(order.ref)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const branchObj = BRANCHES.find(b => b.id === order?.branch) || BRANCHES[0]

  return (
    <div className="order-success-screen">
      <div className="success-card-main">
        {/* Animated Celebration Icon */}
        <div className="success-icon-badge-wrap">
          <div className="success-icon-circle">
            <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="success-pulse-ring" />
        </div>

        <span className="success-eyebrow">ORDER CONFIRMED</span>
        <h1 className="success-title">Order Placed Successfully!</h1>
        <p className="success-subtitle">
          Thank you, <b>{order?.name || 'Customer'}</b>! Your meal is being freshly prepared with love by Lady 3D’s kitchen.
        </p>

        {/* Reference Code Box */}
        <div className="success-order-ref-box">
          <div className="ref-code-info">
            <span className="ref-label">Order Reference Code</span>
            <strong className="ref-number">{order?.ref || currentRef}</strong>
          </div>
          <button type="button" className="btn-copy-code" onClick={handleCopy}>
            {copied ? '✓ Copied' : 'Copy Code'}
          </button>
        </div>

        {/* Estimated Time & Branch */}
        <div className="success-meta-grid">
          <div className="success-meta-item">
            <span className="meta-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </span>
            <div>
              <span className="meta-title">Estimated Time</span>
              <b className="meta-value">15 – 25 Minutes</b>
            </div>
          </div>

          <div className="success-meta-item">
            <span className="meta-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
              </svg>
            </span>
            <div>
              <span className="meta-title">{order?.orderType === 'delivery' ? 'Campus Delivery' : 'Counter Pickup'}</span>
              <b className="meta-value">{branchObj?.name}</b>
            </div>
          </div>
        </div>

        {/* Order Items Breakdown */}
        {order && order.items && (
          <div className="success-items-summary">
            <h3 className="summary-title">Ordered Items ({order.items.reduce((s, x) => s + x.qty, 0)})</h3>
            <div className="summary-items-list">
              {order.items.map((item, idx) => (
                <div key={idx} className="summary-item-row">
                  <div className="summary-item-left">
                    <span className="summary-item-qty">{item.qty}×</span>
                    <div>
                      <b className="summary-item-name">{item.name}</b>
                      {item.extras && item.extras.length > 0 && (
                        <div className="summary-extras-line">
                          {item.extras.map((ex, ei) => (
                            <span key={ei} className="summary-extra-tag">+ {ex.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <strong className="summary-item-total">{money((item.price || item.unitPrice || 0) * item.qty)}</strong>
                </div>
              ))}
            </div>

            <div className="summary-pricing-footer">
              <div className="pricing-row">
                <span>Subtotal</span>
                <span>{money(order.subtotal || order.total)}</span>
              </div>
              {order.discount > 0 && (
                <div className="pricing-row discount-row">
                  <span>Voucher Discount</span>
                  <span>−{money(order.discount)}</span>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div className="pricing-row">
                  <span>Delivery Fee</span>
                  <span>{money(order.deliveryFee)}</span>
                </div>
              )}
              <div className="pricing-row grand-total-row">
                <b>Total Amount</b>
                <b className="grand-total-amount">{money(order.total)}</b>
              </div>
              <div className="payment-status-pill">
                Payment: {order.paid ? '✓ Paid' : order.pay === 'momo' ? 'Mobile Money (Prompt sent on dispatch)' : 'Pay on Collection / Delivery'}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="success-action-buttons">
          {order && (
            <a
              href={buildOrderWhatsAppUrl(order)}
              target="_blank"
              rel="noreferrer"
              className="btn-whatsapp-dispatch-primary"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.04-1.08l-.29-.17-3.01.79.8-2.93-.19-.3a8.163 8.163 0 0 1-1.25-4.37c0-4.54 3.7-8.24 8.24-8.24h.01z"/>
              </svg>
              <span>Send Order to {branchObj?.short} Kitchen via WhatsApp</span>
            </a>
          )}
          <button
            type="button"
            className="btn-track-live"
            onClick={() => go('/track/' + (order?.ref || currentRef))}
          >
            Track Order Live →
          </button>
          <button
            type="button"
            className="btn-back-home"
            onClick={() => go('/')}
          >
            Back to Home
          </button>
        </div>

        {/* WhatsApp Support Link */}
        <div className="success-help-note">
          <span>Need help or special instructions?</span>
          <a
            href={`https://wa.me/233531299243?text=Hello%20Lady%203D's,%20I%20just%20placed%20order%20${order?.ref || currentRef}.`}
            target="_blank"
            rel="noreferrer"
            className="whatsapp-support-link"
          >
            Chat with Lady 3D’s on WhatsApp (053 129 9243)
          </a>
        </div>
      </div>
    </div>
  )
}

// 7. Modern Order Tracking Screen (Bon Appétit Screen 4)
export function Track({ refId }) {
  const { orders } = useApp()
  const [inputRef, setInputRef] = useState(refId || '')
  const currentRef = (refId || '').toUpperCase()
  const order = orders.find(x => x.ref === currentRef)

  return (
    <div className="track-modern-page">
      <div className="track-header-box">
        <span className="eyebrow-accent">LIVE ORDER STATUS</span>
        <h1 className="track-page-title">Track Your Order</h1>
      </div>

      <div className="track-search-row">
        <input
          value={inputRef}
          onChange={e => setInputRef(e.target.value.toUpperCase())}
          placeholder="Enter order reference (e.g. L3D-7K2QA)"
          aria-label="Order reference"
        />
        <button className="btn-track-action" onClick={() => go('/track/' + inputRef.trim())}>
          Track
        </button>
      </div>

      {refId && !order && (
        <div className="empty-state-card mt-3">
          <p>No active order found with reference <b>{refId}</b>.</p>
        </div>
      )}

      {order && (
        <div className="order-live-card">
          <div className="order-status-banner">
            <div>
              <span className="order-ref-label">Order Reference</span>
              <h2 className="order-ref-code">{order.ref}</h2>
              <span className="order-time-stamp">Placed at {order.time || '12:30'}</span>
            </div>
            <div className={`order-paid-status ${order.paid ? 'paid' : 'pending'}`}>
              {order.paid ? '✓ Paid' : order.pay === 'momo' ? 'MoMo Pending' : 'Pay at Counter'}
            </div>
          </div>

          <div className="live-progress-flow">
            {STATUSES.map((step, idx) => {
              const isPast = idx < order.status
              const isCurrent = idx === order.status
              return (
                <div
                  key={step.label}
                  className={`flow-step ${isPast ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  <div className="flow-step-icon">
                    <span className="step-num-badge">{idx + 1}</span>
                  </div>
                  <div className="flow-step-body">
                    <b className="flow-step-name">{step.label}</b>
                    <span className="flow-step-desc">{step.desc}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="order-details-summary">
            <h3>Order Details</h3>
            <div className="summary-items-list">
              {order.items.map((it, i) => (
                <div key={i} className="summary-item-row">
                  <span>{it.qty} × {it.name}</span>
                  <b>{money(it.price * it.qty)}</b>
                </div>
              ))}
            </div>
            <div className="summary-totals-row">
              <span>Total Paid:</span>
              <strong className="summary-total-price">{money(order.total)}</strong>
            </div>
            <div className="summary-location-info">
              <span>Branch: {BRANCHES.find(b => b.id === order.branch)?.name || 'CUG Annex'}</span>
              <span>Mode: {order.orderType === 'delivery' ? 'Campus Delivery' : 'Self Pickup'}</span>
            </div>
          </div>

          <div className="track-whatsapp-cta-box">
            <a
              href={buildOrderWhatsAppUrl(order)}
              target="_blank"
              rel="noreferrer"
              className="btn-whatsapp-track"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.04-1.08l-.29-.17-3.01.79.8-2.93-.19-.3a8.163 8.163 0 0 1-1.25-4.37c0-4.54 3.7-8.24 8.24-8.24h.01z"/>
              </svg>
              <span>Message {BRANCHES.find(b => b.id === order.branch)?.short || 'Kitchen'} via WhatsApp</span>
            </a>
          </div>

          <div className="track-admin-quickhint">
            <span>Notice: Open the <b>Admin Dashboard</b> to advance this order's status and see live updates.</span>
          </div>
        </div>
      )}
    </div>
  )
}

// 8. Sign In Page (Bon Appétit style)
export function SignIn() {
  const { user, loginUser, setGoogleModal, say } = useApp()
  const [email, setEmail] = useState('julie.martin@cug.edu.gh')
  const [password, setPassword] = useState('••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  if (user) {
    return (
      <div className="auth-already-in-card">
        <div className="auth-user-badge">✓</div>
        <h2>You are currently signed in</h2>
        <p>Logged in as <b>{user.name}</b> ({user.email})</p>
        <div className="auth-redirect-actions">
          <Link to="/account" className="btn-primary-pill">Go to Account</Link>
          <Link to="/menu" className="btn-secondary-ghost">Browse Menu</Link>
        </div>
      </div>
    )
  }

  const handleSignIn = (e) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      return say('Please enter a valid email address')
    }
    const namePart = email.split('@')[0].replace(/[._]/g, ' ')
    const formattedName = namePart.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    loginUser({
      name: formattedName || 'Student Customer',
      email: email.trim(),
      phone: '0241234567',
      googleAuth: false,
      avatar: ''
    })
    go('/account')
  }

  return (
    <div className="auth-modern-screen">
      <div className="auth-card-container">
        {/* Top visual matching Bon Appétit login */}
        <div className="auth-header-visual">
          <div className="auth-brand-circle">
            <img src="/lady3d-logo.jpg" alt="Lady 3D's" className="auth-brand-logo-img" />
          </div>
          <h1 className="auth-title">Welcome Back!</h1>
          <p className="auth-subtitle">Sign in to continue enjoying hot Ghanaian meals, track orders & earn rewards.</p>
        </div>

        {/* Google Sign In Button */}
        <div className="social-auth-section">
          <button
            type="button"
            className="btn-google-auth"
            onClick={() => setGoogleModal(true)}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="auth-divider-line">
          <span>or sign in with email</span>
        </div>

        <form onSubmit={handleSignIn} className="auth-form-fields">
          {/* Quick autofill demo chips */}
          <div className="auth-quick-autofill">
            <span className="autofill-hint">Demo accounts:</span>
            <button
              type="button"
              className="autofill-chip"
              onClick={() => {
                setEmail('julie.martin@cug.edu.gh')
                setPassword('password123')
              }}
            >
              Julie Martin (CUG)
            </button>
            <button
              type="button"
              className="autofill-chip"
              onClick={() => {
                setEmail('kofi.mensah@gmail.com')
                setPassword('password123')
              }}
            >
              Kofi Mensah (Sunyani)
            </button>
          </div>

          <label className="input-field-wrap">
            <span>Email Address</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. name@cug.edu.gh or gmail.com"
              required
            />
          </label>

          <label className="input-field-wrap password-wrap">
            <div className="password-header-row">
              <span>Password</span>
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>

          <div className="auth-extras-row">
            <label className="remember-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="btn-forgot-pass"
              onClick={() => say('Password reset link sent to ' + (email || 'your email'))}
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" className="btn-auth-submit">
            Sign In <span>→</span>
          </button>
        </form>

        <div className="auth-switch-footer">
          <p>Don't have an account yet?</p>
          <Link to="/signup" className="auth-switch-link">
            Create Account & Get 20% Off <span>↗</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

// 9. Sign Up Page
export function SignUp() {
  const { user, loginUser, setGoogleModal, say, branch } = useApp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedBranch, setSelectedBranch] = useState(branch || 'cug')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(true)

  if (user) {
    return (
      <div className="auth-already-in-card">
        <div className="auth-user-badge">✓</div>
        <h2>You already have an active session</h2>
        <p>Signed in as <b>{user.name}</b> ({user.email})</p>
        <div className="auth-redirect-actions">
          <Link to="/account" className="btn-primary-pill">Go to Account</Link>
          <Link to="/menu" className="btn-secondary-ghost">Browse Menu</Link>
        </div>
      </div>
    )
  }

  const handleSignUp = (e) => {
    e.preventDefault()
    if (!name.trim()) return say('Please enter your full name')
    if (!email.trim() || !email.includes('@')) return say('Please enter a valid email address')
    if (!phone.trim() || phone.length < 9) return say('Please enter a valid 10-digit phone number')
    if (!password || password.length < 4) return say('Please choose a password (at least 4 characters)')
    if (!agreed) return say('Please agree to terms to register')

    loginUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      branch: selectedBranch,
      googleAuth: false,
      avatar: ''
    })
    say('Account created! Code WELCOME20 is ready to use.')
    go('/account')
  }

  return (
    <div className="auth-modern-screen">
      <div className="auth-card-container">
        {/* Header */}
        <div className="auth-header-visual">
          <div className="auth-brand-circle">
            <img src="/lady3d-logo.jpg" alt="Lady 3D's" className="auth-brand-logo-img" />
          </div>
          <span className="auth-promo-pill">20% WELCOME VOUCHER</span>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the Lady 3D Food Club for campus delivery, loyalty points and free meals.</p>
        </div>

        {/* Google Sign Up Button */}
        <div className="social-auth-section">
          <button
            type="button"
            className="btn-google-auth"
            onClick={() => setGoogleModal(true)}
          >
            <GoogleIcon />
            <span>Sign up with Google</span>
          </button>
        </div>

        <div className="auth-divider-line">
          <span>or register with email</span>
        </div>

        <form onSubmit={handleSignUp} className="auth-form-fields">
          <label className="input-field-wrap">
            <span>Full Name</span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ama Boateng"
              required
            />
          </label>

          <label className="input-field-wrap">
            <span>Campus or Personal Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. ama.boateng@cug.edu.gh or gmail.com"
              required
            />
          </label>

          <label className="input-field-wrap">
            <span>Phone Number (for SMS & WhatsApp delivery dispatch)</span>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0241234567"
              required
            />
          </label>

          <label className="input-field-wrap">
            <span>Primary Campus / Pickup Branch</span>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="auth-select-branch"
            >
              {BRANCHES.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>

          <label className="input-field-wrap password-wrap">
            <div className="password-header-row">
              <span>Create Password</span>
              <button
                type="button"
                className="btn-toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </label>

          <label className="terms-checkbox-label">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
            />
            <span>I agree to receive order status SMS updates & rewards info.</span>
          </label>

          <button type="submit" className="btn-auth-submit">
            Create Account & Get 20% Off <span>→</span>
          </button>
        </form>

        <div className="auth-switch-footer">
          <p>Already have an account?</p>
          <Link to="/login" className="auth-switch-link">
            Sign In Here <span>↗</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

// 10. Modern Account / Profile Screen (Bon Appétit Screen 5)
export function Account() {
  const { user, logoutUser, orders, favs, menu, points, say, canInstall, installPwa } = useApp()
  const [tab, setTab] = useState('orders')

  if (!user) {
    return <SignIn />
  }

  const mine = orders.filter(o => o.mine)

  return (
    <div className="account-modern-page">
      {/* Profile Card Header */}
      <div className="profile-banner-card">
        <div className="profile-avatar-wrap">
          <span className="profile-avatar-letters">
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="profile-meta-info">
          <h2 className="profile-user-name">{user.name}</h2>
          <span className="profile-user-email">{user.email}</span>
          <div className="profile-badges-row">
            <span className="profile-tag-badge">Lady 3D Food Club VIP</span>
            {user.googleAuth && (
              <span className="profile-google-badge">
                <GoogleIcon /> Google Verified
              </span>
            )}
          </div>
        </div>
        <button className="btn-logout" onClick={logoutUser} title="Sign out">
          Sign out
        </button>
      </div>

      {/* Install App on Phone (PWA Option 2) */}
      <div className="install-pwa-card">
        <div className="install-pwa-left">
          <div className="install-pwa-icon">
            <img src="/lady3d-logo.jpg" alt="Lady 3D" />
          </div>
          <div>
            <h4 className="install-title">Install Lady 3D on Your Phone</h4>
            <p className="install-subtitle">Fast 1-tap food ordering, instant status updates, and offline access.</p>
          </div>
        </div>
        {canInstall ? (
          <button className="btn-pwa-install-action" onClick={installPwa}>
            Install App Now
          </button>
        ) : (
          <div className="pwa-install-guide">
            <span className="pwa-tip"><b>iPhone:</b> Tap Safari Share <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> then <b>Add to Home Screen</b></span>
            <span className="pwa-tip"><b>Android:</b> Tap Chrome menu <b>⋮</b> then <b>Install App</b></span>
          </div>
        )}
      </div>

      {/* Rewards Progress Card */}
      <div className="rewards-dashboard-card">
        <div className="rewards-card-header">
          <div>
            <span className="rewards-sublabel">LOYALTY BALANCE</span>
            <h3 className="rewards-points-count">{points} <span>Points</span></h3>
          </div>
          <div className="rewards-icon-gold">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M19 5h-2V3a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2H5a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3h.14A8.006 8.006 0 0 0 11 19.93V22h2v-2.07A8.006 8.006 0 0 0 18.86 13H19a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3zm-6-1v1h-2V4h2zM4 10V8a1 1 0 0 1 1-1h1v4H5a1 1 0 0 1-1-1zm16 0a1 1 0 0 1-1 1h-1V7h1a1 1 0 0 1 1 1v2z"/>
            </svg>
          </div>
        </div>

        <div className="rewards-progress-bar">
          <div
            className="rewards-progress-fill"
            style={{ width: `${Math.min(100, (points / 50) * 100)}%` }}
          />
        </div>

        <p className="rewards-note">
          {Math.max(0, 50 - points)} more points needed to claim your next <b>FREE Plate</b>! (Earn 1 pt per GH₵10 spent).
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="account-subtabs-row">
        {[
          ['orders', 'Order History'],
          ['favs', 'Favorites'],
          ['rewards', 'Rewards & Vouchers'],
          ['profile', 'Profile Settings']
        ].map(([k, label]) => (
          <button
            key={k}
            className={`account-subtab-btn ${tab === k ? 'active' : ''}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {tab === 'orders' && (
        <div className="account-orders-list">
          {mine.length > 0 ? (
            mine.map(o => (
              <div key={o.ref} className="account-order-item-card">
                <div>
                  <b>{o.ref}</b>
                  <div className="order-item-sub">
                    {o.items?.length || 1} items · {money(o.total)} · {o.time || 'Today'}
                  </div>
                </div>
                <Link to={'/track/' + o.ref} className="btn-track-pill">
                  {STATUSES[o.status]?.label || 'Active'} ↗
                </Link>
              </div>
            ))
          ) : (
            <p className="empty-subtext">No orders placed yet. Your recent orders will show here.</p>
          )}
        </div>
      )}

      {tab === 'favs' && (
        <div className="account-favs-view">
          {favs.length > 0 ? (
            <div className="dishes-grid-cards">
              {menu.filter(m => favs.includes(m.id)).map(dish => (
                <DishCard key={dish.id} it={dish} />
              ))}
            </div>
          ) : (
            <p className="empty-subtext">No favorites saved yet. Tap the heart ♥ on any meal to save it!</p>
          )}
        </div>
      )}

      {tab === 'rewards' && (
        <div className="account-rewards-box">
          <div className="voucher-card-item">
            <span className="voucher-discount">20% OFF</span>
            <div>
              <b>WELCOME20</b>
              <p>Welcome coupon for all new campus and catering orders.</p>
            </div>
          </div>
          <div className="voucher-card-item">
            <span className="voucher-discount">10% OFF</span>
            <div>
              <b>STUDENT10</b>
              <p>Student ID discount before 11:00 AM on weekdays.</p>
            </div>
          </div>
          <div className="voucher-card-item">
            <span className="voucher-discount">FREE SOBOLO</span>
            <div>
              <b>BIRTHDAY TREAT</b>
              <p>Free chilled 500ml Sobolo during your birthday week.</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'profile' && (
        <div className="account-settings-card">
          <label className="input-field-wrap">
            <span>Name</span>
            <input defaultValue={user.name} />
          </label>
          <label className="input-field-wrap">
            <span>Email</span>
            <input defaultValue={user.email} />
          </label>
          <label className="input-field-wrap">
            <span>Preferred Branch</span>
            <BranchPicker />
          </label>
          <button className="btn-order-cta" onClick={() => say('Profile updated successfully')}>
            Save Changes
          </button>
        </div>
      )}
    </div>
  )
}

// 11. Campus & Community Page
export function Community() {
  const { votes, setVotes, voted, setVoted, reviews, setReviews, branch, setBranch, say } = useApp()
  const [r, setR] = useState({ who: '', role: 'CUG Student', stars: 5, text: '' })
  const tot = Object.values(votes).reduce((a, b) => a + b, 0)

  return (
    <div className="community-modern-page">
      <div className="community-header">
        <span className="eyebrow-accent">CAMPUS & SUNYANI COMMUNITY</span>
        <h1>Campus Life & Catering Services</h1>
        <p className="community-sub">
          Weekly student dish voting, official branch menus from our flyer & signboard, university catering reservations, and verified diner reviews.
        </p>
      </div>

      {/* Official Branches & Menu Showcase */}
      <section className="branches-showcase-section">
        <div className="section-title-row">
          <div>
            <span className="eyebrow-accent">OUR TWO OFFICIAL LOCATIONS</span>
            <h2 className="section-main-heading">Campus Annex & Main Kitchen</h2>
            <p className="section-subtext">
              Authentic food selections and photos as displayed on our official Campus Flyer and Main Branch Signboard.
            </p>
          </div>
        </div>

        <div className="branches-cards-grid">
          {/* Card 1: Campus Flyer (Fiapre Annex) */}
          <div className="branch-visual-card">
            <div className="branch-flyer-thumb-frame">
              <img
                src="/campus-branch-flyer.jpg"
                alt="Lady 3D's Catholic University Campus Flyer"
                className="branch-flyer-img"
              />
              <span className="branch-photo-tag">Photo 2: Official Campus Flyer</span>
            </div>
            <div className="branch-card-body">
              <div className="branch-meta-badge">Catholic University of Ghana (Fiapre Annex)</div>
              <h3 className="branch-card-title">Campus Branch (The Flyer)</h3>
              <p className="branch-card-slogan">“DELICIOUS MEALS, MADE WITH LOVE”</p>
              <div className="branch-items-pill-group">
                <span className="dish-bubble">Waakye on Plantain Leaf</span>
                <span className="dish-bubble">Jollof & Grilled Chicken</span>
                <span className="dish-bubble">Fried Rice & Fried Tilapia</span>
                <span className="dish-bubble">Banku with Towel</span>
                <span className="dish-bubble">Cow Feet Soup</span>
                <span className="dish-bubble">Plain Rice & Stew</span>
              </div>
              <div className="branch-contact-info-list">
                <div className="branch-contact-row">
                  <span className="contact-label">Location:</span>
                  <span className="contact-val">Fiapre Campus, Catholic University of Ghana</span>
                </div>
                <div className="branch-contact-row">
                  <span className="contact-label">Order Phone:</span>
                  <a href="tel:0276913089" className="contact-val link-val">027 691 3089</a>
                </div>
                <div className="branch-contact-row">
                  <span className="contact-label">WhatsApp:</span>
                  <a href="https://wa.me/233531299243" target="_blank" rel="noreferrer" className="contact-val link-val">053 129 9243</a>
                </div>
              </div>
              <div className="branch-action-buttons">
                <button
                  type="button"
                  className="btn-branch-order-now"
                  onClick={() => {
                    setBranch('cug')
                    say('Switched to Catholic University Campus')
                    go('/menu')
                  }}
                >
                  Order Campus Menu →
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Main Branch Signboard (Sunyani Main) */}
          <div className="branch-visual-card">
            <div className="branch-flyer-thumb-frame">
              <img
                src="/main-branch-signboard.jpg"
                alt="Lady 3D's Sunyani Main Branch Signboard"
                className="branch-flyer-img signboard-aspect"
              />
              <span className="branch-photo-tag">Photo 1: Main Branch Signboard</span>
            </div>
            <div className="branch-card-body">
              <div className="branch-meta-badge">Market Circle, Sunyani Main</div>
              <h3 className="branch-card-title">Main Branch (The Signboard)</h3>
              <p className="branch-card-slogan">“WE SERVE ALL KINDS OF LOCAL & CONTINENTAL DISHES”</p>
              <div className="branch-items-pill-group">
                <span className="dish-bubble highlight">Yam & Plantain Ampesi</span>
                <span className="dish-bubble highlight">Kontomire Palava Sauce</span>
                <span className="dish-bubble highlight">Garden Egg Stew & Fish</span>
                <span className="dish-bubble highlight">Banku & Grilled Tilapia</span>
                <span className="dish-bubble highlight">Fufu & Goat Light Soup</span>
                <span className="dish-bubble highlight">Kokonte with Groundnut Soup</span>
              </div>
              <div className="branch-contact-info-list">
                <div className="branch-contact-row">
                  <span className="contact-label">Location:</span>
                  <span className="contact-val">Market Circle / Main Road, Sunyani</span>
                </div>
                <div className="branch-contact-row">
                  <span className="contact-label">Order Phone:</span>
                  <a href="tel:0276913089" className="contact-val link-val">027 691 3089</a>
                </div>
                <div className="branch-contact-row">
                  <span className="contact-label">Book Events:</span>
                  <a href="tel:0244650474" className="contact-val link-val highlight-tel">024 465 0474</a>
                </div>
              </div>
              <div className="branch-action-buttons">
                <button
                  type="button"
                  className="btn-branch-order-now main-branch-theme"
                  onClick={() => {
                    setBranch('sunyani')
                    say('Switched to Sunyani Main Branch')
                    go('/menu')
                  }}
                >
                  Order Main Branch Menu →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="community-two-col">
        {/* Weekly Student Choice Poll */}
        <div className="card-box-modern">
          <div className="poll-header-badge">
            <span className="badge-live-tag">Weekly Vote</span>
            <span className="badge-votes-count">{tot} Votes Cast</span>
          </div>
          <h2>Weekly Student Choice Poll</h2>
          <p className="card-box-sub">
            Vote for next Tuesday’s campus lunch special. The winning dish is cooked fresh with extra portions at special student pricing at our Catholic University Annex.
          </p>
          <div className="poll-options-list">
            {Object.entries(votes).map(([n, v]) => {
              const pct = Math.round((v / tot) * 100)
              return (
                <button
                  key={n}
                  className={`poll-option-btn ${voted === n ? 'voted' : ''}`}
                  disabled={!!voted}
                  onClick={() => {
                    setVotes({ ...votes, [n]: v + 1 })
                    setVoted(n)
                    say('Your vote has been counted')
                  }}
                >
                  <div className="poll-bar-fill" style={{ width: `${pct}%` }} />
                  <span className="poll-name">{n}</span>
                  <b className="poll-pct">{pct}% ({v})</b>
                </button>
              )
            })}
          </div>
          {voted && (
            <p className="poll-thankyou-note">
              Thank you! You voted for <b>{voted}</b>. Results are updated live and announced every Monday morning.
            </p>
          )}
        </div>

        {/* Catering & Event Services */}
        <div className="card-box-modern catering-spotlight-box">
          <div className="catering-badge-pill">Official Campus Catering</div>
          <h2>Catering & Event Packages</h2>
          <p className="card-box-sub">
            Full buffet setups, chafing dish service, and packed meal crates for university departments, student associations, matriculation dinners, and conferences.
          </p>

          <div className="catering-features-list">
            <div className="catering-feature-item">
              <b>Executive Buffet Service</b>
              <span>Hot chafing dishes, servers, and tailored Ghanaian menus.</span>
            </div>
            <div className="catering-feature-item">
              <b>Association & Hall Packs</b>
              <span>Pre-boxed hot plates delivered in insulated crates to campus halls.</span>
            </div>
            <div className="catering-feature-item">
              <b>Beverages & Refreshments</b>
              <span>Chilled 500ml Sobolo jars, pastries, and natural juices.</span>
            </div>
          </div>

          <div className="catering-contact-action-bar">
            <a
              href="https://wa.me/233531299243?text=Hello%20Lady%203D's%20Catering%20Services,%20I%20would%20like%20to%20inquire%20about%20catering%20for%20our%20event."
              target="_blank"
              rel="noreferrer"
              className="btn-whatsapp"
            >
              Contact Catering via WhatsApp
            </a>
            <span className="catering-hotline-note">
              Kitchen Hotline: <b>027 691 3089</b> / <b>053 129 9243</b> • Book Events: <b>024 465 0474</b>
            </span>
          </div>
        </div>
      </div>

      {/* Campus Delivery Hubs Schedule */}
      <div className="campus-schedule-card mt-3">
        <h2>Campus Delivery Hubs & Hours</h2>
        <div className="schedule-locations-grid">
          <div className="schedule-location-item">
            <span className="location-name">Catholic University of Ghana (Fiapre Annex)</span>
            <span className="location-hours">Monday – Saturday: 10:30 AM – 6:30 PM</span>
            <span className="location-coverage">Direct delivery to Hall 1, Hall 2, Hall 3, Annex, and Faculty Offices</span>
          </div>
          <div className="schedule-location-item">
            <span className="location-name">Sunyani Main Kitchen</span>
            <span className="location-hours">Monday – Sunday: 7:00 AM – 8:00 PM</span>
            <span className="location-coverage">Counter pickup at Market Circle and delivery across Sunyani Township</span>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section-card mt-3">
        <h2>Verified Customer Reviews</h2>
        <p className="card-box-sub">Feedback from students, faculty, and catering clients.</p>

        <div className="reviews-list-grid">
          {reviews.filter(x => x.show).map(rev => (
            <div key={rev.id} className="review-quote-card">
              <div className="review-quote-header">
                <Stars n={rev.stars} />
                <span className="review-time">{rev.time || 'Recent'}</span>
              </div>
              <p className="review-text">“{rev.text}”</p>
              <div className="review-author-row">
                <b className="review-author">{rev.who}</b>
                <span className="review-verified-badge">Verified Customer</span>
              </div>
            </div>
          ))}
        </div>

        <div className="review-form-box">
          <h3>Submit Your Review</h3>
          <div className="review-inputs-row">
            <input
              placeholder="Your name and affiliation (e.g. CUG Student)"
              value={r.who}
              onChange={e => setR({ ...r, who: e.target.value })}
            />
            <select
              value={r.stars}
              onChange={e => setR({ ...r, stars: +e.target.value })}
            >
              <option value="5">5 Stars (Excellent)</option>
              <option value="4">4 Stars (Good)</option>
              <option value="3">3 Stars (Average)</option>
            </select>
          </div>
          <textarea
            placeholder="Share your experience with our food taste, portions, and service..."
            value={r.text}
            onChange={e => setR({ ...r, text: e.target.value })}
          />
          <button
            className="btn-primary-pill"
            onClick={() => {
              if (!r.text) return say('Please type your review first')
              setReviews([
                ...reviews,
                { id: Date.now(), who: r.who || 'Campus Customer', stars: r.stars, text: r.text, show: true, time: 'Just now' }
              ])
              setR({ who: '', role: 'CUG Student', stars: 5, text: '' })
              say('Thank you for submitting your review.')
            }}
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  )
}
