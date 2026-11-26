# Needs Eric

Things that need your hands, in the order you will hit them. Nothing here blocks the browser
walk-through in the README; all of it is needed to hear a note on a locked phone.

## 1. Accounts and hosting (about 30 minutes)

- [ ] **Supabase project.** Create one at supabase.com (free tier is enough). Then, from the
      repo root:
      ```bash
      npx supabase login
      npx supabase link --project-ref <your-project-ref>
      npx supabase db push          # applies supabase/migrations, including the notes bucket
      ```
- [ ] **Turn on anonymous sign-ins** in the Supabase dashboard: Authentication → Sign In /
      Providers → "Allow anonymous sign-ins". The athlete app cannot start without it.
      (Locally this is already on via `supabase/config.toml`.) Supabase recommends adding a
      CAPTCHA before a public launch to stop sign-up abuse; not needed for testing.
- [ ] **Keys.** From Project Settings → API copy the project URL and the `anon` public key
      into both `supporter/config.js` and `athlete/.env` (copy `athlete/.env.example`).
      Both values are public by design, so committing `supporter/config.js` is fine.
      Never put the `service_role` key anywhere in this repo.
- [ ] **Host the supporter page.** Any static host with HTTPS works (GitHub Pages, Netlify,
      Cloudflare Pages, Vercel): publish the `supporter/` folder as it is, no build step.
      Put its address in `athlete/.env` as `EXPO_PUBLIC_SUPPORTER_URL`; share links are
      `<that address>/?c=<token>`.
- [ ] **Build the athlete app onto a phone.** It uses native background audio, so it needs a
      development build, not Expo Go:
      - iPhone: a Mac with Xcode and your Apple ID, then `cd athlete && npx expo run:ios --device`.
      - Android: Android Studio (or just the SDK) and USB debugging, then
        `cd athlete && npx expo run:android --device`.
      - Or in the cloud with an Expo account: `npx eas-cli@latest build --profile development`.
      The bundle id / package is `app.nopa.athlete` (change in `athlete/app.json` if taken).
- [ ] **A phone cannot reach the local stack easily.** iOS and Android block plain `http://`
      to your computer, so use the hosted project for phone tests.

## 2. To run anything locally
- **Docker** must be running for the local Supabase stack (`npm run db:start`).

## 3. Real-phone checks

None of these could be checked in the build environment (no phone, no simulator).
- [ ] **Supporter page on iPhone Safari and Android Chrome:** open a share link, record,
      listen back, send. Checked here only in desktop Chromium with a fake microphone. Watch
      for: the microphone prompt appearing, the preview playing, and the note arriving.
      The page must be served over **HTTPS** (browsers block the microphone on plain http,
      except on localhost).
- [ ] **Share sheet:** on a corner, tap "Share link" and send it to yourself. The web build
      used in tests only copies the link, so the native share sheet is unchecked.
- [ ] **Locked-screen session (the big one).** In a development build (it has a 2-minute
      "start as a 2-minute test" link under Start): leave yourself two messages for today, start
      the test, lock the phone. Expect them at about 0:40 and 1:20. Then repeat with a real
      20 or 30 minute session and the phone in a pocket.
      Do it on iPhone and on Android.
- [ ] **Ducking.** Same test with Spotify / Apple Music / a podcast playing. Expect: your
      audio keeps playing between notes at normal volume, gets quieter under each note, and
      comes back to full volume after. If the music stays quiet after a note on iPhone, or
      never ducks, the place to look is `restoreOtherAudio` / `playNote` in
      `athlete/src/lib/audio.ts`.
- [ ] **Silent switch (iPhone)** on: notes should still play (`playsInSilentMode`).
- [ ] **Headphone buttons on Android.** The session runs a media service; check that
      play/pause on your headphones still controls your music app, not Nopa.
- [ ] **Android notification prompt.** The first session asks to allow notifications (for
      the quiet "Nopa — your people are with you" media notification). Check that saying no
      does not stop the session.
- [ ] **A phone call or Siri mid-session:** check the session carries on afterwards.
- [ ] **App Store review note.** Looping a silent track to stay alive between notes is common
      but Apple sometimes questions it. Worth a line in the review notes when you submit.

## 4. Decisions waiting for you

Each was settled the simplest way so the build could carry on; the reasoning is in the
archived proposals under `specs/changes/archive/`.

- **Message length cap: 60 seconds.** Longer or shorter?
- **Three kinds of session: easy, hard, long.** Enough, or do you want a fourth?
- **Friends see how many messages each day has**, never from whom.
- **A message not heard on its day moves to the next session.**
- **The athlete's first name** is asked with the goal and shown on the link.
- **No cap on messages per session.** Want a minimum gap, with the rest held for next time?
- **Session lengths offered in the plan:** 20 / 30 / 45 / 60 / 75 / 90 / 120 / 180 minutes.
- **Weeks for the streak run Monday–Sunday in UTC**, the same for everyone in a corner.
- **Athlete identity is an anonymous account on the device.** Reinstalling loses the
  corners. Add email or Apple/Google sign-in before real users depend on it.
- **Corners cannot be edited or deleted**, and supporters cannot delete a note they sent.
- **Contact field** accepts anything from 3 to 200 characters (email or phone, unvalidated),
  and can be added only within an hour of sending the note.
- **Privacy wording.** Supporters leave a voice recording and maybe an email or phone
  number. Before sharing links beyond friends, the supporter page needs a short privacy
  note and you need a way to delete someone's note on request.
