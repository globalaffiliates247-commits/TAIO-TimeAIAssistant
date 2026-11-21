// PRD B34 v0.3.26 & v0.3.37 Part E: sticky sheets with persistence, crash protection,
// 30-day trash retention, temporary hide/restore, and cross-device sync.
import { useSyncExternalStore } from 'react';
import type { StickyColor, StickyNote } from './stickyTypes';
import { broadcastWindowBus, subscribeWindowBus, getActiveEditingId } from '../../../core/storage/windowBus.ts';
import { mergeCollectionsByUpdatedAt } from '../../../core/storage/durableStorage.ts';

const KEY = 'taio_sticky_v1';
const COUNT_KEY = 'taio_sticky_last_count_v1';
const STICKY_TOMBSTONES_KEY = 'taio_sticky_tombstones_v1';
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface StickyTombstone {
  id: string;
  deletedAt: number;
}

export function loadStickyTombstones(): StickyTombstone[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STICKY_TOMBSTONES_KEY);
    if (!raw) return [];
    const list: StickyTombstone[] = JSON.parse(raw);
    const cutoff = Date.now() - RETENTION_MS;
    return list.filter(t => t && typeof t.id === 'string' && typeof t.deletedAt === 'number' && t.deletedAt > cutoff);
  } catch {
    return [];
  }
}

export function saveStickyTombstones(list: StickyTombstone[]): void {
  if (typeof window === 'undefined') return;
  try {
    const cutoff = Date.now() - RETENTION_MS;
    const clean = list.filter(t => t.deletedAt > cutoff);
    localStorage.setItem(STICKY_TOMBSTONES_KEY, JSON.stringify(clean));
  } catch {}
}

export function recordStickyTombstone(id: string, deletedAt = Date.now()): void {
  const current = loadStickyTombstones();
  const next = [...current.filter(t => t.id !== id), { id, deletedAt }];
  saveStickyTombstones(next);
}

export function mergeStickyTombstones(incoming: StickyTombstone[]): void {
  if (!Array.isArray(incoming) || incoming.length === 0) return;
  const current = loadStickyTombstones();
  const map = new Map<string, number>();
  for (const t of current) map.set(t.id, t.deletedAt);
  for (const t of incoming) {
    if (t && typeof t.id === 'string' && typeof t.deletedAt === 'number') {
      const existing = map.get(t.id) || 0;
      if (t.deletedAt > existing) map.set(t.id, t.deletedAt);
    }
  }
  const merged: StickyTombstone[] = [];
  const cutoff = Date.now() - RETENTION_MS;
  for (const [id, deletedAt] of map.entries()) {
    if (deletedAt > cutoff) merged.push({ id, deletedAt });
  }
  saveStickyTombstones(merged);
}

interface State {
  notes: StickyNote[];
  boardOpen: boolean;
  activeId?: string;
  isTemporarilyHidden?: boolean;
  cacheWipedWarning?: boolean;
  listPanelOpen?: boolean; // PRD v0.3.43 Part E: Bảng danh sách phiếu
}

let state: State = { notes: [], boardOpen: false, isTemporarilyHidden: false, cacheWipedWarning: false, listPanelOpen: false };
let loaded = false;
const listeners = new Set<() => void>();

function purgeExpired(notes: StickyNote[]): StickyNote[] {
  const cutoff = Date.now() - RETENTION_MS;
  return notes.filter(n => !n.deletedAt || n.deletedAt > cutoff);
}

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    const lastCount = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10);
    if (raw) {
      const parsed = JSON.parse(raw);
      const rawNotes: StickyNote[] = Array.isArray(parsed.notes) ? parsed.notes : [];
      state = { ...state, notes: purgeExpired(rawNotes), cacheWipedWarning: false };
    } else if (lastCount > 0) {
      // Rule E2.6: cache was wiped while notes previously existed
      state = { ...state, notes: [], cacheWipedWarning: true };
    }
  } catch {
    /* first run */
  }
}

function commit(next: State, broadcast = true) {
  state = next;
  try {
    const validNotes = purgeExpired(state.notes);
    localStorage.setItem(KEY, JSON.stringify({ notes: validNotes }));
    const activeCount = validNotes.filter(n => !n.deletedAt).length;
    localStorage.setItem(COUNT_KEY, String(activeCount));
  } catch {
    /* quota */
  }
  listeners.forEach(l => l());
  if (broadcast) {
    broadcastWindowBus('sticky');
  }
}

// PRD v0.3.50 Part A: Cross-window sticky synchronization
function syncFromRemoteWindow() {
  if (typeof window === 'undefined') return;
  try {
    load();
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const diskNotes: StickyNote[] = Array.isArray(parsed.notes) ? parsed.notes : [];
    const tombstones = loadStickyTombstones();
    const deletedIds = tombstones.map(t => t.id);

    const activeEditingId = getActiveEditingId('sticky');
    let localNotes = state.notes;

    // A4: If user is actively typing in a note, protect local in-memory version
    if (activeEditingId) {
      localNotes = localNotes.map(n =>
        n.id === activeEditingId ? { ...n, updatedAt: Math.max(Number(n.updatedAt) || 0, Date.now()) } : n
      );
    }

    const merged = mergeCollectionsByUpdatedAt(localNotes, diskNotes, deletedIds);
    state = { ...state, notes: purgeExpired(merged), cacheWipedWarning: false };
    listeners.forEach(l => l());
  } catch {}
}

