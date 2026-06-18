import { MONTHS, STAGES } from '../constants';
import { TODAY, ymd } from '../dates';
import { stageObj } from '../display';
import { useStore } from '../store';
import { Dot } from './ui';

const navBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  borderRadius: 8,
  color: 'var(--muted)',
  cursor: 'pointer',
};

export function Calendar() {
  const s = useStore();
  const all = s.videos;
  const monday = s.settings.weekStartsMonday;

  const first = new Date(s.calYear, s.calMonth, 1);
  const startWd = first.getDay();
  const offset = monday ? (startWd + 6) % 7 : startWd;
  const gridStart = new Date(s.calYear, s.calMonth, 1 - offset);
  const todayStr = ymd(TODAY);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const ds = ymd(d);
    const inMonth = d.getMonth() === s.calMonth;
    const isToday = ds === todayStr;
    const vids = all.filter((v) => v.publish === ds);
    days.push({ date: d, ds, inMonth, isToday, vids });
  }

  const weekdays = monday
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ padding: '20px 24px 40px', maxWidth: 1120, margin: '0 auto', animation: 'fadeUp .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em', minWidth: 160 }}>
          {MONTHS[s.calMonth]} {s.calYear}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={s.gotoPrevMonth} style={navBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button onClick={s.gotoNextMonth} style={navBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
        <button
          onClick={s.gotoToday}
          style={{ padding: '7px 13px', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}
        >
          Today
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
          {STAGES.map((st) => (
            <span key={st.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--muted)' }}>
              <Dot color={st.color} size={9} square={3} />
              {st.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginBottom: 8 }}>
        {weekdays.map((w) => (
          <div key={w} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', paddingLeft: 4 }}>
            {w}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: 116, gap: 8 }}>
        {days.map((d, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              padding: 7,
              border: '1px solid var(--line)',
              borderRadius: 10,
              overflow: 'hidden',
              background: d.inMonth ? 'var(--surface)' : '#FAFAF7',
              ...(d.isToday ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent) inset' } : {}),
            }}
          >
            <div
              style={
                d.isToday
                  ? { fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: '#fff', background: 'var(--accent)', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }
                  : { fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, fontWeight: 600, color: d.inMonth ? '#46464d' : '#C2C0B9' }
              }
            >
              {d.date.getDate()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
              {d.vids.map((v) => {
                const st = stageObj(v.stage);
                return (
                  <button
                    key={v.id}
                    onClick={() => s.setSelectedId(v.id)}
                    style={{
                      textAlign: 'left',
                      border: 'none',
                      borderLeft: `3px solid ${st.color}`,
                      background: `color-mix(in srgb, ${st.color} 12%, #fff)`,
                      color: '#3a3a40',
                      fontSize: 10.5,
                      fontWeight: 600,
                      padding: '3px 6px',
                      borderRadius: 5,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                    }}
                  >
                    {v.title}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
