// Capability scenarios for `recording` and the supporter half of `share-links`,
// driven through the real supporter page with Chromium's fake microphone.
import { expect, test } from '@playwright/test';
import { SUPPORTER_URL } from './local.mjs';
import { admin, newAthlete, seedCorner } from './helpers.mjs';

let corner;
const link = (token) => `${SUPPORTER_URL}/?c=${token}`;
const notesOf = async (c) => (await admin(`/rest/v1/notes?corner_id=eq.${c.id}&order=created_at`)).json;

test.beforeEach(async () => {
  corner = await seedCorner(await newAthlete(), { name: 'Berlin Marathon', finish_date: '2027-09-26' });
});

async function record(page, ms = 1500) {
  await page.getByRole('button', { name: 'Record a note' }).click();
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  await page.waitForTimeout(ms);
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByText('Have a listen')).toBeVisible();
}

test('share-links R2: the link shows the goal and finish date, with no account', async ({ page }) => {
  await page.goto(link(corner.share_token));
  await expect(page.getByRole('heading', { name: 'Berlin Marathon' })).toBeVisible();
  await expect(page.getByText('26 September 2027')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record a note' })).toBeVisible();
});

test('share-links R3: an unknown or missing token fails gently', async ({ page }) => {
  for (const url of [link('doesnotexist'), SUPPORTER_URL]) {
    await page.goto(url);
    await expect(page.getByText("This link doesn't seem to lead anywhere")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Record a note' })).toBeHidden();
  }
});

test('recording R1: record, listen back, re-record', async ({ page }) => {
  await page.goto(link(corner.share_token));
  await record(page);
  const first = await page.locator('#preview').getAttribute('src');
  expect(first).toMatch(/^blob:/);
  // The preview really holds audio of about the recorded length.
  await expect.poll(() => page.locator('#preview').evaluate((a) => a.duration)).toBeGreaterThan(1);

  await page.getByRole('button', { name: 'Record again' }).click();
  await record(page);
  expect(await page.locator('#preview').getAttribute('src')).not.toBe(first);
  await expect(page.getByRole('button', { name: 'Send note' })).toBeVisible();
});

test('recording R1: recording stops by itself at 60 seconds', async ({ page }) => {
  await page.clock.install();
  await page.goto(link(corner.share_token));
  await page.getByRole('button', { name: 'Record a note' }).click();
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  await page.waitForTimeout(1500);            // real time, so there is real audio
  await page.clock.fastForward(55_000);
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  await page.clock.fastForward(5_000);        // past the 60 s mark
  await expect(page.getByText('Have a listen')).toBeVisible();
});

test('recording R1: no microphone, plain explanation, nothing sent', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await page.goto(link(corner.share_token));
  await page.getByRole('button', { name: 'Record a note' }).click();
  await expect(page.getByRole('alert')).toContainText("couldn't reach your microphone");
  await expect(page.getByText('Have a listen')).toBeHidden();
  expect(await notesOf(corner)).toHaveLength(0);
});

test('recording R2 + R5: send with a first name; stored as mono 16-bit WAV', async ({ page }) => {
  await page.goto(link(corner.share_token));
  await record(page);
  await page.getByLabel('Your first name').fill('Anna');
  await page.getByRole('button', { name: 'Send note' }).click();
  await expect(page.getByText("Thank you — it's on its way")).toBeVisible();

  const notes = await notesOf(corner);
  expect(notes).toHaveLength(1);
  expect(notes[0].sender_name).toBe('Anna');
  expect(notes[0].duration_ms).toBeGreaterThan(1000);
  expect(notes[0].duration_ms).toBeLessThan(5000);

  const file = await fetch(`http://127.0.0.1:54321/storage/v1/object/notes/${notes[0].audio_path}`, {
    headers: { authorization: `Bearer ${(await import('./local.mjs')).SERVICE_ROLE_KEY}` },
  });
  const bytes = Buffer.from(await file.arrayBuffer());
  expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
  expect(bytes.subarray(8, 12).toString()).toBe('WAVE');
  expect(bytes.readUInt16LE(20)).toBe(1);        // PCM
  expect(bytes.readUInt16LE(22)).toBe(1);        // mono
  expect(bytes.readUInt32LE(24)).toBe(22050);    // sample rate
  expect(bytes.readUInt16LE(34)).toBe(16);       // bits per sample
  // The fake microphone beeps, so the recording must not be silence.
  let peak = 0;
  for (let i = 44; i + 1 < bytes.length; i += 2) peak = Math.max(peak, Math.abs(bytes.readInt16LE(i)));
  expect(peak).toBeGreaterThan(500);
});

test('recording R2: no first name, nothing is sent', async ({ page }) => {
  await page.goto(link(corner.share_token));
  await record(page);
  await page.getByRole('button', { name: 'Send note' }).click();
  await expect(page.getByRole('alert')).toContainText('first name');
  await expect(page.getByText("Thank you — it's on its way")).toBeHidden();
  expect(await notesOf(corner)).toHaveLength(0);
});

test('recording R3: optional contact is stored after sending', async ({ page }) => {
  await page.goto(link(corner.share_token));
  await record(page);
  await page.getByLabel('Your first name').fill('Anna');
  await page.getByRole('button', { name: 'Send note' }).click();
  await page.getByLabel("Want to know when they've listened?").fill('anna@example.com');
  await page.getByRole('button', { name: 'Let me know' }).click();
  await expect(page.getByText("We'll let you know when they've listened")).toBeVisible();

  const [note] = await notesOf(corner);
  const contacts = (await admin(`/rest/v1/note_contacts?note_id=eq.${note.id}`)).json;
  expect(contacts.map((c) => c.contact)).toEqual(['anna@example.com']);
});

test('recording R3: skipping the contact stores none and asks nothing more', async ({ page }) => {
  await page.goto(link(corner.share_token));
  await record(page);
  await page.getByLabel('Your first name').fill('Ben');
  await page.getByRole('button', { name: 'Send note' }).click();
  await page.getByRole('button', { name: 'No thanks' }).click();
  await expect(page.getByText('Thank you for being in their corner')).toBeVisible();
  await expect(page.getByLabel("Want to know when they've listened?")).toBeHidden();

  const [note] = await notesOf(corner);
  expect(note.sender_name).toBe('Ben');
  expect((await admin(`/rest/v1/note_contacts?note_id=eq.${note.id}`)).json).toEqual([]);
});
