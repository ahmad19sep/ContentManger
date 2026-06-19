import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth';
import {
  addComment,
  deleteComment,
  listComments,
  subscribeComments,
} from '../lib/commentsApi';
import { useStore } from '../store';
import type { Comment } from '../types';
import { Avatar } from './ui';

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function CommentsSection({ videoId }: { videoId: string }) {
  const s = useStore();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const nameOf = useMemo(() => {
    const map = new Map(s.members.map((m) => [m.userId, m.fullName]));
    return (id: string) => map.get(id) ?? 'Member';
  }, [s.members]);

  useEffect(() => {
    let active = true;
    listComments(videoId)
      .then((c) => active && setComments(c))
      .catch(() => active && setComments([]));
    const unsub = subscribeComments(videoId, {
      onUpsert: (c) =>
        setComments((prev) => {
          const i = prev.findIndex((x) => x.id === c.id);
          if (i === -1) return [...prev, c];
          const copy = prev.slice();
          copy[i] = c;
          return copy;
        }),
      onDelete: (id) => setComments((prev) => prev.filter((x) => x.id !== id)),
    });
    return () => {
      active = false;
      unsub();
    };
  }, [videoId]);

  const submit = async () => {
    const body = draft.trim();
    if (!body || !user) return;
    setBusy(true);
    try {
      const c = await addComment(videoId, user.id, body);
      setComments((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]));
      setDraft('');
    } catch {
      /* ignore; surfaced rarely */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        Comments {comments.length > 0 && `(${comments.length})`}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
        {comments.map((c) => {
          const name = nameOf(c.authorId);
          const mine = c.authorId === user?.id;
          return (
            <div key={c.id} style={{ display: 'flex', gap: 9 }}>
              <Avatar name={name} size={26} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{name}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{timeAgo(c.createdAt)}</span>
                  {mine && (
                    <button
                      onClick={() => deleteComment(c.id).catch(() => {})}
                      style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: 'var(--muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.45, whiteSpace: 'pre-wrap', marginTop: 2 }}>{c.body}</div>
              </div>
            </div>
          );
        })}
        {comments.length === 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>No comments yet. Start the discussion.</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
          }}
          placeholder="Write a comment…  (⌘/Ctrl+Enter to send)"
          style={{ flex: 1, minHeight: 56, resize: 'vertical', border: '1px solid var(--line)', borderRadius: 10, padding: '9px 11px', fontSize: 13, lineHeight: 1.45, color: 'var(--ink)', background: 'var(--canvas)', outline: 'none' }}
        />
        <button
          onClick={submit}
          disabled={busy || !draft.trim()}
          style={{ flex: 'none', border: 'none', background: draft.trim() ? 'var(--accent)' : '#D9D6CF', color: '#fff', borderRadius: 9, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: draft.trim() ? 'pointer' : 'not-allowed' }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
