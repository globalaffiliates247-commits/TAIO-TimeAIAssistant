'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';

export interface TAIONativeStorageRow {
  key: string;
  value: string;
  updatedAt: number;
}

export interface NativeBlockAlarm {
  id: string;
  title: string;
  body: string;
  fireAt: number; // epoch ms
}

export interface NativeAlarmScheduleResult {
  ok: boolean;
  mode?: 'alarmkit' | 'notification';
  scheduled?: number;
  soundMissing?: boolean;
  alarmKitDenied?: boolean;
  reason?: string;
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
  sqliteGetAll(): Promise<{ items: TAIONativeStorageRow[] }>;
  sqliteClearAll(): Promise<{ ok: boolean }>;
  startLiveActivity(options: {
    blockId: string;
    taskTitle: string;
    goalName: string;
    isCountDown: boolean;
    totalMinutes: number;
    remainingMinutes: number;
    startTimestamp?: number;
    targetTimestamp?: number;
  }): Promise<{ ok: boolean; started?: boolean; activityId?: string; error?: string; message?: string }>;
  updateLiveActivity(options: {
    taskTitle: string;
    goalName: string;
    isCountDown: boolean;
    remainingMinutes: number;
    isPaused: boolean;
    totalMinutes?: number;
    startTimestamp?: number;
    targetTimestamp?: number;
  }): Promise<{ ok: boolean; updated?: boolean; error?: string; message?: string }>;
  stopLiveActivity(): Promise<{ ok: boolean }>;
  openAppSettings(): Promise<{ ok?: boolean; opened: boolean }>;
  // v0.3.24: names now match the Swift plugin (TAIONativePlugin.swift)
  scheduleNotification(options: {
    id: string;
    title: string;
    body: string;
    delaySeconds: number;
  }): Promise<{ scheduled: boolean }>;
  registerGeofence(options: {
    id: string;
    name: string;
    radiusMeters: number;
    latitude?: number;
    longitude?: number;
  }): Promise<{ ok: boolean; regionId?: string }>;
  removeGeofence(options: { id: string }): Promise<{ ok: boolean }>;
  openDeviceTimer(options: { minutes: number; title: string }): Promise<{ opened: boolean }>;
  // B32 block-start alarms (TAIONativePlugin+Alarm.swift); wrappers in ./alarmBridge.ts
  importAlarmSound(options: { name: string; dataBase64: string; startSeconds?: number }): Promise<{ ok: boolean; soundName?: string; seconds?: number; error?: string }>;
  hasAlarmSound(options: { soundName: string }): Promise<{ exists: boolean }>;
  scheduleBlockAlarms(options: { alarms: NativeBlockAlarm[]; soundName?: string }): Promise<NativeAlarmScheduleResult>;
  cancelBlockAlarms(): Promise<{ ok: boolean }>;
  getAlarmCapability(): Promise<{ alarmKit: boolean }>;
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

export interface LiveActivityResult {
  ok: boolean;
  started?: boolean;
  updated?: boolean;
  error?: string;
  message?: string;
}

export async function startNativeLiveActivity(params: {
  blockId: string;
  taskTitle: string;
  goalName: string;
  isCountDown: boolean;
  totalMinutes: number;
  remainingMinutes: number;
  startTimestamp?: number; // In seconds
  targetTimestamp?: number; // In seconds
}): Promise<LiveActivityResult> {
  if (!Capacitor.isNativePlatform()) return { ok: false, error: 'not_native' };
  try {
    const res = await TAIONative.startLiveActivity(params);
    if (!res?.ok) console.warn('[native] Live Activity not started:', res?.error, res?.message);
    return {
      ok: !!res?.ok,
      started: !!res?.started,
      error: res?.error,
      message: res?.message
    };
  } catch (err: any) {
    console.warn('[native] startLiveActivity failed', err);
    return { ok: false, error: 'exception', message: err?.message || String(err) };
  }
}

export async function updateNativeLiveActivity(params: {
  taskTitle: string;
  goalName: string;
  isCountDown: boolean;
  remainingMinutes: number;
  isPaused: boolean;
  totalMinutes?: number;
  startTimestamp?: number; // In seconds
  targetTimestamp?: number; // In seconds
}): Promise<LiveActivityResult> {
  if (!Capacitor.isNativePlatform()) return { ok: false, error: 'not_native' };
  try {
    const res = await TAIONative.updateLiveActivity(params);
    return {
      ok: !!res?.ok,
      updated: !!res?.updated,
      error: res?.error,
      message: res?.message
    };
  } catch (err: any) {
    return { ok: false, error: 'exception', message: err?.message || String(err) };
  }
}

export async function stopNativeLiveActivity(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const res = await TAIONative.stopLiveActivity();
    return !!res?.ok;
  } catch {
    return false;
  }
}

export async function openNativeAppSettings(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const res = await TAIONative.openAppSettings();
    return !!res?.opened;
  } catch {
    return false;
  }
}

export async function scheduleNativeNotification(params: {
  id: string;
  title: string;
  body: string;
  delaySeconds: number;
}): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const res = await TAIONative.scheduleNotification(params);
    return !!res?.scheduled;
  } catch {
    return false;
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