if (typeof window !== 'undefined') {
  subscribeWindowBus(msg => {
    if (msg.dataset === 'sticky') {
      syncFromRemoteWindow();
    }
  });
}

const uid = () => `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function useStickyState(): State {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => {
      load();
      return state;
    },
    () => state
  );
}

/** Opens the board and restores previous open sheets or makes sure today's day sheet exists. */
export function openStickyBoard(today: string, focusId?: string, reopenPrevious = true) {
  load();
  let notes = state.notes;
  let day = notes.find(n => n.kind === 'day' && n.date === today && !n.deletedAt);
  if (!day) {
    day = {
      id: uid(),
      kind: 'day',
      date: today,
      title: 'Hôm nay',
      color: 'yellow',
      pinned: false,
      collapsed: false,
      open: true,
      lastOpen: true,
      x: 320,
      y: 90,
      lines: [],
      updatedAt: Date.now(),
    };
    // Yesterday's day sheet closes and stays as a diary page.
    notes = [...notes.map(n => (n.kind === 'day' ? { ...n, open: false, lastOpen: false } : n)), day];
  }

  const target = focusId || day.id;
  notes = notes.map(n => {
    if (n.id === target) {
      return { ...n, open: true, lastOpen: true, collapsed: false };
    }
    // Rule E2.4: reopen previously opened sheets when opening board without specific focusId
    if (!focusId && reopenPrevious && n.lastOpen && !n.deletedAt) {
      return { ...n, open: true };
    }
    return n;
  });

  commit({ ...state, notes, boardOpen: true, activeId: target, isTemporarilyHidden: false });
}

export function closeStickyBoard() {
  // Mark current open sheets in lastOpen before closing so they can be reopened together
  const notes = state.notes.map(n => ({ ...n, lastOpen: n.open }));
  commit({ ...state, notes, boardOpen: false });
}

export function setActiveSticky(id: string) {
  commit({ ...state, activeId: id });
}

function isLinesEqual(a: StickyNote['lines'] = [], b: StickyNote['lines'] = []): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const la = a[i];
    const lb = b[i];
    if (la.id !== lb.id || la.text !== lb.text || Boolean(la.done) !== Boolean(lb.done)) {
      return false;
    }
  }
  return true;
}

function isMapEqual(a?: Record<string, string>, b?: Record<string, string>): boolean {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export function hasStickyChanged(existing: StickyNote, patch: Partial<StickyNote>): boolean {
  for (const key of Object.keys(patch) as (keyof StickyNote)[]) {
    if (key === 'updatedAt') continue;
    if (key === 'lines') {
      if (!isLinesEqual(existing.lines, patch.lines)) return true;
    } else if (key === 'scheduledMap') {
      if (!isMapEqual(existing.scheduledMap, patch.scheduledMap)) return true;
    } else {
      if (existing[key] !== patch[key]) return true;
    }
  }
  return false;
}

// PRD v0.3.39 Part E2.7: Cầu chì chống vòng lặp (circuit breaker)
const recentWriteTimes: number[] = [];

export function updateSticky(id: string, patch: Partial<StickyNote>) {
  load();
  const existing = state.notes.find(n => n.id === id);
  if (!existing) return;
  // PRD v0.3.39 Part E2.3: Kho từ chối ghi vô nghĩa nếu patch không làm đổi giá trị
  if (!hasStickyChanged(existing, patch)) return;

  const now = Date.now();
  while (recentWriteTimes.length > 0 && now - recentWriteTimes[0] > 1000) {
    recentWriteTimes.shift();
  }
  if (recentWriteTimes.length >= 20) {
    console.error(`[stickyStore] Vòng lặp ghi tờ ghi chú bị ngắt (circuit breaker tripped): noteId=${id}`);
    return;
  }
  recentWriteTimes.push(now);

  commit({
    ...state,
    notes: state.notes.map(n => (n.id === id ? { ...n, ...patch, updatedAt: now } : n)),
  });
}

export function newFreeSticky(color: StickyColor = 'pink'): string {
  load();
  // PRD v0.3.43 Part E2.6: Nếu đã có phiếu trống chưa gõ gì thì không tạo thêm phiếu trống thứ hai
  const existingEmpty = state.notes.find(
    n => n.kind === 'free' && n.open && !n.deletedAt && (!n.content || !n.content.trim()) && (!n.lines || n.lines.length === 0)
  );
  if (existingEmpty) {
    commit({ ...state, boardOpen: true, activeId: existingEmpty.id, isTemporarilyHidden: false });
    return existingEmpty.id;
  }

  const open = state.notes.filter(n => n.open && !n.deletedAt).length;
  const note: StickyNote = {
    id: uid(),
    kind: 'free',
    title: 'Ghi chú',
    color,
    pinned: false,
    collapsed: false,
    open: true,
    lastOpen: true,
    x: 520 + (open % 4) * 36,
    y: 90 + (open % 4) * 36,
    lines: [],
    updatedAt: Date.now(),
  };
  commit({ ...state, notes: [...state.notes, note], boardOpen: true, activeId: note.id, isTemporarilyHidden: false });
  return note.id;
}

/** PRD v0.3.43 Part E: Bảng danh sách phiếu */
export function toggleStickyListPanel() {
  load();
  commit({ ...state, listPanelOpen: !state.listPanelOpen, boardOpen: true });
}

export function setStickyListPanelOpen(open: boolean) {
  load();
  commit({ ...state, listPanelOpen: open });
}

/**
 * Rule E2.2: "Đóng nghĩa là ẩn, không bao giờ xóa. closeSticky không xóa tờ nào; kể cả tờ trống chỉ ẩn."
 */
export function closeSticky(id: string) {
  load();
  const notes = state.notes.map(n => (n.id === id ? { ...n, open: false, lastOpen: false } : n));
  const anyOpen = notes.some(n => n.open && !n.deletedAt);
  commit({ ...state, notes, boardOpen: anyOpen });
}

/**
 * Rule E2.1: "Nút ẩn tạm tất cả / Hiện lại" trên Mac/Desktop để dẹp mọi tờ nổi sang bên, xem màn hình sau.
 */
export function toggleHideAllStickyNotes() {
  load();
  const currentlyHidden = state.isTemporarilyHidden;
  if (!currentlyHidden) {
    // Hide all open sheets, remember they were open
    const notes = state.notes.map(n => ({ ...n, lastOpen: n.open, open: false }));
    commit({ ...state, notes, isTemporarilyHidden: true });
  } else {
    // Restore all previously open sheets
    const notes = state.notes.map(n => ({
      ...n,
      open: n.lastOpen ? true : n.open,
    }));
    commit({ ...state, notes, isTemporarilyHidden: false, boardOpen: true });
  }
}

/**
 * Rule E2.2: Soft delete into 30-day trash with undo capability.
 */
export function trashSticky(id: string): { undo: () => void } {
  load();
  const now = Date.now();
  recordStickyTombstone(id, now);
  const notes = state.notes.map(n => (n.id === id ? { ...n, deletedAt: now, open: false, lastOpen: false } : n));
  commit({ ...state, notes });

  return {
    undo: () => {
      restoreSticky(id);
    },
  };
}

/** Restore a sheet from trash */
export function restoreSticky(id: string) {
  load();
  const tombstones = loadStickyTombstones().filter(t => t.id !== id);
  saveStickyTombstones(tombstones);
  const notes = state.notes.map(n => (n.id === id ? { ...n, deletedAt: undefined, open: true, lastOpen: true, updatedAt: Date.now() } : n));
  commit({ ...state, notes, boardOpen: true, activeId: id });
}

/** Permanently delete expired items or manually clear */
export function purgeStickyTrash() {
  load();
  const cutoff = Date.now() - RETENTION_MS;
  const notes = state.notes.filter(n => !n.deletedAt || n.deletedAt > cutoff);
  commit({ ...state, notes });
}

export function dismissCacheWipeWarning() {
  commit({ ...state, cacheWipedWarning: false });
}

export const newLineId = () => `ln-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;

