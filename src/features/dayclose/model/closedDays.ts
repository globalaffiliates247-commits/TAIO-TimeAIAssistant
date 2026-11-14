// TAIO Time App — Closed Days Store & Helpers (PRD v0.3.33 Part B)
import { getDeviceCalendarDate } from '@/core/clock';

export interface ClosedDayRecord {
  date: string; // YYYY-MM-DD
  closedAt: number; // epoch ms
  method: 'manual' | 'auto';
}

export type ClosedDaysMap = Record<string, ClosedDayRecord>;

export const CLOSED_DAYS_STORAGE_KEY = 'taio_closed_days';

export function isDayClosed(closedDays: ClosedDaysMap, date: string): boolean {
  return !!closedDays[date];
}

export function markDayClosed(
  current: ClosedDaysMap,
  date: string,
  method: 'manual' | 'auto' = 'manual'
): ClosedDaysMap {
  return {
    ...current,
    [date]: {
      date,
      closedAt: Date.now(),
      method,
    },
  };
}
