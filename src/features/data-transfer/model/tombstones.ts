// PRD v0.3.36 Part F: Tombstones (bia mộ) for syncing deleted journal items
const TOMBSTONE_KEY = 'taio_tombstones_v1';
const CUTOFF_MS = 30 * 24 * 60 * 60 * 1000; // 30 days retention

export interface Tombstone {
  id: string;
  deletedAt: number;
}

export function loadTombstones(): Tombstone[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TOMBSTONE_KEY);
    if (!raw) return [];
    const list: Tombstone[] = JSON.parse(raw);
    const cutoff = Date.now() - CUTOFF_MS;
    return list.filter(t => t && typeof t.id === 'string' && typeof t.deletedAt === 'number' && t.deletedAt > cutoff);
  } catch {
    return [];
  }
}

export function saveTombstones(list: Tombstone[]): void {
  if (typeof window === 'undefined') return;
  try {
    const cutoff = Date.now() - CUTOFF_MS;
    const clean = list.filter(t => t.deletedAt > cutoff);
    window.localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(clean));
  } catch {}
}

export function recordTombstone(id: string, deletedAt = Date.now()): void {
  const current = loadTombstones();
  const next = [...current.filter(t => t.id !== id), { id, deletedAt }];
  saveTombstones(next);
}

export function mergeTombstones(incoming: Tombstone[]): void {
  if (!Array.isArray(incoming) || incoming.length === 0) return;
  const current = loadTombstones();
  const map = new Map<string, number>();
  for (const t of current) map.set(t.id, t.deletedAt);
  for (const t of incoming) {
    if (t && typeof t.id === 'string' && typeof t.deletedAt === 'number') {
      const existing = map.get(t.id) || 0;
      if (t.deletedAt > existing) map.set(t.id, t.deletedAt);
    }
  }
  const merged: Tombstone[] = [];
  const cutoff = Date.now() - CUTOFF_MS;
  for (const [id, deletedAt] of map.entries()) {
    if (deletedAt > cutoff) merged.push({ id, deletedAt });
  }
  saveTombstones(merged);
}
