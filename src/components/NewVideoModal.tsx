import { PLAT, PLATFORM_IDS, PRIO, STAGES } from '../constants';
import { useStore } from '../store';
import type { PriorityId } from '../types';
import { Dot } from './ui';

function chip(active: boolean): React.CSSProperties {
  return active
    ? {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: '1.5px solid var(--accent)',
        background: 'color-mix(in srgb, var(--accent) 9%, #fff)',
        color: 'var(--accent)',
        padding: '6.5px 10.5px',
        borderRadius: 9,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: 'pointer',
      }
    : {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: '1px solid var(--line)',
        background: 'var(--surface)',
        color: '#54545c',
        padding: '7px 11px',
        borderRadius: 9,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: 'pointer',
      };
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--muted)',
  marginBottom: 7,
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--line)',
  borderRadius: 9,
  fontSize: 14,
  outline: 'none',
  color: 'var(--ink)',
  background: 'var(--canvas)',
};

export function NewVideoModal() {
  const s = useStore();
  if (!s.modalOpen) return null;
  const f = s.form;
  const canSave = f.title.trim().length > 0;
  const priorities: PriorityId[] = ['high', 'med', 'low'];

  return (
    <div
      onClick={s.closeModal}
      style={{ position: 'absolute', inset: 0, background: 'rgba(20,20,28,0.34)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'overlayIn .16s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 440, maxWidth: '100%', background: 'var(--surface)', borderRadius: 16, boxShadow: '0 24px 70px rgba(0,0,0,0.22)', overflow: 'hidden', animation: 'modalIn .2s cubic-bezier(.2,.7,.2,1)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>New video</div>
          <button onClick={s.closeModal} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#F1F0EC', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={label}>Title</label>
            <input
              autoFocus
              value={f.title}
              onChange={(e) => s.setForm({ title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSave) s.saveVideo();
              }}
              placeholder="e.g. How I edit a video in 20 minutes"
              style={input}
            />
          </div>

          <div>
            <label style={label}>Platform</label>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {PLATFORM_IDS.map((id) => (
                <button key={id} onClick={() => s.setForm({ platform: id })} style={chip(f.platform === id)}>
                  <Dot color={PLAT[id].color} size={7} />
                  {PLAT[id].label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>Priority</label>
              <div style={{ display: 'flex', gap: 7 }}>
                {priorities.map((id) => (
                  <button key={id} onClick={() => s.setForm({ priority: id })} style={chip(f.priority === id)}>
                    {PRIO[id].label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 'none', width: 150 }}>
              <label style={label}>Target date</label>
              <input
                type="date"
                value={f.due}
                onChange={(e) => s.setForm({ due: e.target.value })}
                style={{ ...input, fontSize: 13, padding: '9px 10px' }}
              />
            </div>
          </div>

          <div>
            <label style={label}>Starting stage</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STAGES.map((st) => (
                <button key={st.id} onClick={() => s.setForm({ stage: st.id })} style={chip(f.stage === st.id)}>
                  <Dot color={st.color} size={7} />
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--line)', background: 'var(--canvas)' }}>
          <button onClick={s.closeModal} style={{ padding: '9px 16px', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 9, fontSize: 13, fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={s.saveVideo}
            disabled={!canSave}
            style={{ padding: '9px 16px', border: 'none', background: canSave ? 'var(--accent)' : '#D9D6CF', color: '#fff', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: canSave ? 'pointer' : 'not-allowed' }}
          >
            Create video
          </button>
        </div>
      </div>
    </div>
  );
}
