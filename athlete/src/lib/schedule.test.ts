import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeWait, planOffsets } from './schedule.ts';

const MIN = 60_000;

test('session-playback R2: 3 notes in 40 minutes are due at 10, 20 and 30 minutes', () => {
  assert.deepEqual(planOffsets(3, 40 * MIN), [10 * MIN, 20 * MIN, 30 * MIN]);
});

test('session-playback R2: 1 note in 30 minutes is due at 15 minutes', () => {
  assert.deepEqual(planOffsets(1, 30 * MIN), [15 * MIN]);
});

test('session-playback R2: nothing is ever due at the start or bunched together', () => {
  for (const n of [1, 2, 5, 12, 40]) {
    for (const minutes of [20, 45, 120]) {
      const d = minutes * MIN;
      const offsets = planOffsets(n, d);
      const gap = d / (n + 1);
      assert.equal(offsets.length, n);
      assert.ok(offsets[0] >= gap - 1, 'first note waits a full gap');
      assert.ok(offsets[n - 1] < d, 'last note is before the end');
      for (let i = 1; i < n; i++) assert.ok(Math.abs(offsets[i] - offsets[i - 1] - gap) <= 1, 'even gaps');
    }
  }
});

test('no notes, no plan', () => {
  assert.deepEqual(planOffsets(0, 30 * MIN), []);
});

test('waits are described roughly', () => {
  assert.equal(describeWait(30_000), 'in under a minute');
  assert.equal(describeWait(12.4 * MIN), 'in about 12 min');
});
