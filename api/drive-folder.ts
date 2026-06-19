import { createClient } from '@supabase/supabase-js';

// Ensures a Google Drive folder exists for a video and that it is shared with
// exactly the current assignee (plus the owner, who owns the file). Idempotent:
// call it on card creation and whenever the assignee changes.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

async function getAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const j = await res.json();
  return res.ok ? (j.access_token as string) : null;
}

async function createFolder(accessToken: string, name: string, parentId?: string) {
  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error?.message || 'create_folder_failed');
  return j as { id: string; webViewLink: string };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ error: 'not_configured' });
  }

  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'not_signed_in' });

  let body: any = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch { body = {}; }
  }
  const videoId: string | undefined = body?.videoId;
  if (!videoId) return res.status(400).json({ error: 'videoId_required' });

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // Authenticate caller.
  const { data: userData, error: uErr } = await admin.auth.getUser(token);
  if (uErr || !userData?.user) return res.status(401).json({ error: 'invalid_session' });
  const callerId = userData.user.id;

  // Load the video + verify the caller belongs to its workspace.
  const { data: video } = await admin
    .from('videos')
    .select('id, workspace_id, title, assignee_id, drive, drive_folder_id')
    .eq('id', videoId)
    .maybeSingle();
  if (!video) return res.status(404).json({ error: 'video_not_found' });

  const { data: membership } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', video.workspace_id)
    .eq('user_id', callerId)
    .maybeSingle();
  if (!membership) return res.status(403).json({ error: 'not_a_member' });

  // Drive connected for this workspace?
  const { data: conn } = await admin
    .from('drive_tokens')
    .select('refresh_token')
    .eq('workspace_id', video.workspace_id)
    .maybeSingle();
  if (!conn) return res.status(200).json({ skipped: 'drive_not_connected' });

  try {
    const accessToken = await getAccessToken(conn.refresh_token);
    if (!accessToken) return res.status(200).json({ skipped: 'token_refresh_failed' });

    // Ensure a parent folder for the workspace.
    const { data: wd } = await admin
      .from('workspace_drive')
      .select('parent_folder_id, google_email')
      .eq('workspace_id', video.workspace_id)
      .maybeSingle();

    let parentId = wd?.parent_folder_id || undefined;
    if (!parentId) {
      const { data: wsRow } = await admin
        .from('workspaces')
        .select('name')
        .eq('id', video.workspace_id)
        .maybeSingle();
      const parent = await createFolder(accessToken, `Caira — ${wsRow?.name || 'Workspace'}`);
      parentId = parent.id;
      await admin
        .from('workspace_drive')
        .update({ parent_folder_id: parentId, updated_at: new Date().toISOString() })
        .eq('workspace_id', video.workspace_id);
    }

    // Ensure the video's folder. Name = "Title — YYYY-MM-DD".
    let folderId = video.drive_folder_id || '';
    let link = video.drive || '';
    if (!folderId) {
      const date = new Date().toISOString().slice(0, 10);
      const folderName = `${video.title || 'Untitled'} — ${date}`;
      const folder = await createFolder(accessToken, folderName, parentId);
      folderId = folder.id;
      link = folder.webViewLink;
      await admin.from('videos').update({ drive_folder_id: folderId, drive: link }).eq('id', videoId);
    }

    // Make the folder accessible to anyone with the link (editor).
    const permRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}/permissions?fields=permissions(id,role,type)`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const permJson = await permRes.json();
    const perms: { id: string; type: string; role?: string }[] = permJson.permissions || [];
    if (!perms.some((p) => p.type === 'anyone')) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'writer', type: 'anyone' }),
      });
    }

    return res.status(200).json({ link, folderId });
  } catch (e) {
    return res.status(200).json({ skipped: 'error', message: e instanceof Error ? e.message : 'unknown' });
  }
}
