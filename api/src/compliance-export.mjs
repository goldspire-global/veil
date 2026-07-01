import { getSecurityEventSummary } from './events-service.mjs';
import { getOrgOverview } from './admin-service.mjs';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function buildComplianceReportHtml(admin, { days = 30 } = {}) {
  const span = Math.min(90, Math.max(1, Number(days) || 30));
  const [summary, overview] = await Promise.all([
    getSecurityEventSummary(admin, { days: span }),
    getOrgOverview(admin),
  ]);

  const org = admin.org;
  const pack = overview.policy?.packLabel || overview.policy?.packId || 'Not set';
  const generated = new Date().toISOString().slice(0, 10);
  const periodEnd = new Date().toISOString().slice(0, 10);
  const periodStart = new Date(Date.now() - span * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const categoryRows = (summary.byCategory || [])
    .map((row) => `<tr><td>${escapeHtml(row.category || 'unknown')}</td><td>${row.count}</td></tr>`)
    .join('');

  const sourceRows = (summary.bySource || [])
    .map((row) => `<tr><td>${escapeHtml(row.source || 'unknown')}</td><td>${row.count}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Veil compliance report — ${escapeHtml(org.display_name || org.displayName || 'Team')}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #111; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .meta { color: #555; font-size: 0.9rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
    th, td { border: 1px solid #ccc; padding: 0.4rem 0.6rem; text-align: left; }
    th { background: #f4f4f4; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin: 1rem 0; }
    .stat { border: 1px solid #ddd; border-radius: 8px; padding: 0.75rem; }
    .stat strong { display: block; font-size: 1.4rem; }
    .footer { margin-top: 2rem; font-size: 0.8rem; color: #666; border-top: 1px solid #ddd; padding-top: 1rem; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>Veil security activity report</h1>
  <p class="meta">
    <strong>${escapeHtml(org.display_name || org.displayName || 'Organization')}</strong><br />
    Period: ${periodStart} — ${periodEnd} (${span} days) · Generated ${generated}<br />
    Policy pack: ${escapeHtml(pack)}
  </p>

  <div class="stat-grid">
    <div class="stat"><strong>${summary.totals?.total ?? 0}</strong>Total events</div>
    <div class="stat"><strong>${summary.totals?.detections ?? 0}</strong>Detections</div>
    <div class="stat"><strong>${summary.totals?.blocks ?? 0}</strong>Policy blocks</div>
    <div class="stat"><strong>${summary.totals?.encryptActions ?? 0}</strong>Secure actions</div>
    <div class="stat"><strong>${summary.totals?.maskActions ?? 0}</strong>Mask actions</div>
    <div class="stat"><strong>${overview.members?.connected ?? 0}</strong>Connected browsers</div>
  </div>

  <h2>Events by category</h2>
  <table>
    <thead><tr><th>Category</th><th>Count</th></tr></thead>
    <tbody>${categoryRows || '<tr><td colspan="2">No events in period</td></tr>'}</tbody>
  </table>

  <h2>Events by source</h2>
  <table>
    <thead><tr><th>Source</th><th>Count</th></tr></thead>
    <tbody>${sourceRows || '<tr><td colspan="2">No events in period</td></tr>'}</tbody>
  </table>

  <p class="footer">
    This report contains metadata only — no message content, matched secrets, or passphrases.
    Veil by Goldspire · Save as PDF via your browser print dialog.
  </p>
</body>
</html>`;
}
