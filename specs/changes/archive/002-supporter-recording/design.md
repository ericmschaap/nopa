# 002 — design

## Audio format: convert to WAV in the browser
Browsers record different formats (`audio/webm;codecs=opus` on Chrome and Android,
`audio/mp4` on Safari, Ogg on Firefox). iOS cannot play WebM/Opus natively, so a note recorded
on Android would be silent on an iPhone. Options:

1. Transcode on the server (edge function + ffmpeg) — server code, slow, another moving part.
2. Capture raw PCM with an AudioWorklet — more code, more ways to fail on old phones.
3. **Record with `MediaRecorder`, then decode the result with `decodeAudioData` and re-encode
   as 16-bit mono 22.05 kHz WAV before upload.** A browser can always decode what it just
   recorded. This is the same decode path the milestone 1 proof page already used.

Chosen: 3. Cost: 60 s ≈ 2.6 MB per note, acceptable for a first version. The bucket limit is
4 MB and only `audio/wav` is accepted.

## How a supporter with no account writes data
- The page uses the project's public anon key.
- Tables have row level security on and **no policies for anon**. Everything a supporter does
  goes through `security definer` SQL functions that take the share token:
  - `get_corner_by_token(token)` → goal name + finish date only.
  - `submit_note(token, sender_name, audio_path, duration_ms)` → new note id. Checks that the
    token matches a corner and that the uploaded file exists in the bucket.
  - `add_note_contact(note_id, contact)` → stores the contact; one hour window.
- Storage: anon may only *insert* objects under `inbox/` in the `notes` bucket (no read, no
  list, no overwrite). The file name is a random UUID chosen by the page.
- Upload happens first, then `submit_note`. A file uploaded without a following
  `submit_note` is an orphan nobody can read; cleaning those up is future work.

## No build step
`supporter/` is plain HTML + one JS file talking to Supabase's REST endpoints with `fetch`.
`supporter/config.js` holds the Supabase URL and anon key (public by design). It ships
pointing at the local stack; Eric swaps in the hosted values when deploying.
