-- Org teams + per-team DLP overrides (Sprint 18)

CREATE TABLE IF NOT EXISTS org_teams (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_org_teams_org ON org_teams(org_id);

ALTER TABLE org_members
  ADD COLUMN IF NOT EXISTS team_id TEXT REFERENCES org_teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_org_members_team ON org_members(team_id)
  WHERE team_id IS NOT NULL;
