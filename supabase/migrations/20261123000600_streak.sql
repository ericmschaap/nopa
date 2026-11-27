-- 006-streak: one shared streak per corner, counted in ISO weeks (Monday-Sunday, UTC).
-- Computed from the notes on read; nothing is stored. No per-sender numbers exist.

-- Internal: the streak of one corner as of p_today. Not callable by anon or athletes.
create function public.corner_streak(p_corner_id uuid, p_today date default (now() at time zone 'utc')::date)
returns table (streak_weeks integer, this_week_kept boolean)
language sql stable security definer set search_path = ''
as $$
  with weeks as (
    -- the Monday of every week that has at least one note, whoever sent it
    select distinct date_trunc('week', n.created_at at time zone 'utc')::date as week_start
    from public.notes n
    where n.corner_id = p_corner_id
  ),
  this_week as (
    select date_trunc('week', p_today::timestamp)::date as week_start
  ),
  kept as (
    select exists (select 1 from weeks w, this_week t where w.week_start = t.week_start) as this_week_kept
  ),
  anchor as (
    -- the current week is still open: with no note yet, count back from last week
    select case when k.this_week_kept then t.week_start else t.week_start - 7 end as week_start
    from this_week t, kept k
  ),
  ranked as (
    select w.week_start, row_number() over (order by w.week_start desc) as rn
    from weeks w, anchor a
    where w.week_start <= a.week_start
  )
  select
    -- the i-th most recent week counts only if it is exactly i-1 weeks before the anchor
    (select count(*)::integer from ranked r, anchor a where r.week_start = a.week_start - ((r.rn - 1) * 7)::integer),
    (select k.this_week_kept from kept k);
$$;

revoke all on function public.corner_streak(uuid, date) from public, anon, authenticated;

-- The share link now also shows the corner's streak.
drop function public.get_corner_by_token(text);
create function public.get_corner_by_token(p_token text)
returns table (name text, finish_date date, streak_weeks integer, this_week_kept boolean)
language sql stable security definer set search_path = ''
as $$
  select c.name, c.finish_date, s.streak_weeks, s.this_week_kept
  from public.corners c
  cross join lateral public.corner_streak(c.id) s
  where c.share_token = p_token;
$$;

revoke all on function public.get_corner_by_token(text) from public;
grant execute on function public.get_corner_by_token(text) to anon, authenticated;

-- The athlete sees the same streak for each of their own corners.
create function public.my_corner_streaks()
returns table (corner_id uuid, streak_weeks integer, this_week_kept boolean)
language sql stable security definer set search_path = ''
as $$
  select c.id, s.streak_weeks, s.this_week_kept
  from public.corners c
  cross join lateral public.corner_streak(c.id) s
  where c.owner_id = (select auth.uid());
$$;

revoke all on function public.my_corner_streaks() from public, anon;
grant execute on function public.my_corner_streaks() to authenticated;
