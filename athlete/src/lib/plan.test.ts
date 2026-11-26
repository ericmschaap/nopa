import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays, calendarDays, dayLabel, dotsByDay, howLong, monthsShown, notesForSession, sessionPhrase, togetherLines, weekDots,
  type PlanNote, type PlanSession,
} from './plan.ts';

const today = '2026-11-26'; // a Thursday
const s = (id: string, day: string, kind: PlanSession['kind'] = 'easy', minutes = 30): PlanSession => ({ id, day, kind, minutes });
const note = (id: string, session_id: string | null, created_at: string, heard_at: string | null = null): PlanNote => ({ id, session_id, sender_name: id, created_at, heard_at });

test('plan R5: the calendar shows five whole weeks from this Monday', () => {
  const days = calendarDays(today);
  assert.equal(days.length, 35);
  assert.equal(days[0], '2026-11-23');
  assert.equal(days[3], today);
  assert.equal(days[34], '2026-12-27');
  assert.equal(monthsShown(days), 'November – December');
});

test('days are named the way people say them', () => {
  assert.equal(dayLabel(today, today), 'Today');
  assert.equal(dayLabel(addDays(today, 1), today), 'Tomorrow');
  assert.equal(dayLabel(addDays(today, 2), today), 'Saturday');
  assert.equal(dayLabel(addDays(today, 9), today), 'Saturday 5 December');
  assert.equal(sessionPhrase(s('a', addDays(today, 2), 'hard'), today), "Saturday's hard one");
  assert.equal(sessionPhrase(s('a', today, 'easy'), today), "today's easy one");
  assert.equal(howLong(45), '45 minutes');
  assert.equal(howLong(75), '1 hour 15');
  assert.equal(howLong(120), '2 hours');
});

test('session-playback R2: a session plays the messages left for it and the any-time ones, oldest first', () => {
  const sessions = [s('thu', today), s('sat', addDays(today, 2))];
  const notes = [
    note('for-sat', 'sat', '2026-11-20T10:00:00Z'),
    note('any', null, '2026-11-21T10:00:00Z'),
    note('for-thu-2', 'thu', '2026-11-22T10:00:00Z'),
    note('for-thu-1', 'thu', '2026-11-19T10:00:00Z'),
    note('heard', 'thu', '2026-11-18T10:00:00Z', '2026-11-25T08:00:00Z'),
  ];
  assert.deepEqual(notesForSession(sessions[0], sessions, notes).map((x) => x.id), ['for-thu-1', 'any', 'for-thu-2']);
});

test('session-playback R2: messages from a skipped or cut-short day come along to the next session', () => {
  const sessions = [s('tue', addDays(today, -2)), s('thu', today), s('sat', addDays(today, 2))];
  const notes = [note('missed', 'tue', '2026-11-20T10:00:00Z'), note('gone-day', 'deleted-session', '2026-11-21T10:00:00Z'), note('later', 'sat', '2026-11-22T10:00:00Z')];
  assert.deepEqual(notesForSession(sessions[1], sessions, notes).map((x) => x.id), ['missed', 'gone-day']);
  assert.deepEqual(notesForSession(sessions[2], sessions, notes).map((x) => x.id), ['missed', 'gone-day', 'later']);
});

test('plan R5: dots show messages waiting per day; carried-over ones sit on the next session', () => {
  const sessions = [s('tue', addDays(today, -2)), s('thu', today), s('sat', addDays(today, 2)), s('sun', addDays(today, 3))];
  const notes = [
    note('a', 'sat', '2026-11-20T10:00:00Z'), note('b', 'sat', '2026-11-20T11:00:00Z'),
    note('missed', 'tue', '2026-11-19T10:00:00Z'), note('any', null, '2026-11-19T11:00:00Z'),
    note('heard', 'tue', '2026-11-18T10:00:00Z', new Date(2026, 10, 24, 9, 0).toISOString()),
  ];
  const dots = dotsByDay(sessions, notes, today);
  assert.deepEqual(dots[today], { waiting: 2, heard: 0 });
  assert.deepEqual(dots[addDays(today, 2)], { waiting: 2, heard: 0 });
  assert.equal(dots[addDays(today, 3)], undefined); // a session with no one yet
  assert.deepEqual(dots['2026-11-24'], { waiting: 0, heard: 1 });
});

test('streak R4: weeks side by side, in words, for the athlete', () => {
  assert.deepEqual(togetherLines(3, false), { head: '3 weeks side by side', sub: 'Someone has been with you every week for 3 weeks. This week is still open.' });
  assert.deepEqual(togetherLines(3, true), { head: '3 weeks side by side', sub: 'Someone has been with you every week for 3 weeks.' });
  assert.deepEqual(togetherLines(1, true), { head: 'One week side by side', sub: 'Someone has been with you this week.' });
  assert.deepEqual(togetherLines(0, false), { head: 'No one yet', sub: 'Send your link to the people close to you.' });
});

test('streak R4: weeks side by side, in words, for a supporter, naming the athlete', () => {
  assert.equal(togetherLines(2, false, 'Sam').sub, 'Someone has been there for Sam every week for 2 weeks. This week is still open. Will it be you?');
  assert.equal(togetherLines(3, true, 'Sam').sub, 'Someone has been there for Sam every week for 3 weeks, this week too.');
  assert.deepEqual(togetherLines(0, false, 'Sam'), { head: 'Be the first one there', sub: 'One message from you and Sam is not doing this alone.' });
});

test('streak R4: one dot per week, the last one is this week', () => {
  assert.deepEqual(weekDots(2, false), [true, true, false]);
  assert.deepEqual(weekDots(3, true), [true, true, true]);
  assert.deepEqual(weekDots(0, false), [false]);
  assert.equal(weekDots(40, true).length, 12);
});
