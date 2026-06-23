-- ============================================================================
-- Caira — Stage 7: AI Radar integration (news "post" tasks)
-- Paste into the Supabase SQL Editor and run once. Safe to re-run.
-- Adds a "post" card kind plus fields for the master prompt and the parsed
-- AI output that flows back to AI Radar.
-- ============================================================================

alter table public.videos
  add column if not exists kind                 text not null default 'video', -- 'video' | 'post'
  add column if not exists master_prompt        text,
  add column if not exists source_url           text,
  add column if not exists news_source          text,
  add column if not exists news_score           int,
  add column if not exists category             text,
  add column if not exists radar_external_id    text,
  -- parsed worker output (filled when the worker submits / owner approves):
  add column if not exists headline             text,
  add column if not exists article              text,
  add column if not exists x_post               text,
  add column if not exists linkedin_post        text,
  add column if not exists facebook_post        text,
  add column if not exists instagram_caption    text,
  add column if not exists whatsapp_post        text,
  add column if not exists youtube_short_script text,
  add column if not exists image_prompt         text,
  add column if not exists fact_check_notes     text,
  add column if not exists risk_level           text,
  -- workflow flags for the AI Radar return path:
  add column if not exists approved             boolean not null default false,
  add column if not exists radar_delivered      boolean not null default false;

-- Dedup key: one card per imported AI Radar story.
create unique index if not exists videos_radar_external_id_key
  on public.videos (radar_external_id) where radar_external_id is not null;
