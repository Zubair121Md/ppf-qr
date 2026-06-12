# Purple Patch Farms (PPF) Packing

Farm packing system with QR scanning, multi-language audio feedback, and admin order distribution. Built with Next.js 14, Tailwind CSS, Supabase, deployed on Vercel.

**Live:** [https://ppf-qr.vercel.app](https://ppf-qr.vercel.app)

## Logins (after seed)

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Workers | `l1` – `l10` | `farmscan123` |

> **Admin users** are redirected to `/admin` — they do not see worker orders.  
> **Workers** log in at `/worker/login` to see assigned orders.

## Environment Variables (Vercel — all 5 required)

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key |
| `JWT_SECRET` | random 32+ char string |
| `NEXT_PUBLIC_APP_URL` | `https://ppf-qr.vercel.app` |

Verify: `https://ppf-qr.vercel.app/api/health` → `{ "ok": true }`

## Database Setup

1. Run `supabase/schema.sql` in Supabase SQL Editor
2. Seed data:
   ```bash
   npm run seed:demo
   ```
   Run locally with production `.env.local` values to seed the production database.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
