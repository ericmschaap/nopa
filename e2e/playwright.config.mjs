import { defineConfig } from '@playwright/test';
import { ATHLETE_URL, SUPPORTER_URL } from './local.mjs';

// Needs: `npm run db:start` (local Supabase) and a web export of the athlete app
// (`npm run e2e` builds it first).
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.mjs',
  workers: 1,
  timeout: 60_000,
  reporter: 'list',
  use: {
    trace: 'off',
    locale: 'en-GB',
    permissions: ['microphone', 'clipboard-read', 'clipboard-write'],
    launchOptions: {
      // A fake microphone (a steady beep) so the supporter page can really record.
      args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
    },
  },
  webServer: [
    { command: 'node ../scripts/serve.mjs ../supporter 8080', url: SUPPORTER_URL, reuseExistingServer: true },
    { command: 'node ../scripts/serve.mjs ../athlete/dist 8081', url: ATHLETE_URL, reuseExistingServer: true },
  ],
});
