# 008 — plan-based demo, handwritten look

## Why
After seeing the first demo Eric set a new direction (26 Nov): the athlete brings in a
training plan, the share link shows that plan, and each supporter chooses which session to
record for. The look should feel natural rather than digital: handwritten type, very little
colour, no clutter.

## What
`demo/nopa-demo.html` rebuilt to show that direction, so it can be agreed before the product
is changed. Demo only: `athlete/`, `supporter/`, `supabase/` and the capability specs still
describe the first version (one pool of notes per corner, athlete picks a duration).

## Judgment calls (all open for Eric)
- **The session's length comes from the plan**, so the athlete no longer picks a duration.
- **Supporters see each session's day, kind and length, and how many notes it already has**
  ("nobody yet", "2 notes so far"), never who left them.
- **"Any day"** stays as a last choice for a supporter who does not want to pick.
- **A note not heard in its session moves to the next one** rather than being lost.
- **The plan is entered by hand in the demo.** Importing a real plan (file, calendar,
  training app) is the main unknown.
- **Look:** ink on paper, two handwriting faces, pencil rules instead of boxes, one red used
  only while recording.
- This reverses "training-calendar integration" being out of scope in the original brief.
  `specs/project.md` is left as it is until Eric confirms the direction.

## Verification
Driven once in Chromium at phone size: plan shows three sessions with their notes; a friend
picks Saturday's intervals, writes a note, and it appears on that session; starting the long
run plays its two notes in order and ends with "Anna and Mum were with you today"; the row
then reads "you heard Anna and Mum"; adding a session works; no console errors, no sideways
scroll. Not checked on a real phone.
