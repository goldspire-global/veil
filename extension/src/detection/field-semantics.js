/**
 * Compiles fieldSemantics from GoldspireIntentConfig — no local rule definitions.
 */
(function (global) {
  let compiledRules = null;

  function cfg() {
    return global.GoldspireIntentConfig || {};
  }

  function compileRules() {
    if (compiledRules) return compiledRules;
    const raw = cfg().fieldSemantics || [];
    compiledRules = raw.map((rule) => ({
      id: rule.id,
      labelPatterns: (rule.labelPatterns || []).map((source) => new RegExp(source, 'i')),
      autocomplete: new Set(rule.autocomplete || []),
      suppressCategories: new Set(rule.suppressCategories || []),
      preferCategories: new Set(rule.preferCategories || []),
    }));
    return compiledRules;
  }

  function fieldTextFromContext(context = {}) {
    return `${context.fieldLabel || ''} ${context.fieldPlaceholder || ''} ${context.fieldName || ''} ${context.fieldId || ''}`.trim();
  }

  function contextFromElementHints(hints = {}) {
    return {
      fieldLabel: hints.labelText || '',
      fieldPlaceholder: hints.placeholder || '',
      fieldName: hints.name || '',
      fieldId: hints.id || '',
      fieldAutocomplete: hints.autocomplete || '',
      autocomplete: hints.autocomplete || '',
    };
  }

  function inferFieldSemantics(context = {}) {
    const text = fieldTextFromContext(context);
    const auto = String(context.autocomplete || context.fieldAutocomplete || '').toLowerCase();
    const matched = [];
    const suppress = new Set();
    const prefer = new Set();

    for (const rule of compileRules()) {
      const labelHit = rule.labelPatterns.some((re) => re.test(text));
      const autoHit = auto && rule.autocomplete.has(auto);
      if (!labelHit && !autoHit) continue;
      matched.push(rule.id);
      for (const cat of rule.suppressCategories) suppress.add(cat);
      for (const cat of rule.preferCategories) prefer.add(cat);
    }

    return {
      semantics: matched,
      suppressCategories: [...suppress],
      preferCategories: [...prefer],
      isPersonName: matched.includes('person_name'),
      isGovernmentId: matched.includes('government_id'),
      isPaymentAccount: matched.includes('payment_account'),
    };
  }

  function shouldSuppressCategory(category, context = {}, hit = null) {
    const semantics = context.fieldSemantics || inferFieldSemantics(context);
    if (!(semantics.suppressCategories || []).includes(category)) return false;
    const bypass = cfg().disambiguation?.highConfidenceBypass || {};
    const floor = Number(bypass[category]);
    if (!floor || !hit) return true;
    return (Number(hit.confidence) || 0) < floor;
  }

  global.GoldspireFieldSemantics = {
    compileRules,
    inferFieldSemantics,
    fieldTextFromContext,
    contextFromElementHints,
    shouldSuppressCategory,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
