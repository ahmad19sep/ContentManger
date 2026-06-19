-- ============================================================================
-- VideoFlow — Stage 2 additions (workspaces & invites)
-- Paste into the Supabase SQL Editor and run once. Safe to re-run.
-- ============================================================================

-- Store email on profiles so we can show it in the member list.
alter table public.profiles add column if not exists email text;

-- Backfill existing profiles' email from auth.users.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Update the signup bootstrap to also record email.
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

  insert into public.workspace_members (workspace_id, user_id, role)
  select i.workspace_id, new.id, 'member'
  from public.workspace_invites i
  where lower(i.email) = lower(new.email)
  on conflict do nothing;

  return new;
end;
$$;

-- Invite by email: if the email already has an account, add them straight to
-- the workspace; otherwise record a pending invite they'll claim on signup.
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
    values (ws, uid, 'member')
    on conflict do nothing;
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
