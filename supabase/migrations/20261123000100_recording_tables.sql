-- 002-supporter-recording: tables and storage.
-- Row level security is on everywhere. Supporters (anon) get no table access at all; they go
-- through the functions in the next migration.

create table public.corners (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  finish_date date not null,
  -- 20 hex characters from a random UUID: unguessable, short enough for a link.
  share_token text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 20),
  created_at timestamptz not null default now()
);
create index corners_owner_idx on public.corners (owner_id);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  corner_id uuid not null references public.corners (id) on delete cascade,
  sender_name text not null check (char_length(btrim(sender_name)) between 1 and 40),
  audio_path text not null unique,
  duration_ms integer not null check (duration_ms between 1 and 61000),
  created_at timestamptz not null default now(),
  heard_at timestamptz
);
create index notes_corner_idx on public.notes (corner_id, created_at);

-- Contacts for the later "they listened" notification. Kept apart from notes so that no
-- policy on notes can ever expose them. No policies: only security definer functions and
-- the service role can touch this table.
create table public.note_contacts (
  note_id uuid primary key references public.notes (id) on delete cascade,
  contact text not null check (char_length(btrim(contact)) between 3 and 200),
  created_at timestamptz not null default now()
);

alter table public.corners enable row level security;
alter table public.notes enable row level security;
alter table public.note_contacts enable row level security;

revoke all on public.corners, public.notes, public.note_contacts from anon, authenticated;

-- Private bucket for the audio. 4 MB covers 60 s of 22.05 kHz 16-bit mono WAV (~2.6 MB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notes', 'notes', false, 4194304, array['audio/wav'])
on conflict (id) do nothing;

-- Anyone may drop a file into inbox/. Nobody can read, list or overwrite through this policy.
create policy "anyone can upload a note" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'notes' and name ~ '^inbox/[0-9a-f-]{36}\.wav$');
