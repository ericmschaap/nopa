// Database-level checks of the server rules, run against the local Supabase stack:
//   npm run db:test
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { admin, api, day, getNote, makeWav, newAthlete, newAudioPath, rpc, seedCorner, seedSession, sendNote, uploadAudio } from './helpers.mjs';

describe('share-links: what a link reveals', () => {
  test('R2: a token gives the goal name and finish date', async () => {
    const corner = await seedCorner(await newAthlete(), { name: 'Berlin Marathon', finish_date: '2027-09-26' });
    const r = await rpc('get_corner_by_token', { p_token: corner.share_token });
    assert.equal(r.status, 200);
    assert.equal(r.json.length, 1);
    assert.equal(r.json[0].name, 'Berlin Marathon');
    assert.equal(r.json[0].finish_date, '2027-09-26');
  });

  test('R3: an unknown token gives nothing', async () => {
    const r = await rpc('get_corner_by_token', { p_token: 'nope' });
    assert.deepEqual(r.json, []);
  });

  test('R4: the link exposes no ids, notes, names or contacts', async () => {
    const corner = await seedCorner(await newAthlete());
    await sendNote(corner, 'Anna');
    const r = await rpc('get_corner_by_token', { p_token: corner.share_token });
    for (const key of Object.keys(r.json[0])) {
      assert.ok(['name', 'athlete_name', 'finish_date', 'streak_weeks', 'this_week_kept'].includes(key), `unexpected field ${key}`);
    }
    for (const table of ['corners', 'notes', 'note_contacts']) {
      const t = await api(`/rest/v1/${table}?select=*`);
      assert.ok(!t.ok || t.json.length === 0, `anon can read ${table}`);
    }
  });
});

describe('recording: sending a note with no account', () => {
  test('R2: a note is stored against the corner with the first name', async () => {
    const corner = await seedCorner(await newAthlete());
    const id = await sendNote(corner, '  Anna ');
    const note = await getNote(id);
    assert.equal(note.corner_id, corner.id);
    assert.equal(note.sender_name, 'Anna');
    assert.equal(note.heard_at, null);
  });

  test('R2: no first name, nothing stored', async () => {
    const corner = await seedCorner(await newAthlete());
    const path = newAudioPath();
    await uploadAudio(path, makeWav());
    const r = await rpc('submit_note', { p_token: corner.share_token, p_sender_name: '  ', p_audio_path: path, p_duration_ms: 1000 });
    assert.equal(r.ok, false);
    assert.match(r.json.message, /sender_name_required/);
  });

  test('a note needs a real corner and a real upload', async () => {
    const corner = await seedCorner(await newAthlete());
    const path = newAudioPath();
    await uploadAudio(path, makeWav());
    const bad = await rpc('submit_note', { p_token: 'nope', p_sender_name: 'Anna', p_audio_path: path, p_duration_ms: 1000 });
    assert.match(bad.json.message, /corner_not_found/);
    const noFile = await rpc('submit_note', { p_token: corner.share_token, p_sender_name: 'Anna', p_audio_path: newAudioPath(), p_duration_ms: 1000 });
    assert.match(noFile.json.message, /audio_not_found/);
    const tooLong = await rpc('submit_note', { p_token: corner.share_token, p_sender_name: 'Anna', p_audio_path: path, p_duration_ms: 120000 });
    assert.equal(tooLong.ok, false);
  });

  test('R5: only WAV files in inbox/ are accepted, and anon cannot read them back', async () => {
    const path = newAudioPath();
    assert.equal((await uploadAudio(path, makeWav())).ok, true);
    assert.equal((await uploadAudio('elsewhere/x.wav', makeWav())).ok, false);
    assert.equal((await uploadAudio(newAudioPath(), makeWav(), { headers: { 'content-type': 'video/mp4' } })).ok, false);
    assert.equal((await api(`/storage/v1/object/notes/${path}`)).ok, false);
    assert.equal((await uploadAudio(path, makeWav(), { headers: { 'x-upsert': 'true' } })).ok, false);
  });

  test('R3: an optional contact is stored against the note', async () => {
    const corner = await seedCorner(await newAthlete());
    const id = await sendNote(corner);
    const r = await rpc('add_note_contact', { p_note_id: id, p_contact: 'anna@example.com' });
    assert.equal(r.ok, true);
    const stored = await admin(`/rest/v1/note_contacts?note_id=eq.${id}`);
    assert.equal(stored.json[0].contact, 'anna@example.com');
  });

  test('R3: skipping the contact leaves the note with none', async () => {
    const corner = await seedCorner(await newAthlete());
    const id = await sendNote(corner);
    const stored = await admin(`/rest/v1/note_contacts?note_id=eq.${id}`);
    assert.deepEqual(stored.json, []);
    assert.ok(await getNote(id));
  });

  test('R3: a contact cannot be attached to an unknown or old note', async () => {
    const corner = await seedCorner(await newAthlete());
    const unknown = await rpc('add_note_contact', { p_note_id: '00000000-0000-4000-8000-000000000000', p_contact: 'a@b.c' });
    assert.match(unknown.json.message, /note_not_found/);
    const old = await sendNote(corner, 'Anna', { createdAt: new Date(Date.now() - 2 * 3600e3).toISOString() });
    const late = await rpc('add_note_contact', { p_note_id: old, p_contact: 'a@b.c' });
    assert.match(late.json.message, /note_not_found/);
  });

  test('R4: contacts are not readable with the anon key', async () => {
    const corner = await seedCorner(await newAthlete());
    const id = await sendNote(corner);
    await rpc('add_note_contact', { p_note_id: id, p_contact: '+352 621 000 000' });
    const r = await api(`/rest/v1/note_contacts?select=*`);
    assert.ok(!r.ok || r.json.length === 0);
  });
});

