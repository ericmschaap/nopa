# Capability: corners

A corner is the place for one goal: a name and a finish date, owned by one athlete.

Status: planned (change 003).

## Requirements

### R1 — Create a corner
The system SHALL let an athlete create a corner with a goal name and a finish date.

- GIVEN an athlete with the app open
  WHEN they enter the name "Berlin Marathon" and a finish date in the future and confirm
  THEN a corner with that name and date exists and is shown to them.

- GIVEN an athlete on the create form
  WHEN the name is empty or the finish date is missing, malformed or in the past
  THEN no corner is created and the form says what is missing.

### R2 — No sign-up for the athlete
The system SHALL give the athlete an identity silently on first launch, with no login screen.

- GIVEN a fresh install
  WHEN the athlete opens the app
  THEN they land on their corners (or the create form) without entering any credentials.

### R3 — One corner per goal, private to its owner
The system SHALL let an athlete hold several corners, one per goal, and SHALL show a corner's
notes only to the athlete who owns it.

- GIVEN an athlete with a corner for a marathon
  WHEN they create a second corner for a triathlon
  THEN both are listed, each with its own name, finish date, notes and share link.

- GIVEN two athletes A and B, each with a corner
  WHEN A lists corners or notes
  THEN A sees only their own.
