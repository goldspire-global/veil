# Veil brand guide

## Name

**Veil** — product name  
**Veil by Goldspire** — full name in store listings and legal pages

## Colors

| Token | Hex | Use |
|-------|-----|-----|
| Navy | `#0d111b` | Backgrounds, extension icon base |
| Gold (start) | `#d4a017` | Logo gradient, accents |
| Gold (end) | `#f0c14b` | Logo gradient, hover |
| Blue accent | `#3b82f6` | Token UI, copilot highlights |
| Muted text | `#a8b0c2` | Secondary copy |

## Logo assets

| File | Use |
|------|-----|
| `extension/icons/icon-{16,48,128}.png` | Browser toolbar, store listing, manifest |
| `brand/veil-mark.svg` | Portal header, favicon source |
| `portal/veil-mark.svg` | Copied for static hosting |

## Usage

- **Extension popup** — use `icons/icon-48.png`, not emoji
- **Portal** — `veil-mark.svg` + wordmark “Veil” / “by Goldspire”
- **Store** — upload `icon-128.png` as primary; 1280×800 screenshots use same palette
- **Do not** stretch the icon; keep square with rounded corners as designed

## Canonical URLs

| Service | URL |
|---------|-----|
| Organization portal | `https://veil.goldspireventures.com` |
| Org API | `https://veil-api.goldspireventures.com` |
| Public unlock page | `https://goldspire-global.github.io/veil/unlock.html` |
| GitHub repo | `https://github.com/goldspire-global/veil` |
| Stripe webhook | `https://veil-api.goldspireventures.com/v1/webhooks/stripe` |

Local dev join path: `http://localhost:3015/join.html`

On production, marketing pages on `veil-api.goldspireventures.com` redirect to the portal. Legacy portal hostnames 301 to `https://veil.goldspireventures.com` via the Cloudflare worker.

User-facing name is always **Veil** or **Veil by Goldspire**. Goldspire is the vendor, not the product.

## Regenerating icons

After updating `brand/veil-mark.svg` or source art:

```bash
# Replace extension/icons/icon-128.png, then:
powershell -Command "Add-Type -AssemblyName System.Drawing; ..."
npm run package
npm run package:store
```

Or replace PNGs manually and run `npm run package`.
