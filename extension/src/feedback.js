/**
 * User feedback — mailto helpers with safe diagnostic metadata (no secrets).
 */
(function (global) {
  const SUPPORT_EMAIL = 'support@goldspireventures.com';
  const SECURITY_EMAIL = 'security@goldspireventures.com';

  const SUBJECTS = {
    feedback: 'Veil feedback',
    bug: 'Veil issue report',
    falsePositive: 'Veil copilot false alert',
    security: 'Veil security report',
  };

  function detectBrowser(ua) {
    const s = ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    if (/Edg\//i.test(s)) return 'Microsoft Edge';
    if (/Firefox\//i.test(s)) return 'Firefox';
    if (/Chrome\//i.test(s)) return 'Chrome';
    return 'Unknown';
  }

  function portalBaseUrl(constants) {
    const portal = constants?.ORG_PORTAL_URL || '';
    return portal.replace(/join\.html.*$/i, '') || 'https://join-veil.goldspireventures.com/';
  }

  function feedbackPageUrl(constants, params = {}) {
    const base = portalBaseUrl(constants);
    const root = base.endsWith('/') ? base : `${base}/`;
    const url = new URL('feedback.html', root);
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== '') url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  function sanitizePageUrl(raw) {
    if (!raw) return '';
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return '';
    }
  }

  function buildDiagnostics(meta = {}) {
    const lines = [
      `Veil version: ${meta.version || 'unknown'}`,
      `Browser: ${meta.browser || detectBrowser()}`,
      `Profile: ${meta.profile || 'unknown'}`,
    ];
    if (meta.copilot != null) lines.push(`Copilot: ${meta.copilot ? 'on' : 'off'}`);
    if (meta.orgName) lines.push(`Team: ${meta.orgName}`);
    if (meta.pageUrl) lines.push(`Page: ${meta.pageUrl}`);
    return lines.join('\n');
  }

  function buildMailtoUrl(kind, options = {}) {
    const resolvedKind = SUBJECTS[kind] ? kind : 'feedback';
    const to = options.email || (resolvedKind === 'security' ? SECURITY_EMAIL : SUPPORT_EMAIL);
    const subject = SUBJECTS[resolvedKind];
    const bodyParts = [];
    if (options.message) {
      bodyParts.push(String(options.message).trim(), '');
    }
    bodyParts.push(
      '---',
      'Diagnostic info (no secrets):',
      options.diagnostics || buildDiagnostics(options.meta || {}),
      '',
      'Describe what happened and what you expected:',
    );
    const body = bodyParts.join('\n');
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function openMailto(api, mailtoUrl) {
    if (api?.tabs?.create) {
      api.tabs.create({ url: mailtoUrl });
      return;
    }
    if (typeof window !== 'undefined') {
      window.open(mailtoUrl, '_blank');
    }
  }

  function openFeedbackPage(api, constants, params = {}) {
    const url = feedbackPageUrl(constants, params);
    if (api?.tabs?.create) {
      api.tabs.create({ url });
      return;
    }
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener');
    }
  }

  global.GoldspireFeedback = {
    SUPPORT_EMAIL,
    SECURITY_EMAIL,
    SUBJECTS,
    detectBrowser,
    portalBaseUrl,
    feedbackPageUrl,
    sanitizePageUrl,
    buildDiagnostics,
    buildMailtoUrl,
    openMailto,
    openFeedbackPage,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
