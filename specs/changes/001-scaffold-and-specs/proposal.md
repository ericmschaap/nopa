# 001 — scaffold and specs

## Why
The brief asks for spec-first work. Before any app code there has to be a specs folder that
later changes can be checked against, and a repo layout the three parts can live in.

## What
- `specs/project.md`, one capability spec for each of the six capabilities, `CLAUDE.md`,
  `PROGRESS.md`, `NEEDS-ERIC.md`.
- Repo scaffold: `supabase/` (local stack config, empty migrations), `supporter/` (static
  placeholder), `athlete/` (Expo TypeScript app that boots to a placeholder screen),
  `e2e/` (Playwright wired to the local stack), root `package.json` with the run scripts.

## Judgment calls
- **Stack:** the suggested stack is kept (Expo + static page + Supabase). Checked in this
  environment: the local Supabase stack runs under Docker, so every later change can be
  verified against a real Postgres/Auth/Storage rather than mocks.
- **Capability specs are written up front** as the target, each marked "planned". Each later
  change updates its spec to what was really built when it is archived.
- **Athlete auth is anonymous sign-in** — the brief says the athlete side must be effortless
  and lists no login requirement. Simplest thing that gives each athlete private data.
- **Weeks are ISO weeks in UTC**, **notes are capped at 60 s**, **audio is stored as WAV** —
  simplest options; reasons are in `specs/project.md` and the later design docs.
- **The existing root `index.html`** (milestone 1 playback proof) is left where it is; it is
  a throwaway test page and not part of the product.
- **Verification vehicle:** the athlete app is also exported for web (react-native-web) so
  Playwright can drive the whole loop in a browser. That checks the logic and the backend,
  not locked-screen behaviour, which goes to `NEEDS-ERIC.md`.
