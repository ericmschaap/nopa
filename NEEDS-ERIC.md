# Needs Eric

Things that need your hands. Each has what to do and why.

## To run anything locally
- **Docker** must be running for the local Supabase stack (`npm run db:start`).

## Real-phone checks
- [ ] **Supporter page on iPhone Safari and Android Chrome:** open a share link, record,
      listen back, send. Checked here only in desktop Chromium with a fake microphone. Watch
      for: the microphone prompt appearing, the preview playing, and the note arriving.
      The page must be served over **HTTPS** (browsers block the microphone on plain http,
      except on localhost).
- [ ] **Share sheet:** on a corner, tap "Share link" and send it to yourself. The web build
      used in tests only copies the link, so the native share sheet is unchecked.
- [ ] **Locked-screen session (the big one).** In a development build (it has a 2-minute
      option): send yourself two notes, start a 2 min session, lock the phone. Expect notes
      at about 0:40 and 1:20. Then repeat with a 20 min session and the phone in a pocket.
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
