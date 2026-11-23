// Database-level checks of the server rules, run against the local Supabase stack:
//   npm run db:test
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { admin, api, getNote, makeWav, newAthlete, newAudioPath, rpc, seedCorner, sendNote, uploadAudio } from './helpers.mjs';

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
      assert.ok(['name', 'finish_date', 'streak_weeks', 'this_week_kept'].includes(key), `unexpected field ${key}`);
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
