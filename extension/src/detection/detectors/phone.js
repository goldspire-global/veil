(function (global) {
  const lib = global.GoldspireDetectionLib;
  if (!lib?.findPhones || !global.GoldspireDetection?.register) return;

  global.GoldspireDetection.register({
    id: 'phone',
    category: 'phone',
    detect(text, context) {
      return lib.findPhones(text, context).map(({ matchedTextRaw, ...rest }) => rest);
    },
  });
})(typeof globalThis !== 'undefined' ? globalThis : self);
