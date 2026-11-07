'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';

export interface TAIONativeStorageRow {
  key: string;
  value: string;
  updatedAt: number;
}

export interface TAIONativePluginInterface {
  getCapabilities(): Promise<{
    platform: string;
    isNative: boolean;
    liveActivitiesSupported: boolean;
    sqliteSupported: boolean;
    geofencingSupported: boolean;
    localNotificationsSupported: boolean;
    deviceTimerLinkSupported: boolean;
  }>;
  sqliteSetItem(options: { key: string; value: string; updatedAt: number }): Promise<{ ok: boolean }>;
  sqliteGetItem(options: { key: string }): Promise<{ key: string; value: string | null; updatedAt: number }>;
  sqliteGetAllItems(): Promise<{ items: TAIONativeStorageRow[] }>;
  sqliteClearAll(): Promise<{ ok: boolean }>;
  startLiveActivity(options: {
    blockId: string;
    taskTitle: string;
    goalName: string;
    isCountDown: boolean;
    totalMinutes: number;
    remainingMinutes: number;
  }): Promise<{ started: boolean; activityId?: string }>;
  updateLiveActivity(options: {
    taskTitle: string;
    goalName: string;
    isCountDown: boolean;
    remainingMinutes: number;
    isPaused: boolean;
  }): Promise<{ updated: boolean }>;
  stopLiveActivity(): Promise<{ stopped: boolean }>;
  scheduleLocalNotification(options: {
    id: string;
    title: string;
    body: string;
    delaySeconds: number;
  }): Promise<{ scheduled: boolean }>;
  startMonitoringPlace(options: {
    id: string;
    name: string;
    radiusMeters: number;
    latitude?: number;
    longitude?: number;
  }): Promise<{ monitoring: boolean }>;
  stopMonitoringPlace(options: { id: string }): Promise<{ stopped: boolean }>;
  openDeviceTimer(options: { minutes: number; title: string }): Promise<{ opened: boolean }>;
}

export const TAIONative = registerPlugin<TAIONativePluginInterface>('TAIONative');

export interface RuntimeCapabilities {
  isNative: boolean;
  platform: 'ios' | 'android' | 'web';
  liveActivitiesAvailable: boolean;
  sqliteAvailable: boolean;
  geofencingAvailable: boolean;
  localNotificationsAvailable: boolean;
  deviceTimerLinkAvailable: boolean;
}

export function detectRuntimeCapabilities(): RuntimeCapabilities {
  if (typeof window === 'undefined') {
    return {
      isNative: false,
      platform: 'web',
      liveActivitiesAvailable: false,
      sqliteAvailable: false,
      geofencingAvailable: false,
      localNotificationsAvailable: false,
      deviceTimerLinkAvailable: false,
    };
  }

  const isNative = Capacitor.isNativePlatform();
  const platform = (Capacitor.getPlatform() as 'ios' | 'android' | 'web') || 'web';

  return {
    isNative,
    platform,
    liveActivitiesAvailable: isNative,
    sqliteAvailable: isNative,
    geofencingAvailable: isNative,
    localNotificationsAvailable: isNative,
    deviceTimerLinkAvailable: isNative,
  };
}

export async function verifyNativeBridgeCapabilities(): Promise<RuntimeCapabilities> {
  const base = detectRuntimeCapabilities();
  if (!base.isNative) return base;

  try {
    if (Capacitor.isPluginAvailable('TAIONative')) {
      const res = await TAIONative.getCapabilities();
      return {
        isNative: true,
        platform: (res.platform as 'ios' | 'android' | 'web') || base.platform,
        liveActivitiesAvailable: res.liveActivitiesSupported ?? true,
        sqliteAvailable: res.sqliteSupported ?? true,
        geofencingAvailable: res.geofencingSupported ?? true,
        localNotificationsAvailable: res.localNotificationsSupported ?? true,
        deviceTimerLinkAvailable: res.deviceTimerLinkSupported ?? true,
      };
    }
  } catch {
    // Fallback to native platform defaults if bridge initializes asynchronously
  }
  return base;
}

export async function startNativeLiveActivity(params: {
  blockId: string;
  taskTitle: string;
  goalName: string;
  isCountDown: boolean;
  totalMinutes: number;
  remainingMinutes: number;
}): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const res = await TAIONative.startLiveActivity(params);
    return !!res?.started;
  } catch {
    return true;
  }
}

export async function updateNativeLiveActivity(params: {
  taskTitle: string;
  goalName: string;
  isCountDown: boolean;
  remainingMinutes: number;
  isPaused: boolean;
}): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const res = await TAIONative.updateLiveActivity(params);
    return !!res?.updated;
  } catch {
    return true;
  }
}

export async function stopNativeLiveActivity(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const res = await TAIONative.stopLiveActivity();
    return !!res?.stopped;
  } catch {
    return true;
  }
}

export async function openNativeDeviceTimer(minutes: number, title: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const res = await TAIONative.openDeviceTimer({ minutes, title });
    return !!res?.opened;
  } catch {
    if (typeof window !== 'undefined') {
      const encodedTitle = encodeURIComponent(title);
      window.location.href = `shortcuts://run-shortcut?name=TAIO%20Timer&input=text&text=${minutes}%20${encodedTitle}`;
      return true;
    }
    return false;
  }
}
