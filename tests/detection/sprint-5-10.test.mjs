import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function loadStack(extra = {}) {
  const g = {
    GoldspireSettings: {
      isVeilActive: (s) => s?.copilotEnabled === true || s?.dlpMode === 'observe' || s?.dlpMode === 'enforce',
      normalizeDlpMode: (v) => String(v || 'off').toLowerCase(),
    },
    GoldspireScoring: {
      highestSeverity: (results) =>
        results.reduce((max, entry) => {
          const order = { low: 0, medium: 1, high: 2, critical: 3 };
          return order[entry.severity] > order[max] ? entry.severity : max;
        }, 'low'),
    },
    ...extra,
  };

  for (const relativePath of [
    'extension/src/detection/lib-bundle.js',
    'extension/src/policy/schema.js',
    'extension/src/policy/engine.js',
    'extension/src/actions/mask-text.js',
    'extension/src/actions/registry.js',
    'extension/src/copilot/controller.js',
    'extension/src/ai/framework.js',
  ]) {
    vm.runInNewContext(readFileSync(join(root, relativePath), 'utf8'), { globalThis: g });
  }
  return g;
}

test('copilot lists encrypt mask allow for paste context', () => {
  const g = loadStack();
  const actions = g.GoldspireVeilCopilot.listCopilotActions(
    { source: 'paste' },
    { copilotEnabled: true },
    [{ category: 'credit_card', confidence: 90 }],
  );
  const ids = actions.map((a) => a.id);
  assert.ok(ids.includes('encrypt'));
  assert.ok(ids.includes('mask'));
  assert.ok(ids.includes('ignore'));
});

test('copilot lists sanitize continue on AI surfaces', () => {
  const g = loadStack();
  const actions = g.GoldspireVeilCopilot.listCopilotActions(
    { source: 'ai_prompt', isAiSurface: true },
    { copilotEnabled: true },
    [{ category: 'jwt', confidence: 95 }],
  );
  const labels = actions.map((a) => a.label);
  assert.ok(labels.includes('Sanitize'));
  assert.ok(labels.includes('Continue'));
});

test('policy engine blocks api keys when enforce enabled', () => {
  const g = loadStack();
  const result = g.GoldspirePolicyEngine.evaluate(
    [{ category: 'api_key', severity: 'critical', confidence: 95 }],
    { source: 'paste' },
    { dlpMode: 'enforce', dlpPolicy: { enabled: true } },
  );
  assert.equal(result.enforced, true);
  assert.equal(result.action, 'block');
});

test('policy engine observe mode allows with suggestion', () => {
  const g = loadStack();
  const result = g.GoldspirePolicyEngine.evaluate(
    [{ category: 'credit_card', severity: 'high', confidence: 90 }],
    { source: 'paste' },
    { dlpMode: 'observe', copilotEnabled: false },
  );
  assert.equal(result.action, 'allow');
  assert.equal(result.observeOnly, true);
  assert.ok(result.suggestedAction);
});

test('policy engine auto_mask when category rule says so', () => {
  const g = loadStack();
  const policy = g.GoldspireDlpSchema.normalizePolicy({
    enabled: true,
    categories: {
      credit_card: { action: 'auto_mask', minSeverity: 'medium' },
    },
  });
  const result = g.GoldspirePolicyEngine.evaluate(
    [{ category: 'credit_card', severity: 'high', confidence: 90 }],
    { source: 'paste' },
    { dlpMode: 'enforce', dlpPolicy: policy },
  );
  assert.equal(result.action, 'auto_mask');
});

test('AI framework matches chatgpt host', () => {
  const g = loadStack();
  vm.runInNewContext(readFileSync(join(root, 'extension/src/ai/chatgpt.js'), 'utf8'), { globalThis: g });
  const adapter = g.GoldspireAiFramework.matchAdapter({ hostname: 'chatgpt.com' });
  assert.equal(adapter?.id, 'chatgpt');
});

test('DLP schema normalizes unknown actions to fallback', () => {
  const g = loadStack();
  const policy = g.GoldspireDlpSchema.normalizePolicy({
    defaultAction: 'not-real',
    categories: { pii: { action: 'nope' } },
  });
  assert.equal(policy.defaultAction, 'warn');
  assert.equal(policy.categories.pii.action, 'warn');
});
