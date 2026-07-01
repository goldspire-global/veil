import { getPool } from './db.mjs';
import { getSecurityEventSummary } from './events-service.mjs';
import { getOrgOverview } from './admin-service.mjs';
import { sendEmail, isEmailConfigured } from './email-service.mjs';

function weekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function adminEmail(org) {
  const settings = org.settings && typeof org.settings === 'object' ? org.settings : {};
  return String(settings.adminEmail || settings.contactEmail || '').trim();
}

function digestEnabled(org) {
  const analytics = org.settings?.analytics;
  if (analytics && analytics.weeklyDigest === false) return false;
  return true;
}

export async function buildWeeklyDigestHtml(org, overview, summary) {
  const name = org.display_name || org.displayName || 'Your team';
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px">
  <h1 style="font-size:18px">Veil weekly summary — ${escapeHtml(name)}</h1>
  <p style="color:#555">Last 7 days · metadata only, no message content</p>
  <ul>
    <li><strong>${summary.totals?.total ?? 0}</strong> security events</li>
    <li><strong>${summary.totals?.detections ?? 0}</strong> detections</li>
    <li><strong>${summary.totals?.blocks ?? 0}</strong> policy blocks</li>
    <li><strong>${summary.totals?.encryptActions ?? 0}</strong> secure · <strong>${summary.totals?.maskActions ?? 0}</strong> mask</li>
    <li><strong>${overview.members?.connected ?? 0}</strong> / ${overview.members?.active ?? 0} browsers connected</li>
  </ul>
  <p style="font-size:13px;color:#666">Manage digest in Admin → Settings. Veil by Goldspire.</p>
</body></html>`;
}

export async function runWeeklyOrgDigests(env) {
  if (!isEmailConfigured(env)) {
    return { ok: true, skipped: true, reason: 'email_not_configured', sent: 0 };
  }

  const pool = getPool();
  const orgs = await pool.query(
    `SELECT id, display_name, settings, policy_version FROM organizations WHERE active = true`,
  );

  let sent = 0;
  let errors = 0;
  const currentWeek = weekKey();

  for (const row of orgs.rows) {
    const org = {
      id: row.id,
      display_name: row.display_name,
      settings: row.settings || {},
      policyVersion: row.policy_version,
    };
    if (!digestEnabled(org)) continue;

    const to = adminEmail(org);
    if (!to) continue;

    const lastSent = org.settings?.analytics?.lastDigestWeek;
    if (lastSent === currentWeek) continue;

    try {
      const admin = { org };
      const [overview, summary] = await Promise.all([
        getOrgOverview(admin),
        getSecurityEventSummary(admin, { days: 7 }),
      ]);

      const html = await buildWeeklyDigestHtml(org, overview, summary);
      const result = await sendEmail(env, {
        to,
        subject: `Veil weekly summary — ${org.display_name || 'your team'}`,
        html,
        text: `Veil weekly: ${summary.totals?.events ?? 0} events, ${overview.members?.connected ?? 0} connected browsers.`,
      });

      if (result.ok) {
        sent += 1;
        const settings = { ...org.settings };
        settings.analytics = { ...(settings.analytics || {}), lastDigestWeek: currentWeek };
        await pool.query(
          `UPDATE organizations SET settings = $2, updated_at = now() WHERE id = $1`,
          [org.id, JSON.stringify(settings)],
        );
      } else {
        errors += 1;
      }
    } catch (error) {
      errors += 1;
      console.error('[veil/digest] org failed', org.id, error);
    }
  }

  return { ok: true, sent, errors, week: currentWeek };
}