describe('corners: athlete access', () => {
  const asAthlete = (a) => ({ token: a.token });
  const create = (a, body) =>
    api('/rest/v1/corners', { ...asAthlete(a), method: 'POST', body, headers: { prefer: 'return=representation' } });

  test('R1 + share-links R1: an athlete creates a corner and gets a share token', async () => {
    const a = await newAthlete();
    const r = await create(a, { name: 'Berlin Marathon', finish_date: '2027-09-26' });
    assert.equal(r.status, 201);
    assert.equal(r.json[0].owner_id, a.id);
    assert.match(r.json[0].share_token, /^[0-9a-f]{20}$/);
    const viaLink = await rpc('get_corner_by_token', { p_token: r.json[0].share_token });
    assert.equal(viaLink.json[0].name, 'Berlin Marathon');
  });

  test('R1: no name, no date or a past date creates nothing', async () => {
    const a = await newAthlete();
    assert.equal((await create(a, { name: '  ', finish_date: '2027-09-26' })).ok, false);
    assert.equal((await create(a, { name: 'Goal' })).ok, false);
    assert.equal((await create(a, { name: 'Goal', finish_date: '2020-01-01' })).ok, false);
    assert.deepEqual((await api('/rest/v1/corners', asAthlete(a))).json, []);
  });

  test('R1: an athlete cannot create a corner for someone else, and anon cannot create one', async () => {
    const [a, b] = [await newAthlete(), await newAthlete()];
    assert.equal((await create(a, { name: 'Goal', finish_date: '2027-09-26', owner_id: b.id })).ok, false);
    assert.equal((await api('/rest/v1/corners', { method: 'POST', body: { name: 'Goal', finish_date: '2027-09-26' } })).ok, false);
  });

  test('R3: several corners per athlete; each athlete sees only their own corners and notes', async () => {
    const [a, b] = [await newAthlete(), await newAthlete()];
    const marathon = (await create(a, { name: 'Marathon', finish_date: '2027-09-26' })).json[0];
    const triathlon = (await create(a, { name: 'Triathlon', finish_date: '2027-07-01' })).json[0];
    const other = (await create(b, { name: 'Ultra', finish_date: '2027-10-01' })).json[0];
    assert.notEqual(marathon.share_token, triathlon.share_token);
    await sendNote(marathon, 'Anna');
    await sendNote(other, 'Ben');

    const cornersA = (await api('/rest/v1/corners?order=name', asAthlete(a))).json;
    assert.deepEqual(cornersA.map((c) => c.name), ['Marathon', 'Triathlon']);
    const notesA = (await api('/rest/v1/notes?select=sender_name', asAthlete(a))).json;
    assert.deepEqual(notesA.map((n) => n.sender_name), ['Anna']);
    const notesB = (await api('/rest/v1/notes?select=sender_name', asAthlete(b))).json;
    assert.deepEqual(notesB.map((n) => n.sender_name), ['Ben']);
  });

  test('recording R4: the athlete cannot read a supporter contact', async () => {
    const a = await newAthlete();
    const corner = (await create(a, { name: 'Marathon', finish_date: '2027-09-26' })).json[0];
    const id = await sendNote(corner, 'Anna');
    await rpc('add_note_contact', { p_note_id: id, p_contact: 'anna@example.com' });
    const contacts = await api('/rest/v1/note_contacts?select=*', asAthlete(a));
    assert.ok(!contacts.ok || contacts.json.length === 0);
    const notes = (await api('/rest/v1/notes?select=*', asAthlete(a))).json;
    assert.equal(notes.length, 1);
    assert.ok(!JSON.stringify(notes).includes('anna@example.com'));
  });
});

