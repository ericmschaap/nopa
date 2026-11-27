# 003 — corners and share links

## Why
The supporter page needs a real corner behind its link, and the athlete needs somewhere to
start from. This change gives the athlete app its first real screens.

## What
- Database: policies so a signed-in athlete can create corners and read only their own
  corners and notes.
- Athlete app: silent anonymous sign-in on launch; a list of corners; a create form (goal
  name + finish date); a corner screen showing the share link with Share and Copy buttons.
- Covers capability `corners` (R1–R3) and `share-links` R1.

## Judgment calls
- **Anonymous sign-in** (see project.md). The session is kept in device storage, so the same
  athlete comes back to the same corners. Reinstalling the app starts fresh; account recovery
  is not in the brief.
- **Finish date is typed as day / month / year** in three small number fields. A native date
  picker would add a native dependency and a second code path for the web build used in
  tests; three fields are the simplest thing that works everywhere.
- **Finish date must be today or later** when the corner is created. The server allows one
  day of slack for time zones.
- **No editing or deleting corners.** Not in the brief.
- **"One corner per goal" is not enforced** beyond each corner having exactly one name and
  date; an athlete may create two corners with the same name if they want to.
- **Share** uses the system share sheet on phones; on the web build (tests) it falls back
  to copying the link.
- **Config** comes from `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` and
  `EXPO_PUBLIC_SUPPORTER_URL` in `athlete/.env` (see `.env.example`).
