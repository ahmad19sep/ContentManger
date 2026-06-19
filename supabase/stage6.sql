-- ============================================================================
-- Caira — Stage 6: Google Drive integration
-- Paste into the Supabase SQL Editor and run once. Safe to re-run.
-- ============================================================================

-- Per-workspace Drive connection status (readable by members).
create table if not exists public.workspace_drive (
  workspace_id     uuid primary key references public.workspaces (id) on delete cascade,
  connected        boolean not null default false,
  google_email     text,
  parent_folder_id text,
  connected_by     uuid references auth.users (id) on delete set null,
  updated_at       timestamptz not null default now()
);
alter table public.workspace_drive enable row level security;

drop policy if exists wd_select on public.workspace_drive;
create policy wd_select on public.workspace_drive
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
-- No insert/update policies: only the serverless function (service role) writes.

-- Remember the Drive folder created for each video (to manage sharing later).
alter table public.videos add column if not exists drive_folder_id text;

-- Refresh tokens — secret. RLS enabled with NO policies, so it is invisible to
-- every client; only the service role (serverless functions) can read/write.
create table if not exists public.drive_tokens (
  workspace_id  uuid primary key references public.workspaces (id) on delete cascade,
  refresh_token text not null,
  updated_at    timestamptz not null default now()
);
alter table public.drive_tokens enable row level security;