describe('session-playback: audio access', () => {
  test('R3: the owner can download a note; another athlete and anon cannot', async () => {
    const [a, b] = [await newAthlete(), await newAthlete()];
    const corner = await seedCorner(a);
    const note = await getNote(await sendNote(corner, 'Anna'));
    const path = `/storage/v1/object/authenticated/notes/${note.audio_path}`;

    const mine = await fetch(`http://127.0.0.1:54321${path}`, { headers: { authorization: `Bearer ${a.token}` } });
    assert.equal(mine.status, 200);
    assert.equal(Buffer.from(await mine.arrayBuffer()).subarray(0, 4).toString(), 'RIFF');

    assert.equal((await api(path, { token: b.token })).ok, false);
    assert.equal((await api(path)).ok, false);

    const signed = await api(`/storage/v1/object/sign/notes/${note.audio_path}`, { token: a.token, method: 'POST', body: { expiresIn: 60 } });
    assert.equal(signed.ok, true);
    const signedForB = await api(`/storage/v1/object/sign/notes/${note.audio_path}`, { token: b.token, method: 'POST', body: { expiresIn: 60 } });
    assert.equal(signedForB.ok, false);
  });
});

describe('heard-tracking: marking a note heard', () => {
  const mark = (athlete, id, heardAt) =>
    rpc('mark_note_heard', heardAt ? { p_note_id: id, p_heard_at: heardAt } : { p_note_id: id }, athlete ? { token: athlete.token } : {});

  test('R1 + R3: the owner marks a note heard and the time it was heard is kept', async () => {
    const a = await newAthlete();
    const corner = await seedCorner(a);
    const id = await sendNote(corner, 'Anna', { createdAt: new Date(Date.now() - 3600e3).toISOString() });
    const heardAt = new Date(Date.now() - 5 * 60e3).toISOString(); // heard 5 minutes ago, synced now
    const r = await mark(a, id, heardAt);
    assert.equal(r.ok, true);
    assert.equal(new Date((await getNote(id)).heard_at).toISOString(), heardAt);
  });

  test('R4: another athlete or a supporter cannot mark it', async () => {
    const [a, b] = [await newAthlete(), await newAthlete()];
    const id = await sendNote(await seedCorner(a));
    assert.equal((await mark(b, id)).ok, false);
    assert.equal((await mark(null, id)).ok, false);
    assert.equal((await getNote(id)).heard_at, null);
    // and nobody can write heard_at directly
    const direct = await api(`/rest/v1/notes?id=eq.${id}`, { token: b.token, method: 'PATCH', body: { heard_at: new Date().toISOString() } });
    const directOwner = await api(`/rest/v1/notes?id=eq.${id}`, { token: a.token, method: 'PATCH', body: { heard_at: new Date().toISOString() } });
    assert.equal(direct.ok, false);
    assert.equal(directOwner.ok, false);
    assert.equal((await getNote(id)).heard_at, null);
  });

  test('R4: marking again keeps the first time', async () => {
    const a = await newAthlete();
    const id = await sendNote(await seedCorner(a), 'Anna', { createdAt: new Date(Date.now() - 3600e3).toISOString() });
    const first = new Date(Date.now() - 30 * 60e3).toISOString();
    await mark(a, id, first);
    const again = await mark(a, id, new Date(Date.now() - 60e3).toISOString());
    assert.equal(again.ok, true);
    assert.equal(new Date((await getNote(id)).heard_at).toISOString(), first);
  });

  test('a heard time cannot be in the future or before the note existed', async () => {
    const a = await newAthlete();
    const corner = await seedCorner(a);
    const future = await sendNote(corner);
    await mark(a, future, new Date(Date.now() + 3600e3).toISOString());
    assert.ok(Math.abs(new Date((await getNote(future)).heard_at) - Date.now()) < 10_000);
    const past = await sendNote(corner);
    await mark(a, past, '2001-01-01T00:00:00Z');
    const n = await getNote(past);
    assert.equal(n.heard_at, n.created_at);
  });
});

