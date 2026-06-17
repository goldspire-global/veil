/**
 * Veil secure token detector — clickable [veil:vt_…] placeholders in the page.
 */
(function (global) {
  const format = () => global.GoldspireVeilTokenFormat;

  function shouldSkipTextNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    if (parent.closest('script,style,textarea,input,option,noscript,code,#goldspire-secure-text-prompt')) {
      return true;
    }
    if (parent.closest('.gst-veil-token-btn')) return true;
    if (parent.closest('a.gst-redacted, button.gst-redacted-btn')) return true;
    return false;
  }

  function wireButton(button, tokenId, onResolve) {
    if (button.dataset.gstVeilWired === '1') return;
    button.dataset.gstVeilWired = '1';
    button.dataset.veilTokenId = tokenId;
    button.classList.add('gst-veil-token-btn');
    button.title = 'Click to reveal secure token';
    button.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        onResolve(tokenId, button);
      },
      true,
    );
  }

  function decoratePlainTextNode(node, match, onResolve) {
    const text = node.nodeValue || '';
    const { placeholder, tokenId, index } = match;
    const before = text.slice(0, index);
    const after = text.slice(index + placeholder.length);

    const fragment = document.createDocumentFragment();
    if (before) fragment.appendChild(document.createTextNode(before));

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = placeholder;
    wireButton(button, tokenId, onResolve);
    fragment.appendChild(button);

    if (after) fragment.appendChild(document.createTextNode(after));
    node.parentNode?.replaceChild(fragment, node);
  }

  function collectRoots() {
    const roots = [document];
    const stack = [document.documentElement];
    while (stack.length) {
      const el = stack.pop();
      if (!el) continue;
      if (el.shadowRoot) {
        roots.push(el.shadowRoot);
        stack.push(...el.shadowRoot.querySelectorAll('*'));
      }
      if (el.children) {
        for (const child of el.children) stack.push(child);
      }
    }
    return roots;
  }

  function scanRoot(root, onResolve) {
    const tokenFormat = format();
    if (!tokenFormat?.findAllInText) return;

    const treeRoot = root === document ? document.body : root;
    if (!treeRoot) return;

    const walker = document.createTreeWalker(treeRoot, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const value = node.nodeValue || '';
        if (!value.includes('[veil:')) return NodeFilter.FILTER_REJECT;
        if (shouldSkipTextNode(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
      const matches = tokenFormat.findAllInText(node.nodeValue || '');
      if (!matches.length) continue;
      decoratePlainTextNode(node, matches[0], onResolve);
    }

    const scope = root === document ? document : root;
    try {
      scope.querySelectorAll?.('.gst-veil-token-btn:not([data-gst-veil-wired])').forEach((button) => {
        const tokenId = button.dataset.veilTokenId
          || tokenFormat.parsePlaceholder(button.textContent || '')?.tokenId;
        if (tokenId) wireButton(button, tokenId, onResolve);
      });
    } catch {
      // Invalid selector in some frames.
    }
  }

  function scanDocument(onResolve) {
    for (const root of collectRoots()) {
      scanRoot(root, onResolve);
    }
  }

  function initVeilTokenDetector(getSettings, onResolve) {
    let enabled = true;
    let scheduled = false;

    async function refreshSettings() {
      const settings = await getSettings();
      enabled = settings.autoDetectVeilTokens !== false
        && global.GoldspireVeilTokens?.canUseTokens
        && (await global.GoldspireVeilTokens.canUseTokens(settings));
    }

    function scheduleScan() {
      if (!enabled || scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        if (enabled) scanDocument(onResolve);
      });
    }

    refreshSettings().then(scheduleScan).catch(() => {});

    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    try {
      global.GoldspireBrowser?.storage?.onChanged?.addListener((changes, area) => {
        try {
          if (area !== 'sync') return;
          if (changes.orgId || changes.orgProvisionSource || changes.autoDetectVeilTokens) {
            refreshSettings().then(scheduleScan).catch(() => {});
          }
        } catch {
          // Stale content script.
        }
      });
    } catch {
      // Storage listener unavailable.
    }

    return { scheduleScan, refreshSettings, observer };
  }

  global.GoldspireVeilTokenDetector = {
    initVeilTokenDetector,
    scanDocument,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
