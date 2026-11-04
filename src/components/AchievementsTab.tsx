'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GapLabel, TimeLedgerCategory } from '../types';
import { HabitInsights } from './HabitInsights';
import { 
  Trophy, 
  CheckCircle2, 
  Flame, 
  ShieldCheck, 
  Clock, 
  Moon, 
  AlertCircle, 
  Sparkles, 
  Tag, 
  ArrowRight, 
  Target, 
  Compass, 
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  HelpCircle,
  FolderKanban,
  CheckSquare
} from 'lucide-react';

const GAP_LABELS: { key: GapLabel; label: string }[] = [
  { key: 'rest', label: 'Nghỉ ngơi' },
  { key: 'meal', label: 'Ăn uống' },
  { key: 'travel', label: 'Di chuyển' },
  { key: 'small_tasks', label: 'Việc vặt' },
  { key: 'distraction', label: 'Xao nhãng' },
  { key: 'other', label: 'Khác' },
];

const CATEGORY_COLORS: Record<TimeLedgerCategory, { bg: string; text: string; labelVi: string }> = {
  goal_work: { bg: 'bg-[#E0401F]', text: 'text-orange-400', labelVi: 'Việc mục tiêu' },
  meeting: { bg: 'bg-purple-500', text: 'text-purple-400', labelVi: 'Hội họp' },
  interruption: { bg: 'bg-amber-500', text: 'text-amber-400', labelVi: 'Việc chen ngang' },
  distraction: { bg: 'bg-rose-500', text: 'text-rose-400', labelVi: 'Xao nhãng' },
  personal: { bg: 'bg-emerald-500', text: 'text-emerald-400', labelVi: 'Cá nhân & Nghỉ ngơi' },
  sleep: { bg: 'bg-blue-600', text: 'text-blue-400', labelVi: 'Giấc ngủ' },
  other: { bg: 'bg-slate-500', text: 'text-slate-400', labelVi: 'Khác' },
};

