/**
 * Pure text masking — replaces sensitive spans with redacted previews.
 */
(function (global) {
  function maskSensitiveText(text, context = {}) {
    const input = String(text || '');
    if (!input) return '';

    const lib = global.GoldspireDetectionLib;
    const analyze = lib?.analyzeAll || global.GoldspireDetection?.analyze;
    if (!analyze) return input;

    const hits = analyze(input, context).filter(
      (hit) => hit.matchedTextRaw != null && Number.isFinite(hit.index) && hit.confidence >= 50,
    );
    if (hits.length === 0) return input;

    const sorted = [...hits].sort((a, b) => b.index - a.index);
    let out = input;

    for (const hit of sorted) {
      const raw = String(hit.matchedTextRaw);
      const mask = hit.matchedText || lib?.redactPreview?.(raw) || '****';
      const start = hit.index;
      if (start < 0 || start + raw.length > out.length) continue;
      if (out.slice(start, start + raw.length) !== raw) continue;
      out = `${out.slice(0, start)}${mask}${out.slice(start + raw.length)}`;
    }

    return out;
  }

  function maskWithPreservedWhitespace(text, context = {}) {
    const raw = String(text || '');
    if (!raw.trim()) return raw;
    const lead = raw.match(/^\s*/)?.[0] || '';
    const trail = raw.match(/\s*$/)?.[0] || '';
    const core = raw.trim();
    const masked = maskSensitiveText(core, context);
    if (masked === core) return raw;
    return `${lead}${masked}${trail}`;
  }

  global.GoldspireVeilMask = {
    maskSensitiveText,
    maskWithPreservedWhitespace,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
