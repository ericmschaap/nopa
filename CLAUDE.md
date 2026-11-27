# Nopa — instructions for Claude Code sessions

Nopa lets an athlete's people record voice notes that the athlete hears spread through
training sessions. Read `specs/project.md` first: purpose, tone, stack and conventions.

## The specs folder is the source of truth

```
specs/
  project.md                     purpose, the two sides, tone, stack, conventions
  capabilities/<name>/spec.md    what is built: "The system SHALL ..." + GIVEN/WHEN/THEN
  changes/<nnn-name>/            one folder per unit of work in progress
    proposal.md                  why and what, plus any judgment calls
    tasks.md                     checklist of small steps
    design.md                    only where a technical decision is needed
  changes/archive/               finished changes
```

## Workflow (follow it for every piece of work)

1. **Propose.** Create `specs/changes/<nnn-name>/` with `proposal.md` and `tasks.md`
   (and `design.md` if a technical decision is needed). Number changes in sequence.
2. **Review it yourself** against the brief in `specs/project.md` and the capability specs.
   Nobody is awake to approve: record every judgment call in the proposal and carry on.
   If something is ambiguous, pick the simplest option and note the choice.
3. **Implement task by task.** Tick each task off in `tasks.md` and commit after each one,
   with the change name in the commit message, e.g. `003-corners-share-links: add create form`.
4. **Verify every scenario** in the capability specs the change touches (unit tests, the
   e2e suite, or a recorded manual check).
5. **Archive.** Move the folder to `specs/changes/archive/` and update the capability
   spec(s) to match what was actually built.
6. **One change at a time.** Never start the next change before the current one is verified
   and archived.

Do not invent features beyond the brief. Out of scope is listed in `specs/project.md`.

## Running files

- `PROGRESS.md` — which changes are archived, what is stubbed, what failed and why. Update it
  when a change is archived.
- `NEEDS-ERIC.md` — anything that needs a human: accounts, API keys, app-store or device
  steps, real-phone checks. Add to it as soon as you hit one.
- `README.md` — how to run it and how to walk the full loop.

## Commands

```
npm run db:start        # local Supabase (needs Docker); applies supabase/migrations
npm run db:reset        # wipe local data and re-apply migrations
npm run supporter       # serve supporter/ on http://localhost:8080
npm test                # athlete unit tests + type check
npm run e2e             # Playwright loop against local Supabase
cd athlete && npx expo start
```