/** Export helper for taioExportV1 */
export function getStickyNotesForExport(): StickyNote[] {
  load();
  return state.notes.filter(n => !n.deletedAt);
}

/** Import/Sync helper: merges incoming sticky notes preserving local coordinates */
export function applyStickyNotesFromImport(incoming: StickyNote[], tombstones: StickyTombstone[] = []): void {
  load();
  mergeStickyTombstones(tombstones);
  const activeTombstones = new Set(loadStickyTombstones().map(t => t.id));

  const noteMap = new Map<string, StickyNote>();
  for (const n of state.notes) {
    if (!activeTombstones.has(n.id)) noteMap.set(n.id, n);
  }

  for (const inc of incoming) {
    if (!inc || !inc.id || activeTombstones.has(inc.id)) continue;
    const existing = noteMap.get(inc.id);
    if (!existing) {
      // New incoming sheet: preserve content, assign reasonable default position
      noteMap.set(inc.id, {
        ...inc,
        open: false,
        lastOpen: false,
        x: typeof inc.x === 'number' ? inc.x : 520,
        y: typeof inc.y === 'number' ? inc.y : 90,
      });
    } else {
      // Existing sheet: if incoming has newer updatedAt, merge content while preserving local position/size
      if ((inc.updatedAt || 0) > (existing.updatedAt || 0)) {
        noteMap.set(inc.id, {
          ...inc,
          x: existing.x,
          y: existing.y,
          w: existing.w,
          h: existing.h,
          pinned: existing.pinned,
          collapsed: existing.collapsed,
          open: existing.open,
          lastOpen: existing.lastOpen,
        });
      }
    }
  }

  commit({ ...state, notes: Array.from(noteMap.values()), cacheWipedWarning: false });
}
