// TAIO Time App — Motivation Quote Card (PRD B35.3 / v0.3.27)
// ↻ refresh, ♥ favorite, add custom. Favorited quotes appear more often.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { useT } from '../../../i18n/useT';
import { BUILTIN_QUOTES, Quote } from './quoteBank';
import { RefreshCw, Heart, Plus, X, Sparkles } from 'lucide-react';

const STORAGE_KEY_FAV = 'taio_quote_favorites';
const STORAGE_KEY_CUSTOM = 'taio_quote_custom';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveToStorage<T>(key: string, val: T) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export const QuoteCard: React.FC = () => {
  const { language, palette } = useApp();
  const { t } = useT();
  const isCool = palette === 'cool';

  const [favorites, setFavorites] = useState<string[]>([]);
  const [customQuotes, setCustomQuotes] = useState<Quote[]>([]);
  const [current, setCurrent] = useState<Quote | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftAuthor, setDraftAuthor] = useState('');

  // Load persisted state
  useEffect(() => {
    setFavorites(loadFromStorage<string[]>(STORAGE_KEY_FAV, []));
    setCustomQuotes(loadFromStorage<Quote[]>(STORAGE_KEY_CUSTOM, []));
  }, []);

  // Build pool: builtin (filtered by language) + custom, weighted by favorites
  const pickRandom = useCallback(() => {
    const langQuotes = BUILTIN_QUOTES.filter(q => q.lang === language);
    const pool: Quote[] = [...langQuotes, ...customQuotes];
    if (pool.length === 0) return null;

    // Weighted: favorited quotes get 3x weight
    const weighted: Quote[] = [];
    for (const q of pool) {
      const weight = favorites.includes(q.id) ? 3 : 1;
      for (let i = 0; i < weight; i++) weighted.push(q);
    }

    // Avoid repeating current
    let attempts = 0;
    let pick: Quote;
    do {
      pick = weighted[Math.floor(Math.random() * weighted.length)];
      attempts++;
    } while (pick.id === current?.id && attempts < 10 && weighted.length > 1);

    return pick;
  }, [language, customQuotes, favorites, current]);

  // Initial pick
  useEffect(() => {
    if (!current) setCurrent(pickRandom());
  }, [language]);

  const refresh = () => setCurrent(pickRandom());

  const toggleFavorite = () => {
    if (!current) return;
    const next = favorites.includes(current.id)
      ? favorites.filter(id => id !== current.id)
      : [...favorites, current.id];
    setFavorites(next);
    saveToStorage(STORAGE_KEY_FAV, next);
  };

  const isFav = current ? favorites.includes(current.id) : false;

  const addCustom = () => {
    if (!draftText.trim()) return;
    const newQ: Quote = {
      id: `q-custom-${Date.now()}`,
      text: draftText.trim(),
      author: draftAuthor.trim() || undefined,
      lang: language,
      isCustom: true,
    };
    const next = [...customQuotes, newQ];
    setCustomQuotes(next);
    saveToStorage(STORAGE_KEY_CUSTOM, next);
    setCurrent(newQ);
    setDraftText('');
    setDraftAuthor('');
    setShowAddForm(false);
  };

  if (!current) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-700">{t('quotes.title')}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title={t('quotes.refresh')}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleFavorite}
            className={`p-1.5 rounded-lg transition-colors ${
              isFav
                ? 'text-rose-500 bg-rose-50 hover:bg-rose-100'
                : 'text-slate-400 hover:bg-slate-100 hover:text-rose-400'
            }`}
            title={isFav ? t('quotes.unfavorite') : t('quotes.favorite')}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title={t('quotes.addCustom')}
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Quote */}
      <blockquote className="text-sm text-slate-800 leading-relaxed italic">
        &ldquo;{current.text}&rdquo;
      </blockquote>
      {current.author && (
        <p className="text-[11px] text-slate-500 text-right">— {current.author}</p>
      )}
      {current.isCustom && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
          {t('quotes.customBadge')}
        </span>
      )}

      {/* Add custom form */}
      {showAddForm && (
        <div className="space-y-2 pt-2 border-t border-slate-100 animate-in fade-in">
          <input
            type="text"
            value={draftText}
            onChange={e => setDraftText(e.target.value)}
            placeholder={t('quotes.customPlaceholder')}
            className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draftAuthor}
              onChange={e => setDraftAuthor(e.target.value)}
              placeholder={t('quotes.authorPlaceholder')}
              className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400"
            />
            <button
              onClick={addCustom}
              disabled={!draftText.trim()}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40 ${
                isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
              }`}
            >
              {t('quotes.saveCustom')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
