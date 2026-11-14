// TAIO Time App — Day to Close Determination (PRD v0.3.33 Part B)
import type { DailyCardItem, TimeBlock } from '@/types';
import { getDeviceCalendarDate, timeToMinutes } from '@/core/clock';
import { isDayClosed, ClosedDaysMap } from './closedDays';

const VIETNAMESE_WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const ENGLISH_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatDayCloseTitle(dateStr: string, isVi: boolean = true): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, (m || 1) - 1, d || 1);
  const wd = isVi ? VIETNAMESE_WEEKDAYS[dateObj.getDay()] : ENGLISH_WEEKDAYS[dateObj.getDay()];
  if (isVi) {
    return `Khép lại ${wd} ${d}/${m}`;
  }
  return `Wrap Up ${wd} ${m}/${d}`;
}

export function getPreviousDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const prev = new Date(y, (m || 1) - 1, (d || 1) - 1);
  const py = prev.getFullYear();
  const pm = String(prev.getMonth() + 1).padStart(2, '0');
  const pd = String(prev.getDate()).padStart(2, '0');
  return `${py}-${pm}-${pd}`;
}

export function getNextCalendarDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(y, (m || 1) - 1, (d || 1) + 1);
  return getDeviceCalendarDate(next);
}

export interface DayToCloseResult {
  targetDate: string;
  isPastDay: boolean; // targetDate < today
  hasUnfinishedTasks: boolean;
  unfinishedItems: DailyCardItem[];
  allDayItems: DailyCardItem[];
}

/**
 * Finds the most relevant date to close:
 * Returns the nearest unclosed date (from today backwards) that has tasks.
 */
export function findDayToClose(
  dailyCardItems: DailyCardItem[],
  closedDays: ClosedDaysMap,
  today: string = getDeviceCalendarDate()
): DayToCloseResult | null {
  // Collect all distinct dates that have items
  const datesWithItems = Array.from(
    new Set(dailyCardItems.filter(i => i.status !== 'dropped').map(i => i.date))
  ).sort().reverse(); // newest first

  // Look for the most recent date that has items and is not yet closed
  for (const date of datesWithItems) {
    if (date > today) continue; // Skip future dates
    if (!isDayClosed(closedDays, date)) {
      const allDayItems = dailyCardItems.filter(i => i.date === date && i.status !== 'dropped');
      const unfinishedItems = allDayItems.filter(i => i.status !== 'done');
      return {
        targetDate: date,
        isPastDay: date < today,
        hasUnfinishedTasks: unfinishedItems.length > 0,
        unfinishedItems,
        allDayItems,
      };
    }
  }

  return null;
}

/**
 * Determines whether the full Close Day modal should be automatically prompted.
 * PRD v0.3.33 Part B2:
 * 1. If targetDate is a past day: DO NOT auto-prompt full modal (morning StartDayCard handles it).
 * 2. If targetDate is today: only prompt in the evening (after last scheduled task ends, or within 2h of bedtime).
 */
export function shouldAutoPromptCloseModal(
  targetDate: string,
  today: string,
  nowMinutes: number,
  bedtimeMinutes: number = 22 * 60 + 30, // default 22:30
  lastScheduledEndMins?: number
): boolean {
  if (targetDate < today) {
    // Past day: never auto-prompt full modal (Part B2 #4)
    return false;
  }
  if (targetDate > today) return false;

  // For today: only prompt in the evening
  const eveningThreshold = Math.max(bedtimeMinutes - 120, lastScheduledEndMins ?? 20 * 60);
  return nowMinutes >= eveningThreshold;
}
