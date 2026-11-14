'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { openStickyBoard } from '@/features/sticky';
import { getDeviceCalendarDate } from '@/core/clock';
import { FreeTimerInput, FreeTimerList } from '@/features/clock';
import { useT } from '@/i18n/useT';
import { StickyNote, Timer, ChevronDown, ChevronUp, X } from 'lucide-react';

export const NowActions: React.FC = () => {
  const { 
    palette,
    freeTimers,
    addFreeTimer,
    togglePauseFreeTimer,
    addFreeTimerSeconds,
    finishFreeTimer,
    deleteFreeTimer,
    restartFreeTimer
  } = useApp();
  const { t } = useT();

  const [timersOpen, setTimersOpen] = useState(false);
  const isCool = palette === 'cool';
  const activeCount = (freeTimers || []).filter(t => t.status === 'running').length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Tile 1: Ghi nhanh */}
        <button
          type="button"
          onClick={() => openStickyBoard(getDeviceCalendarDate())}
          className="p-3.5 rounded-2xl bg-[#FFF6C2] hover:bg-[#FCEB8E] text-[#6B5E2A] border border-[#F0E3A2] transition-all flex items-center justify-between shadow-xs active:scale-98 select-none text-left"
          title={t('terms.quickNote', 'Ghi nhanh')}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
              <StickyNote className="w-4 h-4 text-[#6B5E2A]" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm leading-tight text-[#4A421D]">
                {t('terms.quickNote', 'Ghi nhanh')}
              </div>
              <div className="text-[10px] text-[#8E7F3D]">
                {t('basket.sticky_notes', 'Tờ ghi chú')}
              </div>
            </div>
          </div>
        </button>

        {/* Tile 2: Bấm giờ riêng */}
        <button
          type="button"
          onClick={() => setTimersOpen(v => !v)}
          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between shadow-xs active:scale-98 select-none text-left ${
            timersOpen
              ? isCool 
                ? 'bg-blue-50 border-blue-300 text-blue-900' 
                : 'bg-red-50 border-red-300 text-red-900'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
          }`}
          title={t('terms.freeTimer', 'Bấm giờ riêng')}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isCool ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-[#E0401F]'
            }`}>
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm leading-tight">
                {t('terms.freeTimer', 'Bấm giờ riêng')}
              </div>
              <div className="text-[10px] text-slate-500">
                {activeCount > 0 ? `${activeCount} đang chạy` : 'Bấm để mở'}
              </div>
            </div>
          </div>
          {timersOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {/* Expandable Free Timers Section */}
      {timersOpen && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Timer className={`w-4 h-4 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
              <span className="font-bold text-xs text-slate-900">
                {t('terms.freeTimer', 'Bấm giờ riêng')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTimersOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <FreeTimerInput onAddTimer={addFreeTimer} activeCount={activeCount} />

          <FreeTimerList
            timers={freeTimers || []}
            onTogglePause={togglePauseFreeTimer}
            onAddSeconds={addFreeTimerSeconds}
            onFinishTimer={finishFreeTimer}
            onDeleteTimer={deleteFreeTimer}
            onRestartTimer={restartFreeTimer}
          />
        </div>
      )}
    </div>
  );
};
