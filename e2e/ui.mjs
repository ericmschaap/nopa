// Shared steps for driving the athlete app's web build in the e2e specs.
import { expect } from '@playwright/test';
import { ATHLETE_URL } from './local.mjs';
import { admin } from './helpers.mjs';

export async function createCorner(page, name, [day, month, year]) {
  await page.getByLabel('Your goal').fill(name);
  await page.getByLabel('Day').fill(day);
  await page.getByLabel('Month').fill(month);
  await page.getByLabel('Year').fill(year);
  await page.getByRole('button', { name: 'Create corner' }).click();
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
/** Plays of note audio (blob: URLs), leaving out the silent keep-alive track. */
export const notePlays = (page) => page.evaluate(() => window.__plays.filter((p) => p.src.startsWith('blob:')));

export async function athleteWithCorner(page, name = 'Berlin Marathon') {
  await page.goto(ATHLETE_URL);
  await createCorner(page, name, ['26', '9', '2027']);
  const link = await page.getByTestId('share-link').innerText();
  const share_token = new URL(link).searchParams.get('c');
  const [corner] = (await admin(`/rest/v1/corners?share_token=eq.${share_token}`)).json;
  return { link, corner };
}

export async function startSession(page, minutes) {
  await page.getByRole('radio', { name: `${minutes} min`, exact: true }).click();
  const startedAt = await page.evaluate(() => Date.now());
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByText('Put your phone away')).toBeVisible();
  return startedAt;
}

