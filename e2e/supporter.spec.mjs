// Capability scenarios for `recording`, the supporter half of `share-links`, and the plan as
// a supporter sees it, driven through the real supporter page with Chromium's fake microphone.
import { expect, test } from '@playwright/test';
import { SERVICE_ROLE_KEY, SUPABASE_URL, SUPPORTER_URL } from './local.mjs';
import { admin, day, newAthlete, seedCorner, seedSession, sendNote } from './helpers.mjs';

let corner, hard, long;
const link = (token) => `${SUPPORTER_URL}/?c=${token}`;
const notesOf = async (c) => (await admin(`/rest/v1/notes?corner_id=eq.${c.id}&order=created_at`)).json;
const cell = (page, offset) => page.locator(`[data-day="${day(offset)}"]`);

test.beforeEach(async () => {
  corner = await seedCorner(await newAthlete(), { name: 'My first 10K', finish_date: '2027-06-13', athlete_name: 'Sam' });
  hard = await seedSession(corner, 1, 'hard', 45);
  long = await seedSession(corner, 3, 'long', 75);
});

/** Pick tomorrow's hard one and get to the recorder. */
async function openRecorder(page) {
  await cell(page, 1).click();
  await page.locator('#p-go').click();
  await expect(page.getByRole('heading', { name: "For tomorrow's hard one" })).toBeVisible();
}
async function record(page, ms = 1500) {
  await page.getByRole('button', { name: 'Record', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  await page.waitForTimeout(ms);
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByText('Have a listen')).toBeVisible();
}

test('share-links R2: the link shows whose goal it is, the goal and the day, with no account', async ({ page }) => {
  await page.goto(link(corner.share_token));
  await expect(page.getByText('Sam is working towards')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'My first 10K' })).toBeVisible();
  await expect(page.getByText('13 June 2027')).toBeVisible();
  await expect(page.getByText('Pick a day to be there for Sam.')).toBeVisible();
});

