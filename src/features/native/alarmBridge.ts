'use client';
// PRD v0.3.24 (B32): typed wrappers for the native alarm methods.
// v0.3.22 called `window.TAIONative.scheduleAlarm`, which never exists in Capacitor,
// so no alarm ever reached iOS. All calls now go through the registered plugin.
import { Capacitor } from '@capacitor/core';
import { TAIONative, NativeBlockAlarm, NativeAlarmScheduleResult } from './index';

const isNative = () => typeof window !== 'undefined' && Capacitor.isNativePlatform();

export async function nativeAlarmKitAvailable(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    return !!(await TAIONative.getAlarmCapability()).alarmKit;
  } catch {
    return false;
  }
}

/** Copy a picked audio file into the app (iOS: converted to .caf, max 30 s). */
export async function importNativeAlarmSound(
  name: string,
  dataBase64: string,
  startSeconds = 0
): Promise<{ ok: boolean; soundName?: string; seconds?: number; error?: string }> {
  if (!isNative()) return { ok: false, error: 'web' };
  try {
    return await TAIONative.importAlarmSound({ name, dataBase64, startSeconds });
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function nativeAlarmSoundExists(soundName: string): Promise<boolean> {
  if (!isNative() || !soundName) return false;
  try {
    return !!(await TAIONative.hasAlarmSound({ soundName })).exists;
  } catch {
    return false;
  }
}

/** Replace every scheduled TAIO alarm on the device with `alarms`. */
export async function scheduleNativeBlockAlarms(
  alarms: NativeBlockAlarm[],
  soundName?: string
): Promise<NativeAlarmScheduleResult | null> {
  if (!isNative()) return null;
  try {
    return await TAIONative.scheduleBlockAlarms({ alarms, soundName });
  } catch (err) {
    console.warn('[alarmBridge] scheduleBlockAlarms failed', err);
    return null;
  }
}

export async function cancelNativeBlockAlarms(): Promise<void> {
  if (!isNative()) return;
  try {
    await TAIONative.cancelBlockAlarms();
  } catch {
    /* nothing scheduled */
  }
}
