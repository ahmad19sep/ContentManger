export type StageId = 'idea' | 'script' | 'record' | 'edit' | 'review' | 'publish';

export type PlatformId =
  | 'yt'
  | 'shorts'
  | 'tiktok'
  | 'reels'
  | 'ig'
  | 'fb'
  | 'x'
  | 'threads'
  | 'reddit'
  | 'li'
  | 'pod';

export type PriorityId = 'high' | 'med' | 'low';

export type DeviceId = 'desktop' | 'mobile';

export type ViewId = 'dashboard' | 'pipeline' | 'calendar' | 'ideas';

export interface Stage {
  id: StageId;
  label: string;
  short: string;
  color: string;
  prog: number;
}

export interface PlatformMeta {
  label: string;
  color: string;
}

export interface PriorityMeta {
  label: string;
  color: string;
}

export interface Video {
  id: string;
  title: string;
  platform: PlatformId;
  stage: StageId;
  priority: PriorityId;
  /** ISO date string yyyy-mm-dd */
  due: string;
  /** ISO date string yyyy-mm-dd, or '' if unscheduled */
  publish: string;
  note: string;
  drive?: string;
  /** keyed by `${stageId}:${index}` -> done */
  checks: Record<string, boolean>;
}

export interface VideoForm {
  title: string;
  platform: PlatformId;
  stage: StageId;
  priority: PriorityId;
  due: string;
}
