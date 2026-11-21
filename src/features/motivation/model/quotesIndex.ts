// TAIO Time App — Multi-language Quotes Registry Bundle (PRD v0.3.48 Part B4)
import type { MotivationQuote } from './types';
import viQuotes from './defaultQuotes.vi.json';
import enQuotes from './defaultQuotes.en.json';
import zhQuotes from './defaultQuotes.zh.json';
import thQuotes from './defaultQuotes.th.json';

export const QUOTE_BUNDLES: Record<string, MotivationQuote[]> = {
  vi: viQuotes as MotivationQuote[],
  en: enQuotes as MotivationQuote[],
  zh: zhQuotes as MotivationQuote[],
  th: thQuotes as MotivationQuote[],
};

export const BUILTIN_QUOTES: MotivationQuote[] = [
  ...(viQuotes as MotivationQuote[]),
  ...(enQuotes as MotivationQuote[]),
  ...(zhQuotes as MotivationQuote[]),
  ...(thQuotes as MotivationQuote[]),
];
