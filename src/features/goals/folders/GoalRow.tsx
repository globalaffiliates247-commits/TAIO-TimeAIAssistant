// TAIO Time App — Goal Row Component (PRD v0.3.33 Part H)
'use client';

import React from 'react';
import { Goal, TimeBlock } from '@/types';
import { GoalRowDetail } from './GoalRowDetail';
import { ChevronRight, ChevronDown, Clock, Calendar } from 'lucide-react';
import { useT } from '@/i18n/useT';
import { useApp } from '@/context/AppContext';
import { formatDuration } from '@/i18n/format';

export interface GoalRowProps {
  goal: Goal;
  isExpanded: boolean;
  todayMinutes: number;
  todayBlocks: TimeBlock[];
  onToggle: () => void;
  onOpenDedicatedPage: () => void;
}

export const GoalRow: React.FC<GoalRowProps> = ({
  goal,
  isExpanded,
  todayMinutes,
  todayBlocks,
  onToggle,
  onOpenDedicatedPage,
}) => {
  const { t } = useT();
  const { language } = useApp();
  const pct = Math.max(0, Math.min(100, Math.round(goal.progressPercent || 0)));

  return (
    <div className="space-y-2">
      {/* Single Row Item */}
      <div
        onClick={onToggle}
        className={`group p-3.5 rounded-2xl bg-white/90 hover:bg-white border transition-all cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
          isExpanded
            ? 'border-black/20 ring-1 ring-black/10'
            : 'border-black/5 hover:border-black/15'
        }`}
      >
        {/* Left: Expand icon + Name (not bold) */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
          <span className="text-sm font-normal text-slate-800 truncate">
            {goal.name}
          </span>
        </div>

        {/* Right: Progress bar, %, Deadline, Today's focus minutes */}
        <div className="flex items-center gap-4 shrink-0 text-xs text-slate-500 self-end sm:self-auto">
          {/* Progress bar + percent */}
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden border border-black/5">
              <div
                className="h-full bg-slate-800 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono font-bold text-slate-800 tabular-nums w-8 text-right">
              {pct}%
            </span>
          </div>

          {/* Remaining deadline */}
          {goal.deadline && (
            <div className="hidden md:flex items-center gap-1 font-mono text-[11px] text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{goal.deadline}</span>
            </div>
          )}

          {/* Today's focus minutes */}
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-black/5 px-2 py-0.5 rounded-md">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>
              {`${t('terms.today', 'Hôm nay')}: ${formatDuration(todayMinutes, language)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded in-place drawer */}
      {isExpanded && (
        <GoalRowDetail
          goal={goal}
          todayBlocks={todayBlocks}
          onOpenDedicatedPage={onOpenDedicatedPage}
        />
      )}
    </div>
  );
};
