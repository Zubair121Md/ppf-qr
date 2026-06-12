# FarmScan

Farm packing system with QR scanning, multi-language audio feedback, and admin order distribution. Built with Next.js 14, Tailwind CSS, Supabase, and deployed on Vercel.

## Folder Structure

```
/app
  /admin          Admin dashboard, orders, products, workers, QC
  /worker         Worker login, orders list, packing flow, QR scanner
  /p/[productId]  Public product page (QR scan target)
  /api            REST API routes (auth, orders, products, workers, QC)
/components
  /admin          OrderImport, DistributionTable, QCErrorForm, WorkerCard, LiveDashboard
  /worker         FeedbackAlert, OrderCard, PackingChecklist, QRScanner, ProductConfirm
  /shared         LanguageAudio
/lib
  db.js           Supabase clients (anon + service role)
  auth.js         JWT + bcrypt helpers
  distribute.js   LPT bin-packing order distribution
  speech.js       Web Speech API (Tamil, Malayalam, Hindi, English)
  constants.js    Error codes, thresholds, language list
/supabase
  schema.sql      PostgreSQL schema
  seed.js         Worker accounts + sample products
/public
  manifest.json   PWA manifest
```

## Quick Start

### 1. Environment Variables

Copy `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret) |
| `JWT_SECRET` | Random 32+ character string |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |

### 2. Database Setup

1. Create a [Supabase](https://supabase.com) project
2. Open SQL Editor → paste contents of `supabase/schema.sql` → Run
3. Seed data: `npm run seed`

### 3. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Logins (after seed)

| Username | Password | Role |
|----------|----------|------|
| l1 – l10 | farmscan123 | Worker |
| admin | admin123 | Admin |

## Deployment (Vercel + Supabase)

1. Push to GitHub
2. [vercel.com](https://vercel.com) → New Project → import repo
3. Add all environment variables in Vercel dashboard
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g. `https://farmscan.vercel.app`)
5. Run `supabase/schema.sql` in Supabase SQL Editor
6. Run `npm run seed` locally (with production env vars) or seed via Supabase dashboard
7. Deploy

## Key Features

- **QR Product IDs** — Permanent IDs like `STR-001` encode `https://your-app.vercel.app/p/STR-001`
- **Worker packing flow** — Tap item → audio in worker's language → scan crate QR → confirm
- **Order distribution** — LPT bin-packing assigns orders across 10 workers by weight
- **QC feedback** — Admin logs errors; workers see full-screen alerts on next login
- **4 languages** — Tamil, Malayalam, Hindi, English (UI + TTS audio)
