# Veil — market launch checklist

Use this before announcing Veil publicly or onboarding paying customers.

## Product

- [ ] `npm test` passes (62+ tests)
- [ ] `npm run package` → load `extension/dist` in Chrome + Edge
- [ ] Team join → copilot on → paste API key in Outlook/Gmail → Encrypt / Tokenize
- [ ] Token round-trip: Outlook compose → send → Gmail read → click reveal
- [ ] Re-lock banner dismisses on buttons and outside click
- [ ] Managed policy deploy (see `extension/docs/ENTERPRISE.md`) tested on one device

## Portal & web

- [ ] Landing: `index.html` (or hosted portal root)
- [ ] Create / join / admin / install / privacy / terms pages live
- [ ] `npm run env:apply` syncs portal to `api/public`
- [ ] API serves portal pages (`/`, `/join.html`, etc.)
- [ ] Invite email template on team creation success screen

## Extension distribution

- [ ] Chrome Web Store listing submitted (see `docs/STORE_SUBMIT.md`, run `npm run package:store`)
- [ ] Edge Add-ons listing submitted
- [ ] Enterprise `.crx` or policy install path documented for IT
- [ ] Version number bumped in `extension/manifest.json`

## Legal & trust

- [ ] Privacy policy published (`privacy.html`)
- [ ] Terms published (`terms.html`)
- [ ] Brand assets consistent (`docs/BRAND.md`, extension icons, portal favicon)
- [ ] Threat model reviewed (`extension/docs/THREAT_MODEL.md`)
- [ ] Support email monitored: support@goldspireventures.com

## Operations

- [ ] `npm test` passes (100 tests)
- [ ] Production API healthy (`/health` returns `db: ok`)
- [ ] `npm run db:migrate` applied on production (through `010_ops_hardening.sql`)
- [ ] Platform ops dashboard: `https://veil-api.goldspireventures.com/ops.html`
- [ ] `PLATFORM_OPS_TOKEN` and `OPS_CLIENT_INGEST_KEY` set on Railway (+ local `.env` for extension builds)
- [ ] Optional: `OPS_ALERT_WEBHOOK_URL` for Slack/Discord alerts
- [ ] Database backups configured (Supabase)
- [x] User feedback path (popup, portal, context menu)
- [x] In-house uptime + synthetic portal checks (no UptimeRobot required)
- [ ] Incident contact documented (`docs/OPS.md`)
- [ ] Stripe: `npm run stripe:setup` → payment link in `.env` → `npm run env:apply`
- [ ] Stripe webhook → `https://veil-api.goldspireventures.com/v1/webhooks/stripe` + `STRIPE_WEBHOOK_SECRET` on Railway
- [ ] Portal deployed (`join-veil`) with `EARLY_ACCESS` + payment link in `portal/config.js`
- [ ] Early access end date set: `VEIL_EARLY_ACCESS_END` in Pages env (see [BILLING.md](BILLING.md))
- [ ] Admin billing UI tested with early access on and off

## Customer success

- [ ] [docs/README.md](README.md) — doc index for support triage
- [ ] [docs/GETTING_STARTED.md](GETTING_STARTED.md) — which guide to read
- [ ] [docs/ADMIN_GUIDE.md](ADMIN_GUIDE.md) — IT self-serve (tabs, pack library, sub-teams)
- [ ] [docs/MEMBER_GUIDE.md](MEMBER_GUIDE.md) — end users
- [ ] [docs/PERSONAL_GUIDE.md](PERSONAL_GUIDE.md) — personal profile
- [ ] [docs/MANUAL_TEST.md](MANUAL_TEST.md) — QA / pilot validation
- [ ] Install page links to admin guide on GitHub
- [ ] First pilot onboarding call scheduled

## Post-launch (30 days)

- [ ] Collect pilot feedback on Outlook/Gmail edge cases
- [ ] Chrome + Edge store reviews responded to
- [ ] Copilot / tokenize analytics from security events (metadata only)
