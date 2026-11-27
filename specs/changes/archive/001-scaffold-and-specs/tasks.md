# 001 — tasks

- [x] 1. `specs/project.md`, `CLAUDE.md`, `PROGRESS.md`, `NEEDS-ERIC.md`
- [x] 2. Six capability specs with SHALL requirements and GIVEN/WHEN/THEN scenarios
- [x] 3. Root `package.json` + `supabase/` local config; local stack starts
- [x] 4. `supporter/` static placeholder served locally
- [x] 5. `athlete/` Expo TypeScript app boots (type check passes, web export builds)
- [x] 6. `e2e/` Playwright smoke test passes against the scaffold
- [x] 7. Verify, archive, update PROGRESS

## Verification
- `npm test` (athlete type check + unit runner): pass.
- `npm run e2e`: 3 smoke tests pass (local Supabase answers with anonymous sign-in enabled,
  supporter page served, athlete web export boots).
- This change builds no capability requirement, so there are no scenarios to verify.
