import { PLAT, PLATFORM_IDS } from '../constants';
import { useStore } from '../store';
import type { ViewId } from '../types';
import { Dot, Hover } from './ui';
import { WorkspaceBar } from './WorkspaceBar';

const navBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  border: 'none',
  background: 'transparent',
  padding: '8px 9px',
  borderRadius: 8,
  fontSize: 13.5,
  fontWeight: 500,
  color: '#46464d',
  cursor: 'pointer',
  textAlign: 'left',
};

const navActive: React.CSSProperties = {
  ...navBase,
  background: 'color-mix(in srgb, var(--accent) 13%, #fff)',
  color: 'var(--accent)',
  fontWeight: 600,
};

const hover = { background: '#F4F3EF' };

const count: React.CSSProperties = {
  marginLeft: 'auto',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  color: 'var(--muted)',
};

function DashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

function PipeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="11" rx="1.5" />
      <rect x="16" y="4" width="5" height="14" rx="1.5" />
    </svg>
  );
}

function CalIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </svg>
  );
}

function IdeaIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 21.5h4" />
      <path d="M12 2.5a6.5 6.5 0 0 0-4 11.6c.8.7 1 1.4 1 2.4h6c0-1 .2-1.7 1-2.4A6.5 6.5 0 0 0 12 2.5z" />
    </svg>
  );
}

export function Sidebar() {
  const s = useStore();

  const go = (v: ViewId) => () => s.setView(v);
  const navStyle = (v: ViewId) => (s.view === v ? navActive : navBase);

  const nPipeline = s.videos.length;
  const nCalendar = s.videos.filter((v) => v.publish).length;
  const nIdeas = s.videos.filter((v) => v.stage === 'idea').length;

  return (
    <aside
      style={{
        width: 250,
        flex: 'none',
        borderRight: '1px solid var(--line)',
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 13px',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 16px' }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          V
        </div>
        <div style={{ fontWeight: 700, fontSize: 15.5, letterSpacing: '-0.02em' }}>VideoFlow</div>
        <Hover
          as="button"
          onClick={s.toggleSidebar}
          title="Collapse sidebar"
          baseStyle={{
            marginLeft: 'auto',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            color: 'var(--muted)',
            borderRadius: 7,
            cursor: 'pointer',
          }}
          hoverStyle={{ background: '#EDEBE6', color: 'var(--ink)' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
            <path d="m15 9-2 3 2 3" />
          </svg>
        </Hover>
      </div>

      <WorkspaceBar />

      <Hover as="button" baseStyle={navStyle('dashboard')} hoverStyle={hover} onClick={go('dashboard')}>
        <DashIcon />
        <span>Dashboard</span>
      </Hover>
      <Hover as="button" baseStyle={navStyle('pipeline')} hoverStyle={hover} onClick={go('pipeline')}>
        <PipeIcon />
        <span>Pipeline</span>
        <span style={count}>{nPipeline}</span>
      </Hover>
      <Hover as="button" baseStyle={navStyle('calendar')} hoverStyle={hover} onClick={go('calendar')}>
        <CalIcon />
        <span>Calendar</span>
        <span style={count}>{nCalendar}</span>
      </Hover>
      <Hover as="button" baseStyle={navStyle('ideas')} hoverStyle={hover} onClick={go('ideas')}>
        <IdeaIcon />
        <span>Ideas</span>
        <span style={count}>{nIdeas}</span>
      </Hover>

      <div style={{ height: 1, background: 'var(--line)', margin: '14px 6px 10px' }} />
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          padding: '2px 8px 8px',
        }}
      >
        Platforms
      </div>

      {PLATFORM_IDS.map((id) => {
        const p = PLAT[id];
        const c = s.videos.filter((v) => v.platform === id).length;
        const active = s.platformFilter === id;
        return (
          <Hover
            key={id}
            as="button"
            baseStyle={active ? navActive : navBase}
            hoverStyle={hover}
            onClick={() => {
              s.setPlatformFilter(s.platformFilter === id ? 'all' : id);
              s.setView('pipeline');
            }}
          >
            <Dot color={p.color} size={9} square={3} />
            <span>{p.label}</span>
            <span style={count}>{c}</span>
          </Hover>
        );
      })}

      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 8px 2px',
          borderTop: '1px solid var(--line)',
          paddingTop: 16,
        }}
      >
        <div
          style={{
            width: 33,
            height: 33,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#7C5CFF,#E5594D)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
            flex: 'none',
          }}
        >
          {(s.settings.userName.trim()[0] || 'A').toUpperCase()}
        </div>
        <div style={{ lineHeight: 1.25, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {s.settings.userName || 'Unnamed'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {s.settings.userRole}
          </div>
        </div>
      </div>
    </aside>
  );
}
