# veil.goldspireventures.com portal proxy

Cloudflare Worker that proxies `veil.goldspireventures.com` to the Veil Pages project (`veil-81c.pages.dev`).

Legacy hostnames (`join-veil` and other older portal domains) 301 to the canonical portal.

## Deploy

```bash
cd infra/veil-portal-worker
npx wrangler deploy
```

When `veil.goldspireventures.com` is attached directly to the Pages project with DNS active, delete this worker:

```bash
npx wrangler delete veil-portal-alias
```