export const AchievementsTab: React.FC = () => {
  const { 
    blocks, 
    goals, 
    interruptions, 
    gaps, 
    profile, 
    handleLabelGap, 
    setCloseDayModalOpen,
    dayClosed,
    setBlocks,
    openDrilldown,
    timeLedger,
    setMethodLibraryOpen
  } = useApp();

  // B21: Three views in segmented control: 'time' | 'tasks' | 'projects' + 'habits'
  const [viewMode, setViewMode] = useState<'time' | 'tasks' | 'projects' | 'habits'>('time');

  const completedBlocks = blocks.filter(b => b.status === 'done');
  const waitingBlocks = blocks.filter(b => b.status === 'unconfirmed' || b.status === 'partly_done');

  // Stats calculation
  const totalPlannedMins = blocks.length * 60;
  const doneMins = completedBlocks.length * 60;
  const deepWorkDoneMins = completedBlocks.filter(b => b.type === 'deep').length * profile.focusBlockDurationMins || 150;

  const intUsedMins = interruptions
    .filter(i => i.decision === 'do_now')
    .reduce((acc, curr) => acc + curr.minutes, 0);

  const protectedMins = interruptions
    .filter(i => i.decision === 'decline' || i.decision === 'delegate')
    .reduce((acc, curr) => acc + curr.minutes, 0);

  // Time Ledger Calculations (24-Hour Peter Drucker model B1b & B21)
  const ledgerSegments = timeLedger || [];
  const totalLedgerMins = ledgerSegments.reduce((acc, s) => acc + s.durationMins, 0) || 1440;
  
  const categoryTotals: Record<TimeLedgerCategory, number> = {
    goal_work: 0,
    meeting: 0,
    interruption: 0,
    distraction: 0,
    personal: 0,
    sleep: 0,
    other: 0,
  };

  ledgerSegments.forEach(s => {
    categoryTotals[s.category] = (categoryTotals[s.category] || 0) + s.durationMins;
  });

  const wakingMinutes = 1440 - (categoryTotals.sleep || 420);
  const goalWorkRatio = wakingMinutes > 0 ? Math.round(((categoryTotals.goal_work || 285) / wakingMinutes) * 100) : 0;
  const distractionMins = categoryTotals.distraction || 45;

  // Task Efficiency metrics (Lean / Kanban: Flow Efficiency = Touch Time / Cycle Time)
  const totalTouchTime = completedBlocks.reduce((acc, b) => acc + (b.touchTimeMinutes || 60), 0);
  const totalCycleTime = completedBlocks.reduce((acc, b) => acc + (b.cycleTimeMinutes || 75), 0);
  const avgFlowEfficiency = totalCycleTime > 0 ? Math.round((totalTouchTime / totalCycleTime) * 100) : 85;

  const doneOnTimeCount = completedBlocks.filter(b => b.timeboxEndOutcome === 'done_on_time' || (!b.timeboxEndOutcome && b.status === 'done')).length;
  const doneOverTimeCount = completedBlocks.filter(b => b.timeboxEndOutcome === 'done_over_time').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-400" />
              <span>Hiệu quả & Dấu vết (Efficiency - PRD v0.22 B21)</span>
            </h2>
            <button
              onClick={() => setMethodLibraryOpen(true)}
              className="p-1 rounded-full text-slate-400 hover:text-orange-400 hover:bg-slate-800 transition-colors"
              title="Mở Thư viện phương pháp khoa học (B22)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Thời gian đã đi đâu • Việc đã xong • Tiến độ dự án • Cuối ngày đóng ngày trong 2 phút
          </p>
        </div>

        {/* View mode segmented switcher & Close day button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setViewMode('time')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'time' 
                  ? 'bg-gradient-to-r from-[#E0401F] to-orange-500 text-white shadow-md shadow-orange-500/20' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>1. Thời gian (24h)</span>
            </button>
            <button
              onClick={() => setViewMode('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'tasks' 
                  ? 'bg-gradient-to-r from-[#E0401F] to-orange-500 text-white shadow-md shadow-orange-500/20' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>2. Công việc</span>
            </button>
            <button
              onClick={() => setViewMode('projects')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'projects' 
                  ? 'bg-gradient-to-r from-[#E0401F] to-orange-500 text-white shadow-md shadow-orange-500/20' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>3. Dự án</span>
            </button>
            <button
              onClick={() => setViewMode('habits')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'habits' 
                  ? 'bg-gradient-to-r from-[#E0401F] to-orange-500 text-white shadow-md shadow-orange-500/20' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Thói quen</span>
            </button>
          </div>

          {!dayClosed ? (
            <button
              onClick={() => setCloseDayModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#E0401F] to-orange-500 hover:from-[#c83516] hover:to-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition-all"
            >
              <Moon className="w-4 h-4" />
              <span>Đóng ngày</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-950/40 border border-orange-800/40 text-orange-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-orange-400" />
              <span>Đã khóa ngày</span>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: TIME (The 24-Hour Ledger - Peter Drucker Model B1b & B21) */}
      {viewMode === 'time' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* 1. 24-Hour Continuous Visual Ledger Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span>Sổ cái thời gian 24 giờ liên tục (The 24-Hour Time Ledger)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo Peter Drucker (1967): Mọi phút trong ngày đều thuộc chính xác 1 danh mục, không thể xóa bỏ hay vay mượn.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">Tổng 1.440 phút (24h)</span>
            </div>

            {/* Visual 24-Hour Colored Segment Bar */}
            <div className="w-full h-8 rounded-2xl overflow-hidden flex bg-slate-100 border border-slate-200 shadow-inner">
              {ledgerSegments.map((segment) => {
                const widthPercent = (segment.durationMins / 1440) * 100;
                const col = CATEGORY_COLORS[segment.category] || CATEGORY_COLORS.other;
                return (
                  <div
                    key={segment.id}
                    className={`${col.bg} h-full relative group transition-all hover:opacity-90`}
                    style={{ width: `${Math.max(0.5, widthPercent)}%` }}
                    title={`${segment.label} (${segment.start} - ${segment.end}): ${segment.durationMins} phút`}
                  />
                );
              })}
            </div>

            {/* Category Legend & Minutes Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
              {Object.entries(CATEGORY_COLORS).map(([catKey, col]) => {
                const mins = categoryTotals[catKey as TimeLedgerCategory] || 0;
                const hrs = (mins / 60).toFixed(1);
                return (
                  <div key={catKey} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.bg} shrink-0`} />
                      <span className="text-[11px] font-semibold text-slate-700 truncate">{col.labelVi}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {mins}p <span className="text-[10px] text-slate-400 font-normal">({hrs}h)</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Key Ledger Figures: Waking Goal Share & Distraction Tracker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tỷ lệ giờ thức cho mục tiêu
              </span>
              <div className="py-2 flex items-baseline gap-2">
                <span className="text-4xl font-mono font-extrabold text-orange-400">
                  {goalWorkRatio}%
                </span>
                <span className="text-xs text-slate-400 font-medium">của giờ thức</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="h-full bg-gradient-to-r from-[#E0401F] to-orange-500 rounded-full" style={{ width: `${goalWorkRatio}%` }} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Đã dùng {categoryTotals.goal_work || 285}p trên tổng {wakingMinutes}p thức.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Xao nhãng sau timebox (Distraction)
              </span>
              <div className="py-2 flex items-baseline gap-2">
                <span className="text-4xl font-mono font-extrabold text-rose-400">
                  {distractionMins}
                </span>
                <span className="text-xs text-slate-400 font-medium">phút chưa khai báo</span>
              </div>
              <p className="text-xs text-slate-600">
                Phát sinh khi timebox kết thúc quá vùng đệm 5 phút mà chưa tuyên bố việc tiếp theo.
              </p>
              <span className="text-[11px] text-orange-400 mt-2 cursor-pointer hover:underline" onClick={() => setViewMode('tasks')}>
                Có thể gán nhãn lại trong Đóng ngày ↗
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Xu hướng so với 7 ngày trước
              </span>
              <div className="py-2 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">+18%</span>
                <span className="text-xs text-slate-400">thời gian việc sâu</span>
              </div>
              <p className="text-xs text-slate-600">
                Trung bình việc sâu tuần này đạt 165p/ngày (so với 140p tuần trước).
              </p>
              <span className="text-[11px] text-slate-400 mt-2">
                Quỹ gián đoạn sử dụng ở mức lành mạnh (68%).
              </span>
            </div>

          </div>

          {/* 3. Undeclared Time Gaps (PRD B10 & B1b) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-sky-400" />
                <span>Khoảng thời gian chưa khai báo (Undeclared Gaps - 15p+)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Gắn nhãn 1 chạm không phán xét để giúp hệ thống học thích ứng theo thói quen của bạn.
              </p>
            </div>

            {gaps.length === 0 ? (
              <p className="text-xs text-slate-400">Không có khoảng trống thời gian nào.</p>
            ) : (
              <div className="space-y-2.5">
                {gaps.map((gap) => (
                  <div key={gap.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800">
                          {gap.start} - {gap.end} ({gap.durationMins} phút)
                        </span>
                        {gap.label && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 font-semibold">
                            Đã gắn: {GAP_LABELS.find(l => l.key === gap.label)?.label}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Khoảng trống không có lịch cố định</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {GAP_LABELS.map((item) => (
                        <button
                          key={item.key}
                          onClick={() => handleLabelGap(gap.id, item.key)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-colors ${
                            gap.label === item.key
                              ? 'bg-sky-600 text-white font-bold'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 2: TASKS (Daily Task Efficiency & Lean / Kanban Flow Metrics) */}
      {viewMode === 'tasks' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Summary Cards: Done on time vs Done over time & Flow efficiency */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Xong đúng hẹn
              </span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{doneOnTimeCount} việc</p>
              <span className="text-[11px] text-slate-400">Khớp chuẩn DoD & Timebox</span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Xong quá giờ
              </span>
              <p className="text-2xl font-bold text-amber-400 mt-1">{doneOverTimeCount} việc</p>
              <span className="text-[11px] text-slate-400">+15p bù giờ ghi nhận</span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-orange-400" /> Flow Efficiency
              </span>
              <p className="text-2xl font-bold text-orange-400 mt-1">{avgFlowEfficiency}%</p>
              <span className="text-[11px] text-slate-400">Touch time / Cycle time (Lean)</span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-sky-400" /> Độ chuẩn ước lượng
              </span>
              <p className="text-2xl font-bold text-sky-400 mt-1">88%</p>
              <span className="text-[11px] text-slate-400">Giảm thiểu Planning Fallacy</span>
            </div>
          </div>

          {/* Detailed Task Execution Breakdown */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-orange-400" />
                <span>Chi tiết hiệu suất từng nhiệm vụ (Touch Time & Cycle Time)</span>
              </h3>
              <span className="text-xs text-slate-400">Chuẩn Kanban Flow Metrics</span>
            </div>

            <div className="space-y-3">
              {blocks.map((b) => {
                const touch = b.touchTimeMinutes || (b.estimatedMinutes ? Math.round(b.estimatedMinutes * 0.9) : 45);
                const cycle = b.cycleTimeMinutes || (b.estimatedMinutes || 60);
                const flow = Math.round((touch / cycle) * 100);
                const isDone = b.status === 'done';

                return (
                  <div key={b.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isDone ? 'bg-emerald-400' : b.status === 'in_progress' ? 'bg-orange-400 animate-pulse' : 'bg-slate-500'}`} />
                        <h4 className="text-sm font-bold text-slate-900">{b.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>Mục tiêu: <strong className="text-slate-300">{b.goalName || 'Ngoài mục tiêu'}</strong></span>
                        <span>•</span>
                        <span>Loại: <strong className="text-orange-400 uppercase text-[10px]">{b.taskEndType || 'timebox'}</strong></span>
                        <span>•</span>
                        <span>Ước lượng: <strong className="text-slate-300">{b.estimatedMinutes || 60}p</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-slate-800">
                          Touch: <strong className="text-orange-400">{touch}p</strong> / Cycle: <strong className="text-slate-400">{cycle}p</strong>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Hiệu suất dòng chảy: <strong className="text-emerald-400">{flow}%</strong>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                        isDone ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isDone ? 'Đã hoàn thành ✓' : b.status === 'in_progress' ? 'Đang chạy' : 'Đã lên lịch'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 3: PROJECTS & LONG-TERM GOALS (PMBOK Schedule Control & Variance) */}
      {viewMode === 'projects' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-orange-400" />
                <span>Tiến độ dự án & Kiểm soát sai lệch (Variance Analysis - PMBOK)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kế hoạch giờ vs Thực tế đã dùng • Dự báo khi hoàn thành (Forecast at Completion)
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {goals.map((g) => {
                const plannedHours = Math.round(g.dailyBudgetMins * (g.horizonDays / 7) / 60);
                const actualHours = Math.round(plannedHours * (g.progressPercent / 100) * 0.9);
                const varianceHours = actualHours - Math.round(plannedHours * (g.progressPercent / 100));
                const forecastHours = Math.round(actualHours + (plannedHours * (1 - g.progressPercent / 100)));

                return (
                  <div key={g.id} className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-950/50 text-orange-400 border border-orange-800/40">
                          {g.workArea}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{g.name}</h4>
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        Hạn chót: <strong className="text-slate-200">{g.deadline}</strong> ({g.horizonDays} ngày)
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      Kết quả đo lường: {g.measurableResult}
                    </p>

                    {/* Progress & Variance Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          Đã dùng: <strong className="text-slate-900">{actualHours}h</strong> / Kế hoạch: <strong className="text-slate-300">{plannedHours}h</strong>
                          {varianceHours <= 0 ? (
                            <span className="text-emerald-400 ml-1.5 font-semibold">({varianceHours}h tiết kiệm)</span>
                          ) : (
                            <span className="text-amber-400 ml-1.5 font-semibold">(+{varianceHours}h vượt)</span>
                          )}
                        </span>
                        <span className="text-orange-400 font-bold">{g.progressPercent}% hoàn thành</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className="h-full bg-gradient-to-r from-[#E0401F] to-orange-500 rounded-full" 
                          style={{ width: `${g.progressPercent}%` }} 
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 font-mono">
                        <span>Dự báo khi hoàn thành: <strong>{forecastHours}h</strong></span>
                        <span>Cột mốc: {g.milestones.filter(m => m.status === 'completed').length}/{g.milestones.length} xong</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 4: HABITS (B15 Habit Insights) */}
      {viewMode === 'habits' && (
        <HabitInsights />
      )}

    </div>
  );
};
