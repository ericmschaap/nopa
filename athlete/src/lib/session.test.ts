import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Session, type AudioPort, type PlayResult, type SessionNote } from './session.ts';

const MIN = 60_000;
const note = (id: string, senderName = id): SessionNote => ({ id, senderName, uri: `file:///${id}.wav`, durationMs: 20_000 });
const settle = () => new Promise((r) => setImmediate(r));

/** A fake audio layer: records what happened and lets the test finish notes by hand. */
function fakeAudio() {
  const log: string[] = [];
  let finishCurrent: ((r: PlayResult) => void) | null = null;
  const port: AudioPort = {
    start: async () => { log.push('start'); },
    playNote: (n) => {
      assert.equal(finishCurrent, null, 'two notes must never play at once');
      log.push(`play:${n.id}`);
      return new Promise<PlayResult>((resolve) => { finishCurrent = (r) => { finishCurrent = null; resolve(r); }; });
    },
    stopNote: () => { log.push('stopNote'); finishCurrent?.('stopped'); },
    stop: async () => { log.push('stop'); },
  };
  return { port, log, finish: (r: PlayResult = 'finished') => finishCurrent?.(r), isPlaying: () => finishCurrent !== null };
}

function setup(notes: SessionNote[], minutes: number) {
  const audio = fakeAudio();
  let now = 1_000_000;
  const played: { id: string; at: number }[] = [];
  const session = new Session({
    notes, durationMs: minutes * MIN, audio: audio.port, now: () => now, autoTick: false,
    onNotePlayed: (n, at) => played.push({ id: n.id, at: at.getTime() }),
  });
  const at = async (minute: number) => { now = 1_000_000 + minute * MIN; void session.tick(); await settle(); };
  return { session, audio, played, at, start: 1_000_000 };
}

test('session-playback R2: nothing plays at the start; notes play at their due times, oldest first', async () => {
  const t = setup([note('a'), note('b'), note('c')], 40);
  await t.session.start();
  await t.at(0);
  await t.at(9.9);
  assert.deepEqual(t.audio.log, ['start']);

  await t.at(10);
  assert.deepEqual(t.audio.log, ['start', 'play:a']);
  t.audio.finish(); await settle();

  await t.at(19);
  assert.equal(t.audio.isPlaying(), false);
  await t.at(20);
  assert.equal(t.audio.log.at(-1), 'play:b');
  t.audio.finish(); await settle();

  await t.at(30);
  assert.equal(t.audio.log.at(-1), 'play:c');
});

test('session-playback R2: 1 note in 30 minutes plays at 15 minutes', async () => {
  const t = setup([note('a')], 30);
  await t.session.start();
  await t.at(14.9);
  assert.equal(t.audio.isPlaying(), false);
  await t.at(15);
  assert.equal(t.audio.log.at(-1), 'play:a');
});

test('session-playback R2: a note due while another plays waits, then plays straight after', async () => {
  // 3 notes in 2 minutes: due at 0.5, 1.0, 1.5 min.
  const t = setup([note('a'), note('b'), note('c')], 2);
  await t.session.start();
  await t.at(0.5);
  assert.equal(t.audio.log.at(-1), 'play:a');
  await t.at(1.2); // b is overdue, a still playing: nothing new starts (fake asserts no overlap)
  assert.deepEqual(t.audio.log, ['start', 'play:a']);
  t.audio.finish(); await settle();
  assert.equal(t.audio.log.at(-1), 'play:b'); // straight after, without waiting for a tick
});

test('a late tick (phone was busy) still plays the note', async () => {
  const t = setup([note('a')], 30);
  await t.session.start();
  await t.at(22);
  assert.equal(t.audio.log.at(-1), 'play:a');
});

test('session-playback R6: ends by itself after the last note; reports what played and when', async () => {
  const t = setup([note('a'), note('b')], 30);
  await t.session.start();
  await t.at(10); t.audio.finish(); await settle();
  await t.at(20);
  await t.at(20.5); t.audio.finish(); await settle();

  const s = t.session.getState();
  assert.equal(s.status, 'ended');
  assert.equal(s.completed, true);
  assert.deepEqual(s.playedIds, ['a', 'b']);
  assert.deepEqual(t.played, [{ id: 'a', at: t.start + 10 * MIN }, { id: 'b', at: t.start + 20.5 * MIN }]);
  assert.equal(t.audio.log.at(-1), 'stop');
});

test('session-playback R6: ending early stops playback; unplayed and interrupted notes are not reported', async () => {
  const t = setup([note('a'), note('b'), note('c')], 40);
  await t.session.start();
  await t.at(10); t.audio.finish(); await settle();
  await t.at(20); // b is playing
  await t.session.end(); await settle();

  const s = t.session.getState();
  assert.equal(s.status, 'ended');
  assert.equal(s.completed, false);
  assert.deepEqual(s.playedIds, ['a']);
  assert.deepEqual(t.played.map((p) => p.id), ['a']);
  assert.deepEqual(t.audio.log.slice(-2), ['stopNote', 'stop']);

  await t.at(30); // nothing more happens after the end
  assert.deepEqual(t.audio.log.filter((l) => l.startsWith('play:')), ['play:a', 'play:b']);
});

test('a note that fails to play is skipped and not reported; the session carries on', async () => {
  const t = setup([note('a'), note('b')], 30);
  await t.session.start();
  await t.at(10); t.audio.finish('failed'); await settle();
  await t.at(20); t.audio.finish(); await settle();
  assert.deepEqual(t.session.getState().playedIds, ['b']);
  assert.equal(t.session.getState().status, 'ended');
});
