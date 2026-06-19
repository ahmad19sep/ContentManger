import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogoMark, Wordmark } from './Logo';

type Mode = 'signin' | 'signup' | 'magic';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  border: '1px solid var(--line)',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  color: 'var(--ink)',
  background: 'var(--canvas)',
};

const label: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--muted)',
  marginBottom: 6,
};

const redirectTo =
  typeof window !== 'undefined' ? window.location.origin : undefined;

/** Reject if a promise doesn't settle in time, so the UI never hangs forever. */
function withTimeout<T>(p: PromiseLike<T>, ms = 15000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error('The server took too long to respond. Check your connection and try again.')),
      ms,
    );
    Promise.resolve(p).then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setNotice(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    reset();
    setBusy(true);
    try {
      if (mode === 'magic') {
        const { error } = await withTimeout(
          supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } }),
        );
        if (error) throw error;
        setNotice('Check your email (and spam) for a magic sign-in link.');
      } else if (mode === 'signup') {
        const { data, error } = await withTimeout(
          supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name.trim() || undefined }, emailRedirectTo: redirectTo },
          }),
        );
        if (error) throw error;
        if (!data.session) {
          setNotice('Account created. Check your email (and spam) to confirm, then sign in.');
          setMode('signin');
        }
        // if a session came back (email confirmation disabled), the auth
        // listener will swap to the app automatically.
      } else {
        const { error } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
        );
        if (error) throw error;
      }
    } catch (err) {
      console.error('[auth]', err);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (!supabase) return;
    reset();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  };

  const tab = (m: Mode, text: string) => (
    <button
      type="button"
      onClick={() => {
        setMode(m);
        reset();
      }}
      style={{
        flex: 1,
        padding: '8px 0',
        border: 'none',
        background: 'transparent',
        borderBottom: mode === m ? '2px solid var(--accent)' : '2px solid transparent',
        color: mode === m ? 'var(--ink)' : 'var(--muted)',
        fontSize: 13.5,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {text}
    </button>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--canvas)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 400,
          maxWidth: '100%',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 18,
          boxShadow: '0 24px 70px rgba(0,0,0,0.10)',
          overflow: 'hidden',
          animation: 'fadeUp .25s ease',
        }}
      >
        <div style={{ padding: '26px 26px 6px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <LogoMark size={36} />
          <div>
            <Wordmark size={20} />
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Your content pipeline, everywhere.</div>
          </div>
        </div>

        <div style={{ display: 'flex', padding: '14px 26px 0' }}>
          {tab('signin', 'Sign in')}
          {tab('signup', 'Sign up')}
          {tab('magic', 'Magic link')}
        </div>

        <form onSubmit={submit} style={{ padding: '18px 26px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <div>
              <label style={label}>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>
          )}
          <div>
            <label style={label}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
          </div>
          {mode !== 'magic' && (
            <div>
              <label style={label}>Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12.5, color: '#E5594D', background: '#FDF3F2', border: '1px solid #F0D4D0', borderRadius: 8, padding: '8px 11px' }}>{error}</div>
          )}
          {notice && (
            <div style={{ fontSize: 12.5, color: '#1F7A4D', background: '#EFF8F2', border: '1px solid #CDE9D8', borderRadius: 8, padding: '8px 11px' }}>{notice}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{ padding: '11px 16px', border: 'none', background: 'var(--accent)', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }}
          >
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'magic' ? 'Send magic link' : 'Sign in'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 26px', color: 'var(--muted)', fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          or
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>

        <div style={{ padding: '8px 26px 24px' }}>
          <button
            type="button"
            onClick={google}
            disabled={busy}
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '11px 16px', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
          >
            <svg width="17" height="17" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 43.5c5.4 0 10.3-2 13.9-5.2l-6.4-5.4c-2 1.5-4.6 2.5-7.5 2.5-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.6 39 16.2 43.5 24 43.5z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.4 5.4c-.5.4 6.8-4.9 6.8-14.8 0-1.2-.1-2.3-.4-3.5z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
