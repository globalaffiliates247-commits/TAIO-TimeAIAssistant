'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, TaskEndType } from '../types';
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
  Inbox
} from 'lucide-react';

const ROLE_LABELS: Record<UserRole, { label: string; type: 'work' | 'personal' }> = {
  'decision-maker': { label: 'Người ra quyết định (Decision-maker)', type: 'work' },
  'operator': { label: 'Người vận hành (Operator)', type: 'work' },
  'seller': { label: 'Bán hàng / Đàm phán (Seller)', type: 'work' },
  'self': { label: 'Bản thân (Self)', type: 'personal' },
  'family': { label: 'Gia đình (Family)', type: 'personal' },
  'friend': { label: 'Bạn bè (Friend)', type: 'personal' },
};

export const NowTab: React.FC = () => {
  const { 
    currentBlock, 
    setBlocks,
    blocks,
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
    currentPaletteColors
  } = useApp();

  const isCool = palette === 'cool';

  const linkedGoal = goals.find(g => g.id === currentBlock?.goalId);
  const nextDeadline = deadlines[0];

  // B23 Task End Type: 'timebox' | 'until_done_pausable' | 'until_done_atomic'
  const currentEndType: TaskEndType = currentBlock?.taskEndType || 'timebox';
  const userTimeLimit: number = currentBlock?.timeLimitMins || currentBlock?.estimatedMinutes || 90;

  // Elapsed minutes for until-done tasks (counts up)
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(35);
  const [showOverrunNotice, setShowOverrunNotice] = useState<boolean>(false);

  // Check overrun for until-done tasks
  const isOverTimeLimit = (currentEndType !== 'timebox') && (elapsedMinutes > userTimeLimit);

  // Quick switch of end type for current block
  const handleSetEndType = (endType: TaskEndType) => {
    if (!currentBlock) return;
    setBlocks(prev => prev.map(b => b.id === currentBlock.id ? { ...b, taskEndType: endType } : b));
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

  // Stats calculation
  const totalCount = blocks.length;
  const completedCount = blocks.filter(b => b.status === 'done').length;
  const deepWorkMinutes = blocks
    .filter(b => b.status === 'done' && b.type === 'deep')
    .length * profile.focusBlockDurationMins || 150;

  const intUsedMins = interruptions
    .filter(i => i.decision === 'do_now')
    .reduce((acc, curr) => acc + curr.minutes, 0);

  const protectedMins = interruptions
    .filter(i => i.decision === 'decline' || i.decision === 'delegate')
    .reduce((acc, curr) => acc + curr.minutes, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* Off-plan Warning Banner (PRD v0.8 B5) */}
      {isOffPlan && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-300">Đang ngoài kế hoạch (Off-plan: {offPlanMinutes} phút)</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Bạn đang lệch mốc dự kiến {offPlanMinutes} phút. Hãy đưa ra 1 lựa chọn nhanh:
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setInterruptionModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
            >
              Ghi nhận việc này
            </button>
            <button
              onClick={backToPlan}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#E0401F] to-orange-500 text-xs font-bold text-white shadow-md shadow-red-500/25"
            >
              Quay lại kế hoạch
            </button>
          </div>
        </div>
      )}

      {/* Return Point Prompt if returning from interruption (PRD B5) */}
      {activeReturnPoint && !isOffPlan && (
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-xl backdrop-blur-xl">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Điểm quay lại của bạn (Return Point):
              </span>
              <span className="text-[11px] text-slate-400">Đã lưu từ lúc có việc phát sinh</span>
            </div>
            <p className="text-sm text-slate-100 font-medium mt-1">
              "{activeReturnPoint}"
            </p>
          </div>
        </div>
      )}

      {/* Master Card: Who am I? Where am I? What am I doing? (PRD v0.8 B5 & v0.22 B19/B23) */}
      <div className={`rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all border ${
        isCool ? 'bg-white border-slate-200 text-slate-800' : 'bg-white border-stone-200 text-stone-900'
      }`}>
        {/* Subtle accent glow */}
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-10 ${
          isCool ? 'bg-blue-500' : 'bg-red-500'
        }`} />

        {/* Top Header & Role Selector (Who am I?) */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 mb-6 ${
          isCool ? 'border-slate-100' : 'border-stone-100'
        }`}>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
              Trọng tâm hiện tại (Bây giờ - Now)
            </h2>
            
            {/* Role Chip (PRD B5: Who am I right now?) */}
            <div className="flex items-center gap-1.5 ml-1 bg-slate-100 border border-slate-200/80 rounded-full px-3 py-1">
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
              Nhịp làm: <strong className={`capitalize ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`}>{profile.workStyle || 'mixed'}</strong>
            </span>
            <button
              onClick={toggleOffPlan}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all font-semibold ${
                isOffPlan 
                  ? 'bg-rose-50 text-rose-600 border-rose-200 font-bold' 
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
            >
              {isOffPlan ? '● Đang Lệch kế hoạch' : 'Giả lập Lệch kế hoạch'}
            </button>
          </div>
        </div>

        {/* B19: Always visible 4-Number Time Ledger Glance */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6 p-3.5 rounded-2xl border text-xs ${
          isCool ? 'bg-slate-50/80 border-slate-200/80' : 'bg-stone-50/80 border-stone-200/80'
        }`}>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">1. Việc mục tiêu</span>
            <span className={`text-sm font-black ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`}>285 phút</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">2. Chen ngang</span>
            <span className="text-sm font-black text-amber-600">{intUsedMins} / {profile.interruptionReserveMins}p</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">3. Xao nhãng (v0.3.9)</span>
            <span className="text-sm font-black text-rose-600">45 phút</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">4. Thời gian ngày còn</span>
            <span className="text-sm font-black text-emerald-600">3 giờ 30 phút</span>
          </div>
        </div>

        {/* B5: Where am I? (Breadcrumb Chain in Goal) */}
        <div className={`mb-6 p-3.5 rounded-2xl border flex items-center gap-2 text-xs overflow-x-auto ${
          isCool ? 'bg-blue-50/40 border-blue-100 text-slate-700' : 'bg-amber-50/40 border-amber-100 text-stone-700'
        }`}>
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
            <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-500/15 text-red-400 text-xs flex items-center justify-center font-bold">1</span>
              <span>BẠN ĐANG LÀM GÌ NGAY LÚC NÀY?</span>
            </div>

            {/* B23: Task End Type Segmented Selector */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700/70 self-start sm:self-auto">
              <span className="text-[10px] text-slate-400 font-bold px-1.5">Cách kết thúc:</span>
              <button
                onClick={() => handleSetEndType('timebox')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  currentEndType === 'timebox'
                    ? 'bg-gradient-to-r from-[#E0401F] to-orange-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Hết giờ chuyển việc, bất kể xong 80% hay 100% (Đếm ngược)"
              >
                Timebox (Đếm ngược)
              </button>
              <button
                onClick={() => handleSetEndType('until_done_pausable')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  currentEndType === 'until_done_pausable'
                    ? 'bg-gradient-to-r from-[#E0401F] to-orange-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Chạy đến khi đánh dấu xong, có thể tạm dừng (Đếm tiến)"
              >
                Đến khi xong (Pausable)
              </button>
              <button
                onClick={() => handleSetEndType('until_done_atomic')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  currentEndType === 'until_done_atomic'
                    ? 'bg-gradient-to-r from-[#E0401F] to-orange-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Khối nguyên tử: Không thể ngắt quãng, chỉ xếp lịch việc phát sinh sau"
              >
                Nguyên tử (Atomic)
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-md">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                  TẬP TRUNG SÂU (DEEP WORK)
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentBlock?.startTime || '14:00'} - {currentBlock?.endTime || '15:30'}
                </span>
                {currentEndType === 'until_done_atomic' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/50">
                    <Lock className="w-3 h-3" />
                    Không làm phiền (Atomic block)
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white">
                {currentBlock?.title || 'Phát triển màn hình Now & cơ chế Interruption Card'}
              </h1>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Đang diễn ra
              </span>
            </div>
          </div>
        </div>

        {/* Question 2: Which big goal does it serve? */}
        <div className="mb-6">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
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
            className={`bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-md transition-all ${
              linkedGoal ? 'cursor-pointer hover:border-red-500/50 hover:bg-slate-800 group' : ''
            }`}
            title={linkedGoal ? 'Bấm để mở danh sách các việc hôm nay phục vụ mục tiêu này (WYSIWYG)' : ''}
          >
            {linkedGoal ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-white text-sm sm:text-base group-hover:text-red-300 transition-colors">{linkedGoal.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-400">{linkedGoal.progressPercent}% hoàn thành</span>
                    <span className="text-[10px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">Chi tiết ↗</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300">
                  <span className="text-slate-400 font-medium">Kết quả đo lường: </span>
                  {linkedGoal.measurableResult}
                </p>
                {/* Progress bar */}
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-[#E0401F] to-orange-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${linkedGoal.progressPercent}%` }} 
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Công việc này đang được phân loại "Ngoài mục tiêu lớn"
              </div>
            )}
          </div>
        </div>

        {/* Question 3: Clock direction follows B19 / B23 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Timer Display */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {currentEndType === 'timebox' ? '3. THỜI GIAN CÒN LẠI (TIMEBOX):' : '3. THỜI GIAN ĐÃ CHẠY (UNTIL DONE):'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {currentEndType === 'timebox' ? `Hộp: ${profile.focusBlockDurationMins}p` : `Giới hạn: ${userTimeLimit}p`}
              </span>
            </div>

            {/* Timer Output */}
            {currentEndType === 'timebox' ? (
              // Case A: Timebox counts down
              <div className="py-2 flex items-baseline gap-3">
                <span className="text-5xl font-mono font-extrabold text-white tracking-tight">
                  {timerMinutesRemaining}
                </span>
                <span className="text-lg text-slate-400 font-bold">phút đếm ngược</span>
              </div>
            ) : (
              // Case B: Until done counts UP (elapsed) with faint marker at user limit
              <div className="py-2 space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className={`text-5xl font-mono font-extrabold tracking-tight ${isOverTimeLimit ? 'text-amber-400' : 'text-white'}`}>
                    +{elapsedMinutes}
                  </span>
                  <span className="text-lg text-slate-400 font-bold">phút trôi qua</span>
                </div>
                {/* Visual marker at user appetite limit */}
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 relative">
                  <div 
                    className={`h-full rounded-full transition-all ${isOverTimeLimit ? 'bg-amber-400' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
                    style={{ width: `${Math.min(100, (elapsedMinutes / userTimeLimit) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Mốc giới hạn khẩu vị: <strong>{userTimeLimit} phút</strong></span>
                  <span className={isOverTimeLimit ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {isOverTimeLimit ? `Đã quá ${elapsedMinutes - userTimeLimit}p` : `Còn ${userTimeLimit - elapsedMinutes}p trong hạn`}
                  </span>
                </div>
              </div>
            )}

            {/* Overrun Notice for Until-Done Tasks (PRD v0.22 B19 / B23) */}
            {isOverTimeLimit && (
              <div className="my-2 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Quá giới hạn {userTimeLimit} phút của bạn; việc kế tiếp sẽ dời 20 phút.</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Bạn có toàn quyền quyết định: hoàn thành ngay, tiếp tục chạy, hoặc để lại làm tiếp sau.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleFinishEarly}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Hoàn thành
                  </button>
                  <button
                    onClick={() => {
                      handleAddExtraTime(30);
                      setShowOverrunNotice(false);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
                  >
                    Tiếp tục (+30p)
                  </button>
                  <button
                    onClick={handleFinishEarly}
                    className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                  >
                    Để lại làm sau
                  </button>
                </div>
              </div>
            )}

            {/* Quick Timer Controls */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-700/60">
              <button
                onClick={handleTimerToggle}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  isTimerRunning 
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25' 
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                }`}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isTimerRunning ? 'Tạm dừng' : 'Bắt đầu đếm'}</span>
              </button>

              <button
                onClick={() => handleAddExtraTime(15)}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
                title="Cộng thêm 15 phút"
              >
                +15p
              </button>

              <button
                onClick={handleFinishEarly}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-emerald-950 text-emerald-400 text-xs font-bold border border-emerald-500/30"
                title="Check-in đạt tiêu chí (DoD)"
              >
                Hoàn thành
              </button>
            </div>
          </div>

          {/* Next Hard Deadline */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  HẠN CHÓT CỨNG KẾ TIẾP:
                </span>
                <span className="text-[11px] font-bold text-red-400 bg-red-500/15 border border-red-500/25 px-2 py-0.5 rounded-full">
                  16:00
                </span>
              </div>

              {nextDeadline ? (
                <div>
                  <h4 className="text-base font-extrabold text-white mt-2">
                    {nextDeadline.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Nguồn: {nextDeadline.source === 'calendar' ? 'Lịch công việc' : 'Cài thủ công'}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-3">Tiếp theo: 15:45 - Khung giờ dự phòng giải quyết phát sinh.</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Còn khoảng 1 giờ 45 phút</span>
              <span className="text-emerald-400 font-bold">Đang đúng mắt xích</span>
            </div>
          </div>
        </div>

        {/* PROMINENT ACTION BUTTON: Conditional by Atomic vs Standard (B19/B23) */}
        <div className="pt-2">
          {currentEndType === 'until_done_atomic' ? (
            // For Atomic Tasks: Replaces "Something came up" with "Schedule it for later"!
            <div>
              <button
                onClick={handleScheduleForLater}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-black text-base sm:text-lg shadow-lg shadow-purple-900/20 flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] cursor-pointer"
              >
                <Calendar className="w-6 h-6" />
                <span>XẾP LỊCH VIỆC PHÁT SINH SAU (SCHEDULE FOR LATER)</span>
              </button>
              <p className="text-center text-xs text-purple-600 mt-2.5">
                Khối nguyên tử (Atomic) không thể ngắt quãng • Mọi việc phát sinh đều được xếp lịch làm sau
              </p>
            </div>
          ) : (
            // Standard: SOMETHING CAME UP
            <div>
              <button
                onClick={() => setInterruptionModalOpen(true)}
                className={`w-full py-4 px-6 rounded-2xl text-white font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] cursor-pointer ${
                  isCool
                    ? 'bg-[#007AFF] hover:bg-[#0066d6] shadow-blue-500/25'
                    : 'bg-[#E0401F] hover:bg-[#d03515] shadow-red-500/25'
                }`}
              >
                <Zap className="w-6 h-6 fill-white" />
                <span>CÓ VIỆC PHÁT SINH! (SOMETHING CAME UP)</span>
              </button>
              <p className="text-center text-xs text-slate-500 mt-2.5">
                PRD v0.3.9: 2 tình huống (Tức thì vs Xem lại) • Mặc định "Để sau" vào Rổ việc • 1 chạm
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Quick Status Bar with WYSIWYG Drill-down */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Metric 1: Tasks completed */}
        <div 
          onClick={() => openDrilldown({
            type: 'tasks',
            title: `${totalCount} việc hôm nay (Khớp 100% với con số)`,
            subtitle: `${completedCount} đã xong • ${blocks.filter(b => b.status === 'in_progress').length} đang chạy • ${blocks.filter(b => b.status === 'planned').length} chưa đến giờ`,
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
            title: 'Các khối việc sâu hôm nay (Deep Work)',
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
            subtitle: `Đã dùng ${intUsedMins}p / ${profile.interruptionReserveMins}p • Còn lại ${Math.max(0, profile.interruptionReserveMins - intUsedMins)} phút`,
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
            {intUsedMins} / {profile.interruptionReserveMins}p
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Còn {Math.max(0, profile.interruptionReserveMins - intUsedMins)}p • Xem chi tiết</p>
        </div>

        {/* Metric 4: Protected minutes */}
        <div 
          onClick={() => openDrilldown({
            type: 'protected_focus',
            title: 'Thời gian tập trung đã bảo vệ (+45p)',
            subtitle: 'Đạt được từ các việc từ chối hoặc ủy quyền đúng lúc',
          })}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group shadow-xs ${
            isCool 
              ? 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md' 
              : 'bg-white border-stone-200 hover:border-emerald-400 hover:shadow-md'
          }`}
          title="Bấm để xem danh sách các việc đã từ chối/ủy quyền"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 group-hover:text-emerald-300">Đã bảo vệ</p>
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
