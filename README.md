# Lady 3D’s Catering Services Web App & Branch Dashboards

Official web application, kitchen management portal, and branch consoles for **Lady 3D’s Catering Services** in Sunyani, Ghana.

- **Catholic University of Ghana Annex (Fiapre Campus)**: Student & faculty packs, campus hall delivery, and quick takeaway.
- **Sunyani Main Branch (Market Circle)**: Full local & continental dishes, counter POS, and town catering.

---

## 🚀 Deploy to Vercel

The customer frontend can be deployed to Vercel. Real ordering and staff operations also require the Express API, MongoDB, and (for Mobile Money) configured Hubtel credentials; these are not hosted by the static Vercel frontend configuration alone.

### Option 1: Via Vercel Web Dashboard (Recommended)
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import this repository.
4. Vercel will automatically detect the settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Configure `VITE_API_URL` to point to a deployed API and configure the server environment variables described in `.env.example`. Without a reachable API, account, ordering, and operations features will not work.

### Option 2: Via Vercel CLI
```bash
# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Deploy directly from the project root
vercel

# 3. Deploy to production
vercel --prod
```

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Test production build
npm run build
npm run preview
```

The API requires Node.js 20.19+, MongoDB, and a local `.env` based on `.env.example`. Run it with `npm run server`. Seed an initial owner only after setting `SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD` in `.env`, then run `npm run seed`. Keep the API and database on trusted infrastructure and use HTTPS in production.

---

## 📍 Key Application Routes

- `/#/`: Customer Ordering Web App (Browse local dishes, add extras, checkout, and live order tracking).
- `/#/menu`: Full browsable menu categorized by branch availability.
- `/#/admin`: Master Admin Dashboard (13 operational tabs with static red & white sidebar, kitchen kanban, staff roster, daily stock, and sales reports).
- `/#/branch/sunyani`: **Sunyani (Main Branch) Console** (Locked exclusively to Sunyani branch operations, counter POS, kitchen queue, and cash drawer).
- `/#/branch/cug`: **Catholic University (Campus Annex) Console** (Locked exclusively to CUG campus operations, campus hall deliveries, and student orders).

---

## 📋 Vercel Configuration Highlights

- `vercel.json`: Handles client-side SPA fallback routes (`/(.*) -> /index.html`) so refreshing on any sub-route never throws a 404.
- `.gitignore`: Prevents committing `node_modules`, `dist`, `.vercel`, and system files.
- `public/manifest.json` & PWA support: Progressive Web App installable on iOS and Android devices.
