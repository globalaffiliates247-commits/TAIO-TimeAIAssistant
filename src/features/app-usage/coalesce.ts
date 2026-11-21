// TAIO Time App — Coalesce Short App Usage Intervals (PRD v0.3.53 Part A3)
import type { AppUsageRecord } from './types';

/**
 * Coalesces records shorter than 10 seconds into the preceding record
 * if they share the same date and context.
 */
export function coalesceAppUsageRecords(records: AppUsageRecord[]): AppUsageRecord[] {
  if (records.length <= 1) return [...records];

  const result: AppUsageRecord[] = [];

  for (const current of records) {
    if (result.length === 0) {
      result.push({ ...current });
      continue;
    }

    const prev = result[result.length - 1];

    // If current duration is strictly under 10 seconds, merge it into the previous record
    if (current.durationSeconds < 10 && prev.date === current.date) {
      prev.endTime = current.endTime;
      prev.durationSeconds += current.durationSeconds;
    } else {
      result.push({ ...current });
    }
  }

  return result;
}
