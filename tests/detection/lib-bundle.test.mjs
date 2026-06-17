import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadDetectionLib } from './load-lib.mjs';

const lib = loadDetectionLib();

test('luhnCheck accepts Visa test number', () => {
  assert.equal(lib.luhnCheck('4111111111111111'), true);
  assert.equal(lib.luhnCheck('4111 1111 1111 1111'), true);
});

test('luhnCheck rejects invalid card number', () => {
  assert.equal(lib.luhnCheck('4111111111111112'), false);
  assert.equal(lib.luhnCheck('12345'), false);
});

test('findCreditCards detects grouped and continuous numbers', () => {
  const grouped = lib.findCreditCards('Card: 4111 1111 1111 1111 please');
  const continuous = lib.findCreditCards('4111111111111111');
  assert.equal(grouped.length, 1);
  assert.equal(continuous.length, 1);
  assert.equal(grouped[0].category, 'credit_card');
  assert.equal(grouped[0].severity, 'high');
  assert.ok(grouped[0].confidence >= 85);
  assert.ok(grouped[0].matchedText.includes('1111'));
  assert.equal('matchedTextRaw' in grouped[0], true);
});

test('findJwts detects standard JWT shape', () => {
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const hits = lib.findJwts(token);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].category, 'jwt');
  assert.ok(hits[0].confidence >= 90);
});

test('findApiKeys detects common prefixes', () => {
  const hits = lib.findApiKeys('key sk-abcdefghijklmnopqrstuvwxyz123456');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].category, 'api_key');
  assert.ok(hits[0].confidence >= 90);
});

test('isSensitiveSelectionText uses detectors and legacy heuristics', () => {
  assert.equal(lib.isSensitiveSelectionText('4111111111111111'), true);
  assert.equal(lib.isSensitiveSelectionText('Password1'), true);
  assert.equal(lib.isSensitiveSelectionText('hi'), false);
});
