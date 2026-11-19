'use client';

// TAIO Time App — Overview Entry Card for Now Tab & Quick Access (PRD v0.3.38 Part B3.3)
import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useT } from '@/i18n/useT';
import { computeGoalLedger } from '@/domain/goalLedger';
import { PieChart, ArrowRight, Target } from 'lucide-react';

export const OverviewNowCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { goals, dailyCardItems, scheduleBlocks, setCurrentTab } = useApp();
  const { t } = useT();

  const ledger = useMemo(() => {
    return computeGoalLedger(goals, dailyCardItems, scheduleBlocks, 'year', 2026);
  }, [goals, dailyCardItems, scheduleBlocks]);

  if (goals.length === 0) return null;

  const handleClick = () => {
    setCurrentTab('goals');
  };

  const PALETTE_COLORS = ['var(--taio-brand)', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#64748b'];

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      className={`group p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all active:scale-[0.99] space-y-2.5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-50 text-[var(--taio-brand)] flex items-center justify-center">
            <PieChart className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-extrabold text-slate-900">
            {t('overview.nowCardTitle', { year: 2026, count: ledger.summary.totalGoals, defaultValue: `Toàn cảnh 2026 · ${ledger.summary.totalGoals} mục tiêu` })}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--taio-brand)]">
          <span>{t('overview.viewOverview', 'Xem Toàn cảnh')}</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Mini Allocation Bar */}
      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
        {ledger.allocationBar.slice(0, 5).map((seg, idx) => (
          <div
            key={seg.id}
            style={{
              width: `${seg.percent}%`,
              backgroundColor: seg.color || PALETTE_COLORS[idx % PALETTE_COLORS.length],
            }}
            className="h-full first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>

      {/* Summary line */}
      <div className="text-[11px] text-slate-500 font-medium truncate">
        {t('overview.summaryRow', {
          onTrack: ledger.summary.onTrackCount,
          behind: ledger.summary.behindCount,
          ratio: ledger.summary.goalTimeRatioPercent,
          defaultValue: `${ledger.summary.onTrackCount} đúng nhịp · ${ledger.summary.behindCount} chậm · ${ledger.summary.goalTimeRatioPercent}% thời gian cho mục tiêu`
        })}
      </div>
    </div>
  );
};