test('share-links R3: an unknown or missing token fails gently', async ({ page }) => {
  for (const url of [link('doesnotexist'), SUPPORTER_URL]) {
    await page.goto(url);
    await expect(page.getByText("This link doesn't seem to lead anywhere")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Record', exact: true })).toBeHidden();
  }
});

test('plan R4 + R5: the calendar shows where someone is already there and where no one is yet', async ({ page }) => {
  await sendNote(corner, 'Anna', { sessionId: long.id });
  await sendNote(corner, 'Mum', { sessionId: long.id });
  await page.goto(link(corner.share_token));

  await expect(cell(page, 3).locator('.m i:not(.none)')).toHaveCount(2);   // two messages: two dots
  await expect(cell(page, 1).locator('.m i.none')).toHaveCount(1);          // a session with no one yet
  await expect(cell(page, 2).locator('.m i')).toHaveCount(0);               // not a training day
  expect(await cell(page, 2).evaluate((e) => e.tagName)).toBe('DIV');       // and it cannot be picked

  await cell(page, 1).click();
  await expect(page.locator('#p-day')).toContainText('Tomorrow, a hard one');
  await expect(page.locator('#p-day')).toContainText('45 minutes. No one is there yet.');
  await expect(page.getByRole('button', { name: 'Be the first' })).toBeVisible();
  await cell(page, 3).click();
  await expect(page.locator('#p-day')).toContainText('1 hour 15. 2 people are already there.');
  await expect(page.getByRole('button', { name: 'Be there too' })).toBeVisible();
  // Never who.
  await expect(page.locator('main')).not.toContainText(/Anna|Mum/);
});

test('recording R1: record, listen back, re-record', async ({ page }) => {
  await page.goto(link(corner.share_token));
  await openRecorder(page);
  await record(page);
  const first = await page.locator('#n-preview').getAttribute('src');
  expect(first).toMatch(/^blob:/);
  await expect.poll(() => page.locator('#n-preview').evaluate((a) => a.duration)).toBeGreaterThan(1);

  await page.getByRole('button', { name: 'record again' }).click();
  await record(page);
  expect(await page.locator('#n-preview').getAttribute('src')).not.toBe(first);
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeVisible();
});

test('recording R1: recording stops by itself at 60 seconds', async ({ page }) => {
  await page.clock.install();
  await page.goto(link(corner.share_token));
  await openRecorder(page);
  await page.getByRole('button', { name: 'Record', exact: true }).click();
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
  await openRecorder(page);
  await page.getByRole('button', { name: 'Record', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText("couldn't reach your microphone");
  await expect(page.getByText('Have a listen')).toBeHidden();
  expect(await notesOf(corner)).toHaveLength(0);
});

test('recording R2 + R5 + R6: send for a chosen day; stored for that session as mono 16-bit WAV', async ({ page }) => {
  await page.goto(link(corner.share_token));
  await openRecorder(page);
  await record(page);
  await page.getByLabel('Your first name').fill('Anna');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Thank you' })).toBeVisible();
  await expect(page.getByText("Sam will hear you somewhere along tomorrow's hard one.")).toBeVisible();

  const notes = await notesOf(corner);
  expect(notes).toHaveLength(1);
  expect(notes[0].sender_name).toBe('Anna');
  expect(notes[0].session_id).toBe(hard.id);
  expect(notes[0].duration_ms).toBeGreaterThan(1000);
  expect(notes[0].duration_ms).toBeLessThan(5000);

  const file = await fetch(`${SUPABASE_URL}/storage/v1/object/notes/${notes[0].audio_path}`, { headers: { authorization: `Bearer ${SERVICE_ROLE_KEY}` } });
  const bytes = Buffer.from(await file.arrayBuffer());
  expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
  expect(bytes.subarray(8, 12).toString()).toBe('WAVE');
  expect(bytes.readUInt16LE(20)).toBe(1);        // PCM
  expect(bytes.readUInt16LE(22)).toBe(1);        // mono
  expect(bytes.readUInt32LE(24)).toBe(22050);    // sample rate
  expect(bytes.readUInt16LE(34)).toBe(16);       // bits per sample
  let peak = 0;                                  // the fake microphone beeps, so this must not be silence
  for (let i = 44; i + 1 < bytes.length; i += 2) peak = Math.max(peak, Math.abs(bytes.readInt16LE(i)));
  expect(peak).toBeGreaterThan(500);

  // Back on the calendar that day now shows someone is there.
  await page.getByRole('button', { name: 'no thanks' }).click();
  await page.getByRole('button', { name: 'Back to the calendar' }).click();
  await expect(cell(page, 1).locator('.m i:not(.none)')).toHaveCount(1);
});

test('recording R6: "any time" stores a message for no particular day', async ({ page }) => {
  await page.goto(link(corner.share_token));
  await page.getByRole('button', { name: 'Or any time' }).click();
  await expect(page.getByRole('heading', { name: 'Any time' })).toBeVisible();
  await record(page);
  await page.getByLabel('Your first name').fill('Ben');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Sam will hear you the next time they train.')).toBeVisible();
  const [note] = await notesOf(corner);
  expect(note.session_id).toBeNull();
});

test('recording R6: with no plan yet, a message can still be left', async ({ page }) => {
  const bare = await seedCorner(await newAthlete(), { athlete_name: 'Sam' });
  await page.goto(link(bare.share_token));
  await expect(page.getByText("Leave a message for Sam's next training day.")).toBeVisible();
  await page.getByRole('button', { name: 'Leave a message' }).click();
  await expect(page.getByRole('button', { name: 'Record', exact: true })).toBeVisible();
});

test('recording R2: no first name, nothing is sent', async ({ page }) => {
  await page.goto(link(corner.share_token));
  await openRecorder(page);
  await record(page);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('first name');
  await expect(page.getByRole('heading', { name: 'Thank you' })).toBeHidden();
  expect(await notesOf(corner)).toHaveLength(0);
});

test('recording R3: optional contact is stored after sending', async ({ page }) => {
  await page.goto(link(corner.share_token));
  await openRecorder(page);
  await record(page);
  await page.getByLabel('Your first name').fill('Anna');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByLabel('Want to know when Sam has heard it?').fill('anna@example.com');
  await page.getByRole('button', { name: 'Let me know' }).click();
  await expect(page.getByText("We'll let you know when Sam has listened.")).toBeVisible();

  const [note] = await notesOf(corner);
  const contacts = (await admin(`/rest/v1/note_contacts?note_id=eq.${note.id}`)).json;
  expect(contacts.map((c) => c.contact)).toEqual(['anna@example.com']);
});

test('recording R3: skipping the contact stores none and asks nothing more', async ({ page }) => {
  await page.goto(link(corner.share_token));
  await openRecorder(page);
  await record(page);
  await page.getByLabel('Your first name').fill('Ben');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('button', { name: 'no thanks' }).click();
  await expect(page.getByText('Thank you for being there.')).toBeVisible();
  await expect(page.getByLabel('Want to know when Sam has heard it?')).toBeHidden();

  const [note] = await notesOf(corner);
  expect(note.sender_name).toBe('Ben');
  expect((await admin(`/rest/v1/note_contacts?note_id=eq.${note.id}`)).json).toEqual([]);
});
