import { createClient } from '@supabase/supabase-js';

// AI Radar → Caira: create a news "post" task in the AI Radar workspace.
// Auth: Authorization: Bearer <RADAR_INGEST_TOKEN>
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RADAR_INGEST_TOKEN, RADAR_WORKSPACE_ID

function authed(req: any): boolean {
  const h = req.headers['authorization'] || req.headers['Authorization'] || '';
  const t = typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7) : '';
  return !!process.env.RADAR_INGEST_TOKEN && t === process.env.RADAR_INGEST_TOKEN;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!authed(req)) return res.status(401).json({ error: 'unauthorized' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ws = process.env.RADAR_WORKSPACE_ID;
  if (!url || !key || !ws) return res.status(501).json({ error: 'not_configured' });

  let b: any = req.body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b || '{}'); } catch { b = {}; }
  }
  if (!b?.external_id || !b?.title) {
    return res.status(400).json({ error: 'external_id and title are required' });
  }

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  // Dedup by external_id.
  const { data: dup } = await admin
    .from('videos')
    .select('id')
    .eq('radar_external_id', b.external_id)
    .maybeSingle();
  if (dup) return res.status(200).json({ status: 'duplicate', id: dup.id });

  // Resolve assignee (email) -> member user id; null = unassigned.
  let assigneeId: string | null = null;
  if (b.assignee) {
    const { data: prof } = await admin
      .from('profiles')
      .select('id')
      .ilike('email', String(b.assignee))
      .maybeSingle();
    assigneeId = prof?.id ?? null;
  }

  const score = typeof b.score === 'number' ? b.score : null;
  const { data, error } = await admin
    .from('videos')
    .insert({
      workspace_id: ws,
      kind: 'post',
      title: b.title,
      stage: 'idea',
      platform: 'x',
      priority: score != null && score >= 14 ? 'high' : 'med',
      assignee_id: assigneeId,
      note: `${b.source || ''}${b.category ? ' • ' + b.category : ''}${score != null ? ' • score ' + score : ''}\n${b.summary || ''}`.trim(),
      master_prompt: b.prompt || null,
      source_url: b.url || null,
      news_source: b.source || null,
      category: b.category || null,
      news_score: score,
      radar_external_id: b.external_id,
    })
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ status: 'created', id: data.id });
}
