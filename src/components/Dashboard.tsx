import { CHECK, STAGES } from '../constants';
import { diffDays, parse } from '../dates';
import { videoMeta } from '../display';
import { useStore } from '../store';
import type { Video } from '../types';
import { Dot, Hover } from './ui';

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 14,
};

function dueStyle(color: string): React.CSSProperties {
  return { fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', color };
}

export function Dashboard() {
  const s = useStore();
  const all = s.videos;

  const inProd = all.filter((v) => ['script', 'record', 'edit', 'review'].includes(v.stage)).length;
  const dueWeek = all.filter((v) => {
    const d = diffDays(v.due);
    return d >= 0 && d <= 7;
  }).length;
  const ready = all.filter((v) => v.stage === 'publish').length;
  const ideasN = all.filter((v) => v.stage === 'idea').length;

  const stats = [
    { label: 'In production', value: inProd, sub: 'scripting through review', dot: '#7C5CFF' },
    { label: 'Due this week', value: dueWeek, sub: 'next 7 days', dot: '#D9941F' },
    { label: 'Ready to publish', value: ready, sub: 'in the final stage', dot: '#1F9D57' },
    { label: 'Idea backlog', value: ideasN, sub: 'awaiting development', dot: '#9A9AA2' },
  ];

  const upNext = [...all].sort((a, b) => parse(a.due).getTime() - parse(b.due).getTime()).slice(0, 6);

  const total = all.length || 1;
  const health = STAGES.map((st) => {
    const count = all.filter((v) => v.stage === st.id).length;
    const pct = Math.round((count / total) * 100);
    return { stage: st, count, width: Math.max(count ? 7 : 0, pct) };
  });

  const attention = all
    .filter((v) => {
      const d = diffDays(v.due);
      return d < 0 || (v.priority === 'high' && d <= 2);
    })
    .sort((a, b) => parse(a.due).getTime() - parse(b.due).getTime())
    .slice(0, 4);

  // videos whose current-stage checklist still has unchecked items
  const incompleteAll = all
    .map((v) => {
      const items = CHECK[v.stage];
      const done = items.filter((_, i) => v.checks[`${v.stage}:${i}`]).length;
      return { video: v, done, total: items.length };
    })
    .filter((x) => x.done < x.total)
    .sort((a, b) => parse(a.video.due).getTime() - parse(b.video.due).getTime());
  const incomplete = incompleteAll.slice(0, 6);

  const open = (v: Video) => () => s.setSelectedId(v.id);

  return (
    <div style={{ padding: '24px 26px 40px', maxWidth: 1200, margin: '0 auto', animation: 'fadeUp .2s ease' }}>
      {/* stat cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {stats.map((st) => (
          <div key={st.label} style={{ ...card, flex: '1 1 200px', minWidth: 170, padding: '15px 17px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Dot color={st.dot} />
              <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>{st.label}</span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 30, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 10, lineHeight: 1 }}>
              {st.value}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>{st.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 18, alignItems: 'flex-start' }}>
        {/* up next */}
        <section style={{ ...card, flex: '2 1 440px', minWidth: 300, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px 12px' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>Up next</div>
            <button onClick={() => s.setView('pipeline')} style={{ border: 'none', background: 'transparent', color: 'var(--accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
              Open pipeline →
            </button>
          </div>
          {upNext.map((v) => {
            const m = videoMeta(v);
            return (
              <Hover
                key={v.id}
                as="button"
                onClick={open(v)}
                baseStyle={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  border: 'none',
                  borderTop: '1px solid var(--line)',
                  background: 'transparent',
                  padding: '11px 18px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                hoverStyle={{ background: '#FAFAF7' }}
              >
                <Dot color={m.stageColor} size={9} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{m.stageLabel}</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#CFCDC6' }} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--muted)' }}>
                      <Dot color={m.platformColor} size={7} />
                      {m.platformLabel}
                    </span>
                  </div>
                </div>
                <span style={dueStyle(m.dueColor)}>{m.dueLabel}</span>
              </Hover>
            );
          })}
        </section>

        {/* right column */}
        <div style={{ flex: '1 1 270px', minWidth: 250, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section style={{ ...card, padding: '16px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 14 }}>Pipeline health</div>
            {health.map((h) => (
              <div key={h.stage.id} style={{ marginBottom: 11 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--ink)', fontWeight: 500 }}>
                    <Dot color={h.stage.color} size={9} square={3} />
                    {h.stage.label}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--muted)' }}>{h.count}</span>
                </div>
                <div style={{ height: 6, background: '#F1F0EC', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${h.width}%`, height: '100%', background: h.stage.color, borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </section>

          <section style={{ ...card, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: 14.5, marginBottom: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E5594D' }} />
              Needs attention
            </div>
            {attention.map((v) => {
              const m = videoMeta(v);
              return (
                <Hover
                  key={v.id}
                  as="button"
                  onClick={open(v)}
                  baseStyle={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    padding: '8px 0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderTop: '1px solid var(--line)',
                  }}
                  hoverStyle={{ opacity: 0.7 }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{m.stageLabel}</div>
                  </div>
                  <span style={dueStyle(m.dueColor)}>{m.dueLabel}</span>
                </Hover>
              );
            })}
            {attention.length === 0 && (
              <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '4px 0' }}>All clear — nothing overdue. 🎉</div>
            )}
          </section>
        </div>
      </div>

      {/* incomplete checklists */}
      <section style={{ ...card, marginTop: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>Incomplete checklists</div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: 'var(--muted)', background: '#F1F0EC', borderRadius: 20, padding: '1px 8px' }}>
              {incompleteAll.length}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>unchecked tasks in the current stage</div>
        </div>
        {incomplete.map(({ video: v, done, total }) => {
          const m = videoMeta(v);
          const pct = Math.round((done / total) * 100);
          return (
            <Hover
              key={v.id}
              as="button"
              onClick={open(v)}
              baseStyle={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                border: 'none',
                borderTop: '1px solid var(--line)',
                background: 'transparent',
                padding: '11px 18px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              hoverStyle={{ background: '#FAFAF7' }}
            >
              <Dot color={m.stageColor} size={9} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {v.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{m.stageLabel}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#CFCDC6' }} />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--muted)' }}>
                    <Dot color={m.platformColor} size={7} />
                    {m.platformLabel}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
                <div style={{ width: 70, height: 6, background: '#F1F0EC', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: m.stageColor, borderRadius: 6 }} />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', minWidth: 34, textAlign: 'right' }}>
                  {done}/{total}
                </span>
              </div>
            </Hover>
          );
        })}
        {incompleteAll.length === 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '4px 18px 16px', borderTop: '1px solid var(--line)' }}>
            Every checklist is complete. 🎉
          </div>
        )}
        {incompleteAll.length > incomplete.length && (
          <button
            onClick={() => s.setView('pipeline')}
            style={{ width: '100%', border: 'none', borderTop: '1px solid var(--line)', background: 'transparent', padding: '10px 18px', fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer', textAlign: 'left' }}
          >
            +{incompleteAll.length - incomplete.length} more in the pipeline →
          </button>
        )}
      </section>
    </div>
  );
}
