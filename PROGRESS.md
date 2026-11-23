# Progress

## Changes

| # | Change | Status |
| --- | --- | --- |
| 001 | scaffold-and-specs | archived |
| 002 | supporter-recording | archived |
| 003 | corners-share-links | archived |
| 004 | session-playback | archived (real-phone checks pending) |
| 005 | heard-tracking | archived |
| 006 | streak | archived |

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

- **No cap on notes per session.** 30 unheard notes in a 20-minute session means a note
  every ~40 seconds. A minimum gap is a product decision the brief does not make.
- **Force-quitting the app ends a session**; unplayed notes stay unheard.
- **Anonymous athlete account.** Reinstalling the app, or clearing its data, loses access to
  the corners.

## Failed, and why

Nothing so far.
