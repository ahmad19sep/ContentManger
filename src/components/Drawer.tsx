import { CHECK, STAGES } from '../constants';
import { stageIndex, stageObj, videoMeta } from '../display';
import { useStore } from '../store';
import { Dot, Hover } from './ui';

export function Drawer() {
  const s = useStore();
  if (!s.selectedId) return null;
  const v = s.videos.find((x) => x.id === s.selectedId);
  if (!v) return null;

  const m = videoMeta(v);
  const idx = stageIndex(v.stage);
  const st = stageObj(v.stage);
  const checklist = CHECK[v.stage];
  const nextLabel = idx < STAGES.length - 1 ? 'Move to ' + STAGES[idx + 1].label + ' →' : 'Published ✓';
  const driveUrl = v.drive && v.drive.trim() ? v.drive.trim() : '';

  return (
    <>
      <div
        onClick={() => s.setSelectedId(null)}
        style={{ position: 'absolute', inset: 0, background: 'rgba(20,20,28,0.30)', zIndex: 40, animation: 'overlayIn .16s ease' }}
      />
      <aside
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          width: 430,
          maxWidth: '100%',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--line)',
          boxShadow: '-18px 0 44px rgba(0,0,0,0.10)',
          zIndex: 41,
          display: 'flex',
          flexDirection: 'column',
          animation: 'drawerIn .2s cubic-bezier(.2,.7,.2,1)',
        }}
      >
        <div style={{ flex: 'none', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '18px 20px 14px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#54545c' }}>
              <Dot color={m.platformColor} size={7} />
              {m.platformLabel} · {m.format}
            </span>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.25, marginTop: 8, letterSpacing: '-0.01em', textWrap: 'pretty' }}>{v.title}</div>
          </div>
          <Hover
            as="button"
            onClick={() => s.setSelectedId(null)}
            baseStyle={{ flex: 'none', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#F1F0EC', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer' }}
            hoverStyle={{ background: '#E5E3DD', color: 'var(--ink)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Hover>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px 24px' }}>
          <SectionLabel>Workflow stage</SectionLabel>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {STAGES.map((stg, i) => (
              <div key={stg.id} style={{ flex: 1, height: 6, borderRadius: 4, background: i <= idx ? stg.color : '#ECEAE6' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            {STAGES.map((stg, i) => (
              <div
                key={stg.id}
                style={{ flex: 1, textAlign: 'center', fontSize: 9.5, fontWeight: i === idx ? 700 : 600, color: i === idx ? stg.color : i < idx ? '#9A9AA2' : '#C7C7CD' }}
              >
                {stg.short}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <button
              onClick={() => s.moveStage(v.id, -1)}
              disabled={idx === 0}
              style={{ flex: 'none', padding: '9px 13px', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 9, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}
            >
              ← Back
            </button>
            <button
              onClick={() => s.moveStage(v.id, 1)}
              disabled={idx >= STAGES.length - 1}
              style={{ flex: 1, padding: '9px 13px', border: 'none', borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: '#fff', cursor: idx >= STAGES.length - 1 ? 'not-allowed' : 'pointer', background: st.color, opacity: idx >= STAGES.length - 1 ? 0.55 : 1 }}
            >
              {nextLabel}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px', padding: 16, background: 'var(--canvas)', border: '1px solid var(--line)', borderRadius: 12, marginBottom: 18 }}>
            <Field label="Priority">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                <Dot color={m.priorityColor} size={7} />
                {m.priorityLabel}
              </span>
            </Field>
            <Field label="Format">
              <span style={{ fontSize: 13, fontWeight: 600 }}>{m.format}</span>
            </Field>
            <Field label="Next deadline">
              <span style={{ fontSize: 13, fontWeight: 600, color: m.dueColor }}>{m.dueLabel}</span>
            </Field>
            <Field label="Posting date">
              <input
                type="date"
                value={v.publish || ''}
                onChange={(e) => s.updatePublish(v.id, e.target.value)}
                style={{ width: '100%', fontSize: 13, fontWeight: 600, color: 'var(--ink)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '6px 8px', outline: 'none', fontFamily: 'inherit' }}
              />
              {v.publish && (
                <button
                  onClick={() => s.updatePublish(v.id, '')}
                  style={{ marginTop: 5, border: 'none', background: 'transparent', color: 'var(--muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Clear
                </button>
              )}
            </Field>
          </div>

          <SectionLabel>Files</SectionLabel>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 10, padding: '0 10px', background: 'var(--canvas)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9A9AA2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
              </svg>
              <input
                value={v.drive || ''}
                onChange={(e) => s.updateDrive(v.id, e.target.value)}
                placeholder="Paste a Drive / Dropbox link…"
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--ink)', padding: '10px 0' }}
              />
            </div>
            <button
              onClick={() => {
                if (driveUrl) {
                  const url = /^https?:\/\//i.test(driveUrl) ? driveUrl : 'https://' + driveUrl;
                  window.open(url, '_blank');
                }
              }}
              disabled={!driveUrl}
              style={{ flex: 'none', padding: '9px 14px', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 10, fontSize: 12.5, fontWeight: 600, color: driveUrl ? 'var(--accent)' : '#C2C0B9', cursor: driveUrl ? 'pointer' : 'not-allowed' }}
            >
              Open
            </button>
          </div>

          <SectionLabel>{m.stageLabel} checklist</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 20 }}>
            {checklist.map((label, i) => {
              const key = v.stage + ':' + i;
              const done = !!v.checks[key];
              return (
                <Hover
                  key={key}
                  as="button"
                  onClick={() => s.toggleCheck(v.id, key)}
                  baseStyle={{ display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'transparent', padding: '7px 4px', cursor: 'pointer', textAlign: 'left', borderRadius: 7 }}
                  hoverStyle={{ background: '#FAFAF7' }}
                >
                  <span
                    style={
                      done
                        ? { width: 18, height: 18, borderRadius: 5, background: 'var(--accent)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }
                        : { width: 18, height: 18, borderRadius: 5, background: '#fff', border: '1.5px solid #D4D2CB', flex: 'none', display: 'inline-block' }
                    }
                  >
                    {done && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span style={{ fontSize: 13, color: done ? '#9A9AA2' : 'var(--ink)', textDecoration: done ? 'line-through' : 'none' }}>{label}</span>
                </Hover>
              );
            })}
          </div>

          <SectionLabel>Notes</SectionLabel>
          <textarea
            value={v.note}
            onChange={(e) => s.updateNote(v.id, e.target.value)}
            placeholder="Add production notes…"
            style={{ width: '100%', minHeight: 84, resize: 'vertical', border: '1px solid var(--line)', borderRadius: 10, padding: '11px 12px', fontSize: 13, lineHeight: 1.5, color: 'var(--ink)', background: 'var(--canvas)', outline: 'none' }}
          />

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <Hover
              as="button"
              onClick={() => {
                if (confirm(`Delete “${v.title}”? This can't be undone.`)) s.deleteVideo(v.id);
              }}
              baseStyle={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid #F0D4D0',
                background: 'var(--surface)',
                color: '#E5594D',
                padding: '9px 14px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              hoverStyle={{ background: '#FDF3F2', borderColor: '#E5594D' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
              Delete video
            </Hover>
          </div>
        </div>
      </aside>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 9 }}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}
