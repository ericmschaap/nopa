# Capability: session-playback

The athlete taps Start, puts the phone away, and hears their people through the session.

Status: planned (change 004).

## Requirements

### R1 — Start a session with a rough duration
The system SHALL let the athlete start a session for a corner by picking a rough duration
and tapping Start.

- GIVEN an athlete on a corner with unheard notes
  WHEN they pick "45 min" and tap Start
  THEN a session begins and they need to do nothing more.

- GIVEN an athlete on a corner with no unheard notes
  WHEN they look at the corner
  THEN they are told there is nothing new yet and are pointed to the share link.

### R2 — Notes are spaced evenly, never bunched at the start
The system SHALL spread the corner's unheard notes evenly across the session: with N notes
and duration D, note i (1..N, oldest first) is due at D × i / (N + 1).

- GIVEN 3 unheard notes and a 40-minute session
  WHEN the session starts
  THEN the notes are due at 10, 20 and 30 minutes, and nothing plays at the start.

- GIVEN 1 unheard note and a 30-minute session
  WHEN the session starts
  THEN the note is due at 15 minutes.

- GIVEN a note that becomes due while the previous note is still playing
  WHEN the previous note ends
  THEN the next one plays straight after it, never over it.

### R3 — Works with the phone away
The system SHALL download the session's notes before the session starts, so playback needs
no network, and SHALL keep playing with the screen locked using the platform's standard
background-audio mode.

- GIVEN a session that has started
  WHEN the athlete locks the phone and loses signal
  THEN each note still plays at its due time.

### R4 — Plays alongside the athlete's own audio
The system SHALL leave the athlete's music or podcast playing between notes, lower (duck) it
while a note plays, and restore it when the note ends.

- GIVEN music playing from another app during a session
  WHEN a note becomes due
  THEN the music gets quieter, the note plays over it, and the music returns to full volume.

- GIVEN a session between notes
  WHEN nothing is due
  THEN the other app's audio is at its normal volume.

### R5 — Each note is introduced
The system SHALL let the athlete know who a note is from without looking at the phone.

- GIVEN a note from "Anna" is playing
  WHEN the athlete glances at the lock screen or the app
  THEN it shows "Anna" as the sender.

### R6 — The session ends by itself or by hand
The system SHALL end the session when the duration has passed and all due notes have played,
and SHALL let the athlete end it early; notes not yet played stay unheard.

- GIVEN a session with 3 notes where 1 has played
  WHEN the athlete taps End
  THEN playback stops and the other 2 notes are still unheard for the next session.
