import { supabase } from './supabase';
import type { Comment } from '../types';

interface CommentRow {
  id: string;
  video_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

function rowToComment(r: CommentRow): Comment {
  return {
    id: r.id,
    videoId: r.video_id,
    authorId: r.author_id,
    body: r.body,
    createdAt: r.created_at,
  };
}

export async function listComments(videoId: string): Promise<Comment[]> {
  const sb = client();
  const { data, error } = await sb
    .from('comments')
    .select('*')
    .eq('video_id', videoId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as CommentRow[]).map(rowToComment);
}

export async function addComment(
  videoId: string,
  authorId: string,
  body: string,
): Promise<Comment> {
  const sb = client();
  const { data, error } = await sb
    .from('comments')
    .insert({ video_id: videoId, author_id: authorId, body: body.trim() })
    .select('*')
    .single();
  if (error) throw error;
  return rowToComment(data as CommentRow);
}

export async function deleteComment(id: string): Promise<void> {
  const sb = client();
  const { error } = await sb.from('comments').delete().eq('id', id);
  if (error) throw error;
}

export interface CommentSubscriptionHandlers {
  onUpsert: (comment: Comment) => void;
  onDelete: (id: string) => void;
}

export function subscribeComments(
  videoId: string,
  handlers: CommentSubscriptionHandlers,
): () => void {
  const sb = client();
  const channel = sb
    .channel(`comments:${videoId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'comments', filter: `video_id=eq.${videoId}` },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id?: string })?.id;
          if (id) handlers.onDelete(id);
        } else {
          handlers.onUpsert(rowToComment(payload.new as CommentRow));
        }
      },
    )
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}
