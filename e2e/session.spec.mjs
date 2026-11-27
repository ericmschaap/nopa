// Capability scenarios for `session-playback`, and the full loop from share link to hearing
// a message, driven through the athlete app's web build with a controllable clock.
import { expect, test } from '@playwright/test';
import { day, sendNote } from './helpers.mjs';
import { athleteWithCorner, notePlays, pickDay, refresh, spyOnAudio, startSession } from './ui.mjs';

const MIN = 60_000;

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await spyOnAudio(page);
});

test('the full loop: a friend picks a day from the link and records; the athlete hears it mid-session', async ({ page, context }) => {
  const { link } = await athleteWithCorner(page, { plan: [[0, 'easy', 20], [2, 'hard', 45]] });
  await pickDay(page, 0);
  await expect(page.getByTestId('waiting')).toHaveText('20 minutes. No one has left a message here yet.');
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toHaveCount(0);

  // Friend: open the link, pick today, record, send.
  const friend = await context.newPage();
  await friend.goto(link);
  await friend.locator(`[data-day="${day(0)}"]`).click();
  await friend.getByRole('button', { name: 'Be the first' }).click();
  await friend.getByRole('button', { name: 'Record', exact: true }).click();
  await friend.waitForTimeout(1500);
  await friend.getByRole('button', { name: 'Stop' }).click();
  await friend.getByLabel('Your first name').fill('Anna');
  await friend.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(friend.getByRole('heading', { name: 'Thank you' })).toBeVisible();
  await friend.close();

  // Athlete: the message is waiting on today; Start, with the length taken from the plan.
  await refresh(page);
  await expect(page.getByTestId('waiting')).toHaveText('20 minutes. One message is waiting for you.');
  const startedAt = await startSession(page, 0);
  await expect(page.getByTestId('next-note')).toContainText('someone is coming in about 10 minutes');

  // R2: nothing at the start, nothing just before the midpoint.
  await page.clock.fastForward(9 * MIN + 50_000);
  expect(await notePlays(page)).toHaveLength(0);

  // At 10 minutes the message plays, and the screen says who is with them.
  await page.clock.fastForward(15_000);
  await expect(page.getByTestId('now-playing')).toHaveText('Anna');
  const plays = await notePlays(page);
  expect(plays).toHaveLength(1);
  expect(plays[0].at - startedAt).toBeGreaterThanOrEqual(10 * MIN);
  expect(plays[0].at - startedAt).toBeLessThan(10 * MIN + 30_000);

  // R5: when the last message has played the session closes by itself.
  await expect(page.getByRole('heading', { name: 'That was everyone' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('session-summary')).toHaveText('Anna was with you today.');
});

test('R2: three messages in a 60-minute session play at 15, 30 and 45 minutes, oldest first', async ({ page }) => {
  const { corner, sessions } = await athleteWithCorner(page, { plan: [[0, 'long', 60]] });
  const t = Date.now();
  await sendNote(corner, 'Anna', { sessionId: sessions[0].id, createdAt: new Date(t - 3000).toISOString() });
  await sendNote(corner, 'Ben', { sessionId: sessions[0].id, createdAt: new Date(t - 2000).toISOString() });
  await sendNote(corner, 'Chloé', { sessionId: sessions[0].id, createdAt: new Date(t - 1000).toISOString() });
  await refresh(page);
  await expect(page.getByTestId('waiting')).toHaveText('1 hour. 3 messages are waiting for you.');
  const startedAt = await startSession(page, 0);

  let i = 0;
  for (const name of ['Anna', 'Ben', 'Chloé']) {
    await page.clock.fastForward(14 * MIN + 45_000);
    await expect(page.getByTestId('now-playing')).toBeHidden();
    await page.clock.fastForward(15_000 + i++ * 3_000);
    await expect(page.getByTestId('now-playing')).toHaveText(name);
    if (name !== 'Chloé') await expect(page.getByText('Put your phone away')).toBeVisible({ timeout: 15_000 });
  }
  await expect(page.getByTestId('session-summary')).toHaveText('Anna, Ben and Chloé were with you today.', { timeout: 15_000 });
  const offsets = (await notePlays(page)).map((p) => Math.round((p.at - startedAt) / MIN));
  expect(offsets).toEqual([15, 30, 45]);
});

test('R2: "any time" messages and ones from a missed day come along to the next session', async ({ page }) => {
  const { corner, sessions } = await athleteWithCorner(page, { plan: [[-1, 'easy', 30], [0, 'hard', 45], [3, 'long', 75]] });
  const t = Date.now();
  await sendNote(corner, 'Missed', { sessionId: sessions[0].id, createdAt: new Date(t - 4000).toISOString() });
  await sendNote(corner, 'Whenever', { createdAt: new Date(t - 3000).toISOString() });
  await sendNote(corner, 'Today', { sessionId: sessions[1].id, createdAt: new Date(t - 2000).toISOString() });
  await sendNote(corner, 'Later', { sessionId: sessions[2].id, createdAt: new Date(t - 1000).toISOString() });
  await refresh(page);
  await pickDay(page, 0);
  await expect(page.getByTestId('waiting')).toHaveText('45 minutes. 3 messages are waiting for you.');
  await startSession(page, 0);
  await page.clock.fastForward(11 * MIN + 30_000);   // 45 min / 4
  await expect(page.getByTestId('now-playing')).toHaveText('Missed');
});

test('R5: ending early stops the session and saves the rest for next time', async ({ page }) => {
  const { corner, sessions } = await athleteWithCorner(page, { plan: [[0, 'long', 60]] });
  for (const name of ['Anna', 'Ben', 'Chloé']) await sendNote(corner, name, { sessionId: sessions[0].id });
  await refresh(page);
  await startSession(page, 0);

  await page.clock.fastForward(15 * MIN + 2_000);
  await expect(page.getByTestId('now-playing')).toBeVisible();
  await expect(page.getByText('Put your phone away')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'end the session' }).click();

  await expect(page.getByRole('heading', { name: 'Session ended' })).toBeVisible();
  await expect(page.getByTestId('session-summary')).toContainText('was with you today. 2 messages are saved for next time.');
  await page.clock.fastForward(40 * MIN);
  expect(await notePlays(page)).toHaveLength(1);
});

test('R1: a day with no messages has no Start', async ({ page }) => {
  await athleteWithCorner(page, { plan: [[0, 'easy', 30]] });
  await pickDay(page, 0);
  await expect(page.getByTestId('waiting')).toHaveText('30 minutes. No one has left a message here yet.');
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toHaveCount(0);
});

test('R3: once started, the session plays with the network gone', async ({ page, context }) => {
  const { corner, sessions } = await athleteWithCorner(page, { plan: [[0, 'easy', 20]] });
  await sendNote(corner, 'Anna', { sessionId: sessions[0].id });
  await refresh(page);
  await startSession(page, 0);

  await context.setOffline(true);
  await page.clock.fastForward(10 * MIN + 2_000);
  await expect(page.getByTestId('now-playing')).toHaveText('Anna');
  await expect(page.getByRole('heading', { name: 'That was everyone' })).toBeVisible({ timeout: 15_000 });
  await context.setOffline(false);
});
