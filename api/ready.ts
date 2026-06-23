import { createClient } from '@supabase/supabase-js';

// Caira → AI Radar (return path): approved, not-yet-delivered "post" tasks with
// their parsed platform content. Marks them delivered so they aren't returned
// again (AI Radar also de-dupes by id).
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
    .select(
      'id, title, headline, article, x_post, linkedin_post, facebook_post, instagram_caption, whatsapp_post, youtube_short_script, image_prompt, fact_check_notes, risk_level, assignee_id, news_source, source_url, drive',
    )
    .eq('workspace_id', ws)
    .eq('kind', 'post')
    .eq('approved', true)
    .eq('radar_delivered', false);
  if (error) return res.status(500).json({ error: error.message });

  const rows = (data as any[]) || [];

  // Map assignee_id -> email.
  const ids = [...new Set(rows.map((r) => r.assignee_id).filter(Boolean))];
  const emailById = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await admin.from('profiles').select('id, email').in('id', ids);
    for (const p of (profs as { id: string; email: string }[]) || []) emailById.set(p.id, p.email);
  }

  const out = rows.map((r) => ({
    id: r.id,
    title: r.title,
    headline: r.headline || r.title,
    source: r.news_source || '',
    source_url: r.source_url || '',
    assignee: r.assignee_id ? emailById.get(r.assignee_id) || '' : '',
    risk_level: r.risk_level || '',
    drive_url: r.drive || '',
    article: r.article || '',
    x_post: r.x_post || '',
    linkedin_post: r.linkedin_post || '',
    facebook_post: r.facebook_post || '',
    instagram_caption: r.instagram_caption || '',
    whatsapp_post: r.whatsapp_post || '',
    youtube_short_script: r.youtube_short_script || '',
    image_prompt: r.image_prompt || '',
    fact_check_notes: r.fact_check_notes || '',
  }));

  const deliverIds = rows.map((r) => r.id);
  if (deliverIds.length) {
    await admin.from('videos').update({ radar_delivered: true }).in('id', deliverIds);
  }

  return res.status(200).json(out);
}
