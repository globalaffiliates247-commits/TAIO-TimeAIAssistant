'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, TaskEndType, DodItem } from '../types';
import { updateScheduleEntry } from '@/features/tasks';
import { useT } from '@/i18n/useT';
import {
  startNativeLiveActivity,
  stopNativeLiveActivity,
  openNativeDeviceTimer,
  openNativeAppSettings
} from '../features/native';
import { 
  Clock, 
  Target, 
  AlertCircle, 
  Zap, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  CheckCircle, 
  ArrowRight, 
  Bell, 
  Sparkles, 
  UserCheck, 
  ChevronRight, 
  AlertTriangle,
  Flame,
  ShieldCheck,
  Calendar,
  Lock,
  Layers,
  Inbox,
  X
} from 'lucide-react';
import { QuickEntryTiles, QuickLineInput } from '../features/quick-entry';
import { FreeTimerInput, FreeTimerList } from '@/features/clock';
import { StartDayCard } from '@/features/motivation';
import { openStickyBoard } from '@/features/sticky';
import { getDeviceCalendarDate } from '@/core/clock';
import { MotionPermissionCard, isMotionPermissionCardDismissed } from '@/features/motion';
import { 
  StepsTile, 
  getMotionCapability, 
  isMotionTrackingEnabled, 
  queryPedometer 
} from '@/features/motion';

const ROLE_LABELS: Record<UserRole, { label: string; type: 'work' | 'personal' }> = {
  'decision-maker': { label: 'Người ra quyết định', type: 'work' },
  'operator': { label: 'Người vận hành', type: 'work' },
  'seller': { label: 'Bán hàng / Đàm phán', type: 'work' },
  'self': { label: 'Bản thân', type: 'personal' },
  'family': { label: 'Gia đình', type: 'personal' },
  'friend': { label: 'Bạn bè', type: 'personal' },
};

const WORK_STYLE_LABELS: Record<string, string> = {
  mixed: 'Linh hoạt',
  sequential: 'Theo trình tự',
  multitasking: 'Đa nhiệm',
};

