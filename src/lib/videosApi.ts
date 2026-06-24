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
  // post fields (may be absent on older rows)
  kind?: string | null;
  master_prompt?: string | null;
  source_url?: string | null;
  news_source?: string | null;
  category?: string | null;
  news_score?: number | null;
  approved?: boolean | null;
  headline?: string | null;
  article?: string | null;
  x_post?: string | null;
  linkedin_post?: string | null;
  facebook_post?: string | null;
  instagram_caption?: string | null;
  whatsapp_post?: string | null;
  youtube_short_script?: string | null;
  image_prompt?: string | null;
  image_url?: string | null;
  fact_check_notes?: string | null;
  risk_level?: string | null;
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
    kind: (r.kind as 'video' | 'post') ?? 'video',
    masterPrompt: r.master_prompt ?? undefined,
    sourceUrl: r.source_url ?? undefined,
    newsSource: r.news_source ?? undefined,
    category: r.category ?? undefined,
    newsScore: r.news_score ?? null,
    approved: r.approved ?? false,
    headline: r.headline ?? undefined,
    article: r.article ?? undefined,
    xPost: r.x_post ?? undefined,
    linkedinPost: r.linkedin_post ?? undefined,
    facebookPost: r.facebook_post ?? undefined,
    instagramCaption: r.instagram_caption ?? undefined,
    whatsappPost: r.whatsapp_post ?? undefined,
    youtubeShortScript: r.youtube_short_script ?? undefined,
    imagePrompt: r.image_prompt ?? undefined,
    imageUrl: r.image_url ?? undefined,
    factCheckNotes: r.fact_check_notes ?? undefined,
    riskLevel: r.risk_level ?? undefined,
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

/**
 * Save the parsed AI output onto a post card. When `publish` is true (content +
 * image both present), it goes straight to Publishing/approved so /api/ready picks
 * it up; otherwise it stays in Review until the image is added.
 */
export async function savePostOutput(
  id: string,
  p: {
    headline?: string;
    article?: string;
    xPost?: string;
    linkedinPost?: string;
    facebookPost?: string;
    instagramCaption?: string;
    whatsappPost?: string;
    youtubeShortScript?: string;
    imagePrompt?: string;
    factCheckNotes?: string;
    riskLevel?: string;
  },
  publish = false,
): Promise<void> {
  const sb = client();
  const { error } = await sb
    .from('videos')
    .update({
      headline: p.headline ?? null,
      article: p.article ?? null,
      x_post: p.xPost ?? null,
      linkedin_post: p.linkedinPost ?? null,
      facebook_post: p.facebookPost ?? null,
      instagram_caption: p.instagramCaption ?? null,
      whatsapp_post: p.whatsappPost ?? null,
      youtube_short_script: p.youtubeShortScript ?? null,
      image_prompt: p.imagePrompt ?? null,
      fact_check_notes: p.factCheckNotes ?? null,
      risk_level: p.riskLevel ?? null,
      stage: publish ? 'publish' : 'review',
      ...(publish ? { approved: true } : {}),
    })
    .eq('id', id);
  if (error) throw error;
}

/** Upload an image to the public post-images bucket and save its URL on the card. */
export async function uploadPostImage(videoId: string, file: File): Promise<string> {
  const sb = client();
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `${videoId}/${Date.now()}.${ext}`;
  const { error } = await sb.storage
    .from('post-images')
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (error) throw error;
  const url = sb.storage.from('post-images').getPublicUrl(path).data.publicUrl;
  const { error: e2 } = await sb.from('videos').update({ image_url: url }).eq('id', videoId);
  if (e2) throw e2;
  return url;
}

/** Owner approval — flags the post so /api/ready hands it back to AI Radar. */
export async function setApproved(id: string, approved: boolean): Promise<void> {
  const sb = client();
  const { error } = await sb
    .from('videos')
    .update(approved ? { approved: true, stage: 'publish' } : { approved: false, stage: 'review' })
    .eq('id', id);
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
