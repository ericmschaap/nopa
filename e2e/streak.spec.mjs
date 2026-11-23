// Capability scenarios for `streak` as people see it: on the share page and in the app.
import { expect, test } from '@playwright/test';
import { sendNote } from './helpers.mjs';
import { athleteWithCorner } from './ui.mjs';

const WEEK = 7 * 24 * 3600e3;
const weeksAgo = (n) => new Date(Date.now() - n * WEEK).toISOString();

test('R4: supporter sees the corner streak and that a note this week keeps it going', async ({ page, context }) => {
  const { link, corner } = await athleteWithCorner(page);
  await sendNote(corner, 'Anna', { createdAt: weeksAgo(3) });
  await sendNote(corner, 'Ben', { createdAt: weeksAgo(2) });
  await sendNote(corner, 'Anna', { createdAt: weeksAgo(1) });

  const supporter = await context.newPage();
  await supporter.goto(link);
  await expect(supporter.locator('#corner-streak')).toHaveText('This corner has shared 3 weeks in a row. A note this week keeps it going.');

  // Anyone sending a note this week keeps it alive: here a third person, Chloé.
  await supporter.getByRole('button', { name: 'Record a note' }).click();
  await supporter.waitForTimeout(1200);
  await supporter.getByRole('button', { name: 'Stop' }).click();
  await supporter.getByLabel('Your first name').fill('Chloé');
  await supporter.getByRole('button', { name: 'Send note' }).click();
  await expect(supporter.locator('#corner-streak')).toHaveText('This corner has shared 4 weeks in a row. This week is already part of it.');

  // The athlete sees the same single streak.
  await page.getByRole('button', { name: 'Check again' }).click();
  await expect(page.getByTestId('streak')).toContainText('Your corner has shared 4 weeks in a row');
  await expect(page.getByTestId('streak')).toContainText('This week is already part of it.');
});

test('R2 + R4: an empty corner and a lapsed corner are worded gently', async ({ page, context }) => {
  const { link, corner } = await athleteWithCorner(page);
  await expect(page.getByTestId('streak')).toContainText('Your corner is just getting started');
  const supporter = await context.newPage();
  await supporter.goto(link);
  await expect(supporter.locator('#corner-streak')).toHaveText('Be the first to share a moment this week.');

  await sendNote(corner, 'Anna', { createdAt: weeksAgo(2) }); // lapsed: last week had no note
  await supporter.reload();
  await expect(supporter.locator('#corner-streak')).toHaveText('Be the first to share a moment this week.');
});

test('R3: one streak for the corner, no per-person counts on either side', async ({ page, context }) => {
  const { link, corner } = await athleteWithCorner(page);
  await sendNote(corner, 'Anna', { createdAt: weeksAgo(1) });
  await sendNote(corner, 'Anna');
  await sendNote(corner, 'Anna');
  await sendNote(corner, 'Ben');
  await page.getByRole('button', { name: 'Check again' }).click();
  await expect(page.getByTestId('streak')).toHaveCount(1);
  await expect(page.getByTestId('streak')).toContainText('2 weeks in a row');
  await expect(page.getByTestId('streak')).not.toContainText(/Anna|Ben/);

  const supporter = await context.newPage();
  await supporter.goto(link);
  await expect(supporter.locator('#corner-streak')).toContainText('2 weeks in a row');
  // The share page names nobody at all.
  await expect(supporter.locator('main')).not.toContainText(/Anna|Ben/);
});
