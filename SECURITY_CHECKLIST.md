# PPF Packing — Security Verification Checklist

Run before every major release.

## 1. Authentication

- [ ] Wrong password 5 times locks the account
- [ ] Lockout message shows minutes remaining
- [ ] Same error for unknown username and wrong password (`Invalid credentials`)
- [ ] Worker token cannot access `/admin` pages
- [ ] Logout revokes token (second use of same cookie fails)
- [ ] Cookie flags: HttpOnly, Secure (production), SameSite=Strict for staff
- [ ] `JWT_SECRET` is at least 32 characters (generate: `openssl rand -base64 32`)

## 2. Authorization (IDOR)

- [ ] Worker `l1` cannot GET `/api/orders/[order_assigned_to_l2]` → 404
- [ ] Worker cannot pack items on another worker's order → 404
- [ ] Worker cannot acknowledge another worker's QC error → 403/404
- [ ] Only manager/admin can assign orders via `/api/orders/[id]/assign`

## 3. Input validation

- [ ] Invalid order ID in URL → 400/404
- [ ] Negative quantity on order create → rejected
- [ ] XSS in customer name sanitized on insert

## 4. Rate limiting

- [ ] 11+ login attempts per minute from same IP → 429
- [ ] 200+ API calls per minute → 429

## 5. Security headers

Check production URL at https://securityheaders.com (target A or A+):

- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security present
- [ ] Content-Security-Policy present
- [ ] No X-Powered-By header

## 6. Secrets

- [ ] `.env.local` is in `.gitignore`
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` or `JWT_SECRET` in client components
- [ ] Run `npm audit` — zero HIGH/CRITICAL vulnerabilities

## 7. Database

Run in Supabase SQL editor (from `supabase/schema.sql` security section):

- [ ] `revoked_tokens` table exists
- [ ] `audit_log` table exists
- [ ] `workers.last_attempt_at` column exists

## 8. Order workflow

- [ ] Manager can assign order to worker from Orders page dropdown
- [ ] Assigned order shows on worker dashboard as **Ready**
- [ ] Opening pack screen without scanning keeps order visible
- [ ] **Unpack** only appears on **Complete** orders
