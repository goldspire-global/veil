/**
 * ChatGPT adapter — intercept prompt submit on chatgpt.com / chat.openai.com
 */
(function (global) {
  const HOSTS = ['chatgpt.com', 'chat.openai.com'];

  function matches(loc = location) {
    const host = String(loc.hostname || '').toLowerCase();
    return HOSTS.some((entry) => host === entry || host.endsWith(`.${entry}`));
  }

  function getPromptRoot() {
    return (
      document.querySelector('#prompt-textarea')
      || document.querySelector('textarea[data-id="root"]')
      || document.querySelector('div[contenteditable="true"][id*="prompt"]')
      || document.querySelector('form textarea')
    );
  }

  function getSubmitControl() {
    return (
      document.querySelector('button[data-testid="send-button"]')
      || document.querySelector('button[aria-label="Send prompt"]')
      || document.querySelector('button[aria-label="Send message"]')
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
      adapterId: 'chatgpt',
    });
  }

  global.GoldspireAiFramework?.register?.({
    id: 'chatgpt',
    matches,
    init,
    getPromptRoot,
    getSubmitControl,
  });
})(typeof globalThis !== 'undefined' ? globalThis : self);
