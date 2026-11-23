import { test } from 'node:test';
import assert from 'node:assert/strict';
import { streakLines } from './streak.ts';

test('streak R4: a running streak with this week still open', () => {
  assert.deepEqual(streakLines({ streakWeeks: 3, thisWeekKept: false }), {
    headline: 'Your corner has shared 3 weeks in a row',
    detail: 'A note from anyone this week keeps it going.',
  });
});

test('streak R4: this week already kept', () => {
  assert.equal(streakLines({ streakWeeks: 3, thisWeekKept: true }).detail, 'This week is already part of it.');
  assert.equal(streakLines({ streakWeeks: 1, thisWeekKept: true }).headline, 'Your corner has shared 1 week');
});

test('streak R4: no streak yet is said gently', () => {
  assert.equal(streakLines({ streakWeeks: 0, thisWeekKept: false }).headline, 'Your corner is just getting started');
});

test('streak R3: the words never mention a person or a per-person count', () => {
  for (const s of [{ streakWeeks: 0, thisWeekKept: false }, { streakWeeks: 5, thisWeekKept: true }, { streakWeeks: 5, thisWeekKept: false }]) {
    const { headline, detail } = streakLines(s);
    assert.doesNotMatch(headline + detail, /each|per person|top|most/i);
  }
});
