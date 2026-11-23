// Capability scenarios for `session-playback`, and the full loop from share link to hearing
// a note, driven through the athlete app's web build with a controllable clock.
import { expect, test } from '@playwright/test';
import { sendNote } from './helpers.mjs';
import { athleteWithCorner, notePlays, spyOnAudio, startSession } from './ui.mjs';

const MIN = 60_000;

test('the full loop: a supporter records from the link, the athlete hears it mid-session', async ({ page, context }) => {
  await page.clock.install();
  await spyOnAudio(page);
  const { link } = await athleteWithCorner(page);
  await expect(page.getByText('Nothing new yet')).toBeVisible();

  // Supporter: open the link, record, send.
  const supporter = await context.newPage();
  await supporter.goto(link);
  await supporter.getByRole('button', { name: 'Record a note' }).click();
  await supporter.waitForTimeout(1500);
  await supporter.getByRole('button', { name: 'Stop' }).click();
  await supporter.getByLabel('Your first name').fill('Anna');
  await supporter.getByRole('button', { name: 'Send note' }).click();
  await expect(supporter.getByText("Thank you — it's on its way")).toBeVisible();
  await supporter.close();

  // Athlete: the note is waiting; start a 20 minute session.
  await page.getByRole('button', { name: 'Check again' }).click();
  await expect(page.getByTestId('waiting-count')).toHaveText('1 note is waiting for you');
  const startedAt = await startSession(page, 20);
  await expect(page.getByTestId('next-note')).toContainText('in about 10 min');

  // R2: nothing at the start, nothing just before the midpoint.
  await page.clock.fastForward(9 * MIN + 50_000);
  expect(await notePlays(page)).toHaveLength(0);

  // At 10 minutes the note plays, and the screen says who is with them.
  await page.clock.fastForward(15_000);
  await expect(page.getByTestId('now-playing')).toHaveText('Anna');
  const plays = await notePlays(page);
  expect(plays).toHaveLength(1);
  expect(plays[0].at - startedAt).toBeGreaterThanOrEqual(10 * MIN);
  expect(plays[0].at - startedAt).toBeLessThan(10 * MIN + 30_000);

  // R6: when the last note has played the session closes by itself.
  await expect(page.getByRole('heading', { name: "That's everyone for today" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('session-summary')).toHaveText('You heard 1 note.');
});

test('R2: three notes in 60 minutes play at 15, 30 and 45 minutes, oldest first', async ({ page }) => {
  await page.clock.install();
  await spyOnAudio(page);
  const { corner } = await athleteWithCorner(page);
  const t = Date.now();
  await sendNote(corner, 'Anna', { createdAt: new Date(t - 3000).toISOString() });
  await sendNote(corner, 'Ben', { createdAt: new Date(t - 2000).toISOString() });
  await sendNote(corner, 'Chloé', { createdAt: new Date(t - 1000).toISOString() });
  await page.getByRole('button', { name: 'Check again' }).click();
  await expect(page.getByTestId('waiting-count')).toHaveText('3 notes are waiting for you');

  await page.getByRole('radio', { name: '120 min', exact: true }).click(); // change of mind
  const startedAt = await startSession(page, 60);

  const heard = [];
  for (const name of ['Anna', 'Ben', 'Chloé']) {
    await page.clock.fastForward(14 * MIN + 45_000);
    await expect(page.getByTestId('now-playing')).toBeHidden();
    await page.clock.fastForward(15_000 + heard.length * 3_000);
    await expect(page.getByTestId('now-playing')).toHaveText(name);
    heard.push(name);
    if (name !== 'Chloé') await expect(page.getByText('Put your phone away')).toBeVisible({ timeout: 15_000 });
  }
  await expect(page.getByTestId('session-summary')).toHaveText('You heard 3 notes.', { timeout: 15_000 });

  const offsets = (await notePlays(page)).map((p) => Math.round((p.at - startedAt) / MIN));
  expect(offsets).toEqual([15, 30, 45]);
});

test('R6: ending early stops the session and leaves the rest waiting', async ({ page }) => {
  await page.clock.install();
  await spyOnAudio(page);
  const { corner } = await athleteWithCorner(page);
  for (const name of ['Anna', 'Ben', 'Chloé']) await sendNote(corner, name);
  await page.getByRole('button', { name: 'Check again' }).click();
  await startSession(page, 60);

  await page.clock.fastForward(15 * MIN + 2_000);
  await expect(page.getByTestId('now-playing')).toBeVisible();
  await expect(page.getByText('1 of 3 notes heard')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'End session' }).click();

  await expect(page.getByRole('heading', { name: 'Session ended' })).toBeVisible();
  await expect(page.getByTestId('session-summary')).toHaveText('You heard 1 note. 2 notes are still waiting for your next session.');
  await page.clock.fastForward(30 * MIN);
  expect(await notePlays(page)).toHaveLength(1);
});

test('R1: a corner with no unheard notes points to the share link instead of Start', async ({ page }) => {
  await athleteWithCorner(page);
  await expect(page.getByText('Nothing new yet')).toBeVisible();
  await expect(page.getByText('Share your link below')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start' })).toHaveCount(0);
});

test('R3: once started, the session plays with the network gone', async ({ page, context }) => {
  await page.clock.install();
  await spyOnAudio(page);
  const { corner } = await athleteWithCorner(page);
  await sendNote(corner, 'Anna');
  await page.getByRole('button', { name: 'Check again' }).click();
  await startSession(page, 20);

  await context.setOffline(true);
  await page.clock.fastForward(10 * MIN + 2_000);
  await expect(page.getByTestId('now-playing')).toHaveText('Anna');
  await expect(page.getByRole('heading', { name: "That's everyone for today" })).toBeVisible({ timeout: 15_000 });
  await context.setOffline(false);
});
