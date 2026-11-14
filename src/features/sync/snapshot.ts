// PRD B24 v0.3.25: give every record in a taio-time-export payload a reliable `updatedAt`
// so that the import merge (newest wins, per item) works between devices.
// Many edits in the app do not stamp updatedAt, so we detect changes by content hash:
//   unchanged content -> keep the known time; changed content -> its own updatedAt if newer
//   (came from another device), otherwise "now" (edited here).
import type { TaioExportV1 } from '../data-transfer';

const TRACKER_KEY = 'taio_sync_tracker_v1';
type Tracker = Record<string, { h: string; ts: number }>;

function loadTracker(): Tracker {
  try { return JSON.parse(localStorage.getItem(TRACKER_KEY) || '{}'); } catch { return {}; }
}
function saveTracker(t: Tracker) {
  try { localStorage.setItem(TRACKER_KEY, JSON.stringify(t)); } catch { /* quota: next run re-learns */ }
}

// Small, fast, non-crypto hash (FNV-1a) of an object without its updatedAt.
function contentHash(obj: Record<string, unknown>): string {
  const { updatedAt: _ignored, ...rest } = obj;
  const s = JSON.stringify(rest);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16);
}

function toMs(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const p = Date.parse(v); return Number.isNaN(p) ? 0 : p; }
  return 0;
}

const SECTIONS = ['goals', 'projects', 'lists', 'tasks', 'dayTemplate', 'days', 'journalItems'] as const;

/** Returns a copy of `payload` where every record carries updatedAt (epoch ms). */
export function stampPayload(payload: TaioExportV1, now = Date.now()): TaioExportV1 {
  const prev = loadTracker();
  const next: Tracker = {};
  const stamp = (key: string, obj: Record<string, unknown>): Record<string, unknown> => {
    const h = contentHash(obj);
    const own = toMs(obj.updatedAt);
    const p = prev[key];
    let ts: number;
    if (!p) ts = own || 1;                       // first time seen: its own stamp, or "very old"
    else if (p.h === h) ts = Math.max(p.ts, own);
    else ts = own > p.ts ? own : now;            // newer stamp = arrived from another device
    next[key] = { h, ts };
    return { ...obj, updatedAt: ts };
  };

  const out: TaioExportV1 = { ...payload };
  for (const section of SECTIONS) {
    const arr = payload[section];
    if (!Array.isArray(arr)) continue;
    out[section] = arr.map((raw) => {
      if (!raw || typeof raw !== 'object') return raw;
      const obj = raw as Record<string, unknown>;
      const id = section === 'days' ? obj.date : obj.id;
      if (typeof id !== 'string') return obj;
      let stamped = stamp(`${section}:${id}`, obj);
      if (section === 'lists' && Array.isArray(obj.items)) {
        stamped = {
          ...stamped,
          items: obj.items.map((it) =>
            it && typeof it === 'object' && typeof (it as Record<string, unknown>).id === 'string'
              ? stamp(`items:${(it as Record<string, unknown>).id}`, it as Record<string, unknown>)
              : it
          ),
        };
      }
      return stamped;
    });
  }
  saveTracker(next);
  return out;
}

/** Hash of the whole payload, ignoring exportedAt, to skip pushes when nothing changed. */
export function payloadFingerprint(payload: TaioExportV1): string {
  const { exportedAt: _e, ...rest } = payload;
  return contentHash(rest as Record<string, unknown>);
}

/**
 * Drop incoming records that are not newer than this device's own version (from the tracker).
 * Needed because many local records carry no updatedAt, and the import merge would then
 * overwrite a local edit that has not been pushed yet. Call stampPayload() first.
 */
export function dropOlderThanLocal(payload: TaioExportV1): TaioExportV1 {
  const tracker = loadTracker();
  const isNewer = (key: string, obj: Record<string, unknown>) => {
    const local = tracker[key];
    return !local || toMs(obj.updatedAt) > local.ts;
  };
  const out: TaioExportV1 = { ...payload };
  for (const section of SECTIONS) {
    const arr = payload[section];
    if (!Array.isArray(arr)) continue;
    out[section] = arr.flatMap((raw) => {
      if (!raw || typeof raw !== 'object') return [raw];
      const obj = raw as Record<string, unknown>;
      const id = section === 'days' ? obj.date : obj.id;
      if (typeof id !== 'string') return [obj];
      if (section === 'lists' && Array.isArray(obj.items)) {
        const items = obj.items.filter((it) => {
          const o = it as Record<string, unknown>;
          return !(o && typeof o === 'object' && typeof o.id === 'string') || isNewer(`items:${o.id}`, o);
        });
        const listNewer = isNewer(`${section}:${id}`, obj);
        if (!listNewer && items.length === 0) return [];
        return [{ ...obj, items }];
      }
      return isNewer(`${section}:${id}`, obj) ? [obj] : [];
    });
  }
  return out;
}
