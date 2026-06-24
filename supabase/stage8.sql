-- ============================================================================
-- Caira — Stage 8: post image uploads
-- Paste into the Supabase SQL Editor and run once. Safe to re-run.
-- ============================================================================

alter table public.videos add column if not exists image_url text;

-- Public bucket for images attached to post cards.
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Anyone can read (the bucket is public); signed-in users can upload/replace.
drop policy if exists "post_images_read" on storage.objects;
create policy "post_images_read" on storage.objects
  for select using (bucket_id = 'post-images');

drop policy if exists "post_images_insert" on storage.objects;
create policy "post_images_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'post-images');

drop policy if exists "post_images_update" on storage.objects;
create policy "post_images_update" on storage.objects
  for update to authenticated using (bucket_id = 'post-images');
