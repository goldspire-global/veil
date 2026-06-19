# Veil platform operations (in-house)

Production observability without third-party APM. Metadata only — no secrets, no matched content.

## Dashboard URL

**API host only** (not on the public join portal):

```
https://veil-api.goldspireventures.com/ops.html
```

The join portal (`join-veil…`) returns 404 for `/ops.html` via the Cloudflare worker proxy.

## Environment variables (Railway)

| Variable | Purpose |
|----------|---------|
| `PLATFORM_OPS_TOKEN` | Bearer token for `/v1/ops/summary` and the ops dashboard |
| `OPS_CLIENT_INGEST_KEY` | Shared key for extension telemetry (`X-Ops-Ingest-Key` header) |
| `OPS_ALERT_WEBHOOK_URL` | Optional Slack/Discord/generic webhook for critical alerts |

Generate keys:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

After setting `OPS_CLIENT_INGEST_KEY` on Railway, add the same value to local `.env` and run `npm run env:apply` before packaging the extension.

## What is monitored

| Signal | Source |
|--------|--------|
| API + DB availability % | Health samples every 5 min |
| Portal synthetic checks | `join.html`, index, `/health` |
| API 5xx / latency by route | Request metrics (1-min buckets) |
| Extension failures | Batched client ops events |
| Org security events | Aggregate from `security_events` |
| Alerts | DB down, synthetic failure, API 5xx (30 min cooldown) |

Per-org detail remains in **admin.html** (security events, SIEM webhook).

## Alerts

Set `OPS_ALERT_WEBHOOK_URL` to a **Microsoft Teams** incoming webhook (recommended) or Slack URL.

### Microsoft Teams (Power Automate workflow)

Your Teams workflow expects an **Adaptive Card** (see setup: “card sent to this workflow's webhook”). Veil sends:

```json
{
  "type": "message",
  "attachments": [{
    "contentType": "application/vnd.microsoft.card.adaptive",
    "contentUrl": null,
    "content": { "...": "AdaptiveCard 1.4" }
  }]
}
```

Railway:

```
OPS_ALERT_WEBHOOK_TYPE=teams-webhook
OPS_ALERT_WEBHOOK_URL=<workflow webhook URL from Teams setup>
```

Use `OPS_ALERT_WEBHOOK_TYPE=text` only for old HTTP/manual flows that expect `{"text":"..."}`.

### Error: `UserNotAuthorizedToPerformAppOperationOnGroupChat` / Forbidden

The flow reached Teams but **Power Automate is not installed in that chat**. Fix in Teams (not in Veil):

1. Open **Microsoft Teams** → the **same chat** you picked in the workflow (group chat or meeting chat).
2. Click **+** (apps) at the top of the chat → search **Workflows** or **Power Automate** → **Add**.
3. If you used “chat with yourself” / a 1:1, try a **channel** instead: recreate the workflow from a **team channel** → **⋯** → **Workflows** → “Post when webhook received” — channels usually work more reliably for ops alerts.
4. In Power Automate, **Save** the flow and run **Test** again (or `POST /v1/ops/test-alert`).

### Map the message field

In **Post message in a chat or channel** (or **Post card**), set content from trigger body **`text`**:

`triggerBody()?['text']`

Veil sends: `{ "text": "title + body + timestamp" }`.

**Test from production** (after deploy):

```bash
curl -X POST "https://veil-api.goldspireventures.com/v1/ops/test-alert" \
  -H "Authorization: Bearer YOUR_PLATFORM_OPS_TOKEN"
```

Railway env:

```
OPS_ALERT_WEBHOOK_TYPE=powerautomate
OPS_ALERT_WEBHOOK_URL=<your Power Automate URL>
```

### Slack (alternative)

```
OPS_ALERT_WEBHOOK_TYPE=slack
OPS_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
```

Alerts use a 30-minute cooldown per alert key to avoid spam.

## Migrations

```bash
npm run db:migrate
```

Requires `010_ops_hardening.sql` applied on production.

## Local smoke

```bash
npm run env:apply
npm run api:dev
# Open http://localhost:3015/ops.html
```
