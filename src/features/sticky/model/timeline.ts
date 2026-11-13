// PRD B34 v0.3.26 / FIX v0.3.28: the smart part of the day sheet — times, duration pills, gaps, suggestions.
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

/** "15:45 Sửa màn hình", "9h30 họp", "7.15 chạy bộ" -> { time: "15:45", rest: "Sửa màn hình", durationMins } */
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

  // Duration parser (FIX v0.3.28 Part D): supports Vietnamese & English abbreviations:
  // p, ph, phút, min, mins, m (minutes)
  // g, giờ, h, hr, hrs (hours)
  // e.g. "20min", "10mins", "1h30", "1g30", "45m", "15p", "2h", "1hr"
  let durationMins: number | undefined;

  // 1. Hours + optional minutes: e.g. "1h30", "1g15", "2h", "1hr", "1 giờ 30 phút"
  const hourMatch = rest.match(/(?:^|\s)(\d{1,2})\s*(?:g|giờ|h|hr|hrs)\s*(\d{1,2})?(?:\s*(?:p|ph|phút|min|mins|m))?(?=\s|[.,!?]|$)/i);
  if (hourMatch) {
    const h = Number(hourMatch[1]);
    const minPart = hourMatch[2] ? Number(hourMatch[2]) : 0;
    durationMins = h * 60 + minPart;
    rest = rest.replace(hourMatch[0], ' ').replace(/\s+/g, ' ').trim();
  } else {
    // 2. Pure minutes: e.g. "20min", "10mins", "45m", "30p", "45 phút"
    const minMatch = rest.match(/(?:^|\s)(\d{1,3})\s*(?:p|ph|phút|min|mins|m)(?=\s|[.,!?]|$)/i);
    if (minMatch) {
      durationMins = Number(minMatch[1]);
      rest = rest.replace(minMatch[0], ' ').replace(/\s+/g, ' ').trim();
    }
  }

  return { time, rest, durationMins };
}

export const priorityOf = (text: string) => { const m = text.match(/#(\d)\b/); return m ? Number(m[1]) : 99; };
export const durationOf = (it: DailyCardItem) =>
  it.start && it.end ? (toMins(it.end) - toMins(it.start) + 1440) % 1440 : undefined;

const keyWords = (t: string) =>
  t.toLowerCase().replace(/#\d/g, '').split(/[^a-zà-ỹ0-9]+/i).filter(w => w.length > 3);

/** Duration pill: learn from past timed items with a similar title or the same goal; else fallback. */
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

/**
 * FIX v0.3.28 D2: Order of duration choice when placing into a gap:
 * 1. User typed estimate on unscheduled line (`extra.estimateMins`)
 * 2. Learned from similar past items (`suggestDuration`)
 * 3. Default 30 mins (`DEFAULT_DURATION`)
 * NEVER use gap.mins as task duration!
 */
export function durationForPlacement(item: DailyCardItem, history: DailyCardItem[] = []): number {
  const extra = item.extra as Record<string, unknown> | undefined;
  if (typeof extra?.estimateMins === 'number' && extra.estimateMins > 0) {
    return extra.estimateMins;
  }
  const learned = suggestDuration(item.text, item.goalId, history, 0);
  if (learned > 0) {
    return learned;
  }
  return DEFAULT_DURATION;
}

export interface MergedSpan {
  start: number;
  end: number;
  lastItemId?: string;
}

/** Merge overlapping or contiguous time intervals (FIX v0.3.28 D2). */
export function mergeIntervals(spans: Array<{ start: number; end: number; id?: string }>): MergedSpan[] {
  if (!spans.length) return [];
  const sorted = [...spans].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: MergedSpan[] = [{ start: sorted[0].start, end: sorted[0].end, lastItemId: sorted[0].id }];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const prev = merged[merged.length - 1];
    if (cur.start <= prev.end) {
      if (cur.end > prev.end) {
        prev.end = cur.end;
        prev.lastItemId = cur.id;
      }
    } else {
      merged.push({ start: cur.start, end: cur.end, lastItemId: cur.id });
    }
  }
  return merged;
}

export interface Gap { start: string; end: string; mins: number; afterId?: string }

/**
 * Free time between timed items of the day (only the part still ahead of `nowMins`).
 * Merges overlapping spans first so long tasks don't leave false phantom gaps.
 */
export function findGaps(timed: DailyCardItem[], nowMins: number): Gap[] {
  const sorted = [...timed].filter(t => t.start).sort((a, b) => toMins(a.start!) - toMins(b.start!));
  if (!sorted.length) return [];

  const spans = sorted.map(t => ({
    start: toMins(t.start!),
    end: toMins(t.start!) + (durationOf(t) ?? DEFAULT_DURATION),
    id: t.id
  }));
  const merged = mergeIntervals(spans);
  const gaps: Gap[] = [];

  for (let i = 0; i < merged.length - 1; i++) {
    const a = merged[i], b = merged[i + 1];
    const from = Math.max(a.end, nowMins);
    const to = b.start;
    if (to - from >= MIN_GAP_MINS) {
      const anchor = sorted.filter(t => toMins(t.start!) < to).pop();
      gaps.push({
        start: toTime(from),
        end: toTime(to),
        mins: to - from,
        afterId: anchor?.id ?? a.lastItemId
      });
    }
  }
  return gaps;
}

/** Identify tasks that start before a previous task has finished (FIX v0.3.28 D2 #7). */
export function findOverlapItemIds(timed: DailyCardItem[]): Set<string> {
  const sorted = [...timed].filter(t => t.start).sort((a, b) => toMins(a.start!) - toMins(b.start!));
  const overlapIds = new Set<string>();
  let maxEndSoFar = -1;

  for (let i = 0; i < sorted.length; i++) {
    const it = sorted[i];
    const s = toMins(it.start!);
    const dur = durationOf(it) ?? DEFAULT_DURATION;
    const e = s + dur;

    if (i > 0 && s < maxEndSoFar) {
      overlapIds.add(it.id);
    }
    if (e > maxEndSoFar) {
      maxEndSoFar = e;
    }
  }
  return overlapIds;
}

/** First free start time after `afterMins` that does not overlap a timed item. */
export function nextFreeStart(timed: DailyCardItem[], afterMins: number): string {
  let t = afterMins;
  const spans = timed.filter(x => x.start).map(x => ({
    start: toMins(x.start!),
    end: toMins(x.start!) + (durationOf(x) ?? DEFAULT_DURATION)
  }));
  const merged = mergeIntervals(spans);
  for (const block of merged) {
    if (t >= block.start && t < block.end) {
      t = block.end;
    }
  }
  return toTime(t);
}

/**
 * One suggestion per gap: prioritize open unscheduled items that fit the gap first,
 * then rank by #priority.
 */
export function suggestForGap(
  flex: DailyCardItem[],
  taken: Set<string>,
  gapMins?: number,
  history: DailyCardItem[] = []
): DailyCardItem | undefined {
  const available = flex.filter(f => f.status === 'open' && !taken.has(f.id));
  if (!available.length) return undefined;
  if (gapMins !== undefined) {
    return available.sort((a, b) => {
      const durA = durationForPlacement(a, history);
      const durB = durationForPlacement(b, history);
      const fitA = durA <= gapMins ? 0 : 1;
      const fitB = durB <= gapMins ? 0 : 1;
      if (fitA !== fitB) return fitA - fitB; // items that fit comfortably come first
      return priorityOf(a.text) - priorityOf(b.text);
    })[0];
  }
  return available.sort((a, b) => priorityOf(a.text) - priorityOf(b.text))[0];
}
