// Small helpers for talking to the local Supabase stack with plain fetch.
import { randomUUID } from 'node:crypto';
import { ANON_KEY, SERVICE_ROLE_KEY, SUPABASE_URL } from './local.mjs';

/** Call the API as a role. `token` defaults to the key itself (anon or service role). */
export async function api(path, { key = ANON_KEY, token, method = 'GET', body, headers = {} } = {}) {
  const isRaw = body instanceof Uint8Array;
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: key,
      authorization: `Bearer ${token || key}`,
      ...(body !== undefined && !isRaw ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isRaw ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, ok: res.ok, json };
}

export const rpc = (name, args, opts = {}) => api(`/rest/v1/rpc/${name}`, { method: 'POST', body: args, ...opts });

/** Service-role access for test setup and for looking at what was stored. */
export const admin = (path, opts = {}) => api(path, { key: SERVICE_ROLE_KEY, ...opts });

/** A fresh anonymous athlete: { id, token }. */
export async function newAthlete() {
  const r = await api('/auth/v1/signup', { method: 'POST', body: {} });
  if (!r.ok) throw new Error(`anonymous sign-in failed: ${JSON.stringify(r.json)}`);
  return { id: r.json.user.id, token: r.json.access_token };
}

/** Insert a corner straight into the database for an athlete. */
export async function seedCorner(athlete, { name = 'Berlin Marathon', finish_date = '2027-09-26' } = {}) {
  const r = await admin('/rest/v1/corners', {
    method: 'POST',
    body: { owner_id: athlete.id, name, finish_date },
    headers: { prefer: 'return=representation' },
  });
  if (!r.ok) throw new Error(`seedCorner failed: ${JSON.stringify(r.json)}`);
  return r.json[0];
}

/** A valid mono 16-bit 22.05 kHz WAV holding a quiet tone. */
export function makeWav(seconds = 1, hz = 440) {
  const sr = 22050, n = Math.floor(seconds * sr);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin((2 * Math.PI * hz * i) / sr) * 8000), 44 + i * 2);
  return new Uint8Array(buf);
}

export const newAudioPath = () => `inbox/${randomUUID()}.wav`;

export function uploadAudio(path, bytes, opts = {}) {
  return api(`/storage/v1/object/notes/${path}`, {
    method: 'POST', body: bytes, headers: { 'content-type': 'audio/wav', ...(opts.headers || {}) }, ...opts,
  });
}

/** Do what the supporter page does: upload a file, then submit the note. Returns the note id. */
export async function sendNote(corner, senderName = 'Anna', { seconds = 1, createdAt } = {}) {
  const path = newAudioPath();
  const up = await uploadAudio(path, makeWav(seconds));
  if (!up.ok) throw new Error(`upload failed: ${JSON.stringify(up.json)}`);
  const r = await rpc('submit_note', {
    p_token: corner.share_token, p_sender_name: senderName, p_audio_path: path, p_duration_ms: Math.round(seconds * 1000),
  });
  if (!r.ok) throw new Error(`submit_note failed: ${JSON.stringify(r.json)}`);
  if (createdAt) {
    await admin(`/rest/v1/notes?id=eq.${r.json}`, { method: 'PATCH', body: { created_at: createdAt } });
  }
  return r.json;
}

export async function getNote(id) {
  const r = await admin(`/rest/v1/notes?id=eq.${id}`);
  return r.json[0];
}
