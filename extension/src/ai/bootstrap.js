/** Load AI site adapters (ChatGPT, Claude, Gemini, Copilot, Perplexity). */
(function (global) {
  function initAi({ getSettings, runSafe }) {
    global.GoldspireAiFramework?.initAiAdapters?.({ getSettings, runSafe });
  }

  global.GoldspireAiBootstrap = { initAi };
})(typeof globalThis !== 'undefined' ? globalThis : self);
