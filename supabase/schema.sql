-- ============================================================================
-- VideoFlow — Supabase schema & row-level security
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per user, mirrors auth.users. Holds display name + role.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default 'New user',
  role        text not null default 'Creator',
  email       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);
alter table public.profiles add column if not exists email text;

create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'My workspace',
  owner_id    uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null default 'member', -- 'owner' | 'member'
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- Pending invitations by email (claimed when that email signs up / accepts).
create table if not exists public.workspace_invites (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email        text not null,
  invited_by   uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (workspace_id, email)
);

create table if not exists public.videos (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title        text not null,
  platform     text not null default 'yt',
  stage        text not null default 'idea',
  priority     text not null default 'med',
  due          date,
  publish      date,
  note         text not null default '',
  drive        text,
  checks       jsonb not null default '{}'::jsonb,
  assignee_id  uuid references auth.users (id) on delete set null,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists videos_workspace_idx on public.videos (workspace_id);

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  video_id    uuid not null references public.videos (id) on delete cascade,
  author_id   uuid not null references auth.users (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists comments_video_idx on public.comments (video_id);

-- ---------------------------------------------------------------------------
-- Helper: is the current user a member of a workspace?
-- SECURITY DEFINER avoids infinite recursion in workspace_members policies.
-- ---------------------------------------------------------------------------
create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Invite by email: add an existing user straight in, else record a pending
-- invite they claim on signup. (SECURITY DEFINER to read auth.users by email.)
-- ---------------------------------------------------------------------------
create or replace function public.invite_to_workspace(ws uuid, invite_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  if not public.is_workspace_member(ws) then
    raise exception 'You are not a member of this workspace';
  end if;
  select id into uid from auth.users where lower(email) = lower(invite_email) limit 1;
  if uid is not null then
    insert into public.workspace_members (workspace_id, user_id, role)
    values (ws, uid, 'member') on conflict do nothing;
    return 'added';
  else
    insert into public.workspace_invites (workspace_id, email, invited_by)
    values (ws, lower(invite_email), auth.uid())
    on conflict (workspace_id, email) do nothing;
    return 'invited';
  end if;
end;
$$;
grant execute on function public.invite_to_workspace(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- New-user bootstrap: create a profile + a personal workspace on signup.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws_id uuid;
begin
  insert into public.profiles (id, full_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'Creator',
    new.email
  )
  on conflict (id) do update set email = excluded.email;

  insert into public.workspaces (name, owner_id)
  values ('My workspace', new.id)
  returning id into ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  -- auto-join any workspace this email was invited to
  insert into public.workspace_members (workspace_id, user_id, role)
  select i.workspace_id, new.id, 'member'
  from public.workspace_invites i
  where lower(i.email) = lower(new.email)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep videos.updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists videos_touch on public.videos;
create trigger videos_touch before update on public.videos
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.workspaces         enable row level security;
alter table public.workspace_members  enable row level security;
alter table public.workspace_invites  enable row level security;
alter table public.videos             enable row level security;
alter table public.comments           enable row level security;

-- profiles: anyone authenticated can read profiles; you edit only your own
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- workspaces: members can read; you can create one you own; owner manages
drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select to authenticated using (public.is_workspace_member(id) or owner_id = auth.uid());
drop policy if exists workspaces_insert on public.workspaces;
create policy workspaces_insert on public.workspaces
  for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update on public.workspaces
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists workspaces_delete on public.workspaces;
create policy workspaces_delete on public.workspaces
  for delete to authenticated using (owner_id = auth.uid());

-- workspace_members: members see the roster; you always see your own row;
-- the workspace owner can add/remove members
drop policy if exists members_select on public.workspace_members;
create policy members_select on public.workspace_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_workspace_member(workspace_id));
drop policy if exists members_insert on public.workspace_members;
create policy members_insert on public.workspace_members
  for insert to authenticated
  with check (
    user_id = auth.uid() -- accept your own membership (e.g. via invite)
    or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())
  );
drop policy if exists members_delete on public.workspace_members;
create policy members_delete on public.workspace_members
  for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())
  );

-- invites: members of the workspace can see/create; owner can revoke
drop policy if exists invites_select on public.workspace_invites;
create policy invites_select on public.workspace_invites
  for select to authenticated using (public.is_workspace_member(workspace_id));
drop policy if exists invites_insert on public.workspace_invites;
create policy invites_insert on public.workspace_invites
  for insert to authenticated with check (public.is_workspace_member(workspace_id) and invited_by = auth.uid());
drop policy if exists invites_delete on public.workspace_invites;
create policy invites_delete on public.workspace_invites
  for delete to authenticated using (public.is_workspace_member(workspace_id));

-- videos: any member of the workspace has full access
drop policy if exists videos_all on public.videos;
create policy videos_all on public.videos
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- comments: members of the video's workspace can read + post; author can delete
drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments
  for select to authenticated
  using (exists (
    select 1 from public.videos v
    where v.id = video_id and public.is_workspace_member(v.workspace_id)
  ));
drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments
  for insert to authenticated
  with check (author_id = auth.uid() and exists (
    select 1 from public.videos v
    where v.id = video_id and public.is_workspace_member(v.workspace_id)
  ));
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments
  for delete to authenticated using (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime: broadcast row changes for live collaboration
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.videos;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.workspace_members;
