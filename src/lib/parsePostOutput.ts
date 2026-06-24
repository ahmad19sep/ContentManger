import type { Video } from '../types';

type PostField = Pick<
  Video,
  | 'headline'
  | 'article'
  | 'xPost'
  | 'linkedinPost'
  | 'facebookPost'
  | 'instagramCaption'
  | 'whatsappPost'
  | 'youtubeShortScript'
  | 'imagePrompt'
  | 'factCheckNotes'
  | 'riskLevel'
>;

const MARKERS: Record<string, keyof PostField> = {
  HEADLINE: 'headline',
  ARTICLE: 'article',
  X_POST: 'xPost',
  LINKEDIN_POST: 'linkedinPost',
  FACEBOOK_POST: 'facebookPost',
  INSTAGRAM_CAPTION: 'instagramCaption',
  WHATSAPP_POST: 'whatsappPost',
  YOUTUBE_SHORT_SCRIPT: 'youtubeShortScript',
  IMAGE_PROMPT: 'imagePrompt',
  FACT_CHECK_NOTES: 'factCheckNotes',
  RISK_LEVEL: 'riskLevel',
};

/**
 * Split AI output written with [[MARKER]] blocks into the post fields.
 * Everything between a marker and the next marker (or end of text) is the value.
 */
export function parsePostOutput(raw: string): PostField {
  const result: PostField = {};
  const regex = /\[\[([A-Z_]+)\]\]/g;
  const matches = [...raw.matchAll(regex)];
  for (let i = 0; i < matches.length; i++) {
    const name = matches[i][1];
    const key = MARKERS[name];
    if (!key) continue;
    const start = (matches[i].index ?? 0) + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? raw.length : raw.length;
    const value = raw.slice(start, end).trim();
    if (value) result[key] = value;
  }
  return result;
}

/** True if the text contains at least one recognized marker. */
export function hasMarkers(raw: string): boolean {
  return Object.keys(parsePostOutput(raw)).length > 0;
}
