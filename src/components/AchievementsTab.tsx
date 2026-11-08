'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GapLabel, TimeLedgerCategory } from '../types';
import { HabitInsights } from './HabitInsights';
import { computeGoalMetrics, computeTaskTimeEfficiency } from '../features/goals/goalMetrics';
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

const CATEGORY_COLORS: Record<TimeLedgerCategory, { bg: string; hex: string; lightHex: string; text: string; labelVi: string }> = {
  sleep: { bg: 'bg-blue-600', hex: '#2563EB', lightHex: '#60A5FA', text: 'text-blue-700', labelVi: 'Giấc ngủ' },
  goal_work: { bg: 'bg-[#E0401F]', hex: '#E0401F', lightHex: '#FB7185', text: 'text-red-700', labelVi: 'Việc mục tiêu' },
  meeting: { bg: 'bg-purple-600', hex: '#9333EA', lightHex: '#C084FC', text: 'text-purple-700', labelVi: 'Hội họp' },
  planning: { bg: 'bg-amber-400', hex: '#FBBF24', lightHex: '#FDE68A', text: 'text-amber-700', labelVi: 'Lên kế hoạch' },
  personal: { bg: 'bg-emerald-600', hex: '#059669', lightHex: '#34D399', text: 'text-emerald-700', labelVi: 'Cá nhân & Nghỉ ngơi' },
  interruption: { bg: 'bg-amber-500', hex: '#F59E0B', lightHex: '#FCD34D', text: 'text-amber-700', labelVi: 'Việc chen ngang' },
  distraction: { bg: 'bg-rose-500', hex: '#F43F5E', lightHex: '#FDA4AF', text: 'text-rose-700', labelVi: 'Xao nhãng' },
  unconfirmed: { bg: 'bg-slate-400', hex: '#94A3B8', lightHex: '#CBD5E1', text: 'text-slate-700', labelVi: 'Chưa xác nhận / Chưa khai báo' },
  not_yet: { bg: 'bg-slate-200', hex: '#E2E8F0', lightHex: '#F1F5F9', text: 'text-slate-500', labelVi: 'Chưa diễn ra (còn lại trong ngày)' },
  other: { bg: 'bg-slate-500', hex: '#64748B', lightHex: '#94A3B8', text: 'text-slate-600', labelVi: 'Khác' },
};

const DONUT_GROUP_ORDER: TimeLedgerCategory[] = [
  'sleep',
  'goal_work',
  'meeting',
  'planning',
  'personal',
  'interruption',
  'distraction',
  'unconfirmed',
  'not_yet',
];

