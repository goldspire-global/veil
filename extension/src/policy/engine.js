/**
 * DLP PolicyEngine — maps detections + context to enforcement actions.
 */
(function (global) {
  const SEVERITY_ORDER = { low: 0, medium: 1, high: 2, critical: 3 };

  function severityMeets(hitSeverity, minSeverity) {
    const hit = SEVERITY_ORDER[String(hitSeverity || 'low').toLowerCase()] ?? 0;
    const min = SEVERITY_ORDER[String(minSeverity || 'medium').toLowerCase()] ?? 1;
    return hit >= min;
  }

  function isAiContext(context = {}) {
    return context.isAiSurface === true || context.source === 'ai_prompt';
  }

  function pickStrictest(actions) {
    const rank = { block: 4, auto_mask: 3, warn: 2, allow: 1 };
    return actions.sort((a, b) => (rank[b] || 0) - (rank[a] || 0))[0] || 'allow';
  }

  function evaluate(detections = [], context = {}, settings = {}) {
    const mode = global.GoldspireSettings?.normalizeDlpMode?.(settings.dlpMode) || 'off';
    const policy = global.GoldspireDlpSchema?.policyFromSettings?.(settings)
      || global.GoldspireDlpSchema?.normalizePolicy?.({});

    if (mode === 'off' || !detections.length) {
      return { action: 'allow', enforced: false, reason: 'no_policy' };
    }

    const enforced = mode === 'enforce' && policy.enabled;
    const ai = isAiContext(context);
    const ruleSet = ai ? policy.aiSurfaces : policy;
    const categoryRules = ai ? policy.aiSurfaces.categories : policy.categories;
    const defaultAction = ai ? policy.aiSurfaces.defaultAction : policy.defaultAction;

    const matchedActions = [];
    let topCategory = '';
    let topSeverity = 'low';

    for (const hit of detections) {
      if (!hit?.category) continue;
      const rule = categoryRules[hit.category] || { action: defaultAction, minSeverity: 'medium' };
      if (!severityMeets(hit.severity, rule.minSeverity)) continue;
      matchedActions.push(rule.action);
      if ((SEVERITY_ORDER[hit.severity] || 0) >= (SEVERITY_ORDER[topSeverity] || 0)) {
        topSeverity = hit.severity || topSeverity;
        topCategory = hit.category;
      }
    }

    if (matchedActions.length === 0) {
      return { action: 'allow', enforced, reason: 'below_threshold', policy };
    }

    let action = pickStrictest(matchedActions);

    if (mode === 'observe' && !settings.copilotEnabled) {
      return {
        action: 'allow',
        enforced: false,
        observeOnly: true,
        suggestedAction: action,
        category: topCategory,
        severity: topSeverity,
        policy,
      };
    }

    if (mode === 'observe' && settings.copilotEnabled) {
      return {
        action: 'warn',
        enforced: false,
        copilot: true,
        suggestedAction: action,
        category: topCategory,
        severity: topSeverity,
        policy,
      };
    }

    if (!enforced) {
      return {
        action: settings.copilotEnabled ? 'warn' : 'allow',
        enforced: false,
        copilot: settings.copilotEnabled === true,
        suggestedAction: action,
        category: topCategory,
        severity: topSeverity,
        policy,
      };
    }

    return {
      action,
      enforced: true,
      category: topCategory,
      severity: topSeverity,
      policy,
      message: action === 'block'
        ? 'Organization policy blocked sensitive data.'
        : action === 'auto_mask'
          ? 'Sensitive data was masked by policy.'
          : 'Review sensitive data before continuing.',
    };
  }

  global.GoldspirePolicyEngine = {
    evaluate,
    severityMeets,
    isAiContext,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
