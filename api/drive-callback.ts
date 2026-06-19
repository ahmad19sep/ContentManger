import { createClient } from '@supabase/supabase-js';

// Google OAuth redirect target. Exchanges the auth code for tokens, verifies the
// caller owns the workspace, and stores the refresh token (server-side only).
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

function appOrigin(req: any): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  return `${proto}://${req.headers.host}`;
}

export default async function handler(req: any, res: any) {
  const origin = appOrigin(req);
  const fail = (msg: string) => {
    res.writeHead(302, { Location: `${origin}/?drive=error&msg=${encodeURIComponent(msg)}` });
    res.end();
  };

  try {
    const code = req.query?.code as string | undefined;
    const stateRaw = req.query?.state as string | undefined;
    if (req.query?.error) return fail(String(req.query.error));
    if (!code || !stateRaw) return fail('missing_code');

    let state: { workspaceId?: string; token?: string } = {};
    try {
      state = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'));
    } catch {
      return fail('bad_state');
    }
    const { workspaceId, token } = state;
    if (!workspaceId || !token) return fail('bad_state');

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!url || !serviceKey || !clientId || !clientSecret) return fail('server_not_configured');

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the caller and that they own this workspace.
    const { data: userData, error: uErr } = await admin.auth.getUser(token);
    if (uErr || !userData?.user) return fail('invalid_session');
    const { data: ws } = await admin
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .maybeSingle();
    if (!ws || ws.owner_id !== userData.user.id) return fail('not_owner');

    // Exchange the code for tokens.
    const redirectUri = `${origin}/api/drive-callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tok = await tokenRes.json();
    if (!tokenRes.ok) return fail(tok.error_description || tok.error || 'token_exchange_failed');
    if (!tok.refresh_token) return fail('no_refresh_token');

    // Look up the connected Google email.
    let email: string | null = null;
    try {
      const ui = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tok.access_token}` },
      }).then((r) => r.json());
      email = ui?.email ?? null;
    } catch {
      /* non-fatal */
    }

    await admin
      .from('drive_tokens')
      .upsert({ workspace_id: workspaceId, refresh_token: tok.refresh_token, updated_at: new Date().toISOString() });
    await admin
      .from('workspace_drive')
      .upsert({
        workspace_id: workspaceId,
        connected: true,
        google_email: email,
        connected_by: userData.user.id,
        updated_at: new Date().toISOString(),
      });

    res.writeHead(302, { Location: `${origin}/?drive=connected` });
    res.end();
  } catch (e) {
    fail(e instanceof Error ? e.message : 'unexpected');
  }
}
