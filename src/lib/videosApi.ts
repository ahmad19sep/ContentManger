import { supabase } from './supabase';
import type { PlatformId, PriorityId, StageId, Video } from '../types';

interface VideoRow {
  id: string;
  workspace_id: string;
  title: string;
  platform: string;
  stage: string;
  priority: string;
  due: string | null;
  publish: string | null;
  note: string | null;
  drive: string | null;
  checks: Record<string, boolean> | null;
  assignee_id: string | null;
  created_by: string | null;
}

function rowToVideo(r: VideoRow): Video {
  return {
    id: r.id,
    title: r.title,
    platform: r.platform as PlatformId,
    stage: r.stage as StageId,
    priority: r.priority as PriorityId,
    due: r.due ?? '',
    publish: r.publish ?? '',
    note: r.note ?? '',
    drive: r.drive ?? undefined,
    checks: r.checks ?? {},
    assigneeId: r.assignee_id ?? null,
  };
}

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

/**
 * Resolve the workspace to operate in: the user's earliest membership
 * (the personal workspace auto-created on signup). Creates one if somehow none.
 */
export async function resolveWorkspaceId(userId: string): Promise<string> {
  const sb = client();
  const { data, error } = await sb
    .from('workspace_members')
    .select('workspace_id, created_at')
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  if (data && data.length > 0) return data[0].workspace_id as string;

  // Fallback: create a workspace + membership.
  const { data: ws, error: wErr } = await sb
    .from('workspaces')
    .insert({ name: 'My workspace', owner_id: userId })
    .select('id')
    .single();
  if (wErr) throw wErr;
  const wsId = ws.id as string;
  const { error: mErr } = await sb
    .from('workspace_members')
    .insert({ workspace_id: wsId, user_id: userId, role: 'owner' });
  if (mErr) throw mErr;
  return wsId;
}

export async function listVideos(workspaceId: string): Promise<Video[]> {
  const sb = client();
  const { data, error } = await sb
    .from('videos')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as VideoRow[]).map(rowToVideo);
}

export async function insertVideo(
  v: Omit<Video, 'id'>,
  workspaceId: string,
  userId: string,
): Promise<Video> {
  const sb = client();
  const { data, error } = await sb
    .from('videos')
    .insert({
      workspace_id: workspaceId,
      title: v.title,
      platform: v.platform,
      stage: v.stage,
      priority: v.priority,
      due: v.due || null,
      publish: v.publish || null,
      note: v.note ?? '',
      drive: v.drive || null,
      checks: v.checks ?? {},
      assignee_id: v.assigneeId ?? null,
      created_by: userId,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToVideo(data as VideoRow);
}

type VideoPatch = Partial<{
  title: string;
  platform: PlatformId;
  stage: StageId;
  priority: PriorityId;
  due: string;
  publish: string;
  note: string;
  drive: string;
  checks: Record<string, boolean>;
  assigneeId: string | null;
}>;

export async function patchVideo(id: string, patch: VideoPatch): Promise<void> {
  const sb = client();
  const row: Record<string, unknown> = {};
  if ('title' in patch) row.title = patch.title;
  if ('platform' in patch) row.platform = patch.platform;
  if ('stage' in patch) row.stage = patch.stage;
  if ('priority' in patch) row.priority = patch.priority;
  if ('due' in patch) row.due = patch.due || null;
  if ('publish' in patch) row.publish = patch.publish || null;
  if ('note' in patch) row.note = patch.note;
  if ('drive' in patch) row.drive = patch.drive || null;
  if ('checks' in patch) row.checks = patch.checks;
  if ('assigneeId' in patch) row.assignee_id = patch.assigneeId;
  const { error } = await sb.from('videos').update(row).eq('id', id);
  if (error) throw error;
}

export async function removeVideo(id: string): Promise<void> {
  const sb = client();
  const { error } = await sb.from('videos').delete().eq('id', id);
  if (error) throw error;
}

export interface VideoSubscriptionHandlers {
  onUpsert: (video: Video) => void;
  onDelete: (id: string) => void;
}

/**
 * Subscribe to live changes on this workspace's videos. Returns an unsubscribe
 * function. RLS + the workspace filter mean you only receive rows you can see.
 */
export function subscribeVideos(
  workspaceId: string,
  handlers: VideoSubscriptionHandlers,
): () => void {
  const sb = client();
  const channel = sb
    .channel(`videos:${workspaceId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'videos', filter: `workspace_id=eq.${workspaceId}` },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id?: string })?.id;
          if (id) handlers.onDelete(id);
        } else {
          handlers.onUpsert(rowToVideo(payload.new as VideoRow));
        }
      },
    )
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}

/** Bulk insert used by the one-time "import my local videos" action. */
export async function importVideos(
  videos: Video[],
  workspaceId: string,
  userId: string,
): Promise<Video[]> {
  const sb = client();
  const rows = videos.map((v) => ({
    workspace_id: workspaceId,
    title: v.title,
    platform: v.platform,
    stage: v.stage,
    priority: v.priority,
    due: v.due || null,
    publish: v.publish || null,
    note: v.note ?? '',
    drive: v.drive || null,
    checks: v.checks ?? {},
    assignee_id: null,
    created_by: userId,
  }));
  const { data, error } = await sb.from('videos').insert(rows).select('*');
  if (error) throw error;
  return (data as VideoRow[]).map(rowToVideo);
}
