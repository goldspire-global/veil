(function (global) {
  const lib = global.GoldspireDetectionLib;
  if (!lib?.findEmails || !global.GoldspireDetection?.register) return;

  global.GoldspireDetection.register({
    id: 'email',
    category: 'email',
    detect(text, context) {
      return lib.findEmails(text, context).map(({ matchedTextRaw, ...rest }) => rest);
    },
  });
})(typeof globalThis !== 'undefined' ? globalThis : self);
