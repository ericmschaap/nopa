# 006 — tasks

- [x] 1. Migration: `corner_streak`, streak fields on `get_corner_by_token`, `my_corner_streaks`
- [x] 2. Database tests for every streak scenario, including the week boundary
- [x] 3. Supporter page: streak line, refreshed after sending
- [x] 4. Athlete app: streak wording helper (unit-tested) and streak on the corner screen
- [x] 5. E2E: streak shown to supporter and athlete; no per-person counts
- [x] 6. Verify, update spec, archive

## Verification
`npm test`: 30 unit tests pass. `npm run db:test`: 30 pass. `npm run e2e`: 28 pass.

| Scenario | Checked by |
| --- | --- |
| R1 three weeks, different senders → 3 | db `R1: notes from different people in three weeks running…` |
| R1 three notes in one week → 1 | db `R1: three notes in the same week…` |
| R1 weeks are Monday–Sunday UTC | db `R1: weeks run Monday to Sunday in UTC` (fixed dates either side of midnight) |
| R2 none yet this week → still alive, not yet kept | db `R2: no note yet this week…`, e2e `R4: supporter sees the corner streak…` |
| R2 latest note two or more weeks ago → 0 | db `R2: a whole week with no note breaks it`, e2e `R2 + R4` |
| R2 no notes → 0 | db `R2: a corner with no notes…`, e2e `R2 + R4` |
| R3 no per-sender streak | db `R3: nothing is computed or returned per sender`, e2e `R3: one streak for the corner…`, unit `the words never mention a person…` |
| R4 shown to supporter and athlete, gentle wording | e2e `R4` (both sides, before and after a note), unit (3 wording tests) |

## Changed while building
- A streak of 0 is shown as an invitation ("Be the first to share a moment this week" /
  "Your corner is just getting started"), never as a broken streak.
- `get_corner_by_token` now returns `streak_weeks` and `this_week_kept` beside the name and
  finish date; share-links R4 already allowed the streak.
