'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TimeBlock } from '../types';
import {
  Flame,
  Calendar,
  Users,
  Trash2,
  Clock,
  Target,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Play,
  Plus,
  CalendarCheck
} from 'lucide-react';

type QuadrantId = 1 | 3 | 2 | 4;

interface FolderTabConfig {
  quadrant: QuadrantId;
  shortTitle: string;
  fullTitle: string;
  actionTag: string;
  explanation: string;
  tabBgActive: string;
  tabBgInactive: string;
  tabBorderActive: string;
  panelBg: string;
  panelBorder: string;
  tagBg: string;
  barColor: string;
  textColor: string;
  icon: React.FC<{ className?: string }>;
}

// B16 v0.3.19: Ordered by how soon you must act:
// 1. Khẩn cấp & Quan trọng (Làm ngay - Pink)
// 2. Khẩn cấp, không quan trọng (Giao ngay - Amber)
// 3. Quan trọng, chưa khẩn (Lên lịch - Blue)
// 4. Không khẩn, không quan trọng (Loại bỏ - Gray)
const FOLDER_TABS: FolderTabConfig[] = [
  {
    quadrant: 1,
    shortTitle: 'Khẩn & Quan trọng',
    fullTitle: 'Khẩn cấp & Quan trọng',
    actionTag: 'Làm ngay',
    explanation: 'Hạn chót sát nút, sự cố cần xử lý ngay, không giao được cho người khác',
    tabBgActive: 'bg-rose-50 text-rose-900',
    tabBgInactive: 'bg-rose-50/40 text-rose-700 hover:bg-rose-50/80',
    tabBorderActive: 'border-rose-300 border-b-rose-50',
    panelBg: 'bg-rose-50/50',
    panelBorder: 'border-rose-200',
    tagBg: 'bg-rose-600 text-white',
    barColor: 'bg-rose-500',
    textColor: 'text-rose-700',
    icon: Flame,
  },
  {
    quadrant: 3,
    shortTitle: 'Khẩn, không quan trọng',
    fullTitle: 'Khẩn cấp, không quan trọng',
    actionTag: 'Giao ngay',
    explanation: 'Gấp với người khác nhưng không thuộc mục tiêu của bạn: giao ngay hoặc làm gọn trong vài phút',
    tabBgActive: 'bg-amber-50 text-amber-900',
    tabBgInactive: 'bg-amber-50/40 text-amber-700 hover:bg-amber-50/80',
    tabBorderActive: 'border-amber-300 border-b-amber-50',
    panelBg: 'bg-amber-50/50',
    panelBorder: 'border-amber-200',
    tagBg: 'bg-amber-600 text-white',
    barColor: 'bg-amber-500',
    textColor: 'text-amber-700',
    icon: Users,
  },
  {
    quadrant: 2,
    shortTitle: 'Quan trọng, chưa khẩn',
    fullTitle: 'Quan trọng, chưa khẩn',
    actionTag: 'Lên lịch',
    explanation: 'Còn thời gian để lên kế hoạch: học, xây dựng, lập kế hoạch; giữ giờ cố định mỗi tuần',
    tabBgActive: 'bg-blue-50 text-blue-900',
    tabBgInactive: 'bg-blue-50/40 text-blue-700 hover:bg-blue-50/80',
    tabBorderActive: 'border-blue-300 border-b-blue-50',
    panelBg: 'bg-blue-50/50',
    panelBorder: 'border-blue-200',
    tagBg: 'bg-blue-600 text-white',
    barColor: 'bg-blue-500',
    textColor: 'text-blue-700',
    icon: Calendar,
  },
  {
    quadrant: 4,
    shortTitle: 'Không khẩn, không quan trọng',
    fullTitle: 'Không khẩn, không quan trọng',
    actionTag: 'Loại bỏ',
    explanation: 'Không mục tiêu, không hạn: bỏ bớt để danh sách nhẹ hơn',
    tabBgActive: 'bg-slate-100 text-slate-900',
    tabBgInactive: 'bg-slate-100/50 text-slate-600 hover:bg-slate-100',
    tabBorderActive: 'border-slate-300 border-b-slate-100',
    panelBg: 'bg-slate-100/60',
    panelBorder: 'border-slate-300',
    tagBg: 'bg-slate-600 text-white',
    barColor: 'bg-slate-400',
    textColor: 'text-slate-700',
    icon: Trash2,
  },
];

