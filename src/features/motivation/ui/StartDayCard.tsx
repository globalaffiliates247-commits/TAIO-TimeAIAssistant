// TAIO Time App — "Bắt đầu ngày" Card (PRD FEATURE v0.3.31 Part C)
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useT } from '@/i18n/useT';
import {
  MotivationQuote,
  MotivationSettings,
} from '../model/types';
import {
  loadUserMotivationState,
  loadMotivationSettings,
  loadServerQuotesCache,
  getAllQuotes,
  getRecent7DaysQuoteIds,
} from '../model/motivationStore';
import { pickQuote } from '../model/pickQuote';
import { Sparkles, ArrowRight, X } from 'lucide-react';

const STORAGE_KEY_START_DAY_SEEN = 'taio_start_day_card_seen';

export const StartDayCard: React.FC<{ onOpenTodaySheet?: () => void }> = ({ onOpenTodaySheet }) => {
  const { language, palette, goals } = useApp();
  const { t } = useT();
  const isCool = palette === 'cool';

  const [visible, setVisible] = useState(false);
  const [quote, setQuote] = useState<MotivationQuote | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const settings: MotivationSettings = loadMotivationSettings();
    if (!settings.enabled) return;

    // Check if seen today
    const today = new Date().toISOString().slice(0, 10);
    const seenDate = localStorage.getItem(STORAGE_KEY_START_DAY_SEEN);
    if (seenDate === today) return; // Already seen today

    const userState = loadUserMotivationState();
    const serverQuotes = loadServerQuotesCache();
    const allQuotes = getAllQuotes(serverQuotes, userState.customQuotes);

    // Find first active goal to prioritize related quote
    const activeGoal = (goals || []).find(g => (g.progressPercent ?? 0) < 100);

    const recentIds = getRecent7DaysQuoteIds(userState.recentQuoteIds);
    const picked = pickQuote({
      quotes: allQuotes,
      context: 'start_day',
      lang: language,
      favorites: userState.favorites,
      pinnedQuoteId: userState.pinnedQuoteId,
      activeGoalName: activeGoal?.name,
      activeGoalId: activeGoal?.id,
      recentQuoteIds: recentIds,
    });

    if (picked) {
      setQuote(picked);
      setVisible(true);
    }
  }, [language, goals]);

  const handleDismiss = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(STORAGE_KEY_START_DAY_SEEN, today);
    setVisible(false);
  };

  const handleStart = () => {
    handleDismiss();
    if (onOpenTodaySheet) {
      onOpenTodaySheet();
    }
  };

  if (!visible || !quote) return null;

  return (
    <div
      className={`relative mb-4 p-4 rounded-2xl border transition-all shadow-sm ${
        isCool
          ? 'bg-gradient-to-br from-blue-50/90 to-indigo-50/70 border-blue-200/80'
          : 'bg-gradient-to-br from-amber-50/90 to-orange-50/70 border-amber-200/80'
      }`}
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 transition-colors"
        title={t('common.close', 'Bỏ qua')}
      >
        <X size={15} />
      </button>

      {/* Header pill */}
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#E0401F] mb-2">
        <Sparkles size={14} className="text-[#E0401F]" />
        <span>{t('motivation.startDayTitle', 'Bắt đầu ngày')}</span>
      </div>

      {/* Quote text */}
      <div className="text-sm sm:text-base font-normal italic text-slate-800 leading-relaxed pr-6">
        "{quote.text}"
      </div>

      {quote.author && (
        <div className="mt-1.5 text-right text-xs text-slate-500 not-italic font-medium">
          — {quote.author}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-3.5 flex items-center justify-end gap-2">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          {t('common.later', 'Để sau')}
        </button>
        <button
          onClick={handleStart}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition-transform active:scale-95 ${
            isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c73416]'
          }`}
        >
          <span>{t('motivation.startDayBtn', 'Bắt đầu')}</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
