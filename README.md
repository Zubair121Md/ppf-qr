# Purple Patch Farms (PPF) Packing

Farm packing system with QR scanning, multi-language audio feedback, and admin order distribution. Built with Next.js 14, Tailwind CSS, Supabase, deployed on Vercel.

**Live:** [https://ppf-qr.vercel.app](https://ppf-qr.vercel.app)

## Logins (after seed)

| Role | Username | Password |
|------|----------|----------|
| Manager | `manager` | `manager123` |
| Admin | `admin` | `admin123` |
| Workers | `l1` – `l10` | `farmscan123` |

> **Manager / Admin** use the panel at `/admin` — assign orders, manage workers, unpack completed orders.  
> **Workers** log in at `/worker/login` to pack assigned orders.

## Manual order assignment

On **Admin → Orders**, use the **Worker** dropdown on any non-complete order to assign or reassign a packer. Choose **Unassigned** to return an order to the pool.

## Security

Generate a strong JWT secret:

```bash
openssl rand -base64 32
```

Copy `.env.example` to `.env.local` and fill in values. See `SECURITY_CHECKLIST.md` for pre-release verification.

After updating `schema.sql`, run the security section in Supabase SQL Editor (`revoked_tokens`, `audit_log` tables).

## GitHub CodeQL

The `code-security` job runs on every push under **Actions → Security Checks**. This repo is **private**, so the **Security → Code scanning** tab needs [GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security) (paid for private repos). The workflow uses `upload: false` so CI passes; scan output is in the Actions job log.

## Environment Variables (Vercel — all 5 required)

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key |
| `JWT_SECRET` | `openssl rand -base64 32` (min 32 chars) |
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
