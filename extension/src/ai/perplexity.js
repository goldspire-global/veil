/**
 * Perplexity adapter — perplexity.ai
 */
(function (global) {
  function matches(loc = location) {
    const host = String(loc.hostname || '').toLowerCase();
    return host === 'perplexity.ai' || host.endsWith('.perplexity.ai');
  }

  function getPromptRoot() {
    return (
      document.querySelector('textarea[placeholder*="Ask"]')
      || document.querySelector('div[contenteditable="true"]')
      || document.querySelector('textarea')
    );
  }

  function getSubmitControl() {
    return (
      document.querySelector('button[aria-label="Submit"]')
      || document.querySelector('button[aria-label="Send"]')
      || document.querySelector('button[type="submit"]')
    );
  }

  function init({ getSettings, runSafe } = {}) {
    if (!matches()) return;
    global.GoldspireAiIntercept?.wireSubmitInterceptor?.({
      matches: () => matches(),
      getPromptRoot,
      getSubmitControl,
      getSettings,
      runSafe,
      adapterId: 'perplexity',
    });
  }

  global.GoldspireAiFramework?.register?.({
    id: 'perplexity',
    matches,
    init,
    getPromptRoot,
    getSubmitControl,
  });
})(typeof globalThis !== 'undefined' ? globalThis : self);
