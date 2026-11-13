// PRD FIX v0.3.30 Part B2: motionStore (Local Device Storage Only)
import { PassiveTimeSuggestion } from '@/types';

const UNCONFIRMED_KEY = 'taio_motion_unconfirmed_v1';
const LAST_QUERY_TS_KEY = 'taio_motion_last_query_ts_v1';
const MOTION_ENABLED_KEY = 'taio_motion_enabled_v1';
const DISMISSED_CARD_KEY = 'taio_motion_dismissed_permission_card_v1';

export function isMotionTrackingEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(MOTION_ENABLED_KEY);
    return raw !== null ? raw === 'true' : true;
  } catch {
    return true;
  }
}

export function setMotionTrackingEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MOTION_ENABLED_KEY, enabled ? 'true' : 'false');
    if (!enabled) {
      clearLocalMotionData();
    }
  } catch {}
}

export function isMotionPermissionCardDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(DISMISSED_CARD_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setMotionPermissionCardDismissed(dismissed: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DISMISSED_CARD_KEY, dismissed ? 'true' : 'false');
  } catch {}
}

export function loadUnconfirmedMotionSuggestions(): PassiveTimeSuggestion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(UNCONFIRMED_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveUnconfirmedMotionSuggestions(items: PassiveTimeSuggestion[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(UNCONFIRMED_KEY, JSON.stringify(items));
  } catch {}
}

export function dismissMotionSuggestion(id: string): void {
  const current = loadUnconfirmedMotionSuggestions();
  const updated = current.filter(item => item.id !== id);
  saveUnconfirmedMotionSuggestions(updated);
}

export function getLastMotionQueryTimestamp(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(LAST_QUERY_TS_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function setLastMotionQueryTimestamp(ts: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_QUERY_TS_KEY, String(ts));
  } catch {}
}

export function clearLocalMotionData(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(UNCONFIRMED_KEY);
    window.localStorage.removeItem(LAST_QUERY_TS_KEY);
  } catch {}
}
