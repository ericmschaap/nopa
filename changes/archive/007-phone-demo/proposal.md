# 007 — phone demo with no backend

## Why
Eric wants to see what Nopa looks like and how it works on his phone before setting up
Supabase, hosting and a native build.

## What
- `demo/nopa-demo.html`: one self-contained page with both sides (the athlete's phone and the
  supporter's link) and a switch between them. Everything lives in the page's memory: no
  backend, no account, nothing leaves the phone. Published as a private Claude artifact.
- It follows the real product's flow and wording: corner with goal and finish date, share
  link, record → listen → first name → send → optional contact, session with a rough
  duration and evenly spaced notes, heard marks, one shared streak.

## Judgment calls
- **It is a demo, not a seventh capability.** No capability spec changes; the product is
  still `athlete/` + `supporter/` + `supabase/`.
- **Session lengths are 1, 2 and 5 minutes** so the spacing can be watched in one sitting.
- **It opens with an example corner and two example notes** so Start works at once; they are
  labelled as examples.
- **Recording falls back in steps.** The artifact viewer does not allow a page to use the
  microphone, so: try the microphone; if refused, offer the phone's own recorder through a
  file picker; or write the note, which is then read aloud by a synthetic voice (or shown on
  screen with a chime if the browser has no voice).
- **No locked-screen playback and no ducking.** A web page cannot do either; the screen is
  kept awake during a session instead. Those remain native-app checks in `NEEDS-ERIC.md`.
- **Reloading resets the demo.**
