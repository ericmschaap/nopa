-- 004-session-playback: an athlete may download the audio of notes in their own corners.
create policy "athletes read audio of their own notes" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'notes'
    and exists (
      select 1
      from public.notes n
      join public.corners c on c.id = n.corner_id
      where n.audio_path = objects.name and c.owner_id = (select auth.uid())
    )
  );
