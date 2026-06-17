import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import vm from 'node:vm';
import { loadDetectionLib } from './load-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const lib = loadDetectionLib();

function loadScoring() {
  const sandbox = { globalThis: {} };
  vm.runInNewContext(readFileSync(join(root, 'extension/src/detection/scoring.js'), 'utf8'), sandbox);
  return sandbox.globalThis.GoldspireScoring;
}

test('findEmails detects addresses and skips example.com', () => {
  const hits = lib.findEmails('Contact alice@company.com or test@example.com');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].category, 'email');
  assert.ok(hits[0].matchedText.includes('@company.com'));
});

test('findEmails lowers confidence in email fields', () => {
  const hits = lib.findEmails('alice@company.com', { fieldType: 'email', isEmailField: true });
  assert.equal(hits.length, 0);
});

test('findPhones detects US numbers', () => {
  const hits = lib.findPhones('Call (555) 123-4567 today');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].category, 'phone');
});

test('findPasswords boosts confidence in password fields', () => {
  const plain = lib.findPasswords('MyPassw0rd!');
  const field = lib.findPasswords('MyPassw0rd!', { isPasswordField: true });
  assert.equal(plain.length, 1);
  assert.equal(field.length, 1);
  assert.ok(field[0].confidence > plain[0].confidence);
  assert.equal(field[0].severity, 'high');
});

test('scoring boosts severity for AI prompt context', () => {
  const scoring = loadScoring();
  const scored = scoring.scoreOne(
    { category: 'email', confidence: 80, matchedText: 'a***@b.com', severity: 'medium' },
    { source: 'ai_prompt', isAiSurface: true },
  );
  assert.equal(scored.severity, 'high');
});

test('analyzeAll aggregates active detectors', () => {
  const text = 'alice@company.com 4111111111111111 MyPassw0rd!';
  const hits = lib.analyzeAll(text);
  const categories = new Set(hits.map((hit) => hit.category));
  assert.ok(categories.has('email'));
  assert.ok(categories.has('credit_card'));
  assert.ok(categories.has('password'));
});
