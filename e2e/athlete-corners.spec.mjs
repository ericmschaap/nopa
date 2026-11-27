// Capability scenarios for `corners`, `plan` (athlete side) and `share-links` R1, driven
// through the athlete app's web build.
import { expect, test } from '@playwright/test';
import { ATHLETE_URL, SUPPORTER_URL } from './local.mjs';
import { admin, day } from './helpers.mjs';
import { athleteWithCorner, createCorner, freeDayOffset, pickDay } from './ui.mjs';

test('corners R2: a fresh install lands in the app with no login', async ({ page }) => {
  await page.goto(ATHLETE_URL);
  await expect(page.getByRole('heading', { name: 'What are you working towards?' })).toBeVisible();
  await expect(page.getByLabel(/password|email/i)).toHaveCount(0);
});

test('corners R1 + plan R1 + share-links R1: a goal, a usual week, a calendar and a link', async ({ page, context }) => {
  await page.goto(ATHLETE_URL);
  await createCorner(page, { who: 'Sam', name: 'My first 10K', date: ['13', '6', '2027'] });
  await expect(page.getByRole('heading', { name: 'Your usual week' })).toBeVisible();
  await page.getByRole('button', { name: 'Fill my calendar' }).click();

  await expect(page.getByRole('heading', { name: 'My first 10K' })).toBeVisible();
  await expect(page.getByText('13 June 2027')).toBeVisible();
  await expect(page.getByTestId('together-head')).toHaveText('No one yet');
  // The usual week (Tuesday hard, Thursday easy, Sunday long) is on the calendar; the next session is selected.
  await expect(page.getByTestId('day-detail')).toContainText(/an easy one|a hard one|a long one/);
  await expect(page.getByTestId('waiting')).toContainText('No one has left a message here yet.');

  const link = await page.getByTestId('share-link').innerText();
  expect(link).toMatch(new RegExp(`^${SUPPORTER_URL}/\\?c=[0-9a-f]{20}$`));
  const [corner] = (await admin(`/rest/v1/corners?share_token=eq.${new URL(link).searchParams.get('c')}`)).json;
  const sessions = (await admin(`/rest/v1/sessions?corner_id=eq.${corner.id}&order=day`)).json;
  expect(sessions.length).toBeGreaterThanOrEqual(35);
  expect(new Set(sessions.map((s) => s.kind))).toEqual(new Set(['easy', 'hard', 'long']));

  // One tap copies the link.
  await page.getByRole('button', { name: 'Send your link' }).click();
  await expect(page.getByRole('button', { name: 'Link copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);

  // And the link really opens this goal for a supporter.
  const supporter = await context.newPage();
  await supporter.goto(link);
  await expect(supporter.getByText('Sam is working towards')).toBeVisible();
  await expect(supporter.getByRole('heading', { name: 'My first 10K' })).toBeVisible();
});

test('corners R1: a missing first name, goal or date, a wrong date or a past date create nothing', async ({ page }) => {
  await page.goto(ATHLETE_URL);
  await createCorner(page, { who: '' });
  await expect(page.getByRole('alert')).toContainText('first name');
  await createCorner(page, { name: '' });
  await expect(page.getByRole('alert')).toHaveText('Give your goal a name.');
  await createCorner(page, { date: ['', '9', '2027'] });
  await expect(page.getByRole('alert')).toContainText('Add the day');
  await createCorner(page, { date: ['31', '2', '2027'] });
  await expect(page.getByRole('alert')).toContainText("doesn't exist");
  await createCorner(page, { date: ['1', '1', '2020'] });
  await expect(page.getByRole('alert')).toContainText('already passed');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'What are you working towards?' })).toBeVisible();
});

test('corners R3: several goals for one athlete, kept across launches, invisible to another athlete', async ({ page, browser }) => {
  const first = await athleteWithCorner(page, { name: 'A first 10K' });
  await page.getByRole('button', { name: 'another goal' }).click();
  await createCorner(page, { name: 'Ride to the coast', date: ['1', '7', '2027'] });
  await page.getByRole('button', { name: 'Fill my calendar' }).click();
  await expect(page.getByRole('heading', { name: 'Ride to the coast' })).toBeVisible();
  expect(await page.getByTestId('share-link').innerText()).not.toBe(first.link);

  // Relaunch: same athlete, same goals.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Open A first 10K' })).toBeVisible();
  await page.getByRole('button', { name: 'Open Ride to the coast' }).click();
  await expect(page.getByRole('heading', { name: 'Ride to the coast' })).toBeVisible();
  await page.getByRole('button', { name: 'all your goals' }).click();
  await page.getByRole('button', { name: 'Open A first 10K' }).click();
  await expect(page.getByTestId('share-link')).toHaveText(first.link);

  // Another athlete on another phone sees none of it.
  const other = await (await browser.newContext()).newPage();
  await other.goto(ATHLETE_URL);
  await expect(other.getByRole('heading', { name: 'What are you working towards?' })).toBeVisible();
  await expect(other.getByText('10K')).toHaveCount(0);
});

test('plan R2: tap a free day to add a session, and take a day off again', async ({ page }) => {
  const { corner } = await athleteWithCorner(page);
  const offset = freeDayOffset();
  await pickDay(page, offset);
  await expect(page.getByTestId('day-detail')).toContainText('Nothing planned. Add a session?');
  await page.getByTestId('day-detail').getByRole('button', { name: 'a hard one' }).click();
  await expect(page.getByTestId('day-detail')).toContainText('a hard one');
  await expect(page.getByTestId('waiting')).toHaveText('45 minutes. No one has left a message here yet.');
  let rows = (await admin(`/rest/v1/sessions?corner_id=eq.${corner.id}&day=eq.${day(offset)}`)).json;
  expect(rows.map((s) => [s.kind, s.minutes])).toEqual([['hard', 45]]);

  await page.getByRole('button', { name: 'take this day off' }).click();
  await expect(page.getByTestId('day-detail')).toContainText('Nothing planned. Add a session?');
  rows = (await admin(`/rest/v1/sessions?corner_id=eq.${corner.id}&day=eq.${day(offset)}`)).json;
  expect(rows).toEqual([]);
});

test('plan R1: the usual week can be changed later', async ({ page }) => {
  const { corner } = await athleteWithCorner(page);
  const mondays = async () => (await admin(`/rest/v1/sessions?corner_id=eq.${corner.id}`)).json.filter((s) => new Date(s.day + 'T00:00:00Z').getUTCDay() === 1);
  expect(await mondays()).toHaveLength(0);

  await page.getByRole('button', { name: 'set your usual week' }).click();
  await page.getByRole('button', { name: 'Mon: rest' }).click();              // rest -> an easy one
  await page.getByRole('button', { name: 'Mon length: 30 min' }).click();     // 30 -> 45 min
  await page.getByRole('button', { name: 'Tue: a hard one' }).click();        // hard -> a long one
  await page.getByRole('button', { name: 'Tue: a long one' }).click();        // long -> rest
  await page.getByRole('button', { name: 'Fill my calendar' }).click();
  await expect(page.getByTestId('together')).toBeVisible();

  const mon = await mondays();
  expect(mon.length).toBeGreaterThanOrEqual(11);
  expect(mon[0]).toMatchObject({ kind: 'easy', minutes: 45 });
  const all = (await admin(`/rest/v1/sessions?corner_id=eq.${corner.id}`)).json;
  expect(all.filter((s) => new Date(s.day + 'T00:00:00Z').getUTCDay() === 2)).toHaveLength(0);
});
