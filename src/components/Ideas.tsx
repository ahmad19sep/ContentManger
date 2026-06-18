import { videoMeta } from '../display';
import { useStore } from '../store';
import { Dot, Hover } from './ui';

export function Ideas() {
  const s = useStore();
  const ideas = s.videos.filter((v) => v.stage === 'idea');

  return (
    <div style={{ padding: '24px 26px 40px', maxWidth: 1100, margin: '0 auto', animation: 'fadeUp .2s ease' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: '8px 8px 8px 14px',
          marginBottom: 18,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A227" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
          <path d="M9 18h6" />
          <path d="M10 21.5h4" />
          <path d="M12 2.5a6.5 6.5 0 0 0-4 11.6c.8.7 1 1.4 1 2.4h6c0-1 .2-1.7 1-2.4A6.5 6.5 0 0 0 12 2.5z" />
        </svg>
        <input
          value={s.ideaDraft}
          onChange={(e) => s.setIdeaDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') s.addIdea();
          }}
          placeholder="Capture a new idea and press Enter…"
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--ink)' }}
        />
        <button
          onClick={s.addIdea}
          style={{ border: 'none', background: 'var(--accent)', color: '#fff', padding: '8px 15px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Add idea
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(258px,1fr))', gap: 14 }}>
        {ideas.map((v) => {
          const m = videoMeta(v);
          return (
            <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 13, padding: 15, display: 'flex', flexDirection: 'column' }}>
              <button onClick={() => s.setSelectedId(v.id)} style={{ border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#54545c' }}>
                  <Dot color={m.platformColor} size={7} />
                  {m.platformLabel}
                </span>
                <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.3, color: 'var(--ink)', margin: '8px 0 6px', textWrap: 'pretty' }}>{v.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>{v.note}</div>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', color: m.dueColor }}>{m.dueLabel}</span>
                <Hover
                  as="button"
                  onClick={() => s.setStage(v.id, 'script')}
                  baseStyle={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                    padding: '6px 11px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  hoverStyle={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                >
                  Start scripting →
                </Hover>
              </div>
            </div>
          );
        })}
        {ideas.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 2px' }}>
            No ideas yet — capture one above to get started.
          </div>
        )}
      </div>
    </div>
  );
}
