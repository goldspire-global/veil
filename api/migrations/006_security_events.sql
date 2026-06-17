-- Veil security event ingestion (metadata only — no matched content)

CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  device_id TEXT,
  member_email TEXT,
  event_at TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT '',
  host TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT '',
  confidence SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_org_at
  ON security_events(org_id, event_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_org_type
  ON security_events(org_id, event_type, event_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_org_category
  ON security_events(org_id, category, event_at DESC);
