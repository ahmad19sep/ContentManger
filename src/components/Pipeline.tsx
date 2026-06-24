import { PLAT, PLATFORM_IDS, STAGES } from '../constants';
import { videoMeta } from '../display';
import { useStore } from '../store';
import type { PlatformId, Stage, Video } from '../types';
import { Avatar, Dot, Hover } from './ui';

function filterBtn(active: boolean): React.CSSProperties {
  return active
    ? {
        border: '1px solid var(--ink)',
        background: 'var(--ink)',
        color: '#fff',
        padding: '5px 11px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
      }
    : {
        border: '1px solid var(--line)',
        background: 'var(--surface)',
        color: '#54545c',
        padding: '5px 11px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
      };
}

function Card({ video, stage }: { video: Video; stage: Stage }) {
  const s = useStore();
  const m = videoMeta(video);
  const assignee = video.assigneeId
    ? s.members.find((mem) => mem.userId === video.assigneeId)
    : null;
  return (
    <Hover
      as="article"
      draggable
      onDragStart={(e: React.DragEvent) => {
        s.setDragId(video.id);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => {
        s.setDragId(null);
        s.setDragOverStage(null);
      }}
      onClick={() => s.setSelectedId(video.id)}
      baseStyle={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 11,
        padding: 12,
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(20,20,30,0.03)',
        opacity: s.dragId === video.id ? 0.5 : 1,
      }}
      hoverStyle={{
        borderColor: '#D9D6CF',
        boxShadow: '0 4px 14px rgba(20,20,30,0.07)',
        transform: 'translateY(-1px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        {video.kind === 'post' ? (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'var(--accent)', borderRadius: 4, padding: '2px 6px', letterSpacing: '0.04em' }}>
            NEWS POST
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#54545c' }}>
            <Dot color={m.platformColor} size={7} />
            {m.platformLabel}
          </span>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 600, color: '#8A8A92' }}>
          <Dot color={m.priorityColor} size={7} />
          {m.priorityLabel}
        </span>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, color: 'var(--ink)', marginBottom: 11, textWrap: 'pretty' }}>
        {video.title}
      </div>
      <div style={{ height: 5, background: '#F1F0EC', borderRadius: 5, overflow: 'hidden', marginBottom: 9 }}>
        <div style={{ width: `${m.progress}%`, height: '100%', background: stage.color, borderRadius: 5 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', color: m.dueColor }}>{m.dueLabel}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {assignee && <Avatar name={assignee.fullName} size={18} />}
          {m.hasDrive && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9A9AA2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
              <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
            </svg>
          )}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#B4B2AB' }}>{m.progress}%</span>
        </span>
      </div>
    </Hover>
  );
}

export function Pipeline() {
  const s = useStore();
  const q = s.search.trim().toLowerCase();
  const filtered = s.videos.filter(
    (v) =>
      (s.platformFilter === 'all' || v.platform === s.platformFilter) &&
      (q === '' || v.title.toLowerCase().includes(q)),
  );

  const filterIds: ('all' | PlatformId)[] = ['all', ...PLATFORM_IDS];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          padding: '12px 20px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--surface)',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginRight: 2 }}>Filter</span>
        {filterIds.map((id) => (
          <button key={id} onClick={() => s.setPlatformFilter(id)} style={filterBtn(s.platformFilter === id)}>
            {id === 'all' ? 'All' : PLAT[id].label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          {filtered.length} videos
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: '18px 20px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', width: 'max-content', minHeight: '100%' }}>
          {STAGES.map((st) => {
            const cards = filtered.filter((v) => v.stage === st.id);
            const over = s.dragOverStage === st.id;
            return (
              <div key={st.id} style={{ width: 266, flex: 'none', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 6px 10px' }}>
                  <Dot color={st.color} size={10} square={3} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{st.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: 'var(--muted)', background: '#F1F0EC', borderRadius: 20, padding: '1px 7px' }}>
                    {cards.length}
                  </span>
                  <Hover
                    as="button"
                    onClick={() => s.openModal(st.id)}
                    title="Add to this stage"
                    baseStyle={{
                      marginLeft: 'auto',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--muted)',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                    hoverStyle={{ background: '#EDEBE6', color: 'var(--ink)' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </Hover>
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => s.setDragOverStage(st.id)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (s.dragId) s.setStage(s.dragId, st.id);
                    s.setDragId(null);
                    s.setDragOverStage(null);
                  }}
                  style={{
                    flex: 1,
                    minHeight: 90,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 9,
                    padding: 5,
                    borderRadius: 11,
                    transition: 'background .12s, outline-color .12s',
                    ...(over
                      ? {
                          background: `color-mix(in srgb, ${st.color} 10%, #fff)`,
                          outline: `2px dashed ${st.color}`,
                          outlineOffset: -2,
                        }
                      : {}),
                  }}
                >
                  {cards.map((v) => (
                    <Card key={v.id} video={v} stage={st} />
                  ))}
                  <Hover
                    as="button"
                    onClick={() => s.openModal(st.id)}
                    baseStyle={{
                      width: '100%',
                      border: '1px dashed #DEDBD4',
                      background: 'transparent',
                      borderRadius: 10,
                      padding: 9,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: '#A6A49D',
                      cursor: 'pointer',
                    }}
                    hoverStyle={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                  >
                    + Add card
                  </Hover>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
