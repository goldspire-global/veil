/**
 * Infer user intent from URL, form structure, and field semantics.
 * Drives when Veil should interrupt vs stay quiet.
 */
(function (global) {
  const MAIL_HOSTS = /(mail\.google|googlemail|outlook\.(live|office)|office365|hotmail|yahoo|proton\.me|protonmail|zoho)/i;

  const COMPOSE_PATH = /\/(mail|compose|new|draft|inbox\/new|_compose)/i;
  const FORM_PATH = /\/(signup|sign-up|register|registration|join|checkout|onboarding|profile|account|apply|enrol|enroll|patient|intake|application)/i;
  const ADMIN_PATH = /\/(admin|dashboard|partner|devconsole|listing|submit|settings|manage)/i;

  const ADMIN_HOSTS = /(partner\.microsoft\.com|chrome\.google\.com\/webstore|microsoftedge\.microsoft\.com|join-veil\.|goldspireventures\.com\/(create|admin))/i;

  const PII_AUTOCOMPLETE = new Set([
    'bday', 'bday-day', 'bday-month', 'bday-year',
    'email', 'tel', 'given-name', 'family-name', 'name',
    'street-address', 'postal-code', 'country', 'organization',
    'cc-name', 'cc-number', 'cc-exp', 'cc-csc',
  ]);

  const PII_LABEL_RE = /\b(date of birth|d\.?o\.?b\.?|birth\s*date|email|e-mail|phone|mobile|first name|last name|full name|address|postcode|zip code|national insurance|ssn|social security)\b/i;

  function resolveElement(target) {
    if (!target) return null;
    if (typeof Element !== 'undefined' && target instanceof Element) return target;
    if (target.tagName) return target;
    return target.parentElement || null;
  }

  function closestForm(element) {
    if (!element) return null;
    if (typeof element.closest === 'function') {
      return element.closest('form');
    }
    let node = element;
    while (node) {
      if (String(node.tagName || '').toUpperCase() === 'FORM') return node;
      node = node.parentElement;
    }
    return null;
  }

  function fieldHints(element) {
    if (!element) {
      return { autocomplete: '', labelText: '', placeholder: '', name: '', id: '' };
    }
    const autocomplete = String(element.getAttribute?.('autocomplete') || element.autocomplete || '').toLowerCase();
    const placeholder = String(element.placeholder || element.getAttribute?.('placeholder') || '');
    const name = String(element.name || element.getAttribute?.('name') || '');
    const id = String(element.id || element.getAttribute?.('id') || '');

    let labelText = String(element.getAttribute?.('aria-label') || '');
    if (!labelText && id && typeof document !== 'undefined') {
      const safeId = id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const label = document.querySelector(`label[for="${safeId}"]`);
      if (label) labelText = label.textContent || '';
    }

    return { autocomplete, labelText, placeholder, name, id };
  }

  function formExpectsPii(form, element) {
    if (!form && !element) return false;

    const hints = fieldHints(element);
    if (PII_AUTOCOMPLETE.has(hints.autocomplete)) return true;
    const combined = `${hints.labelText} ${hints.placeholder} ${hints.name} ${hints.id}`;
    if (PII_LABEL_RE.test(combined)) return true;

    if (!form || typeof form.querySelectorAll !== 'function') return false;

    let piiFields = 0;
    const fields = form.querySelectorAll('input, textarea, select');
    for (const field of fields) {
      const h = fieldHints(field);
      if (PII_AUTOCOMPLETE.has(h.autocomplete)) piiFields += 1;
      else if (PII_LABEL_RE.test(`${h.labelText} ${h.placeholder} ${h.name}`)) piiFields += 1;
    }
    return piiFields >= 2;
  }

  function isSearchField(element, meta = {}) {
    if (!element) return false;
    const type = String(element.type || meta.fieldType || '').toLowerCase();
    if (type === 'search') return true;
    const role = String(element.getAttribute?.('role') || '').toLowerCase();
    return role === 'searchbox';
  }

  function isMailCompose(host, path, meta) {
    if (!MAIL_HOSTS.test(host || '')) return false;
    if (COMPOSE_PATH.test(path || '')) return true;
    if (meta.editorKind === 'contenteditable' || meta.editorKind === 'textarea') return true;
    return meta.fieldType === 'textarea' || meta.editorKind === 'structured';
  }

  function inferIntent(target, partial = {}) {
    const element = resolveElement(target);
    const host = partial.host || (typeof location !== 'undefined' ? location.hostname || '' : '');
    const path = partial.path || (typeof location !== 'undefined' ? location.pathname || '' : '');
    const meta = {
      fieldType: partial.fieldType || '',
      editorKind: partial.editorKind || '',
      isPasswordField: Boolean(partial.isPasswordField),
      isEmailField: Boolean(partial.isEmailField),
      isPhoneField: Boolean(partial.isPhoneField),
    };

    const form = closestForm(element);
    const expectsPii = formExpectsPii(form, element);
    const hints = fieldHints(element);
    const signals = [];

    if (partial.source === 'ai_prompt' || partial.isAiSurface) {
      return {
        intent: 'ai_prompt',
        outboundRisk: 'high',
        expectsPii: false,
        inForm: Boolean(form),
        signals: ['ai_surface'],
      };
    }

    if (isSearchField(element, meta)) {
      signals.push('search_field');
      return {
        intent: 'search',
        outboundRisk: 'low',
        expectsPii: false,
        inForm: Boolean(form),
        signals,
      };
    }

    if (ADMIN_HOSTS.test(host) || ADMIN_PATH.test(path)) {
      signals.push('admin_surface');
      return {
        intent: 'admin_portal',
        outboundRisk: 'low',
        expectsPii: expectsPii,
        inForm: Boolean(form),
        signals,
      };
    }

    if (isMailCompose(host, path, meta) && partial.source !== 'type') {
      signals.push('mail_compose');
      return {
        intent: 'compose_outbound',
        outboundRisk: 'high',
        expectsPii: false,
        inForm: false,
        signals,
      };
    }

    if (isMailCompose(host, path, meta) && meta.editorKind === 'textarea') {
      signals.push('mail_body');
      return {
        intent: 'compose_outbound',
        outboundRisk: 'high',
        expectsPii: false,
        inForm: Boolean(form),
        signals,
      };
    }

    if (FORM_PATH.test(path)) {
      signals.push('form_url');
    }
    if (form) signals.push('html_form');
    if (expectsPii) signals.push('expected_pii');

    if (form || FORM_PATH.test(path) || expectsPii) {
      return {
        intent: 'form_data_entry',
        outboundRisk: 'low',
        expectsPii: expectsPii || FORM_PATH.test(path),
        inForm: Boolean(form),
        signals,
      };
    }

    if (meta.editorKind === 'contenteditable' || meta.editorKind === 'textarea') {
      signals.push('editable_surface');
      return {
        intent: 'compose_outbound',
        outboundRisk: 'medium',
        expectsPii: false,
        inForm: Boolean(form),
        signals,
      };
    }

    return {
      intent: 'general',
      outboundRisk: 'medium',
      expectsPii: false,
      inForm: Boolean(form),
      signals,
    };
  }

  global.GoldspireDetectionIntent = {
    inferIntent,
    formExpectsPii,
    fieldHints,
    MAIL_HOSTS,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
