-- 005-heard-tracking: the athlete marks a note as heard, with the time it was heard.
-- Owner only. The first mark wins. The time comes from the phone (so marks made with no
-- signal keep their real time) but is kept between the note's creation and now.
create function public.mark_note_heard(p_note_id uuid, p_heard_at timestamptz default now())
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare
  v_heard_at timestamptz;
begin
  update public.notes n
  set heard_at = greatest(n.created_at, least(coalesce(p_heard_at, now()), now()))
  from public.corners c
  where n.id = p_note_id
    and c.id = n.corner_id
    and c.owner_id = (select auth.uid())
    and n.heard_at is null;

  select n.heard_at into v_heard_at
  from public.notes n
  join public.corners c on c.id = n.corner_id
  where n.id = p_note_id and c.owner_id = (select auth.uid());

  if not found then
    raise exception 'note_not_found' using errcode = 'P0002';
  end if;
  return v_heard_at;
end;
$$;

revoke all on function public.mark_note_heard(uuid, timestamptz) from public, anon;
grant execute on function public.mark_note_heard(uuid, timestamptz) to authenticated;
