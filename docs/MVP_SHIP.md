# Veil MVP ship checklist

Use this before calling MVP (Sprint 12) complete.

## Extension

- [ ] Reload unpacked extension from `extension/dist` after `npm run package`
- [ ] Popup shows **Veil by Goldspire** branding
- [ ] Feature flags: copilot off by default; DLP off by default
- [ ] Enable copilot → paste test card → Encrypt / Mask / Allow prompt
- [ ] Selection copilot bar on sensitive highlight in compose field
- [ ] ChatGPT / Claude / Gemini / Copilot / Perplexity submit intercept (Sanitize / Block / Continue)
- [ ] Existing Secure Text flows unchanged: highlight → [redacted], unlock, org share
- [ ] `npm test` passes

## Org + API

- [ ] `npm run api:migrate` applies `006_security_events.sql`
- [ ] `npm run api:dev` healthy at `/health`
- [ ] Extension join + org sync works
- [ ] `POST /v1/extension/events` accepts metadata batches (no content)
- [ ] Admin portal **Veil security activity** shows aggregates after events upload

## Security

- [ ] Events never store matched text, passphrases, or payloads
- [ ] DLP enforce blocks / auto-masks per org policy when enabled
- [ ] AI surfaces use sanitize-first (no inline Encrypt in prompts)

## Docs

- [ ] `docs/VEIL_SPRINTS.md` — Sprints 0–12 marked complete
- [ ] Threat model reviewed for new event ingestion surface

## Post-MVP (optional before wider launch)

- Sprints 13–15: extra AI sites, full detectors, compliance tags in UI
- Sprint 16+: secure tokens, SIEM exports, teams
