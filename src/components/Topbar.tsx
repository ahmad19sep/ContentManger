import { useEffect, useRef, useState } from 'react';
import { ACCENT_OPTIONS } from '../constants';
import { useStore } from '../store';
import type { ViewId } from '../types';
import { Hover } from './ui';

const TITLES: Record<ViewId, [string, string]> = {
  dashboard: ['Dashboard', "Here's where your content stands today"],
  pipeline: ['Pipeline', 'Drag cards across stages to update status'],
  calendar: ['Calendar', 'Scheduled publish dates across platforms'],
  ideas: ['Ideas', 'Capture and develop new concepts'],
};

function seg(active: boolean): React.CSSProperties {
  return {
    border: 'none',
    background: active ? '#fff' : 'transparent',
    color: active ? 'var(--ink)' : '#6E6E78',
    boxShadow: active ? '0 1px 2px rgba(0,0,0,.1)' : 'none',
    padding: '5px 11px',
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

function SettingsMenu() {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 'none' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Settings"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          border: '1px solid var(--line)',
          background: 'var(--surface)',
          borderRadius: 9,
          color: 'var(--muted)',
          cursor: 'pointer',
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 44,
            right: 0,
            width: 230,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            boxShadow: '0 14px 40px rgba(0,0,0,0.14)',
            padding: 14,
            zIndex: 60,
            animation: 'fadeUp .14s ease',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 9 }}>
            Accent
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {ACCENT_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => s.setAccent(c)}
                title={c}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: c,
                  cursor: 'pointer',
                  border: s.settings.accentColor === c ? '2px solid var(--ink)' : '2px solid transparent',
                  boxShadow: s.settings.accentColor === c ? '0 0 0 2px #fff inset' : 'none',
                }}
              />
            ))}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            <span>Week starts Monday</span>
            <input type="checkbox" checked={s.settings.weekStartsMonday} onChange={s.toggleWeekStart} style={{ cursor: 'pointer' }} />
          </label>

          <button
            onClick={() => {
              if (confirm('Reset all videos to the sample data? This clears your changes.')) {
                s.resetData();
                setOpen(false);
              }
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--line)',
              background: 'var(--canvas)',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              color: '#E5594D',
              cursor: 'pointer',
            }}
          >
            Reset sample data
          </button>
        </div>
      )}
    </div>
  );
}

export function Topbar() {
  const s = useStore();
  const isMobile = s.device === 'mobile';
  const [title, sub] = TITLES[s.view];

  return (
    <header
      style={{
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        padding: '14px 22px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--surface)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>
      </div>

      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg style={{ position: 'absolute', left: 10, pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9A9AA2" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <input
              value={s.search}
              onChange={(e) => s.setSearch(e.target.value)}
              placeholder="Search videos"
              style={{
                width: 190,
                padding: '8px 10px 8px 31px',
                border: '1px solid var(--line)',
                borderRadius: 9,
                fontSize: 13,
                background: 'var(--canvas)',
                outline: 'none',
                color: 'var(--ink)',
              }}
            />
          </div>
          <div style={{ display: 'flex', background: '#F1F0EC', borderRadius: 9, padding: 3 }}>
            <button onClick={() => s.setDevice('desktop')} style={seg(s.device === 'desktop')}>Desktop</button>
            <button onClick={() => s.setDevice('mobile')} style={seg(s.device === 'mobile')}>Mobile</button>
          </div>
          <SettingsMenu />
          <Hover
            as="button"
            onClick={() => s.openModal('idea')}
            baseStyle={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              padding: '9px 14px',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            hoverStyle={{ filter: 'brightness(1.07)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            New video
          </Hover>
        </div>
      )}

      {isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
          <button
            onClick={() => s.setDevice('desktop')}
            title="Exit mobile preview"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              borderRadius: 9,
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="13" rx="2" />
              <path d="M8 21h8" />
              <path d="M12 17v4" />
            </svg>
          </button>
          <button
            onClick={() => s.openModal('idea')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 9,
              cursor: 'pointer',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
      )}
    </header>
  );
}
