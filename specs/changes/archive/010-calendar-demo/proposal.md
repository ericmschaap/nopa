# 010 — calendar-only demo

## Why
Eric (27 Nov): trim the demo further. Less designed, a plain calendar where days with
messages are marked and can be tapped. It must suit any athletic goal, not only endurance.

## What
`demo/nopa-demo.html` rebuilt as a plain month calendar on both sides. Demo only:
`athlete/`, `supporter/`, `supabase/` and the capability specs are unchanged.

- **Athlete:** name, an optional goal, and the month calendar. Days with waiting messages are
  filled, days whose messages were heard are outlined, other days cannot be tapped. Tapping a
  marked day lists who left a message; "Start training" plays them spaced out (40 seconds in
  the demo). A heard day offers "Play them again".
- **Friend:** the same calendar. Any day from today on can be tapped; days that already have
  a message are marked. Record, choose a recording, or write; add a first name; send.
- **Look:** system font, one green for marks, light and dark.

## Judgment calls
- **Removed from the demo:** session kinds (easy/hard/long) and lengths, the usual-week
  planner, the finish date and countdown, the "weeks side by side" streak, "any time"
  messages, and the "let me know when it's heard" step. The real app still has them; trimming
  the product is a separate change if Eric wants it.
- **Friends can pick any day**, since there is no plan to choose from.
- **Friends see whether a day has messages, never who sent them**; the athlete sees names.
- **Example goal** is "Training for a black belt"; the goal field is optional and its
  placeholder names team, martial-arts, running and strength goals.
- Calendar shows this month and two ahead (athlete can also look back one month).
