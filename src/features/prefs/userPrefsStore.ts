// TAIO Time App — User Preferences Store (PRD v0.3.35 Part C)
'use client';

export interface HighlightPrefs {
  color: string | null; // null = default theme color
  bold: boolean;        // default false
}

const STORAGE_KEY = 'taio_highlight_prefs';

export const DEFAULT_HIGHLIGHT_PREFS: HighlightPrefs = {
  color: null,
  bold: false,
};

type PrefsListener = (prefs: HighlightPrefs) => void;
const listeners = new Set<PrefsListener>();

export function getHighlightPrefs(): HighlightPrefs {
  if (typeof window === 'undefined') return DEFAULT_HIGHLIGHT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        color: typeof parsed.color === 'string' ? parsed.color : null,
        bold: Boolean(parsed.bold),
      };
    }
  } catch {}
  return DEFAULT_HIGHLIGHT_PREFS;
}

export function saveHighlightPrefs(prefs: Partial<HighlightPrefs>): HighlightPrefs {
  const current = getHighlightPrefs();
  const next: HighlightPrefs = {
    color: prefs.color !== undefined ? prefs.color : current.color,
    bold: prefs.bold !== undefined ? prefs.bold : current.bold,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  listeners.forEach(fn => {
    try {
      fn(next);
    } catch {}
  });

  return next;
}

export function subscribeHighlightPrefs(listener: PrefsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
