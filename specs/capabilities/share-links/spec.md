# Capability: share-links

Each corner has one link the athlete sends to their people.

Status: planned (changes 002 and 003).

## Requirements

### R1 — Every corner has a share link
The system SHALL give every corner an unguessable share link of the form
`<SUPPORTER_URL>/?c=<share_token>` as soon as it is created.

- GIVEN an athlete who has just created a corner
  WHEN they look at the corner
  THEN they see its share link and can share or copy it in one tap.

### R2 — The link opens the corner for anyone, no account
The system SHALL show the corner's goal name and finish date to anyone who opens the link in
a browser, without sign-up.

- GIVEN a share link for the corner "Berlin Marathon" finishing on 2027-09-26
  WHEN a supporter opens it in a browser they have never used with Nopa
  THEN they see "Berlin Marathon" and the finish date, and a way to record a note.

### R3 — Unknown links fail gently
The system SHALL show a friendly message, and no recording controls, when the link's token
does not match a corner.

- GIVEN a link with a token that matches no corner (or no token at all)
  WHEN someone opens it
  THEN they see a gentle "this link doesn't seem to lead anywhere" message and cannot record.

### R4 — The link reveals nothing else
The system SHALL NOT expose other supporters' notes, names or contacts through the share link.

- GIVEN a corner that already holds notes
  WHEN a supporter opens the share link
  THEN they can read only the goal name, finish date and corner streak.
