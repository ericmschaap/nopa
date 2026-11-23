# Nopa

Milestone 1, "playback proof": a throwaway static page (`index.html`, no build, no backend)
that tests whether a phone browser can play three voice notes spaced through a training
session while the screen is locked.

## Test protocol

1. Open the page over HTTPS on the phone, record or upload three notes.
2. Headphones in. Pick a mode, set the gap (1 min for a smoke test, 10 for the real one).
3. Tap Start, hear note 1, lock the phone, pocket it.
4. After the last note is due, unlock and read the log: each note's due time, real start
   time and drift. "Copy log as JSON" exports everything, including page events.

Run it once per mode per phone (iPhone Safari, Android Chrome).

- **Mode A (naive):** one `<audio>` element, `setTimeout` between notes.
- **Mode B (continuous):** notes stitched into one WAV with silence (or faint noise) in the
  gaps, played by a single `<audio>` element with Media Session metadata.
