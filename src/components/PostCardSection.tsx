import { useState } from 'react';
import { useStore } from '../store';
import type { Video } from '../types';

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 9,
};

const PLATFORM_FIELDS: { key: keyof Video; name: string }[] = [
  { key: 'headline', name: 'Headline' },
  { key: 'article', name: 'Article' },
  { key: 'xPost', name: 'X' },
  { key: 'linkedinPost', name: 'LinkedIn' },
  { key: 'facebookPost', name: 'Facebook' },
  { key: 'instagramCaption', name: 'Instagram' },
  { key: 'whatsappPost', name: 'WhatsApp' },
  { key: 'youtubeShortScript', name: 'YouTube Short' },
  { key: 'imagePrompt', name: 'Image prompt' },
  { key: 'factCheckNotes', name: 'Fact-check notes' },
];

export function PostCardSection({ v, isOwner }: { v: Video; isOwner: boolean }) {
  const s = useStore();
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const parsed = !!(v.headline || v.article || v.xPost);

  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--accent) 6%, #fff)',
        border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--line))',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#fff', background: 'var(--accent)', borderRadius: 5, padding: '2px 7px', letterSpacing: '0.04em' }}>
          NEWS POST
        </span>
        {v.newsSource && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{v.newsSource}</span>}
        {v.riskLevel && (
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: v.riskLevel === 'high' ? '#E5594D' : v.riskLevel === 'medium' ? '#D9941F' : '#1F9D57' }}>
            risk: {v.riskLevel}
          </span>
        )}
      </div>

      {v.sourceUrl && (
        <a href={v.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, wordBreak: 'break-all' }}>
          Open source article →
        </a>
      )}

      {/* Step 1: master prompt */}
      {v.masterPrompt && (
        <div style={{ marginTop: 14 }}>
          <div style={label}>1 · Master prompt</div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(v.masterPrompt || '');
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            style={{ border: 'none', background: 'var(--accent)', color: '#fff', borderRadius: 9, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            {copied ? 'Copied ✓' : 'Copy master prompt'}
          </button>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>
            Run it in your AI, then paste the full output below.
          </div>
        </div>
      )}

      {/* Step 2: paste output */}
      <div style={{ marginTop: 16 }}>
        <div style={label}>2 · Paste AI output</div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste the full [[MARKER]] output here…"
          style={{ width: '100%', minHeight: 96, resize: 'vertical', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', fontSize: 13, lineHeight: 1.5, color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
        />
        <button
          onClick={() => {
            if (!draft.trim()) return;
            s.submitPostOutput(v.id, draft);
            setDraft('');
          }}
          disabled={!draft.trim()}
          style={{ marginTop: 8, border: 'none', background: draft.trim() ? 'var(--accent)' : '#D9D6CF', color: '#fff', borderRadius: 9, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: draft.trim() ? 'pointer' : 'not-allowed' }}
        >
          Submit for review
        </button>
      </div>

      {/* Step 3: parsed preview + approve */}
      {parsed && (
        <div style={{ marginTop: 18 }}>
          <div style={label}>3 · Parsed output</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PLATFORM_FIELDS.map(({ key, name }) => {
              const text = v[key] as string | undefined;
              if (!text) return null;
              return (
                <details key={key} style={{ border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)' }}>
                  <summary style={{ cursor: 'pointer', padding: '8px 11px', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{name}</span>
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard?.writeText(text);
                      }}
                      style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}
                    >
                      Copy
                    </span>
                  </summary>
                  <div style={{ padding: '0 11px 11px', fontSize: 12.5, color: '#444', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{text}</div>
                </details>
              );
            })}
          </div>

          {isOwner && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              {v.approved ? (
                <>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1F9D57' }}>✓ Approved — sent to AI Radar</span>
                  <button onClick={() => s.approvePost(v.id, false)} style={{ border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 8, padding: '6px 11px', fontSize: 12, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer' }}>
                    Unapprove
                  </button>
                </>
              ) : (
                <button onClick={() => s.approvePost(v.id, true)} style={{ border: 'none', background: '#1F9D57', color: '#fff', borderRadius: 9, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Approve &amp; send to AI Radar
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
