// PRD FIX v0.3.30 Part E2: Free Timers Model
export const MAX_FREE_TIMERS = 3;
export const FREE_TIMERS_STORAGE_KEY = 'taio_free_timers_v1';
export const RECENT_FREE_TIMERS_KEY = 'taio_recent_free_timers_v1';

export type FreeTimerMode = 'countdown' | 'stopwatch' | 'at_time';

export interface FreeTimer {
  id: string;
  title: string;
  mode: FreeTimerMode;
  startedAt: number;        // epoch ms
  endsAt?: number;          // epoch ms (for countdown and at_time)
  pausedAt?: number;        // epoch ms if paused
  totalDurationSeconds?: number;
  status: 'running' | 'paused' | 'done';
  createdAt: number;
  linkedBlockId?: string;
  atTimeStr?: string;       // "15:30"
}

export function loadFreeTimers(): FreeTimer[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FREE_TIMERS_STORAGE_KEY);
    if (!raw) return [];
    const list: FreeTimer[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveFreeTimers(timers: FreeTimer[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FREE_TIMERS_STORAGE_KEY, JSON.stringify(timers));
  } catch (err) {
    console.error('[freeTimers] Failed to save free timers', err);
  }
}

export function loadRecentTimerPresets(): string[] {
  if (typeof window === 'undefined') return ['5p', '10p', '25p'];
  try {
    const raw = window.localStorage.getItem(RECENT_FREE_TIMERS_KEY);
    if (!raw) return ['5p', '10p', '25p'];
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.length > 0 ? list.slice(0, 3) : ['5p', '10p', '25p'];
  } catch {
    return ['5p', '10p', '25p'];
  }
}

export function saveRecentTimerPreset(preset: string): void {
  if (typeof window === 'undefined' || !preset.trim()) return;
  try {
    const recents = loadRecentTimerPresets().filter(p => p !== preset);
    const updated = [preset.trim(), ...recents].slice(0, 3);
    window.localStorage.setItem(RECENT_FREE_TIMERS_KEY, JSON.stringify(updated));
  } catch {}
}

export function getFreeTimerRemainingSeconds(timer: FreeTimer, nowMs = Date.now()): number {
  if (timer.mode === 'stopwatch') return 0;
  if (!timer.endsAt) return 0;

  if (timer.status === 'paused' && timer.pausedAt) {
    return Math.max(0, Math.floor((timer.endsAt - timer.pausedAt) / 1000));
  }
  return Math.max(0, Math.floor((timer.endsAt - nowMs) / 1000));
}

export function getFreeTimerElapsedSeconds(timer: FreeTimer, nowMs = Date.now()): number {
  if (timer.status === 'paused' && timer.pausedAt) {
    return Math.max(0, Math.floor((timer.pausedAt - timer.startedAt) / 1000));
  }
  return Math.max(0, Math.floor((nowMs - timer.startedAt) / 1000));
}

export function formatTimerSeconds(sec: number): string {
  const absSec = Math.max(0, Math.floor(sec));
  const h = Math.floor(absSec / 3600);
  const m = Math.floor((absSec % 3600) / 60);
  const s = absSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
