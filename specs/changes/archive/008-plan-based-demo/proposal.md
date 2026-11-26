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

## Revision (26 Nov, after Eric's feedback)
The handwriting was too much. The look is now a studio timetable: a refined serif for names
and moments, a light sans with small spaced capitals for labels, one muted sage, pill
buttons, more white space. Flow and wording unchanged. Re-run of the same check: passes.

## Revision 2 (26 Nov)
Eric: closer, but a little sterile; and the plan should come either from elsewhere (Garmin,
Polar and the like) or be set up in the app.
- **Warmer:** warmer paper, a soft wash behind the title, the next session lifted into a
  rounded panel, a dot for each note, the streak sentence in italic serif, one slow
  "breathing" circle behind the name of whoever is with you.
- **Plan setup, two ways:** "A typical week" (pick what each weekday holds; it repeats until
  the finish day) and "Bring it in" (paste a plan as text; Claude turns it into sessions).
- **Finding on direct import:** Garmin's Training API is for publishing workouts *to* Garmin
  (business tiers), and Polar's AccessLink exposes completed training; no documented way
  was found for a third party to read an athlete's planned sessions from either. Needs
  confirming with both before promising a "connect Garmin" button.
- Checked in Chromium: typical week replaces the plan and keeps heard sessions; notes left
  for a removed session wait for the next one. The pasted-plan path could not be run here
  (it needs the artifact viewer); only its empty and unavailable states were checked.

## Revision 3 (26 Nov)
Eric: this is for anyone working towards an athletic goal (a 5K, a mountain, a bike ride),
not for "proper" endurance athletes; no coach input; keep it basic. The basics are: share a
link, people record a message, it plays when you need it most, in a training session.
- Sessions are no longer sport terms. Each is **an easy one, a hard one or a long one**, with
  a day and a rough length. Works for any goal, and tells a friend where they are needed.
- Plan setup is one screen: which days you usually train and what kind of day each is.
- The pasted-plan import and all coach / training-app wording are removed. Importing from
  Garmin, Polar or anywhere else is parked.
- Example goal is "My first 10K"; the switch at the top reads "you · a friend".
- Same check re-run: passes.
