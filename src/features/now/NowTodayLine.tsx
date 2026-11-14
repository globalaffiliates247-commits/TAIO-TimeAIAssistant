'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { getDeviceCalendarDate } from '@/core/clock';
import { fmtDuration } from '@/features/sticky/model/timeline';
import { useT } from '@/i18n/useT';
import { ChevronRight, Award } from 'lucide-react';

export const NowTodayLine: React.FC<{ stepsToday?: number }> = ({ stepsToday = 0 }) => {
  const { scheduleBlocks, dailyCardItems, setCurrentTab, language } = useApp();
  const { t } = useT();
  const today = getDeviceCalendarDate();

  const todayItems = (dailyCardItems || []).filter(i => i.date === today && i.status !== 'dropped');
  const doneCount = todayItems.filter(i => i.status === 'done').length;
  const totalCount = Math.max(todayItems.length, (scheduleBlocks || []).length);

  // Focus time in minutes
  const focusMins = todayItems
    .filter(i => i.status === 'done')
    .reduce((acc, curr) => acc + ((curr.extra?.actualMinutes as number) || (curr.extra?.durationMins as number) || 30), 0);

  const durationStr = fmtDuration(focusMins || 45, language as 'vi' | 'en');
  const stepsFormatted = stepsToday > 0 ? stepsToday.toLocaleString() : '0';

  return (
    <button
      type="button"
      onClick={() => setCurrentTab('achievements')}
      className="w-full py-2.5 px-4 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 transition-all flex items-center justify-between text-xs text-slate-700 font-semibold shadow-xs select-none group"
      title={t('nav.results', 'Hiệu quả')}
    >
      <div className="flex items-center gap-2 truncate">
        <Award className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="truncate">
          {language === 'en'
            ? `Today: ${doneCount}/${totalCount} tasks · ${durationStr} focus · ${stepsFormatted} steps`
            : `Hôm nay: ${doneCount}/${totalCount} việc · ${durationStr} tập trung · ${stepsFormatted} bước`}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
    </button>
  );
};
