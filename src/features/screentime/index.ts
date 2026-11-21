// TAIO Time App — Screen Time Single Gateway (PRD v0.3.53 Part B1 & B2)
import type { ScreenTimeStatus, ScreenTimeThreshold, ScreenTimeAlert } from './types';
import { getScreenTimeThresholds, saveScreenTimeThresholds } from './thresholds';
import { getStorageItemSync, setStorageItemSync } from '../../core/storage/durableStorage.ts';

export * from './types';
export * from './thresholds';
export { ScreenTimeSettingsSection } from './ui/ScreenTimeSettingsSection';

const STORAGE_KEY_ENABLED = 'taio_screentime_enabled';

/**
 * Checks overall status of Family Controls / Screen Time capability.
 * Safely returns 'unavailable', 'notAuthorized', or 'ok'. Never throws.
 */
export async function getScreenTimeStatus(): Promise<ScreenTimeStatus> {
  try {
    if (typeof window === 'undefined') return 'unavailable';

    const win = window as any;
    if (win?.Capacitor?.isNativePlatform?.() && win?.Capacitor?.Plugins?.TAIOScreenTimePlugin) {
      const res = await win.Capacitor.Plugins.TAIOScreenTimePlugin.getStatus();
      return (res?.status as ScreenTimeStatus) || 'unavailable';
    }

    // On non-iOS / web desktop environment
    return 'unavailable';
  } catch (_) {
    return 'unavailable';
  }
}

/**
 * Requests authorization from user. Only called when user explicitly toggles on.
 * Never throws.
 */
export async function requestScreenTimeAuthorization(): Promise<ScreenTimeStatus> {
  try {
    if (typeof window === 'undefined') return 'unavailable';

    const win = window as any;
    if (win?.Capacitor?.isNativePlatform?.() && win?.Capacitor?.Plugins?.TAIOScreenTimePlugin) {
      const res = await win.Capacitor.Plugins.TAIOScreenTimePlugin.requestAuthorization();
      const status = (res?.status as ScreenTimeStatus) || 'notAuthorized';
      if (status === 'ok') {
        setScreenTimeEnabled(true);
      }
      return status;
    }

    return 'unavailable';
  } catch (_) {
    return 'unavailable';
  }
}

export function isScreenTimeEnabled(): boolean {
  return getStorageItemSync<boolean>(STORAGE_KEY_ENABLED, false);
}

export function setScreenTimeEnabled(enabled: boolean): void {
  setStorageItemSync<boolean>(STORAGE_KEY_ENABLED, enabled);
}

/**
 * Returns active alerts if threshold is exceeded.
 */
export function getActiveScreenTimeAlerts(): ScreenTimeAlert[] {
  if (!isScreenTimeEnabled()) return [];
  return getStorageItemSync<ScreenTimeAlert[]>('taio_screentime_alerts', []);
}
