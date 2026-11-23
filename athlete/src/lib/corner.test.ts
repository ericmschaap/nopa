import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysUntil, formatDate, shareLink, validateCorner } from './corner.ts';

const today = new Date(2026, 10, 23); // 23 November 2026

test('corners R1: a name and a future date are accepted', () => {
  assert.deepEqual(validateCorner({ name: ' Berlin Marathon ', day: '26', month: '9', year: '2027' }, today), {
    ok: true, name: 'Berlin Marathon', finishDate: '2027-09-26',
  });
});

test('corners R1: today is accepted as a finish date', () => {
  const r = validateCorner({ name: 'Goal', day: '23', month: '11', year: '2026' }, today);
  assert.equal(r.ok, true);
});

test('corners R1: an empty name is refused', () => {
  const r = validateCorner({ name: '   ', day: '26', month: '9', year: '2027' }, today);
  assert.deepEqual(r, { ok: false, error: 'Give your goal a name.' });
});

test('corners R1: a missing date is refused', () => {
  const r = validateCorner({ name: 'Goal', day: '', month: '9', year: '2027' }, today);
  assert.equal(r.ok, false);
});

test('corners R1: a malformed date is refused', () => {
  for (const [day, month, year] of [['31', '2', '2027'], ['0', '5', '2027'], ['10', '13', '2027'], ['x', '5', '2027'], ['1', '5', '27']]) {
    const r = validateCorner({ name: 'Goal', day, month, year }, today);
    assert.equal(r.ok, false, `${day}/${month}/${year}`);
  }
});

test('corners R1: a past date is refused', () => {
  const r = validateCorner({ name: 'Goal', day: '22', month: '11', year: '2026' }, today);
  assert.equal(r.ok, false);
});

test('share-links R1: link format is <SUPPORTER_URL>/?c=<token>', () => {
  assert.equal(shareLink('https://nopa.example', 'abc123'), 'https://nopa.example/?c=abc123');
  assert.equal(shareLink('https://nopa.example/', 'abc123'), 'https://nopa.example/?c=abc123');
  assert.equal(shareLink('https://x.github.io/nopa/supporter/', 'abc123'), 'https://x.github.io/nopa/supporter/?c=abc123');
});

test('dates are shown in words', () => {
  assert.equal(formatDate('2027-09-26'), '26 September 2027');
  assert.equal(daysUntil('2026-11-30', today), 7);
  assert.equal(daysUntil('2026-11-23', today), 0);
});
