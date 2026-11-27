# 005 — heard-tracking

## Why
Without it the same notes would replay every session, and the stored contacts could never be
told "they listened". The heard mark is also what the athlete sees as progress.

## What
- Database: `mark_note_heard(note_id, heard_at)` — owner only, first mark wins.
- App: when a note plays to the end the session records it in a small on-device outbox and
  sends it to the server; anything unsent is retried on the next launch or corner refresh.
- Corner screen: notes waiting (already there) plus a list of heard notes with sender and
  when they were heard.
- Covers capability `heard-tracking`.

## Judgment calls
- **"Heard" means played to the end in a session.** A note cut short by End, or one that
  failed to play, stays unheard and comes back next session.
- **The timestamp is the moment the note finished on the phone**, sent with the mark, so a
  mark made with no signal keeps its real time. The server never accepts a time in the
  future (it uses its own clock instead) or before the note was sent.
- **First mark wins.** Marking again changes nothing.
- **While a mark is still waiting to be sent, the app already treats the note as heard**, so
  it is not scheduled again on the same phone.
- **No "unhear" and no replay of heard notes.** Not in the brief.
- **No notification is sent** to stored contacts when a note is heard (out of scope).
