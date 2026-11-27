# Nopa

Nopa (Luxembourgish for *neighbour*) lets the people around someone working towards an
athletic goal be there on the way. Friends and family pick a training day from a link and
record a short voice message; the athlete hears them spread through that session, over their
own music, with the phone locked away.

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
| `demo/` | A self-contained demo of both sides with no backend, published as a Claude artifact |
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

1. **You:** in the athlete tab, give your first name, a goal and its day, tap **Begin**.
   Accept the suggested usual week with **Fill my calendar**. You land on your calendar.
   If today is not a training day, tap today and add "an easy one".
2. Tap **Send your link** (in the browser this copies it).
3. **A friend:** paste the link into a new tab or a private window. They see your goal, the
   weeks side by side, and the calendar with a hollow dot under each training day. Tap
   today, **Be the first**, **Record**, say something, **Stop**, listen back, add a first
   name, **Send**. Leave a contact or tap **no thanks**.
4. **You:** back in the athlete tab tap **look for new messages**. Today now has a dot and
   "One message is waiting for you". Tap **start as a 2-minute test** (development builds
   only; **Start** uses the planned length).
5. Wait about a minute: one message in a 2-minute session plays at the 1-minute mark. The
   screen shows who is with you, then the session closes by itself.
6. Tap **Back to the calendar**. Today reads "Anna was with you." and the top of the screen
   reads "One week side by side".

There is also a no-backend demo of both sides in `demo/nopa-demo.html`, published as a Claude
artifact, for looking at the flow without running anything.

## Run it on a real phone

The browser walk-through proves the loop, not locked-screen playback or ducking: those need
the native app on a phone. That takes accounts and a device, so the steps are in
[`NEEDS-ERIC.md`](NEEDS-ERIC.md). In short: create a Supabase project and push the
migrations, host `supporter/` somewhere with HTTPS, put the project's URL and anon key in
`athlete/.env` and `supporter/config.js`, then `cd athlete && npx expo run:ios --device`
(or `run:android`). The app needs a development build; it does not run in Expo Go.

## Tests

```bash
npm test          # athlete: type check + 35 unit tests (plan, spacing, session engine, outbox, ...)
npm run db:test   # 40 tests of the server rules against local Supabase
npm run e2e       # 34 Playwright tests: builds the athlete web app, then drives both sides
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
- **Plan.** A usual week (which days, and whether each is an easy, hard or long one) fills a
  calendar. Friends pick a day from it, or "any time".
- **Spacing.** A session plays the messages left for its day, the "any time" ones and any
  missed earlier. N messages in a session of length D play at D × i / (N + 1): evenly spread,
  never at the start.
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
