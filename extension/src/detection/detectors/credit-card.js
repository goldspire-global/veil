(function (global) {
  const lib = global.GoldspireDetectionLib;
  if (!lib?.findCreditCards || !global.GoldspireDetection?.register) return;

  global.GoldspireDetection.register({
    id: 'credit-card',
    category: 'credit_card',
    detect(text) {
      return lib.findCreditCards(text).map(({ matchedTextRaw, ...rest }) => rest);
    },
  });
})(typeof globalThis !== 'undefined' ? globalThis : self);
