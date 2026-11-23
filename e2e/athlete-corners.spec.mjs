// Capability scenarios for `corners` and `share-links` R1, driven through the athlete app's
// web build.
import { expect, test } from '@playwright/test';
import { ATHLETE_URL, SUPPORTER_URL } from './local.mjs';
import { createCorner } from './ui.mjs';


test('corners R2: a fresh install lands in the app with no login', async ({ page }) => {
  await page.goto(ATHLETE_URL);
  await expect(page.getByRole('heading', { name: 'Start your first corner' })).toBeVisible();
  await expect(page.getByLabel(/password|email/i)).toHaveCount(0);
});

test('corners R1 + share-links R1: create a corner, see it with its share link', async ({ page, context }) => {
  await page.goto(ATHLETE_URL);
  await createCorner(page, 'Berlin Marathon', ['26', '9', '2027']);
  await expect(page.getByRole('heading', { name: 'Berlin Marathon' })).toBeVisible();
  await expect(page.getByText('26 September 2027')).toBeVisible();

  const link = await page.getByTestId('share-link').innerText();
  expect(link).toMatch(new RegExp(`^${SUPPORTER_URL}/\\?c=[0-9a-f]{20}$`));

  // One tap copies it.
  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);

  // And the link really opens this corner for a supporter.
  const supporter = await context.newPage();
  await supporter.goto(link);
  await expect(supporter.getByRole('heading', { name: 'Berlin Marathon' })).toBeVisible();
  await expect(supporter.getByText('26 September 2027')).toBeVisible();
});

test('corners R1: empty name, missing, malformed or past date create nothing', async ({ page }) => {
  await page.goto(ATHLETE_URL);
  await createCorner(page, '', ['26', '9', '2027']);
  await expect(page.getByRole('alert')).toHaveText('Give your goal a name.');
  await createCorner(page, 'Goal', ['', '9', '2027']);
  await expect(page.getByRole('alert')).toContainText('Add the finish date');
  await createCorner(page, 'Goal', ['31', '2', '2027']);
  await expect(page.getByRole('alert')).toContainText("doesn't exist");
  await createCorner(page, 'Goal', ['1', '1', '2020']);
  await expect(page.getByRole('alert')).toContainText('already passed');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Start your first corner' })).toBeVisible();
});

test('corners R3: several corners for one athlete, kept across launches, invisible to another athlete', async ({ page, browser }) => {
  await page.goto(ATHLETE_URL);
  await createCorner(page, 'Marathon', ['26', '9', '2027']);
  const marathonLink = await page.getByTestId('share-link').innerText();
  await page.getByRole('button', { name: '‹ All corners' }).click();
  await page.getByRole('button', { name: 'New corner' }).click();
  await createCorner(page, 'Triathlon', ['1', '7', '2027']);
  const triathlonLink = await page.getByTestId('share-link').innerText();
  expect(triathlonLink).not.toBe(marathonLink);

  // Relaunch: same athlete, same corners.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Open Marathon' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Triathlon' })).toBeVisible();
  await page.getByRole('button', { name: 'Open Marathon' }).click();
  await expect(page.getByTestId('share-link')).toHaveText(marathonLink);

  // Another athlete on another phone sees none of it.
  const other = await (await browser.newContext()).newPage();
  await other.goto(ATHLETE_URL);
  await expect(other.getByRole('heading', { name: 'Start your first corner' })).toBeVisible();
  await expect(other.getByText('Marathon')).toHaveCount(0);
});
