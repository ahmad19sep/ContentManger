import type {
  PlatformId,
  PlatformMeta,
  PriorityId,
  PriorityMeta,
  Stage,
  StageId,
} from './types';

export const STAGES: Stage[] = [
  { id: 'idea', label: 'Idea', short: 'Idea', color: '#9A9AA2', prog: 8 },
  { id: 'script', label: 'Scripting', short: 'Script', color: '#D9941F', prog: 30 },
  { id: 'record', label: 'Recording', short: 'Record', color: '#E5594D', prog: 55 },
  { id: 'edit', label: 'Editing', short: 'Edit', color: '#7C5CFF', prog: 78 },
  { id: 'review', label: 'Review', short: 'Review', color: '#2E8FE0', prog: 92 },
  { id: 'publish', label: 'Publishing', short: 'Publish', color: '#1F9D57', prog: 100 },
];

export const PLAT: Record<PlatformId, PlatformMeta> = {
  yt: { label: 'YouTube', color: '#E5302A' },
  shorts: { label: 'Shorts', color: '#FF2C55' },
  tiktok: { label: 'TikTok', color: '#111827' },
  reels: { label: 'Reels', color: '#C13584' },
  ig: { label: 'Instagram', color: '#E1306C' },
  fb: { label: 'Facebook', color: '#1877F2' },
  x: { label: 'X', color: '#16181A' },
  threads: { label: 'Threads', color: '#4A4A50' },
  reddit: { label: 'Reddit', color: '#FF4500' },
  li: { label: 'LinkedIn', color: '#0A66C2' },
  pod: { label: 'Podcast', color: '#7C3AED' },
};

export const PRIO: Record<PriorityId, PriorityMeta> = {
  high: { label: 'High', color: '#E5594D' },
  med: { label: 'Medium', color: '#D9941F' },
  low: { label: 'Low', color: '#9A9AA2' },
};

export const FORMATS: Record<PlatformId, string> = {
  yt: 'Long-form',
  shorts: 'Short',
  tiktok: 'Short',
  reels: 'Reel',
  ig: 'Carousel',
  fb: 'Post',
  x: 'Thread',
  threads: 'Thread',
  reddit: 'Post',
  li: 'Article',
  pod: 'Episode',
};

export const CHECK: Record<StageId, string[]> = {
  idea: ['Define hook & angle', 'Validate search demand', 'Outline key points'],
  script: ['Write full script', 'Add b-roll notes', 'Read-through pass'],
  record: ['Set up lighting & audio', 'Record A-roll', 'Record b-roll'],
  edit: ['Rough cut', 'Color & sound mix', 'Captions & graphics'],
  review: ['Self-review pass', 'Title & thumbnail check', 'Final export'],
  publish: ['Upload & schedule', 'Description & tags', 'Pin comment / promote'],
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const ACCENT_OPTIONS = ['#5B5BD6', '#E5594D', '#1F9D57', '#2E8FE0'];

export const PLATFORM_IDS = Object.keys(PLAT) as PlatformId[];