describe('streak: one shared streak per corner', () => {
  const WEEK = 7 * 24 * 3600e3;
  const weeksAgo = (n) => new Date(Date.now() - n * WEEK).toISOString();
  const streakOf = async (corner) => {
    const [row] = (await rpc('get_corner_by_token', { p_token: corner.share_token })).json;
    return { weeks: row.streak_weeks, kept: row.this_week_kept };
  };
  /** The internal function with a fixed "today", through the service role. */
  const streakOn = async (corner, today) => {
    const r = await admin('/rest/v1/rpc/corner_streak', { method: 'POST', body: { p_corner_id: corner.id, p_today: today } });
    return { weeks: r.json[0].streak_weeks, kept: r.json[0].this_week_kept };
  };

  test('R1: notes from different people in three weeks running make a streak of 3', async () => {
    const corner = await seedCorner(await newAthlete());
    await sendNote(corner, 'Anna', { createdAt: weeksAgo(2) });
    await sendNote(corner, 'Ben', { createdAt: weeksAgo(1) });
    await sendNote(corner, 'Anna');
    assert.deepEqual(await streakOf(corner), { weeks: 3, kept: true });
  });

  test('R1: three notes in the same week make a streak of 1', async () => {
    const corner = await seedCorner(await newAthlete());
    for (const name of ['Anna', 'Ben', 'Anna']) await sendNote(corner, name);
    assert.deepEqual(await streakOf(corner), { weeks: 1, kept: true });
  });

  test('R2: no note yet this week keeps the streak alive, reported as not yet kept', async () => {
    const corner = await seedCorner(await newAthlete());
    await sendNote(corner, 'Anna', { createdAt: weeksAgo(2) });
    await sendNote(corner, 'Ben', { createdAt: weeksAgo(1) });
    assert.deepEqual(await streakOf(corner), { weeks: 2, kept: false });
  });

  test('R2: a whole week with no note breaks it', async () => {
    const corner = await seedCorner(await newAthlete());
    await sendNote(corner, 'Anna', { createdAt: weeksAgo(3) });
    await sendNote(corner, 'Ben', { createdAt: weeksAgo(2) });
    assert.deepEqual(await streakOf(corner), { weeks: 0, kept: false });
  });

  test('R2: a streak restarts after a gap', async () => {
    const corner = await seedCorner(await newAthlete());
    await sendNote(corner, 'Anna', { createdAt: weeksAgo(4) });
    await sendNote(corner, 'Anna', { createdAt: weeksAgo(3) });
    await sendNote(corner, 'Ben', { createdAt: weeksAgo(1) });
    await sendNote(corner, 'Ben');
    assert.deepEqual(await streakOf(corner), { weeks: 2, kept: true });
  });

  test('R2: a corner with no notes has no streak', async () => {
    const corner = await seedCorner(await newAthlete());
    assert.deepEqual(await streakOf(corner), { weeks: 0, kept: false });
  });

  test('R1: weeks run Monday to Sunday in UTC', async () => {
    const corner = await seedCorner(await newAthlete());
    await sendNote(corner, 'Anna', { createdAt: '2026-11-15T23:59:59Z' }); // Sunday: week of 9 Nov
    await sendNote(corner, 'Ben', { createdAt: '2026-11-16T00:00:00Z' });  // Monday: week of 16 Nov
    assert.deepEqual(await streakOn(corner, '2026-11-16'), { weeks: 2, kept: true });
    assert.deepEqual(await streakOn(corner, '2026-11-22'), { weeks: 2, kept: true });  // Sunday, same week
    assert.deepEqual(await streakOn(corner, '2026-11-23'), { weeks: 2, kept: false }); // Monday, new week opens
    assert.deepEqual(await streakOn(corner, '2026-11-29'), { weeks: 2, kept: false }); // still open on Sunday
    assert.deepEqual(await streakOn(corner, '2026-11-30'), { weeks: 0, kept: false }); // a week passed empty
    assert.deepEqual(await streakOn(corner, '2026-11-15'), { weeks: 1, kept: true });  // before the second note's week
  });

  test('R3: nothing is computed or returned per sender', async () => {
    const a = await newAthlete();
    const corner = await seedCorner(a);
    await sendNote(corner, 'Anna');
    const link = (await rpc('get_corner_by_token', { p_token: corner.share_token })).json[0];
    assert.deepEqual(Object.keys(link).sort(), ['athlete_name', 'finish_date', 'name', 'streak_weeks', 'this_week_kept']);
    const mine = (await rpc('my_corner_streaks', {}, { token: a.token })).json[0];
    assert.deepEqual(Object.keys(mine).sort(), ['corner_id', 'streak_weeks', 'this_week_kept']);
  });

  test('R4: the athlete gets the streak of their own corners only; the internal function is closed', async () => {
    const [a, b] = [await newAthlete(), await newAthlete()];
    const mine = await seedCorner(a);
    const theirs = await seedCorner(b);
    await sendNote(mine, 'Anna', { createdAt: weeksAgo(1) });
    await sendNote(mine, 'Ben');
    await sendNote(theirs, 'Chloé');
    const r = await rpc('my_corner_streaks', {}, { token: a.token });
    assert.deepEqual(r.json, [{ corner_id: mine.id, streak_weeks: 2, this_week_kept: true }]);
    assert.equal((await rpc('my_corner_streaks', {})).ok, false);
    assert.equal((await rpc('corner_streak', { p_corner_id: theirs.id }, { token: a.token })).ok, false);
    assert.equal((await rpc('corner_streak', { p_corner_id: theirs.id })).ok, false);
  });
});

