# 003 — tasks

- [x] 1. Migration: athlete policies on `corners` (insert + select own) and `notes` (select own)
- [x] 2. Database tests: create, privacy between athletes, contacts hidden from the athlete
- [x] 3. App: config + Supabase client with silent anonymous sign-in
- [x] 4. App: pure corner validation + share link builder, with unit tests
- [x] 5. App: corners list, create form, corner screen with share link (Share / Copy)
- [x] 6. E2E: `corners` R1–R3 and `share-links` R1, including athlete link → supporter page
- [x] 7. Verify, update specs, archive

## Verification
`npm test`: 8 unit tests pass. `npm run db:test`: 16 pass. `npm run e2e`: 16 pass.

| Scenario | Checked by |
| --- | --- |
| corners R1 create with name + date | e2e `corners R1 + share-links R1`, unit `a name and a future date…`, db `R1 + share-links R1` |
| corners R1 invalid input creates nothing | e2e `corners R1: empty name…`, unit (5 tests), db `R1: no name, no date or a past date…` |
| corners R2 no login on fresh install | e2e `corners R2` |
| corners R3 several corners, each its own link | e2e `corners R3`, db `R3: several corners…` |
| corners R3 private to owner | e2e `corners R3` (second browser), db `R3`, db `R1: an athlete cannot create a corner for someone else…` |
| share-links R1 link shown, one-tap copy, opens corner | e2e `corners R1 + share-links R1`, unit `link format…` |
| recording R4 contact hidden from the athlete | db `recording R4: the athlete cannot read…` |

Not checkable here: the native share sheet (web build falls back to copy) → `NEEDS-ERIC.md`.
