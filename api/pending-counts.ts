import { createClient } from '@supabase/supabase-js';

// AI Radar ← Caira: open-task count per worker (keyed by email), so AI Radar
// gives new work to the freer person. "Open" = not in the Publishing stage.
// Auth: Authorization: Bearer <RADAR_INGEST_TOKEN>

function authed(req: any): boolean {
  const h = req.headers['authorization'] || req.headers['Authorization'] || '';
  const t = typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7) : '';
  return !!process.env.RADAR_INGEST_TOKEN && t === process.env.RADAR_INGEST_TOKEN;
}

async function resolveWorkspaceId(admin: any): Promise<string | null> {
  if (process.env.RADAR_WORKSPACE_ID) return process.env.RADAR_WORKSPACE_ID;
  const name = process.env.RADAR_WORKSPACE_NAME || 'AI Radar';
  let query = admin.from('workspaces').select('id, owner_id, created_at').ilike('name', name);
  const ownerEmail = process.env.RADAR_OWNER_EMAIL;
  if (ownerEmail) {
    const { data: prof } = await admin.from('profiles').select('id').ilike('email', ownerEmail).maybeSingle();
    if (prof?.id) query = query.eq('owner_id', prof.id);
  }
  const { data } = await query.order('created_at', { ascending: true }).limit(1);
  return (data && data[0]?.id) || null;
}

export default async function handler(req: any, res: any) {
  if (!authed(req)) return res.status(401).json({ error: 'unauthorized' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(501).json({ error: 'not_configured' });

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const ws = await resolveWorkspaceId(admin);
  if (!ws) return res.status(200).json({});

  // Every member of the workspace (so idle workers show as 0, not missing).
  const { data: members } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', ws);
  const memberIds = (members as { user_id: string }[] | null)?.map((m) => m.user_id) ?? [];
  const emailById = new Map<string, string>();
  if (memberIds.length) {
    const { data: profs } = await admin.from('profiles').select('id, email').in('id', memberIds);
    for (const p of (profs as { id: string; email: string }[]) || []) emailById.set(p.id, p.email);
  }

  const counts: Record<string, number> = {};
  for (const id of memberIds) counts[emailById.get(id) || id] = 0;

  const { data, error } = await admin
    .from('videos')
    .select('assignee_id')
    .eq('workspace_id', ws)
    .neq('stage', 'publish');
  if (error) return res.status(500).json({ error: error.message });

  for (const r of (data as { assignee_id: string | null }[]) || []) {
    if (!r.assignee_id) continue;
    const k = emailById.get(r.assignee_id) || r.assignee_id;
    counts[k] = (counts[k] || 0) + 1;
  }
  return res.status(200).json(counts);
}
