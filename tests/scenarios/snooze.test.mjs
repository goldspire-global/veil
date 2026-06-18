import test from 'node:test';
import assert from 'node:assert/strict';
import { loadExtensionModule } from './helpers.mjs';

test('allowComposition skips further copilot prompts in the same field', () => {
  const g = loadExtensionModule('extension/src/copilot/snooze.js');
  const field = { id: 'email-input' };
  const fieldState = { element: field, text: 'support@goldspireventures.com' };
  const match = { raw: 'support@goldspireventures.com' };

  assert.equal(
    g.GoldspireVeilSnooze.isCompositionAllowed('partner.microsoft.com', fieldState.text, match, fieldState),
    false,
  );

  g.GoldspireVeilSnooze.allowComposition('partner.microsoft.com', fieldState.text, match, fieldState);

  assert.equal(
    g.GoldspireVeilSnooze.isCompositionAllowed(
      'partner.microsoft.com',
      'support@goldspireventures.com"',
      { raw: 'support@goldspireventures.com"' },
      { element: field, text: 'support@goldspireventures.com"' },
    ),
    true,
  );
});

test('allowComposition does not apply to a different field on the same page', () => {
  const g = loadExtensionModule('extension/src/copilot/snooze.js');
  const emailField = { id: 'email' };
  const phoneField = { id: 'phone' };

  g.GoldspireVeilSnooze.allowComposition(
    'partner.microsoft.com',
    'support@goldspireventures.com',
    { raw: 'support@goldspireventures.com' },
    { element: emailField, text: 'support@goldspireventures.com' },
  );

  assert.equal(
    g.GoldspireVeilSnooze.isCompositionAllowed(
      'partner.microsoft.com',
      '+447466771988',
      { raw: '+447466771988' },
      { element: phoneField, text: '+447466771988' },
    ),
    false,
  );
});
