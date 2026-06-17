(function (global) {
  const lib = global.GoldspireDetectionLib;
  if (!lib?.findApiKeys || !global.GoldspireDetection?.register) return;

  global.GoldspireDetection.register({
    id: 'api-key',
    category: 'api_key',
    detect(text) {
      return lib.findApiKeys(text).map(({ matchedTextRaw, ...rest }) => rest);
    },
  });
})(typeof globalThis !== 'undefined' ? globalThis : self);
