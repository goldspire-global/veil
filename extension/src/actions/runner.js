/**
 * Veil action runner — executes registry actions (Encrypt wired to secure flow).
 */
(function (global) {
  const { ACTION_IDS } = global.GoldspireVeilActionRegistry || { ACTION_IDS: {} };

  let deps = null;

  function registerDeps(nextDeps = {}) {
    deps = { ...deps, ...nextDeps };
  }

  async function logAction(actionId, request = {}, extra = {}) {
    if (!global.GoldspireVeilEvents?.emit) return;
    const hit = request.detections?.[0] || {};
    await global.GoldspireVeilEvents.emit({
      type: 'action',
      category: hit.category || '',
      severity: hit.severity || '',
      host: request.context?.host || '',
      source: request.context?.source || '',
      action: actionId,
      confidence: hit.confidence || 0,
      ...extra,
    });
  }

  async function executeMask(request = {}) {
    const text = String(request.text || request.selectionContext?.selectedText || '');
    if (!text) return { ok: false, error: 'no_text' };

    const masked = global.GoldspireVeilMask?.maskSensitiveText?.(text, request.context) || text;
    if (masked === text) return { ok: false, error: 'nothing_to_mask' };

    if (request.selectionContext && deps?.replaceSelection) {
      deps.replaceSelection(request.selectionContext, masked);
    } else if (request.replaceText && deps?.replaceText) {
      await deps.replaceText(request.replaceText, masked);
    }

    await logAction(ACTION_IDS.mask, request);
    return { ok: true, action: ACTION_IDS.mask, text: masked };
  }

  async function executeEncrypt(request = {}) {
    const context = request.selectionContext || deps.getSelectionContext?.(request.message);
    if (!context?.selectedText?.trim()) {
      return { ok: false, error: 'no_selection' };
    }

    const settings = request.settings || (await deps.getSettings?.()) || {};

    if (deps.executeSecureBatch && request.selectionContext) {
      const teamPassphrase = await deps.resolveTeamPassphrase?.(settings);
      const canQuick =
        settings.defaultSecureMode === 'team'
        && teamPassphrase
        && (settings.passphraseFromVault || settings.useSavedPassphrase !== false);

      if (canQuick) {
        const result = await deps.executeSecureBatch(context, settings, {
          mode: 'team',
          unlockSecret: teamPassphrase,
          copyLink: false,
          silentBatch: request.options?.silent !== false,
        });
        await logAction(ACTION_IDS.encrypt, request);
        return { ok: true, action: ACTION_IDS.encrypt, result };
      }
    }

    if (!deps?.secureSelection) return { ok: false, error: 'encrypt_not_wired' };

    const result = await deps.secureSelection({
      ...(request.options || {}),
      silent: request.options?.silent !== false,
    });

    await logAction(ACTION_IDS.encrypt, request);
    return { ok: true, action: ACTION_IDS.encrypt, result };
  }

  async function executeCopySecure(request = {}) {
    if (!deps?.copySecureText) {
      return { ok: false, error: 'copy_secure_not_wired', stub: true };
    }

    const text = String(request.text || request.selectionContext?.selectedText || '').trim();
    if (!text) return { ok: false, error: 'no_text' };

    const copied = await deps.copySecureText(text, request.settings, request.options);
    if (!copied?.ok) return copied || { ok: false, error: 'copy_failed' };

    await logAction(ACTION_IDS.copy_secure, request);
    return { ok: true, action: ACTION_IDS.copy_secure, ...copied };
  }

  async function executeBlock(request = {}) {
    await logAction(ACTION_IDS.block, request);
    return { ok: true, action: ACTION_IDS.block, blocked: true };
  }

  async function executeIgnore(request = {}) {
    await logAction(ACTION_IDS.ignore, request, { action: 'allow' });
    return { ok: true, action: ACTION_IDS.ignore, allowed: true };
  }

  async function executeTokenize(request = {}) {
    const text = String(request.text || request.selectionContext?.selectedText || '').trim();
    if (!text) return { ok: false, error: 'no_text' };

    const settings = request.settings || (await deps?.getSettings?.()) || {};
    const category = request.detections?.[0]?.category || '';

    const created = await global.GoldspireVeilTokens?.createToken?.(text, settings, { category });
    if (!created?.ok) return created || { ok: false, error: 'tokenize_failed' };

    if (request.selectionContext && deps?.replaceSelection) {
      deps.replaceSelection(request.selectionContext, created.placeholder);
    }

    await logAction(ACTION_IDS.tokenize, request);
    global.GoldspireSecureUI?.showToast?.('Tokenized as secure placeholder.', 'success');
    return { ok: true, action: ACTION_IDS.tokenize, ...created };
  }

  async function execute(actionId, request = {}) {
    const settings = request.settings || (await deps?.getSettings?.()) || {};
    const gate = global.GoldspireVeilActionRegistry?.availabilityFor?.(actionId, request.context, settings);

    if (gate && !gate.available && actionId !== ACTION_IDS.ignore) {
      if (gate.stub || actionId === ACTION_IDS.tokenize) {
        return { ok: false, error: gate.reason || 'unavailable', action: actionId };
      }
      return { ok: false, error: gate.reason || 'unavailable', action: actionId };
    }

    const enriched = { ...request, settings };

    switch (actionId) {
      case ACTION_IDS.encrypt:
        return executeEncrypt(enriched);
      case ACTION_IDS.mask:
        return executeMask(enriched);
      case ACTION_IDS.tokenize:
        return executeTokenize(enriched);
      case ACTION_IDS.copy_secure:
        return executeCopySecure(enriched);
      case ACTION_IDS.block:
        return executeBlock(enriched);
      case ACTION_IDS.ignore:
        return executeIgnore(enriched);
      default:
        return { ok: false, error: 'unknown_action' };
    }
  }

  global.GoldspireVeilActions = {
    registerDeps,
    execute,
    executeEncrypt,
    executeMask,
    executeCopySecure,
    executeBlock,
    executeIgnore,
    executeTokenize,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
