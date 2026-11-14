// PRD B24 v0.3.25: per-device sync settings and live status (tiny store, no dependency).
import { useSyncExternalStore } from 'react';

const KEY = 'taio_sync_v1';

export interface SyncSettings {
  code?: string;          // never sent anywhere
  spaceId?: string;       // SHA-256 of the code
  deviceId: string;
  deviceName: string;
  joinPending?: boolean;  // just joined: first pull replaces local data
  lastPushHash?: string;
  seen: Record<string, number>; // other device -> last applied snapshot time
  devices: Array<{ id: string; name: string; ts: number }>;
}

export interface SyncStatus {
  state: 'off' | 'idle' | 'syncing' | 'error';
  message?: string;
  lastSyncAt?: number;
  sentJournal?: number;
  receivedJournal?: number;
  isMismatched?: boolean;
}

function defaultName(): string {
  if (typeof navigator === 'undefined') return 'Thiết bị';
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Electron|Macintosh/.test(ua)) return 'Mac';
  if (/Android/.test(ua)) return 'Android';
  return 'Trình duyệt';
}

function load(): SyncSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { seen: {}, devices: [], ...JSON.parse(raw) };
  } catch { /* fall through */ }
  const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return { deviceId: id, deviceName: defaultName(), seen: {}, devices: [] };
}

let settings: SyncSettings | null = null;
let status: SyncStatus = { state: 'off' };
let snapshot = { settings: null as SyncSettings | null, status };
const listeners = new Set<() => void>();
const emit = () => { snapshot = { settings, status }; listeners.forEach(l => l()); };

export function getSyncSettings(): SyncSettings {
  if (!settings) { settings = load(); persist(); }
  return settings;
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}
export function updateSyncSettings(patch: Partial<SyncSettings>) {
  settings = { ...getSyncSettings(), ...patch };
  persist();
  emit();
}
export function setSyncStatus(next: SyncStatus) {
  status = next;
  emit();
}

export function useSyncState() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => { if (!snapshot.settings && typeof window !== 'undefined') { getSyncSettings(); snapshot = { settings, status }; } return snapshot; },
    () => snapshot
  );
}

export function getSyncStatus(): SyncStatus {
  return status;
}
