(function (global) {
  const lib = global.GoldspireDetectionLib;
  if (!lib?.findPasswords || !global.GoldspireDetection?.register) return;

  global.GoldspireDetection.register({
    id: 'password',
    category: 'password',
    detect(text, context) {
      return lib.findPasswords(text, context).map(({ matchedTextRaw, ...rest }) => rest);
    },
  });
})(typeof globalThis !== 'undefined' ? globalThis : self);
