export type PlatformAlarmCapability =
  | 'alarmkit'          // iOS 26+ native AlarmKit
  | 'time_sensitive_ios'// iOS < 26 Time-sensitive local notification (30s)
  | 'alarm_manager'     // Android AlarmManager + Fullscreen Intent
  | 'web_unsupported';  // Web / PWA fallback message

export interface CustomSoundFile {
  name: string;
  uri?: string;         // file path or blob url
  size?: number;
  type?: string;
  dataBase64?: string;  // web / in-app playback copy (kept only for small files, see AlarmSettingsSection)
  nativeSoundName?: string; // v0.3.24: copy imported into the phone (iOS Library/Sounds .caf), used by native alarms
}

export interface AlarmSettings {
  enabled: boolean;
  soundType: 'default' | 'custom';
  customSound?: CustomSoundFile;
  vibrate: boolean;
  volume: number;       // 0 to 1
  snoozeDurationMins: number; // default 5
}

export interface ScheduledAlarm {
  blockId: string;
  blockTitle: string;
  startTime: string; // "14:30"
  date: string;      // "2026-11-09"
  targetTimeMs: number;
  fired: boolean;
  soundUri?: string;
}

export interface ActiveAlarmState {
  isActive: boolean;
  blockId?: string;
  blockTitle?: string;
  startTime?: string;
  soundName?: string;
  isFallbackDefault?: boolean;
  fallbackReason?: string;
}
