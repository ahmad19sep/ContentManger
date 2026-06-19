import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { WorkspaceModal } from './WorkspaceModal';
import { Hover } from './ui';

export function WorkspaceBar() {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  if (!s.cloud) return null;

  const current = s.currentWorkspace;

  return (
    <div ref={ref} style={{ position: 'relative', padding: '0 0 10px' }}>
      <Hover
        as="button"
        onClick={() => setOpen((o) => !o)}
        baseStyle={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          border: '1px solid var(--line)',
          background: 'var(--canvas)',
          padding: '8px 10px',
          borderRadius: 9,
          cursor: 'pointer',
          textAlign: 'left',
        }}
        hoverStyle={{ background: '#F4F3EF' }}
      >
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flex: 'none' }}>
          {(current?.name.trim()[0] || 'W').toUpperCase()}
        </div>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {current?.name ?? 'Workspace'}
        </span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </Hover>

      {open && (
        <div style={{ position: 'absolute', top: 44, left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 11, boxShadow: '0 14px 40px rgba(0,0,0,0.14)', padding: 6, zIndex: 30, animation: 'fadeUp .14s ease' }}>
          {s.workspaces.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                s.switchWorkspace(w.id);
                setOpen(false);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', border: 'none', background: w.id === s.currentWorkspaceId ? '#F1F0EC' : 'transparent', padding: '8px 9px', borderRadius: 7, cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}
            >
              <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</span>
              {w.role === 'owner' && <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>owner</span>}
            </button>
          ))}
          <div style={{ height: 1, background: 'var(--line)', margin: '6px 4px' }} />
          <button
            onClick={() => {
              const name = prompt('New workspace name');
              if (name && name.trim()) s.createWorkspace(name.trim());
              setOpen(false);
            }}
            style={menuItem}
          >
            + New workspace
          </button>
          <button
            onClick={() => {
              setModal(true);
              setOpen(false);
            }}
            style={menuItem}
          >
            Members & invites…
          </button>
        </div>
      )}

      {modal && <WorkspaceModal onClose={() => setModal(false)} />}
    </div>
  );
}

const menuItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  border: 'none',
  background: 'transparent',
  padding: '8px 9px',
  borderRadius: 7,
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--accent)',
};
