# Nopa — instructions for Claude Code sessions

Read `specs/product.md` first: what Nopa is, the words to use, and the settled product
decisions. The full project instructions (tools, workflow, engineering rules) are set in the
Claude project; this file is the repo-side summary.

## One home per kind of information

| Tool | Holds |
| --- | --- |
| GitHub (this repo) | Code, specs, migrations, issues, milestones (= sprints), PRs. Task status. |
| Notion ([Nopa](https://app.notion.com/p/4252e15ee4a58123a4b3ec93f8162d01)) | Product brief, roadmap, sprint pages, decisions log, "How it works". |
| Figma ([Nopa — app](https://www.figma.com/design/gp1PNY8Ydz6hWhtA2vDz7G)) | Screens, flows, components, design tokens. Starter plan: three pages (Foundations, Flows with athlete and sender sections, Explorations) and one variable mode, so light and dark colours are `light/*` and `dark/*` variables. |
| Supabase (`nopa`, Frankfurt, ref `ltukqsljtzqfgpvlkdtd`) | Live database, auth, audio storage, edge functions. |

Never keep the same thing in two places; link instead. Anything waiting on Eric is a GitHub
issue labelled `needs-eric`, not a file in the repo.

## Layout and spec-driven workflow

```
specs/
  product.md              current agreed behaviour of the product
  <capability>/spec.md    "The system SHALL ..." + GIVEN / WHEN / THEN scenarios
changes/
  <nnn>-<name>/
    proposal.md           why, what changes, what's out of scope
    design.md             only when there are real technical choices
    tasks.md              checklist, each line mapped to a GitHub issue
  archive/                completed changes
supabase/migrations/      the only way the schema changes
```

For every non-trivial piece of work:

1. **Propose.** `changes/<nnn>-<name>/proposal.md` plus spec deltas; open a `spec` issue.
   Wait for Eric's OK on anything that changes product behaviour.
2. **Design.** Figma frames for UI (link the frame in the issue); `design.md` for technical choices.
3. **Plan.** Break into issues, put them in the sprint milestone.
4. **Build.** Branch per issue (`feat/12-record-voice-note`), one PR per issue, PR body says
   `Closes #12`. Tests included. Never commit to `main`.
5. **Archive.** Merge spec deltas into `specs/`, move the change to `changes/archive/`, update
   the Notion sprint page and decisions log.

Small fixes and chores skip straight to an issue and a PR. Labels: `spec`, `feature`, `bug`,
`chore`, `design`, `infra`, `needs-eric`.

## Engineering rules

- TypeScript, strict mode. Tests for anything involving delivery timing, streak logic or
  access rules.
- CI (lint, typecheck, tests) must pass before merge: `.github/workflows/ci.yml`.
- No secrets in the repo. `.env.example` lists every variable. The `service_role` key is only
  ever used in edge functions.
- Supabase: schema changes only through migrations in `supabase/migrations/`; Row Level
  Security on every table, tested in `e2e/db.test.mjs` in the same PR; audio in private
  buckets behind short-lived signed URLs; regenerate `athlete/src/lib/database.types.ts`
  after every migration. Ask Eric before destructive data operations or anything that
  changes Supabase cost.
- Voice notes are personal data (EU). Collect the minimum, keep deletion possible, note new
  personal data in the Notion decisions log.
- Sender flows work in a phone browser with no install and no sign-up.

## Technical conventions in the current code

- **Naming.** Product and specs say "circle". The code and database still say `corner`
  (`corners`, `corner_id`, `corner_streak`, `CornerScreen`) until the rename lands. Do not
  rename live database objects without Eric's OK.
- **Athlete identity:** Supabase anonymous sign-in, created silently on first launch.
- **Sender identity:** none. Senders use the public anon key and may only call the SQL
  functions granted to `anon`, plus upload into `notes/inbox/`.
- **Audio:** mono 22.05 kHz 16-bit WAV, converted in the sender's browser, at most 60 s.
- **Weeks:** ISO weeks, Monday to Sunday, UTC.
- **Server rules live in SQL** (policies and security-definer functions). Pure logic lives in
  `athlete/src/lib/` with tests beside it.

## Commands

```
npm run db:start        # local Supabase (needs Docker); applies supabase/migrations
npm run db:reset        # wipe local data and re-apply migrations
npm run db:test         # database and access-rule tests
npm run supporter       # serve supporter/ on http://localhost:8080
npm test                # athlete unit tests + type check
npm run e2e             # Playwright loop against local Supabase
cd athlete && npx expo start
```
