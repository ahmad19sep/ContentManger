import { useState } from 'react';
import { useStore } from '../store';

export function ImportBanner() {
  const s = useStore();
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!s.cloud || !s.canImportLocal || dismissed) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '16px 22px 0',
        padding: '11px 14px',
        background: 'color-mix(in srgb, var(--accent) 8%, #fff)',
        border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--line))',
        borderRadius: 11,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 10l5 5 5-5" />
        <path d="M12 15V3" />
      </svg>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--ink)' }}>
        You have videos saved on this device. Import them into your account?
      </div>
      <button
        onClick={async () => {
          setBusy(true);
          await s.importLocalData();
          setBusy(false);
        }}
        disabled={busy}
        style={{ flex: 'none', border: 'none', background: 'var(--accent)', color: '#fff', padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }}
      >
        {busy ? 'Importing…' : 'Import'}
      </button>
      <button
        onClick={() => setDismissed(true)}
        title="Dismiss"
        style={{ flex: 'none', border: 'none', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}
