/**
 * Copilot gating — reads category sets from GoldspireIntentConfig (locked product rules).
 */
(function (global) {
  function gatingCfg() {
    return global.GoldspireIntentConfig?.gating || {};
  }

  function categorySet(key, fallback = []) {
    return new Set(gatingCfg()[key] || fallback);
  }

  const SECRET_CATEGORIES = categorySet('secretCategories', ['api_key', 'jwt', 'password', 'credit_card']);
  const FINANCIAL_CATEGORIES = categorySet('financialCategories', [
    'iban', 'routing_number', 'swift_bic', 'bank_account', 'tax_id',
  ]);
  const PII_CATEGORIES = categorySet('piiCategories', [
    'email', 'phone', 'date_of_birth', 'ssn', 'nhs_number',
    'national_id', 'passport', 'driver_license', 'medical_record_number',
    'customer_id', 'internal_company_reference', 'pii',
  ]);

  const TYPE_HIGH_SIGNAL = new Set([
    ...SECRET_CATEGORIES,
    ...FINANCIAL_CATEGORIES,
    'ssn', 'nhs_number', 'medical_record_number',
  ]);

  function semantics(context = {}) {
    return context.fieldSemantics
      || global.GoldspireFieldSemantics?.inferFieldSemantics?.(context)
      || { suppressCategories: [] };
  }

  function isSuppressedByFieldRules(category, context = {}) {
    return (semantics(context).suppressCategories || []).includes(category);
  }

  function minConfidence(context = {}, source = 'paste') {
    const intent = context.intent || 'general';
    const table = gatingCfg().minConfidence || {};
    const bySource = table[source] || table.default || {};
    return Number(bySource[intent] ?? bySource.default ?? 50);
  }

  function shouldPromptCategory(category, context = {}, source = 'paste') {
    const cat = String(category || '');
    const intent = context.intent || 'general';
    const isPaste = source === 'paste' || source === 'paste_selection';
    const isType = source === 'type';
    const typingSuppress = gatingCfg().formTypingLowConfidenceSuppress || {};

    if (intent === 'search') return false;

    if (isSuppressedByFieldRules(cat, context)) return false;

    if (intent === 'form_data_entry' || context.inForm) {
      if (context.expectsPii && PII_CATEGORIES.has(cat)) return false;
      if (isType && !TYPE_HIGH_SIGNAL.has(cat)) return false;
      if (isType && cat === 'swift_bic') return false;
      if (isType && (cat === 'email' || cat === 'phone')) return false;
      if (isPaste && PII_CATEGORIES.has(cat) && context.expectsPii) return false;
      if (isType && typingSuppress[cat] && (Number(context.matchConfidence) || 0) < Number(typingSuppress[cat])) {
        return false;
      }
      return TYPE_HIGH_SIGNAL.has(cat) || FINANCIAL_CATEGORIES.has(cat);
    }

    if (SECRET_CATEGORIES.has(cat)) return true;

    if (intent === 'ai_prompt') {
      return SECRET_CATEGORIES.has(cat) || FINANCIAL_CATEGORIES.has(cat) || cat === 'ssn';
    }

    if (intent === 'admin_portal') {
      if (isType && PII_CATEGORIES.has(cat)) return false;
      if (isType && cat === 'swift_bic') return false;
      return SECRET_CATEGORIES.has(cat) || FINANCIAL_CATEGORIES.has(cat)
        || (isPaste && !PII_CATEGORIES.has(cat));
    }

    if (intent === 'compose_outbound') {
      if (isType && (cat === 'email' || cat === 'phone') && !context.isEmailField && !context.isPhoneField) {
        return false;
      }
      if (isType && cat === 'date_of_birth') return false;
      if (isType && cat === 'swift_bic') return false;
      return true;
    }

    if (isType && !TYPE_HIGH_SIGNAL.has(cat)) return false;

    return true;
  }

  function filterForPrompt(detections, context = {}, source = 'paste') {
    const floor = minConfidence(context, source);
    return (detections || []).filter((hit) => {
      const confidence = Number(hit.confidence) || 0;
      if (confidence < floor) return false;
      return shouldPromptCategory(hit.category, { ...context, matchConfidence: confidence }, source);
    });
  }

  function shouldInterrupt(detections, context = {}, source = 'paste') {
    return filterForPrompt(detections, context, source).length > 0;
  }

  global.GoldspireDetectionGating = {
    filterForPrompt,
    shouldInterrupt,
    shouldPromptCategory,
    minConfidence,
    SECRET_CATEGORIES,
    PII_CATEGORIES,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
