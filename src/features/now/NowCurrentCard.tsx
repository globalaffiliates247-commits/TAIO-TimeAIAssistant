'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { clockState } from '@/features/clock';
import { updateScheduleEntry } from '@/features/tasks';
import { NowClockRing } from './NowClockRing';
import { MotivationSticker } from '@/features/motivation';
import { getDeviceCalendarDate, getDeviceTimeMinutes, timeToMinutes } from '@/core/clock';
import { fmtDuration } from '@/features/sticky/model/timeline';
import { findGoalSuggestion } from '@/features/goals';
import { useT } from '@/i18n/useT';
import { 
  Pin, 
  ChevronRight, 
  MoreHorizontal, 
  Plus, 
  CheckCircle2, 
  Pause, 
  Play, 
  Target, 
  Clock, 
  Bookmark, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  X
} from 'lucide-react';
import type { TimeBlock, TaskEndType, DodItem, UserRole } from '@/types';

export const NowCurrentCard: React.FC = () => {
  const { 
    scheduleBlocks, 
    dayTemplate, 
    goals, 
    dailyCardItems, 
    updateDailyCardItem, 
    toggleDailyCardItem,
    setBlocks,
    setCheckInBlock,
    setCheckInModalOpen,
    activeReturnPoint,
    isOffPlan,
    toggleOffPlan,
    currentUserRole,
    setCurrentUserRole,
    palette,
    language,
    showToast,
    isNativePlatform
  } = useApp();

  const { t } = useT();
  const isCool = palette === 'cool';
  const now = new Date();
  const todayStr = getDeviceCalendarDate(now);
  const nowMins = getDeviceTimeMinutes();
  const state = clockState(scheduleBlocks, dayTemplate, now, language as 'vi' | 'en');

  // Active block
  const activeTask: TimeBlock | undefined = state.block;
  const isCountDown = state.isCountDown;

  // Pin state
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('taio_lockscreen_clock_enabled');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  // Menu ⋯ state
  const [menuOpen, setMenuOpen] = useState(false);
  // Task detail modal state
  const [detailOpen, setDetailOpen] = useState(false);
  // "Tôi đang làm việc khác" modal
  const [doingOtherOpen, setDoingOtherOpen] = useState(false);
  const [otherTaskInput, setOtherTaskInput] = useState('');

  // Paused state for count-up
  const [isPaused, setIsPaused] = useState(false);
  // v0.3.34 Part E1: Task return point editing
  const [isEditingReturnPoint, setIsEditingReturnPoint] = useState(false);
  const [returnPointDraft, setReturnPointDraft] = useState('');

  const togglePin = () => {
    const next = !isPinned;
    setIsPinned(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('taio_lockscreen_clock_enabled', String(next));
      if ((window as any).taioAPI?.openClockWindow) {
        if (next) (window as any).taioAPI.openClockWindow();
      }
    }
    showToast?.(next 
      ? (language === 'en' ? 'Clock pinned (floating / lockscreen)' : 'Đã ghim đồng hồ')
      : (language === 'en' ? 'Clock unpinned' : 'Đã bỏ ghim đồng hồ')
    );
  };

  // Switch task end type
  const cycleEndType = () => {
    if (!activeTask) return;
    const cur = activeTask.taskEndType || 'timebox';
    const next: TaskEndType = 
      cur === 'timebox' ? 'until_done_pausable' :
      cur === 'until_done_pausable' ? 'until_done_atomic' : 'timebox';
    
    updateScheduleEntry(
      activeTask.id,
      { taskEndType: next },
      { updateDailyCardItem, setBlocks, dailyCardItems }
    );
  };

  // Add +5p / +15p (G5.4: updates end time in journal)
  const handleExtend = (mins: number) => {
    if (!activeTask) return;
    const curEnd = activeTask.endTime || '00:00';
    const [h, m] = curEnd.split(':').map(Number);
    const newTotal = h * 60 + m + mins;
    const newEnd = `${String(Math.floor((newTotal % 1440) / 60)).padStart(2, '0')}:${String(newTotal % 60).padStart(2, '0')}`;
    
    updateScheduleEntry(
      activeTask.id,
      { endTime: newEnd },
      { updateDailyCardItem, setBlocks, dailyCardItems }
    );
    showToast?.(language === 'en' ? `Extended +${mins}m on journal` : `Đã thêm +${mins} phút vào nhật ký`);
  };

  // Finish task
  const handleFinish = () => {
    if (activeTask) {
      setCheckInBlock(activeTask);
      setCheckInModalOpen(true);
    }
  };

  // Switch to doing another task (Part F)
  const handleStartOtherTask = (title: string) => {
    if (!title.trim()) return;
    if (activeTask) {
      // Revert current planned task status
      updateScheduleEntry(
        activeTask.id,
        { status: 'planned', extra: { ...(activeTask.extra || {}), startedAt: undefined } },
        { updateDailyCardItem, setBlocks, dailyCardItems }
      );
    }
    // Set new task in_progress with startedAt timestamp
    const nowTimeStr = `${String(Math.floor(nowMins / 60)).padStart(2, '0')}:${String(nowMins % 60).padStart(2, '0')}`;
    const endTimeStr = `${String(Math.floor((nowMins + 30) / 60)).padStart(2, '0')}:${String((nowMins + 30) % 60).padStart(2, '0')}`;
    
    updateScheduleEntry(
      `dc-${Date.now()}`,
      { 
        title: title.trim(),
        startTime: nowTimeStr,
        endTime: endTimeStr,
        status: 'in_progress',
        extra: { startedAt: Date.now() }
      },
      { updateDailyCardItem, setBlocks, dailyCardItems }
    );

    setDoingOtherOpen(false);
    setOtherTaskInput('');
    showToast?.(language === 'en' ? `Switched to: ${title}` : `Đã chuyển sang: ${title}`);
  };

  // Format countdown / countup
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const endTypeLabel = 
    activeTask?.taskEndType === 'until_done_atomic' ? (language === 'en' ? 'One Sitting' : 'Làm liền mạch') :
    activeTask?.taskEndType === 'until_done_pausable' ? (language === 'en' ? 'Until Done' : 'Đến khi xong') :
    (language === 'en' ? 'Ends on Time' : 'Hết giờ phải xong');

  const linkedGoal = goals.find(g => g.id === activeTask?.goalId);

  // Remaining / Elapsed string
  const totalDurationMins = activeTask ? Math.max(5, (timeToMinutes(activeTask.endTime) - timeToMinutes(activeTask.startTime) + 1440) % 1440) : 30;
  const remSec = state.remainingSeconds;
  const percent = totalDurationMins > 0 ? ((totalDurationMins * 60 - remSec) / (totalDurationMins * 60)) * 100 : 0;

  // 1. GAP / IDLE STATE
  if (state.mode === 'gap') {
    return (
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-4 select-none animate-in fade-in duration-200">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-100 pb-2.5">
          <span className="flex items-center gap-1.5 text-amber-600 font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            {t('terms.idle', 'Trống')}
          </span>
          <span className="tabular-nums">
            {state.block ? `${state.block.startTime}` : ''}
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {state.subtitle}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'en' ? 'You have free time before next scheduled block' : 'Bạn có khoảng thời gian trống trước công việc tiếp theo'}
          </p>
        </div>

        {/* Action: Start next task early */}
        {state.next && (
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (state.block) {
                  updateScheduleEntry(
                    state.block.id,
                    { status: 'in_progress', extra: { ...(state.block.extra || {}), startedAt: Date.now() } },
                    { updateDailyCardItem, setBlocks, dailyCardItems }
                  );
                }
              }}
              className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{language === 'en' ? `Start early: ${state.next.title}` : `Bắt đầu sớm: ${state.next.title}`}</span>
            </button>
          </div>
        )}

        <MotivationSticker slotKey="clock_idle" context="break" size="line" className="pt-2 border-t border-slate-100" />
      </div>
    );
  }

  // 2. TEMPLATE / CURRENT TIME (No more scheduled tasks)
  if (state.mode === 'template_or_current') {
    return (
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-4 select-none animate-in fade-in duration-200">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-b border-slate-100 pb-2.5">
          <span className="flex items-center gap-1.5 text-slate-600 font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            {t('terms.clock', 'Đồng hồ')}
          </span>
          <span className="tabular-nums font-bold text-slate-700">{state.title}</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {state.subtitle}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'en' ? 'All scheduled tasks for today are completed' : 'Đã hết việc có giờ cho hôm nay'}
          </p>
        </div>

        <MotivationSticker slotKey="clock_idle" context="break" size="line" className="pt-2 border-t border-slate-100" />
      </div>
    );
  }

  // 3. ACTIVE TASK STATE ("ĐANG LÀM")
  return (
    <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-4 select-none relative animate-in fade-in duration-200">
      {/* Top line: ĐANG LÀM · 06:30–06:45 + End type badge */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>{language === 'en' ? 'IN PROGRESS' : 'ĐANG LÀM'}</span>
          {activeTask && (
            <span className="text-slate-400 font-semibold tabular-nums">
              · {activeTask.startTime}–{activeTask.endTime}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Badge: End type, clickable to toggle */}
          <button
            type="button"
            onClick={cycleEndType}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
              activeTask?.taskEndType === 'until_done_atomic'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : activeTask?.taskEndType === 'until_done_pausable'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
            title="Bấm để đổi tính chất việc"
          >
            {endTypeLabel}
          </button>

          {/* Menu ⋯ button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div 
                  onClick={() => setMenuOpen(false)} 
                  className="fixed inset-0 z-30 bg-transparent" 
                />
                <div className="absolute right-0 top-8 z-40 w-52 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 text-xs text-slate-700 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => { setDoingOtherOpen(true); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 font-semibold flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>{language === 'en' ? "I'm doing something else" : 'Tôi đang làm việc khác'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { toggleOffPlan(); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 font-semibold flex items-center gap-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span>{isOffPlan ? 'Trở lại kế hoạch' : 'Báo lệch kế hoạch'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDetailOpen(true); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 font-semibold flex items-center gap-2 border-t border-slate-100"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-blue-500" />
                    <span>{language === 'en' ? 'Task details & criteria' : 'Chi tiết việc & tiêu chí'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Task Name with › and Pin Icon */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="text-left font-black text-xl sm:text-2xl text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-1.5 group min-w-0"
        >
          <span className="truncate">{activeTask?.title || state.title}</span>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* Pin icon */}
        <button
          type="button"
          onClick={togglePin}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 border ${
            isPinned 
              ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-xs' 
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400'
          }`}
          title={isPinned ? 'Bỏ ghim đồng hồ' : 'Ghim đồng hồ'}
        >
          <Pin className={`w-4 h-4 ${isPinned ? 'fill-amber-700' : ''}`} />
        </button>
      </div>

      {/* v0.3.34 Part E1: Return Point belongs to each task, dismissable with × and clickable to edit */}
      {(() => {
        const taskReturnPoint = activeTask?.nextStep || activeTask?.returnPoint;
        if (!taskReturnPoint || !activeTask) return null;

        const handleSaveReturnPoint = (newVal: string) => {
          setIsEditingReturnPoint(false);
          updateScheduleEntry(
            activeTask.id,
            { returnPoint: newVal.trim(), nextStep: newVal.trim() },
            { updateDailyCardItem, setBlocks, dailyCardItems }
          );
        };

        const handleDismissReturnPoint = () => {
          updateScheduleEntry(
            activeTask.id,
            { returnPoint: '', nextStep: '' },
            { updateDailyCardItem, setBlocks, dailyCardItems }
          );
          showToast(language === 'vi' ? 'Đã bỏ điểm quay lại.' : 'Return point cleared.');
        };

        return (
          <div className="p-3 rounded-2xl bg-orange-50/90 border border-orange-200/80 text-orange-950 text-xs space-y-1 relative group">
            <div className="flex items-center justify-between font-bold text-orange-800">
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>{t('checkin.return_point_title', 'Bắt đầu từ nơi bạn đã dừng lại')}</span>
              </div>
              <button
                type="button"
                onClick={handleDismissReturnPoint}
                className="w-5 h-5 rounded-md hover:bg-orange-200/60 text-orange-700 flex items-center justify-center transition-colors"
                title="Bỏ điểm quay lại"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {isEditingReturnPoint ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveReturnPoint(returnPointDraft);
                }}
                className="pt-0.5"
              >
                <input
                  type="text"
                  autoFocus
                  value={returnPointDraft}
                  onChange={(e) => setReturnPointDraft(e.target.value)}
                  onBlur={() => handleSaveReturnPoint(returnPointDraft)}
                  className="w-full px-2 py-1 bg-white border border-orange-300 rounded-lg text-xs text-orange-950 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="Gõ bước tiếp theo..."
                />
              </form>
            ) : (
              <div
                onClick={() => {
                  setReturnPointDraft(taskReturnPoint);
                  setIsEditingReturnPoint(true);
                }}
                className="text-orange-900 hover:text-orange-950 cursor-pointer hover:underline transition-colors"
                title="Bấm để sửa bước tiếp theo"
              >
                {t('checkin.return_point_next', { step: taskReturnPoint, defaultValue: `Bước tiếp theo: ${taskReturnPoint}` })}
              </div>
            )}
          </div>
        );
      })()}

      {/* PRD v0.3.33 Part F2.3 & G2.10: Accompanying side task (Việc kèm) */}
      {(() => {
        const accompanyingSideTask = dailyCardItems.find(i => 
          i.date === todayStr &&
          (i.parallelOf === activeTask?.id || (i.extra as Record<string, unknown> | undefined)?.parallelOf === activeTask?.id) &&
          i.status === 'open'
        );
        if (!accompanyingSideTask) return null;
        return (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold text-slate-500">∥</span>
              <span className="font-semibold text-slate-800 truncate">
                {accompanyingSideTask.text}
              </span>
              {accompanyingSideTask.start && (
                <span className="text-[11px] font-mono text-slate-500">
                  ({accompanyingSideTask.start}–{accompanyingSideTask.end})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => toggleDailyCardItem(accompanyingSideTask.id)}
              className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10.5px] font-semibold transition-colors shrink-0"
            >
              {language === 'vi' ? 'Kết thúc việc kèm' : 'End side task'}
            </button>
          </div>
        );
      })()}

      {/* Parallel side task line (Part F) */}
      {Boolean(activeTask?.extra?.parallelOf || activeTask?.parallelOf) && (
        <div className="text-xs font-semibold text-slate-600 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="font-mono text-slate-400">∥</span>
          <span>{language === 'en' ? 'Side task (parallel)' : 'Việc kèm (song song)'}</span>
        </div>
      )}

      {/* Main Body: Clock Ring + Goal Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 py-2">
        {/* Ring Clock */}
        <NowClockRing
          isCountDown={isCountDown}
          percent={percent}
          timeText={formatTime(remSec)}
          subText={
            isCountDown
              ? `${language === 'en' ? 'remaining' : 'còn lại'} / ${fmtDuration(totalDurationMins, language as 'vi' | 'en')}`
              : `${language === 'en' ? 'worked' : 'đã làm'} / ${fmtDuration(totalDurationMins, language as 'vi' | 'en')}`
          }
          isOverrun={!isCountDown && percent >= 100}
          isCool={isCool}
        />

        {/* Right Info: Linked Goal & Progress */}
        <div className="flex-1 min-w-0 space-y-3 w-full sm:w-auto">
          {linkedGoal ? (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                  <Target className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{linkedGoal.name}</span>
                </span>
                <span className="font-bold text-slate-600 tabular-nums">
                  {linkedGoal.progressPercent}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${isCool ? 'bg-blue-600' : 'bg-[#E0401F]'}`}
                  style={{ width: `${Math.min(100, Math.max(0, linkedGoal.progressPercent))}%` }}
                />
              </div>
            </div>
          ) : (() => {
            // v0.3.34 Part E2: Suggested vs Attached Goal
            const extra = (activeTask?.extra as Record<string, unknown> | undefined) || {};
            const isDismissed = !!extra.dismissGoalSuggestion;
            const sug = (!linkedGoal && activeTask && !isDismissed)
              ? findGoalSuggestion(activeTask.title, goals)
              : null;

            if (sug) {
              return (
                <div className="p-2.5 rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex items-center gap-1.5 text-amber-900 truncate">
                    <Target className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">
                      {language === 'vi' ? 'Gợi ý:' : 'Suggested:'} <strong className="font-semibold">{sug.goal.name}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTask) {
                          updateScheduleEntry(activeTask.id, {
                            goalId: sug.goal.id,
                            goalName: sug.goal.name,
                            milestoneId: sug.milestone?.id,
                            milestoneName: sug.milestone?.name,
                          }, { updateDailyCardItem, setBlocks, dailyCardItems });
                          showToast(language === 'vi' ? '✓ Đã gắn mục tiêu.' : '✓ Goal linked.');
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-2xs"
                      title="Nhận gợi ý mục tiêu"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTask) {
                          updateScheduleEntry(activeTask.id, {
                            extra: { ...extra, dismissGoalSuggestion: true }
                          }, { updateDailyCardItem, setBlocks, dailyCardItems });
                        }
                      }}
                      className="px-1.5 py-0.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                      title="Bỏ gợi ý"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <button
                type="button"
                onClick={() => setDetailOpen(true)}
                className="w-full p-3 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Link goal' : 'Gắn mục tiêu'}</span>
              </button>
            );
          })()}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isCountDown ? (
              <>
                <button
                  type="button"
                  onClick={() => handleExtend(5)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all border border-slate-200"
                >
                  +5p
                </button>
                <button
                  type="button"
                  onClick={() => handleExtend(15)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all border border-slate-200"
                >
                  +15p
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className={`flex-1 py-2 px-3 rounded-xl text-white font-bold text-xs shadow-xs transition-all ${
                    isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c93517]'
                  }`}
                >
                  {language === 'en' ? 'Finish' : 'Kết thúc'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsPaused(v => !v)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all border border-slate-200 flex items-center justify-center gap-1.5"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className={`flex-1 py-2 px-3 rounded-xl text-white font-bold text-xs shadow-xs transition-all ${
                    isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c93517]'
                  }`}
                >
                  {language === 'en' ? 'Finish' : 'Kết thúc'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      {detailOpen && activeTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-slate-900">Chi tiết công việc</h3>
              <button onClick={() => setDetailOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên việc</label>
                <input
                  type="text"
                  value={activeTask.title}
                  onChange={e => updateScheduleEntry(activeTask.id, { title: e.target.value }, { updateDailyCardItem, setBlocks, dailyCardItems })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bắt đầu</label>
                  <input
                    type="time"
                    value={activeTask.startTime}
                    onChange={e => updateScheduleEntry(activeTask.id, { startTime: e.target.value }, { updateDailyCardItem, setBlocks, dailyCardItems })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kết thúc</label>
                  <input
                    type="time"
                    value={activeTask.endTime}
                    onChange={e => updateScheduleEntry(activeTask.id, { endTime: e.target.value }, { updateDailyCardItem, setBlocks, dailyCardItems })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mục tiêu phục vụ</label>
                <select
                  value={activeTask.goalId || ''}
                  onChange={e => {
                    const g = goals.find(goal => goal.id === e.target.value);
                    updateScheduleEntry(activeTask.id, { goalId: g?.id, goalName: g?.name }, { updateDailyCardItem, setBlocks, dailyCardItems });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                >
                  <option value="">(Không gắn mục tiêu)</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setDetailOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Xong
            </button>
          </div>
        </div>
      )}

      {/* "Tôi đang làm việc khác" Modal */}
      {doingOtherOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-slate-900">Tôi đang làm việc khác</h3>
              <button onClick={() => setDoingOtherOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Việc đã xếp sẽ được trả về trạng thái chưa bắt đầu và không bị tính giờ.
            </p>

            {/* PRD v0.3.33 Part F1.2: Pick from existing journal tasks */}
            {(() => {
              const pendingJournalTasks = dailyCardItems.filter(i => 
                i.date === todayStr && i.status === 'open' && i.id !== activeTask?.id
              );
              if (pendingJournalTasks.length === 0) return null;
              return (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {language === 'en' ? 'Or pick from Today Journal:' : 'Hoặc chọn từ Nhật ký hôm nay:'}
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {pendingJournalTasks.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleStartOtherTask(t.text)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors"
                      >
                        <span className="truncate">{t.text}</span>
                        {t.start && <span className="font-mono text-[10px] text-slate-400 shrink-0">{t.start}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <input
              type="text"
              autoFocus
              value={otherTaskInput}
              onChange={e => setOtherTaskInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleStartOtherTask(otherTaskInput); }}
              placeholder="Gõ tên việc bạn đang làm thực tế..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDoingOtherOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleStartOtherTask(otherTaskInput)}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Bắt đầu việc này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Motivation Quote Line */}
      <MotivationSticker slotKey="free_sheet" context="start_task" size="line" className="pt-2 border-t border-slate-100" />
    </div>
  );
};
