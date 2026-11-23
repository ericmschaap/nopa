// Capability scenarios for `heard-tracking`, through the athlete app's web build.
import { expect, test } from '@playwright/test';
import { getNote, sendNote } from './helpers.mjs';
import { athleteWithCorner, notePlays, spyOnAudio, startSession } from './ui.mjs';

const MIN = 60_000;
const finished = (page) => expect(page.getByRole('heading', { name: "That's everyone for today" })).toBeVisible({ timeout: 15_000 });

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await spyOnAudio(page);
});

test('R1 + R5: a note that plays to the end is marked heard, with the time, and shown as heard', async ({ page }) => {
  const { corner } = await athleteWithCorner(page);
  const id = await sendNote(corner, 'Anna');
  await page.getByRole('button', { name: 'Check again' }).click();
  expect((await getNote(id)).heard_at).toBeNull();

  const before = Date.now();
  await startSession(page, 20);
  await page.clock.fastForward(10 * MIN + 2_000);
  await expect(page.getByTestId('now-playing')).toHaveText('Anna');
  expect((await getNote(id)).heard_at).toBeNull(); // not while it is still playing
  await finished(page);

  await expect.poll(async () => (await getNote(id)).heard_at).not.toBeNull();
  const heardAt = new Date((await getNote(id)).heard_at).getTime();
  expect(heardAt).toBeGreaterThanOrEqual(before - 1000);
  expect(heardAt).toBeLessThanOrEqual(Date.now() + 1000);

  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText('Nothing new yet')).toBeVisible();
  await expect(page.getByText('1 note heard')).toBeVisible();
  await expect(page.getByTestId('heard-note')).toContainText('Anna');
  await expect(page.getByTestId('heard-note')).toContainText(/Heard \d+ \w+, \d\d:\d\d/);
});

test('R2 + R5: heard notes are left out of the next session', async ({ page }) => {
  const { corner } = await athleteWithCorner(page);
  await sendNote(corner, 'Anna');
  await sendNote(corner, 'Ben');
  await page.getByRole('button', { name: 'Check again' }).click();
  await startSession(page, 20);
  await page.clock.fastForward(7 * MIN);
  await expect(page.getByText('1 of 2 notes heard')).toBeVisible({ timeout: 15_000 });
  await page.clock.fastForward(7 * MIN);
  await finished(page);
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText('2 notes heard')).toBeVisible();

  // A new note arrives: only that one is waiting and only that one plays.
  await sendNote(corner, 'Chloé');
  await page.getByRole('button', { name: 'Check again' }).click();
  await expect(page.getByTestId('waiting-count')).toHaveText('1 note is waiting for you');
  const playsBefore = (await notePlays(page)).length;
  await startSession(page, 20);
  await page.clock.fastForward(10 * MIN + 2_000);
  await expect(page.getByTestId('now-playing')).toHaveText('Chloé');
  await finished(page);
  expect((await notePlays(page)).length - playsBefore).toBe(1);
});

test('R1: a note cut short by End stays unheard', async ({ page }) => {
  const { corner } = await athleteWithCorner(page);
  const id = await sendNote(corner, 'Anna', { seconds: 20 });
  await page.getByRole('button', { name: 'Check again' }).click();
  await startSession(page, 20);
  await page.clock.fastForward(10 * MIN + 2_000);
  await expect(page.getByTestId('now-playing')).toHaveText('Anna');
  await page.getByRole('button', { name: 'End session' }).click();
  await expect(page.getByTestId('session-summary')).toHaveText('No notes played this time. 1 note is still waiting for your next session.');

  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByTestId('waiting-count')).toHaveText('1 note is waiting for you');
  expect((await getNote(id)).heard_at).toBeNull();
});

test('R3: a note heard with no signal is marked once the connection is back', async ({ page, context }) => {
  const { corner } = await athleteWithCorner(page);
  const id = await sendNote(corner, 'Anna');
  await page.getByRole('button', { name: 'Check again' }).click();
  await startSession(page, 20);

  await context.setOffline(true);
  await page.clock.fastForward(10 * MIN + 2_000);
  await finished(page);
  await page.waitForTimeout(500);
  expect((await getNote(id)).heard_at).toBeNull(); // could not reach the server

  // Back in range: the next launch sends the saved mark, and the note does not come back.
  await context.setOffline(false);
  await page.reload();
  await expect.poll(async () => (await getNote(id)).heard_at).not.toBeNull();
  await page.getByRole('button', { name: 'Open Berlin Marathon' }).click();
  await expect(page.getByText('Nothing new yet')).toBeVisible();
  await expect(page.getByTestId('heard-note')).toContainText('Anna');
});
