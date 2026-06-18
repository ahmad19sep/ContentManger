import { FORMATS, PLAT, PRIO, STAGES } from './constants';
import { dueInfo } from './dates';
import type { Stage, Video } from './types';

export function stageObj(id: string): Stage {
  return STAGES.find((s) => s.id === id)!;
}

export function stageIndex(id: string): number {
  return STAGES.findIndex((s) => s.id === id);
}

export interface VideoMeta {
  platformLabel: string;
  platformColor: string;
  stageLabel: string;
  stageColor: string;
  priorityLabel: string;
  priorityColor: string;
  dueLabel: string;
  dueColor: string;
  progress: number;
  format: string;
  hasDrive: boolean;
}

export function videoMeta(v: Video): VideoMeta {
  const p = PLAT[v.platform];
  const st = stageObj(v.stage);
  const pr = PRIO[v.priority];
  const di = dueInfo(v.due);
  return {
    platformLabel: p.label,
    platformColor: p.color,
    stageLabel: st.label,
    stageColor: st.color,
    priorityLabel: pr.label,
    priorityColor: pr.color,
    dueLabel: di.label,
    dueColor: di.color,
    progress: st.prog,
    format: FORMATS[v.platform],
    hasDrive: !!(v.drive && v.drive.trim()),
  };
}
