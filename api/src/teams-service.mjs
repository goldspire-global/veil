import { randomBytes } from 'node:crypto';
import { getPool } from './db.mjs';
import { httpError } from './org-service.mjs';
import { normalizeEmail } from './auth.mjs';

function slugTeamId(orgId, name) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return `${orgId}-${base || 'team'}-${randomBytes(2).toString('hex')}`;
}

function publicTeamRow(row) {
  const settings = typeof row.settings === 'object' && row.settings ? row.settings : {};
  return {
    teamId: row.id,
    name: row.name,
    settings,
    memberCount: Number(row.member_count) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTeams(admin) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT t.id, t.name, t.settings, t.created_at, t.updated_at,
            COUNT(m.email)::int AS member_count
     FROM org_teams t
     LEFT JOIN org_members m ON m.team_id = t.id AND m.active = true
     WHERE t.org_id = $1
     GROUP BY t.id
     ORDER BY t.name`,
    [admin.org.id],
  );
  return { teams: result.rows.map(publicTeamRow) };
}

export async function createTeam(admin, body = {}) {
  const name = String(body.name || '').trim();
  if (name.length < 2) throw httpError(400, 'Team name must be at least 2 characters.');
  if (name.length > 80) throw httpError(400, 'Team name is too long.');

  const settings = body.settings && typeof body.settings === 'object' ? body.settings : {};
  const id = slugTeamId(admin.org.id, name);
  const pool = getPool();

  try {
    await pool.query(
      `INSERT INTO org_teams (id, org_id, name, settings)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [id, admin.org.id, name, JSON.stringify(settings)],
    );
  } catch (error) {
    if (error.code === '23505') throw httpError(409, 'A team with that name already exists.');
    throw error;
  }

  return { ok: true, team: { teamId: id, name, settings } };
}

export async function updateTeam(admin, teamId, body = {}) {
  const id = String(teamId || '').trim();
  const pool = getPool();
  const patches = [];
  const values = [];
  let index = 1;

  if (body.name != null) {
    const name = String(body.name).trim();
    if (name.length < 2) throw httpError(400, 'Team name must be at least 2 characters.');
    patches.push(`name = $${index++}`);
    values.push(name);
  }

  if (body.settings && typeof body.settings === 'object') {
    const current = await pool.query(
      'SELECT settings FROM org_teams WHERE id = $1 AND org_id = $2',
      [id, admin.org.id],
    );
    if (current.rowCount === 0) throw httpError(404, 'Team not found.');
    const merged = {
      ...(typeof current.rows[0].settings === 'object' ? current.rows[0].settings : {}),
      ...body.settings,
    };
    patches.push(`settings = $${index++}::jsonb`);
    values.push(JSON.stringify(merged));
  }

  if (patches.length === 0) throw httpError(400, 'No changes provided.');
  patches.push('updated_at = now()');
  values.push(id, admin.org.id);

  const result = await pool.query(
    `UPDATE org_teams
     SET ${patches.join(', ')}
     WHERE id = $${index++} AND org_id = $${index}
     RETURNING id, name, settings, created_at, updated_at`,
    values,
  );

  if (result.rowCount === 0) throw httpError(404, 'Team not found.');
  return { ok: true, team: publicTeamRow({ ...result.rows[0], member_count: 0 }) };
}

export async function assignMemberTeam(admin, body = {}) {
  const email = normalizeEmail(body.email);
  const teamId = body.teamId != null ? String(body.teamId).trim() : null;
  if (!email) throw httpError(400, 'Member email is required.');

  const pool = getPool();
  if (teamId) {
    const team = await pool.query(
      'SELECT id FROM org_teams WHERE id = $1 AND org_id = $2',
      [teamId, admin.org.id],
    );
    if (team.rowCount === 0) throw httpError(404, 'Team not found.');
  }

  const result = await pool.query(
    `UPDATE org_members
     SET team_id = $1, updated_at = now()
     WHERE org_id = $2 AND email = $3 AND active = true
     RETURNING email, team_id`,
    [teamId, admin.org.id, email],
  );

  if (result.rowCount === 0) throw httpError(404, 'Member not found.');
  return { ok: true, email, teamId };
}

export async function getMemberTeamPolicy(orgId, memberEmail) {
  if (!memberEmail) return null;
  const pool = getPool();
  const result = await pool.query(
    `SELECT t.id, t.name, t.settings
     FROM org_members m
     JOIN org_teams t ON t.id = m.team_id
     WHERE m.org_id = $1 AND m.email = $2 AND m.active = true`,
    [orgId, memberEmail],
  );
  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return {
    teamId: row.id,
    teamName: row.name,
    settings: typeof row.settings === 'object' && row.settings ? row.settings : {},
  };
}
