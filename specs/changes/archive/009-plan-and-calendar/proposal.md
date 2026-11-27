# 009 — plan, calendar and the new look in the real product

## Why
Eric agreed the direction shown in the demo (changes 007–008) and asked for the real app and
supporter page to be brought in line with it, and no further.

## What
- **Plan.** A corner gets training sessions: a day, a kind (an easy one / a hard one / a
  long one) and a rough length. The athlete fills them from a usual week, and can add or
  remove a single day on the calendar.
- **Calendar on both sides.** Dots under a day show messages waiting there; a hollow dot
  means a session with no one yet.
- **Supporters pick a day, or "any time",** then record as before.
- **Sessions take their length from the plan.** The athlete taps the day and Start.
- **Weeks side by side.** The streak shown as a row of week-dots with plain wording that
  names the athlete, so the athlete's first name is asked once with the goal.
- **Look.** Serif for names and moments, light sans for the rest, one sage, no boxes.
- Capability specs updated; new capability `plan`.

## Judgment calls
- **This reverses "training-calendar integration: out of scope"** in the original brief, on
  Eric's instruction of 26 Nov. Only the simple in-app plan is built. Importing from Garmin,
  Polar or anywhere else stays out.
- **Sessions carry no "done" state.** A day in the past is past. Which messages a session
  plays is worked out when it starts: the ones left for that day, the "any time" ones, and
  any still unheard from earlier days (a skipped or cut-short session loses nothing).
- **One session per day.**
- **The usual week fills the next 12 weeks** (or up to the finish day if sooner) and can be
  re-applied at any time. Re-applying keeps messages attached to days that still have a
  session; a message whose day is removed becomes "any time".
- **Supporters see how many messages each day has, never from whom.**
- **Supporters can pick days up to 8 weeks ahead**; the page shows 5 weeks at a time.
- **"Message" replaces "note"** in everything people read. Tables and code keep `notes`.
- **Wording:** "N weeks side by side"; "Someone has been there for Sam every week for N
  weeks. This week is still open." No "corner" in what supporters read.
- **Development builds keep a 2-minute way to run a session** for the real-phone check.
- **Fonts** (Instrument Serif, Jost) are bundled into the app; the supporter page loads them
  from Google Fonts with system fallbacks.
