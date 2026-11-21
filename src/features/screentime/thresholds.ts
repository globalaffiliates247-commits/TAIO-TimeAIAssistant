// TAIO Time App — Screen Time Threshold Rules (PRD v0.3.53 Part B5)
import type { ScreenTimeThreshold } from './types';
import { getStorageItemSync, setStorageItemSync } from '../../core/storage/durableStorage.ts';

const STORAGE_KEY_THRESHOLDS = 'taio_screentime_thresholds';

export const DEFAULT_THRESHOLDS: ScreenTimeThreshold[] = [
  { id: 'social', appGroup: 'Mạng xã hội (Social Media)', limitMinutes: 45, enabled: true },
  { id: 'entertainment', appGroup: 'Giải trí & Video (Entertainment)', limitMinutes: 60, enabled: true },
];

export function getScreenTimeThresholds(): ScreenTimeThreshold[] {
  return getStorageItemSync<ScreenTimeThreshold[]>(STORAGE_KEY_THRESHOLDS, DEFAULT_THRESHOLDS);
}

export function saveScreenTimeThresholds(thresholds: ScreenTimeThreshold[]): void {
  setStorageItemSync<ScreenTimeThreshold[]>(STORAGE_KEY_THRESHOLDS, thresholds);
}
