import { createClient } from '@supabase/supabase-js';

// AI Radar ← Caira: open-task count per worker (keyed by email), so AI Radar
// gives new work to the freer person. "Open" = not in the Publishing stage.
// Auth: Authorization: Bearer <RADAR_INGEST_TOKEN>

function authed(req: any): boolean {
  const h = req.headers['authorization'] || req.headers['Authorization'] || '';
  const t = typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7) : '';
  return !!process.env.RADAR_INGEST_TOKEN && t === process.env.RADAR_INGEST_TOKEN;
}

export default async function handler(req: any, res: any) {
  if (!authed(req)) return res.status(401).json({ error: 'unauthorized' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ws = process.env.RADAR_WORKSPACE_ID;
  if (!url || !key || !ws) return res.status(501).json({ error: 'not_configured' });

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data, error } = await admin
    .from('videos')
    .select('assignee_id')
    .eq('workspace_id', ws)
    .neq('stage', 'publish');
  if (error) return res.status(500).json({ error: error.message });

  const ids = [...new Set((data || []).map((r: any) => r.assignee_id).filter(Boolean))];
  const emailById = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await admin.from('profiles').select('id, email').in('id', ids);
    for (const p of (profs as { id: string; email: string }[]) || []) emailById.set(p.id, p.email);
  }

  const counts: Record<string, number> = {};
  for (const r of (data as { assignee_id: string | null }[]) || []) {
    if (!r.assignee_id) continue;
    const k = emailById.get(r.assignee_id) || r.assignee_id;
    counts[k] = (counts[k] || 0) + 1;
  }
  return res.status(200).json(counts);
}
