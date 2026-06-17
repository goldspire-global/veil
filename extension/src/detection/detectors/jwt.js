(function (global) {
  const lib = global.GoldspireDetectionLib;
  if (!lib?.findJwts || !global.GoldspireDetection?.register) return;

  global.GoldspireDetection.register({
    id: 'jwt',
    category: 'jwt',
    detect(text) {
      return lib.findJwts(text).map(({ matchedTextRaw, ...rest }) => rest);
    },
  });
})(typeof globalThis !== 'undefined' ? globalThis : self);
