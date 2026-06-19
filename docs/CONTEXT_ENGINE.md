# Detection rules (internal)

How Veil decides **what** a string might be, and **whether** to prompt — stated plainly.

## What this is

A **fixed rule pipeline** shipped with the extension:

1. Regex detectors (`lib-bundle.js`, detector modules) — pattern match only
2. **Product rules** (`intent-config.js`) — host/path intent, field-label semantics, gating thresholds
3. Runtime DOM signals — labels, `autocomplete`, form presence (inputs to the rules above)
4. **Org DLP** (`organizations.settings.dlp`) — warn/block **after** a detection is accepted; does not change detectors

There is **no machine learning**, no hidden model, and no org-editable detection rules today.

## Single source of truth for product rules

**`extension/src/detection/intent-config.js`** — edit here for:

| Section | Purpose | Customer configurable? |
|---------|---------|------------------------|
| `mailHostPattern`, `formPathPattern`, … | Where compose vs form vs admin | No — product-locked |
| `fieldSemantics[]` | Label/autocomplete → suppress/prefer categories | No — product-locked |
| `disambiguation` | PPS shape, IBAN prefix, confidence bypass | No — product-locked |
| `gating` | Which categories can interrupt copilot | No — product-locked |
| `piiLabelPattern`, `piiAutocomplete` | Form expects PII | No — product-locked |

**`field-semantics.js`** and **`gating.js`** only **read** `intent-config.js`. They do not define their own rules.

**`context-resolve.js`** applies field semantics + structural rules from config — not a separate “engine”.

## Pipeline

```
DOM target
  → observe/context.js (field hints, intent)
  → field-semantics.js (compiles intent-config.fieldSemantics)
  → engine.analyze() (regex detectors — lib-bundle.js)
  → context-resolve.js (suppress/prefer per config)
  → gating.js (copilot thresholds per intent-config.gating)
  → policy engine (org pack: warn/block only)
```

## PPS vs IBAN (example)

| Input | Field label | Raw detectors | After rules |
|-------|-------------|---------------|-------------|
| `2193825B` | PPS Number | `national_id`, maybe `iban` | `national_id` — gov-id field + no `IE…` prefix |
| `IE29AIBK93115212345678` | Bank account | `iban` | `iban` |
| `stafford` | First name | `swift_bic` | Suppressed — person_name semantics |

## What customers can configure

| Layer | Configurable via admin? |
|-------|-------------------------|
| Detection patterns | No |
| Field-label disambiguation | No |
| Copilot on/off, secure mode | Extension settings |
| Warn / block / allow per category | Policy packs + DLP JSON |
| SIEM webhook | Org admin |

Do not describe detection as “context-aware AI” in user-facing copy. Say **rules based on field labels and patterns**.

## Extending (developers)

1. **New label behaviour** — add/edit a row in `intent-config.js` → `fieldSemantics`
2. **New detector** — `lib-bundle.js`; add suppress/prefer in `fieldSemantics` if it collides
3. **New enforcement category** — `policy/schema.js` + packs; detection stays separate

## Tests

`tests/detection/` — PPS, IBAN, name-field SWIFT. Run `npm test`.

## Related

- [POLICY_CONFIG.md](POLICY_CONFIG.md) — org warn/block only
- [OPS.md](OPS.md) — support tickets and monitoring
