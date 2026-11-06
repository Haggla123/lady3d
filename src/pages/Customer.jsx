import { useState } from 'react'
import { go, money, useApp } from '../store.jsx'
import { Link, Food, DishCard, BranchPicker, Stars } from '../components/ui.jsx'
import { STATUSES, BRANCHES, CATEGORIES_WITH_ICONS, PROMO_CODES } from '../data.js'

// 1. Onboarding / Get Started Sequence (SnapEats Screen 1)
export function Onboarding({ onStart }) {
  const [slide, setSlide] = useState(0)
  const slides = [
    {
      title: "Good Food & Great Taste Made Easy with Lady 3D’s!",
      desc: "Delicious Ghanaian meals in one click with Lady 3D's Catering! Place orders for authentic waakye, smoky jollof, fresh banku and chilled drinks — fast and convenient.",
      img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      tag: "Freshly Made Daily"
    },
    {
      title: "Fast Campus Pickup & Doorstep Delivery in Sunyani",
      desc: "Skip long queues between lectures. Order ahead from Catholic University (Fiapre Annex) or Sunyani Main branch and pick up hot meals ready in minutes.",
      img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
      tag: "Order Ahead"
    },
    {
      title: "Earn Loyalty Points With Every Delicious Order",
      desc: "Collect points with every meal you enjoy. Reach 50 points for a completely free plate and get special birthday treats and campus promo discounts.",
      img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
      tag: "Lady 3D Rewards"
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
          <img src={curr.img} alt="Featured dish" className="onboarding-hero-img" />
          <span className="onboarding-tag-floating">{curr.tag}</span>
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
              <button className="btn-secondary-ghost" onClick={onStart}>
                Skip
              </button>
              <button className="btn-primary-pill" onClick={() => setSlide(slide + 1)}>
                Next <span>→</span>
              </button>
            </div>
          ) : (
            <button className="btn-primary-pill full-width" onClick={onStart}>
              Get Started <span>→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// 2. Modern Home Page (SnapEats Screen 2 + Arby's + Bon Appétit)
export function Home() {
  const { menu, branch, setBranch, orderType, setOrderType, applyPromo, setActiveFood, promos, user } = useApp()
  const [activeCat, setActiveCat] = useState('All')
  const [searchVal, setSearchVal] = useState('')

  const activeBranch = BRANCHES.find(b => b.id === branch) || BRANCHES[0]

  // Filter menu
  const filteredDishes = menu.filter(m => {
    const matchCat = activeCat === 'All' || m.cat === activeCat
    const matchSearch = m.name.toLowerCase().includes(searchVal.toLowerCase()) || m.desc.toLowerCase().includes(searchVal.toLowerCase())
    return matchCat && matchSearch
  })

  const popularPicks = menu.slice(0, 4)
  const mealOfTheDay = menu.find(m => m.tag === 'Meal of the Day') || menu[1]

  return (
    <div className="home-modern-view">
      {/* Top Location & Delivery Bar */}
      <section className="home-top-bar">
        <div className="location-info-block">
          <span className="delivery-to-label">Deliver to</span>
          <div className="location-dropdown-row">
            <span className="loc-pin-icon">📍</span>
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
            🛵 Delivery
          </button>
          <button
            className={`toggle-option ${orderType === 'pickup' ? 'active' : ''}`}
            onClick={() => setOrderType('pickup')}
          >
            🛍️ Pickup
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
          <span className="search-glass-icon">🔍</span>
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
                  <span>{cat.icon}</span>
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

        <div className="dishes-grid-cards">
          {(searchVal ? filteredDishes : popularPicks).map(dish => (
            <DishCard key={dish.id} it={dish} />
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
            <div className="motd-pill-badge">🔥 TODAY'S SPECIAL</div>
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
          <span>👑</span>
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
  const [onlyAvail, setOnlyAvail] = useState(false)
  const [maxPrice, setMaxPrice] = useState(100)

  const list = menu.filter(m => {
    const matchCat = cat === 'All' || m.cat === cat
    const matchSearch = m.name.toLowerCase().includes(q.toLowerCase()) || m.desc.toLowerCase().includes(q.toLowerCase())
    const matchAvail = !onlyAvail || ok(m)
    const matchPrice = m.price <= maxPrice
    return matchCat && matchSearch && matchAvail && matchPrice
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
          <span className="search-glass-icon">🔍</span>
          <input
            placeholder="Search waakye, jollof, banku, tilapia..."
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search meals"
          />
          {q && <button className="search-clear-btn" onClick={() => setQ('')}>✕</button>}
        </div>

        <div className="menu-filter-controls">
          <label className="toggle-checkbox-label">
            <input
              type="checkbox"
              checked={onlyAvail}
              onChange={e => setOnlyAvail(e.target.checked)}
            />
            <span>Available at this branch</span>
          </label>
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
          <span className="empty-icon">🍲</span>
          <h3>No dishes found</h3>
          <p>Try resetting the category filter or searching for another dish.</p>
          <button className="btn-reset-filters" onClick={() => { setCat('All'); setQ(''); setMaxPrice(100); setOnlyAvail(false) }}>
            Reset Filters
          </button>
        </div>
      )}
    </div>
  )
}

// 4. Food Detail Page
export function FoodPage({ id }) {
  const { menu, price, ok, add, branch, favs, toggleFav } = useApp()
  const it = menu.find(m => m.id === +id)
  const [qty, setQty] = useState(1)

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
  const itemPrice = price(it)

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
          <p className="detail-meal-price">{money(itemPrice)}</p>
          <p className="detail-desc-text">{it.desc}</p>

          <div className="detail-specs-box">
            <div className="spec-tile">
              <span className="spec-tile-icon">⏱️</span>
              <div>
                <b>{it.prepTime || '15 min'}</b>
                <small>Average Prep</small>
              </div>
            </div>
            <div className="spec-tile">
              <span className="spec-tile-icon">📍</span>
              <div>
                <b>{BRANCHES.find(b => b.id === branch)?.short || 'Campus'}</b>
                <small>Branch</small>
              </div>
            </div>
            <div className="spec-tile">
              <span className="spec-tile-icon">✨</span>
              <div>
                <b>100% Fresh</b>
                <small>Cooked Daily</small>
              </div>
            </div>
          </div>

          {!isAvail && (
            <div className="modal-alert-box">
              ⚠️ Not available today at this branch. Please choose another meal or switch branch.
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
              onClick={() => add(it.id, qty)}
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

// 5. Modern Cart / Order Page (SnapEats Screen 3)
export function Cart() {
  const { lines, setQty, subtotal, discount, deliveryFee, total, price, ok, count, promoCode, promoError, applyPromo, removePromo, orderType, setOrderType } = useApp()
  const [promoInput, setPromoInput] = useState('')

  if (!count) {
    return (
      <div className="cart-empty-screen">
        <div className="empty-cart-illu">🛍️</div>
        <h2>Your basket is empty</h2>
        <p>Looks like you haven’t added any delicious meals to your basket yet.</p>
        <Link to="/menu" className="btn-primary-pill">
          Browse Menu Now
        </Link>
      </div>
    )
  }

  return (
    <div className="cart-modern-screen">
      <div className="cart-header-row">
        <Link to="/menu" className="cart-back-btn">← Menu</Link>
        <h1 className="cart-main-title">Order Basket</h1>
        <span className="cart-badge-count">{count} {count === 1 ? 'item' : 'items'}</span>
      </div>

      {/* Delivery / Pickup selector */}
      <div className="cart-mode-selector">
        <button
          className={`cart-mode-btn ${orderType === 'delivery' ? 'active' : ''}`}
          onClick={() => setOrderType('delivery')}
        >
          🛵 Campus Delivery
        </button>
        <button
          className={`cart-mode-btn ${orderType === 'pickup' ? 'active' : ''}`}
          onClick={() => setOrderType('pickup')}
        >
          🛍️ Counter Pickup
        </button>
      </div>

      {/* Items list */}
      <div className="cart-items-list">
        {lines.map(line => {
          const isLineAvail = ok(line.it)
          return (
            <div key={line.id} className={`cart-item-card ${isLineAvail ? '' : 'line-warn'}`}>
              <div className="cart-item-photo">
                <Food item={line.it} />
              </div>

              <div className="cart-item-info">
                <h3 className="cart-item-name">{line.it.name}</h3>
                <span className="cart-item-unit-price">{money(price(line.it))} each</span>
                {!isLineAvail && (
                  <span className="cart-item-warn-tag">⚠️ Unavailable at selected branch</span>
                )}
              </div>

              <div className="cart-item-stepper">
                <button onClick={() => setQty(line.id, line.qty - 1)} aria-label="Decrease">−</button>
                <span>{line.qty}</span>
                <button onClick={() => setQty(line.id, line.qty + 1)} aria-label="Increase">+</button>
              </div>

              <div className="cart-item-price-col">
                <strong className="cart-line-total">{money(price(line.it) * line.qty)}</strong>
                <button
                  className="cart-item-trash"
                  onClick={() => setQty(line.id, 0)}
                  aria-label="Remove item"
                >
                  🗑️
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Promo Code Input Box (SnapEats style) */}
      <div className="promo-voucher-box">
        <label className="promo-label">Promocode / Voucher</label>
        <div className="promo-input-row">
          <input
            type="text"
            placeholder="e.g. WELCOME20 or STUDENT10"
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
            <button key={code} className="promo-chip-quick" onClick={() => applyPromo(code)}>
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Order Pricing Summary */}
      <div className="cart-totals-card">
        <div className="totals-row">
          <span>Subtotal</span>
          <span>{money(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="totals-row discount-row">
            <span>Promocode Discount ({promoCode})</span>
            <span>-{money(discount)}</span>
          </div>
        )}
        <div className="totals-row">
          <span>{orderType === 'delivery' ? 'Delivery Fee' : 'Pickup Service'}</span>
          <span>{deliveryFee > 0 ? money(deliveryFee) : 'FREE'}</span>
        </div>
        <hr className="totals-divider" />
        <div className="totals-row total-highlight">
          <b>Total</b>
          <b className="total-num">{money(total)}</b>
        </div>
      </div>

      <Link to="/checkout" className="btn-order-cta">
        Proceed to Order · {money(total)} <span>→</span>
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
    address: 'Hall 3, Room 14, Catholic University Fiapre'
  })
  const [step, setStep] = useState(1)
  const [err, setErr] = useState('')

  const bad = lines.filter(l => branch && !ok(l.it))

  if (!lines.length) {
    return (
      <div className="cart-empty-screen">
        <h2>No items to checkout</h2>
        <Link to="/menu" className="btn-primary-pill">Browse Menu</Link>
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
    go('/track/' + ref)
  }

  return (
    <div className="checkout-modern-screen">
      <div className="checkout-header-step">
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
            <div className="form-group-section">
              <label className="field-group-title">Branch & Delivery Mode</label>
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
                  🛍️ Counter Pickup
                </button>
              </div>
            </div>

            <div className="form-group-section">
              <label className="field-group-title">Contact Information</label>
              <label className="input-field-wrap">
                <span>Full Name</span>
                <input
                  value={f.name}
                  onChange={e => setF({ ...f, name: e.target.value })}
                  placeholder="e.g. Kofi Annan"
                />
              </label>

              <label className="input-field-wrap">
                <span>Phone Number (for SMS & Rider WhatsApp)</span>
                <input
                  type="tel"
                  value={f.phone}
                  onChange={e => setF({ ...f, phone: e.target.value })}
                  placeholder="0241234567"
                />
              </label>

              {orderType === 'delivery' && (
                <label className="input-field-wrap">
                  <span>Delivery Address / Hostel & Room</span>
                  <input
                    value={f.address}
                    onChange={e => setF({ ...f, address: e.target.value })}
                    placeholder="Hostel name, Block & Room number"
                  />
                </label>
              )}
            </div>

            <div className="form-group-section">
              <label className="field-group-title">Payment Method</label>
              <div className="payment-options-grid">
                <label className={`payment-card-opt ${f.pay === 'momo' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="pay"
                    checked={f.pay === 'momo'}
                    onChange={() => setF({ ...f, pay: 'momo' })}
                  />
                  <div className="payment-opt-info">
                    <b>📱 Mobile Money (MTN / Telecel)</b>
                    <small>Prompt sent to phone on dispatch</small>
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
                    <b>💵 Pay on Collection / Delivery</b>
                    <small>Pay with cash or MoMo at counter</small>
                  </div>
                </label>
              </div>
            </div>

            {bad.length > 0 && (
              <div className="checkout-alert-box">
                {bad.map(l => (
                  <p key={l.id}>
                    ⚠️ <b>{l.it.name}</b> is not available at {BRANCHES.find(b => b.id === branch)?.short}.
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
            <h3 className="review-heading">Order Summary</h3>

            <div className="review-items-box">
              {lines.map(l => (
                <div key={l.id} className="review-item-row">
                  <span>{l.qty} × {l.it.name}</span>
                  <b>{money(price(l.it) * l.qty)}</b>
                </div>
              ))}
            </div>

            <div className="review-breakdown-box">
              <div className="review-row">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="review-row discount-text">
                  <span>Discount</span>
                  <span>-{money(discount)}</span>
                </div>
              )}
              <div className="review-row">
                <span>{orderType === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                <span>{deliveryFee > 0 ? money(deliveryFee) : 'FREE'}</span>
              </div>
              <hr />
              <div className="review-row total-row">
                <b>Total Amount</b>
                <b className="total-highlight-val">{money(total)}</b>
              </div>
            </div>

            <div className="review-delivery-note">
              <p><b>📍 Branch:</b> {BRANCHES.find(b => b.id === branch)?.name}</p>
              <p><b>👤 Contact:</b> {f.name} ({f.phone})</p>
              <p><b>💳 Payment:</b> {f.pay === 'momo' ? 'Mobile Money (Prompt on Phone)' : 'Pay on Delivery / Counter'}</p>
              {orderType === 'delivery' && <p><b>🏠 Address:</b> {f.address}</p>}
            </div>

            <div className="review-action-btns">
              <button className="btn-back-step" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button className="btn-order-cta grow" onClick={submit}>
                Confirm & Place Order ✨
              </button>
            </div>
          </div>
        )}
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
                    <span>{step.icon}</span>
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
              <span>📍 {BRANCHES.find(b => b.id === order.branch)?.name || 'CUG Annex'}</span>
              <span>🛵 {order.orderType === 'delivery' ? 'Campus Delivery' : 'Self Pickup'}</span>
            </div>
          </div>

          <div className="track-admin-quickhint">
            <span>💡 Testing Tip: Open the <b>Admin Dashboard</b> to advance this order's status and see live updates.</span>
          </div>
        </div>
      )}
    </div>
  )
}

// 8. Modern Account / Profile Screen (Bon Appétit Screen 5)
export function Account() {
  const { user, setUser, orders, favs, menu, points, say } = useApp()
  const [tab, setTab] = useState('orders')
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: 'Julie Martin', email: 'julie.martin@cug.edu.gh' })

  if (!user) {
    return (
      <div className="account-auth-card">
        <div className="auth-brand-badge">
          <img src="/lady3d-logo.jpg" alt="Lady 3D" />
        </div>
        <h1>{mode === 'login' ? 'Welcome Back!' : 'Create Account'}</h1>
        <p className="auth-sub">Sign in to track orders, save favorites and earn rewards.</p>

        {mode === 'reg' && (
          <label className="input-field-wrap">
            <span>Full Name</span>
            <input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          </label>
        )}

        <label className="input-field-wrap">
          <span>Campus or Personal Email</span>
          <input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
        </label>

        <label className="input-field-wrap">
          <span>Password</span>
          <input type="password" defaultValue="••••••••" />
        </label>

        <button
          className="btn-order-cta"
          onClick={() => {
            if (!f.email) return say('Please enter your email')
            setUser({ name: f.name || f.email.split('@')[0], email: f.email })
          }}
        >
          {mode === 'login' ? 'Sign In →' : 'Register Account →'}
        </button>

        <button className="btn-auth-switch" onClick={() => setMode(mode === 'login' ? 'reg' : 'login')}>
          {mode === 'login' ? 'New student or customer? Create account' : 'Already have an account? Sign In'}
        </button>
      </div>
    )
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
          <span className="profile-tag-badge">Lady 3D Food Club VIP</span>
        </div>
        <button className="btn-logout" onClick={() => setUser(null)} title="Sign out">
          Sign out
        </button>
      </div>

      {/* Rewards Progress Card */}
      <div className="rewards-dashboard-card">
        <div className="rewards-card-header">
          <div>
            <span className="rewards-sublabel">LOYALTY BALANCE</span>
            <h3 className="rewards-points-count">{points} <span>Points</span></h3>
          </div>
          <div className="rewards-icon-gold">🏆</div>
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

// 9. Community & Reviews Screen
export function Community() {
  const { votes, setVotes, voted, setVoted, reviews, setReviews, say } = useApp()
  const [r, setR] = useState({ who: '', stars: 5, text: '' })
  const tot = Object.values(votes).reduce((a, b) => a + b, 0)

  return (
    <div className="community-modern-page">
      <div className="community-header">
        <span className="eyebrow-accent">CAMPUS & COMMUNITY</span>
        <h1>Lady 3D’s Food Club</h1>
        <p className="community-sub">Vote for weekly special dishes, read real reviews, and stay connected.</p>
      </div>

      <div className="community-two-col">
        {/* Student Choice Poll */}
        <div className="card-box-modern">
          <h2>🗳️ Weekly Student Choice</h2>
          <p className="card-box-sub">Vote for the special meal our chefs should cook next Tuesday!</p>
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
                    say('Your vote has been counted!')
                  }}
                >
                  <div className="poll-bar-fill" style={{ width: `${pct}%` }} />
                  <span className="poll-name">{n}</span>
                  <b className="poll-pct">{pct}% ({v})</b>
                </button>
              )
            })}
          </div>
        </div>

        {/* WhatsApp & Direct Inquiries */}
        <div className="card-box-modern">
          <h2>💬 Catering & Group Orders</h2>
          <p className="card-box-sub">Planning an event, campus seminar or birthday party?</p>
          <div className="catering-contact-card">
            <p>We provide full catering packages with warm chafing dishes, servers and custom menus.</p>
            <a
              href="https://wa.me/233000000000?text=Hello%20Lady%203D's%20Catering%20Services,%20I'd%20like%20to%20inquire%20about%20catering"
              target="_blank"
              rel="noreferrer"
              className="btn-whatsapp"
            >
              Order via WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="reviews-section-card mt-3">
        <h2>Customer Reviews & Feedback</h2>
        <div className="reviews-list-grid">
          {reviews.filter(x => x.show).map(rev => (
            <div key={rev.id} className="review-quote-card">
              <div className="review-quote-header">
                <Stars n={rev.stars} />
                <span className="review-time">{rev.time || 'Recent'}</span>
              </div>
              <p className="review-text">“{rev.text}”</p>
              <b className="review-author">— {rev.who}</b>
            </div>
          ))}
        </div>

        <div className="review-form-box">
          <h3>Leave a Review</h3>
          <div className="review-inputs-row">
            <input
              placeholder="Your name or nickname"
              value={r.who}
              onChange={e => setR({ ...r, who: e.target.value })}
            />
            <select
              value={r.stars}
              onChange={e => setR({ ...r, stars: +e.target.value })}
            >
              <option value="5">★★★★★ (5 Stars)</option>
              <option value="4">★★★★☆ (4 Stars)</option>
              <option value="3">★★★☆☆ (3 Stars)</option>
            </select>
          </div>
          <textarea
            placeholder="How was your meal? Tell us about the taste, portion and service..."
            value={r.text}
            onChange={e => setR({ ...r, text: e.target.value })}
          />
          <button
            className="btn-primary-pill"
            onClick={() => {
              if (!r.text) return say('Please type a brief review')
              setReviews([
                ...reviews,
                { id: Date.now(), who: r.who || 'Student Customer', stars: r.stars, text: r.text, show: true, time: 'Just now' }
              ])
              setR({ who: '', stars: 5, text: '' })
              say('Thanks for sharing your review! ✨')
            }}
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  )
}
