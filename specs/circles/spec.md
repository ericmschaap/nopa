# Capability: circles

A circle is the place for one goal: a name and a finish date, owned by one athlete. People
read "goal"; specs and design say "circle". The code and database still say `corner` until
the rename issue lands (see `changes/011-v1-data-model`).

Status: built in change 003; first name and new look in change 009. App: `athlete/src/screens/`, `athlete/src/lib/corner.ts`.
Server rules: `supabase/migrations/*corners_athlete_access.sql`. Verified by
`athlete/src/lib/corner.test.ts`, `e2e/athlete-corners.spec.mjs`, `e2e/db.test.mjs`.

## Requirements

### R1 — Create a circle
The system SHALL let an athlete create a circle with their first name (shown to supporters),
a goal name (1–80 characters) and a finish date of today or later, entered as day, month and
year. The goal can be anything athletic: a first 10K, a mountain, a long ride. After
creating it the athlete is taken to their usual week (see `plan`). Circles cannot be edited or
deleted yet.

- GIVEN an athlete with the app open
  WHEN they enter their first name, the goal "My first 10K" and a day in the future
  THEN a circle with that name and date exists, and they are asked about their usual week.

- GIVEN an athlete on the create form
  WHEN the first name or goal is empty, or the date is missing, malformed or in the past
  THEN no circle is created and the form says what is missing.

### R2 — No sign-up for the athlete
The system SHALL give the athlete an identity silently on first launch (an anonymous
account kept on the device), with no login screen.

- GIVEN a fresh install
  WHEN the athlete opens the app
  THEN they land on their circles (or the create form) without entering any credentials.

- GIVEN an athlete who has created circles
  WHEN they close and reopen the app
  THEN they are the same athlete and see the same circles.

### R3 — One circle per goal, private to its owner
The system SHALL let an athlete hold several circles, one per goal, and SHALL show a circle's
notes only to the athlete who owns it.

- GIVEN an athlete with a circle for a marathon
  WHEN they create a second circle for a triathlon
  THEN both are listed, each with its own name, finish date, notes and share link.

- GIVEN two athletes A and B, each with a circle
  WHEN A lists circles or notes
  THEN A sees only their own.
