// TAIO Time App — Motivation Store & Cache (PRD FEATURE v0.3.31 Part D)
import {
  MotivationQuote,
  UserMotivationState,
  MotivationSettings,
  DEFAULT_MOTIVATION_SETTINGS,
  QuoteContext,
} from './types';
import { BUILTIN_QUOTES } from './quotesIndex';
import { pickQuote } from './pickQuote';
import { quoteRegistry } from './quoteRegistry';
import { getDeviceCalendarDate } from '@/core/clock';
import { migratePinnedGoalQuotes, normalizeToQuoteKey } from './migratePinnedQuotes.ts';

const STORAGE_KEY_USER_MOTIVATION = 'taio_motivation_user_state';
const STORAGE_KEY_SETTINGS = 'taio_motivation_settings';
const STORAGE_KEY_SERVER_CACHE = 'taio_motivation_server_cache';

// Legacy keys for migration
const LEGACY_STORAGE_KEY_FAV = 'taio_quote_favorites';
const LEGACY_STORAGE_KEY_CUSTOM = 'taio_quote_custom';

export { BUILTIN_QUOTES };

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function loadUserMotivationState(): UserMotivationState {
  if (typeof window === 'undefined') {
    return {
      customQuotes: [],
      favorites: [],
      hiddenTodaySlots: {},
      historySlots: {},
      recentQuoteIds: [],
    };
  }

  let state: UserMotivationState = {
    customQuotes: [],
    favorites: [],
    hiddenTodaySlots: {},
    historySlots: {},
    recentQuoteIds: [],
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_MOTIVATION);
    if (raw) {
      state = { ...state, ...JSON.parse(raw) };
      state.pinnedGoalQuotes = migratePinnedGoalQuotes(state.pinnedGoalQuotes);
    }
  } catch (err) {
    console.warn('[motivationStore] Failed to parse user motivation state', err);
  }

  // One-time migration from legacy keys (Part D.2.3)
  try {
    const legacyFavRaw = localStorage.getItem(LEGACY_STORAGE_KEY_FAV);
    const legacyCustomRaw = localStorage.getItem(LEGACY_STORAGE_KEY_CUSTOM);

    let migrated = false;
    if (legacyFavRaw) {
      const favs = JSON.parse(legacyFavRaw);
      if (Array.isArray(favs) && favs.length > 0) {
        state.favorites = Array.from(new Set([...state.favorites, ...favs]));
        migrated = true;
      }
      localStorage.removeItem(LEGACY_STORAGE_KEY_FAV);
    }

    if (legacyCustomRaw) {
      const customs = JSON.parse(legacyCustomRaw);
      if (Array.isArray(customs) && customs.length > 0) {
        const mapped: MotivationQuote[] = customs.map((c: any) => ({
          id: c.id || `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text: c.text,
          author: c.author || '',
          lang: c.lang || 'vi',
          contexts: ['any'],
          weight: 1,
          active: true,
          source: 'user',
          verified: false,
          updatedAt: new Date().toISOString(),
        }));
        state.customQuotes = [...state.customQuotes, ...mapped];
        migrated = true;
      }
      localStorage.removeItem(LEGACY_STORAGE_KEY_CUSTOM);
    }

    if (migrated) {
      saveUserMotivationState(state);
    }
  } catch (err) {
    console.warn('[motivationStore] Legacy migration error', err);
  }

  return state;
}

export function saveUserMotivationState(state: UserMotivationState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USER_MOTIVATION, JSON.stringify(state));
  } catch (err) {
    console.warn('[motivationStore] Failed to save user motivation state', err);
  }
}

export function loadMotivationSettings(): MotivationSettings {
  if (typeof window === 'undefined') return DEFAULT_MOTIVATION_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return { ...DEFAULT_MOTIVATION_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_MOTIVATION_SETTINGS;
}

export function saveMotivationSettings(settings: MotivationSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch {}
}

export function loadServerQuotesCache(): MotivationQuote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SERVER_CACHE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveLocalQuoteOverrides(quotes: MotivationQuote[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SERVER_CACHE, JSON.stringify(quotes));
  } catch {}
}

export const saveServerQuotesCache = saveLocalQuoteOverrides;

/**
 * Returns merged quotes pool: Server quotes -> Built-in default quotes -> User custom quotes
 */
export function getAllQuotes(serverQuotes: MotivationQuote[], customQuotes: MotivationQuote[]): MotivationQuote[] {
  const map = new Map<string, MotivationQuote>();

  // 1. Built-in
  for (const q of BUILTIN_QUOTES) {
    map.set(q.id, q);
  }

  // 2. Server overrides/additions
  for (const q of serverQuotes) {
    map.set(q.id, q);
  }

  // 3. User custom
  for (const q of customQuotes) {
    map.set(q.id, q);
  }

  return Array.from(map.values());
}

/**
 * Clean up 7-day history to keep only quotes from last 7 days
 */
export function getRecent7DaysQuoteIds(recent: { quoteId: string; date: string }[]): string[] {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoff = getDeviceCalendarDate(sevenDaysAgo);
  return recent.filter(r => r.date >= cutoff).map(r => r.quoteId);
}

/**
 * Pick or restore daily quote for a given slot.
 * If user clicked ↻ (forceRefresh=true), selects a new one and updates slot + history.
 */
export function getOrPickDailyQuote(options: {
  slotKey: string;
  instanceKey?: string;
  context: QuoteContext;
  lang: 'vi' | 'en' | 'zh' | 'th' | string;
  quotes: MotivationQuote[];
  userState: UserMotivationState;
  activeGoalName?: string;
  activeGoalId?: string;
  forceRefresh?: boolean;
}): { quote: MotivationQuote | null; isHiddenToday: boolean; updatedState: UserMotivationState } {
  const {
    slotKey,
    instanceKey,
    context,
    lang,
    quotes,
    userState,
    activeGoalName,
    activeGoalId,
    forceRefresh = false,
  } = options;

  const effectiveKey = instanceKey || slotKey;
  const today = getTodayString();
  let state = { ...userState };

  // Check if hidden today (by group slotKey)
  const isHiddenToday = state.hiddenTodaySlots[slotKey] === today;

  // Active quotes currently showing on other slots, instances, or windows (PRD v0.3.50 Part D)
  const activeExcludes = quoteRegistry.getActiveQuoteIds(effectiveKey);

  // Check if we already have a quote for this slot today and not forceRefresh,
  // making sure it is not currently active in another slot/instance
  const slotEntry = state.historySlots[effectiveKey];
  if (!forceRefresh && slotEntry && slotEntry.date === today && !activeExcludes.includes(slotEntry.quoteId)) {
    const existing = quotes.find(q => q.id === slotEntry.quoteId && q.active);
    if (existing) {
      quoteRegistry.register(effectiveKey, existing.id);
      return { quote: existing, isHiddenToday, updatedState: state };
    }
  }

  // Pick a new quote
  const recentIds = getRecent7DaysQuoteIds(state.recentQuoteIds);
  const picked = pickQuote({
    quotes,
    context,
    lang,
    favorites: state.favorites,
    pinnedQuoteId: state.pinnedQuoteId,
    pinnedGoalQuotes: state.pinnedGoalQuotes,
    activeGoalName,
    activeGoalId,
    recentQuoteIds: recentIds,
    excludeQuoteId: forceRefresh ? slotEntry?.quoteId : undefined,
    excludeQuoteIds: activeExcludes,
  });

  if (picked) {
    quoteRegistry.register(effectiveKey, picked.id);
    state.historySlots = {
      ...state.historySlots,
      [effectiveKey]: { quoteId: picked.id, date: today },
    };

    // Append to recent history
    const filteredRecent = state.recentQuoteIds.filter(r => r.quoteId !== picked.id);
    filteredRecent.push({ quoteId: picked.id, date: today });
    state.recentQuoteIds = filteredRecent;

    saveUserMotivationState(state);
  } else {
    quoteRegistry.unregister(effectiveKey);
  }

  return { quote: picked, isHiddenToday, updatedState: state };
}

/**
 * Toggle pin a quote specifically for a goal (PRD v0.3.48 Part B3 & v0.3.50 Part E).
 * Stores language-agnostic quoteKey so pins persist across languages.
 * Returns true if pinned, false if unpinned.
 */
export function togglePinGoalQuote(goalId: string, quoteIdOrKey: string): boolean {
  if (!goalId || !quoteIdOrKey) return false;
  const state = loadUserMotivationState();
  const currentMap = { ...(state.pinnedGoalQuotes || {}) };
  const targetKey = normalizeToQuoteKey(quoteIdOrKey);
  let isPinned = false;

  const existing = currentMap[goalId];
  if (existing && (existing === targetKey || normalizeToQuoteKey(existing) === targetKey)) {
    delete currentMap[goalId];
    isPinned = false;
  } else {
    currentMap[goalId] = targetKey;
    isPinned = true;
  }

  state.pinnedGoalQuotes = currentMap;
  saveUserMotivationState(state);
  return isPinned;
}

export function isGoalQuotePinned(goalId: string, quoteIdOrKey: string): boolean {
  if (!goalId || !quoteIdOrKey) return false;
  const state = loadUserMotivationState();
  const currentMap = state.pinnedGoalQuotes || {};
  const targetKey = normalizeToQuoteKey(quoteIdOrKey);
  const existing = currentMap[goalId];
  return Boolean(existing && (existing === targetKey || normalizeToQuoteKey(existing) === targetKey));
}
