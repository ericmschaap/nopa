# Nopa — project

## Purpose

Nopa (from the Luxembourgish word for neighbour) lets the people around an athlete share the
journey towards a goal, not just show up at the finish line. Friends and family record short
voice notes; the athlete hears them spread through hard training sessions on the way to that
goal.

## Tone

Soft and communal: sharing the journey and sharing moments. Not grit, not pain, not
competition. Copy in the product says "your people", "your corner", "share a moment".
There are no leaderboards and no individual sender streaks.

## The two sides

**Athlete — the hard side, keep it effortless.** Creates one *corner* per goal, with a name
and a finish date (for example a marathon on a given day). Gets a share link to send to their
people. Before a hard session, taps Start, puts the phone away, and trains. No email to open,
nothing to read.

**Supporter — the easy side, no account.** Opens the share link in any browser, sees the goal
and finish date, records a voice note, and sends it. After recording they can optionally leave
an email or phone number to hear when the athlete has listened. No sign-up.

## Capabilities

| Capability | Spec |
| --- | --- |
| corners | `capabilities/corners/spec.md` |
| share-links | `capabilities/share-links/spec.md` |
| recording | `capabilities/recording/spec.md` |
| session-playback | `capabilities/session-playback/spec.md` |
| heard-tracking | `capabilities/heard-tracking/spec.md` |
| streak | `capabilities/streak/spec.md` |
| plan | `capabilities/plan/spec.md` |

## Direction set on 26 November 2026

After seeing a demo, Eric set these on top of the original brief:

- **For anyone working towards an athletic goal** — a first 10K, a mountain, a long ride —
  not for "proper" endurance athletes. No training jargon, no coach features.
- **The basics come first:** send a link, people record a message, it plays when it is needed
  most, in a training session.
- **A simple plan and a calendar.** The athlete says which days they train and whether each
  is an easy one, a hard one or a long one. The link shows that calendar; people pick a day
  to be there for, or "any time".
- **Dots.** Under each training day, a dot per message waiting and a hollow dot where no one
  is yet.
- **Weeks side by side.** The shared streak, said plainly and shown prominently.
- **Look:** calm and plain. A serif for names and moments, a light sans for the rest, one
  muted green, no boxes, no decoration.
- **Words:** people read "message", "goal", "be there for Sam"; never "corner" or "note".

## Out of scope for now

Importing a plan from Garmin, Polar, a calendar or a file, smart timing based on workout data, the paid pro tier,
verified fans, moderation tooling, payments, and actually sending the "they listened"
notifications (the contact is stored only).

## Stack

One repo, three parts:

| Folder | What | Tech |
| --- | --- | --- |
| `athlete/` | Athlete app | Expo / React Native (TypeScript), `expo-audio` with the platform background-audio mode |
| `demo/` | No-backend demo of both sides | One HTML file, published as a Claude artifact |
| `supporter/` | Supporter page | Plain static HTML + JS, no build step, browser `MediaRecorder` |
| `supabase/` | Backend | Supabase: Postgres (tables, RLS, SQL functions), anonymous auth, Storage for audio |
| `e2e/` | End-to-end checks | Playwright, run against a local Supabase stack |

Why these (the brief suggested them; nothing better was found):

- Locked-screen playback that ducks other audio needs a native audio session, so the athlete
  side is a native app. Expo keeps that to one TypeScript codebase.
- The supporter side must work from a link with no install, so it is a web page.
- Supabase gives hosted auth + database + file storage with no server code of our own.

## Conventions

- **Athlete identity:** Supabase anonymous sign-in, created silently on first launch. The
  athlete never sees a login screen. (Losing the phone loses access; upgrading to a real
  account is future work.)
- **Supporter identity:** none. Supporters use the public anon key and can only call the
  small set of SQL functions granted to `anon`, plus upload into the notes bucket.
- **Share link format:** `<SUPPORTER_URL>/?c=<share_token>`. The token is random and is the
  only thing a supporter needs.
- **Audio format:** notes are stored as mono 22.05 kHz 16-bit WAV, converted in the supporter's
  browser before upload, so every phone can play them without server transcoding.
- **Note length:** at most 60 seconds.
- **Weeks:** ISO weeks, Monday to Sunday, in UTC.
- **Server rules live in SQL:** anything that must hold regardless of client (who can read
  what, the streak, heard timestamps) is a table policy or SQL function in
  `supabase/migrations/`.
- **Pure logic is unit-tested:** spacing and other pure functions live in
  `athlete/src/lib/` with tests beside them.
- **Requirement wording:** "The system SHALL ...", each with at least one
  GIVEN / WHEN / THEN scenario.
- **Workflow:** see `/CLAUDE.md`. One change at a time, spec-first, commit after each task
  with the change name in the message.
