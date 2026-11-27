# 011 — v1 data model

Status: **proposed, waiting for Eric.** GitHub issue: #5.

## Why

The first-version schema is live in the Supabase project `nopa` (Frankfurt). It was built
before the project instructions settled three things: the word is **circle**, deletion must
work **from day one**, and personal data must be kept to the minimum. All four tables are
empty today, so this is the cheapest moment the model will ever have to change shape.

## What is live today

| Table | Holds | Personal data |
| --- | --- | --- |
| `corners` | One per goal: owner (anonymous athlete account), athlete first name, goal name, finish date, random share token | Athlete first name |
| `sessions` | The plan: one row per training day (day, easy / hard / long, minutes) | No |
| `notes` | One voice message: circle, optional session, sender first name, audio path, length, when heard | Sender first name, voice |
| `note_contacts` | Optional email or phone left after sending, for "they listened" | Contact |
| Storage bucket `notes` (private) | The WAV files | Voice |

The streak is computed by SQL functions, not stored. Senders have no table (no accounts).
Listening is `notes.heard_at` (one athlete per circle, so one listen per message). There is
no separate goals table: one circle per goal makes them the same row.

RLS is on for every table. Senders reach the database only through four security-definer
functions granted to `anon`. Supabase's advisor flags these as warnings; that is by design and
covered by `e2e/db.test.mjs`.

The migration history in the repo matches the live project one to one
(`20261123000100` to `20261126000700`).

## Proposed changes

1. **Say circle in the database.** Rename `corners` → `circles`, every `corner_id` →
   `circle_id`, and the functions `get_corner_by_token`, `corner_streak`, `my_corner_streaks`,
   `assert_corner_owner` → `..._circle_...`. One migration with plain `alter ... rename`;
   no data to move. App, sender page, tests and types change in the same PR.
2. **Say message in the database.** Rename `notes` → `messages`, `note_contacts` →
   `message_contacts`, the bucket stays `notes` (renaming a bucket means copying objects; not
   worth it). Copy already says "message"; this removes the last translation layer.
3. **A sender can remove their message.** `submit_message` returns a random delete token
   alongside the id (stored only as a hash). The sender page keeps it in the browser and shows
   "Remove my message". A new edge function `delete-message` checks the token, deletes the row
   and the audio file with the service key.
4. **An athlete can delete a circle.** The app gets "Delete this goal". An edge function
   `delete-circle` checks ownership, deletes the circle (rows cascade) and all its audio.
5. **Contacts are kept no longer than needed.** A contact is deleted once the "they listened"
   message is sent, or 30 days after the finish date, whichever is first (scheduled with
   `pg_cron`, free on the current plan).

## Alternatives considered

- **Keep `corners` and `notes` and only change copy.** Cheapest now, but every future reader
  translates between three words. Rejected while the tables are empty.
- **Separate `goals` table.** Only useful if a circle could have several goals; settled as one
  circle per goal.
- **Sender accounts to make deletion easy.** Breaks "senders need no account".

## What Eric needs to decide

OK the shape above (or strike any of the five points). Renaming live database objects is the
step that needs his explicit go-ahead; it will be applied as a migration through a PR, never
by hand.

## Out of scope

Real athlete accounts (email or Apple sign-in), a paid fan tier, calendar import.
