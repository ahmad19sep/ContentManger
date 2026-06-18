import { MS } from './constants';

/** The "today" the app reasons about. Matches the seed dataset's reference date. */
export const TODAY = new Date(2026, 5, 18);

export function parse(s: string): Date {
  const p = s.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}

export function ymd(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function msShort(d: Date): string {
  return MS[d.getMonth()] + ' ' + d.getDate();
}

export function longDate(d: Date): string {
  return MS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

export function diffDays(s: string): number {
  return Math.round((parse(s).getTime() - TODAY.getTime()) / 86400000);
}

export interface DueInfo {
  label: string;
  color: string;
}

export function dueInfo(s: string): DueInfo {
  if (!s) return { label: 'No date', color: '#9A9AA2' };
  const d = parse(s);
  const diff = diffDays(s);
  if (diff < 0) return { label: 'Overdue · ' + msShort(d), color: '#E5594D' };
  if (diff === 0) return { label: 'Due today', color: '#D9941F' };
  if (diff === 1) return { label: 'Due tomorrow', color: '#5A5A62' };
  if (diff < 7) return { label: 'Due in ' + diff + ' days', color: '#5A5A62' };
  return { label: 'Due ' + msShort(d), color: '#6E6E78' };
}
