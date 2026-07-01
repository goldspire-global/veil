/**
 * Transactional email — Resend when RESEND_API_KEY is set; otherwise no-op with skipped flag.
 */
export async function sendEmail(env, { to, subject, html, text, replyTo }) {
  const apiKey = String(env.RESEND_API_KEY || '').trim();
  const from = String(env.VEIL_EMAIL_FROM || 'Veil <noreply@goldspireventures.com>').trim();
  const recipient = String(to || '').trim();
  if (!recipient) return { ok: false, error: 'missing_recipient' };
  if (!apiKey) return { ok: false, skipped: true, reason: 'RESEND_API_KEY not configured' };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: String(subject || '').slice(0, 200),
      html: html || undefined,
      text: text || undefined,
      reply_to: replyTo || undefined,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return { ok: false, error: `resend_${response.status}`, detail: body.slice(0, 200) };
  }
  const data = await response.json().catch(() => ({}));
  return { ok: true, id: data.id };
}

export function isEmailConfigured(env) {
  return Boolean(String(env.RESEND_API_KEY || '').trim());
}
