# Lady 3D’s Catering Services Platform

Official enterprise web application, kitchen management portal, delivery operations hub, and branch consoles for **Lady 3D’s Catering Services** in Sunyani, Ghana.

- **Catholic University of Ghana Annex (Fiapre Campus)**: Student & faculty packs, campus hall delivery, and quick takeaway.
- **Sunyani Main Branch (Market Circle)**: Full local & continental dishes, counter POS, and town catering.

---

## 🏗️ Architecture & Core Operational Rules

The platform follows a modular, feature-driven architecture backed by MongoDB with 4 interconnected role-specific interfaces:

### 1. The 4 Interconnected Interfaces
1. **Customer Platform (`/#/`)**:
   - Menu browsing, meal customization with extras.
   - Separate **Collection** vs. **Delivery** checkout.
   - Traceable **Guest Checkout** and registered customer profiles.
   - Live 3-pillar order tracking (`/#/track/:ref`).
   - Claim past guest orders after creating an account.
2. **Kitchen & Staff Portal (`/#/kitchen`)**:
   - Live order display with dual-tone Web Audio chimes for new confirmed orders.
   - Auto-advance orders: *Confirmed* → *Cooking/Preparing* → *Ready for Collection / Ready for Dispatch*.
   - **Live Daily Stock & Portions Management**: view Prepared, Reserved, Sold, and Remaining portions; update cooked amounts or mark sold out on the fly.
3. **Delivery Operations Hub (`/#/delivery`)**:
   - Rider dispatching and self-assignment.
   - Delivery zone and fee configuration.
   - Status tracking (*Awaiting Assignment* → *Picked Up* → *In Transit* → *Delivered* / *Failed Delivery* with issue reports).
4. **Management Dashboard (`/#/admin` & `/#/branch/:branch`)**:
   - Cross-branch access for Central Administrator (Owner).
   - Scoped branch access for Branch Managers.
   - Staff roles, capacity limits, emergency order pausing, sales analytics, and audit history.

---

### 2. The 3 Independent State Machines

Order status, payment status, and delivery status are strictly segregated:

| State Machine | Status Values |
| :--- | :--- |
| **Order Status** | `pending_payment` · `confirmed` · `preparing` · `ready_for_collection` · `ready_for_dispatch` · `out_for_delivery` · `collected` · `delivered` · `cancelled` · `rejected` |
| **Payment Status** | `unpaid` · `pending` · `paid` · `failed` · `refunded` · `partially_refunded` |
| **Delivery Status** | `not_applicable` · `awaiting_assignment` · `assigned` · `awaiting_pickup` · `picked_up` · `in_transit` · `delivered` · `failed_delivery` · `returned` |

---

### 3. Critical Backend Rules Implemented

- **Atomic Stock Reservation**: Checkout checks remaining portions (`prepared - reserved - sold >= requested_qty`) and atomically increments `quantityReserved`. If any portion runs out, previously reserved items rollback and the customer is informed before an unfulfillable order can be accepted.
- **Automatic Order Acceptance**: Valid orders are confirmed immediately when branch is open, capacity is under limit, delivery zone requirements are met, and stock is reserved. Confirmed orders appear automatically in the kitchen queue.
- **Guest Tracing & Account Claiming**: Guests receive an order reference and tracking link. Registered customers can claim previous orders placed with their verified phone number.
- **Separation of Fulfilment**: Delivery has its own zones, delivery fees, minimum order thresholds, and rider assignment workflows independent of pickup.

---

## 📁 Modular Directory Structure

```text
lady-3ds-platform/
│
├── public/
│   ├── images/
│   ├── icons/
│   └── manifest.json
│
├── src/
│   ├── app/
│   │   ├── routes/
│   │   ├── providers/
│   │   └── layouts/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── forms/
│   │   ├── food/
│   │   ├── orders/
│   │   └── navigation/
│   │
│   ├── features/
│   │   ├── authentication/
│   │   ├── branches/
│   │   ├── menu/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── delivery/
│   │   ├── inventory/
│   │   ├── loyalty/
│   │   ├── promotions/
│   │   ├── reviews/
│   │   ├── customers/
│   │   ├── staff/
│   │   └── analytics/
│   │
│   ├── pages/
│   │   ├── customer/
│   │   ├── admin/
│   │   ├── manager/
│   │   ├── kitchen/
│   │   └── delivery/
│   │
│   ├── services/
│   │   ├── api/
│   │   ├── payments/
│   │   └── notifications/
│   │
│   ├── hooks/
│   ├── utils/
│   ├── styles/
│   └── main.jsx
│
├── server/
│   ├── auth.js
│   ├── index.js
│   ├── models.js
│   └── seed.js
│
└── README.md
```

---

## 🛠️ Local Development & Seeding

On Windows, open PowerShell in the project folder:

```bash
npm install
Copy-Item .env.example .env
# Edit .env and set MONGODB_URI, JWT_SECRET (32+ characters),
# SEED_OWNER_EMAIL, and SEED_OWNER_PASSWORD (8+ characters).
npm run seed
```

Keep the API and website running in separate PowerShell windows:

```bash
# Terminal 1
npm run server:dev
```

```bash
# Terminal 2
npm run dev
```

Open `http://localhost:5173/#/staff-login` and sign in using the owner email and password you put in `.env`. Optional demo staff accounts can be created with `SEED_DEMO_STAFF=true` only when `NODE_ENV=development` is explicitly set; an unset `NODE_ENV` is treated as non-local, and demo accounts are purged. Initial passwords for staff accounts must be set securely via `.env` or the Admin Staff Management console.

Paystack checkout stays hidden until `.env` has `PAYSTACK_SECRET_KEY` and real, reachable `API_PUBLIC_URL` and `FRONTEND_PUBLIC_URL` values. Use your Paystack test secret key during development. Set the Paystack webhook URL to `<API_PUBLIC_URL>/api/payments/paystack/webhook`; the browser return URL is registered by the server as `<API_PUBLIC_URL>/api/payments/paystack/return`.

## Production Deployment (Vercel frontend + API)

This repository's Vercel configuration serves the React app and does not deploy the Express API. Deploy `server/index.js` to a Node.js host and configure these values in that API host:

- `MONGODB_URI` and `JWT_SECRET`
- `FRONTEND_ORIGIN=https://lady3d.vercel.app`
- `API_PUBLIC_URL` as the API host's public HTTPS URL
- `FRONTEND_PUBLIC_URL=https://lady3d.vercel.app`
- `PAYSTACK_SECRET_KEY` when Paystack is enabled

In the Vercel project's Production environment, set `VITE_API_URL` to the API host's public origin (for example, `https://api.yourdomain.com`) and redeploy. `VITE_API_URL` is embedded in the frontend build; a local `.env` change does not update the deployed site. Do not put `PAYSTACK_SECRET_KEY` in Vercel's frontend build variables.
