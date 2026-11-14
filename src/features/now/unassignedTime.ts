// TAIO Time App — Unassigned / Undeclared Time Calculation (PRD v0.3.36 Part A1 & A2)
import type { DailyCardItem, TimeBlock } from '@/types';
import type { DayTemplateSlot } from '@/features/data-transfer';
import { timeToMinutes, minutesToTime, getDeviceTimeMinutes } from '@/core/clock';

export interface TimeInterval {
  start: number; // minute from midnight (0..1439)
  end: number;   // minute from midnight (0..1439)
  id?: string;
  title?: string;
  status?: string;
}

export interface UnassignedTimeResult {
  unassignedMins: number;               // Total undeclared minutes from wake-up (or 08:00) to now
  unassignedStartStr: string;           // "HH:MM" - End of most recent declared interval
  unassignedStartMins: number;          // minute from midnight
  elapsedSinceLastDeclaredMins: number; // nowMins - unassignedStartMins
  mergedDeclaredIntervals: TimeInterval[];
  wakeUpMins: number;
}

/**
 * Merge overlapping or contiguous time intervals
 */
export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: TimeInterval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const prev = merged[merged.length - 1];

    if (cur.start <= prev.end) {
      // Overlap or contiguous: merge
      prev.end = Math.max(prev.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }

  return merged;
}

/**
 * Calculate true undeclared / unassigned time for today
 */
export function computeUnassignedTime(params: {
  dailyCardItems?: DailyCardItem[];
  scheduleBlocks?: TimeBlock[];
  dayTemplate?: DayTemplateSlot[];
  todayStr: string;
  nowMins?: number;
  activeTaskId?: string;
}): UnassignedTimeResult {
  const {
    dailyCardItems = [],
    scheduleBlocks = [],
    dayTemplate = [],
    todayStr,
    nowMins = getDeviceTimeMinutes(),
    activeTaskId,
  } = params;

  // 1. Determine wake-up time (default 08:00 / 480 mins)
  const wakeSlot = dayTemplate.find(s => /thức|wake/i.test(s.title));
  const wakeUpMins = wakeSlot ? timeToMinutes(wakeSlot.end || wakeSlot.start) : (8 * 60);

  const rawIntervals: TimeInterval[] = [];

  // 2. Include today's DailyCardItems (done, extended, or open started)
  for (const item of dailyCardItems) {
    if (item.date !== todayStr || item.status === 'dropped') continue;

    // Start time: actual startedAt timestamp if available, else item.start
    let sM: number | null = null;
    const extra = (item.extra as Record<string, unknown> | undefined) || {};
    if (typeof extra.startedAt === 'number') {
      const d = new Date(extra.startedAt);
      sM = d.getHours() * 60 + d.getMinutes();
    } else if (item.start) {
      sM = timeToMinutes(item.start);
    }

    if (sM === null) continue; // Untimed item, skip

    // Estimated duration
    const estM = typeof extra.estimateMins === 'number'
      ? extra.estimateMins
      : (item.start && item.end ? Math.max(5, (timeToMinutes(item.end) - timeToMinutes(item.start) + 1440) % 1440) : 30);

    // End time: saved end if present; if currently running -> nowMins; else sM + estM
    let eM: number;
    const isActivelyRunning = item.id === activeTaskId || (item.status === 'open' && sM <= nowMins && nowMins <= sM + estM);

    if (isActivelyRunning) {
      eM = Math.max(sM + 1, nowMins);
    } else if (item.end) {
      eM = timeToMinutes(item.end);
    } else {
      eM = sM + estM;
    }

    if (eM > sM) {
      rawIntervals.push({
        start: sM,
        end: eM,
        id: item.id,
        title: item.text,
        status: item.status,
      });
    }
  }

  // 3. Include fixed template blocks that have already occurred or are active today
  for (const slot of dayTemplate) {
    if (!slot.start || !slot.end) continue;
    const sM = timeToMinutes(slot.start);
    const eM = timeToMinutes(slot.end);
    if (sM < nowMins && eM > sM) {
      rawIntervals.push({
        start: sM,
        end: Math.min(nowMins, eM),
        id: slot.id,
        title: slot.title,
        status: 'template',
      });
    }
  }

  // 4. Include standalone scheduleBlocks (avoid duplicating dailyCardItems)
  for (const block of scheduleBlocks) {
    if (block.taskSource === 'sticky_day_sheet' || block.status === 'dropped') continue;
    if (!block.startTime) continue;
    const sM = timeToMinutes(block.startTime);
    const eM = block.endTime ? timeToMinutes(block.endTime) : (sM + (block.estimatedMinutes || 30));
    if (sM < nowMins && eM > sM) {
      rawIntervals.push({
        start: sM,
        end: Math.min(nowMins, eM),
        id: block.id,
        title: block.title,
        status: block.status,
      });
    }
  }

  // 5. Merge all overlapping declared intervals
  const mergedDeclaredIntervals = mergeIntervals(rawIntervals);

  // 6. Calculate total unassigned time in the window [wakeUpMins, nowMins]
  let totalDeclaredInWindow = 0;
  for (const iv of mergedDeclaredIntervals) {
    const clampedStart = Math.max(wakeUpMins, iv.start);
    const clampedEnd = Math.min(nowMins, iv.end);
    if (clampedEnd > clampedStart) {
      totalDeclaredInWindow += (clampedEnd - clampedStart);
    }
  }
  const windowDuration = Math.max(0, nowMins - wakeUpMins);
  const unassignedMins = Math.max(0, windowDuration - totalDeclaredInWindow);

  // 7. Find the end of the most recent declared interval ending at or before nowMins
  // PRD v0.3.36 Part A2.2: Đồng hồ "chưa xử lý" đếm từ lúc kết thúc đoạn gần nhất sau khi đã gộp.
  const pastIntervals = mergedDeclaredIntervals.filter(iv => iv.end <= nowMins && iv.end >= wakeUpMins);
  let unassignedStartMins = wakeUpMins;
  if (pastIntervals.length > 0) {
    unassignedStartMins = pastIntervals[pastIntervals.length - 1].end;
  }

  const unassignedStartStr = minutesToTime(unassignedStartMins);
  const elapsedSinceLastDeclaredMins = Math.max(0, nowMins - unassignedStartMins);

  return {
    unassignedMins,
    unassignedStartStr,
    unassignedStartMins,
    elapsedSinceLastDeclaredMins,
    mergedDeclaredIntervals,
    wakeUpMins,
  };
}
