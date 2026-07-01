/**
 * On-page coachmarks — complements popup tour after first setup.
 */
(function (global) {
  const TOUR_KEY = 'pageTourComplete';
  let active = false;
  let stepIndex = 0;
  let overlay = null;

  function steps() {
    return [
      {
        target: '#goldspire-selection-status',
        title: 'Selection bar',
        body: 'Highlight sensitive text on any page. Quick secures with your saved passphrase; Options opens advanced choices.',
        prime: (pill) => {
          if (!pill) return;
          pill.classList.add('gst-selection-status--visible');
        },
      },
      {
        target: '#goldspire-selection-status .gst-pill-split',
        title: 'Quick secure',
        body: 'One click replaces the selection with [redacted]. Use the keyboard shortcut anytime — shown in the extension Help tab.',
      },
      {
        title: 'Paste copilot',
        body: 'When you paste a secret, Veil offers Secure or Mask inline. It stays quiet on signup forms and respects Allow / Always on this site.',
      },
    ];
  }

  function removeOverlay() {
    overlay?.remove();
    overlay = null;
    document.querySelectorAll('.gst-tour-highlight').forEach((el) => {
      el.classList.remove('gst-tour-highlight');
    });
  }

  function markComplete() {
    try {
      global.chrome?.storage?.sync?.set?.({ [TOUR_KEY]: true });
    } catch {
      // Non-critical.
    }
  }

  function renderStep(allSteps) {
    removeOverlay();
    const step = allSteps[stepIndex];
    if (!step) return;

    const target = step.target ? document.querySelector(step.target) : null;
    step.prime?.(target);

    if (target) {
      target.classList.add('gst-tour-highlight');
      target.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }

    overlay = document.createElement('div');
    overlay.className = 'gst-page-tour';
    overlay.setAttribute('role', 'dialog');
    overlay.innerHTML = `
      <div class="gst-page-tour__card">
        <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#f0c14b;text-transform:uppercase">On-page tour · ${stepIndex + 1}/${allSteps.length}</p>
        <h2>${escapeHtml(step.title)}</h2>
        <p>${escapeHtml(step.body)}</p>
        <div class="gst-page-tour__actions">
          <button type="button" class="gst-page-tour__btn gst-page-tour__btn--ghost" data-tour-skip>Skip</button>
          <button type="button" class="gst-page-tour__btn gst-page-tour__btn--primary" data-tour-next>${stepIndex + 1 >= allSteps.length ? 'Done' : 'Next'}</button>
        </div>
      </div>
    `;
    document.documentElement.appendChild(overlay);

    overlay.querySelector('[data-tour-skip]')?.addEventListener('click', () => finish(true));
    overlay.querySelector('[data-tour-next]')?.addEventListener('click', () => {
      stepIndex += 1;
      if (stepIndex >= allSteps.length) finish(true);
      else renderStep(allSteps);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function finish(marked = false) {
    active = false;
    removeOverlay();
    if (marked) markComplete();
  }

  function start({ force = false } = {}) {
    if (active) return;
    if (!force) {
      global.chrome?.storage?.sync?.get?.({ [TOUR_KEY]: false, setupComplete: true }, (result) => {
        if (global.chrome?.runtime?.lastError) return;
        if (!result?.setupComplete || result?.[TOUR_KEY] === true) return;
        active = true;
        stepIndex = 0;
        renderStep(steps());
      });
      return;
    }
    active = true;
    stepIndex = 0;
    renderStep(steps());
  }

  global.GoldspireContentTour = {
    TOUR_KEY,
    start,
    finish,
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
