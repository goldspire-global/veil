/**
 * Google Gemini adapter — gemini.google.com
 */
(function (global) {
  function matches(loc = location) {
    const host = String(loc.hostname || '').toLowerCase();
    return host === 'gemini.google.com' || host.endsWith('.gemini.google.com');
  }

  function getPromptRoot() {
    return (
      document.querySelector('div[contenteditable="true"][aria-label*="Enter a prompt"]')
      || document.querySelector('rich-textarea div[contenteditable="true"]')
      || document.querySelector('div.ql-editor[contenteditable="true"]')
      || document.querySelector('textarea')
    );
  }

  function getSubmitControl() {
    return (
      document.querySelector('button[aria-label="Send message"]')
      || document.querySelector('button.send-button')
      || document.querySelector('button[mattooltip*="Send"]')
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
      adapterId: 'gemini',
    });
  }

  global.GoldspireAiFramework?.register?.({
    id: 'gemini',
    matches,
    init,
    getPromptRoot,
    getSubmitControl,
  });
})(typeof globalThis !== 'undefined' ? globalThis : self);
