import { supabase } from './supabase';

export interface WorkspaceSummary {
  id: string;
  name: string;
  ownerId: string;
  role: string; // 'owner' | 'member'
}

export interface Member {
  userId: string;
  role: string;
  fullName: string;
  email: string | null;
}

export interface Invite {
  id: string;
  email: string;
  createdAt: string;
}

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

interface MembershipRow {
  role: string;
  workspaces: { id: string; name: string; owner_id: string } | null;
}

export async function listWorkspaces(): Promise<WorkspaceSummary[]> {
  const sb = client();
  const { data, error } = await sb
    .from('workspace_members')
    .select('role, workspaces(id, name, owner_id)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as unknown as MembershipRow[])
    .filter((r) => r.workspaces)
    .map((r) => ({
      id: r.workspaces!.id,
      name: r.workspaces!.name,
      ownerId: r.workspaces!.owner_id,
      role: r.role,
    }));
}

export async function createWorkspace(
  name: string,
  userId: string,
): Promise<WorkspaceSummary> {
  const sb = client();
  const { data, error } = await sb
    .from('workspaces')
    .insert({ name: name.trim() || 'New workspace', owner_id: userId })
    .select('id, name, owner_id')
    .single();
  if (error) throw error;
  const { error: mErr } = await sb
    .from('workspace_members')
    .insert({ workspace_id: data.id, user_id: userId, role: 'owner' });
  if (mErr) throw mErr;
  return { id: data.id, name: data.name, ownerId: data.owner_id, role: 'owner' };
}

export async function renameWorkspace(id: string, name: string): Promise<void> {
  const sb = client();
  const { error } = await sb.from('workspaces').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteWorkspace(id: string): Promise<void> {
  const sb = client();
  const { error } = await sb.from('workspaces').delete().eq('id', id);
  if (error) throw error;
}

export async function listMembers(workspaceId: string): Promise<Member[]> {
  const sb = client();
  const { data: mems, error } = await sb
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', workspaceId);
  if (error) throw error;
  const ids = (mems as { user_id: string; role: string }[]).map((m) => m.user_id);
  if (ids.length === 0) return [];
  const { data: profs, error: pErr } = await sb
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ids);
  if (pErr) throw pErr;
  const byId = new Map(
    (profs as { id: string; full_name: string; email: string | null }[]).map((p) => [p.id, p]),
  );
  return (mems as { user_id: string; role: string }[]).map((m) => ({
    userId: m.user_id,
    role: m.role,
    fullName: byId.get(m.user_id)?.full_name ?? 'Member',
    email: byId.get(m.user_id)?.email ?? null,
  }));
}

export async function listInvites(workspaceId: string): Promise<Invite[]> {
  const sb = client();
  const { data, error } = await sb
    .from('workspace_invites')
    .select('id, email, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as { id: string; email: string; created_at: string }[]).map((i) => ({
    id: i.id,
    email: i.email,
    createdAt: i.created_at,
  }));
}

/** Returns 'added' (existing user joined) or 'invited' (pending invite created). */
export async function inviteByEmail(
  workspaceId: string,
  email: string,
): Promise<'added' | 'invited'> {
  const sb = client();
  const { data, error } = await sb.rpc('invite_to_workspace', {
    ws: workspaceId,
    invite_email: email.trim(),
  });
  if (error) throw error;
  return data as 'added' | 'invited';
}

export async function revokeInvite(id: string): Promise<void> {
  const sb = client();
  const { error } = await sb.from('workspace_invites').delete().eq('id', id);
  if (error) throw error;
}

export async function removeMember(
  workspaceId: string,
  userId: string,
): Promise<void> {
  const sb = client();
  const { error } = await sb
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);
  if (error) throw error;
}
