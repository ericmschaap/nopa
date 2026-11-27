# 002 — supporter recording page

## Why
The supporter side is the entry to the whole loop: without a note there is nothing for the
athlete to hear. It is also the side with no account, so its server rules need the most care.

## What
- Database: `corners`, `notes`, `note_contacts` tables, a private `notes` storage bucket, and
  three SQL functions the public (anon) key may call: `get_corner_by_token`, `submit_note`,
  `add_note_contact`.
- `supporter/`: one static page. Opens `?c=<token>`, shows the goal and finish date, records
  up to 60 s, lets the supporter listen back / re-record, asks for a first name, sends, then
  offers the optional contact field.
- Covers capability `recording` (R1–R5) and `share-links` R2–R4 (the link opening side).
  Creating corners in the app and showing the link (share-links R1) is change 003; until
  then tests create corners directly in the database.

## Judgment calls
- **First name is asked on the review step, before sending**; the contact field appears only
  after the note is sent, as the brief orders it.
- **One contact field** accepting an email or a phone number, with only a light sanity check
  (3–200 characters). Nothing is sent to it, so strict validation would only get in the way.
- **A contact can be added only by whoever just sent the note:** the function needs the
  note's id (returned only to the sender) and works for one hour after the note was sent.
- **Contacts live in their own table with no read access** for athlete or supporters, so the
  privacy rule (recording R4) holds by construction.
- **Max length 60 s**, stop is automatic. "Short voice notes" in the brief; 60 s is a guess.
- **No listing or deleting of sent notes** by supporters: not in the brief.
- **Unknown token** and **no token** show the same gentle message.
- **Finish date in the past** still allows recording (the brief does not say to close a
  corner); the page just shows the date.
