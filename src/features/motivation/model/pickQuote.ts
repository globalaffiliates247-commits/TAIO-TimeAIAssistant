// TAIO Time App — Motivation pickQuote pure function (PRD FEATURE v0.3.31 Part A.4)
import { MotivationQuote, QuoteContext } from './types';

export interface PickQuoteOptions {
  quotes: MotivationQuote[];
  context: QuoteContext;
  lang: 'vi' | 'en';
  favorites?: string[];
  pinnedQuoteId?: string;
  activeGoalName?: string;
  activeGoalId?: string;
  recentQuoteIds?: string[]; // Quotes shown in last 7 days
  excludeQuoteId?: string;   // For refresh (↻) to avoid picking the current quote again
}

export function pickQuote(options: PickQuoteOptions): MotivationQuote | null {
  const {
    quotes,
    context,
    lang,
    favorites = [],
    pinnedQuoteId,
    activeGoalName,
    activeGoalId,
    recentQuoteIds = [],
    excludeQuoteId,
  } = options;

  if (!quotes || quotes.length === 0) return null;

  // Filter active quotes
  const activeQuotes = quotes.filter(q => q.active);
  if (activeQuotes.length === 0) return null;

  // 1. Pinned quote takes absolute top priority if valid and not excluded
  if (pinnedQuoteId && pinnedQuoteId !== excludeQuoteId) {
    const pinned = activeQuotes.find(q => q.id === pinnedQuoteId);
    if (pinned) return pinned;
  }

  // Language matching pool: match target lang, fallback to vi if empty
  let langPool = activeQuotes.filter(q => q.lang === lang);
  if (langPool.length === 0) {
    langPool = activeQuotes.filter(q => q.lang === 'vi');
  }
  if (langPool.length === 0) {
    langPool = activeQuotes;
  }

  // 2. Goal-linked quotes: linkedGoalId matches activeGoalId, or goalKeywords match activeGoalName
  let goalPool: MotivationQuote[] = [];
  if (activeGoalId || activeGoalName) {
    const goalNorm = (activeGoalName || '').toLowerCase();
    goalPool = langPool.filter(q => {
      if (activeGoalId && q.linkedGoalId === activeGoalId) return true;
      if (goalNorm && q.goalKeywords && q.goalKeywords.some(kw => goalNorm.includes(kw.toLowerCase()))) {
        return true;
      }
      return false;
    });
  }

  // 3. Context pool: matches context or 'any'
  const targetPool = goalPool.length > 0
    ? goalPool
    : langPool.filter(q => q.contexts.includes(context) || q.contexts.includes('any'));

  const candidatePool = targetPool.length > 0 ? targetPool : langPool;

  // Filter out recent 7-day quotes and excludeQuoteId if enough candidates remain
  let available = candidatePool.filter(q => q.id !== excludeQuoteId && !recentQuoteIds.includes(q.id));
  if (available.length === 0) {
    // If all candidates were shown in last 7 days, relax 7-day constraint but still avoid excludeQuoteId
    available = candidatePool.filter(q => q.id !== excludeQuoteId);
  }
  if (available.length === 0) {
    // If still empty (e.g. pool has only 1 item), use the candidate pool
    available = candidatePool;
  }

  // 4. Weight calculation:
  // Base weight (q.weight || 1), favorited (♥) quotes get 3x multiplier
  const weightedList: MotivationQuote[] = [];
  for (const q of available) {
    const isFav = favorites.includes(q.id);
    const multiplier = isFav ? 3 : 1;
    const count = Math.max(1, (q.weight || 1) * multiplier);
    for (let i = 0; i < count; i++) {
      weightedList.push(q);
    }
  }

  if (weightedList.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * weightedList.length);
  return weightedList[randomIndex];
}
