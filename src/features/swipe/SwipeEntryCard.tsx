'use client';

// TAIO Time App — Unified Swipe Entry Card & Action Button (PRD v0.3.38 Part A)
import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useT } from '@/i18n/useT';
import { countSwipeDeck } from '@/domain/swipeDeck';
import { getDeviceCalendarDate } from '@/core/clock';
import { Layers, ArrowRight, Zap } from 'lucide-react';

export interface SwipeEntryCardProps {
  variant?: 'card' | 'button' | 'compact';
  customCount?: number;
  minThreshold?: number;
  className?: string;
}

export const SwipeEntryCard: React.FC<SwipeEntryCardProps> = ({
  variant = 'card',
  customCount,
  minThreshold = 0,
  className = '',
}) => {
  const { dailyCardItems, inbox, backlogCards, setIsSwipeModalOpen } = useApp();
  const { t } = useT();

  const todayStr = useMemo(() => getDeviceCalendarDate(), []);

  // Exact card count across all entry points using domain rule (A2.1 & A3.4)
  const totalDeckCount = useMemo(() => {
    return countSwipeDeck(dailyCardItems, inbox as any, backlogCards, todayStr);
  }, [dailyCardItems, inbox, backlogCards, todayStr]);

  const count = typeof customCount === 'number' ? customCount : totalDeckCount;

  // A3.2: Quẹt hết (N = 0) -> thẻ tự ẩn
  if (count <= 0) return null;

  // A3.3: Threshold filter (e.g. Chưa xếp giờ only shows button when >= 3 tasks)
  if (minThreshold > 0 && count < minThreshold) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSwipeModalOpen(true);
  };

  // 1. Variant Button (Nhật ký hôm nay "Chưa xếp giờ" or headers)
  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 text-[11px] font-bold border border-amber-300/40 shadow-2xs transition-all active:scale-95 ${className}`}
        title={t('swipe.swipeNow', 'Quẹt thẻ ngay')}
      >
        <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
        <span>{t('swipe.swipeNow', 'Quẹt thẻ ngay')}</span>
        <span className="px-1 py-0.2 rounded-full bg-amber-200/70 text-[10px] font-extrabold text-amber-900">
          {count}
        </span>
      </button>
    );
  }

  // 2. Variant Compact (Pill button for toolbars or cards)
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-2xs transition-all active:scale-95 ${className}`}
      >
        <Layers className="w-3.5 h-3.5 text-amber-600" />
        <span>{t('swipe.swipeNow', 'Quẹt thẻ ngay')}</span>
        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold">
          {count}
        </span>
      </button>
    );
  }

  // 3. Variant Card (Màn Lúc này — right below "Đang làm")
  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick(e as any); }}
      className={`group relative flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/80 via-white to-orange-50/50 border border-amber-200/70 hover:border-amber-300 hover:shadow-xs cursor-pointer transition-all active:scale-[0.99] ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
          <Layers className="w-5 h-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-900 truncate">
              {t('swipe.tasksWaiting', { count, defaultValue: `${count} việc đang chờ · Quẹt thẻ ngay` })}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-[10.5px] font-extrabold text-amber-800 shrink-0">
              {count}
            </span>
          </div>
          <p className="text-[11.5px] text-slate-500 truncate mt-0.5">
            {t('swipe.cardSubtitle', 'Lên lịch nhanh, dọn dẹp việc linh động & rổ việc trong 1 phút')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <span className="hidden sm:inline text-xs font-bold text-amber-700 group-hover:text-amber-800">
          {t('swipe.swipeNow', 'Quẹt thẻ ngay')}
        </span>
        <div className="w-6 h-6 rounded-full bg-amber-100/60 group-hover:bg-amber-200/80 flex items-center justify-center transition-colors">
          <ArrowRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
