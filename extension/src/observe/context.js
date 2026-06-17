/**
 * Build detection context from a paste/editable DOM target.
 */
(function (global) {
  function resolveElement(target) {
    if (!target) return null;
    if (target instanceof Element) return target;
    if (target.parentElement) return target.parentElement;
    return null;
  }

  function fieldMeta(element) {
    if (!element) {
      return {
        fieldType: '',
        isPasswordField: false,
        isEmailField: false,
        isPhoneField: false,
        editorKind: '',
      };
    }

    if (
      (typeof HTMLInputElement !== 'undefined' && element instanceof HTMLInputElement)
      || String(element.tagName || '').toUpperCase() === 'INPUT'
    ) {
      const type = String(element.type || 'text').toLowerCase();
      return {
        fieldType: type,
        isPasswordField: type === 'password',
        isEmailField: type === 'email',
        isPhoneField: type === 'tel',
        editorKind: 'input',
      };
    }

    if (
      (typeof HTMLTextAreaElement !== 'undefined' && element instanceof HTMLTextAreaElement)
      || String(element.tagName || '').toUpperCase() === 'TEXTAREA'
    ) {
      return {
        fieldType: 'textarea',
        isPasswordField: false,
        isEmailField: false,
        isPhoneField: false,
        editorKind: 'textarea',
      };
    }

    const editor = global.GoldspireEditorHost?.closestEditable?.(element) || element;
    let editorKind = 'contenteditable';
    if (global.GoldspireEditorHost?.isCodeEditor?.(editor)) editorKind = 'code';
    else if (global.GoldspireEditorHost?.isStructuredEditor?.(editor)) editorKind = 'structured';

    return {
      fieldType: 'contenteditable',
      isPasswordField: false,
      isEmailField: false,
      isPhoneField: false,
      editorKind,
    };
  }

  function contextFromTarget(target, partial = {}) {
    const element = resolveElement(target);
    const meta = fieldMeta(element);
    const host = typeof location !== 'undefined' ? location.hostname || '' : '';

    return global.GoldspireDetectionContext?.createContext?.({
      host,
      source: partial.source || 'paste',
      ...meta,
      ...partial,
    }) || { host, source: partial.source || 'paste', ...meta };
  }

  function shouldLogDetection(hit, minConfidence = 50) {
    return Boolean(hit?.category) && Number(hit.confidence) >= minConfidence;
  }

  function pasteDedupeKey(text, host) {
    return `${host}:${String(text || '').trim().slice(0, 512)}`;
  }

  global.GoldspireObserveContext = {
    contextFromTarget,
    shouldLogDetection,
    pasteDedupeKey,
    fieldMeta,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
