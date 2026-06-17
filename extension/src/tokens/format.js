/**
 * Veil secure token placeholder format — [veil:vt_…]
 */
(function (global) {
  const TOKEN_PATTERN = /\[veil:(vt_[A-Za-z0-9_-]+)\]/g;
  const TOKEN_TEST = /\[veil:(vt_[A-Za-z0-9_-]+)\]/;

  function formatPlaceholder(tokenId) {
    return `[veil:${String(tokenId || '').trim()}]`;
  }

  function parsePlaceholder(text) {
    const input = String(text || '');
    const match = input.match(TOKEN_TEST);
    if (!match) return null;
    return {
      tokenId: match[1],
      placeholder: match[0],
      index: input.indexOf(match[0]),
    };
  }

  function findAllInText(text) {
    const input = String(text || '');
    const results = [];
    let match;
    const pattern = new RegExp(TOKEN_PATTERN.source, 'g');
    while ((match = pattern.exec(input)) !== null) {
      results.push({
        tokenId: match[1],
        placeholder: match[0],
        index: match.index,
      });
    }
    return results;
  }

  function isVeilToken(text) {
    return TOKEN_TEST.test(String(text || ''));
  }

  global.GoldspireVeilTokenFormat = {
    formatPlaceholder,
    parsePlaceholder,
    findAllInText,
    isVeilToken,
    TOKEN_TEST,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
