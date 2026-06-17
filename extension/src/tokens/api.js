/**
 * Secure token API — background broker (ciphertext only on wire).
 */
(function (global) {
  function apiBase() {
    return (global.GoldspireConstants?.ORG_API_BASE || '').replace(/\/$/, '');
  }

  async function authHeaders() {
    const deviceId = await global.GoldspireOrgProvision?.getDeviceId?.();
    const token = await global.GoldspireOrgProvision?.loadProvisionToken?.();
    return {
      deviceId,
      token,
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Device-Id': deviceId,
        'X-Extension-Version': global.GoldspireBrowser?.api?.runtime?.getManifest?.()?.version || '',
        'Content-Type': 'application/json',
      },
    };
  }

  async function apiFetch(path, options = {}) {
    const base = apiBase();
    if (!base) throw new Error('Cloud tokens require org API.');

    const auth = await authHeaders();
    if (!auth.token) throw new Error('Join your team to use secure tokens.');

    const response = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        ...auth.headers,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || body.error || `Token request failed (${response.status}).`);
    }

    return response.json();
  }

  async function createTokenRecord({ ciphertext, category, ttlMs, maxReads, burnAfterRead }) {
    return apiFetch('/v1/extension/tokens', {
      method: 'POST',
      body: JSON.stringify({
        ciphertext,
        category: category || '',
        ttlMs,
        maxReads,
        burnAfterRead,
      }),
    });
  }

  async function resolveTokenRecord(tokenId) {
    const id = encodeURIComponent(String(tokenId || '').trim());
    return apiFetch(`/v1/extension/tokens/${id}`, { method: 'GET' });
  }

  global.GoldspireVeilTokenApi = {
    createTokenRecord,
    resolveTokenRecord,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
