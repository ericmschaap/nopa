# Capability: plan

A simple training plan per goal, shown as a calendar to the athlete and to their people.

Status: built in change 009. Server: `sessions`, `set_usual_week`, `set_session`,
`remove_session`, `get_plan_by_token` in `supabase/migrations/*plan.sql`. App:
`athlete/src/lib/plan.ts`, `WeekScreen.tsx`, `ui/Calendar.tsx`, `CornerScreen.tsx`. Supporter
page: `supporter/app.js`. Verified by `plan.test.ts`, `e2e/db.test.mjs`,
`e2e/athlete-corners.spec.mjs`, `e2e/supporter.spec.mjs`.

Not built: importing a plan from Garmin, Polar, a calendar or a file.

## Requirements

### R1 — A usual week fills the calendar
The system SHALL let the athlete say, for each weekday, whether they rest or train and, if
they train, whether it is an easy one, a hard one or a long one and roughly how long. It
SHALL fill the calendar with those sessions from today for 12 weeks, or up to the finish day
if that is sooner, and SHALL let the athlete change the usual week later.

- GIVEN an athlete who has just named a goal
  WHEN they accept the suggested week (Tuesday hard, Thursday easy, Sunday long)
  THEN their calendar holds those three sessions every week.

- GIVEN a goal finishing in 9 days
  WHEN the usual week is applied
  THEN no session is planned after the finish day.

- GIVEN an athlete who changes Monday from rest to an easy one and Tuesday to rest
  WHEN they fill the calendar again
  THEN upcoming Mondays have a session and upcoming Tuesdays do not.

- GIVEN a week in which every day is rest
  WHEN the athlete tries to fill the calendar
  THEN nothing changes and they are asked to choose at least one day.

### R2 — One day can be changed on the calendar
The system SHALL let the athlete tap a free day to add a session (easy, hard or long, with
that kind's usual length) and tap a planned day to take it off. There is one session per day.
Messages left for a day that is taken off, or that becomes a rest day, are kept as "any time".

- GIVEN a day with nothing planned
  WHEN the athlete taps it and chooses "a hard one"
  THEN that day has a 45-minute hard session.

- GIVEN a planned day with a message left for it
  WHEN the athlete takes the day off
  THEN the day is free and the message becomes an "any time" message.

- GIVEN messages left for a Tuesday and a Wednesday
  WHEN the usual week is changed so Wednesday becomes rest and Tuesday stays
  THEN the Tuesday message stays on Tuesday and the Wednesday one becomes "any time".

### R3 — A plan belongs to its athlete
The system SHALL let only the athlete who owns a goal change its plan.

- GIVEN athlete A's goal
  WHEN athlete B or a supporter tries to add, change or remove a session
  THEN nothing changes.

### R4 — The link shows the plan, and where someone is already there
The system SHALL show anyone with the share link the upcoming sessions (day, kind, length)
and how many unheard messages each has, and SHALL NOT show who left them.

- GIVEN a long session with two messages and a hard session with none
  WHEN a supporter opens the link
  THEN they can see that two people are there for the long one and no one yet for the hard one,
  and no names.

- GIVEN a message that the athlete has heard
  WHEN a supporter opens the link
  THEN that message no longer counts on its day.

### R5 — A calendar with dots
The system SHALL show the plan as a calendar of five weeks starting on this week's Monday.
Under a training day, each waiting message is a filled dot (three at most, then a plus) and a
day with no one yet has a hollow dot. Days that are not training days carry no dot, and a
supporter cannot pick them or days in the past.

- GIVEN a supporter looking at the calendar
  WHEN one training day has two messages and another has none
  THEN the first shows two filled dots and the second one hollow dot.

- GIVEN the athlete's calendar
  WHEN messages were left for a day now past, or for "any time"
  THEN their dots sit on the next training day.
