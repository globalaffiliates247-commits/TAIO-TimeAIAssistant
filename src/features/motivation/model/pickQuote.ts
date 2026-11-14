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
  excludeQuoteIds?: string[]; // Quotes currently displayed on other screens/slots (v0.3.35 A3.2)
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
    excludeQuoteIds = [],
  } = options;

  if (!quotes || quotes.length === 0) return null;

  // Build exclusion set of quotes already active elsewhere
  const allExcluded = new Set<string>();
  if (excludeQuoteId) allExcluded.add(excludeQuoteId);
  for (const id of excludeQuoteIds) {
    if (id) allExcluded.add(id);
  }

  // Filter active quotes
  const activeQuotes = quotes.filter(q => q.active);
  if (activeQuotes.length === 0) return null;

  // 1. Pinned quote takes absolute top priority (B5.3: "câu của tôi" luôn hiện ở Bắt đầu ngày, không bị ↻ thay)
  if (pinnedQuoteId && (context === 'start_day' || !allExcluded.has(pinnedQuoteId))) {
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

  // Filter out recent 7-day quotes and excluded active quotes
  let available = candidatePool.filter(q => !allExcluded.has(q.id) && !recentQuoteIds.includes(q.id));
  if (available.length === 0) {
    // If all candidates were shown in last 7 days, relax 7-day constraint but NEVER reuse an active quote
    available = candidatePool.filter(q => !allExcluded.has(q.id));
  }
  if (available.length === 0) {
    // v0.3.35 A4.4: If only 1 valid quote exists and it is already shown elsewhere, return null (stay blank, no duplicate)
    return null;
  }

  // 4. Weight calculation:
  // Base weight (q.weight || 1), favorited (♥) quotes get 3x multiplier
  // B3.4: On-device preference learning from favorites:
  const favQuotes = activeQuotes.filter(q => favorites.includes(q.id));
  const favAuthors = new Set<string>();
  const favContexts = new Set<QuoteContext>();
  for (const f of favQuotes) {
    if (f.author) favAuthors.add(f.author.toLowerCase().trim());
    for (const c of f.contexts) {
      if (c !== 'any') favContexts.add(c);
    }
  }

  const weightedList: MotivationQuote[] = [];
  for (const q of available) {
    const isFav = favorites.includes(q.id);
    let multiplier = isFav ? 3 : 1;

    // Preference boost based on favorited authors and contexts
    if (!isFav) {
      if (q.author && favAuthors.has(q.author.toLowerCase().trim())) {
        multiplier += 2;
      }
      if (q.contexts.some(c => favContexts.has(c))) {
        multiplier += 1;
      }
    }

    const count = Math.max(1, (q.weight || 1) * multiplier);
    for (let i = 0; i < count; i++) {
      weightedList.push(q);
    }
  }

  if (weightedList.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * weightedList.length);
  return weightedList[randomIndex];
}