const STORAGE_KEY = 'taio_priority_matrix_active_tab';

function formatEstimateTotal(totalMins: number): string {
  if (totalMins <= 0) return '0 phút';
  if (totalMins < 60) return `~${totalMins} phút`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (mins === 0) return `~${hrs} giờ`;
  return `~${hrs} giờ ${mins} phút`;
}

function parseDeadlineRank(block: TimeBlock): number {
  const dl = (block.deadline || '').trim().toLowerCase();
  if (!dl || dl === 'chưa có' || dl === 'chưa có hạn') return 999999;
  if (dl.includes('hôm nay')) return 100;
  if (dl.includes('ngày mai')) return 200;
  if (dl.includes('tuần này')) return 300;
  // Match DD/MM/YYYY or DD/MM
  const parts = dl.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (parts) {
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10);
    const year = parts[3] ? parseInt(parts[3], 10) : 2026;
    return year * 10000 + month * 100 + day;
  }
  return 500000;
}

export const PriorityMatrix: React.FC = () => {
  const {
    blocks,
    setBlocks,
    goals,
    moveTaskQuadrant,
    markTaskDone,
    dropTask,
    addNewBlock,
    setCurrentTab,
    setTimerMinutesRemaining,
    setIsTimerRunning,
    showToast,
    triggerReminderQuestion
  } = useApp();

  // Default open tab: Tab 1 (quadrant 1); last tab opened is remembered
  const [activeQuadrant, setActiveQuadrant] = useState<QuadrantId>(() => {
    if (typeof window !== 'undefined') {
      const saved = Number(window.localStorage.getItem(STORAGE_KEY));
      if (saved === 1 || saved === 2 || saved === 3 || saved === 4) {
        return saved as QuadrantId;
      }
    }
    return 1;
  });

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showAllRows, setShowAllRows] = useState<Record<number, boolean>>({});
  const [quickAddTitle, setQuickAddTitle] = useState<string>('');
  const [showQuickAdd, setShowQuickAdd] = useState<boolean>(false);

  const handleSelectTab = (q: QuadrantId) => {
    setActiveQuadrant(q);
    setExpandedTaskId(null);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(q));
    } catch {}
  };

  // All open (non-done, non-dropped) tasks
  const openTasks = blocks.filter(b => b.status !== 'done' && b.status !== 'dropped');

  const getTasksForQuadrant = (q: QuadrantId): TimeBlock[] => {
    const list = openTasks.filter(b => (b.quadrant || 2) === q);
    return [...list].sort((a, b) => parseDeadlineRank(a) - parseDeadlineRank(b));
  };

  // Guard for Tab 3 (Quan trọng, chưa khẩn — quadrant 2): how many tasks already have a time slot this week
  const tab3Tasks = getTasksForQuadrant(2);
  const tab3ScheduledCount = tab3Tasks.filter(
    t => Boolean(t.startTime && t.endTime)
  ).length;

  // Time balance calculations across all blocks (including done)
  const validBlocks = blocks.filter(b => b.status !== 'dropped');
  const totalMinutes = validBlocks.reduce((acc, b) => acc + (b.estimatedMinutes || 60), 0) || 1;

  const minsByQuadrant: Record<QuadrantId, number> = {
    1: validBlocks.filter(b => (b.quadrant || 2) === 1).reduce((acc, b) => acc + (b.estimatedMinutes || 60), 0),
    3: validBlocks.filter(b => (b.quadrant || 2) === 3).reduce((acc, b) => acc + (b.estimatedMinutes || 60), 0),
    2: validBlocks.filter(b => (b.quadrant || 2) === 2).reduce((acc, b) => acc + (b.estimatedMinutes || 60), 0),
    4: validBlocks.filter(b => (b.quadrant || 2) === 4).reduce((acc, b) => acc + (b.estimatedMinutes || 60), 0),
  };

  const pctByQuadrant: Record<QuadrantId, number> = {
    1: Math.round((minsByQuadrant[1] / totalMinutes) * 100),
    3: Math.round((minsByQuadrant[3] / totalMinutes) * 100),
    2: Math.round((minsByQuadrant[2] / totalMinutes) * 100),
    4: Math.max(
      0,
      100 -
        Math.round((minsByQuadrant[1] / totalMinutes) * 100) -
        Math.round((minsByQuadrant[3] / totalMinutes) * 100) -
        Math.round((minsByQuadrant[2] / totalMinutes) * 100)
    ),
  };

  const isLowPriorityHeavy = pctByQuadrant[3] + pctByQuadrant[4] >= 30;

  const activeConfig = FOLDER_TABS.find(t => t.quadrant === activeQuadrant) || FOLDER_TABS[0];
  const activeTasks = getTasksForQuadrant(activeQuadrant);
  const activeTotalMins = activeTasks.reduce((acc, b) => acc + (b.estimatedMinutes || 30), 0);
  const isExpandedList = !!showAllRows[activeQuadrant];
  const visibleTasks = isExpandedList ? activeTasks : activeTasks.slice(0, 7);
  const hiddenCount = Math.max(0, activeTasks.length - 7);

  const handleDoNow = (task: TimeBlock) => {
    setBlocks(prev =>
      prev.map(b =>
        b.id === task.id
          ? { ...b, status: 'in_progress', updatedAt: Date.now() }
          : b.status === 'in_progress'
            ? { ...b, status: 'planned' }
            : b
      )
    );
    setTimerMinutesRemaining(task.estimatedMinutes || 30);
    setIsTimerRunning(true);
    setCurrentTab('now');
    showToast(`Đang làm ngay: "${task.title}"`);
  };

  const handleScheduleSlot = (task: TimeBlock) => {
    const nextStart = task.startTime || '16:00';
    const nextEnd = task.endTime || '16:45';
    setBlocks(prev =>
      prev.map(b =>
        b.id === task.id
          ? {
              ...b,
              startTime: nextStart,
              endTime: nextEnd,
              deadline: b.deadline || 'Tuần này',
              updatedAt: Date.now(),
            }
          : b
      )
    );
    showToast(`Đã giữ khung giờ ${nextStart}–${nextEnd} cho "${task.title}".`);
  };

  const handleDelegateTask = (task: TimeBlock) => {
    setBlocks(prev =>
      prev.map(b =>
        b.id === task.id
          ? {
              ...b,
              quadrant: 3,
              isImportant: false,
              isUrgent: true,
              notes: 'Đã giao việc / Chờ phản hồi',
              updatedAt: Date.now(),
            }
          : b
      )
    );
    showToast(`Đã đánh dấu giao việc: "${task.title}".`);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTitle.trim()) return;
    const isImp = activeQuadrant === 1 || activeQuadrant === 2;
    const isUrg = activeQuadrant === 1 || activeQuadrant === 3;
    const defaultGoal = isImp ? goals[0] : undefined;
    addNewBlock({
      title: quickAddTitle.trim(),
      startTime: '17:00',
      endTime: '17:30',
      type: isImp ? 'deep' : 'interruption',
      status: 'planned',
      goalId: defaultGoal?.id,
      goalName: defaultGoal?.name,
      quadrant: activeQuadrant,
      isImportant: isImp,
      isUrgent: isUrg,
      estimatedMinutes: 30,
      deadline: isUrg ? 'Hôm nay' : 'Tuần này',
    });
    setQuickAddTitle('');
    setShowQuickAdd(false);
    showToast(`Đã thêm vào nhóm "${activeConfig.fullTitle}".`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Four Folder Tabs + Open Panel */}
      <div>
        {/* Folder Tab Headers Row (4 tabs side by side in order of how soon to act) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-1">
          {FOLDER_TABS.map((tab) => {
            const count = getTasksForQuadrant(tab.quadrant).length;
            const isSelected = activeQuadrant === tab.quadrant;
            const Icon = tab.icon;
            return (
              <button
                key={tab.quadrant}
                type="button"
                onClick={() => handleSelectTab(tab.quadrant)}
                className={`relative text-left px-3 py-2.5 rounded-t-2xl border transition-all flex flex-col justify-between gap-1 ${
                  isSelected
                    ? `${tab.tabBgActive} ${tab.tabBorderActive} shadow-xs z-10 -mb-px pb-3`
                    : `${tab.tabBgInactive} border-slate-200/80 opacity-85 hover:opacity-100`
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${tab.tagBg}`}>
                    <Icon className="w-3 h-3 text-white" />
                    <span>{tab.actionTag}</span>
                  </span>
                  <span className="text-[11px] font-extrabold font-mono px-1.5 py-0.5 rounded-full bg-white/80 text-slate-800 border border-slate-200/60">
                    {count} việc
                  </span>
                </div>
                <p className="text-xs font-extrabold leading-snug mt-0.5 line-clamp-1">
                  {tab.shortTitle}
                </p>
                {/* B16 v0.3.19 Guard on Tab 3 header */}
                {tab.quadrant === 2 && (
                  <span className="text-[10px] font-semibold text-blue-700 flex items-center gap-1">
                    <CalendarCheck className="w-3 h-3 shrink-0" />
                    <span>{tab3ScheduledCount}/{tab3Tasks.length} đã có lịch</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Open Folder Panel */}
        <div className={`rounded-b-3xl rounded-tr-3xl border p-4 sm:p-6 shadow-xs transition-all ${activeConfig.panelBg} ${activeConfig.panelBorder}`}>
          {/* Panel Header: full name, action tag (white text on group color), explanation, count & total estimate */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-200/80">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {activeConfig.fullTitle}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold shadow-2xs ${activeConfig.tagBg}`}>
                  {activeConfig.actionTag}
                </span>
                <span className="text-xs font-bold text-slate-600 bg-white/90 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {activeTasks.length} việc · {formatEstimateTotal(activeTotalMins)}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {activeConfig.explanation}
              </p>

              {/* B16 v0.3.19 Guard for Tab 3 (Quan trọng, chưa khẩn) */}
              {activeQuadrant === 2 && (
                <div className="mt-2 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-100/80 border border-blue-200 text-xs text-blue-900">
                  <CalendarCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span className="font-semibold">
                    Tuần này: {tab3ScheduledCount}/{tab3Tasks.length} việc quan trọng đã có khung giờ cố định
                  </span>
                  <button
                    type="button"
                    onClick={() => triggerReminderQuestion('backlog_untouched')}
                    className="underline font-bold text-blue-700 hover:text-blue-900 ml-1"
                  >
                    Rà soát lịch tuần
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold shadow-2xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#E0401F]" />
              <span>Thêm việc</span>
            </button>
          </div>

          {/* Quick Add Form inside active folder */}
          {showQuickAdd && (
            <form onSubmit={handleQuickAddSubmit} className="mt-3 p-3 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={quickAddTitle}
                onChange={e => setQuickAddTitle(e.target.value)}
                placeholder={`Nhập tên việc mới cho nhóm "${activeConfig.fullTitle}"...`}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-[#E0401F] text-white text-xs font-bold"
                >
                  Lưu việc
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold"
                >
                  Đóng
                </button>
              </div>
            </form>
          )}

          {/* Compact Task List (sorted by deadline, first 7 rows then "Xem thêm N việc") */}
          <div className="mt-4 space-y-2">
            {activeTasks.length === 0 ? (
              <div className="py-8 text-center bg-white/70 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                Không có công việc nào đang chờ trong nhóm "{activeConfig.fullTitle}".
              </div>
            ) : (
              <>
                {visibleTasks.map((task) => {
                  const isRowOpen = expandedTaskId === task.id;
                  const estMins = task.estimatedMinutes || 30;
                  const deadlineText = task.deadline || (task.startTime ? `Khung ${task.startTime}` : 'Chưa có hạn');

                  return (
                    <div
                      key={task.id}
                      className="rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all overflow-hidden"
                    >
                      {/* One compact row per task: title, goal, estimate, age if 7+ days, deadline on the right */}
                      <button
                        type="button"
                        onClick={() => setExpandedTaskId(isRowOpen ? null : task.id)}
                        className="w-full px-3.5 py-3 text-left flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {task.title}
                            </span>
                            {task.ageDays && task.ageDays >= 7 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                Tồn {task.ageDays} ngày
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2.5 mt-1 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                              <Target className="w-3 h-3 text-[#E0401F] shrink-0" />
                              <span className="truncate max-w-[200px]">
                                {task.goalName || 'Ngoài mục tiêu chính'}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{estMins} phút</span>
                            </span>
                          </div>
                        </div>

                        {/* Right side: Deadline + expand chevron */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                            deadlineText.toLowerCase().includes('hôm nay')
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : deadlineText === 'Chưa có hạn'
                                ? 'bg-slate-50 text-slate-500 border-slate-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {deadlineText}
                          </span>
                          {isRowOpen ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Expanded row actions: Làm ngay, Lên lịch, Giao việc, Loại bỏ, or move to another group */}
                      {isRowOpen && (
                        <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100 bg-slate-50/70 space-y-2.5 animate-in fade-in duration-150">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDoNow(task)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs"
                            >
                              <Play className="w-3 h-3 fill-white text-white" />
                              <span>Làm ngay</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleScheduleSlot(task)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs"
                            >
                              <Calendar className="w-3 h-3 text-white" />
                              <span>Lên lịch</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelegateTask(task)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs"
                            >
                              <Users className="w-3 h-3 text-white" />
                              <span>Giao việc</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => markTaskDone(task.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs"
                            >
                              <CheckCircle2 className="w-3 h-3 text-white" />
                              <span>Đã xong</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => dropTask(task.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Loại bỏ</span>
                            </button>
                          </div>

                          {/* Move to another group (by plain Vietnamese name, no Q1-Q4 codes) */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-slate-500">
                              Chuyển sang nhóm:
                            </span>
                            {FOLDER_TABS.filter(ft => ft.quadrant !== activeQuadrant).map(ft => (
                              <button
                                key={ft.quadrant}
                                type="button"
                                onClick={() => {
                                  moveTaskQuadrant(task.id, ft.quadrant);
                                  setExpandedTaskId(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold transition-colors"
                              >
                                {ft.shortTitle} ({ft.actionTag})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* "Xem thêm N việc" after first 7 rows */}
                {hiddenCount > 0 && !isExpandedList && (
                  <button
                    type="button"
                    onClick={() => setShowAllRows(prev => ({ ...prev, [activeQuadrant]: true }))}
                    className="w-full py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold shadow-2xs transition-all"
                  >
                    Xem thêm {hiddenCount} việc
                  </button>
                )}

                {isExpandedList && activeTasks.length > 7 && (
                  <button
                    type="button"
                    onClick={() => setShowAllRows(prev => ({ ...prev, [activeQuadrant]: false }))}
                    className="w-full py-2 rounded-2xl bg-white/80 hover:bg-white text-slate-600 border border-slate-200 text-xs font-semibold transition-all"
                  >
                    Thu gọn danh sách
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Time Balance Bar Below (same 4 colors and same action order) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E0401F]" />
              <span>Cân bằng thời gian giữa 4 nhóm ưu tiên</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tỷ lệ thời gian phân bổ theo thứ tự hành động: Làm ngay · Giao ngay · Lên lịch · Loại bỏ
            </p>
          </div>

          {isLowPriorityHeavy && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Gợi ý nhẹ: Nhóm "Giao ngay" và "Loại bỏ" đang chiếm {pctByQuadrant[3] + pctByQuadrant[4]}% thời gian. Hãy giữ thêm giờ cho việc "Quan trọng, chưa khẩn".
              </span>
            </div>
          )}
        </div>

        {/* 4-segment bar in exact tab order (1 -> 3 -> 2 -> 4) */}
        <div className="space-y-2.5">
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 p-0.5 gap-0.5 border border-slate-200">
            {FOLDER_TABS.map(tab => (
              <div
                key={tab.quadrant}
                style={{ width: `${pctByQuadrant[tab.quadrant]}%` }}
                className={`${tab.barColor} h-full first:rounded-l-full last:rounded-r-full transition-all duration-500`}
                title={`${tab.fullTitle} (${tab.actionTag}): ${pctByQuadrant[tab.quadrant]}%`}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {FOLDER_TABS.map(tab => (
              <button
                key={tab.quadrant}
                type="button"
                onClick={() => handleSelectTab(tab.quadrant)}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors"
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${tab.barColor}`} />
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate text-[11px]">{tab.shortTitle}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {pctByQuadrant[tab.quadrant]}% ({minsByQuadrant[tab.quadrant]} phút)
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
