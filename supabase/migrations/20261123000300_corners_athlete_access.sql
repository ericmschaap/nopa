-- 003-corners-share-links: what a signed-in athlete may do with their own data.

grant select on public.corners to authenticated;
grant insert (name, finish_date) on public.corners to authenticated;
grant select (id, corner_id, sender_name, audio_path, duration_ms, created_at, heard_at) on public.notes to authenticated;

create policy "athletes read their own corners" on public.corners
  for select to authenticated
  using (owner_id = (select auth.uid()));

-- owner_id defaults to auth.uid(); the finish date must not be in the past
-- (one day of slack because "today" depends on the athlete's time zone).
create policy "athletes create their own corners" on public.corners
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and finish_date >= current_date - 1);

create policy "athletes read notes in their own corners" on public.notes
  for select to authenticated
  using (exists (
    select 1 from public.corners c where c.id = notes.corner_id and c.owner_id = (select auth.uid())
  ));
