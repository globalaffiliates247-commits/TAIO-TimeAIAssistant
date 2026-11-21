// TAIO Time App — App Usage Store & Persistence (PRD v0.3.53 Part A)
import type { AppUsageRecord, AppUsageSettings } from './types';
import { DEFAULT_APP_USAGE_SETTINGS } from './types';
import { coalesceAppUsageRecords } from './coalesce';
import { getStorageItemSync, setStorageItemSync, removeStorageItemSync } from '../../core/storage/durableStorage.ts';

const STORAGE_KEY_RECORDS = 'taio_app_usage';
const STORAGE_KEY_SETTINGS = 'taio_app_usage_settings';

let memoryBuffer: AppUsageRecord[] = [];
let flushTimer: any = null;

export function getAppUsageSettings(): AppUsageSettings {
  return getStorageItemSync<AppUsageSettings>(STORAGE_KEY_SETTINGS, DEFAULT_APP_USAGE_SETTINGS);
}

export function setAppUsageSettings(settings: Partial<AppUsageSettings>): void {
  const current = getAppUsageSettings();
  const updated = { ...current, ...settings };
  setStorageItemSync<AppUsageSettings>(STORAGE_KEY_SETTINGS, updated);
}

export function getAllAppUsageRecords(): AppUsageRecord[] {
  const stored = getStorageItemSync<AppUsageRecord[]>(STORAGE_KEY_RECORDS, []);
  return coalesceAppUsageRecords([...stored, ...memoryBuffer]);
}

export function getAppUsageForDate(date: string): AppUsageRecord[] {
  return getAllAppUsageRecords().filter(r => r.date === date);
}

export function recordAppUsage(record: Omit<AppUsageRecord, 'id'>): void {
  const settings = getAppUsageSettings();
  if (!settings.enabled) return;

  // Check ignored apps
  if (record.appName && settings.ignoredApps.includes(record.appName)) return;
  if (record.bundleId && settings.ignoredApps.includes(record.bundleId)) return;

  const newRecord: AppUsageRecord = {
    ...record,
    id: `usage-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  };

  memoryBuffer.push(newRecord);

  // Setup periodic flush every 60s (Part A3)
  if (!flushTimer && typeof window !== 'undefined') {
    flushTimer = setTimeout(() => {
      flushAppUsageBuffer();
    }, 60000);
  }
}

export function flushAppUsageBuffer(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (memoryBuffer.length === 0) return;

  const existing = getStorageItemSync<AppUsageRecord[]>(STORAGE_KEY_RECORDS, []);
  const merged = coalesceAppUsageRecords([...existing, ...memoryBuffer]);
  setStorageItemSync<AppUsageRecord[]>(STORAGE_KEY_RECORDS, merged.slice(-5000));
  memoryBuffer = [];
}

export function clearAllAppUsage(): void {
  memoryBuffer = [];
  removeStorageItemSync(STORAGE_KEY_RECORDS);
}

/**
 * Calculates total unaccounted seconds ("thời gian không ai biết")
 * where user left TAIO.CLUB while the task clock was stopped.
 */
export function getUnaccountedSeconds(date: string): number {
  const records = getAppUsageForDate(date);
  return records
    .filter(r => r.state === 'left_clock_stopped')
    .reduce((sum, r) => sum + r.durationSeconds, 0);
}

/**
 * Returns Top N apps by total duration on a specific date.
 */
export function getTopAppsUsage(date: string, limit = 5): Array<{ appName: string; bundleId: string; totalSeconds: number }> {
  const records = getAppUsageForDate(date);
  const appMap = new Map<string, { appName: string; bundleId: string; totalSeconds: number }>();

  for (const r of records) {
    if (!r.appName || r.appName === 'TAIO.CLUB') continue;
    const key = r.bundleId || r.appName;
    const current = appMap.get(key) || { appName: r.appName, bundleId: r.bundleId, totalSeconds: 0 };
    current.totalSeconds += r.durationSeconds;
    appMap.set(key, current);
  }

  return Array.from(appMap.values())
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .slice(0, limit);
}