export const NowTab: React.FC = () => {
  const { 
    currentBlock, 
    setBlocks,
    blocks,
    scheduleBlocks,
    goals, 
    deadlines, 
    interruptions,
    profile,
    timerMinutesRemaining, 
    setTimerMinutesRemaining,
    isTimerRunning, 
    setIsTimerRunning,
    setInterruptionModalOpen,
    setCheckInBlock,
    setCheckInModalOpen,
    activeReturnPoint,
    toneLevel,
    language,
    openDrilldown,
    currentUserRole,
    setCurrentUserRole,
    isOffPlan,
    offPlanMinutes,
    toggleOffPlan,
    backToPlan,
    setInboxModalOpen,
    addInboxItem,
    palette,
    currentPaletteColors,
    isNativePlatform,
    nativePlatformName,
    showToast,
    dailyCardItems,
    updateDailyCardItem,
    freeTimers,
    addFreeTimer,
    togglePauseFreeTimer,
    addFreeTimerSeconds,
    finishFreeTimer,
    deleteFreeTimer,
    restartFreeTimer,
    passiveSuggestions,
    setIsActiveCaptureOpen,
  } = useApp();

  const { t } = useT();

  const isCool = palette === 'cool';

  const linkedGoal = goals.find(g => g.id === currentBlock?.goalId);
  const nextDeadline = deadlines[0];

  // B23 Task End Type: 'timebox' | 'until_done_pausable' | 'until_done_atomic'
  const currentEndType: TaskEndType = currentBlock?.taskEndType || 'timebox';
  const userTimeLimit: number = currentBlock?.timeLimitMins || currentBlock?.estimatedMinutes || 90;

  // Elapsed minutes for until-done tasks (counts up) + live seconds for B19 v0.3.11 ring & units
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(35);
  const [secondsTick, setSecondsTick] = useState<number>(5);
  const [showOverrunNotice, setShowOverrunNotice] = useState<boolean>(false);

  // PRD FIX v0.3.30 Part B3.3: StepsTile State
  const [stepsToday, setStepsToday] = useState<number>(0);
  const [movingMinsToday, setMovingMinsToday] = useState<number>(0);
  const [hasMotionPermission, setHasMotionPermission] = useState<boolean>(false);

  useEffect(() => {
    if (!isNativePlatform || !isMotionTrackingEnabled()) return;

    getMotionCapability().then(async cap => {
      if (cap.authorizationStatus === 'authorized') {
        setHasMotionPermission(true);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const fromSec = Math.floor(startOfDay.getTime() / 1000);
        const toSec = Math.floor(now.getTime() / 1000);
        const pedo = await queryPedometer(fromSec, toSec);
        setStepsToday(pedo.steps);
        const mins = Math.max(
          Math.round(pedo.steps / 100),
          (dailyCardItems || [])
            .filter(i => (i.extra?.steps as number || 0) > 0)
            .reduce((sum, curr) => sum + (curr.extra?.actualMinutes as number || 0), 0)
        );
        setMovingMinsToday(mins);
      }
    });
  }, [isNativePlatform, dailyCardItems]);
  // B19 v0.3.17: Remembered per user, default on
  const [liveActivityActive, setLiveActivityActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('taio_lockscreen_clock_enabled');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setSecondsTick(prev => {
        if (currentEndType === 'timebox') {
          if (prev <= 0) {
            setTimerMinutesRemaining(m => Math.max(0, m - 1));
            return 59;
          }
          return prev - 1;
        } else {
          if (prev >= 59) {
            setElapsedMinutes(m => m + 1);
            return 0;
          }
          return prev + 1;
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, currentEndType, setTimerMinutesRemaining]);

  // B19 v0.3.11: Format clock value & unit label ("phút : giây" under 1h, "giờ : phút" from 1h)
  const formatClockDisplay = (mins: number, secs: number) => {
    const absMins = Math.abs(mins);
    if (absMins < 60) {
      const mStr = String(absMins).padStart(2, '0');
      const sStr = String(secs).padStart(2, '0');
      return { value: `${mStr}:${sStr}`, unitLabel: 'phút : giây' };
    }
    const hrs = Math.floor(absMins / 60);
    const remMins = absMins % 60;
    return { value: `${hrs}:${String(remMins).padStart(2, '0')}`, unitLabel: 'giờ : phút' };
  };

  // Check overrun for until-done tasks
  const isOverTimeLimit = (currentEndType !== 'timebox') && (elapsedMinutes > userTimeLimit);

  // Acceptance criteria input state
  const [newDodText, setNewDodText] = useState<string>('');

  // Quick switch of end type for current block (routed via updateScheduleEntry for dc-* support)
  const handleSetEndType = (endType: TaskEndType) => {
    if (!currentBlock) return;
    updateScheduleEntry(
      currentBlock.id,
      { taskEndType: endType },
      { updateDailyCardItem, setBlocks, dailyCardItems }
    );
  };

  const handleAddDodItem = (text: string) => {
    if (!currentBlock || !text.trim()) return;
    const currentList: DodItem[] = currentBlock.dodChecklist || [];
    const newItem: DodItem = {
      id: `dod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: text.trim(),
      completed: false,
    };
    const updated = [...currentList, newItem];
    updateScheduleEntry(
      currentBlock.id,
      { dodChecklist: updated },
      { updateDailyCardItem, setBlocks, dailyCardItems }
    );
    setNewDodText('');
  };

  const handleRemoveDodItem = (dodId: string) => {
    if (!currentBlock) return;
    const updated = (currentBlock.dodChecklist || []).filter(i => i.id !== dodId);
    updateScheduleEntry(
      currentBlock.id,
      { dodChecklist: updated },
      { updateDailyCardItem, setBlocks, dailyCardItems }
    );
  };

  const handleTimerToggle = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleAddExtraTime = (mins: number) => {
    if (currentEndType === 'timebox') {
      setTimerMinutesRemaining(prev => prev + mins);
    } else {
      setBlocks(prev => prev.map(b => b.id === currentBlock?.id ? { ...b, timeLimitMins: userTimeLimit + mins } : b));
    }
  };

  const handleFinishEarly = () => {
    if (currentBlock) {
      setCheckInBlock(currentBlock);
      setCheckInModalOpen(true);
    }
  };

  // Schedule for later (atomic task interruption protection)
  const handleScheduleForLater = () => {
    const itemTitle = prompt('Nhập nhanh việc phát sinh cần xếp lịch sau (không phá vỡ khối nguyên tử):');
    if (itemTitle && itemTitle.trim()) {
      addInboxItem({
        title: itemTitle.trim(),
        nextAction: itemTitle.trim(),
        estimatedMinutes: 30,
        source: 'quick',
      });
      alert('✓ Đã đưa việc phát sinh vào Rổ việc (Inbox) để xử lý sau. Khối nguyên tử được bảo vệ an toàn!');
    }
  };

  // Stats calculation (FIX v0.3.28 A2: computed from scheduleBlocks)
  const totalCount = scheduleBlocks.length;
  const completedCount = scheduleBlocks.filter(b => b.status === 'done').length;
  const deepWorkMinutes = scheduleBlocks
    .filter(b => b.status === 'done' && b.type === 'deep')
    .reduce((acc, b) => acc + (b.touchTimeMinutes || b.estimatedMinutes || 30), 0) || 150;

  const intUsedMins = interruptions
    .filter(i => i.decision === 'do_now')
    .reduce((acc, curr) => acc + curr.minutes, 0);

  const protectedMins = interruptions
    .filter(i => i.decision === 'decline' || i.decision === 'delegate')
    .reduce((acc, curr) => acc + curr.minutes, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* PRD FEATURE v0.3.31 Part C: "Bắt đầu ngày" Card */}
      <StartDayCard onOpenTodaySheet={() => openStickyBoard(getDeviceCalendarDate())} />

      {/* PRD FIX v0.3.28 B1 & B3: Quick Entry Tiles and Mac QuickLineInput */}
      <QuickEntryTiles />
      <QuickLineInput />

      {/* PRD FIX v0.3.30 Part B4: Core Motion Invitation Card on iPhone */}
      {isNativePlatform && !isMotionPermissionCardDismissed() && (
        <MotionPermissionCard onPermissionChanged={(granted) => setHasMotionPermission(granted)} />
      )}

      {/* PRD FIX v0.3.30 Part B3.3: StepsTile on iPhone */}
      {isNativePlatform && hasMotionPermission && isMotionTrackingEnabled() && (
        <StepsTile
          stepsToday={stepsToday}
          movingMinutesToday={movingMinsToday}
          unconfirmedCount={(passiveSuggestions || []).filter(s => s.status === 'pending' && s.source === 'motion').length}
          onClick={() => setIsActiveCaptureOpen(true)}
        />
      )}

      {/* Off-plan Warning Banner (PRD v0.8 B5) */}
      {isOffPlan && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">Đang ngoài kế hoạch ({offPlanMinutes} phút)</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Bạn đang lệch mốc dự kiến {offPlanMinutes} phút. Hãy đưa ra 1 lựa chọn nhanh:
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setInterruptionModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-300 shadow-xs"
            >
              Ghi nhận việc này
            </button>
            <button
              onClick={backToPlan}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm ${
                isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#d03515]'
              }`}
            >
              Quay lại kế hoạch
            </button>
          </div>
        </div>
      )}

      {/* Return Point Prompt if returning from interruption */}
      {activeReturnPoint && !isOffPlan && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                Điểm quay lại của bạn:
              </span>
              <span className="text-[11px] text-amber-600">Đã lưu từ lúc có việc phát sinh</span>
            </div>
            <p className="text-sm text-amber-950 font-medium mt-1">
              "{activeReturnPoint}"
            </p>
          </div>
        </div>
      )}

      {/* Master Card: Who am I? Where am I? What am I doing? */}
      <div className="rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all border bg-white border-slate-200 text-slate-900">
        {/* Subtle accent glow */}
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-5 ${
          isCool ? 'bg-blue-500' : 'bg-red-500'
        }`} />

        {/* Top Header & Role Selector (Who am I?) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">
              Trọng tâm hiện tại
            </h2>
            
            {/* Role Chip (Who am I right now?) */}
            <div className="flex items-center gap-1.5 ml-1 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 shadow-xs">
              <UserCheck className={`w-3.5 h-3.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
              <span className="text-[11px] text-slate-500">Vai trò:</span>
              <select
                value={currentUserRole}
                onChange={e => setCurrentUserRole(e.target.value as UserRole)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-white text-slate-800">
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* B23 Work Style & Off-Plan Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500">
              Nhịp làm: <strong className={isCool ? 'text-blue-600' : 'text-[#E0401F]'}>{WORK_STYLE_LABELS[profile.workStyle || 'mixed'] || 'Linh hoạt'}</strong>
            </span>
            <button
              onClick={toggleOffPlan}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all font-semibold ${
                isOffPlan 
                  ? 'bg-rose-50 text-rose-600 border-rose-200 font-bold' 
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 shadow-xs'
              }`}
            >
              {isOffPlan ? '● Đang lệch kế hoạch' : 'Báo lệch kế hoạch'}
            </button>
          </div>
        </div>

        {/* Always visible 4-Number Time Ledger Glance (unnumbered per D5 v0.3.17) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6 p-3.5 rounded-2xl border text-xs bg-slate-50/90 border-slate-200 shadow-xs">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Việc mục tiêu</span>
            <span className={`text-base font-black ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`}>285 phút</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Chen ngang</span>
            <span className="text-base font-black text-amber-600">{intUsedMins} / {profile.interruptionReserveMins} phút</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Xao nhãng</span>
            <span className="text-base font-black text-rose-600">45 phút</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Thời gian ngày còn</span>
            <span className="text-base font-black text-emerald-600">3 giờ 30 phút</span>
          </div>
        </div>

        {/* B5: Where am I? (Breadcrumb Chain in Goal) */}
        <div className="mb-6 p-3.5 rounded-2xl border flex items-center gap-2 text-xs overflow-x-auto bg-slate-50/80 border-slate-200 text-slate-700 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
            Bạn đang ở đâu:
          </span>
          <div className="flex items-center gap-1.5 font-medium whitespace-nowrap">
            <span className={`font-bold ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`}>{linkedGoal?.name || 'Mục tiêu chính'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-600">{currentBlock?.milestoneName || 'Cột mốc thực thi'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-900 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
              {currentBlock?.title || 'Công việc hiện tại'} (Bước {currentBlock?.stepNumber || 3}/{currentBlock?.totalSteps || 5})
            </span>
          </div>
        </div>

        {/* Question 1: What am I doing right now? */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                isCool ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-[#E0401F]'
              }`}>1</span>
              <span>BẠN ĐANG LÀM GÌ NGAY LÚC NÀY?</span>
            </div>

            {/* B23: Task End Type Segmented Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
              <span className="text-[10px] text-slate-500 font-bold px-1.5">Cách kết thúc:</span>
              <button
                onClick={() => handleSetEndType('timebox')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  currentEndType === 'timebox'
                    ? isCool ? 'bg-blue-600 text-white shadow-xs' : 'bg-[#E0401F] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Hết giờ chuyển việc, đếm ngược theo khung giờ"
              >
                Đếm ngược
              </button>
              <button
                onClick={() => handleSetEndType('until_done_pausable')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  currentEndType === 'until_done_pausable'
                    ? isCool ? 'bg-blue-600 text-white shadow-xs' : 'bg-[#E0401F] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chạy đến khi đánh dấu xong, có thể tạm dừng"
              >
                Đến khi xong
              </button>
              <button
                onClick={() => handleSetEndType('until_done_atomic')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  currentEndType === 'until_done_atomic'
                    ? isCool ? 'bg-blue-600 text-white shadow-xs' : 'bg-[#E0401F] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Làm liền mạch: Không ngắt quãng, việc phát sinh sẽ xếp lịch sau"
              >
                Làm liền mạch
              </button>
            </div>
          </div>

          {/* A3.4: DoD Entry UI — visible only for until_done_* tasks, hidden for timebox */}
          {currentEndType !== 'timebox' && (
            <div className="mb-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {t('now.dod_input_label', 'Tiêu chí hoàn thành (không bắt buộc)')}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {(currentBlock?.dodChecklist || []).length} tiêu chí
                </span>
              </div>

              {(currentBlock?.dodChecklist || []).length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {(currentBlock?.dodChecklist || []).map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-800"
                    >
                      <span className="truncate">{item.text}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDodItem(item.id)}
                        className="text-slate-500 hover:text-red-500 p-0.5 rounded"
                        title="Xóa tiêu chí"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newDodText}
                  onChange={e => setNewDodText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDodItem(newDodText);
                    }
                  }}
                  placeholder={t('now.dod_input_placeholder', 'Mỗi dòng một tiêu chí, Enter để thêm dòng')}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleAddDodItem(newDodText)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/90 p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  isCool ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  TẬP TRUNG SÂU
                </span>
                <span className="text-xs text-slate-500 font-mono font-medium">
                  {currentBlock?.startTime || '14:00'} - {currentBlock?.endTime || '15:30'}
                </span>
                {currentEndType === 'until_done_atomic' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    <Lock className="w-3 h-3" />
                    Không làm phiền
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {currentBlock?.title || 'Hoàn thiện màn hình Bây giờ & Đồng hồ đếm ngược'}
              </h1>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang diễn ra
              </span>
            </div>
          </div>
        </div>

        {/* Question 2: Which big goal does it serve? */}
        <div className="mb-6">
          <div className="text-xs font-bold text-slate-600 flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">2</span>
            <span>PHỤC VỤ MỤC TIÊU LỚN NÀO?</span>
          </div>
          <div 
            onClick={() => {
              if (linkedGoal) {
                openDrilldown({
                  type: 'goal_tasks',
                  title: `Nhiệm vụ phục vụ: ${linkedGoal.name}`,
                  subtitle: `Tiến độ hiện tại: ${linkedGoal.progressPercent}% • Bấm để xem và xử lý các việc hôm nay`,
                  goalId: linkedGoal.id,
                });
              }
            }}
            className={`bg-slate-50/90 p-5 rounded-2xl border border-slate-200 shadow-xs transition-all ${
              linkedGoal ? 'cursor-pointer hover:border-slate-300 hover:bg-slate-100/60 group' : ''
            }`}
            title={linkedGoal ? 'Bấm để mở danh sách các việc hôm nay phục vụ mục tiêu này' : ''}
          >
            {linkedGoal ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isCool ? 'text-blue-600' : 'text-[#E0401F]'
                    }`} />
                    <span className="font-bold text-slate-900 text-sm sm:text-base">{linkedGoal.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`}>{linkedGoal.progressPercent}% hoàn thành</span>
                    <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-xs font-semibold">Chi tiết ↗</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  <span className="text-slate-500 font-medium">Kết quả đo lường: </span>
                  {linkedGoal.measurableResult}
                </p>
                {/* Progress bar (flat fill per D4/D5) */}
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
                    }`}
                    style={{ width: `${linkedGoal.progressPercent}%` }} 
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">
                Công việc này đang được phân loại "Ngoài mục tiêu lớn"
              </div>
            )}
          </div>
        </div>

        {/* Question 3: Clock direction & B19 v0.3.17 controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Timer Display */}
          <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {currentEndType === 'timebox' ? '3. THỜI GIAN CÒN LẠI:' : '3. THỜI GIAN ĐÃ CHẠY:'}
              </span>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                {currentEndType === 'timebox' ? `Khung giờ: ${profile.focusBlockDurationMins} phút` : `Giới hạn: ${userTimeLimit} phút`}
              </span>
            </div>

            {/* B19 v0.3.17: Circular Progress Ring + Single Lock Screen Switch + Android-only Device Timer */}
            {(() => {
              const activeMins = currentEndType === 'timebox' ? timerMinutesRemaining : elapsedMinutes;
              const { value, unitLabel } = formatClockDisplay(activeMins, secondsTick);
              const totalTargetMins = currentEndType === 'timebox'
                ? (profile.focusBlockDurationMins || 90)
                : (userTimeLimit || 60);
              const rawRatio = currentEndType === 'timebox'
                ? activeMins / Math.max(1, totalTargetMins)
                : (activeMins % Math.max(1, totalTargetMins)) / Math.max(1, totalTargetMins);
              const progressRatio = Math.max(0, Math.min(1, rawRatio));
              const radius = 58;
              const circumference = 2 * Math.PI * radius;
              const dashOffset = circumference * (1 - progressRatio);
              const isWarning = (currentEndType === 'timebox' && activeMins <= 0) || isOverTimeLimit;
              const strokeColor = isWarning ? '#F59E0B' : (isCool ? '#007AFF' : '#E0401F');

              const handleToggleLockScreenClock = async () => {
                if (!isNativePlatform) return;
                const next = !liveActivityActive;
                if (!next) {
                  setLiveActivityActive(false);
                  try {
                    window.localStorage.setItem('taio_lockscreen_clock_enabled', 'false');
                  } catch {}
                  await stopNativeLiveActivity();
                  showToast('Đã tắt đồng hồ trên màn hình khóa');
                  return;
                }

                setLiveActivityActive(true);
                try {
                  window.localStorage.setItem('taio_lockscreen_clock_enabled', 'true');
                } catch {}

                const res = await startNativeLiveActivity({
                  blockId: currentBlock?.id || 'now-block',
                  taskTitle: currentBlock?.title || 'Tập trung sâu',
                  goalName: linkedGoal?.name || 'Mục tiêu chính',
                  isCountDown: currentEndType === 'timebox',
                  totalMinutes: totalTargetMins,
                  remainingMinutes: activeMins,
                });

                if (!res.ok) {
                  // Reflect real result, not intention (spec D2.5)
                  setLiveActivityActive(false);
                  try {
                    window.localStorage.setItem('taio_lockscreen_clock_enabled', 'false');
                  } catch {}

                  if (res.error === 'live_activity_disabled_by_user') {
                    showToast(
                      'Hoạt động trực tiếp đã bị tắt trong Cài đặt iPhone',
                      () => { openNativeAppSettings(); },
                      'error',
                      'Mở Cài đặt'
                    );
                  } else {
                    showToast(res.message || res.error || 'Không thể bật đồng hồ màn hình khóa', undefined, 'error');
                  }
                } else {
                  showToast('Đồng hồ đang hiện trên màn hình khóa');
                }
              };

              return (
                <div className="py-3 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 136 136">
                      <circle
                        cx="68"
                        cy="68"
                        r={radius}
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="8"
                      />
                      <circle
                        cx="68"
                        cy="68"
                        r={radius}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        style={{ transition: 'stroke-dashoffset 300ms ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className={`text-2xl sm:text-3xl font-mono font-black tracking-tight ${
                        isWarning ? 'text-amber-600' : 'text-slate-900'
                      }`}>
                        {currentEndType !== 'timebox' ? `+${value}` : value}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        {unitLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2.5 text-center sm:text-left w-full">
                    <p className="text-xs font-semibold text-slate-700">
                      {currentEndType === 'timebox'
                        ? 'Đếm ngược trong khung thời gian'
                        : `Đếm xuôi tới giới hạn ${userTimeLimit} phút`}
                    </p>

                    {/* B19 v0.3.17: One switch replaces status chip & button ("Hiện đồng hồ trên màn hình khóa") */}
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            isNativePlatform ? 'text-slate-800' : 'text-slate-400'
                          }`}
                          title="Hiển thị đồng hồ đếm thời gian trực tiếp trên màn hình khóa (Live Activity / thông báo ghim)"
                        >
                          Hiện đồng hồ trên màn hình khóa
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isNativePlatform ? liveActivityActive : false}
                          disabled={!isNativePlatform}
                          onClick={handleToggleLockScreenClock}
                          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                            !isNativePlatform
                              ? 'bg-slate-200 cursor-not-allowed opacity-60'
                              : liveActivityActive
                                ? isCool
                                  ? 'bg-[#007AFF] cursor-pointer'
                                  : 'bg-[#E0401F] cursor-pointer'
                                : 'bg-slate-300 cursor-pointer'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                              isNativePlatform && liveActivityActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      {!isNativePlatform && (
                        <p className="text-[11px] text-slate-500 text-left">
                          Cần bản cài đặt trên điện thoại
                        </p>
                      )}
                    </div>

                    {/* B19 v0.3.17: "Dùng đồng hồ của máy" is Android only (hidden on iOS and web) */}
                    {isNativePlatform && nativePlatformName === 'android' && (
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            openNativeDeviceTimer(activeMins || 25, currentBlock?.title || 'Đồng hồ TAIO');
                            showToast('Đã mở đồng hồ hẹn giờ của máy.');
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs"
                        >
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Dùng đồng hồ của máy</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Overrun Notice for Until-Done Tasks */}
            {isOverTimeLimit && (
              <div className="my-2 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Quá giới hạn {userTimeLimit} phút của bạn; việc kế tiếp sẽ dời 20 phút.</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Bạn có toàn quyền quyết định: hoàn thành ngay, tiếp tục chạy, hoặc để lại làm tiếp sau.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleFinishEarly}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                  >
                    Đã xong
                  </button>
                  <button
                    onClick={() => {
                      handleAddExtraTime(30);
                      setShowOverrunNotice(false);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 shadow-xs"
                  >
                    Tiếp tục (+30 phút)
                  </button>
                  <button
                    onClick={handleFinishEarly}
                    className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs"
                  >
                    Để lại làm sau
                  </button>
                </div>
              </div>
            )}

            {/* B19 v0.3.17: Primary actions stay in one row: Tạm dừng · +15 phút · Đã xong */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={handleTimerToggle}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                  isTimerRunning 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isTimerRunning ? 'Tạm dừng' : 'Tiếp tục'}</span>
              </button>

              <button
                onClick={() => handleAddExtraTime(15)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 shadow-xs"
                title="Cộng thêm 15 phút"
              >
                +15 phút
              </button>

              <button
                onClick={handleFinishEarly}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                title="Đánh dấu hoàn thành công việc"
              >
                Đã xong
              </button>
            </div>
          </div>

          {/* Next Hard Deadline */}
          <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  HẠN CHÓT CỨNG KẾ TIẾP:
                </span>
                <span className="text-[11px] font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-0.5 rounded-full">
                  16:00
                </span>
              </div>

              {nextDeadline ? (
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 mt-2">
                    {nextDeadline.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Nguồn: {nextDeadline.source === 'calendar' ? 'Lịch công việc' : 'Cài thủ công'}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-3">Tiếp theo: 15:45 - Khung giờ dự phòng giải quyết phát sinh.</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono">
              <span>Còn khoảng 1 giờ 45 phút</span>
              <span className="text-emerald-600 font-bold">Đang đúng mắt xích</span>
            </div>
          </div>
        </div>

        {/* PROMINENT ACTION BUTTON: Conditional by Atomic vs Standard (flat fill, pure Vietnamese per D4/D5) */}
        <div className="pt-2">
          {currentEndType === 'until_done_atomic' ? (
            <div>
              <button
                onClick={handleScheduleForLater}
                className="w-full py-4 px-6 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] cursor-pointer"
              >
                <Calendar className="w-6 h-6 text-white" />
                <span>XẾP LỊCH VIỆC PHÁT SINH SAU</span>
              </button>
              <p className="text-center text-xs text-purple-600 mt-2.5">
                Khối làm liền mạch không ngắt quãng • Mọi việc phát sinh đều được xếp lịch làm sau
              </p>
            </div>
          ) : (
            <div>
              <button
                onClick={() => setInterruptionModalOpen(true)}
                className={`w-full py-4 px-6 rounded-2xl text-white font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] cursor-pointer ${
                  isCool
                    ? 'bg-[#007AFF] hover:bg-[#0066d6] shadow-blue-500/25'
                    : 'bg-[#E0401F] hover:bg-[#d03515] shadow-red-500/25'
                }`}
              >
                <Zap className="w-6 h-6 fill-white text-white" />
                <span>CÓ VIỆC PHÁT SINH!</span>
              </button>
              <p className="text-center text-xs text-slate-500 mt-2.5">
                Ghi nhận tức thì hoặc xem lại • Mặc định "Để sau" vào Rổ việc • 1 chạm
              </p>
            </div>
          )}
        </div>

      </div>

      {/* PRD FIX v0.3.30 Part E2: Free Timers & Standalone Stopwatch */}
      <div className="space-y-3">
        <FreeTimerInput
          activeCount={freeTimers.length}
          currentTaskTitle={currentBlock?.title}
          onAddTimer={addFreeTimer}
        />
        <FreeTimerList
          timers={freeTimers}
          onTogglePause={togglePauseFreeTimer}
          onAddSeconds={addFreeTimerSeconds}
          onFinishTimer={finishFreeTimer}
          onDeleteTimer={deleteFreeTimer}
          onRestartTimer={restartFreeTimer}
        />
      </div>

      {/* Quick Status Bar with WYSIWYG Drill-down */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Metric 1: Tasks completed */}
        <div 
          onClick={() => openDrilldown({
            type: 'tasks',
            title: `${totalCount} việc hôm nay (Khớp 100% với con số)`,
            subtitle: `${completedCount} đã xong • ${scheduleBlocks.filter(b => b.status === 'in_progress').length} đang chạy • ${scheduleBlocks.filter(b => b.status === 'planned').length} chưa đến giờ`,
          })}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-xs ${
            isCool 
              ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md' 
              : 'bg-white border-stone-200 hover:border-red-400 hover:shadow-md'
          }`}
          title="Bấm để mở danh sách toàn bộ việc hôm nay kèm trạng thái và 1 chạm: Xong, Dời, Bỏ"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Việc đã xong</p>
            <span className={`text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ${
              isCool ? 'text-blue-600' : 'text-[#E0401F]'
            }`}>Xem ↗</span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">
            {completedCount} / {totalCount} việc
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Bấm xem cả {totalCount} việc</p>
        </div>

        {/* Metric 2: Deep work minutes */}
        <div 
          onClick={() => openDrilldown({
            type: 'deep_work',
            title: 'Các khối việc sâu hôm nay',
            subtitle: `Tổng cộng ${deepWorkMinutes} phút tập trung chất lượng cao`,
          })}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-xs ${
            isCool 
              ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md' 
              : 'bg-white border-stone-200 hover:border-red-400 hover:shadow-md'
          }`}
          title="Bấm để mở danh sách các khối việc sâu và số phút của từng khối"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Phút việc sâu</p>
            <span className={`text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity ${
              isCool ? 'text-blue-600' : 'text-[#E0401F]'
            }`}>Xem ↗</span>
          </div>
          <p className={`text-xl font-black mt-1 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`}>
            {deepWorkMinutes} phút
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Bấm xem số phút từng khối</p>
        </div>

        {/* Metric 3: Interruption reserve */}
        <div 
          onClick={() => openDrilldown({
            type: 'interruptions',
            title: 'Nhật ký việc chen ngang & Quỹ dự phòng',
            subtitle: `Đã dùng ${intUsedMins} phút / ${profile.interruptionReserveMins} phút • Còn lại ${Math.max(0, profile.interruptionReserveMins - intUsedMins)} phút`,
          })}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-xs ${
            isCool 
              ? 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md' 
              : 'bg-white border-stone-200 hover:border-amber-400 hover:shadow-md'
          }`}
          title="Bấm để xem nhật ký chen ngang"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Quỹ chen ngang</p>
            <span className="text-[10px] font-bold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
          </div>
          <p className="text-xl font-black text-amber-600 mt-1">
            {intUsedMins} / {profile.interruptionReserveMins} phút
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Còn {Math.max(0, profile.interruptionReserveMins - intUsedMins)} phút • Xem chi tiết</p>
        </div>

        {/* Metric 4: Protected minutes */}
        <div 
          onClick={() => openDrilldown({
            type: 'protected_focus',
            title: `Thời gian tập trung đã bảo vệ (+${protectedMins} phút)`,
            subtitle: 'Đạt được từ các việc từ chối hoặc giao việc đúng lúc',
          })}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-xs ${
            isCool 
              ? 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md' 
              : 'bg-white border-stone-200 hover:border-emerald-400 hover:shadow-md'
          }`}
          title="Bấm để xem danh sách các việc đã từ chối/ủy quyền"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 group-hover:text-emerald-700">Đã bảo vệ</p>
            <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
          </div>
          <p className="text-xl font-extrabold text-emerald-400 mt-1">
            +{protectedMins} phút
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Bấm xem việc đã từ chối</p>
        </div>
      </div>

    </div>
  );
};
