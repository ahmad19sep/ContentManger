import { useAuth } from '../auth';
import { parse } from '../dates';
import { videoMeta } from '../display';
import { useStore } from '../store';
import type { Video } from '../types';
import { Dot, Hover } from './ui';

export function MyTasks() {
  const s = useStore();
  const { user } = useAuth();

  const mine = s.videos
    .filter((v) => v.assigneeId && v.assigneeId === user?.id)
    .sort((a, b) => parse(a.due).getTime() - parse(b.due).getTime());

  const open = (v: Video) => () => s.setSelectedId(v.id);

  return (
    <div style={{ padding: '24px 26px 40px', maxWidth: 820, margin: '0 auto', animation: 'fadeUp .2s ease' }}>
      <section style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>Assigned to you</div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: 'var(--muted)', background: '#F1F0EC', borderRadius: 20, padding: '1px 8px' }}>
            {mine.length}
          </span>
        </div>

        {mine.map((v) => {
          const meta = videoMeta(v);
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
                padding: '12px 18px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              hoverStyle={{ background: '#FAFAF7' }}
            >
              <Dot color={meta.stageColor} size={9} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {v.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{meta.stageLabel}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#CFCDC6' }} />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--muted)' }}>
                    <Dot color={meta.platformColor} size={7} />
                    {meta.platformLabel}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', color: meta.dueColor }}>{meta.dueLabel}</span>
            </Hover>
          );
        })}

        {mine.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--muted)', padding: '14px 18px 18px', borderTop: '1px solid var(--line)' }}>
            Nothing assigned to you yet. Open a video and pick yourself as the assignee.
          </div>
        )}
      </section>
    </div>
  );
}
