import { createClient } from '@supabase/supabase-js';

// Vercel serverless function: send a real invitation email and attach the
// invitee to a workspace. Uses the Supabase service_role key (server-only).
//
// Required env vars (set in Vercel, NOT prefixed with VITE_):
//   SUPABASE_URL                 your project URL
//   SUPABASE_SERVICE_ROLE_KEY    the secret service_role key

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    // Signal the client to fall back to the no-email invite path.
    res.status(501).json({ error: 'not_configured' });
    return;
  }

  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;
  if (!token) {
    res.status(401).json({ error: 'Not signed in' });
    return;
  }

  let body: any = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      body = {};
    }
  }
  const workspaceId: string | undefined = body?.workspaceId;
  const email: string = (body?.email || '').trim().toLowerCase();
  if (!workspaceId || !email) {
    res.status(400).json({ error: 'workspaceId and email are required' });
    return;
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Verify the caller and their membership of the target workspace.
  const { data: userData, error: uErr } = await admin.auth.getUser(token);
  if (uErr || !userData?.user) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }
  const callerId = userData.user.id;

  const { data: membership } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', callerId)
    .maybeSingle();
  if (!membership) {
    res.status(403).json({ error: 'You are not a member of this workspace' });
    return;
  }

  // 2. If the email already has an account, add them directly.
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    await admin
      .from('workspace_members')
      .upsert(
        { workspace_id: workspaceId, user_id: existing.id, role: 'member' },
        { onConflict: 'workspace_id,user_id', ignoreDuplicates: true },
      );
    res.status(200).json({ status: 'added' });
    return;
  }

  // 3. New email: just record the pending invite. The person signs up with this
  //    email and the signup trigger auto-joins them — no email delivery required
  //    (Supabase's built-in mailer is rate-limited and unreliable).
  await admin
    .from('workspace_invites')
    .upsert(
      { workspace_id: workspaceId, email, invited_by: callerId },
      { onConflict: 'workspace_id,email', ignoreDuplicates: true },
    );

  res.status(200).json({ status: 'invited' });
}
