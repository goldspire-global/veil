import { getPool } from './db.mjs';
import { httpError } from './org-service.mjs';
import { sendEmail } from './email-service.mjs';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function portalOrigin(env) {
  const raw = env.ORG_PORTAL_URL || env.PORTAL_ORIGIN || '';
  try {
    return new URL(raw).origin;
  } catch {
    return String(raw).replace(/\/$/, '') || 'https://veil.goldspireventures.com';
  }
}

function branding(org = {}) {
  const settings = org.settings && typeof org.settings === 'object' ? org.settings : {};
  const invite = settings.inviteBranding && typeof settings.inviteBranding === 'object'
    ? settings.inviteBranding
    : {};
  return {
    accent: invite.accentColor || '#d4a017',
    footer: invite.footerText || 'Veil by Goldspire — browser-native protection for sensitive text.',
    replyTo: invite.replyTo || settings.adminEmail || '',
  };
}

export function buildMemberInviteContent({ org, joinCode, installUrl, joinUrl, memberEmail }) {
  const name = org.display_name || org.displayName || 'your team';
  const brand = branding(org);
  const subject = `You're invited to Veil — ${name}`;

  const text = `Hi,

Your team is using Veil by Goldspire to protect sensitive text in email and web apps.

1. Install Veil: ${installUrl}
2. Open the extension → Team → join code: ${joinCode}
3. Sign in with ${memberEmail} (must match your admin's member list).

Veil syncs your team passphrase on join. Questions? Reply to your IT admin.

— ${brand.footer}`;

  const html = `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1a1a1a;max-width:560px">
  <div style="border-left:4px solid ${brand.accent};padding-left:16px;margin-bottom:20px">
    <h1 style="margin:0 0 8px;font-size:20px">Join ${escapeHtml(name)} on Veil</h1>
    <p style="margin:0;color:#555">Protect secrets before they leave your browser.</p>
  </div>
  <ol>
    <li><a href="${escapeHtml(installUrl)}">Install Veil</a> for Edge or Chrome</li>
    <li>Open Veil → <strong>Team</strong> → join code: <code>${escapeHtml(joinCode)}</code></li>
    <li>Use work email <strong>${escapeHtml(memberEmail)}</strong></li>
  </ol>
  <p><a href="${escapeHtml(joinUrl)}" style="display:inline-block;padding:10px 18px;background:${brand.accent};color:#17130a;text-decoration:none;border-radius:8px;font-weight:600">Open join page</a></p>
  <p style="font-size:13px;color:#666">${escapeHtml(brand.footer)}</p>
</body></html>`;

  return { subject, text, html, replyTo: brand.replyTo };
}

async function activeJoinCode(orgId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT code FROM join_codes WHERE org_id = $1 AND active = true ORDER BY created_at DESC LIMIT 1`,
    [orgId],
  );
  return result.rows[0]?.code || '';
}

export async function sendMemberInvite(admin, memberEmail, env) {
  const email = String(memberEmail || '').trim().toLowerCase();
  if (!email) throw httpError(400, 'Member email is required.');

  const pool = getPool();
  const member = await pool.query(
    `SELECT email FROM org_members WHERE org_id = $1 AND email = $2 AND active = true`,
    [admin.org.id, email],
  );
  if (member.rowCount === 0) throw httpError(404, 'Member not found. Add them under People first.');

  const joinCode = await activeJoinCode(admin.org.id);
  if (!joinCode) throw httpError(400, 'Create an active join code under Access first.');

  const origin = portalOrigin(env);
  const content = buildMemberInviteContent({
    org: admin.org,
    joinCode,
    installUrl: `${origin}/install.html`,
    joinUrl: `${origin}/join.html`,
    memberEmail: email,
  });

  const result = await sendEmail(env, {
    to: email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    replyTo: content.replyTo || undefined,
  });

  if (!result.ok && !result.skipped) {
    throw httpError(502, result.error || 'Could not send invite email.');
  }

  return {
    ok: true,
    email,
    emailed: result.ok === true,
    skipped: result.skipped === true,
    reason: result.reason,
    preview: result.skipped ? { subject: content.subject, text: content.text } : undefined,
  };
}
