// Capability scenarios for `streak` as people see it: weeks side by side, on both sides.
import { expect, test } from '@playwright/test';
import { day, sendNote } from './helpers.mjs';
import { athleteWithCorner, refresh } from './ui.mjs';

const WEEK = 7 * 24 * 3600e3;
const weeksAgo = (n) => new Date(Date.now() - n * WEEK).toISOString();
const plan = [[1, 'hard', 45]];

test('R4: a friend sees the weeks side by side, and that this week is still open', async ({ page, context }) => {
  const { link, corner } = await athleteWithCorner(page, { plan });
  await sendNote(corner, 'Anna', { createdAt: weeksAgo(3) });
  await sendNote(corner, 'Ben', { createdAt: weeksAgo(2) });
  await sendNote(corner, 'Anna', { createdAt: weeksAgo(1) });

  const friend = await context.newPage();
  await friend.goto(link);
  await expect(friend.locator('#together-head')).toHaveText('3 weeks side by side');
  await expect(friend.locator('#together-sub')).toHaveText('Someone has been there for Sam every week for 3 weeks. This week is still open. Will it be you?');
  await expect(friend.locator('.weeks i')).toHaveCount(4);            // three weeks kept and this one, still open
  await expect(friend.locator('.weeks i.on')).toHaveCount(3);

  // Anyone leaving a message this week keeps it going: here a third person, Chloé.
  await friend.locator(`[data-day="${day(1)}"]`).click();
  await friend.locator('#p-go').click();
  await friend.getByRole('button', { name: 'Record', exact: true }).click();
  await friend.waitForTimeout(1200);
  await friend.getByRole('button', { name: 'Stop' }).click();
  await friend.getByLabel('Your first name').fill('Chloé');
  await friend.getByRole('button', { name: 'Send', exact: true }).click();
  await friend.getByRole('button', { name: 'no thanks' }).click();
  await friend.getByRole('button', { name: 'Back to the calendar' }).click();
  await expect(friend.locator('#together-head')).toHaveText('4 weeks side by side');
  await expect(friend.locator('#together-sub')).toHaveText('Someone has been there for Sam every week for 4 weeks, this week too.');
  await expect(friend.locator('.weeks i.on')).toHaveCount(4);

  // The athlete sees the same single streak.
  await refresh(page);
  await expect(page.getByTestId('together-head')).toHaveText('4 weeks side by side');
  await expect(page.getByTestId('together-sub')).toHaveText('Someone has been with you every week for 4 weeks.');
});

test('R2 + R4: no one yet, and a lapsed streak, read as an invitation', async ({ page, context }) => {
  const { link, corner } = await athleteWithCorner(page, { plan });
  await expect(page.getByTestId('together-head')).toHaveText('No one yet');
  await expect(page.getByTestId('together-sub')).toHaveText('Send your link to the people close to you.');
  const friend = await context.newPage();
  await friend.goto(link);
  await expect(friend.locator('#together-head')).toHaveText('Be the first one there');
  await expect(friend.locator('#together-sub')).toHaveText('One message from you and Sam is not doing this alone.');

  await sendNote(corner, 'Anna', { createdAt: weeksAgo(2) }); // lapsed: last week had no message
  await friend.reload();
  await expect(friend.locator('#together-head')).toHaveText('Be the first one there');
});

test('R3: one streak for everyone, no per-person counts on either side', async ({ page, context }) => {
  const { link, corner } = await athleteWithCorner(page, { plan });
  await sendNote(corner, 'Anna', { createdAt: weeksAgo(1) });
  await sendNote(corner, 'Anna');
  await sendNote(corner, 'Anna');
  await sendNote(corner, 'Ben');
  await refresh(page);
  await expect(page.getByTestId('together')).toHaveCount(1);
  await expect(page.getByTestId('together-head')).toHaveText('2 weeks side by side');
  await expect(page.getByTestId('together')).not.toContainText(/Anna|Ben/);

  const friend = await context.newPage();
  await friend.goto(link);
  await expect(friend.locator('#together-head')).toHaveText('2 weeks side by side');
  await expect(friend.locator('main')).not.toContainText(/Anna|Ben/); // the link names nobody but the athlete
});
