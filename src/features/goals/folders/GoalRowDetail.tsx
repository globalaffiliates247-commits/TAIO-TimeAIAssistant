// TAIO Time App — Goal Row Inline Expandable Detail (PRD v0.3.33 Part H)
'use client';

import React from 'react';
import { Goal, TimeBlock } from '@/types';
import { Flag, CheckCircle2, Clock, ExternalLink, Calendar } from 'lucide-react';
import { useT } from '@/i18n/useT';

export interface GoalRowDetailProps {
  goal: Goal;
  todayBlocks: TimeBlock[];
  onOpenDedicatedPage: () => void;
}

export const GoalRowDetail: React.FC<GoalRowDetailProps> = ({
  goal,
  todayBlocks,
  onOpenDedicatedPage,
}) => {
  const { t } = useT();

  return (
    <div className="p-4 rounded-2xl bg-white/90 border border-black/10 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
      {/* Top row: Measurable result + Action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-3">
        <div className="space-y-0.5">
          <span className="text-[10.5px] uppercase font-bold tracking-wider text-slate-500">
            {t('goals.target_result', 'Kết quả then chốt')}
          </span>
          <p className="text-xs font-medium text-slate-800">
            {goal.measurableResult || goal.name}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenDedicatedPage}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <span>{t('goals.open_page', 'Mở trang mục tiêu')}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid: 2 columns (Milestones & Today's tasks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
        {/* Column 1: Milestones */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Flag className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('goals.milestones', 'Cột mốc')} ({goal.milestones?.length || 0})</span>
            </span>
          </div>

          {(!goal.milestones || goal.milestones.length === 0) ? (
            <p className="text-[11px] text-slate-400 italic py-2">
              {t('goals.no_milestones', 'Chưa có cột mốc nào')}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {goal.milestones.map(m => {
                const isCompleted = m.status === 'completed';
                return (
                  <div
                    key={m.id}
                    className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isCompleted ? 'text-emerald-500 fill-emerald-100' : 'text-slate-300'
                        }`}
                      />
                      <span className={`text-[11.5px] truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {m.name}
                      </span>
                    </div>
                    {m.dueDate && (
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {m.dueDate}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 2: Today's tasks */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{t('goals.today_tasks', 'Việc hôm nay')} ({todayBlocks.length})</span>
            </span>
          </div>

          {todayBlocks.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic py-2">
              {t('goals.no_today_tasks', 'Hôm nay chưa có việc nào gắn với mục tiêu này')}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {todayBlocks.map(b => (
                <div
                  key={b.id}
                  className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11.5px] text-slate-800 truncate">
                      {b.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {b.startTime}–{b.endTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
