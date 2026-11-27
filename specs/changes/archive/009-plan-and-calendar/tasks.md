# 009 — tasks

- [x] 1. Migration: athlete first name, `sessions`, `notes.session_id`, plan functions (+ db tests)
- [x] 2. App logic: `plan.ts` (calendar, which messages a session plays, wording) with unit tests
- [x] 3. App: fonts and theme; goal form with first name; usual-week screen
- [x] 4. App: calendar home with dots, day detail, Start from the plan; session screen restyle
- [x] 5. Supporter page: calendar, pick a day or any time, new look
- [x] 6. E2E rewritten for the new flows
- [x] 7. Capability specs updated (new `plan`); README, PROGRESS, NEEDS-ERIC; archive

## Verification
`npm test`: 35 unit tests pass. `npm run db:test`: 40 pass. `npm run e2e`: 34 pass.
Native iOS and Android bundles export with the four font files.

| Scenario | Checked by |
| --- | --- |
| plan R1 usual week fills the calendar / stops at the finish day | db `R1` (2 tests), e2e `corners R1 + plan R1 + share-links R1` |
| plan R1 changed later; all-rest refused | e2e `plan R1: the usual week can be changed later`; all-rest: app code only, **not tested** |
| plan R2 add / take off one day | e2e `plan R2`, db `R2: one day can be added, changed and taken off` |
| plan R2 messages kept when a day goes | db `R2: taking a day off, or changing the usual week, keeps the messages` |
| plan R3 owner only | db `R3: only the owner can change or read a plan directly` |
| plan R4 link shows sessions and counts, no names; heard ones drop off | db `R4` (2 tests), e2e `plan R4 + R5` |
| plan R5 dots on the supporter calendar | e2e `plan R4 + R5` |
| plan R5 carried-over dots on the athlete calendar | unit `dots show messages waiting per day…`; the app's dots themselves are **not asserted in e2e** (the waiting sentence is) |
| corners R1 first name | e2e `corners R1…` (2 tests), unit, db `corners R1: the athlete gives a first name…` |
| corners R2, R3 | e2e `corners R2`, `corners R3` |
| share-links R1–R4 | e2e `corners R1 + plan R1 + share-links R1`, `share-links R2`, `share-links R3`; db `R4` |
| recording R1–R5 | e2e `recording R1` (3), `R2 + R5 + R6`, `R2: no first name`, `R3` (2); db as before |
| recording R6 chosen day / any time / other corner's session / no plan | e2e `R2 + R5 + R6`, `R6: "any time"…`, `R6: with no plan yet…`; db `recording R6` (2) |
| session-playback R1 start from the plan, length from the plan | e2e `the full loop` (20-minute session → message at 10 min), `R1: a day with no messages has no Start` |
| session-playback R2 spacing; any-time and missed-day messages | e2e `R2` (2 tests), unit `plan.test.ts` (2), `schedule.test.ts`, `session.test.ts` |
| session-playback R3 offline, R5 ends by itself / by hand | e2e `R3`, `the full loop`, `R5` |
| session-playback R3 locked screen, R4 ducking | **still not checked** — real phone |
| heard-tracking R1–R5 | e2e `heard.spec.mjs` (4), db and unit as before |
| streak R1–R3 | db as before, e2e `R3: one streak for everyone…` |
| streak R4 weeks side by side, both sides | e2e `R4`, `R2 + R4`; unit (3 tests) |

## Changed while building
- Sessions have no "done" flag. Whether a day is over is the calendar's business; which
  messages a session plays is worked out when it starts, so a skipped day loses nothing.
- With one goal the app opens straight on its calendar; with several, on the list.
- A tap on the kind or the length in the usual-week screen steps to the next choice (no
  picker component, so no extra native dependency).
- The supporter page keeps recording in place (no file-picker or written fallback; those were
  only for the demo's sandbox).
