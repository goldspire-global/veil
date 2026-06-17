/**
 * Insert/replace text at paste caret for Veil copilot actions.
 */
(function (global) {
  function resolveElement(target) {
    if (!target) return null;
    if (target instanceof Element) return target;
    return target.parentElement || null;
  }

  function getCaretState(target) {
    const element = resolveElement(target);
    if (!element) return null;

    if (
      (typeof HTMLInputElement !== 'undefined' && element instanceof HTMLInputElement)
      || String(element.tagName || '').toUpperCase() === 'INPUT'
    ) {
      const start = element.selectionStart ?? element.value.length;
      const end = element.selectionEnd ?? start;
      return { kind: 'input', element, start, end };
    }

    if (
      (typeof HTMLTextAreaElement !== 'undefined' && element instanceof HTMLTextAreaElement)
      || String(element.tagName || '').toUpperCase() === 'TEXTAREA'
    ) {
      const start = element.selectionStart ?? element.value.length;
      const end = element.selectionEnd ?? start;
      return { kind: 'input', element, start, end };
    }

    const sel = window.getSelection?.();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0).cloneRange();
    return { kind: 'range', range, selection: sel };
  }

  function insertAtCaret(caret, text) {
    if (!caret) return null;
    const replacement = String(text ?? '');

    if (caret.kind === 'input') {
      const { element, start, end } = caret;
      const before = element.value.slice(0, start);
      const after = element.value.slice(end);
      element.value = `${before}${replacement}${after}`;
      const cursorStart = before.length;
      const cursorEnd = cursorStart + replacement.length;
      element.focus();
      element.setSelectionRange(cursorStart, cursorEnd);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return {
        kind: 'input',
        element,
        start: cursorStart,
        end: cursorEnd,
        selectedText: replacement,
      };
    }

    const range = caret.range;
    const selection = caret.selection || window.getSelection();
    range.deleteContents();
    const node = document.createTextNode(replacement);
    range.insertNode(node);
    const after = document.createRange();
    after.setStartBefore(node);
    after.setEndAfter(node);
    selection?.removeAllRanges?.();
    selection?.addRange?.(after);

    const root = global.GoldspireEditorHost?.findComposeRoot?.({ range: after })
      || node.parentElement?.closest?.('[contenteditable=""], [contenteditable="true"]');
    global.GoldspireEditorHost?.notifyEditor?.(root)
      || root?.dispatchEvent?.(new Event('input', { bubbles: true }));

    return {
      kind: 'range',
      selectedText: replacement,
      range: after,
      selection,
    };
  }

  function simulatePaste(target, text) {
    return insertAtCaret(getCaretState(target), text);
  }

  global.GoldspirePasteInsert = {
    getCaretState,
    insertAtCaret,
    simulatePaste,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
