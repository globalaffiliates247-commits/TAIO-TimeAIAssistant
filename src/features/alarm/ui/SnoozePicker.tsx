'use client';

import React from 'react';
import { Clock, Minus, Plus } from 'lucide-react';
import { SNOOZE_PRESETS } from '../model/alarmTypes';
import { useT } from '@/i18n/useT';

interface SnoozePickerProps {
  currentMinutes: number;
  onMinutesChange: (mins: number) => void;
  onSnooze: (mins: number) => void;
}

export const SnoozePicker: React.FC<SnoozePickerProps> = ({
  currentMinutes,
  onMinutesChange,
  onSnooze,
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
    <div className="w-full flex items-center bg-zinc-900/90 border border-zinc-800 rounded-2xl p-1 text-zinc-300 transition-all shadow-md">
      {/* Decrease button (-) */}
      <button
        type="button"
        onClick={handleDecrease}
        disabled={activeIndex <= 0}
        aria-label="Giảm số phút báo lại"
        className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-zinc-800 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all text-zinc-400 hover:text-white"
      >
        <Minus className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* Center Snooze Action button */}
      <button
        type="button"
        onClick={handleSnooze}
        className="flex-1 py-3 px-2 flex items-center justify-center gap-2 hover:bg-zinc-800/60 rounded-xl transition-all font-semibold text-sm active:scale-[0.99]"
      >
        <Clock className="w-4 h-4 text-amber-400" />
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
        className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-zinc-800 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all text-zinc-400 hover:text-white"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
};
