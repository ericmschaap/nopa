# 004 — athlete session with spaced playback

## Why
This is the moment Nopa exists for: the athlete taps Start, puts the phone away, and hears
their people through the session.

## What
- Database: the athlete may download the audio of notes in their own corners.
- App, corner screen: how many notes are waiting, a rough-duration picker, Start.
- App, session: downloads the unheard notes first, then plays them spaced evenly through the
  chosen duration, over whatever else the athlete is listening to, with the screen locked.
- Covers capability `session-playback`.

## Judgment calls
- **Spacing rule:** N notes in duration D play at D × i / (N + 1), oldest first. One note
  lands in the middle; nothing plays at the start or at the very end.
- **All unheard notes are scheduled, with no cap.** If there are many notes and a short
  session the gaps get short, and a note that is due while another is still playing waits
  and plays straight after it. A cap or a minimum gap would be a product decision the brief
  does not make; noted in PROGRESS as a known limit.
- **Durations offered:** 20, 30, 45, 60, 90 and 120 minutes ("rough duration"). Development
  builds also offer a 2-minute option so the real-phone check does not take half an hour.
- **The session ends by itself once the last note has played** (it is always before the end
  of the chosen duration). Keeping the audio session alive after that would do nothing.
  This replaces the first draft of R6.
- **Spec R5 ("each note is introduced" on the lock screen) is dropped.** It was not in the
  brief, and on iOS an app that mixes with the athlete's music cannot own the lock screen.
  The session screen shows who is playing; the voice does the rest.
- **A note that fails to play is skipped** and stays unheard for the next session.
- **Leaving the app open is required; force-quitting ends the session.** Notes not played
  stay unheard.
- **Marking notes as heard is change 005.** In this change the session reports which notes
  finished; nothing is written to the server yet.
- **Locked-screen behaviour is not proven here** (the brief says not to stop for it). The
  logic is unit-tested and driven end to end in the web build; the real-phone checks are in
  `NEEDS-ERIC.md`.
