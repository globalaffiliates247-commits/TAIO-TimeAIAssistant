// PRD B34 v0.3.26: sticky sheets live per device (positions, colours, loose notes).
// Day-sheet lines are Thẻ ngày items in AppContext, so they follow the normal storage and sync.
import { useSyncExternalStore } from 'react';
import type { StickyColor, StickyNote } from './stickyTypes';

const KEY = 'taio_sticky_v1';
interface State { notes: StickyNote[]; boardOpen: boolean; activeId?: string }

let state: State = { notes: [], boardOpen: false };
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...state, notes: JSON.parse(raw).notes || [] };
  } catch { /* first run */ }
}
function commit(next: State) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify({ notes: state.notes })); } catch { /* quota */ }
  listeners.forEach(l => l());
}
const uid = () => `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function useStickyState(): State {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => { load(); return state; },
    () => state
  );
}

/** Opens the board and makes sure today's day sheet exists (a new sheet every day). */
export function openStickyBoard(today: string, focusId?: string) {
  load();
  let notes = state.notes;
  let day = notes.find(n => n.kind === 'day' && n.date === today);
  if (!day) {
    day = {
      id: uid(), kind: 'day', date: today, title: 'Hôm nay', color: 'yellow',
      pinned: false, collapsed: false, open: true, x: 40, y: 90, lines: [], updatedAt: Date.now(),
    };
    // Yesterday's day sheet closes and stays as a diary page.
    notes = [...notes.map(n => (n.kind === 'day' ? { ...n, open: false } : n)), day];
  }
  const target = focusId || day.id;
  notes = notes.map(n => (n.id === target ? { ...n, open: true, collapsed: false } : n));
  commit({ ...state, notes, boardOpen: true, activeId: target });
}

export function closeStickyBoard() { commit({ ...state, boardOpen: false }); }
export function setActiveSticky(id: string) { commit({ ...state, activeId: id }); }

export function updateSticky(id: string, patch: Partial<StickyNote>) {
  commit({ ...state, notes: state.notes.map(n => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)) });
}

export function newFreeSticky(color: StickyColor = 'pink') {
  const open = state.notes.filter(n => n.open).length;
  const note: StickyNote = {
    id: uid(), kind: 'free', title: 'Ghi chú', color, pinned: false, collapsed: false, open: true,
    x: 520 + (open % 4) * 36, y: 90 + (open % 4) * 36, lines: [], updatedAt: Date.now(),
  };
  commit({ ...state, notes: [...state.notes, note], boardOpen: true, activeId: note.id });
}

export function closeSticky(id: string) {
  const note = state.notes.find(n => n.id === id);
  // An empty loose note is thrown away; anything else is kept (reopen from Rổ công việc).
  if (note && note.kind === 'free' && note.lines.every(l => !l.text.trim())) {
    commit({ ...state, notes: state.notes.filter(n => n.id !== id) });
  } else {
    updateSticky(id, { open: false });
  }
  if (!state.notes.some(n => n.open)) closeStickyBoard();
}

export const newLineId = () => `ln-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
