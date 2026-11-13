import { AlarmSettings, ActiveAlarmState, PlatformAlarmCapability, CustomSoundFile } from './alarmTypes';
import { TimeBlock } from '@/types';
import { timeToMinutes, getDeviceCalendarDate } from '@/core/clock';
import { playDefaultChime as playChimeFromSession, stopRingSessionAudio } from './ringSession';

const ALARM_SETTINGS_KEY = 'taio_alarm_settings_v1';

export const DEFAULT_ALARM_SETTINGS: AlarmSettings = {
  enabled: true,
  soundType: 'default',
  vibrate: true,
  volume: 0.8,
  snoozeDurationMins: 5,
};

export function loadAlarmSettings(): AlarmSettings {
  if (typeof window === 'undefined') return DEFAULT_ALARM_SETTINGS;
  try {
    const raw = localStorage.getItem(ALARM_SETTINGS_KEY);
    if (!raw) return DEFAULT_ALARM_SETTINGS;
    return { ...DEFAULT_ALARM_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ALARM_SETTINGS;
  }
}

export function saveAlarmSettings(settings: AlarmSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ALARM_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('[alarmScheduler] Failed to save alarm settings', err);
  }
}

/**
 * Detect runtime capability for block alarms (PRD B32)
 */
export function getPlatformAlarmCapability(): {
  capability: PlatformAlarmCapability;
  description: string;
} {
  if (typeof window === 'undefined') {
    return { capability: 'web_unsupported', description: 'Chỉ có trên bản cài đặt' };
  }

  const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
  const ua = navigator.userAgent || '';
  const isIOS = isNative && /iPad|iPhone|iPod/.test(ua);
  const isAndroid = isNative && /Android/.test(ua);

  if (isIOS) {
    // Check iOS version for AlarmKit (iOS 26+)
    const match = ua.match(/OS (\d+)_/);
    const majorVersion = match ? parseInt(match[1], 10) : 18;
    if (majorVersion >= 26) {
      return {
        capability: 'alarmkit',
        description: 'Báo thức toàn màn hình chuẩn hệ thống (AlarmKit)',
      };
    }
    return {
      capability: 'time_sensitive_ios',
      description: 'Thông báo khẩn cấp có chuông (iOS giới hạn 30 giây)',
    };
  }

  if (isAndroid) {
    return {
      capability: 'alarm_manager',
      description: 'Báo thức toàn màn hình (AlarmManager)',
    };
  }

  return {
    capability: 'web_unsupported',
    description: 'Chỉ có trên bản cài đặt (Web hỗ trợ chuông khi mở app)',
  };
}

let activeAudioElement: HTMLAudioElement | null = null;
let activeAudioContext: AudioContext | null = null;
let activeOscillatorInterval: any = null;

export function stopAllAlarmSounds(): void {
  stopRingSessionAudio();
  if (activeOscillatorInterval) {
    clearInterval(activeOscillatorInterval);
    activeOscillatorInterval = null;
  }
  if (activeAudioContext) {
    try {
      activeAudioContext.close();
    } catch {}
    activeAudioContext = null;
  }
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {}
    activeAudioElement = null;
  }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(0);
    } catch {}
  }
}

/**
 * Triggers vibration pattern if supported
 */
export function startVibration(): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([600, 300, 600, 300, 1000]);
    } catch {}
  }
}

export interface SoundTriggerResult {
  isFallbackDefault: boolean;
  fallbackReason?: string;
}

/**
 * Play selected sound (custom audio file or default chime).
 * If custom sound fails, immediately fallback to default and report warning (PRD B32).
 */
export async function triggerAlarmSound(
  settings: AlarmSettings
): Promise<SoundTriggerResult> {
  stopAllAlarmSounds();

  if (settings.vibrate) {
    startVibration();
  }

  // If user selected custom sound
  if (settings.soundType === 'custom' && settings.customSound) {
    const sound = settings.customSound;
    const sourceUrl = sound.dataBase64 || sound.uri;

    if (!sourceUrl && sound.nativeSoundName) {
      // Large file kept only on the phone: the native alarm plays it; in-app we use the chime.
      playChimeFromSession(settings.volume);
      return { isFallbackDefault: false };
    }

    if (!sourceUrl) {
      // Missing file -> fallback default
      playChimeFromSession(settings.volume);
      return {
        isFallbackDefault: true,
        fallbackReason: `Không tìm thấy file âm thanh “${sound.name}” — đã dùng chuông mặc định. Chọn lại?`,
      };
    }

    try {
      const audio = new Audio(sourceUrl);
      audio.volume = settings.volume;
      audio.loop = true;
      activeAudioElement = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      return { isFallbackDefault: false };
    } catch (err) {
      console.warn('[alarmScheduler] Custom sound playback failed, falling back to default', err);
      playChimeFromSession(settings.volume);
      return {
        isFallbackDefault: true,
        fallbackReason: `Không tìm thấy hoặc không thể mở file âm thanh “${sound.name}” — đã dùng chuông mặc định. Chọn lại?`,
      };
    }
  }

  // Default sound
  playChimeFromSession(settings.volume);
  return { isFallbackDefault: false };
}

// v0.3.24: native scheduling moved to ./nativeAlarmSync.ts (the old window.TAIONative call never reached iOS).
