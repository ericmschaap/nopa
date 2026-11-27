# Progress

The product now follows the direction Eric set on 26 November (see `specs/project.md`): a
simple plan, a calendar with dots on both sides, friends pick a day or "any time", sessions
take their length from the plan, the streak reads as weeks side by side, and the new look.
The loop works end to end against a local Supabase stack.

Test status at the last run: 35 unit, 40 database, 34 end-to-end, all passing.

## Changes

| # | Change | Status |
| --- | --- | --- |
| 001 | scaffold-and-specs | archived |
| 002 | supporter-recording | archived |
| 003 | corners-share-links | archived |
| 004 | session-playback | archived (real-phone checks pending) |
| 005 | heard-tracking | archived |
| 006 | streak | archived |
| 007 | phone-demo | archived (a demo page, not a product capability) |
| 008 | plan-based-demo | archived (the demo that set the new direction) |
| 009 | plan-and-calendar | archived (the product brought in line with the demo) |

## Stubbed

- **"They listened" notifications:** the contact is stored in `note_contacts`; nothing reads
  it or sends anything (out of scope).
- **Orphan uploads:** an audio file uploaded without a following `submit_note` stays in the
  bucket unreadable; there is no clean-up job.

## Not verified, and why

- **Locked-screen playback and ducking (session-playback R3, R4).** Built on expo-audio's
  background mode as the brief directs, read against the expo-audio 58 native sources, but
  this environment has no phone or simulator. Everything else about a session (spacing,
  ordering, offline, ending) is verified in the web build. See `NEEDS-ERIC.md`.

## Known limits

- **No cap on messages per session.** Many messages in a short session play close together.
- **No plan import.** The plan is set in the app only. Garmin and Polar do not appear to let
  a third party read planned sessions (two quick searches, not confirmed with either).
- **The calendar shows five weeks.** The plan is filled 12 weeks ahead, but later weeks are
  not yet reachable on screen.
- **The usual-week "every day is rest" message and the app's calendar dots** are not covered
  by an automated test.
- **Force-quitting the app ends a session**; unplayed notes stay unheard.
- **Anonymous athlete account.** Reinstalling the app, or clearing its data, loses access to
  the corners.

## Failed, and why

Nothing so far.
