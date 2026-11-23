-- 002-supporter-recording: the only things a supporter (anon key) can do.

-- What a share link shows: the goal and its finish date, nothing else.
create function public.get_corner_by_token(p_token text)
returns table (name text, finish_date date)
language sql stable security definer set search_path = ''
as $$
  select c.name, c.finish_date from public.corners c where c.share_token = p_token;
$$;

-- Store a note against the corner behind the token. The audio must already be uploaded.
create function public.submit_note(p_token text, p_sender_name text, p_audio_path text, p_duration_ms integer)
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

  insert into public.notes (corner_id, sender_name, audio_path, duration_ms)
  values (v_corner_id, btrim(p_sender_name), p_audio_path, p_duration_ms)
  returning id into v_note_id;
  return v_note_id;
end;
$$;

-- Optional contact for a later "they listened" notification. Only the sender knows the note
-- id, and only for an hour after sending.
create function public.add_note_contact(p_note_id uuid, p_contact text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.notes n where n.id = p_note_id and n.created_at > now() - interval '1 hour'
  ) then
    raise exception 'note_not_found' using errcode = 'P0002';
  end if;

  insert into public.note_contacts (note_id, contact)
  values (p_note_id, btrim(p_contact))
  on conflict (note_id) do update set contact = excluded.contact;
end;
$$;

revoke all on function public.get_corner_by_token(text) from public;
revoke all on function public.submit_note(text, text, text, integer) from public;
revoke all on function public.add_note_contact(uuid, text) from public;
grant execute on function public.get_corner_by_token(text) to anon, authenticated;
grant execute on function public.submit_note(text, text, text, integer) to anon, authenticated;
grant execute on function public.add_note_contact(uuid, text) to anon, authenticated;
