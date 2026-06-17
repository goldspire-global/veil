/**
 * Detection context — where text came from and what kind of field it is.
 * Sprint 1+ detectors use this for scoring boosts.
 */
(function (global) {
  function createContext(partial = {}) {
    return {
      source: partial.source || 'unknown',
      host: partial.host || (typeof location !== 'undefined' ? location.hostname || '' : ''),
      fieldType: partial.fieldType || '',
      isPasswordField: Boolean(partial.isPasswordField),
      isEmailField: Boolean(partial.isEmailField),
      isPhoneField: Boolean(partial.isPhoneField),
      editorKind: partial.editorKind || '',
    };
  }

  global.GoldspireDetectionContext = { createContext };
})(typeof globalThis !== 'undefined' ? globalThis : self);
