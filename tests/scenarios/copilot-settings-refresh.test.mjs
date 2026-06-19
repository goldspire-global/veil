import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';
import { loadExtensionModule, loadVeilStack, repoRoot } from './helpers.mjs';
import { stripeLiveSample, whsecSample } from './fixtures.mjs';

test('findApiKeys detects Stripe sk_live and whsec prefixes', () => {
  const libPath = join(repoRoot, 'extension/src/detection/lib-bundle.js');
  const g = { globalThis: {} };
  vm.runInNewContext(readFileSync(libPath, 'utf8'), g);
  const lib = g.globalThis.GoldspireDetectionLib || g.GoldspireDetectionLib;

  const sk = lib.findApiKeys(`key: ${stripeLiveSample()}`);
  assert.ok(sk.some((hit) => hit.matchedTextRaw.startsWith('sk_live_')));

  const whsec = lib.findApiKeys(whsecSample());
  assert.ok(whsec.some((hit) => hit.matchedTextRaw.startsWith('whsec_')));
});

test('clearCompositionAllows re-enables copilot on a previously allowed field', () => {
  const g = loadExtensionModule('extension/src/copilot/snooze.js');
  const field = { id: 'notes' };
  const sample = stripeLiveSample();
  const fieldState = { element: field, text: sample };
  const match = { raw: sample };

  g.GoldspireVeilSnooze.allowComposition('partner.microsoft.com', fieldState.text, match, fieldState);
  assert.equal(
    g.GoldspireVeilSnooze.isCompositionAllowed('partner.microsoft.com', fieldState.text, match, fieldState),
    true,
  );

  g.GoldspireVeilSnooze.clearCompositionAllows();
  assert.equal(
    g.GoldspireVeilSnooze.isCompositionAllowed('partner.microsoft.com', fieldState.text, match, fieldState),
    false,
  );
});

test('journey: typing sk_live triggers copilot after settings cache refresh', async () => {
  const g = loadVeilStack();
  let prompted = false;
  g.GoldspireVeilCopilotUI = {
    showVeilCopilot: ({ onDismiss }) => {
      prompted = true;
      onDismiss?.();
    },
  };

  const apiKey = stripeLiveSample();
  const input = {
    tagName: 'TEXTAREA',
    value: apiKey,
    dispatchEvent() {},
    focus() {},
    setSelectionRange() {},
  };

  let settings = { copilotEnabled: false, dlpMode: 'off' };
  const getSettingsSync = () => settings;
  const getSettings = async () => settings;

  await g.GoldspirePasteObserve.scanTypedField(
    input,
    getSettings,
    getSettingsSync,
    () => true,
  );
  assert.equal(prompted, false);

  settings = { copilotEnabled: true, dlpMode: 'off' };
  g.GoldspirePasteObserve.resetPromptState?.();

  await g.GoldspirePasteObserve.scanTypedField(
    input,
    getSettings,
    getSettingsSync,
    () => true,
  );
  assert.equal(prompted, true);
});
