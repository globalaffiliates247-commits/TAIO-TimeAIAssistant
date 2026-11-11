// PRD B34 v0.3.26: the smart part of the day sheet — times, duration pills, gaps, suggestions.
// Pure functions over Thẻ ngày items, so they are easy to test and reuse.
import type { DailyCardItem } from '@/types';

export const MIN_GAP_MINS = 15;      // founder decision: suggest only for gaps of 15 minutes or more
export const DEFAULT_DURATION = 30;  // when there is no history

export const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
export const toTime = (mins: number) => {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
export const fmtDuration = (mins: number) => {
  if (mins < 60) return `${mins}p`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}g${String(m).padStart(2, '0')}` : `${h} giờ`;
};

/** "15:45 Sửa màn hình", "9h30 họp", "7.15 chạy bộ" -> { time: "15:45", rest: "Sửa màn hình" } */
export function parseTimedText(raw: string): { time?: string; rest: string; durationMins?: number } {
  const text = raw.trim();
  const m = text.match(/^(\d{1,2})\s*[:h.]\s*(\d{2})?\s*(.*)$/i);
  let time: string | undefined;
  let rest = text;
  if (m) {
    const h = Number(m[1]), min = Number(m[2] || 0);
    if (h < 24 && min < 60 && (m[2] !== undefined || /h/i.test(text.slice(0, 3)))) {
      time = toTime(h * 60 + min);
      rest = m[3].trim();
    }
  }
  // A typed duration such as "30p", "45 phút", "1g", "1h30" anywhere in the line
  let durationMins: number | undefined;
  const d = rest.match(/(?:^|\s)(\d{1,3})\s*(?:p|ph|phút)(?=\s|$)|(?:^|\s)(\d)\s*(?:g|giờ)\s*(\d{2})?(?=\s|$)/i);
  if (d) {
    durationMins = d[1] ? Number(d[1]) : Number(d[2]) * 60 + Number(d[3] || 0);
    rest = rest.replace(d[0], ' ').replace(/\s+/g, ' ').trim();
  }
  return { time, rest, durationMins };
}

export const priorityOf = (text: string) => { const m = text.match(/#(\d)\b/); return m ? Number(m[1]) : 99; };
export const durationOf = (it: DailyCardItem) =>
  it.start && it.end ? (toMins(it.end) - toMins(it.start) + 1440) % 1440 : undefined;

const keyWords = (t: string) =>
  t.toLowerCase().replace(/#\d/g, '').split(/[^a-zà-ỹ0-9]+/i).filter(w => w.length > 3);

/** Duration pill: learn from past timed items with a similar title or the same goal; else 30 minutes. */
export function suggestDuration(text: string, goalId: string | undefined, history: DailyCardItem[], fallback = DEFAULT_DURATION): number {
  const words = new Set(keyWords(text));
  const samples = history
    .filter(h => h.start && h.end)
    .filter(h => (goalId && h.goalId === goalId) || keyWords(h.text).some(w => words.has(w)))
    .map(h => durationOf(h)!)
    .filter(d => d >= 5 && d <= 240)
    .sort((a, b) => a - b);
  if (!samples.length) return fallback;
  const median = samples[Math.floor(samples.length / 2)];
  return Math.max(5, Math.round(median / 5) * 5);
}

export interface Gap { start: string; end: string; mins: number; afterId?: string }

/** Free time between timed items of the day (only the part still ahead of `nowMins`). */
export function findGaps(timed: DailyCardItem[], nowMins: number): Gap[] {
  const sorted = [...timed].filter(t => t.start).sort((a, b) => toMins(a.start!) - toMins(b.start!));
  const gaps: Gap[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    const aEnd = toMins(a.start!) + (durationOf(a) ?? DEFAULT_DURATION);
    const from = Math.max(aEnd, nowMins);
    const to = toMins(b.start!);
    if (to - from >= MIN_GAP_MINS) gaps.push({ start: toTime(from), end: toTime(to), mins: to - from, afterId: a.id });
  }
  return gaps;
}

/** First free start time after `afterMins` that does not overlap a timed item. */
export function nextFreeStart(timed: DailyCardItem[], afterMins: number): string {
  let t = afterMins;
  const spans = timed.filter(x => x.start).map(x => [toMins(x.start!), toMins(x.start!) + (durationOf(x) ?? DEFAULT_DURATION)] as const)
    .sort((a, b) => a[0] - b[0]);
  for (const [s, e] of spans) if (t >= s && t < e) t = e;
  return toTime(t);
}

/** One suggestion per gap: the open unscheduled item with the best #priority. */
export function suggestForGap(flex: DailyCardItem[], taken: Set<string>): DailyCardItem | undefined {
  return flex
    .filter(f => f.status === 'open' && !taken.has(f.id))
    .sort((a, b) => priorityOf(a.text) - priorityOf(b.text))[0];
}
