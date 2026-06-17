/**
 * Microsoft Copilot adapter — copilot.microsoft.com / m365 copilot surfaces
 */
(function (global) {
  const HOSTS = ['copilot.microsoft.com', 'copilot.cloud.microsoft'];

  function matches(loc = location) {
    const host = String(loc.hostname || '').toLowerCase();
    return HOSTS.some((entry) => host === entry || host.endsWith(`.${entry}`));
  }

  function getPromptRoot() {
    return (
      document.querySelector('textarea#userInput')
      || document.querySelector('textarea[placeholder*="Ask"]')
      || document.querySelector('div[contenteditable="true"][role="textbox"]')
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
      adapterId: 'microsoft_copilot',
    });
  }

  global.GoldspireAiFramework?.register?.({
    id: 'microsoft_copilot',
    matches,
    init,
    getPromptRoot,
    getSubmitControl,
  });
})(typeof globalThis !== 'undefined' ? globalThis : self);
