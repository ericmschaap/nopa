# Nopa

Milestone 1, "playback proof": a throwaway static page (`index.html`, no build, no backend)
that tests whether a phone browser can play three voice notes spaced through a training
session while the screen is locked.

## Test protocol

1. Open the page over HTTPS on the phone, record or upload three notes.
2. Headphones in. Pick a mode, set the gap (1 min for a smoke test, 10 for the real one).
   Leave "Wait before note 1" at 1 min so every note comes due after the phone is locked.
3. Tap Start, lock the phone straight away, pocket it.
4. After the last note is due, unlock and read the log: each note's due time, whether the
   page was locked at that moment, real start time and drift. "Copy log as JSON" exports
   everything, including page events.

Run it once per mode per phone (iPhone Safari, Android Chrome).

### The real test: mode B, 10-minute gap

Done when one run shows all three notes with Locked? = yes and Off by within ±3 s, and you
heard each one. Settings: mode B, gap 10, wait 1, noise off. Notes are due at about 1, 11
and 21 minutes after Start; leave the phone locked the whole time (no peeking, it resets
nothing but makes Locked? = no). If the track gets killed (a note shows "not played"),
repeat with "near-inaudible noise" on. The stitched track is about 57 MB at this length.

- **Mode A (naive):** one `<audio>` element, `setTimeout` between notes.
- **Mode B (continuous):** notes stitched into one WAV with silence (or faint noise) in the
  gaps, played by a single `<audio>` element with Media Session metadata.
