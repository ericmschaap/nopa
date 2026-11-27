# 005 — tasks

- [x] 1. Migration: `mark_note_heard` (+ database tests: owner only, first mark wins, clamps)
- [x] 2. `heardOutbox.ts`: on-device outbox with retry, unit-tested
- [x] 3. Wire: session → outbox → server; flush on launch and on corner refresh
- [x] 4. Corner screen: pending marks count as heard; list of heard notes
- [x] 5. E2E: heard after playing, not replayed, cut-short stays unheard, offline mark syncs
- [x] 6. Verify, update spec, archive

## Verification
`npm test`: 26 unit tests pass. `npm run db:test`: 21 pass. `npm run e2e`: 25 pass.

| Scenario | Checked by |
| --- | --- |
| R1 marked heard when the note finishes | e2e `R1 + R5: a note that plays to the end…` (unheard while playing, heard after), unit `a heard note is sent with the time…` |
| R1 cut short by End stays unheard | e2e `R1: a note cut short by End stays unheard`, unit (session) `ending early…` |
| R2 heard notes not replayed | e2e `R2 + R5: heard notes are left out of the next session` |
| R3 mark made with no signal is sent later, original time kept | e2e `R3: a note heard with no signal…` (arrives after reconnect), unit `with no signal the mark is kept…` (same time), db `R1 + R3` (server stores the phone's time) |
| R4 only the owner can mark | db `R4: another athlete or a supporter cannot mark it` |
| R4 first timestamp wins | db `R4: marking again keeps the first time`, unit `the same note is only recorded once` |
| R5 waiting count and heard list | e2e `R1 + R5`, `R2 + R5` |

## Changed while building
- The server keeps the heard time between the note's creation and "now"; a phone clock that
  runs ahead cannot store a future time.
- A mark the server refuses for good (note deleted, not the owner) is dropped from the outbox
  rather than retried forever.