describe('plan: sessions and messages left for a day', () => {
  const as = (a) => ({ token: a.token });
  const WEEK = [null, { kind: 'hard', minutes: 45 }, null, { kind: 'easy', minutes: 30 }, null, null, { kind: 'long', minutes: 75 }];
  const plan = async (corner) => (await rpc('get_plan_by_token', { p_token: corner.share_token })).json;
  const mine = async (a, corner) => (await api(`/rest/v1/sessions?corner_id=eq.${corner.id}&order=day`, as(a))).json;

  test('R1: a usual week fills the calendar, three sessions a week, up to 12 weeks', async () => {
    const a = await newAthlete();
    const corner = await seedCorner(a);
    const r = await rpc('set_usual_week', { p_corner_id: corner.id, p_week: WEEK, p_from: day(0) }, as(a));
    assert.equal(r.ok, true);
    const sessions = await mine(a, corner);
    assert.equal(sessions.length, r.json);
    assert.ok(sessions.length >= 35 && sessions.length <= 37, `got ${sessions.length}`);
    for (const s of sessions) {
      const isodow = (new Date(s.day + 'T00:00:00Z').getUTCDay() + 6) % 7; // Monday = 0
      assert.deepEqual({ kind: s.kind, minutes: s.minutes }, WEEK[isodow]);
    }
  });

  test('R1: the plan stops at the finish day', async () => {
    const a = await newAthlete();
    const corner = await seedCorner(a, { finish_date: day(9) });
    await rpc('set_usual_week', { p_corner_id: corner.id, p_week: WEEK.map(() => ({ kind: 'easy', minutes: 20 })), p_from: day(0) }, as(a));
    const sessions = await mine(a, corner);
    assert.equal(sessions.length, 10);
    assert.equal(sessions.at(-1).day, day(9));
  });

  test('R2: one day can be added, changed and taken off', async () => {
    const a = await newAthlete();
    const corner = await seedCorner(a);
    const id = (await rpc('set_session', { p_corner_id: corner.id, p_day: day(2), p_kind: 'hard', p_minutes: 45 }, as(a))).json;
    const same = (await rpc('set_session', { p_corner_id: corner.id, p_day: day(2), p_kind: 'long', p_minutes: 90 }, as(a))).json;
    assert.equal(same, id);
    assert.deepEqual((await mine(a, corner)).map((s) => [s.day, s.kind, s.minutes]), [[day(2), 'long', 90]]);
    assert.equal((await rpc('set_session', { p_corner_id: corner.id, p_day: day(3), p_kind: 'sprint', p_minutes: 45 }, as(a))).ok, false);
    await rpc('remove_session', { p_session_id: id }, as(a));
    assert.deepEqual(await mine(a, corner), []);
  });

  test('R3: only the owner can change or read a plan directly', async () => {
    const [a, b] = [await newAthlete(), await newAthlete()];
    const corner = await seedCorner(a);
    const s = await seedSession(corner, 1);
    assert.equal((await rpc('set_session', { p_corner_id: corner.id, p_day: day(2), p_kind: 'easy', p_minutes: 30 }, as(b))).ok, false);
    assert.equal((await rpc('set_usual_week', { p_corner_id: corner.id, p_week: WEEK, p_from: day(0) }, as(b))).ok, false);
    assert.equal((await rpc('set_session', { p_corner_id: corner.id, p_day: day(2), p_kind: 'easy', p_minutes: 30 })).ok, false);
    await rpc('remove_session', { p_session_id: s.id }, as(b));
    assert.equal((await mine(a, corner)).length, 1);
    assert.deepEqual(await mine(b, corner), []);
    const direct = await api('/rest/v1/sessions', { ...as(a), method: 'POST', body: { corner_id: corner.id, day: day(5), kind: 'easy', minutes: 30 } });
    assert.equal(direct.ok, false);
    const anon = await api('/rest/v1/sessions?select=*');
    assert.ok(!anon.ok || anon.json.length === 0);
  });

  test('R4: the link shows upcoming sessions with how many messages each has, never from whom', async () => {
    const corner = await seedCorner(await newAthlete());
    await seedSession(corner, -5, 'easy', 30);
    const hard = await seedSession(corner, 1, 'hard', 45);
    const long = await seedSession(corner, 4, 'long', 75);
    await seedSession(corner, 70, 'easy', 30);
    await sendNote(corner, 'Anna', { sessionId: long.id });
    await sendNote(corner, 'Mum', { sessionId: long.id });
    await sendNote(corner, 'Ben');
    const rows = await plan(corner);
    assert.deepEqual(rows.map((r) => [r.day, r.kind, r.minutes, r.messages]), [[day(1), 'hard', 45, 0], [day(4), 'long', 75, 2]]);
    assert.deepEqual(Object.keys(rows[0]).sort(), ['day', 'id', 'kind', 'messages', 'minutes']);
    assert.equal(rows[0].id, hard.id);
    assert.deepEqual((await rpc('get_plan_by_token', { p_token: 'nope' })).json, []);
  });

  test('R4: a heard message no longer counts on the link', async () => {
    const a = await newAthlete();
    const corner = await seedCorner(a);
    const s = await seedSession(corner, 1);
    const id = await sendNote(corner, 'Anna', { sessionId: s.id });
    await rpc('mark_note_heard', { p_note_id: id }, as(a));
    assert.equal((await plan(corner))[0].messages, 0);
  });

  test('recording R6: a message is stored for the chosen session, or for any time', async () => {
    const a = await newAthlete();
    const corner = await seedCorner(a);
    const s = await seedSession(corner, 2, 'hard', 45);
    const forDay = await sendNote(corner, 'Anna', { sessionId: s.id });
    const anyTime = await sendNote(corner, 'Ben');
    assert.equal((await getNote(forDay)).session_id, s.id);
    assert.equal((await getNote(anyTime)).session_id, null);
    const seen = (await api(`/rest/v1/notes?select=sender_name,session_id&order=created_at`, as(a))).json;
    assert.deepEqual(seen, [{ sender_name: 'Anna', session_id: s.id }, { sender_name: 'Ben', session_id: null }]);
  });

  test("recording R6: a message cannot be left for another corner's session", async () => {
    const corner = await seedCorner(await newAthlete());
    const other = await seedSession(await seedCorner(await newAthlete()), 2);
    const path = newAudioPath();
    await uploadAudio(path, makeWav());
    const r = await rpc('submit_note', { p_token: corner.share_token, p_sender_name: 'Anna', p_audio_path: path, p_duration_ms: 1000, p_session_id: other.id });
    assert.match(r.json.message, /session_not_found/);
  });

  test('R2: taking a day off, or changing the usual week, keeps the messages', async () => {
    const a = await newAthlete();
    const corner = await seedCorner(a);
    await rpc('set_usual_week', { p_corner_id: corner.id, p_week: WEEK.map(() => ({ kind: 'easy', minutes: 30 })), p_from: day(0) }, as(a));
    const sessions = await mine(a, corner);
    const tueOrLater = sessions.find((s) => (new Date(s.day + 'T00:00:00Z').getUTCDay() + 6) % 7 === 1);
    const wed = sessions.find((s) => (new Date(s.day + 'T00:00:00Z').getUTCDay() + 6) % 7 === 2);
    const kept = await sendNote(corner, 'Anna', { sessionId: tueOrLater.id });
    const moved = await sendNote(corner, 'Ben', { sessionId: wed.id });
    await rpc('set_usual_week', { p_corner_id: corner.id, p_week: WEEK, p_from: day(0) }, as(a)); // Tuesday stays, Wednesday becomes rest
    assert.equal((await getNote(kept)).session_id, tueOrLater.id);
    assert.equal((await getNote(moved)).session_id, null);
    await rpc('remove_session', { p_session_id: tueOrLater.id }, as(a));
    assert.equal((await getNote(kept)).session_id, null);
  });

  test('corners R1: the athlete gives a first name with the goal, and the link shows it', async () => {
    const a = await newAthlete();
    const r = await api('/rest/v1/corners', { ...as(a), method: 'POST', body: { name: 'A long ride', finish_date: '2027-05-01', athlete_name: 'Sam' }, headers: { prefer: 'return=representation' } });
    assert.equal(r.status, 201);
    const link = (await rpc('get_corner_by_token', { p_token: r.json[0].share_token })).json[0];
    assert.equal(link.athlete_name, 'Sam');
  });
});
