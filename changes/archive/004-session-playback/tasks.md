# 004 — tasks

- [x] 1. Migration: athlete may read audio of notes in their own corners (+ database test)
- [x] 2. `schedule.ts`: spacing maths with unit tests
- [x] 3. `session.ts`: session engine with unit tests (fake audio, fake clock)
- [x] 4. `audio.ts`: expo-audio port — silent keep-alive, duck / play / restore; silent asset
- [x] 5. `download.ts` + API: list unheard notes, fetch audio before start
- [x] 6. Corner screen: waiting count, duration picker, Start
- [x] 7. Session screen: running, now playing, end early, finished
- [x] 8. E2E: supporter records → athlete session plays it at the right time (web build)
- [x] 9. Native bundles build (iOS + Android export); real-phone checks written to NEEDS-ERIC
- [x] 10. Verify, update spec, archive

## Verification
`npm test`: 20 unit tests pass. `npm run db:test`: 17 pass. `npm run e2e`: 21 pass.
Native: `expo export` builds the iOS and Android bundles; `expo prebuild` output has
`UIBackgroundModes: [audio]` in Info.plist and the `mediaPlayback` foreground service in the
Android manifest (generated folders are not committed).

| Scenario | Checked by |
| --- | --- |
| R1 pick a duration, tap Start | e2e `the full loop`, e2e `R2: three notes…` (changes the choice first) |
| R1 no unheard notes → pointed to the link | e2e `R1: a corner with no unheard notes…` |
| R2 3 notes / 40 min → 10, 20, 30 | unit `3 notes in 40 minutes…` (schedule + engine); e2e runs 60 min → 15, 30, 45 |
| R2 1 note / 30 min → 15 | unit `1 note in 30 minutes…` (schedule + engine); e2e full loop: 20 min → 10 |
| R2 overdue note plays straight after, never over | unit `a note due while another plays waits…` |
| R3 downloaded first; plays with no network | e2e `R3: once started, the session plays with the network gone` |
| R3 keeps playing with the screen locked | **not checked** — real phone, see NEEDS-ERIC |
| R4 ducks other audio, then restores | **not checked** — real phone, see NEEDS-ERIC |
| R5 session ends by itself / by hand | unit (2 tests), e2e `the full loop`, e2e `R6: ending early…` |

## Changed while building
- The 40-minute example is not one of the offered durations, so the e2e uses 60 minutes;
  the 40-minute case is covered by unit tests.
- Android asks for notification permission at the first session so the media notification of
  the background service is visible. The service runs either way.
