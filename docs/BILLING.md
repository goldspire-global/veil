# Veil billing & early access (internal)

How Team cloud pricing works, how long to run free early access, and how to switch to paid billing **without manual code changes on the end date**.

## List pricing (Team cloud)

| Item | Value |
|------|--------|
| Price | **$84 / user / year** (shown as $7 / user / month, billed annually) |
| Minimum seats | **5** |
| Enterprise | 100+ seats — custom contract; contact sales |
| Personal extension | Free |

Stripe payment link and billing portal URLs live in `.env` → `portal/config.js` via `npm run env:apply`.

## What early access does today

When early access is **on**:

- Create team requires **no card**
- Portal shows green **Early access** banner (create, pricing)
- Admin → **Overview → Billing** says “free, no card on file”
- Optional “Preview Team checkout” link for procurement only

When early access is **off**:

- Banner hidden; Admin billing shows **Subscribe / manage seats** (Stripe payment link)
- Terms/pricing pages still describe list price

**Not enforced yet:** API does not block org usage if unpaid. Switchover is **portal + comms** first; add org-level `billingStatus` enforcement in a later sprint if needed.

## How long should free early access run?

Use a **fixed public end date** plus internal gates. Recommended approach:

| Phase | Suggested duration | Gate |
|--------|-------------------|------|
| **Pilot** | 4–8 weeks after first prod deploy | Chrome **or** Edge store live; ops dashboard green |
| **Open early access** | **90 days** from announced GA date | Admin guide + feedback loop stable; &lt;2 support tickets/week per 10 orgs |
| **Paid GA** | After end date | `VEIL_EARLY_ACCESS_END` passed or `VEIL_EARLY_ACCESS=false` |

**Practical pick for Veil:** set `VEIL_EARLY_ACCESS_END` to **90 days after both store listings are approved**, announced on pricing/Terms at least 30 days ahead.

Avoid ending early access before:

- Store install links work without “search for Veil”
- Admin self-serve path is documented ([ADMIN_GUIDE.md](ADMIN_GUIDE.md))
- Stripe live payment link + webhook tested (`npm run stripe:setup`, `stripe listen`)

## Automating the switchover

### Option A — Automatic by date (recommended)

Set once in `.env` (or Cloudflare Pages / Railway env for build):

```env
VEIL_EARLY_ACCESS=true
VEIL_EARLY_ACCESS_END=2026-12-31
```

Run `npm run env:apply` and deploy the portal **once**. After midnight UTC on that date, `portal/billing.js` treats early access as **off** — banners and Admin billing UI switch to Subscribe **without another deploy**.

The end date is baked into `portal/config.js` as `EARLY_ACCESS_END`; the browser compares `Date.now()` on each page load.

### Option B — Immediate manual off

```env
VEIL_EARLY_ACCESS=false
```

`npm run env:apply` → redeploy Cloudflare Pages (and any env that runs apply-env on build).

### Option C — Future: email + Stripe enforcement

Not built yet. Suggested sequence when you add it:

1. **T−30 days:** email `admin_email` from org table (“billing starts …”)
2. **T−7 days:** reminder + payment link
3. **T+0:** early access off (Option A or B)
4. **T+14:** optional grace; then API returns 402 for new member joins if no `stripe_subscription_id`

## Switchover checklist (ops)

- [ ] Set `VEIL_EARLY_ACCESS_END` (or `VEIL_EARLY_ACCESS=false`) in production env
- [ ] `npm run env:apply` and confirm `api/public/portal/config.js` has correct values
- [ ] Redeploy **join-veil** (Cloudflare Pages)
- [ ] Verify pricing + create banners on/after end date (use browser date override or staging)
- [ ] Verify Admin → Billing shows Subscribe + Stripe link works (test mode first)
- [ ] Update Terms/pricing copy if end date changed
- [ ] Email active org admins (export from `organizations.admin_email`)
- [ ] Monitor support inbox and ops dashboard for 2 weeks

## Environment reference

| Variable | Purpose |
|----------|---------|
| `VEIL_EARLY_ACCESS` | `true` / `false` — master switch |
| `VEIL_EARLY_ACCESS_END` | ISO date `YYYY-MM-DD` — auto-off after this day |
| `STRIPE_PAYMENT_LINK_TEAM` | Checkout for Team seats |
| `STRIPE_BILLING_PORTAL_URL` | Manage subscription |
| `STRIPE_WEBHOOK_SECRET` | Railway API `/v1/webhooks/stripe` |

## Related

- [MARKET_READY.md](MARKET_READY.md) — launch checklist
- [scripts/setup-stripe-veil.mjs](../scripts/setup-stripe-veil.mjs) — create products/links
- [portal/billing.js](../portal/billing.js) — UI logic
