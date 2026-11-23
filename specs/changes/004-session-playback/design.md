# 004 — design

## Pieces
- `athlete/src/lib/schedule.ts` — pure spacing maths.
- `athlete/src/lib/session.ts` — the session engine: owns the clock, decides when to play,
  never overlaps notes. It talks to audio through a small `AudioPort` interface, so it is
  unit-tested with a fake port and a fake clock.
- `athlete/src/lib/audio.ts` — the real `AudioPort`, built on `expo-audio`.
- `athlete/src/lib/download.ts` — fetches the session's audio before it starts.

## Staying alive with the screen locked
Phones suspend an app's JavaScript shortly after the screen locks unless it is playing audio.
The standard background-audio mode is used:

- `UIBackgroundModes: ["audio"]` (iOS) and `expo-audio`'s background playback service
  (Android), both set in `athlete/app.json`.
- For the whole session a **silent track loops** in "mix with others" mode. It is inaudible
  and does not touch the athlete's music, but it keeps the audio session — and so the app
  and its timer — alive between notes.
- On Android the silent player is also registered with `setActiveForLockScreen`, which starts
  the foreground media service Android needs for playback longer than a few minutes in the
  background. It shows a quiet "Nopa — your people are with you" media notification.

The timer is a one-second interval that compares the wall clock with each note's due time, so
a late or throttled tick delays a note slightly instead of losing it.

## Ducking, then restoring
Between notes the audio mode is `mixWithOthers`. Around each note:

1. `setAudioModeAsync({ interruptionMode: 'duckOthers' })`, then (re)activate the session.
   iOS lowers other apps' audio; Android requests "transient, may duck" audio focus.
2. Play the note.
3. Restore. Android: switching back to `mixWithOthers` abandons audio focus, which is what
   tells the music app to come back up. iOS: the session is deactivated with
   "notify others on deactivation" (the documented way to end ducking), switched back to
   `mixWithOthers`, reactivated, and the silent loop resumes. The gap is a few milliseconds.

Read from the `expo-audio` 58 sources (`ios/AudioModule.swift`, `android/.../AudioModule.kt`)
rather than from memory. Whether each phone really ducks and restores is a real-phone check.

## No network during the session
Before the session starts, every scheduled note is fetched through a one-hour signed URL into
the app's cache directory (in the web build: into memory). Start is refused with a clear
message if a download fails. Playback then needs no connection.

## Storage access
A new storage policy lets a signed-in athlete read an object in the `notes` bucket only if a
note in one of their own corners points at it.
