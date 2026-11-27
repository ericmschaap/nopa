# Capability: heard-tracking

A note is marked as heard, with the time, once the athlete has heard it.

Status: built in change 005; shown per calendar day since change 009. Server: `mark_note_heard` in `supabase/migrations/`. App:
`athlete/src/lib/heardOutbox.ts`, `heard.ts`, heard list in `CornerScreen.tsx`. Verified by
`heardOutbox.test.ts`, `e2e/heard.spec.mjs`, `e2e/db.test.mjs`.

## Requirements

### R1 — Mark heard after playing
The system SHALL mark a note as heard, with the timestamp at which it finished playing, once
it has played to the end in a session.

- GIVEN a session playing a note from "Anna"
  WHEN the note finishes
  THEN the note's `heard_at` is set to that moment.

- GIVEN a note that was interrupted because the athlete ended the session mid-note
  WHEN the session ends
  THEN the note is still unheard.

### R2 — Heard notes are not replayed
The system SHALL leave heard notes out of later sessions.

- GIVEN a corner with 2 heard notes and 1 unheard note
  WHEN the athlete starts a session
  THEN only the 1 unheard note is scheduled.

### R3 — Survives no signal
The system SHALL save a heard mark on the phone before sending it, retry unsent marks on the
next launch and whenever a corner is refreshed, and keep the original timestamp. Until a mark
has been sent, the app already treats the note as heard.

- GIVEN a note that finished playing while the phone had no signal
  WHEN the app next has a connection
  THEN the note is marked heard on the server with the time it was actually heard.

### R4 — Only the owner can mark, and only once
The system SHALL accept a heard mark only from the athlete who owns the corner, and SHALL
keep the first timestamp if a note is marked again.

- GIVEN a note in athlete A's corner
  WHEN athlete B or a supporter tries to mark it heard
  THEN nothing changes.

- GIVEN a note already heard at 10:00
  WHEN it is marked heard again at 11:00
  THEN `heard_at` is still 10:00.

- GIVEN a mark whose time is in the future, or before the note was sent
  WHEN the server stores it
  THEN the time is brought into the range from the note's creation to now.

### R5 — The athlete can see what has been heard
The system SHALL show the athlete, on each calendar day, how many messages are waiting, and
on a day when messages were heard, who was with them.

- GIVEN a session in which Anna's message played to the end
  WHEN the athlete taps that day afterwards
  THEN they read "Anna was with you." and that no message is waiting there.
