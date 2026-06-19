import { supabase } from './supabase';

export const driveClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
export const isDriveAvailable = Boolean(driveClientId);

export interface DriveStatus {
  connected: boolean;
  email: string | null;
}

function client() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

function base64url(obj: unknown): string {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function getDriveStatus(workspaceId: string): Promise<DriveStatus> {
  const sb = client();
  const { data } = await sb
    .from('workspace_drive')
    .select('connected, google_email')
    .eq('workspace_id', workspaceId)
    .maybeSingle();
  return { connected: !!data?.connected, email: data?.google_email ?? null };
}

/** Begin the Google Drive connect flow (redirects the browser to Google). */
export async function connectDrive(workspaceId: string): Promise<void> {
  if (!driveClientId) throw new Error('Google Drive is not configured');
  const {
    data: { session },
  } = await client().auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not signed in');

  const redirectUri = `${window.location.origin}/api/drive-callback`;
  const params = new URLSearchParams({
    client_id: driveClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
    state: base64url({ workspaceId, token }),
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Ensure the video's Drive folder exists and is shared with its current
 * assignee. Fire-and-forget; failures are swallowed so card creation never
 * breaks. Returns the folder link if available.
 */
export async function syncVideoFolder(videoId: string): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await client().auth.getSession();
    const token = session?.access_token;
    if (!token) return null;
    const res = await fetch('/api/drive-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ videoId }),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({}));
    return (json.link as string) ?? null;
  } catch {
    return null;
  }
}
