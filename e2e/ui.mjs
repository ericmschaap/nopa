// Shared steps for driving the athlete app's web build in the e2e specs.
import { expect } from '@playwright/test';
import { ATHLETE_URL } from './local.mjs';
import { admin, day, seedSession } from './helpers.mjs';

export async function createCorner(page, { who = 'Sam', name = 'My first 10K', date = ['13', '6', '2027'] } = {}) {
  await page.getByLabel('Your first name').fill(who);
  await page.getByLabel('Your goal').fill(name);
  await page.getByLabel('Day').fill(date[0]);
  await page.getByLabel('Month').fill(date[1]);
  await page.getByLabel('Year').fill(date[2]);
  await page.getByRole('button', { name: 'Begin' }).click();
}

/** Record every audio element that starts playing, with the (fake-clock) time it started. */
export async function spyOnAudio(page) {
  await page.addInitScript(() => {
    window.__plays = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      window.__plays.push({ src: this.currentSrc || this.src, at: Date.now() });
      return play.apply(this, arguments);
    };
  });
}
/** Plays of message audio (blob: URLs), leaving out the silent keep-alive track. */
export const notePlays = (page) => page.evaluate(() => window.__plays.filter((p) => p.src.startsWith('blob:')));

/**
 * A fresh athlete with a goal. `plan` replaces the usual week with exact sessions:
 * [[daysFromToday, kind, minutes], ...]. Returns the share link, the corner row and the sessions.
 */
export async function athleteWithCorner(page, { name = 'My first 10K', who = 'Sam', plan = null } = {}) {
  await page.goto(ATHLETE_URL);
  await createCorner(page, { name, who });
  await page.getByRole('button', { name: 'Fill my calendar' }).click();
  await expect(page.getByTestId('together')).toBeVisible();
  const link = await page.getByTestId('share-link').innerText();
  const share_token = new URL(link).searchParams.get('c');
  const [corner] = (await admin(`/rest/v1/corners?share_token=eq.${share_token}`)).json;
  let sessions = [];
  if (plan) {
    await admin(`/rest/v1/sessions?corner_id=eq.${corner.id}`, { method: 'DELETE' });
    for (const [offset, kind, minutes] of plan) sessions.push(await seedSession(corner, offset, kind, minutes));
    await refresh(page);
  }
  return { link, corner, sessions };
}

export const refresh = (page) => page.getByRole('button', { name: 'look for new messages' }).click();
export const pickDay = (page, offset) => page.getByTestId(`day-${day(offset)}`).click();

/** Tap a day and Start. Returns the (fake-clock) time just before starting. */
export async function startSession(page, offset = 0) {
  await pickDay(page, offset);
  const startedAt = await page.evaluate(() => Date.now());
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByText('Put your phone away')).toBeVisible();
  return startedAt;
}

/** The first day from tomorrow on that the default usual week (Tue, Thu, Sun) leaves free. */
export function freeDayOffset() {
  for (let o = 1; o < 7; o++) {
    const wd = new Date(Date.now() + o * 864e5).getDay(); // 0 Sunday
    if (![0, 2, 4].includes(wd)) return o;
  }
  return 1;
}
