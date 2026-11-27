// Capability scenarios for `heard-tracking`, through the athlete app's web build.
import { expect, test } from '@playwright/test';
import { getNote, sendNote } from './helpers.mjs';
import { athleteWithCorner, notePlays, pickDay, refresh, spyOnAudio, startSession } from './ui.mjs';

const MIN = 60_000;
const finished = (page) => expect(page.getByRole('heading', { name: 'That was everyone' })).toBeVisible({ timeout: 15_000 });
const today = async (page) => athleteWithCorner(page, { plan: [[0, 'easy', 20]] });

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await spyOnAudio(page);
});

test('R1 + R5: a message that plays to the end is marked heard, with the time, and shown on the day', async ({ page }) => {
  const { corner, sessions } = await today(page);
  const id = await sendNote(corner, 'Anna', { sessionId: sessions[0].id });
  await refresh(page);
  expect((await getNote(id)).heard_at).toBeNull();

  const before = Date.now();
  await startSession(page, 0);
  await page.clock.fastForward(10 * MIN + 2_000);
  await expect(page.getByTestId('now-playing')).toHaveText('Anna');
  expect((await getNote(id)).heard_at).toBeNull(); // not while it is still playing
  await finished(page);

  await expect.poll(async () => (await getNote(id)).heard_at).not.toBeNull();
  const heardAt = new Date((await getNote(id)).heard_at).getTime();
  expect(heardAt).toBeGreaterThanOrEqual(before - 1000);
  expect(heardAt).toBeLessThanOrEqual(Date.now() + 1000);

  await page.getByRole('button', { name: 'Back to the calendar' }).click();
  await pickDay(page, 0);
  await expect(page.getByTestId('heard')).toHaveText('Anna was with you.');
  await expect(page.getByTestId('waiting')).toHaveText('20 minutes. No one has left a message here yet.');
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toHaveCount(0);
});

test('R2: heard messages are left out of the next session', async ({ page }) => {
  const { corner, sessions } = await today(page);
  await sendNote(corner, 'Anna', { sessionId: sessions[0].id });
  await sendNote(corner, 'Ben', { sessionId: sessions[0].id });
  await refresh(page);
  await startSession(page, 0);
  await page.clock.fastForward(7 * MIN);
  await expect(page.getByTestId('now-playing')).toBeVisible();
  await expect(page.getByText('Put your phone away')).toBeVisible({ timeout: 15_000 });
  await page.clock.fastForward(7 * MIN);
  await finished(page);
  await page.getByRole('button', { name: 'Back to the calendar' }).click();

  // A new message arrives for the same day: only that one is waiting and only that one plays.
  await sendNote(corner, 'Chloé', { sessionId: sessions[0].id });
  await refresh(page);
  await pickDay(page, 0);
  await expect(page.getByTestId('waiting')).toHaveText('20 minutes. One message is waiting for you.');
  const playsBefore = (await notePlays(page)).length;
  await startSession(page, 0);
  await page.clock.fastForward(10 * MIN + 2_000);
  await expect(page.getByTestId('now-playing')).toHaveText('Chloé');
  await finished(page);
  expect((await notePlays(page)).length - playsBefore).toBe(1);
});

test('R1: a message cut short by ending the session stays unheard', async ({ page }) => {
  const { corner, sessions } = await today(page);
  const id = await sendNote(corner, 'Anna', { sessionId: sessions[0].id, seconds: 20 });
  await refresh(page);
  await startSession(page, 0);
  await page.clock.fastForward(10 * MIN + 2_000);
  await expect(page.getByTestId('now-playing')).toHaveText('Anna');
  await page.getByRole('button', { name: 'end the session' }).click();
  await expect(page.getByTestId('session-summary')).toHaveText('No one got to say hello this time. One message is saved for next time.');

  await page.getByRole('button', { name: 'Back to the calendar' }).click();
  await pickDay(page, 0);
  await expect(page.getByTestId('waiting')).toHaveText('20 minutes. One message is waiting for you.');
  expect((await getNote(id)).heard_at).toBeNull();
});

test('R3: a message heard with no signal is marked once the connection is back', async ({ page, context }) => {
  const { corner, sessions } = await today(page);
  const id = await sendNote(corner, 'Anna', { sessionId: sessions[0].id });
  await refresh(page);
  await startSession(page, 0);

  await context.setOffline(true);
  await page.clock.fastForward(10 * MIN + 2_000);
  await finished(page);
  await page.waitForTimeout(500);
  expect((await getNote(id)).heard_at).toBeNull(); // could not reach the server

  // Back in range: the next launch sends the saved mark, and the message does not come back.
  await context.setOffline(false);
  await page.reload();
  await expect.poll(async () => (await getNote(id)).heard_at).not.toBeNull();
  await pickDay(page, 0);
  await expect(page.getByTestId('waiting')).toHaveText('20 minutes. No one has left a message here yet.');
  await expect(page.getByTestId('heard')).toHaveText('Anna was with you.');
});
