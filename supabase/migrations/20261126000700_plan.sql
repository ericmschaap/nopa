-- 009-plan-and-calendar: a simple training plan per corner, and messages left for a day.

-- The athlete's first name, so supporters read "be there for Sam".
alter table public.corners
  add column athlete_name text not null default '' check (char_length(btrim(athlete_name)) <= 30);
grant insert (athlete_name) on public.corners to authenticated;

-- One session per day: an easy one, a hard one or a long one, with a rough length.
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  corner_id uuid not null references public.corners (id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('easy', 'hard', 'long')),
  minutes integer not null check (minutes between 5 and 720),
  unique (corner_id, day)
);
alter table public.sessions enable row level security;
revoke all on public.sessions from anon, authenticated;
grant select on public.sessions to authenticated;
create policy "athletes read their own sessions" on public.sessions
  for select to authenticated
  using (exists (select 1 from public.corners c where c.id = sessions.corner_id and c.owner_id = (select auth.uid())));

-- A message may be left for one session; null means "any time".
alter table public.notes add column session_id uuid references public.sessions (id) on delete set null;
create index notes_session_idx on public.notes (session_id);
grant select (session_id) on public.notes to authenticated;

-- Raises unless the caller owns the corner.
create function public.assert_corner_owner(p_corner_id uuid)
returns void language plpgsql stable security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.corners c where c.id = p_corner_id and c.owner_id = (select auth.uid())) then
    raise exception 'corner_not_found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.assert_corner_owner(uuid) from public, anon, authenticated;

-- Add or change the session on one day.
create function public.set_session(p_corner_id uuid, p_day date, p_kind text, p_minutes integer)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  perform public.assert_corner_owner(p_corner_id);
  insert into public.sessions (corner_id, day, kind, minutes) values (p_corner_id, p_day, p_kind, p_minutes)
  on conflict (corner_id, day) do update set kind = excluded.kind, minutes = excluded.minutes
  returning id into v_id;
  return v_id;
end;
$$;

-- Take a day off. Messages left for it become "any time".
create function public.remove_session(p_session_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.sessions s using public.corners c
  where s.id = p_session_id and c.id = s.corner_id and c.owner_id = (select auth.uid());
end;
$$;

-- Fill the calendar from a usual week. p_week is a JSON array of 7 entries, Monday first:
-- null for a rest day, or {"kind": "easy", "minutes": 30}. Covers p_from and the 12 weeks
-- after it, or up to the finish day if that is sooner. Days that keep a session keep their
-- messages; a message whose day becomes a rest day turns into "any time".
create function public.set_usual_week(p_corner_id uuid, p_week jsonb, p_from date)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  v_finish date;
  v_until date;
  v_day date;
  v_entry jsonb;
  v_count integer := 0;
begin
  perform public.assert_corner_owner(p_corner_id);
  if jsonb_typeof(p_week) <> 'array' or jsonb_array_length(p_week) <> 7 then
    raise exception 'week_must_have_7_days' using errcode = '22023';
  end if;
  select c.finish_date into v_finish from public.corners c where c.id = p_corner_id;
  v_until := least(v_finish, p_from + 83);

  delete from public.sessions s
  where s.corner_id = p_corner_id and s.day >= p_from
    and (s.day > v_until or jsonb_typeof(p_week -> (extract(isodow from s.day)::integer - 1)) <> 'object');

  v_day := p_from;
  while v_day <= v_until loop
    v_entry := p_week -> (extract(isodow from v_day)::integer - 1);
    if jsonb_typeof(v_entry) = 'object' then
      insert into public.sessions (corner_id, day, kind, minutes)
      values (p_corner_id, v_day, v_entry ->> 'kind', (v_entry ->> 'minutes')::integer)
      on conflict (corner_id, day) do update set kind = excluded.kind, minutes = excluded.minutes;
      v_count := v_count + 1;
    end if;
    v_day := v_day + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.set_session(uuid, date, text, integer) from public, anon;
revoke all on function public.remove_session(uuid) from public, anon;
revoke all on function public.set_usual_week(uuid, jsonb, date) from public, anon;
grant execute on function public.set_session(uuid, date, text, integer) to authenticated;
grant execute on function public.remove_session(uuid) to authenticated;
grant execute on function public.set_usual_week(uuid, jsonb, date) to authenticated;

-- What a share link shows: now with the athlete's first name.
drop function public.get_corner_by_token(text);
create function public.get_corner_by_token(p_token text)
returns table (name text, athlete_name text, finish_date date, streak_weeks integer, this_week_kept boolean)
language sql stable security definer set search_path = ''
as $$
  select c.name, c.athlete_name, c.finish_date, s.streak_weeks, s.this_week_kept
  from public.corners c
  cross join lateral public.corner_streak(c.id) s
  where c.share_token = p_token;
$$;
revoke all on function public.get_corner_by_token(text) from public;
grant execute on function public.get_corner_by_token(text) to anon, authenticated;

-- The plan behind a share link: upcoming sessions (from yesterday, to allow for time zones,
-- to 8 weeks ahead) and how many unheard messages each has. Never who left them.
create function public.get_plan_by_token(p_token text)
returns table (id uuid, day date, kind text, minutes integer, messages integer)
language sql stable security definer set search_path = ''
as $$
  select s.id, s.day, s.kind, s.minutes,
         (select count(*)::integer from public.notes n where n.session_id = s.id and n.heard_at is null)
  from public.corners c
  join public.sessions s on s.corner_id = c.id
  where c.share_token = p_token
    and s.day >= (now() at time zone 'utc')::date - 1
    and s.day <= (now() at time zone 'utc')::date + 56
  order by s.day;
$$;
revoke all on function public.get_plan_by_token(text) from public;
grant execute on function public.get_plan_by_token(text) to anon, authenticated;

-- A message can now be left for one session of the corner (or for any time).
drop function public.submit_note(text, text, text, integer);
create function public.submit_note(p_token text, p_sender_name text, p_audio_path text, p_duration_ms integer, p_session_id uuid default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_corner_id uuid;
  v_note_id uuid;
begin
  select c.id into v_corner_id from public.corners c where c.share_token = p_token;
  if v_corner_id is null then
    raise exception 'corner_not_found' using errcode = 'P0002';
  end if;
  if char_length(btrim(coalesce(p_sender_name, ''))) = 0 then
    raise exception 'sender_name_required' using errcode = '22023';
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'notes' and o.name = p_audio_path) then
    raise exception 'audio_not_found' using errcode = 'P0002';
  end if;
  if p_session_id is not null and not exists (
    select 1 from public.sessions s where s.id = p_session_id and s.corner_id = v_corner_id
  ) then
    raise exception 'session_not_found' using errcode = 'P0002';
  end if;

  insert into public.notes (corner_id, sender_name, audio_path, duration_ms, session_id)
  values (v_corner_id, btrim(p_sender_name), p_audio_path, p_duration_ms, p_session_id)
  returning id into v_note_id;
  return v_note_id;
end;
$$;
revoke all on function public.submit_note(text, text, text, integer, uuid) from public;
grant execute on function public.submit_note(text, text, text, integer, uuid) to anon, authenticated;
