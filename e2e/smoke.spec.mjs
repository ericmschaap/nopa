import { expect, test } from '@playwright/test';
import { ANON_KEY, ATHLETE_URL, SUPABASE_URL, SUPPORTER_URL } from './local.mjs';

test('local Supabase answers', async ({ request }) => {
  const res = await request.get(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: ANON_KEY } });
  expect(res.ok()).toBe(true);
  expect((await res.json()).external.anonymous_users).toBe(true);
});

test('supporter page is served', async ({ page }) => {
  await page.goto(SUPPORTER_URL);
  await expect(page.getByText('nopa', { exact: true })).toBeVisible();
});

test('athlete app boots', async ({ page }) => {
  await page.goto(ATHLETE_URL);
  await expect(page.getByText('Nopa').first()).toBeVisible();
});
