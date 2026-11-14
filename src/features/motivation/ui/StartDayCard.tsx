// TAIO Time App — "Bắt đầu ngày" Card (PRD FEATURE v0.3.31 Part C & v0.3.33 Part B)
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
import { getDeviceCalendarDate } from '@/core/clock';
import { getPreviousDay, isDayClosed } from '@/features/dayclose';
import { Sparkles, ArrowRight, X, Clock, Plus } from 'lucide-react';

const STORAGE_KEY_START_DAY_SEEN = 'taio_start_day_card_seen';

export const StartDayCard: React.FC<{ onOpenTodaySheet?: () => void }> = ({ onOpenTodaySheet }) => {
  const { 
    language, 
    palette, 
    goals, 
    dailyCardItems, 
    closedDays, 
    markDayClosed, 
    carryOverItem, 
    setCloseDayModalOpen,
    addDailyCardItem
  } = useApp();
  const { t } = useT();
  const isCool = palette === 'cool';

  const [visible, setVisible] = useState(false);
  const [quote, setQuote] = useState<MotivationQuote | null>(null);
  const [firstTaskText, setFirstTaskText] = useState('');

  const today = getDeviceCalendarDate();
  const yesterday = getPreviousDay(today);
  const yesterdayClosed = isDayClosed(closedDays, yesterday);

  const yesterdayItems = useMemo(() => {
    return (dailyCardItems || []).filter(i => i.date === yesterday && i.status !== 'dropped');
  }, [dailyCardItems, yesterday]);

  const unfinishedYesterday = useMemo(() => {
    return yesterdayItems.filter(i => i.status !== 'done');
  }, [yesterdayItems]);

  // B2.4: If yesterday had tasks and all were completed, auto-close yesterday silently
  useEffect(() => {
    if (!yesterdayClosed && yesterdayItems.length > 0 && unfinishedYesterday.length === 0) {
      markDayClosed(yesterday, 'auto');
    }
  }, [yesterdayClosed, yesterdayItems.length, unfinishedYesterday.length, yesterday, markDayClosed]);

  const todayItems = useMemo(() => {
    return (dailyCardItems || []).filter(i => i.date === today && i.status !== 'dropped');
  }, [dailyCardItems, today]);

  const hasTodayTasks = todayItems.length > 0;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const settings: MotivationSettings = loadMotivationSettings();
    if (!settings.enabled) return;

    // Check if seen today (only dismiss quote if seen, but keep yesterday unfinished reminder visible if any)
    const seenDate = localStorage.getItem(STORAGE_KEY_START_DAY_SEEN);
    const hasUnfinishedPrompt = !yesterdayClosed && unfinishedYesterday.length > 0;
    const shouldAskMorningTask = !hasTodayTasks;

    if (seenDate === today && !hasUnfinishedPrompt && !shouldAskMorningTask) {
      return;
    }

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
    } else if (hasUnfinishedPrompt || shouldAskMorningTask) {
      setVisible(true);
    }
  }, [language, goals, yesterdayClosed, unfinishedYesterday.length, hasTodayTasks, today]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY_START_DAY_SEEN, today);
    setVisible(false);
  };

  const handleStart = () => {
    handleDismiss();
    if (onOpenTodaySheet) {
      onOpenTodaySheet();
    }
  };

  const handleContinueYesterdayTasks = () => {
    unfinishedYesterday.forEach(item => carryOverItem(item.id, 'today'));
    markDayClosed(yesterday, 'manual');
  };

  const handleAddFirstTask = () => {
    if (!firstTaskText.trim()) return;
    addDailyCardItem({
      text: firstTaskText.trim(),
      date: today,
      origin: 'planned',
    });
    setFirstTaskText('');
  };

  if (!visible) return null;

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

      {/* Part B2 #4b: Unfinished tasks from yesterday reminder */}
      {!yesterdayClosed && unfinishedYesterday.length > 0 && (
        <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
          <div className="font-semibold text-amber-900 dark:text-amber-200">
            {language === 'vi'
              ? `Còn ${unfinishedYesterday.length} việc từ hôm qua đang chờ bạn`
              : `You have ${unfinishedYesterday.length} tasks from yesterday waiting`}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleContinueYesterdayTasks}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              {language === 'vi' ? 'Làm tiếp hôm nay' : 'Continue Today'}
            </button>
            <button
              onClick={() => setCloseDayModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-black/20 hover:bg-white text-slate-700 dark:text-slate-200 text-xs font-semibold border border-amber-500/30 transition-colors"
            >
              {language === 'vi' ? 'Xem lại' : 'Review'}
            </button>
          </div>
        </div>
      )}

      {/* Quote text if available */}
      {quote && (
        <>
          <div className="text-sm sm:text-base font-normal italic text-slate-800 leading-relaxed pr-6">
            "{quote.text}"
          </div>

          {quote.author && (
            <div className="mt-1.5 text-right text-xs text-slate-500 not-italic font-medium">
              — {quote.author}
            </div>
          )}
        </>
      )}

      {/* Part B2 #4c: Morning Top Task prompt if not answered last night */}
      {!hasTodayTasks && (
        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10 text-xs">
          <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            {language === 'vi' ? 'Sáng nay, bạn làm gì đầu tiên?' : "What's your #1 task first thing this morning?"}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={firstTaskText}
              onChange={e => setFirstTaskText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddFirstTask();
              }}
              placeholder={language === 'vi' ? 'Nhập việc bạn muốn làm đầu tiên...' : 'Enter your first task...'}
              className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              onClick={handleAddFirstTask}
              disabled={!firstTaskText.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs disabled:opacity-40 transition-colors"
            >
              <Plus size={13} />
              <span>{language === 'vi' ? 'Ghi việc' : 'Add'}</span>
            </button>
          </div>
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
