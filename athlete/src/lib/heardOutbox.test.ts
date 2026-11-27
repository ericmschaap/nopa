import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHeardOutbox, type HeardMark } from './heardOutbox.ts';

function setup(initial: HeardMark[] = []) {
  let stored = initial;
  let online = true;
  const sent: HeardMark[] = [];
  const gone = new Set<string>();
  const outbox = createHeardOutbox({
    load: async () => stored,
    save: async (m) => { stored = m; },
    send: async (m) => {
      if (!online) throw new Error('offline');
      if (gone.has(m.noteId)) return 'gone';
      sent.push(m);
      return 'ok';
    },
  });
  return { outbox, sent, gone, stored: () => stored, setOnline: (v: boolean) => { online = v; } };
}

const at = new Date('2026-11-23T10:00:00.000Z');

test('heard-tracking R1: a heard note is sent with the time it was heard', async () => {
  const t = setup();
  await t.outbox.add('n1', at);
  assert.equal(await t.outbox.flush(), 0);
  assert.deepEqual(t.sent, [{ noteId: 'n1', heardAt: '2026-11-23T10:00:00.000Z' }]);
  assert.deepEqual(t.stored(), []);
});

test('heard-tracking R3: with no signal the mark is kept, then sent later with its original time', async () => {
  const t = setup();
  t.setOnline(false);
  await t.outbox.add('n1', at);
  assert.equal(await t.outbox.flush(), 1);
  assert.deepEqual(t.sent, []);
  assert.deepEqual(t.stored(), [{ noteId: 'n1', heardAt: '2026-11-23T10:00:00.000Z' }]);
  assert.deepEqual(await t.outbox.pendingIds(), ['n1']);

  t.setOnline(true);
  assert.equal(await t.outbox.flush(), 0);
  assert.deepEqual(t.sent, [{ noteId: 'n1', heardAt: '2026-11-23T10:00:00.000Z' }]);
  assert.deepEqual(await t.outbox.pendingIds(), []);
});

test('heard-tracking R3: marks saved before the app was closed are sent on the next launch', async () => {
  const t = setup([{ noteId: 'old', heardAt: '2026-11-20T08:00:00.000Z' }]);
  assert.deepEqual(await t.outbox.pendingIds(), ['old']);
  await t.outbox.flush();
  assert.deepEqual(t.sent, [{ noteId: 'old', heardAt: '2026-11-20T08:00:00.000Z' }]);
});

test('heard-tracking R4: the same note is only recorded once, first time wins', async () => {
  const t = setup();
  t.setOnline(false);
  await t.outbox.add('n1', at);
  await t.outbox.add('n1', new Date('2026-11-23T11:00:00.000Z'));
  assert.deepEqual(t.stored(), [{ noteId: 'n1', heardAt: '2026-11-23T10:00:00.000Z' }]);
});

test('a mark the server refuses for good is dropped, the rest still go', async () => {
  const t = setup();
  t.gone.add('deleted');
  await t.outbox.add('deleted', at);
  await t.outbox.add('n2', at);
  assert.equal(await t.outbox.flush(), 0);
  assert.deepEqual(t.sent.map((m) => m.noteId), ['n2']);
});

test('adds and flushes that overlap do not lose marks', async () => {
  const t = setup();
  await Promise.all([t.outbox.add('a', at), t.outbox.flush(), t.outbox.add('b', at), t.outbox.add('c', at), t.outbox.flush()]);
  await t.outbox.flush();
  assert.deepEqual(t.sent.map((m) => m.noteId).sort(), ['a', 'b', 'c']);
  assert.deepEqual(t.stored(), []);
});
