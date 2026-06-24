import { createClient } from '@supabase/supabase-js';

// AI Radar → Caira: create a news "post" task in the AI Radar workspace.
// Auth: Authorization: Bearer <RADAR_INGEST_TOKEN>
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RADAR_INGEST_TOKEN, RADAR_WORKSPACE_ID

function authed(req: any): boolean {
  const h = req.headers['authorization'] || req.headers['Authorization'] || '';
  const t = typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7) : '';
  return !!process.env.RADAR_INGEST_TOKEN && t === process.env.RADAR_INGEST_TOKEN;
}

// Resolve the AI Radar workspace automatically: by RADAR_WORKSPACE_ID if set,
// otherwise by name (default "AI Radar"), scoped to the owner's email so it can't
// match another account's workspace. No id needs to be configured by hand.
export async function resolveWorkspaceId(admin: any): Promise<string | null> {
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!authed(req)) return res.status(401).json({ error: 'unauthorized' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(501).json({ error: 'not_configured' });

  let b: any = req.body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b || '{}'); } catch { b = {}; }
  }
  if (!b?.external_id || !b?.title) {
    return res.status(400).json({ error: 'external_id and title are required' });
  }

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const ws = await resolveWorkspaceId(admin);
  if (!ws) return res.status(501).json({ error: 'no_ai_radar_workspace' });

  // Dedup by external_id.
  const { data: dup } = await admin
    .from('videos')
    .select('id')
    .eq('radar_external_id', b.external_id)
    .maybeSingle();
  if (dup) return res.status(200).json({ status: 'duplicate', id: dup.id });

  // Resolve assignee. If AI Radar gave an email, honor it. Otherwise (the normal
  // case) AUTO-ASSIGN to the workspace member with the fewest open tasks — this is
  // what makes it scale to any number of workers with zero config on Radar's side.
  let assigneeId: string | null = null;
  if (b.assignee) {
    const { data: prof } = await admin
      .from('profiles')
      .select('id')
      .ilike('email', String(b.assignee))
      .maybeSingle();
    assigneeId = prof?.id ?? null;
  }
  if (!assigneeId) {
    const { data: members } = await admin
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', ws);
    const memberIds = (members as { user_id: string }[] | null)?.map((m) => m.user_id) ?? [];
    if (memberIds.length) {
      const load: Record<string, number> = {};
      for (const id of memberIds) load[id] = 0;
      const { data: open } = await admin
        .from('videos')
        .select('assignee_id')
        .eq('workspace_id', ws)
        .neq('stage', 'publish');
      for (const o of (open as { assignee_id: string | null }[]) || []) {
        if (o.assignee_id && load[o.assignee_id] !== undefined) load[o.assignee_id]++;
      }
      assigneeId = memberIds.sort((a, c) => load[a] - load[c])[0] ?? null;
    }
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
