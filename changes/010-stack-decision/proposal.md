# 010 — Stack decision

Status: **proposed, waiting for Eric.** GitHub issue: #4.

## Why

The original plan was a Lovable web frontend with Resend email delivery. The product has
since moved to messages that play inside a session, on a locked phone, over the athlete's own
music. That makes background, locked-screen audio the deciding criterion for the client
stack. The first version was built on a stack chosen for this reason, but the choice was
never put to Eric as a decision, and it has not yet been proven on a real phone.

## The deciding criterion

On a real iPhone (the harder platform), with the screen locked and the phone in a pocket:

1. Three messages, due 10 minutes apart, each start within ±3 seconds of their due time.
2. The athlete's own music keeps playing between messages and dips under each one (ducking).
3. Nothing needs the athlete to touch the phone after tapping Start.

A stack that cannot meet 1 is out. A stack that meets 1 but not 2 is a product compromise
Eric has to accept explicitly.

## Evidence so far

- **Web, mode A** (one `<audio>` element and timers): failed on a locked iPhone in 1-minute
  tests. Timers are frozen when Safari is in the background.
- **Web, mode B** (all messages stitched into one long audio file with silence in the gaps,
  played by one `<audio>` element): worked in 1-minute tests. The 10-minute-gap test is
  in progress (Eric, #6). Even if it passes, Safari
  playing audio **stops** Spotify or Apple Music rather than ducking it, and the whole session
  must be known and downloaded up front.
- **Native (Expo / React Native with `expo-audio`)**: the athlete app in `athlete/` is built
  this way. It uses the platform background-audio mode, a silent keep-alive track and switches
  the audio session to "duck others" around each message. Read against the native sources,
  not yet run on a phone.

## Options

| | A. Native app (current) | B. Web app only (mode B) | C. Web app in a native shell (Capacitor) |
| --- | --- | --- | --- |
| Locked playback | Platform background audio; reliable when set up right | Works in short tests; 10-min test pending; iOS may still kill long sessions | Same as A if a native audio plugin is used, otherwise same as B |
| Ducking own music | Yes | No: Safari pauses other audio | Only with a native plugin |
| Athlete install | App via TestFlight, later the App Store | None, open a link | App |
| Cost | Apple Developer Program, 99 USD a year, needed for TestFlight | None | Same as A |
| Already built | Yes, with tests | Only the test page | No |
| Eric's frontend comfort | One TypeScript codebase; Claude does most of it | Easiest to read | Two layers to debug |

**Senders are the same in every option:** a static web page (`supporter/`, plain HTML and JS,
no build) served over HTTPS from GitHub Pages, recording with the browser's `MediaRecorder`
and talking only to Supabase. It holds no personal data itself; recordings go straight to the
private Supabase bucket in Frankfurt.

**Backend is the same in every option:** Supabase (Postgres with RLS, anonymous auth for
athletes, private Storage for audio, edge functions for anything that needs the service key).

## Recommendation

**Option A, the native Expo app, confirmed by a real-iPhone test of the development build
before the end of Sprint 2.** It is the only option that meets the ducking requirement without
compromise, it is already built and tested, and Expo keeps it to one TypeScript codebase.
Keep the mode B web page as the fallback: if the native build cannot meet criterion 1, we
fall back to B and accept that music pauses.

## What Eric needs to decide

1. Accept option A as the stack (or pick B or C).
2. Accept the Apple Developer Program cost (99 USD a year) when we reach TestFlight. Not
   needed for the first test: a development build on Eric's own iPhone through Xcode is free.

## Out of scope

Android-specific tuning (after iPhone works), notifications to senders (separate decision),
smart session start (separate decision; v1 keeps "athlete taps Start").
