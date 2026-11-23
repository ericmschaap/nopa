# Nopa

Nopa (Luxembourgish for *neighbour*) lets the people around an athlete share the journey to a
goal. Friends and family record short voice notes from a link; the athlete hears them spread
through training sessions, over their own music, with the phone locked away.

This is a working first version of the whole loop. What is built is specified in
[`specs/`](specs/project.md); what still needs a human is in [`NEEDS-ERIC.md`](NEEDS-ERIC.md);
status is in [`PROGRESS.md`](PROGRESS.md).

| Folder | What |
| --- | --- |
| `athlete/` | The athlete app (Expo / React Native) |
| `supporter/` | The supporter page (plain HTML + JS, no build) |
| `supabase/` | Database migrations and local stack config |
| `e2e/` | Database tests and Playwright end-to-end tests |
| `specs/` | Source of truth: project, capability specs, archived changes |
| `index.html` | The earlier milestone 1 playback-proof page. Not part of the product. |

## Run it on your computer

Needs Node 22+ and Docker (for the local Supabase stack).

```bash
npm install
(cd athlete && npm install && cp .env.example .env)

npm run db:start        # local Supabase: database, auth, storage. First run downloads images.
npm run supporter       # supporter page on http://localhost:8080      (leave running)
cd athlete && npx expo start --web     # athlete app in a browser tab   (leave running)
```

`athlete/.env.example` and `supporter/config.js` already point at the local stack.

## Walk the full loop (in the browser, about 3 minutes)

1. **Athlete:** in the athlete tab, name a goal and a finish date, tap **Create corner**.
   You land on the corner with its share link. Tap **Copy link**.
2. **Supporter:** paste the link into a new tab (or a private window: no account either way).
   You see the goal and finish date. Tap **Record a note**, allow the microphone, say
   something, tap **Stop**, listen back, type a first name, tap **Send note**. Optionally
   leave an email or phone number, or tap **No thanks**.
3. **Athlete:** back in the athlete tab tap **Check again**. "1 note is waiting for you".
   Pick **2 min** (this option only exists in development builds) and tap **Start**.
4. Wait about a minute: one note in a 2-minute session plays at the 1-minute mark. The screen
   shows who is with you, then the session closes by itself.
5. Tap **Done**. The note is now under "1 note heard" with the time, nothing is waiting, and
   the streak line shows the corner's first week. Reload the supporter tab to see the same
   streak there.

Send two or three notes before starting to hear them spaced out (three notes in two minutes
play at 0:30, 1:00 and 1:30).

## Run it on a real phone

The browser walk-through proves the loop, not locked-screen playback or ducking: those need
the native app on a phone. That takes accounts and a device, so the steps are in
[`NEEDS-ERIC.md`](NEEDS-ERIC.md). In short: create a Supabase project and push the
migrations, host `supporter/` somewhere with HTTPS, put the project's URL and anon key in
`athlete/.env` and `supporter/config.js`, then `cd athlete && npx expo run:ios --device`
(or `run:android`). The app needs a development build; it does not run in Expo Go.

## Tests

```bash
npm test          # athlete: type check + 30 unit tests (spacing, session engine, outbox, ...)
npm run db:test   # 30 tests of the server rules against local Supabase
npm run e2e       # 28 Playwright tests: builds the athlete web app, then drives both sides
```

`npm run db:test` and `npm run e2e` need `npm run db:start` first. The e2e suite uses
Chromium's fake microphone to really record, and a controllable clock to run a 60-minute
session in seconds. Each capability scenario in `specs/capabilities/` is mapped to the test
that checks it in the archived change's `tasks.md`.

## How it works, briefly

- **No accounts to manage.** The athlete app signs in anonymously on first launch.
  Supporters use the public key and can only do three things: read a corner's name, date and
  streak by its link token; upload a WAV; attach a note (and optionally a contact) to it.
- **Notes are WAV.** The supporter's browser converts whatever it recorded to mono 16-bit
  WAV, so every phone can play every note with no server transcoding.
- **Spacing.** N unheard notes in a session of length D play at D × i / (N + 1): evenly
  spread, never at the start.
- **Phone away.** Notes are downloaded before the session starts. A silent track keeps the
  app alive in the background; around each note the audio mode switches to "duck others"
  and back, so the athlete's own audio dips and returns.
- **Heard.** A note that plays to the end is saved as heard on the phone, then sent to the
  server with its time; marks made with no signal go out later.
- **Streak.** One per corner, in ISO weeks (UTC): consecutive weeks in which anyone sent a
  note. The current week stays open until it ends.

## Working on it

Work is spec-first; see [`CLAUDE.md`](CLAUDE.md). One change at a time under
`specs/changes/`, verified and archived before the next begins.
