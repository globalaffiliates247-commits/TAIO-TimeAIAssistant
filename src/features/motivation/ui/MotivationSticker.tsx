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
import { sendQuoteReaction } from '../model/quoteReaction';
import { useHighlight } from '@/features/prefs';
import { RefreshCw, Heart, X, ChevronDown, ChevronUp, Lightbulb, Pin } from 'lucide-react';
import { togglePinGoalQuote } from '../model/motivationStore';

export interface MotivationStickerProps {
  slotKey: keyof MotivationSettings['slots'];
  instanceKey?: string;
  context: QuoteContext;
  size?: StickerSize;
  activeGoalName?: string;
  activeGoalId?: string;
  className?: string;
  onHide?: () => void;
  collapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  palette?: {
    paper?: string;
    bar?: string;
    ink?: string;
    muted?: string;
    line?: string;
  };
}

export const MotivationSticker: React.FC<MotivationStickerProps> = ({
  slotKey,
  instanceKey,
  context,
  size = 'note',
  activeGoalName,
  activeGoalId,
  className = '',
  onHide,
  collapsible = false,
  isCollapsed = false,
  onToggleCollapse,
  palette: propPalette,
}) => {
  const effectiveKey = instanceKey || slotKey;
  const { language, palette } = useApp();
  const { t } = useT();
  const isCool = palette === 'cool' || palette === 'bright-blue' || palette === 'calm-blue';
  const { highlightStyle } = useHighlight();

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
      instanceKey: effectiveKey,
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
      quoteRegistry.register(effectiveKey, res.quote.id);
    } else {
      quoteRegistry.unregister(effectiveKey);
    }
  }, [slotKey, effectiveKey, context, language, allQuotes, userState, activeGoalName, activeGoalId]);

  useEffect(() => {
    resolveQuote(false);
  }, [slotKey, effectiveKey, context, language]);

  // Clean up active quote registration on unmount
  useEffect(() => {
    return () => {
      quoteRegistry.unregister(effectiveKey);
    };
  }, [effectiveKey]);

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

    // PRD v0.3.35 B3.2: Anonymous server reaction (fire-and-forget)
    sendQuoteReaction(currentQuote.id, isFav ? 'unheart' : 'heart');

    const updatedState = { ...userState, favorites: updatedFavs };
    setUserState(updatedState);
    saveUserMotivationState(updatedState);
  };

  // Action: × Ẩn hết hôm nay
  const handleHideToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentQuote) {
      // PRD v0.3.35 B3.3: Anonymous server hide reaction
      sendQuoteReaction(currentQuote.id, 'hide');
    }
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
  const targetKey = currentQuote.quoteKey || currentQuote.id;
  const isGoalPinned = Boolean(
    activeGoalId && currentQuote &&
    (userState.pinnedGoalQuotes?.[activeGoalId] === targetKey ||
     userState.pinnedGoalQuotes?.[activeGoalId] === currentQuote.id)
  );

  const handleTogglePinGoal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeGoalId || !currentQuote) return;
    const nextPinned = togglePinGoalQuote(activeGoalId, targetKey);
    const updatedMap = { ...(userState.pinnedGoalQuotes || {}) };
    if (nextPinned) {
      updatedMap[activeGoalId] = targetKey;
    } else {
      delete updatedMap[activeGoalId];
    }
    setUserState({ ...userState, pinnedGoalQuotes: updatedMap });
  };

  // Render by size
  if (size === 'line') {
    const containerClasses = propPalette
      ? `group relative flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-xl border transition-colors ${className}`
      : `group relative flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-black/5 dark:border-white/5 transition-colors ${className}`;
    const containerStyle = propPalette
      ? {
          borderColor: propPalette.line,
          backgroundColor: 'rgba(0,0,0,0.03)',
        }
      : undefined;

    return (
      <div
        className={containerClasses}
        style={containerStyle}
        title={currentQuote.text}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Lightbulb className="w-3.5 h-3.5 shrink-0 text-[var(--taio-brand)] stroke-[1.75]" />
          <div
            className="flex-1 cursor-pointer truncate"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span
              className={`font-normal italic ${propPalette ? '' : 'text-slate-800 dark:text-slate-100'}`}
              style={propPalette?.ink ? { color: propPalette.ink } : undefined}
            >
              "{currentQuote.text}"
            </span>
            {currentQuote.author && (
              <span
                className={`ml-1 text-[10px] not-italic ${propPalette ? '' : 'text-neutral-400 dark:text-neutral-500'}`}
                style={propPalette?.muted ? { color: propPalette.muted } : undefined}
              >
                — {currentQuote.author}
              </span>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
          {activeGoalId && (
            <button
              onClick={handleTogglePinGoal}
              className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                isGoalPinned ? 'text-[var(--taio-brand)] font-bold' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
              title={isGoalPinned ? (language === 'en' ? 'Unpin from this goal' : 'Bỏ gắn cho mục tiêu này') : (language === 'en' ? 'Pin to this goal' : 'Gắn cho mục tiêu này')}
            >
              <Pin size={12} className={isGoalPinned ? 'fill-current' : ''} />
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            title={t('motivation.refresh', 'Đổi câu khác')}
          >
            <RefreshCw size={11} />
          </button>
          <button
            onClick={handleToggleFavorite}
            className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
              isFavorited ? 'text-red-500 hover:text-red-600' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
            title={t('motivation.favorite', 'Lưu vào kho của tôi')}
          >
            <Heart size={11} className={isFavorited ? 'fill-current' : ''} />
          </button>
          <button
            onClick={handleHideToday}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            title={t('motivation.hideToday', 'Ẩn hết hôm nay')}
          >
            <X size={11} />
          </button>
          {collapsible && isCollapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              title={t('common.expand', 'Mở rộng')}
            >
              <ChevronDown size={11} />
            </button>
          )}
        </div>

        {/* Expanded popup if clicked on line */}
        {isExpanded && (
          <div
            className="absolute left-0 top-full mt-1 z-30 w-full max-w-md p-3 rounded-xl bg-[var(--surface-card,#FFFFFF)] text-[var(--text-primary,#0F172A)] shadow-xl border border-[var(--border-subtle,#E2E8F0)] dark:bg-neutral-800 dark:text-neutral-200 text-xs"
            onClick={e => e.stopPropagation()}
          >
            <div className="font-normal italic leading-relaxed text-slate-800 dark:text-slate-100">
              "{currentQuote.text}"
            </div>
            {currentQuote.author && (
              <div className="mt-1 text-right text-[11px] opacity-70 not-italic">
                — {currentQuote.author}
              </div>
            )}
            <button
              onClick={() => setIsExpanded(false)}
              className="mt-1 text-[10px] opacity-60 hover:opacity-100 underline cursor-pointer"
            >
              {t('common.close', 'Đóng')}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (size === 'note') {
    const containerClasses = propPalette
      ? `group relative p-2.5 rounded-lg border transition-all ${className}`
      : `group relative p-2.5 rounded-lg border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] transition-all ${className}`;
    const containerStyle = propPalette
      ? {
          borderColor: propPalette.line,
          backgroundColor: 'rgba(0,0,0,0.03)',
        }
      : undefined;

    return (
      <div
        className={containerClasses}
        style={containerStyle}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className={`flex-1 cursor-pointer text-xs font-normal italic leading-relaxed ${
              propPalette ? '' : 'text-neutral-800 dark:text-neutral-100'
            } ${isExpanded ? '' : 'line-clamp-3'}`}
            style={propPalette?.ink ? { color: propPalette.ink } : undefined}
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
          <div
            className={`mt-1 text-right text-[10px] not-italic ${propPalette ? '' : 'text-neutral-400 dark:text-neutral-500'}`}
            style={propPalette?.muted ? { color: propPalette.muted } : undefined}
          >
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
  const cardClasses = propPalette
    ? `group relative p-3.5 rounded-2xl border transition-all ${className}`
    : `group relative p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 shadow-2xs transition-all ${className}`;
  const cardStyle = propPalette
    ? {
        borderColor: propPalette.line,
        backgroundColor: 'rgba(0,0,0,0.02)',
      }
    : undefined;

  return (
    <div
      className={cardClasses}
      style={cardStyle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-[var(--taio-brand-soft)] flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-[var(--taio-brand)] stroke-[1.75]" />
          </div>
          <div
            className={`flex-1 cursor-pointer text-xs sm:text-sm font-normal italic leading-relaxed ${
              propPalette ? '' : 'text-slate-800 dark:text-slate-100'
            } ${isExpanded ? '' : 'line-clamp-3'}`}
            style={propPalette?.ink ? { color: propPalette.ink } : undefined}
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
            {currentQuote.author && (
              <div
                className={`mt-1.5 text-right text-xs not-italic ${propPalette ? '' : 'text-neutral-500 dark:text-neutral-400'}`}
                style={propPalette?.muted ? { color: propPalette.muted } : undefined}
              >
                — {currentQuote.author}
              </div>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
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
    </div>
  );
};
