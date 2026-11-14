'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { openStickyBoard } from '@/features/sticky';
import { getDeviceCalendarDate, getDeviceTimeMinutes, timeToMinutes, computeBlockStatus } from '@/core/clock';
import { useT } from '@/i18n/useT';
import { Calendar, ChevronRight, ArrowRight } from 'lucide-react';
import type { TimeBlock } from '@/types';

export const NowNextList: React.FC = () => {
  const { scheduleBlocks, currentBlock } = useApp();
  const { t } = useT();
  const today = getDeviceCalendarDate();
  const nowMins = getDeviceTimeMinutes();

  // Next 3 tasks after current
  const upcomingTasks = (scheduleBlocks || [])
    .filter(b => {
      if (b.id === currentBlock?.id) return false;
      if (b.status === 'done' || b.status === 'dropped') return false;
      const bStatus = computeBlockStatus(b, nowMins);
      return bStatus === 'planned' || timeToMinutes(b.startTime) > nowMins;
    })
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    .slice(0, 3);

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
          {t('terms.next', 'Tiếp theo')}
        </span>
        <button
          type="button"
          onClick={() => openStickyBoard(today)}
          className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
        >
          <span>{t('basket.open_today_journal', 'Mở nhật ký hôm nay')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {upcomingTasks.length === 0 ? (
        <p className="text-xs text-slate-400 py-3 text-center">
          {t('terms.noMoreScheduledTasks', 'Không còn việc nào sắp tới hôm nay')}
        </p>
      ) : (
        <div className="space-y-1.5">
          {upcomingTasks.map((task) => (
            <div
              key={task.id}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 flex items-center justify-between gap-3 text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-bold tabular-nums text-slate-700 shrink-0">
                  {task.startTime}
                </span>
                <span className="font-semibold text-slate-900 truncate">
                  {task.title}
                </span>
              </div>
              {task.goalName && (
                <span className="text-[10px] text-slate-400 truncate max-w-[120px] shrink-0">
                  {task.goalName}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
