'use client';

// TAIO Time App — Goal Overview Screen (PRD v0.3.38 Part B3.1 & B0)
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useT } from '@/i18n/useT';
import { computeGoalLedger, OverviewPeriod, GoalLedgerEntry } from '@/domain/goalLedger';
import { GoalDetailModal } from './GoalDetailModal';
import { 
  ChevronRight, 
  Target, 
  Clock, 
  TrendingUp, 
  Zap, 
  PieChart, 
  Layers, 
  Briefcase,
  HelpCircle,
  ArrowUpDown
} from 'lucide-react';

export const OverviewScreen: React.FC = () => {
  const { goals, dailyCardItems, scheduleBlocks, language } = useApp();
  const { t } = useT();

  const [period, setPeriod] = useState<OverviewPeriod>('year');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [dimension, setDimension] = useState<'goal' | 'project' | 'workArea'>('goal');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'allocation' | 'progress' | 'time' | 'spi'>('allocation');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pure EVM & Ledger calculation
  const ledger = useMemo(() => {
    return computeGoalLedger(
      goals,
      dailyCardItems,
      scheduleBlocks,
      period,
      selectedYear,
      new Date('2026-11-15T12:00:00Z')
    );
  }, [goals, dailyCardItems, scheduleBlocks, period, selectedYear]);

  // Sort entries
  const sortedEntries = useMemo(() => {
    const list = [...ledger.entries];
    list.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'allocation') diff = b.allocationPercent - a.allocationPercent;
      else if (sortBy === 'progress') diff = b.progressPercent - a.progressPercent;
      else if (sortBy === 'time') diff = b.actualHours - a.actualHours;
      else if (sortBy === 'spi') diff = b.spi - a.spi;
      return sortAsc ? -diff : diff;
    });
    return list;
  }, [ledger.entries, sortBy, sortAsc]);

  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  const selectedEntry = ledger.entries.find(e => e.id === selectedGoalId);

  const handleHeaderSort = (key: 'allocation' | 'progress' | 'time' | 'spi') => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  const PALETTE_COLORS = [
    '#E0401F', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'
  ];

  return (
    <div className="flex flex-col gap-5 w-full max-w-4xl mx-auto py-2">
      {/* Top Header: Title & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E0401F] to-amber-500 text-white flex items-center justify-center shadow-xs">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {t('overview.title', { year: selectedYear, defaultValue: `Toàn cảnh mục tiêu · ${selectedYear}` })}
            </h2>
          </div>
        </div>

        {/* Period Selector: Tuần · Tháng · Quý · Năm */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/60 self-start sm:self-auto text-xs font-bold text-slate-600">
          {(['week', 'month', 'quarter', 'year'] as OverviewPeriod[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg transition-all ${
                period === p ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              {p === 'week' ? t('overview.periodWeek', 'Tuần') :
               p === 'month' ? t('overview.periodMonth', 'Tháng') :
               p === 'quarter' ? t('overview.periodQuarter', 'Quý') :
               t('overview.periodYear', 'Năm')}
            </button>
          ))}
        </div>
      </div>

      {/* Block: "Thời gian của bạn đi vào đâu" (Allocation Bar & Legend) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-slate-800 tracking-tight">
            {t('overview.whereTimeGoes', 'Thời gian của bạn đi vào đâu')}
          </span>
          {/* Dimension toggle: Mục tiêu · Dự án · Nhóm việc */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 p-0.5 rounded-lg border border-slate-100">
            <button
              type="button"
              onClick={() => setDimension('goal')}
              className={`px-2 py-0.5 rounded-md transition-colors ${dimension === 'goal' ? 'bg-white text-slate-900 shadow-2xs font-bold' : ''}`}
            >
              {t('overview.byGoal', 'Mục tiêu')}
            </button>
            <button
              type="button"
              onClick={() => setDimension('project')}
              className={`px-2 py-0.5 rounded-md transition-colors ${dimension === 'project' ? 'bg-white text-slate-900 shadow-2xs font-bold' : ''}`}
            >
              {t('overview.byProject', 'Dự án')}
            </button>
            <button
              type="button"
              onClick={() => setDimension('workArea')}
              className={`px-2 py-0.5 rounded-md transition-colors ${dimension === 'workArea' ? 'bg-white text-slate-900 shadow-2xs font-bold' : ''}`}
            >
              {t('overview.byWorkArea', 'Nhóm việc')}
            </button>
          </div>
        </div>

        {/* 100% Horizontal Proportional Bar */}
        <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
          {ledger.allocationBar.map((seg, idx) => (
            <div
              key={seg.id}
              style={{
                width: `${seg.percent}%`,
                backgroundColor: seg.color || PALETTE_COLORS[idx % PALETTE_COLORS.length],
              }}
              title={`${seg.label}: ${seg.percent}% (${seg.hours}g)`}
              className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 pt-1">
          {ledger.allocationBar.map((seg, idx) => (
            <div key={seg.id} className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.color || PALETTE_COLORS[idx % PALETTE_COLORS.length] }}
              />
              <span className="font-semibold text-slate-800 truncate max-w-[140px]">{seg.label}</span>
              <span className="text-slate-400 font-mono text-[11px]">{seg.percent}% ({seg.hours}g)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Goal Table (Desktop) / 2-Line Cards (Mobile) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
        {/* Mobile View: 2-line cards */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {sortedEntries.map(e => (
            <div
              key={e.id}
              onClick={() => setSelectedGoalId(e.id)}
              className="py-3 flex flex-col gap-2 cursor-pointer active:bg-slate-50 transition-colors"
            >
              {/* Line 1: Name, size, and pacing badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black shrink-0">
                    {e.size || 'M'}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 truncate">{e.name}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10.5px] font-extrabold shrink-0 ${
                  e.paceStatus === 'on_track' ? 'bg-emerald-50 text-emerald-800' :
                  e.paceStatus === 'behind' ? 'bg-rose-50 text-rose-800' : 'bg-blue-50 text-blue-800'
                }`}>
                  {e.paceLabel}
                </span>
              </div>

              {/* Progress bar with Should-be-at Marker */}
              <div className="relative w-full h-2 rounded-full bg-slate-100 overflow-visible">
                <div
                  style={{ width: `${Math.min(100, e.progressPercent)}%` }}
                  className="h-full rounded-full bg-[#E0401F] transition-all"
                />
                {/* Should-be-at marker */}
                <div
                  style={{ left: `${Math.min(100, Math.max(0, e.shouldBeAtPercent))}%` }}
                  className="absolute top-[-2px] bottom-[-2px] w-1 bg-amber-500 rounded-full shadow-xs"
                  title={`Mức nên đạt hôm nay: ${e.shouldBeAtPercent}%`}
                />
              </div>

              {/* Line 2: Three small numbers */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>{e.progressPercent}% / {e.shouldBeAtPercent}%</span>
                <span>{e.actualHours}g / {e.plannedHours}g</span>
                <span className="font-sans font-semibold text-slate-700">{e.allocationPercent}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2 cursor-pointer hover:text-slate-700" onClick={() => handleHeaderSort('allocation')}>
                  <div className="flex items-center gap-1">
                    <span>{t('overview.colGoal', 'Mục tiêu & Cỡ')}</span>
                  </div>
                </th>
                <th className="pb-3 cursor-pointer hover:text-slate-700" onClick={() => handleHeaderSort('progress')}>
                  <div className="flex items-center gap-1">
                    <span>{t('overview.colProgress', 'Tiến độ & Nhịp')}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-300" />
                  </div>
                </th>
                <th className="pb-3 cursor-pointer hover:text-slate-700" onClick={() => handleHeaderSort('time')}>
                  <div className="flex items-center gap-1">
                    <span>{t('overview.colTime', 'Đã dùng / Dự kiến')}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-300" />
                  </div>
                </th>
                <th className="pb-3">{t('overview.colEfficiency', 'Hiệu suất')}</th>
                <th className="pb-3 pr-2 text-right cursor-pointer hover:text-slate-700" onClick={() => handleHeaderSort('allocation')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>{t('overview.colShare', 'Tỷ trọng')}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-300" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedEntries.map(e => (
                <tr
                  key={e.id}
                  onClick={() => setSelectedGoalId(e.id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 pl-2 font-extrabold text-slate-900 max-w-[220px]">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black shrink-0">
                        {e.size || 'M'}
                      </span>
                      <span className="truncate group-hover:text-[#E0401F] transition-colors">{e.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 min-w-[180px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-slate-800">{e.progressPercent}%</span>
                        <span className={`px-1.5 rounded-sm font-bold text-[10px] ${
                          e.paceStatus === 'on_track' ? 'bg-emerald-50 text-emerald-800' :
                          e.paceStatus === 'behind' ? 'bg-rose-50 text-rose-800' : 'bg-blue-50 text-blue-800'
                        }`}>
                          {e.paceLabel}
                        </span>
                      </div>
                      <div className="relative w-full h-2 rounded-full bg-slate-100 overflow-visible">
                        <div
                          style={{ width: `${Math.min(100, e.progressPercent)}%` }}
                          className="h-full rounded-full bg-[#E0401F] transition-all"
                        />
                        {/* Should-be-at Marker */}
                        <div
                          style={{ left: `${Math.min(100, Math.max(0, e.shouldBeAtPercent))}%` }}
                          className="absolute top-[-2px] bottom-[-2px] w-1 bg-amber-500 rounded-full shadow-xs"
                          title={`Mức nên đạt hôm nay: ${e.shouldBeAtPercent}%`}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 font-mono text-slate-700">
                    <strong>{e.actualHours}g</strong> <span className="text-slate-400">/ {e.plannedHours}g</span>
                  </td>
                  <td className="py-3.5 text-slate-600 font-semibold">
                    {e.efficiencyPercent !== null ? (
                      <span className={e.efficiencyPercent >= 100 ? 'text-emerald-700' : 'text-slate-700'}>
                        {e.efficiencyPercent}%
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">{e.efficiencyLabel}</span>
                    )}
                  </td>
                  <td className="py-3.5 pr-2 text-right font-extrabold text-slate-900">
                    {e.allocationPercent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Summary Row (B3.1) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            {t('overview.summaryRow', {
              onTrack: ledger.summary.onTrackCount,
              behind: ledger.summary.behindCount,
              ratio: ledger.summary.goalTimeRatioPercent,
              defaultValue: `${ledger.summary.onTrackCount} đúng nhịp · ${ledger.summary.behindCount} chậm · ${ledger.summary.goalTimeRatioPercent}% thời gian cho mục tiêu`
            })}
          </div>
          <div className="font-mono text-slate-600">
            Mục tiêu: <strong>{ledger.goalHours}g</strong> · Ngoài mục tiêu: <strong>{ledger.nonGoalHours}g</strong>
          </div>
        </div>
      </div>

      {/* Goal Detail Modal */}
      {selectedGoal && selectedEntry && (
        <GoalDetailModal
          goal={selectedGoal}
          entry={selectedEntry}
          onClose={() => setSelectedGoalId(null)}
        />
      )}
    </div>
  );
};
