# Capability: streak

One shared streak per corner, kept alive by everyone together.

Status: built in change 006. Server: `corner_streak`, `get_corner_by_token`,
`my_corner_streaks` in `supabase/migrations/*streak.sql`. Shown in `supporter/app.js` and
`athlete/src/screens/CornerScreen.tsx` (wording: `athlete/src/lib/streak.ts`). Verified by
`e2e/db.test.mjs`, `e2e/streak.spec.mjs`, `streak.test.ts`.

## Requirements

### R1 — One streak for the whole corner
The system SHALL keep a single streak per corner, counted in weeks (ISO weeks, Monday to
Sunday, UTC): the number of consecutive weeks in which at least one note was sent to the
corner by anyone. It is computed from the notes when read; nothing is stored.

- GIVEN notes from Anna in week 1, Ben in week 2 and Anna in week 3, and today is in week 3
  WHEN the streak is read
  THEN it is 3.

- GIVEN three notes all sent in the same week
  WHEN the streak is read
  THEN it is 1.

### R2 — A week with no note breaks it, but only once the week is over
The system SHALL treat the current week as still open: a streak that reached last week stays
alive until this week ends without a note.

- GIVEN notes in each of the last 2 weeks and none yet this week
  WHEN the streak is read
  THEN it is 2, and this week is reported as not yet kept.

- GIVEN the latest note was sent two or more weeks ago
  WHEN the streak is read
  THEN it is 0.

- GIVEN notes four and three weeks ago, none two weeks ago, then last week and this week
  WHEN the streak is read
  THEN it is 2: a streak restarts after a gap.

- GIVEN a corner with no notes
  WHEN the streak is read
  THEN it is 0.

### R3 — No individual streaks
The system SHALL NOT compute or show a streak per sender.

- GIVEN a corner with notes from several people
  WHEN the athlete or a supporter looks at the corner
  THEN they see one streak for the corner and no per-person counts.

### R4 — Everyone in the corner sees it
The system SHALL show the corner streak to the athlete in the app and to supporters on the
share page, in gentle wording.

- GIVEN a corner with a streak of 3 and no note yet this week
  WHEN a supporter opens the share link
  THEN they see that the corner has shared 3 weeks in a row and that a note this week keeps
  it going.

- GIVEN a supporter who sends a note in a week that had none
  WHEN the page refreshes the corner
  THEN the streak shown goes up by one and this week is reported as part of it.

- GIVEN a corner whose streak is 0
  WHEN anyone looks at it
  THEN they see an invitation to share the first moment, not a broken streak.
