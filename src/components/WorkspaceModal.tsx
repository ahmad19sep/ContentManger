import { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { useStore } from '../store';
import {
  deleteWorkspace,
  inviteByEmail,
  listInvites,
  listMembers,
  removeMember,
  renameWorkspace,
  revokeInvite,
  type Invite,
  type Member,
} from '../lib/workspacesApi';

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 9,
};

export function WorkspaceModal({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const { user } = useAuth();
  const ws = s.currentWorkspace;
  const isOwner = ws?.role === 'owner';

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState(ws?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsId = ws?.id ?? null;

  const refresh = async () => {
    if (!wsId) return;
    try {
      const [m, i] = await Promise.all([listMembers(wsId), listInvites(wsId)]);
      setMembers(m);
      setInvites(i);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load members.');
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsId]);

  if (!ws) return null;

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsId || !email.trim()) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const result = await inviteByEmail(wsId, email);
      setMsg(
        result === 'added'
          ? `${email.trim()} was added to the workspace.`
          : `Invite sent — ${email.trim()} will join when they sign up.`,
      );
      setEmail('');
      await refresh();
      await s.refreshMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not invite.');
    } finally {
      setBusy(false);
    }
  };

  const saveName = async () => {
    if (!wsId || name.trim() === ws.name || !name.trim()) return;
    try {
      await renameWorkspace(wsId, name.trim());
      await s.refreshWorkspaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename.');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,28,0.34)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'overlayIn .16s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 460, maxWidth: '100%', maxHeight: '88vh', overflow: 'auto', background: 'var(--surface)', borderRadius: 16, boxShadow: '0 24px 70px rgba(0,0,0,0.22)', animation: 'modalIn .2s cubic-bezier(.2,.7,.2,1)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Workspace settings</div>
          <button onClick={onClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#F1F0EC', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* name */}
          <div>
            <div style={sectionLabel}>Name</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isOwner}
                style={{ flex: 1, padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 9, fontSize: 14, outline: 'none', color: 'var(--ink)', background: isOwner ? 'var(--canvas)' : '#F4F3EF' }}
              />
              {isOwner && (
                <button onClick={saveName} style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 9, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--ink)' }}>
                  Save
                </button>
              )}
            </div>
          </div>

          {/* invite */}
          <div>
            <div style={sectionLabel}>Invite by email</div>
            <form onSubmit={invite} style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                style={{ flex: 1, padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 9, fontSize: 14, outline: 'none', color: 'var(--ink)', background: 'var(--canvas)' }}
              />
              <button type="submit" disabled={busy} style={{ border: 'none', background: 'var(--accent)', color: '#fff', borderRadius: 9, padding: '9px 15px', fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }}>
                Invite
              </button>
            </form>
            {msg && <div style={{ fontSize: 12.5, color: '#1F7A4D', marginTop: 8 }}>{msg}</div>}
            {error && <div style={{ fontSize: 12.5, color: '#E5594D', marginTop: 8 }}>{error}</div>}
          </div>

          {/* members */}
          <div>
            <div style={sectionLabel}>Members ({members.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {members.map((m) => (
                <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderTop: '1px solid var(--line)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#7C5CFF,#E5594D)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flex: 'none' }}>
                    {(m.fullName.trim()[0] || '?').toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.fullName}
                      {m.userId === user?.id && <span style={{ color: 'var(--muted)', fontWeight: 500 }}> (you)</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: m.role === 'owner' ? 'var(--accent)' : 'var(--muted)', textTransform: 'capitalize' }}>{m.role}</span>
                  {isOwner && m.role !== 'owner' && (
                    <button onClick={async () => { await removeMember(ws.id, m.userId); refresh(); s.refreshMembers(); }} title="Remove" style={{ border: 'none', background: 'transparent', color: '#E5594D', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '2px 6px' }}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* pending invites */}
          {invites.length > 0 && (
            <div>
              <div style={sectionLabel}>Pending invites ({invites.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {invites.map((i) => (
                  <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderTop: '1px solid var(--line)' }}>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.email}</div>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>pending</span>
                    <button onClick={async () => { await revokeInvite(i.id); refresh(); }} style={{ border: 'none', background: 'transparent', color: '#E5594D', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '2px 6px' }}>
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* danger zone */}
          {isOwner && s.workspaces.length > 1 && (
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <button
                onClick={async () => {
                  if (confirm(`Delete workspace “${ws.name}” and all its videos? This can't be undone.`)) {
                    const fallback = s.workspaces.find((w) => w.id !== ws.id);
                    await deleteWorkspace(ws.id);
                    await s.refreshWorkspaces();
                    if (fallback) s.switchWorkspace(fallback.id);
                    onClose();
                  }
                }}
                style={{ border: '1px solid #F0D4D0', background: 'var(--surface)', color: '#E5594D', borderRadius: 9, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Delete this workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
