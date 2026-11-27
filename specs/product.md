# Nopa — product

This is the current, agreed behaviour of the product. Capability specs in this folder hold the
detail; change proposals in `/changes` say how it moves. Product decisions listed here are
settled: reopen them only with Eric.

## What Nopa is

Nopa (from the Luxembourgish word for neighbour) lets the people who care about an athlete
share the whole journey towards a goal, not just the finish line. Friends and family record
short voice notes; the athlete hears them spread through their hard training sessions.

It is for anyone working towards an athletic goal: a first 10K, a marathon, a mountain, a long
ride. Not only "proper" endurance athletes. No training jargon, no coach features.

## Words

| Say | Never say |
| --- | --- |
| **circle**: the athlete plus the people supporting them towards one goal | corner, support group, team |
| **sender**: someone in the circle who records a message (called *supporter* in parts of the code) | fan, follower |
| **message** (in copy) / **note** (in code) | |
| **goal**, **be there for Sam**, **share the journey** | grit, pain, crush it, beast mode |

Tone: soft, about sharing the journey and showing up together. No leaderboards, no individual
sender streaks, no competition.

## Settled product decisions

1. **One circle per goal**, with a finish date (a race, a milestone, any day that matters).
2. **Voice first.** Messages play directly in the athlete app during a session. There is no
   email bundle for the athlete to open.
3. **Spread through the session**, never all at the start. Simple time-spaced delivery is
   enough for v1.
4. **Athletes are the hard side.** Every athlete flow is as low-friction as possible: no login
   screen, no reading, tap Start and put the phone away.
5. **Senders need no account.** They open a share link in a phone browser, record, done.
   Afterwards they can optionally leave a number or email to hear when the athlete listened.
6. **A shared circle streak** keeps people coming back: everyone in the circle keeps it alive
   together, shown as weeks side by side.
7. **Sits alongside WhatsApp.** The share link is made to be dropped into an existing group
   chat. Nopa does not replace the chat.

## How it works today (v1 behaviour)

**Athlete.** Opens the app (no sign-up), gives a first name, a goal and its finish date. Says
which days they usually train and whether each is an easy one, a hard one or a long one; that
fills a calendar. Sends the circle's link to their people. Before a session, taps Start, locks
the phone, trains. Messages for that day play spread through the session, over their own
music, which ducks under each message.

**Sender.** Opens the link in any browser. Sees the athlete's first name, the goal, the shared
streak and the calendar, with a dot under each training day per message waiting and a hollow
dot where nobody is yet. Picks a day to be there for, or "any time", records up to 60 seconds,
listens back, adds a first name, sends. Optionally leaves a contact.

**Together.** The streak counts the weeks in a row in which the circle got at least one
message heard. Weeks run Monday to Sunday.

## Capabilities

| Capability | Spec |
| --- | --- |
| circles | [`circles/spec.md`](circles/spec.md) |
| share-links | [`share-links/spec.md`](share-links/spec.md) |
| recording | [`recording/spec.md`](recording/spec.md) |
| plan | [`plan/spec.md`](plan/spec.md) |
| session-playback | [`session-playback/spec.md`](session-playback/spec.md) |
| heard-tracking | [`heard-tracking/spec.md`](heard-tracking/spec.md) |
| streak | [`streak/spec.md`](streak/spec.md) |

## Agreed details

- Share link: `<sender page URL>/?c=<share_token>`. The token is random and is all a sender needs.
- A message is at most 60 seconds, stored as mono WAV so every phone plays it without
  server transcoding.
- A message not heard on its day moves to the next session.
- Senders see how many messages each day has, never from whom.
- Look: calm and plain. A serif for names and moments, a light sans for the rest, one muted
  green, no boxes, no decoration. Figma is the source of truth for the look.

## Personal data

Voice notes are personal data of real people and Eric is in the EU. Collect the minimum, keep
data in an EU region (Supabase Frankfurt), and make deletion possible: a sender can remove
their message, an athlete can delete a circle. Every new kind of personal data is recorded in
the Notion decisions log.

## Open product decisions (raised with Eric, not assumed)

- Client stack, decided by locked-phone playback: `changes/010-stack-decision`.
- Notifications to senders (email, SMS, WhatsApp) and which provider.
- How a session starts in v1: athlete taps Start, or something smarter.

## Out of scope until v1 works

Training-calendar integration (Garmin, Polar, calendar import), smart timing from workout data,
a paid fan tier for pro athletes with moderation-by-construction, payments.
