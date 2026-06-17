/**
 * Claude adapter — intercept prompt submit on claude.ai
 */
(function (global) {
  function matches(loc = location) {
    const host = String(loc.hostname || '').toLowerCase();
    return host === 'claude.ai' || host.endsWith('.claude.ai');
  }

  function getPromptRoot() {
    return (
      document.querySelector('div[contenteditable="true"].ProseMirror')
      || document.querySelector('fieldset div[contenteditable="true"]')
      || document.querySelector('div[contenteditable="true"][data-placeholder]')
    );
  }

  function getSubmitControl() {
    return (
      document.querySelector('button[aria-label="Send Message"]')
      || document.querySelector('button[aria-label="Send message"]')
      || document.querySelector('fieldset button[type="button"]:not([disabled])')
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
      adapterId: 'claude',
    });
  }

  global.GoldspireAiFramework?.register?.({
    id: 'claude',
    matches,
    init,
    getPromptRoot,
    getSubmitControl,
  });
})(typeof globalThis !== 'undefined' ? globalThis : self);
