/**
 * Detection context — where text came from and what kind of field it is.
 * Sprint 1+ detectors use this for scoring boosts.
 */
(function (global) {
  function createContext(partial = {}) {
    return {
      source: partial.source || 'unknown',
      host: partial.host || (typeof location !== 'undefined' ? location.hostname || '' : ''),
      path: partial.path || (typeof location !== 'undefined' ? location.pathname || '' : ''),
      fieldType: partial.fieldType || '',
      isPasswordField: Boolean(partial.isPasswordField),
      isEmailField: Boolean(partial.isEmailField),
      isPhoneField: Boolean(partial.isPhoneField),
      editorKind: partial.editorKind || '',
      intent: partial.intent || 'general',
      outboundRisk: partial.outboundRisk || 'medium',
      expectsPii: Boolean(partial.expectsPii),
      inForm: Boolean(partial.inForm),
      intentSignals: Array.isArray(partial.intentSignals) ? partial.intentSignals : [],
    };
  }

  global.GoldspireDetectionContext = { createContext };
})(typeof globalThis !== 'undefined' ? globalThis : self);