export const AchievementsTab: React.FC = () => {
  const { 
    blocks, 
    goals, 
    dailyCardItems,
    interruptions, 
    gaps, 
    profile, 
    handleLabelGap, 
    setCloseDayModalOpen,
    dayClosed,
    setBlocks,
    openDrilldown,
    timeLedger,
    setMethodLibraryOpen,
    setIsActiveCaptureOpen
  } = useApp();

  // B21: Three views in segmented control: 'time' | 'tasks' | 'projects' + 'habits'
  const [viewMode, setViewMode] = useState<'time' | 'tasks' | 'projects' | 'habits'>('time');
  // B21 v0.3.15: Donut detail level ('groups' = 1 ring default, 'detail' = 2-ring sunburst), remembered on device
  const [donutMode, setDonutMode] = useState<'groups' | 'detail'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('taio_b21_donut_mode');
      if (saved === 'groups' || saved === 'detail') return saved;
    }
    return 'groups';
  });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedTimelineSeg, setSelectedTimelineSeg] = useState<{ title: string; time: string; kind: string } | null>(null);

  const switchDonutMode = (mode: 'groups' | 'detail') => {
    setDonutMode(mode);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('taio_b21_donut_mode', mode);
      }
    } catch {}
    if (mode === 'detail') {
      // In Detail mode, groups with several items are open by default
      const autoOpen: Record<string, boolean> = {};
      DONUT_GROUP_ORDER.forEach(cat => {
        const count = (timeLedger || []).filter(s => s.category === cat).length;
        if (count > 1) autoOpen[cat] = true;
      });
      setExpandedGroups(autoOpen);
    }
  };

  const toggleGroupExpand = (cat: string) => {
    setExpandedGroups(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

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
    planning: 0,
    interruption: 0,
    distraction: 0,
    personal: 0,
    sleep: 0,
    unconfirmed: 0,
    not_yet: 0,
    other: 0,
  };

  ledgerSegments.forEach(s => {
    categoryTotals[s.category] = (categoryTotals[s.category] || 0) + s.durationMins;
  });

  const wakingMinutes = 1440 - (categoryTotals.sleep || 510);
  const goalWorkRatio = wakingMinutes > 0 ? Math.round(((categoryTotals.goal_work || 240) / wakingMinutes) * 100) : 0;
  const distractionMins = categoryTotals.distraction || 30;
  const unconfirmedMins = categoryTotals.unconfirmed || 45;

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
              <Activity className="w-5 h-5 text-[#E0401F]" />
              <span>Hiệu quả</span>
            </h2>
            <button
              onClick={() => setMethodLibraryOpen(true)}
              className="p-1 rounded-full text-slate-500 hover:text-[#E0401F] hover:bg-slate-100 transition-colors"
              title="Mở Thư viện phương pháp khoa học"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Thời gian đã đi đâu • Việc đã xong • Tiến độ dự án & hiệu suất thời gian • Cuối ngày đóng ngày trong 2 phút
          </p>
        </div>

        {/* View mode segmented switcher & Close day button (unnumbered, flat fill, white text per D4/D5) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setViewMode('time')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'time' 
                  ? 'bg-[#E0401F] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Thời gian</span>
            </button>
            <button
              onClick={() => setViewMode('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'tasks' 
                  ? 'bg-[#E0401F] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Công việc</span>
            </button>
            <button
              onClick={() => setViewMode('projects')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'projects' 
                  ? 'bg-[#E0401F] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Dự án</span>
            </button>
            <button
              onClick={() => setViewMode('habits')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'habits' 
                  ? 'bg-[#E0401F] text-white shadow-sm' 
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E0401F] hover:bg-[#c83516] text-white font-bold text-xs shadow-sm transition-all"
            >
              <Moon className="w-4 h-4 text-white" />
              <span>Đóng ngày</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-[#E0401F] text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-[#E0401F]" />
              <span>Đã khóa ngày</span>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: TIME (B21 v0.3.15: 24-Hour Donut for Actual Overview + Two Timelines Plan vs Actual) */}
      {viewMode === 'time' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* 1. 24-Hour Donut (Actual only, 100% = 24h) with Groups / Detail Sunburst Switch */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#E0401F]" />
                  <span>Tổng quan 24 giờ thực tế (100% = 24 giờ)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhóm nào chiếm phần lớn trong 24 giờ của bạn • Bấm vào lát cắt hoặc dòng chú giải để xem từng việc
                </p>
              </div>

              {/* Two icon buttons next to donut: Nhóm lớn (Groups) / Chi tiết (Detail 2-ring sunburst) */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => switchDonutMode('groups')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    donutMode === 'groups'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Một vòng tròn chỉ hiển thị các nhóm lớn"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#E0401F]" />
                  <span>Nhóm lớn</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchDonutMode('detail')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    donutMode === 'detail'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Hai vòng đồng tâm (Sunburst): vòng trong là nhóm lớn, vòng ngoài là các việc thuộc nhóm đó"
                >
                  <Layers className="w-3.5 h-3.5 text-[#E0401F]" />
                  <span>Chi tiết</span>
                </button>
              </div>
            </div>

            {/* Donut SVG + Interactive Legend */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* SVG Donut / Sunburst */}
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                {(() => {
                  const innerR = 56;
                  const innerC = 2 * Math.PI * innerR;
                  const outerR = 78;
                  const outerC = 2 * Math.PI * outerR;
                  let accGroupMins = 0;

                  const groupSlices = DONUT_GROUP_ORDER.map(cat => {
                    const mins = categoryTotals[cat] || 0;
                    const startFraction = accGroupMins / 1440;
                    const sliceFraction = mins / 1440;
                    accGroupMins += mins;
                    return {
                      cat,
                      mins,
                      startFraction,
                      sliceFraction,
                      col: CATEGORY_COLORS[cat],
                      items: ledgerSegments.filter(s => s.category === cat),
                    };
                  }).filter(g => g.mins > 0);

                  return (
                    <div className="relative w-56 h-56 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                        {/* Inner Ring: Major Groups */}
                        {groupSlices.map((g) => {
                          const len = g.sliceFraction * innerC;
                          const offset = -g.startFraction * innerC;
                          return (
                            <circle
                              key={g.cat}
                              cx="100"
                              cy="100"
                              r={innerR}
                              fill="none"
                              stroke={g.col.hex}
                              strokeWidth={donutMode === 'detail' ? 22 : 28}
                              strokeDasharray={`${Math.max(0, len - 1.5)} ${innerC}`}
                              strokeDashoffset={offset}
                              className="cursor-pointer transition-opacity hover:opacity-85"
                              onClick={() => toggleGroupExpand(g.cat)}
                            >
                              <title>{`${g.col.labelVi}: ${g.mins} phút (${Math.round(g.sliceFraction * 100)}%)`}</title>
                            </circle>
                          );
                        })}

                        {/* Outer Ring (only in Detail / Sunburst mode): Items right next to their group */}
                        {donutMode === 'detail' && groupSlices.map((g) => {
                          let itemAccMins = g.startFraction * 1440;
                          return g.items.map((item, idx) => {
                            const itemFrac = item.durationMins / 1440;
                            const itemStartFrac = itemAccMins / 1440;
                            itemAccMins += item.durationMins;
                            const len = itemFrac * outerC;
                            const offset = -itemStartFrac * outerC;
                            return (
                              <circle
                                key={item.id}
                                cx="100"
                                cy="100"
                                r={outerR}
                                fill="none"
                                stroke={idx % 2 === 0 ? g.col.lightHex : g.col.hex}
                                strokeOpacity={idx % 2 === 0 ? 0.9 : 0.65}
                                strokeWidth="16"
                                strokeDasharray={`${Math.max(0, len - 1.5)} ${outerC}`}
                                strokeDashoffset={offset}
                                className="cursor-pointer transition-opacity hover:opacity-100"
                                onClick={() => toggleGroupExpand(g.cat)}
                              >
                                <title>{`${item.label} (${item.start}–${item.end}): ${item.durationMins}p`}</title>
                              </circle>
                            );
                          });
                        })}
                      </svg>

                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-xl font-mono font-black text-slate-900">24 giờ</span>
                        <span className="text-[11px] font-semibold text-slate-500">1.440 phút</span>
                        <span className="text-[10px] text-[#E0401F] font-bold mt-0.5">
                          {donutMode === 'groups' ? '1 vòng • Nhóm lớn' : '2 vòng • Chi tiết'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Legend under/beside the donut: one row per group with duration & share, tap to expand items */}
              <div className="md:col-span-7 space-y-1.5">
                {DONUT_GROUP_ORDER.map(cat => {
                  const mins = categoryTotals[cat] || 0;
                  if (mins <= 0) return null;
                  const col = CATEGORY_COLORS[cat];
                  const hrs = (mins / 60).toFixed(1);
                  const pct = Math.round((mins / 1440) * 100);
                  const groupItems = ledgerSegments.filter(s => s.category === cat);
                  const isOpen = !!expandedGroups[cat];

                  return (
                    <div key={cat} className="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleGroupExpand(cat)}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="text-xs font-bold text-slate-800 truncate">{col.labelVi}</span>
                          <span className="text-[10px] text-slate-400">({groupItems.length} mục)</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-xs">
                          <span className="font-mono font-bold text-slate-900">
                            {mins}p <span className="text-slate-500 font-normal">({hrs}h)</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-700 min-w-[42px] text-center">
                            {pct}%
                          </span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-3.5 pb-2.5 pt-1 bg-white border-t border-slate-100 space-y-1">
                          {groupItems.map(item => (
                            <div
                              key={item.id}
                              onClick={() => setIsActiveCaptureOpen(true)}
                              className="flex items-center justify-between text-[11px] py-1 px-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                            >
                              <span className="text-slate-700 font-medium truncate">
                                <strong className="font-mono text-slate-500">{item.start}–{item.end}</strong> • {item.label}
                              </span>
                              <span className="font-mono font-semibold text-slate-700 shrink-0 ml-2">
                                {item.durationMins}p
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
              Lưu ý: Các khối không phải nhiệm vụ (giấc ngủ, cá nhân, hội họp) được tính theo lịch cho đến khi bạn ghi bù thực tế.
            </p>

            {/* 2. Two Timeline Bars under the Donut, ALWAYS VISIBLE: "Kế hoạch" above "Thực tế" on same 0-24h axis with Now line */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    So sánh Kế hoạch & Thực tế trên cùng trục 0–24h
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Đọc từ trên xuống dưới để thấy ngay khối nào bị dời, co lại hoặc bị việc khác chiếm chỗ • Chạm vào một đoạn để xem chi tiết
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActiveCaptureOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold shrink-0"
                >
                  + Ghi bù
                </button>
              </div>

              {/* Hour axis marks 0h -> 24h */}
              <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>

              {/* Bar 1: Kế hoạch (Plan) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">Kế hoạch (Plan)</span>
                  <span className="text-slate-400">Lịch ngày đã định</span>
                </div>
                <div className="w-full h-7 rounded-xl overflow-hidden flex bg-slate-100 border border-slate-200">
                  {[
                    { start: '00:00', end: '07:00', mins: 420, cat: 'sleep' as TimeLedgerCategory, title: 'Giấc ngủ đêm' },
                    { start: '07:00', end: '08:30', mins: 90, cat: 'personal' as TimeLedgerCategory, title: 'Ăn sáng & Gia đình' },
                    { start: '08:30', end: '09:00', mins: 30, cat: 'planning' as TimeLedgerCategory, title: 'Lên kế hoạch ngày' },
                    { start: '09:00', end: '10:30', mins: 90, cat: 'goal_work' as TimeLedgerCategory, title: 'Khối việc sâu 1: Thiết kế Interruption Card' },
                    { start: '10:30', end: '11:45', mins: 75, cat: 'meeting' as TimeLedgerCategory, title: 'Họp rà soát tiến độ tuần' },
                    { start: '11:45', end: '13:30', mins: 105, cat: 'personal' as TimeLedgerCategory, title: 'Ăn trưa & Nghỉ trưa' },
                    { start: '13:30', end: '15:30', mins: 120, cat: 'goal_work' as TimeLedgerCategory, title: 'Khối việc sâu 2: Xây dựng màn hình Now' },
                    { start: '15:30', end: '16:30', mins: 60, cat: 'interruption' as TimeLedgerCategory, title: 'Quỹ dự phòng việc phát sinh' },
                    { start: '16:30', end: '18:00', mins: 90, cat: 'goal_work' as TimeLedgerCategory, title: 'Khối việc sâu 3: Quay video #TAIOCLUB' },
                    { start: '18:00', end: '22:30', mins: 270, cat: 'personal' as TimeLedgerCategory, title: 'Thể thao, cơm tối & Nghỉ ngơi' },
                    { start: '22:30', end: '24:00', mins: 90, cat: 'sleep' as TimeLedgerCategory, title: 'Giấc ngủ đêm' },
                  ].map((seg, i) => {
                    const col = CATEGORY_COLORS[seg.cat];
                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedTimelineSeg({ title: seg.title, time: `${seg.start} – ${seg.end} (${seg.mins}p)`, kind: 'Kế hoạch' })}
                        style={{ width: `${(seg.mins / 1440) * 100}%`, backgroundColor: col.hex }}
                        className="h-full border-r border-white/40 cursor-pointer hover:opacity-85 transition-opacity"
                        title={`[Kế hoạch] ${seg.start}–${seg.end}: ${seg.title}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Bar 2: Thực tế (Actual) with "Now" vertical marker line */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-900">Thực tế (Actual)</span>
                  <span className="text-[#E0401F] font-semibold">Vạch đỏ = Bây giờ (17:45)</span>
                </div>
                <div className="relative w-full h-7 rounded-xl overflow-hidden flex bg-slate-100 border border-slate-200">
                  {ledgerSegments.map((segment) => {
                    const widthPercent = (segment.durationMins / 1440) * 100;
                    const col = CATEGORY_COLORS[segment.category] || CATEGORY_COLORS.other;
                    return (
                      <div
                        key={segment.id}
                        onClick={() => setSelectedTimelineSeg({
                          title: segment.label,
                          time: `${segment.start} – ${segment.end} (${segment.durationMins}p)`,
                          kind: `Thực tế • ${col.labelVi}`,
                        })}
                        style={{ width: `${Math.max(0.5, widthPercent)}%`, backgroundColor: col.hex }}
                        className="h-full border-r border-white/40 cursor-pointer hover:opacity-85 transition-opacity"
                        title={`[Thực tế] ${segment.start}–${segment.end}: ${segment.label} (${segment.durationMins}p)`}
                      />
                    );
                  })}

                  {/* "Now" line on Actual bar (at 17:45 = 1065 / 1440 = 73.95%) */}
                  <div
                    style={{ left: '74%' }}
                    className="absolute top-0 bottom-0 w-0.5 bg-[#E0401F] ring-2 ring-white z-10 pointer-events-none"
                    title="Bây giờ"
                  />
                </div>
              </div>

              {/* Tapped segment detail pill */}
              {selectedTimelineSeg && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs animate-in fade-in">
                  <div>
                    <span className="font-bold text-[#E0401F]">{selectedTimelineSeg.kind}: </span>
                    <span className="font-semibold text-slate-900">{selectedTimelineSeg.title}</span>
                    <span className="text-slate-500 font-mono ml-2">({selectedTimelineSeg.time})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActiveCaptureOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold text-[11px] shrink-0"
                  >
                    Chỉnh / Ghi bù
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. Key Ledger Figures (computed from the same Actual model so numbers always match the chart) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tỷ lệ giờ thức cho mục tiêu
              </span>
              <div className="py-2 flex items-baseline gap-2">
                <span className="text-4xl font-mono font-extrabold text-[#E0401F]">
                  {goalWorkRatio}%
                </span>
                <span className="text-xs text-slate-500 font-medium">của giờ thức</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="h-full bg-[#E0401F] rounded-full" style={{ width: `${goalWorkRatio}%` }} />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Đã dùng {categoryTotals.goal_work || 240}p việc mục tiêu trên tổng {wakingMinutes}p thức.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Xao nhãng sau timebox
              </span>
              <div className="py-2 flex items-baseline gap-2">
                <span className="text-4xl font-mono font-extrabold text-rose-600">
                  {distractionMins}
                </span>
                <span className="text-xs text-slate-500 font-medium">phút</span>
              </div>
              <p className="text-xs text-slate-600">
                Phát sinh khi timebox kết thúc quá vùng đệm 5 phút mà chưa khai báo việc tiếp theo.
              </p>
              <span className="text-[11px] text-[#E0401F] font-semibold mt-2 cursor-pointer hover:underline" onClick={() => setCloseDayModalOpen(true)}>
                Có thể gán nhãn lại trong Đóng ngày ↗
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Chưa xác nhận / Chưa khai báo
              </span>
              <div className="py-2 flex items-baseline gap-2">
                <span className="text-4xl font-mono font-extrabold text-slate-700">
                  {unconfirmedMins}
                </span>
                <span className="text-xs text-slate-500 font-medium">phút</span>
              </div>
              <p className="text-xs text-slate-600">
                Các khung giờ đã qua nhưng chưa xác nhận hoàn thành hoặc chưa ghi bù.
              </p>
              <span className="text-[11px] text-[#E0401F] font-semibold mt-2 cursor-pointer hover:underline" onClick={() => setIsActiveCaptureOpen(true)}>
                Mở Ghi bù thời gian ↗
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
              <p className="text-xs text-slate-500">Không có khoảng trống thời gian nào.</p>
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
                          <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-700 font-semibold">
                            Đã gắn: {GAP_LABELS.find(l => l.key === gap.label)?.label}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Khoảng trống không có lịch cố định</p>
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
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Xong đúng hẹn
              </span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{doneOnTimeCount} việc</p>
              <span className="text-[11px] text-slate-500">Hoàn thành trong khung giờ</span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Xong quá giờ
              </span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{doneOverTimeCount} việc</p>
              <span className="text-[11px] text-slate-500">+15 phút bù giờ ghi nhận</span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-[#E0401F]" /> Hiệu suất dòng chảy
              </span>
              <p className="text-2xl font-bold text-[#E0401F] mt-1">{avgFlowEfficiency}%</p>
              <span className="text-[11px] text-slate-500">Thời gian làm thực / Tổng chu kỳ</span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-sky-600" /> Hiệu suất thời gian
              </span>
              <p className="text-2xl font-bold text-sky-600 mt-1">
                {(() => {
                  const estSum = completedBlocks.reduce((a, b) => a + (b.estimatedMinutes || 60), 0);
                  const actSum = completedBlocks.reduce((a, b) => a + (b.cycleTimeMinutes || b.estimatedMinutes || 60), 0);
                  return actSum > 0 ? `${Math.round((estSum / actSum) * 100)}%` : '100%';
                })()}
              </p>
              <span className="text-[11px] text-slate-500">Ước lượng ÷ Thực tế (&gt;100% là nhanh hơn dự kiến)</span>
            </div>
          </div>

          {/* Detailed Task Execution Breakdown */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#E0401F]" />
                <span>Chi tiết hiệu suất thời gian từng công việc</span>
              </h3>
              <span className="text-xs text-slate-500">Hiệu suất = Thời gian ước lượng ÷ Thời gian thực tế</span>
            </div>

            <div className="space-y-3">
              {blocks.map((b) => {
                const taskEff = computeTaskTimeEfficiency(b);
                const isDone = b.status === 'done';

                return (
                  <div key={b.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isDone ? 'bg-emerald-500' : b.status === 'in_progress' ? 'bg-[#E0401F] animate-pulse' : 'bg-slate-400'}`} />
                        <h4 className="text-sm font-bold text-slate-900">{b.title}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>Mục tiêu: <strong className="text-slate-700">{b.goalName || 'Ngoài mục tiêu'}</strong></span>
                        <span>•</span>
                        <span>Ước lượng: <strong className="text-slate-700">{taskEff.estimatedMinutes} phút</strong></span>
                        <span>•</span>
                        <span>Thực tế: <strong className="text-slate-700">{taskEff.actualMinutes} phút</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800">
                          Hiệu suất thời gian:{' '}
                          <strong className={taskEff.efficiencyPercent >= 100 ? 'text-emerald-600' : 'text-amber-600'}>
                            {taskEff.efficiencyPercent}%
                          </strong>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {taskEff.efficiencyPercent > 100
                            ? 'Nhanh hơn ước lượng'
                            : taskEff.efficiencyPercent === 100
                              ? 'Đúng chuẩn ước lượng'
                              : 'Cần thêm thời gian so với ước lượng'}
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                        isDone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isDone ? 'Đã xong ✓' : b.status === 'in_progress' ? 'Đang chạy' : 'Đã lên lịch'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 3: PROJECTS & LONG-TERM GOALS (B7 v0.3.18/v0.3.19: Separate Progress % and Time Efficiency) */}
      {viewMode === 'projects' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#E0401F]" />
                <span>Tiến độ dự án & Hiệu suất thời gian</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tách bạch rõ ràng: Tiến độ hoàn thành (đã gần đích bao nhiêu %) và Hiệu suất thời gian (ước lượng ÷ thực tế)
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {goals.map((g) => {
                const metrics = computeGoalMetrics(g, blocks, dailyCardItems);
                const plannedHours = Math.round(g.dailyBudgetMins * (g.horizonDays / 7) / 60);

                return (
                  <div key={g.id} className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-[#E0401F] border border-red-200">
                          {g.workArea}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{g.name}</h4>
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        Hạn chót: <strong className="text-slate-700">{g.deadline}</strong> ({g.horizonDays} ngày)
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      Kết quả đo lường: {g.measurableResult}
                    </p>

                    {/* Progress & Basis + Separate Effort & Time Efficiency */}
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800">Tiến độ hoàn thành</span>
                          <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                            {metrics.basisText}
                          </p>
                        </div>
                        <span className="text-[#E0401F] text-base font-black">{metrics.progressPercent}% hoàn thành</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#E0401F] rounded-full transition-all" 
                          style={{ width: `${metrics.progressPercent}%` }} 
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-1">
                        <span>
                          Công sức đã dành: <strong className="text-slate-900">{metrics.effortText}</strong> (kế hoạch kỳ: {plannedHours} giờ)
                        </span>
                        {metrics.timeEfficiencyPercent !== null ? (
                          <span className={`px-2.5 py-0.5 rounded-lg font-bold border ${
                            metrics.timeEfficiencyPercent >= 100
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            Hiệu suất thời gian: {metrics.timeEfficiencyPercent}% (ước lượng {metrics.estimatedDoneMinutes} phút / thực tế {metrics.actualDoneMinutes} phút)
                          </span>
                        ) : (
                          <span>Cột mốc: {g.milestones.filter(m => m.status === 'completed').length}/{g.milestones.length} xong</span>
                        )}
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
