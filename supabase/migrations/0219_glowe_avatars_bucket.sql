-- ─────────────────────────────────────────────
-- 0219_glowe_avatars_bucket.sql
-- Creates the `glowe-avatars` Storage bucket + RLS policies for
-- FR-GLOWE-011 AC3 (Personal Area → Edit Profile → avatar upload).
--
-- The GloWe web frontend uploads a profile image to Supabase Storage and writes
-- the resulting public URL to `glowe_profiles.avatar_url`. Kept as its own bucket
-- (not the KC `avatars` bucket) so GloWe media stays namespaced alongside the
-- other `glowe_*` data and can be tightened independently.
--
-- Path scheme: <user_id>/avatar-<timestamp>.<ext> (owner-scoped folder).
-- Public read — same posture as the KC `avatars` / `post-images` buckets
-- (TD-11 tracks the future tightening for all public-read buckets).
-- Cap 5 MB (matches the FR-GLOWE-011 AC3 client-side limit); mime jpeg/png/webp.
-- ─────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('glowe-avatars', 'glowe-avatars', true, 5 * 1024 * 1024,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy glowe_avatars_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'glowe-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy glowe_avatars_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'glowe-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy glowe_avatars_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'glowe-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy glowe_avatars_read_public on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'glowe-avatars');
