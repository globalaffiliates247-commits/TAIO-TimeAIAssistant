// TAIO Time App — Motivation Sticker Component (PRD FEATURE v0.3.31 Part A)
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { useT } from '../../../i18n/useT';
import { getDeviceCalendarDate } from '@/core/clock';
import {
  MotivationQuote,
  QuoteContext,
  StickerSize,
  MotivationSettings,
} from '../model/types';
import {
  loadUserMotivationState,
  saveUserMotivationState,
  loadMotivationSettings,
  loadServerQuotesCache,
  getAllQuotes,
  getOrPickDailyQuote,
} from '../model/motivationStore';
import { quoteRegistry } from '../model/quoteRegistry';
import { RefreshCw, Heart, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface MotivationStickerProps {
  slotKey: keyof MotivationSettings['slots'];
  context: QuoteContext;
  size?: StickerSize;
  activeGoalName?: string;
  activeGoalId?: string;
  className?: string;
  onHide?: () => void;
  collapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const MotivationSticker: React.FC<MotivationStickerProps> = ({
  slotKey,
  context,
  size = 'note',
  activeGoalName,
  activeGoalId,
  className = '',
  onHide,
  collapsible = false,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { language, palette } = useApp();
  const { t } = useT();
  const isCool = palette === 'cool';

  const [settings, setSettings] = useState(() => loadMotivationSettings());
  const [userState, setUserState] = useState(() => loadUserMotivationState());
  const [serverQuotes] = useState(() => loadServerQuotesCache());
  const [currentQuote, setCurrentQuote] = useState<MotivationQuote | null>(null);
  const [isHiddenToday, setIsHiddenToday] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // All combined quotes
  const allQuotes = useMemo(() => {
    return getAllQuotes(serverQuotes, userState.customQuotes);
  }, [serverQuotes, userState.customQuotes]);

  // Load or pick quote
  const resolveQuote = useCallback((forceRefresh = false) => {
    const res = getOrPickDailyQuote({
      slotKey,
      context,
      lang: language,
      quotes: allQuotes,
      userState,
      activeGoalName,
      activeGoalId,
      forceRefresh,
    });

    setCurrentQuote(res.quote);
    setIsHiddenToday(res.isHiddenToday);
    setUserState(res.updatedState);
    if (res.quote && !res.isHiddenToday) {
      quoteRegistry.register(slotKey, res.quote.id);
    } else {
      quoteRegistry.unregister(slotKey);
    }
  }, [slotKey, context, language, allQuotes, userState, activeGoalName, activeGoalId]);

  useEffect(() => {
    resolveQuote(false);
  }, [slotKey, context, language]);

  // Clean up active quote registration on unmount
  useEffect(() => {
    return () => {
      quoteRegistry.unregister(slotKey);
    };
  }, [slotKey]);

  // Action: ↻ Đổi câu khác
  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    resolveQuote(true);
  };

  // Action: ♥ Lưu vào kho của tôi (toggle favorite)
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentQuote) return;

    const isFav = userState.favorites.includes(currentQuote.id);
    const updatedFavs = isFav
      ? userState.favorites.filter(id => id !== currentQuote.id)
      : [...userState.favorites, currentQuote.id];

    const updatedState = { ...userState, favorites: updatedFavs };
    setUserState(updatedState);
    saveUserMotivationState(updatedState);
  };

  // Action: × Ẩn hết hôm nay
  const handleHideToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = getDeviceCalendarDate();
    const updatedState = {
      ...userState,
      hiddenTodaySlots: {
        ...userState.hiddenTodaySlots,
        [slotKey]: today,
      },
    };
    setUserState(updatedState);
    saveUserMotivationState(updatedState);
    quoteRegistry.unregister(slotKey);
    setIsHiddenToday(true);
    if (onHide) onHide();
  };

  // Check if disabled by settings or hidden today
  if (!settings.enabled || !settings.slots[slotKey] || isHiddenToday || !currentQuote) {
    return null;
  }

  const isFavorited = userState.favorites.includes(currentQuote.id);

  // Render by size
  if (size === 'line') {
    return (
      <div
        className={`group relative flex items-center justify-between gap-2 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400 bg-black/[0.02] dark:bg-white/[0.02] rounded border border-black/5 dark:border-white/5 transition-colors ${className}`}
        title={currentQuote.text}
      >
        <div
          className="flex-1 cursor-pointer truncate"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="font-normal italic">
            "{currentQuote.text}"
          </span>
          {currentQuote.author && (
            <span className="ml-1 text-[10px] text-neutral-400 dark:text-neutral-500 not-italic">
              — {currentQuote.author}
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleRefresh}
            className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            title={t('motivation.refresh', 'Đổi câu khác')}
          >
            <RefreshCw size={11} />
          </button>
          <button
            onClick={handleToggleFavorite}
            className={`p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
              isFavorited ? 'text-red-500 hover:text-red-600' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
            title={t('motivation.favorite', 'Lưu vào kho của tôi')}
          >
            <Heart size={11} className={isFavorited ? 'fill-current' : ''} />
          </button>
          <button
            onClick={handleHideToday}
            className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            title={t('motivation.hideToday', 'Ẩn hết hôm nay')}
          >
            <X size={11} />
          </button>
          {collapsible && isCollapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              title={t('common.expand', 'Mở rộng')}
            >
              <ChevronDown size={11} />
            </button>
          )}
        </div>

        {/* Expanded popup if clicked on line */}
        {isExpanded && (
          <div
            className="absolute left-0 top-full mt-1 z-30 w-full max-w-md p-2.5 rounded-lg bg-white dark:bg-neutral-800 shadow-lg border border-black/10 dark:border-white/10 text-xs text-neutral-800 dark:text-neutral-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="font-normal italic leading-relaxed">
              "{currentQuote.text}"
            </div>
            {currentQuote.author && (
              <div className="mt-1 text-right text-[11px] text-neutral-500 dark:text-neutral-400 not-italic">
                — {currentQuote.author}
              </div>
            )}
            <button
              onClick={() => setIsExpanded(false)}
              className="mt-1 text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline"
            >
              {t('common.close', 'Đóng')}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (size === 'note') {
    return (
      <div
        className={`group relative p-2.5 rounded-lg border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] transition-all ${className}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className={`flex-1 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300 font-normal italic leading-relaxed ${
              isExpanded ? '' : 'line-clamp-3'
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            "{currentQuote.text}"
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleRefresh}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              title={t('motivation.refresh', 'Đổi câu khác')}
            >
              <RefreshCw size={12} />
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                isFavorited ? 'text-red-500 hover:text-red-600' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
              title={t('motivation.favorite', 'Lưu vào kho của tôi')}
            >
              <Heart size={12} className={isFavorited ? 'fill-current' : ''} />
            </button>
            <button
              onClick={handleHideToday}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              title={t('motivation.hideToday', 'Ẩn hết hôm nay')}
            >
              <X size={12} />
            </button>
            {collapsible && !isCollapsed && onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                title={t('common.collapse', 'Thu gọn')}
              >
                <ChevronUp size={12} />
              </button>
            )}
          </div>
        </div>

        {currentQuote.author && (
          <div className="mt-1 text-right text-[10px] text-neutral-400 dark:text-neutral-500 not-italic">
            — {currentQuote.author}
          </div>
        )}

        {/* v0.3.34 Part C5: Original quote text when viewing a translation */}
        {currentQuote.originalText && isExpanded && (
          <div className="mt-1.5 pt-1.5 border-t border-black/5 dark:border-white/10 text-[10.5px] text-neutral-500 dark:text-neutral-400 italic">
            <span className="font-semibold not-italic text-neutral-600 dark:text-neutral-300">
              {t('motivation.original', 'Nguyên văn')} ({currentQuote.originalLang || 'en'}):
            </span> "{currentQuote.originalText}"
          </div>
        )}
      </div>
    );
  }

  // Card size (e.g. GoalsTab, CloseDayModal)
  return (
    <div
      className={`group relative p-3.5 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-800 shadow-sm transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex-1 cursor-pointer text-sm text-neutral-800 dark:text-neutral-200 font-normal italic leading-relaxed ${
            isExpanded ? '' : 'line-clamp-4'
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          "{currentQuote.text}"

          {/* v0.3.34 Part C5: Original quote text when viewing a translation */}
          {currentQuote.originalText && isExpanded && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400 italic font-normal">
              <span className="font-semibold not-italic text-neutral-700 dark:text-neutral-300">
                {t('motivation.original', 'Nguyên văn')} ({currentQuote.originalLang || 'en'}):
              </span> "{currentQuote.originalText}"
            </div>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            title={t('motivation.refresh', 'Đổi câu khác')}
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={handleToggleFavorite}
            className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
              isFavorited ? 'text-red-500 hover:text-red-600' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
            title={t('motivation.favorite', 'Lưu vào kho của tôi')}
          >
            <Heart size={14} className={isFavorited ? 'fill-current' : ''} />
          </button>
          <button
            onClick={handleHideToday}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            title={t('motivation.hideToday', 'Ẩn hết hôm nay')}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {currentQuote.author && (
        <div className="mt-2 text-right text-xs text-neutral-500 dark:text-neutral-400 not-italic">
          — {currentQuote.author}
        </div>
      )}
    </div>
  );
};
