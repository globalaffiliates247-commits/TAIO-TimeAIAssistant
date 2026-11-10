// PRD v0.3.24 (B32): keep the phone's native alarms in step with today's plan.
// Called whenever blocks or alarm settings change and when the app returns to the foreground.
// The phone then rings at block start even when TAIO is closed or the screen is locked.
import { TimeBlock } from '@/types';
import { getDeviceNow, timeToMinutes } from '@/core/clock';
import { AlarmSettings } from './alarmTypes';
import {
  scheduleNativeBlockAlarms,
  cancelNativeBlockAlarms,
} from '../../native/alarmBridge';
import type { NativeBlockAlarm } from '../../native';

export type NativeAlarmMode = 'none' | 'alarmkit' | 'notification';

export interface NativeAlarmSyncResult {
  mode: NativeAlarmMode;
  scheduled: number;
  soundMissing: boolean;
  alarmKitDenied: boolean;
}

const OPEN_STATUSES = new Set(['planned', 'unconfirmed']);

/** Upcoming block starts for today (device clock), skipping finished or dropped blocks. */
export function buildUpcomingAlarms(blocks: TimeBlock[], now: Date = getDeviceNow()): NativeBlockAlarm[] {
  const nowMs = now.getTime();
  return blocks
    .filter(b => b.startTime && OPEN_STATUSES.has(b.status))
    .map(b => {
      const mins = timeToMinutes(b.startTime);
      const fire = new Date(now);
      fire.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
      return {
        id: b.id,
        title: b.title,
        body: `${b.startTime}–${b.endTime}${b.goalName ? ' · ' + b.goalName : ''}`,
        fireAt: fire.getTime(),
      };
    })
    .filter(a => a.fireAt > nowMs + 30_000);
}

export async function syncNativeBlockAlarms(
  blocks: TimeBlock[],
  settings: AlarmSettings
): Promise<NativeAlarmSyncResult> {
  const empty: NativeAlarmSyncResult = { mode: 'none', scheduled: 0, soundMissing: false, alarmKitDenied: false };
  if (!settings.enabled) {
    await cancelNativeBlockAlarms();
    return empty;
  }
  const soundName =
    settings.soundType === 'custom' ? settings.customSound?.nativeSoundName : undefined;
  const res = await scheduleNativeBlockAlarms(buildUpcomingAlarms(blocks), soundName);
  if (!res || !res.ok) return empty;
  return {
    mode: res.mode ?? 'notification',
    scheduled: res.scheduled ?? 0,
    soundMissing: !!res.soundMissing,
    alarmKitDenied: !!res.alarmKitDenied,
  };
}
