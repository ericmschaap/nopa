# Capability: share-links

Each circle has one link the athlete sends to their people.

Status: built; what the link shows grew in change 009. R2–R4 in change 002 (`supporter/`, `get_corner_by_token`), R1 in change 003
(`athlete/src/screens/CornerScreen.tsx`). Verified by `e2e/supporter.spec.mjs`,
`e2e/athlete-corners.spec.mjs`, `e2e/db.test.mjs`.

## Requirements

### R1 — Every circle has a share link
The system SHALL give every circle an unguessable share link of the form
`<SUPPORTER_URL>/?c=<share_token>` as soon as it is created.

- GIVEN an athlete who has just created a circle
  WHEN they look at the circle
  THEN they see its share link, can copy it in one tap, and can open the system share
  sheet with a short invitation that contains the link.

### R2 — The link opens the circle for anyone, no account
The system SHALL show the athlete's first name, the goal, its day and the plan (see `plan`
R4) to anyone who opens the link in a browser, without sign-up.

- GIVEN a share link for the circle "Berlin Marathon" finishing on 2027-09-26
  WHEN a supporter opens it in a browser they have never used with Nopa
  THEN they see whose goal it is, "Berlin Marathon", the finish date, and a calendar of
  training days to choose from.

### R3 — Unknown links fail gently
The system SHALL show a friendly message, and no recording controls, when the link's token
does not match a circle.

- GIVEN a link with a token that matches no circle (or no token at all)
  WHEN someone opens it
  THEN they see a gentle "this link doesn't seem to lead anywhere" message and cannot record.

- GIVEN a valid link opened with no connection to the backend
  WHEN the page cannot load the circle
  THEN it says it couldn't open the circle just now and offers "Try again", rather than
  calling the link broken.

### R4 — The link reveals nothing else
The system SHALL NOT expose other supporters' notes, names or contacts through the share link.

- GIVEN a circle that already holds notes
  WHEN a supporter opens the share link
  THEN they can read only the athlete's first name, the goal, its day, the shared streak, and
  how many messages each upcoming session has.
