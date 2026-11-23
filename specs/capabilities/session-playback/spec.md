# Capability: session-playback

The athlete taps Start, puts the phone away, and hears their people through the session.

Status: built in change 004. Logic: `athlete/src/lib/schedule.ts`, `session.ts`. Audio:
`athlete/src/lib/audio.ts` (expo-audio). Screens: `CornerScreen.tsx`, `SessionScreen.tsx`.
Verified by unit tests beside the logic and `e2e/session.spec.mjs` (web build).
**R3 (screen locked) and R4 (ducking) are implemented but only checkable on a real phone —
see `NEEDS-ERIC.md`.**

## Requirements

### R1 — Start a session with a rough duration
The system SHALL let the athlete start a session for a corner by picking a rough duration
(20, 30, 45, 60, 90 or 120 minutes; development builds add 2 minutes) and tapping Start.

- GIVEN an athlete on a corner with unheard notes
  WHEN they pick "45 min" and tap Start
  THEN a session begins and they need to do nothing more.

- GIVEN an athlete on a corner with no unheard notes
  WHEN they look at the corner
  THEN they are told there is nothing new yet, are pointed to the share link, and there is
  no Start button.

### R2 — Notes are spaced evenly, never bunched at the start
The system SHALL spread all of the corner's unheard notes evenly across the session: with N
notes and duration D, note i (1..N, oldest first) is due at D × i / (N + 1). There is no cap
on N.

- GIVEN 3 unheard notes and a 40-minute session
  WHEN the session starts
  THEN the notes are due at 10, 20 and 30 minutes, and nothing plays at the start.

- GIVEN 1 unheard note and a 30-minute session
  WHEN the session starts
  THEN the note is due at 15 minutes.

- GIVEN a note that becomes due while the previous note is still playing
  WHEN the previous note ends
  THEN the next one plays straight after it, never over it.

- GIVEN the app's timer was delayed past a note's due time
  WHEN the timer next runs
  THEN the note plays then; it is not lost.

### R3 — Works with the phone away
The system SHALL download the session's notes before the session starts, so playback needs
no network, and SHALL keep playing with the screen locked using the platform's standard
background-audio mode (a silent track keeps the audio session alive between notes; on
Android a foreground media service runs for the length of the session).

- GIVEN a session that has started
  WHEN the athlete locks the phone and loses signal
  THEN each note still plays at its due time.

- GIVEN an athlete who taps Start while the notes cannot be downloaded
  WHEN the download fails
  THEN no session starts and they are asked to check their connection and try again.

### R4 — Plays alongside the athlete's own audio
The system SHALL leave the athlete's music or podcast playing between notes, lower (duck) it
while a note plays, and restore it when the note ends.

- GIVEN music playing from another app during a session
  WHEN a note becomes due
  THEN the music gets quieter, the note plays over it, and the music returns to full volume.

- GIVEN a session between notes
  WHEN nothing is due
  THEN the other app's audio is at its normal volume.

### R5 — The session ends by itself or by hand
The system SHALL end the session once the last note has played, and SHALL let the athlete
end it early. Notes that did not play to the end — not yet due, cut short, or failed —
stay unheard. Force-quitting the app ends the session.

- GIVEN a session whose last note has just finished
  WHEN nothing is left to play
  THEN the session closes by itself and says how many notes were heard.

- GIVEN a session with 3 notes where 1 has played
  WHEN the athlete taps End
  THEN playback stops and the other 2 notes are still unheard for the next session.

- GIVEN a note whose audio fails to play
  WHEN the session moves on
  THEN that note is skipped and stays unheard.
