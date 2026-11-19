'use client';

// TAIO Time App — Goal Detail Modal with SVG Burn-up Chart & EVM Metrics (PRD v0.3.38 Part B3.2 & B5.3)
import React, { useMemo } from 'react';
import { useT } from '@/i18n/useT';
import type { Goal } from '@/types';
import type { GoalLedgerEntry } from '@/domain/goalLedger';
import { X, TrendingUp, Clock, Zap, Calendar, Target, CheckCircle2, AlertCircle } from 'lucide-react';

export interface GoalDetailModalProps {
  goal: Goal;
  entry: GoalLedgerEntry;
  onClose: () => void;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({ goal, entry, onClose }) => {
  const { t } = useT();

  // Burn-up chart SVG coordinates
  // Plan curve (dashed) from 0 to plannedHours
  // Actual curve (solid) up to today
  const chartWidth = 360;
  const chartHeight = 160;
  const padding = 24;

  const maxHours = Math.max(goal.size === 'XS' ? 4 : goal.size === 'S' ? 10 : goal.size === 'L' ? 100 : goal.size === 'XL' ? 250 : 40, entry.actualHours, 10);
  const todayProgressRatio = Math.min(1, Math.max(0, entry.shouldBeAtPercent / 100));

  const todayX = padding + todayProgressRatio * (chartWidth - 2 * padding);
  const actualY = chartHeight - padding - (entry.actualHours / maxHours) * (chartHeight - 2 * padding);
  const plannedY = chartHeight - padding - (entry.plannedHours / maxHours) * (chartHeight - 2 * padding);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
              {entry.size || 'M'}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-slate-900 truncate">
                {goal.name}
              </h3>
              <p className="text-[11.5px] text-slate-500 truncate">
                {goal.measurableResult || t('goals.target_result', 'Mục tiêu trọng tâm')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Missing Deadline / Size Prompt (B3.2) */}
          {(!goal.deadline || !goal.size) && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{t('overview.targetDatePrompt', 'Mục tiêu này chưa có hạn chót. Đặt hạn chót để theo dõi nhịp độ chuẩn EVM.')}</span>
            </div>
          )}

          {/* 3 Metric Boxes (B3.2) */}
          <div className="grid grid-cols-3 gap-3">
            {/* Box 1: Tiến độ */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>{t('overview.colProgress', 'Tiến độ')}</span>
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                {entry.progressPercent}%
              </div>
              <div className="text-[10.5px] text-slate-500 flex items-center gap-1">
                <span>Nên đạt: {entry.shouldBeAtPercent}%</span>
                <span className={`px-1 rounded-sm font-bold text-[9.5px] ${
                  entry.paceStatus === 'on_track' ? 'bg-emerald-100 text-emerald-800' :
                  entry.paceStatus === 'behind' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {entry.paceLabel}
                </span>
              </div>
            </div>

            {/* Box 2: Thời gian */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>{t('overview.colTime', 'Thời gian')}</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                {entry.actualHours}g
              </div>
              <div className="text-[10.5px] text-slate-500">
                / {entry.plannedHours}g dự kiến
              </div>
            </div>

            {/* Box 3: Hiệu suất */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>{t('overview.colEfficiency', 'Hiệu suất')}</span>
                <Zap className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                {entry.efficiencyPercent !== null ? `${entry.efficiencyPercent}%` : '≈ 100%'}
              </div>
              <div className="text-[10.5px] text-slate-500">
                {entry.efficiencyLabel}
              </div>
            </div>
          </div>

          {/* Burn-up Chart (Pure SVG) */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{t('overview.burnUpChart', 'Biểu đồ giờ tích lũy (Burn-up)')}</span>
              <div className="flex items-center gap-3 text-[10.5px] font-normal text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-[var(--taio-brand)] rounded-full inline-block" /> Thực tế
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 border-t border-dashed border-slate-400 inline-block" /> Kế hoạch
                </span>
              </div>
            </div>

            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-36 overflow-visible">
              {/* Grid axes */}
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#cbd5e1" strokeWidth="1" />
              <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#cbd5e1" strokeWidth="1" />

              {/* Planned Line (Dashed baseline from (0,0) to deadline) */}
              <line
                x1={padding}
                y1={chartHeight - padding}
                x2={chartWidth - padding}
                y2={plannedY}
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Today Vertical Line */}
              <line
                x1={todayX}
                y1={padding}
                x2={todayX}
                y2={chartHeight - padding}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <text x={todayX} y={padding - 6} fill="#b45309" fontSize="9" fontWeight="700" textAnchor="middle">
                Hôm nay
              </text>

              {/* Actual Line up to Today */}
              <line
                x1={padding}
                y1={chartHeight - padding}
                x2={todayX}
                y2={actualY}
                stroke="var(--taio-brand)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx={todayX} cy={actualY} r="4" fill="var(--taio-brand)" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Velocity & Completion Forecast (B5.3) */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-center justify-between">
            <span className="font-medium">
              Tốc độ 4 tuần: <strong>{Math.round((entry.actualHours / 4) * 10) / 10}g/tuần</strong>
            </span>
            <span className="text-slate-600 font-semibold">
              Dự báo về đích: <strong>{goal.deadline || 'Đúng hạn'}</strong>
            </span>
          </div>

          {/* Milestones and Sub-projects (B3.2) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('goals.milestones', 'Cột mốc & Dự án con')} ({goal.milestones?.length || 0})
            </h4>
            {(!goal.milestones || goal.milestones.length === 0) ? (
              <p className="text-xs text-slate-400 italic">
                {t('goals.no_milestones', 'Chưa có cột mốc nào')}
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
                {goal.milestones.map(m => (
                  <div key={m.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${m.status === 'completed' ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span className={`font-semibold ${m.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {m.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {m.dueDate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
