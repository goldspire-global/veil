/**
 * Register built-in Veil detectors. Safe to load on every page (no scanning until invoked).
 */
(function (global) {
  if (!global.GoldspireDetection?.getDetectors) return;
  if (global.GoldspireDetection.getDetectors().length > 0) return;
  // Individual detector scripts self-register on load.
})(typeof globalThis !== 'undefined' ? globalThis : self);
