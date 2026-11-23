# Capability: recording

A supporter records a short voice note from the share link and sends it.

Status: built in change 002. Page: `supporter/`. Server rules: `supabase/migrations/*recording*`.
Verified by `e2e/supporter.spec.mjs` and `e2e/db.test.mjs`.

## Requirements

### R1 — Record in the browser
The system SHALL let a supporter record a voice note of up to 60 seconds in the browser, and
listen back or re-record before sending.

- GIVEN a supporter on a valid share link
  WHEN they tap record, allow the microphone, speak, and tap stop
  THEN they can play the recording back, re-record it, or send it.

- GIVEN a supporter who is recording
  WHEN 60 seconds have passed
  THEN recording stops by itself and the note is ready to review.

- GIVEN a supporter who denies microphone access (or whose browser cannot record)
  WHEN they tap record
  THEN they see a plain explanation and nothing is sent.

- GIVEN a recording shorter than half a second, or one the browser cannot decode
  WHEN recording stops
  THEN the supporter is asked to try once more and nothing is kept.

### R2 — Send with a first name, no account
The system SHALL store a submitted note against the corner with the supporter's first name,
without any account.

- GIVEN a supporter with a recording ready and the first name "Anna" entered
  WHEN they tap send
  THEN the note is stored for that corner with sender "Anna" and they see a thank-you.

- GIVEN a supporter with a recording ready and no first name
  WHEN they tap send
  THEN nothing is sent and they are asked for their first name.

### R3 — Optional contact after sending
The system SHALL offer, after the note is sent, an optional field for an email or phone
number, and SHALL store it with the note for a later "they listened" notification. The
system SHALL NOT send any notification yet. A contact can be attached only with the note's
id (known only to its sender) and only within one hour of sending.

- GIVEN a supporter who has just sent a note
  WHEN they enter "anna@example.com" and save
  THEN the contact is stored against that note and they see a confirmation.

- GIVEN a supporter who has just sent a note
  WHEN they skip the contact field
  THEN the note stays stored with no contact, and nothing more is asked.

### R4 — Contacts stay private
The system SHALL NOT expose a supporter's contact to the athlete or to other supporters.

- GIVEN a note with a stored contact
  WHEN the athlete lists their notes, or anyone opens the share link
  THEN the contact is not included.

### R5 — Playable on every phone
The system SHALL store notes in a format both iOS and Android can play natively.

- GIVEN a note recorded in any supported browser
  WHEN it is uploaded
  THEN it is stored as a mono 16-bit 22.05 kHz WAV file (at most 4 MB) in the private
  `notes` bucket, which accepts nothing else.
