import { useState, useEffect } from 'react';
import { BlockStatus, TimeBlock } from '@/types';

/**
 * Single source of truth for device clock, local calendar dates,
 * dynamic block status computation, and non-past slot finding (PRD v0.3.22 - B31).
 */

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const norm = Math.max(0, Math.min(24 * 60 - 1, Math.floor(minutes)));
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getDeviceNow(): Date {
  return new Date();
}

export function getDeviceTimeMinutes(d: Date = getDeviceNow()): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function getDeviceTimeString(d: Date = getDeviceNow()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Return YYYY-MM-DD according to local device calendar (NOT UTC!).
 * In GMT+7, toISOString().split('T')[0] would mistakenly shift back to previous date before 07:00 AM.
 */
export function getDeviceCalendarDate(d: Date = getDeviceNow()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const VIETNAMESE_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function getWeekdayShort(d: Date = getDeviceNow()): string {
  return VIETNAMESE_WEEKDAYS[d.getDay()];
}

/**
 * e.g. "Hôm nay · T2 9/11"
 */
export function getTodayLabelWithWeekday(d: Date = getDeviceNow()): string {
  const weekday = getWeekdayShort(d);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return `Hôm nay · ${weekday} ${day}/${month}`;
}

/**
 * e.g. "Tuần này · 9–15/11" (Monday through Sunday)
 */
export function getWeekLabelWithRange(d: Date = getDeviceNow()): string {
  const current = new Date(d);
  const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday
  // In VN, week starts on Monday
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mDay = monday.getDate();
  const sDay = sunday.getDate();
  const sMonth = sunday.getMonth() + 1;

  if (monday.getMonth() === sunday.getMonth()) {
    return `Tuần này · ${mDay}–${sDay}/${sMonth}`;
  }
  const mMonth = monday.getMonth() + 1;
  return `Tuần này · ${mDay}/${mMonth}–${sDay}/${sMonth}`;
}

/**
 * Dynamic block status (PRD B31):
 * Never stored; computed dynamically from device clock.
 * User outcomes (done, partly_done, dropped) are preserved.
 */
export function computeBlockStatus(
  block: {
    startTime: string;
    endTime: string;
    status?: BlockStatus;
    timeboxEndOutcome?: string;
  },
  nowMinutes: number = getDeviceTimeMinutes()
): BlockStatus {
  // If user explicitly checked in, respect user outcome
  if (block.timeboxEndOutcome === 'done_on_time' || block.timeboxEndOutcome === 'done_over_time') {
    return 'done';
  }
  if (block.status === 'done' || block.status === 'partly_done' || block.status === 'dropped') {
    return block.status;
  }

  const start = timeToMinutes(block.startTime);
  const end = timeToMinutes(block.endTime);

  if (nowMinutes < start) {
    return 'planned';
  }
  if (nowMinutes >= start && nowMinutes < end) {
    return 'in_progress';
  }
  // nowMinutes >= end and not checked in
  return 'unconfirmed';
}

export function getBlockStatusDisplay(status: BlockStatus): {
  label: string;
  badgeClass: string;
  dotColor: string;
} {
  switch (status) {
    case 'in_progress':
      return {
        label: '● Đang diễn ra',
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
        dotColor: 'bg-emerald-500',
      };
    case 'unconfirmed':
      return {
        label: 'Chờ xác nhận',
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
        dotColor: 'bg-amber-500',
      };
    case 'done':
      return {
        label: 'Đã xong',
        badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200 dark:border-teal-800',
        dotColor: 'bg-teal-500',
      };
    case 'partly_done':
      return {
        label: 'Xong 1 phần',
        badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
        dotColor: 'bg-blue-500',
      };
    case 'dropped':
      return {
        label: 'Chưa làm',
        badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
        dotColor: 'bg-rose-500',
      };
    case 'extended':
      return {
        label: 'Đã gia hạn',
        badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
        dotColor: 'bg-indigo-500',
      };
    case 'planned':
    default:
      return {
        label: 'Sắp tới',
        badgeClass: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700',
        dotColor: 'bg-zinc-400',
      };
  }
}

export interface SlotFinderOptions {
  durationMins: number;
  blocks: TimeBlock[];
  nowMinutes?: number;
  bedtime?: string; // default "23:00"
  earliestTomorrow?: string; // default "08:00"
}

export interface SlotFinderResult {
  found: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
  tomorrowEarliest?: string;
}

/**
 * Finds next free slot today.
 * PRD B31 Rule: NEVER suggest past hours. Minimum start = now + 5 min (rounded up to 5 min).
 * If today has no slots before bedtime:
 * return { found: false, reason: "Hôm nay đã hết khung trống", tomorrowEarliest: "08:00" }.
 */
export function findNextFreeSlot({
  durationMins,
  blocks,
  nowMinutes = getDeviceTimeMinutes(),
  bedtime = '23:00',
  earliestTomorrow = '08:00',
}: SlotFinderOptions): SlotFinderResult {
  const duration = Math.max(15, durationMins || 30);
  // Min start is now + 5 minutes, rounded up to next 5-min mark
  const earliestPossible = Math.ceil((nowMinutes + 5) / 5) * 5;
  const bedtimeMinutes = timeToMinutes(bedtime);

  // If already past bedtime or not enough room before bedtime
  if (earliestPossible + duration > bedtimeMinutes) {
    return {
      found: false,
      reason: 'Hôm nay đã hết khung trống',
      tomorrowEarliest: earliestTomorrow,
    };
  }

  // Sort existing blocks by start time
  const sortedBlocks = [...blocks]
    .map((b) => ({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
    }))
    .filter((b) => b.end > earliestPossible)
    .sort((a, b) => a.start - b.start);

  let candidateStart = earliestPossible;

  for (const b of sortedBlocks) {
    // If candidate slot finishes before this block starts, we found a free slot!
    if (candidateStart + duration <= b.start) {
      if (candidateStart + duration <= bedtimeMinutes) {
        return {
          found: true,
          startTime: minutesToTime(candidateStart),
          endTime: minutesToTime(candidateStart + duration),
        };
      }
    }
    // Otherwise advance candidateStart past this block
    if (b.end > candidateStart) {
      // align to 5 mins
      candidateStart = Math.ceil(b.end / 5) * 5;
    }
  }

  // After all blocks, check if there's room before bedtime
  if (candidateStart + duration <= bedtimeMinutes) {
    return {
      found: true,
      startTime: minutesToTime(candidateStart),
      endTime: minutesToTime(candidateStart + duration),
    };
  }

  return {
    found: false,
    reason: 'Hôm nay đã hết khung trống',
    tomorrowEarliest: earliestTomorrow,
  };
}

/**
 * Hook to keep live clock synchronized across the application.
 * Updates every minute and instantly on tab visibility / focus.
 */
export function useDeviceClock() {
  const [now, setNow] = useState<Date>(() => getDeviceNow());

  useEffect(() => {
    const update = () => setNow(getDeviceNow());

    // Update immediately on mount
    update();

    // Check every 15 seconds to ensure we hit minute transitions promptly
    const interval = setInterval(update, 15000);

    const onVisibilityOrFocus = () => {
      if (!document.hidden) {
        update();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
    };
  }, []);

  const nowMinutes = getDeviceTimeMinutes(now);
  const timeString = getDeviceTimeString(now);
  const calendarDate = getDeviceCalendarDate(now);
  const todayLabel = getTodayLabelWithWeekday(now);
  const weekLabel = getWeekLabelWithRange(now);

  return {
    now,
    nowMinutes,
    timeString,
    calendarDate,
    todayLabel,
    weekLabel,
  };
}
