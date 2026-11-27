# 002 — tasks

- [x] 1. Migration: `corners`, `notes`, `note_contacts`, RLS on, `notes` bucket + upload policy
- [x] 2. Migration: `get_corner_by_token`, `submit_note`, `add_note_contact` with grants
- [x] 3. Database tests for the functions and the privacy rules (`npm run db:test`)
- [x] 4. Supporter page: load corner from `?c=`, not-found state
- [x] 5. Supporter page: record (60 s cap), listen back, re-record, WAV conversion
- [x] 6. Supporter page: first name + send (upload, `submit_note`), thank-you
- [x] 7. Supporter page: optional contact after sending
- [x] 8. E2E: every scenario of `recording` and `share-links` R2–R4
- [x] 9. Verify, update specs, archive

## Verification
Run against the local Supabase stack. `npm run db:test`: 11 pass. `npm run e2e`: 12 pass.

| Scenario | Checked by |
| --- | --- |
| share-links R2 link shows goal + date | e2e `share-links R2`, db `R2: a token gives…` |
| share-links R3 unknown / missing token | e2e `share-links R3`, db `R3: an unknown token…` |
| share-links R4 reveals nothing else | db `R4: the link exposes no ids…` |
| recording R1 record / listen / re-record | e2e `recording R1: record, listen back, re-record` |
| recording R1 auto-stop at 60 s | e2e `recording R1: recording stops by itself…` |
| recording R1 microphone denied | e2e `recording R1: no microphone…` |
| recording R2 send with first name | e2e `recording R2 + R5`, db `R2: a note is stored…` |
| recording R2 no first name | e2e `recording R2: no first name…`, db `R2: no first name…` |
| recording R3 contact stored | e2e `recording R3: optional contact…`, db `R3: an optional contact…` |
| recording R3 contact skipped | e2e `recording R3: skipping…`, db `R3: skipping…` |
| recording R4 contacts private (anon) | db `R4: contacts are not readable…` (athlete side re-checked in 003) |
| recording R5 stored as mono 16-bit WAV | e2e `recording R2 + R5` (reads the stored file's header) |

Not checkable here: recording in real mobile Safari and Android Chrome → `NEEDS-ERIC.md`.

## Changed while building
- Added a third page state, "couldn't open this corner just now", so a dropped connection
  is not reported as a broken link.
- Recordings under half a second are rejected as "didn't come through".
- Sample rate is 22.05 kHz (not 16 kHz as first written in project.md), matching the
  milestone 1 proof page's decode path.
