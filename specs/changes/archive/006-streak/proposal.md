# 006 — shared corner streak

## Why
The streak is what makes a corner feel like something people keep up together: one count for
everyone, kept alive when anyone sends a note in a week.

## What
- Database: one SQL function computes a corner's streak from its notes. The share link's
  `get_corner_by_token` now also returns it; `my_corner_streaks()` returns it for each of the
  athlete's own corners.
- Supporter page: a gentle streak line under the goal, refreshed after a note is sent.
- Athlete app: the same streak on the corner screen.
- Covers capability `streak`.

## Judgment calls
- **A week is an ISO week, Monday to Sunday, in UTC.** One definition for everyone in the
  corner, wherever they are. Near midnight on Sunday a supporter's local week can differ
  from UTC by a few hours; accepted for a first version.
- **The streak counts weeks, not notes.** Ten notes in one week count once.
- **The current week is still open.** If last week had a note and this week has none yet,
  the streak stands (and the page says a note this week keeps it going). It drops to 0 only
  when a whole week has passed with no note.
- **Computed on read, not stored.** There is nothing to keep in sync and no scheduled job.
- **No per-sender numbers anywhere** — not computed, not returned, not shown.
- **No "longest streak" and no reminders.** Not in the brief.
- **Wording is soft**: "shared 3 weeks in a row", never "don't break the streak".
