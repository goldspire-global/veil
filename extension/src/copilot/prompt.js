/**
 * Veil copilot prompt — Encrypt / Mask / Allow (+ Tokenize stub).
 */
(function (global) {
  const PROMPT_ID = 'goldspire-veil-copilot';

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatCategoryLabel(category) {
    return String(category || 'sensitive data').replace(/_/g, ' ');
  }

  function removePrompt() {
    document.getElementById(PROMPT_ID)?.remove();
  }

  function showVeilCopilot({
    title = 'Veil detected sensitive data',
    subtitle = '',
    detections = [],
    actions = [],
    recommendedId = '',
    onAction,
    onDismiss,
    variant = 'default',
  }) {
    removePrompt();

    const categories = [...new Set(detections.map((d) => d.category).filter(Boolean))];
    const summary = categories.length
      ? categories.map(formatCategoryLabel).join(', ')
      : 'sensitive content';

    const overlay = document.createElement('div');
    overlay.id = PROMPT_ID;
    overlay.className = 'gst-overlay gst-overlay--veil';
    overlay.innerHTML = `
      <div class="gst-dialog gst-dialog--veil" role="dialog" aria-modal="true">
        <p class="gst-veil-kicker">Veil by Goldspire</p>
        <h2 class="gst-dialog__title">${escapeHtml(title)}</h2>
        ${subtitle ? `<p class="gst-veil-subtitle">${escapeHtml(subtitle)}</p>` : ''}
        <p class="gst-veil-summary">Detected: <strong>${escapeHtml(summary)}</strong></p>
        <div class="gst-veil-actions" data-veil-actions></div>
        <div class="gst-dialog__actions gst-veil-footer">
          <button type="button" class="gst-btn gst-btn--ghost" data-action="dismiss">Dismiss</button>
        </div>
      </div>
    `;

    const container = overlay.querySelector('[data-veil-actions]');
    for (const action of actions) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `gst-btn gst-veil-action${action.id === recommendedId ? ' gst-veil-action--recommended' : ''}${action.stub ? ' gst-veil-action--stub' : ''}`;
      btn.dataset.actionId = action.id;
      btn.disabled = action.stub || action.available === false;
      btn.innerHTML = `
        <span class="gst-veil-action__label">${escapeHtml(action.label)}</span>
        <span class="gst-veil-action__desc">${escapeHtml(action.description || '')}</span>
      `;
      if (action.stub) {
        btn.title = 'Coming soon';
      }
      container.appendChild(btn);
    }

    overlay.addEventListener('click', async (event) => {
      const actionBtn = event.target.closest('[data-action-id]');
      if (actionBtn) {
        const actionId = actionBtn.dataset.actionId;
        actionBtn.disabled = true;
        try {
          await onAction?.(actionId);
          removePrompt();
        } catch (error) {
          actionBtn.disabled = false;
          global.GoldspireSecureUI?.showToast?.(
            error instanceof Error ? error.message : 'Action failed.',
            'error',
          );
        }
        return;
      }
      if (event.target === overlay || event.target.closest('[data-action="dismiss"]')) {
        removePrompt();
        onDismiss?.();
      }
    });

    document.documentElement.appendChild(overlay);

    const primary = container.querySelector(`[data-action-id="${recommendedId}"]`)
      || container.querySelector('.gst-veil-action:not([disabled])');
    primary?.focus?.();

    if (variant === 'ai') {
      overlay.querySelector('.gst-dialog--veil')?.classList.add('gst-dialog--veil-ai');
    }
  }

  global.GoldspireVeilCopilotUI = {
    showVeilCopilot,
    removePrompt,
    formatCategoryLabel,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
