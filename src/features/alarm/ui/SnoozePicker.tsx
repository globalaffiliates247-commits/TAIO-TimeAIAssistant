'use client';

import React from 'react';
import { Clock, Minus, Plus } from 'lucide-react';
import { SNOOZE_PRESETS } from '../model/alarmTypes';
import { useT } from '@/i18n/useT';

interface SnoozePickerProps {
  currentMinutes: number;
  onMinutesChange: (mins: number) => void;
  onSnooze: (mins: number) => void;
  isDark?: boolean;
}

export const SnoozePicker: React.FC<SnoozePickerProps> = ({
  currentMinutes,
  onMinutesChange,
  onSnooze,
  isDark = true,
}) => {
  const { t } = useT();

  const currentIndex = SNOOZE_PRESETS.indexOf(currentMinutes as any);
  const activeIndex = currentIndex !== -1 ? currentIndex : SNOOZE_PRESETS.indexOf(5);

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIndex = Math.max(0, activeIndex - 1);
    onMinutesChange(SNOOZE_PRESETS[prevIndex]);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIndex = Math.min(SNOOZE_PRESETS.length - 1, activeIndex + 1);
    onMinutesChange(SNOOZE_PRESETS[nextIndex]);
  };

  const handleSnooze = () => {
    onSnooze(SNOOZE_PRESETS[activeIndex]);
  };

  return (
    <div className={`w-full flex items-center border rounded-2xl p-1 transition-all shadow-md ${
      isDark 
        ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300' 
        : 'bg-white border-slate-200 text-slate-700'
    }`}>
      {/* Decrease button (-) */}
      <button
        type="button"
        onClick={handleDecrease}
        disabled={activeIndex <= 0}
        aria-label="Giảm số phút báo lại"
        className={`w-12 h-12 rounded-xl flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all ${
          isDark 
            ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' 
            : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
        }`}
      >
        <Minus className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* Center Snooze Action button */}
      <button
        type="button"
        onClick={handleSnooze}
        className={`flex-1 py-3 px-2 flex items-center justify-center gap-2 rounded-xl transition-all font-semibold text-sm active:scale-[0.99] ${
          isDark 
            ? 'hover:bg-zinc-800/60' 
            : 'hover:bg-slate-50 text-slate-800'
        }`}
      >
        <Clock className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
        <span>
          {t('alarm.snooze_after', {
            mins: SNOOZE_PRESETS[activeIndex],
            defaultValue: `Báo lại sau ${SNOOZE_PRESETS[activeIndex]}p`
          })}
        </span>
      </button>

      {/* Increase button (+) */}
      <button
        type="button"
        onClick={handleIncrease}
        disabled={activeIndex >= SNOOZE_PRESETS.length - 1}
        aria-label="Tăng số phút báo lại"
        className={`w-12 h-12 rounded-xl flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all ${
          isDark 
            ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' 
            : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
        }`}
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
};
