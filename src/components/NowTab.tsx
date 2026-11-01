'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
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
  Compass, 
  FileText,
  Sparkles,
  ExternalLink,
  UserCheck,
  ChevronRight,
  AlertTriangle
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
    backToPlan
  } = useApp();

  const linkedGoal = goals.find(g => g.id === currentBlock?.goalId);
  const nextDeadline = deadlines[0];

  const completedCount = blocks.filter(b => b.status === 'done').length;
  const totalCount = blocks.length;
  const deepWorkMinutes = blocks.filter(b => b.type === 'deep' && b.status === 'done').length * profile.focusBlockDurationMins || 150;
  
  const intUsedMins = interruptions
    .filter(i => i.decision === 'do_now')
    .reduce((acc, curr) => acc + curr.minutes, 0);

  const protectedMins = interruptions
    .filter(i => i.decision === 'decline' || i.decision === 'delegate')
    .reduce((acc, curr) => acc + curr.minutes, 0);

  // Helper tone phrasing
  const getPromptToneText = () => {
    if (toneLevel === 1) return 'Khối tập trung đang diễn ra êm đềm. Hãy thoải mái duy trì dòng chảy.';
    if (toneLevel === 2) return 'Nhiệm vụ đang diễn ra. Tập trung hoàn thành đúng khung giờ đã định.';
    if (toneLevel === 3) return 'Đang chạy đồng hồ! Hạn chót kế tiếp cần hoàn thành đúng cam kết.';
    return 'Hệ thống tự động đồng bộ nhịp độ làm việc của bạn.';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Off-Plan State Banner (PRD v0.8 B5) */}
      {isOffPlan && (
        <div className="bg-rose-950/60 border border-rose-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white shadow-xl animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                  Đang lệch kế hoạch (Off-Plan State - B5)
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] bg-rose-900/80 text-rose-200 border border-rose-700/50">
                  {offPlanMinutes} phút trễ
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-100 mt-1">
                Lệch kế hoạch: 1 h 19 min sau giờ nghỉ ngơi (22:30). Mắt xích kế tiếp: Giấc ngủ lúc 22:30.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => setInterruptionModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-200"
            >
              Ghi nhận là...
            </button>
            <button
              onClick={backToPlan}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30"
            >
              Quay lại kế hoạch
            </button>
          </div>
        </div>
      )}

      {/* Soft Nudge Proactive Banner (PRD B8) */}
      {nextDeadline && !isOffPlan && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-xs sm:text-sm animate-pulse-slow">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <Bell className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-amber-300">Nhắc nhở nhẹ (Soft nudge): </span>
              <span className="text-gray-200">
                Sắp đến hạn "{nextDeadline.title}" lúc {nextDeadline.time}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => alert('Đã hoãn nhắc nhở thêm 5 phút (Snooze 5 min)')}
              className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-medium"
            >
              Hoãn 5p
            </button>
            <button 
              onClick={() => alert('Sẵn sàng cho mốc kế tiếp!')}
              className="px-2.5 py-1 rounded bg-amber-500 text-black hover:bg-amber-400 text-xs font-semibold"
            >
              Chuẩn bị
            </button>
          </div>
        </div>
      )}

      {/* Return Point Prompt if returning from interruption (PRD B5) */}
      {activeReturnPoint && !isOffPlan && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
                Điểm quay lại của bạn (Return Point):
              </span>
              <span className="text-[10px] text-gray-400">Đã lưu từ lúc có việc gián đoạn</span>
            </div>
            <p className="text-sm text-gray-100 font-medium mt-1">
              "{activeReturnPoint}"
            </p>
          </div>
        </div>
      )}

      {/* Master Card: Who am I? Where am I? What am I doing? (PRD v0.8 B5) */}
      <div className="bg-[#121620] border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Role Selector (Who am I?) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400">
              Trọng tâm hiện tại (Bây giờ - Now)
            </h2>
            
            {/* Role Chip (PRD B5: Who am I right now?) */}
            <div className="flex items-center gap-1.5 ml-2 bg-indigo-950/80 border border-indigo-500/40 rounded-full px-2.5 py-1">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] text-gray-400">Vai trò:</span>
              <select
                value={currentUserRole}
                onChange={e => setCurrentUserRole(e.target.value as UserRole)}
                className="bg-transparent text-xs font-bold text-indigo-300 focus:outline-none cursor-pointer pr-1"
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-gray-900 text-gray-200">
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleOffPlan}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                isOffPlan 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                  : 'bg-gray-900 text-gray-400 hover:text-white border-gray-800'
              }`}
            >
              {isOffPlan ? '● Trạng thái Lệch' : 'Giả lập Lệch kế hoạch'}
            </button>
            <span className="text-xs text-indigo-400 font-medium hidden md:inline">
              {getPromptToneText()}
            </span>
          </div>
        </div>

        {/* B5: Where am I? (Breadcrumb Chain in Goal) */}
        <div className="mb-5 p-3 rounded-xl bg-gray-900/60 border border-gray-800/80 flex items-center gap-2 text-xs overflow-x-auto">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
            Bạn đang ở đâu (Where am I):
          </span>
          <div className="flex items-center gap-1.5 text-gray-300 font-medium whitespace-nowrap">
            <span className="text-indigo-400 font-semibold">{linkedGoal?.name || 'Mục tiêu chính'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
            <span className="text-gray-300">{currentBlock?.milestoneName || 'Cột mốc thực thi'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
            <span className="text-white font-bold bg-indigo-900/50 px-2 py-0.5 rounded border border-indigo-700/40">
              {currentBlock?.title || 'Công việc hiện tại'} (Bước {currentBlock?.stepNumber || 3}/{currentBlock?.totalSteps || 5})
            </span>
          </div>
        </div>

        {/* Question 1: What am I doing right now? */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mb-1.5">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">1</span>
            <span>BẠN ĐANG LÀM GÌ NGAY LÚC NÀY?</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-900/80 p-4 rounded-xl border border-gray-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  TẬP TRUNG SÂU (DEEP WORK)
                </span>
                <span className="text-xs text-gray-400">
                  {currentBlock?.startTime || '14:00'} - {currentBlock?.endTime || '15:30'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                {currentBlock?.title || 'Phát triển màn hình Now & cơ chế Interruption Card'}
              </h1>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Đang diễn ra
              </span>
            </div>
          </div>
        </div>

        {/* Question 2: Which big goal does it serve? (Clickable WYSIWYG) */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mb-1.5">
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
            className={`bg-gray-900/80 p-4 rounded-xl border border-gray-800 transition-all ${
              linkedGoal ? 'cursor-pointer hover:border-indigo-500/50 hover:bg-gray-900 group' : ''
            }`}
            title={linkedGoal ? 'Bấm để mở danh sách các việc hôm nay phục vụ mục tiêu này (WYSIWYG)' : ''}
          >
            {linkedGoal ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-white text-sm sm:text-base group-hover:text-indigo-300 transition-colors">{linkedGoal.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400">{linkedGoal.progressPercent}% hoàn thành</span>
                    <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded group-hover:text-gray-300">Chi tiết ↗</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  <span className="text-gray-300 font-medium">Kết quả đo lường: </span>
                  {linkedGoal.measurableResult}
                </p>
                {/* Progress bar */}
                <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500 group-hover:bg-indigo-400" 
                    style={{ width: `${linkedGoal.progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                  <span>Hạn chót: {linkedGoal.deadline}</span>
                  <span className="text-indigo-400 font-medium">Bấm vào để xem các việc phục vụ mục tiêu này</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic">
                Nhiệm vụ này được đánh dấu "Ngoài mục tiêu chính" (Outside my goals)
              </div>
            )}
          </div>
        </div>

        {/* Question 3: Next hard deadline & Countdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Minutes Remaining Timer */}
          <div className="bg-gradient-to-br from-gray-900 to-[#161a26] p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">3A</span>
                <span>THỜI GIAN CÒN LẠI CỦA KHỐI NÀY</span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {timerMinutesRemaining}
                </span>
                <span className="text-sm font-semibold text-gray-400">phút còn lại</span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-800/80">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isTimerRunning ? 'bg-amber-600/20 text-amber-300 hover:bg-amber-600/30' : 'bg-emerald-600 text-white'
                }`}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isTimerRunning ? 'Tạm dừng' : 'Tiếp tục'}</span>
              </button>
              
              <button
                onClick={() => setTimerMinutesRemaining(prev => prev + 15)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs"
                title="Gia hạn thêm 15 phút"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+15p</span>
              </button>

              <button
                onClick={() => {
                  if (currentBlock) {
                    setCheckInBlock(currentBlock);
                    setCheckInModalOpen(true);
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium ml-auto"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Xong sớm</span>
              </button>
            </div>
          </div>

          {/* Next Hard Deadline / Next link in chain (PRD B5) */}
          <div className="bg-gradient-to-br from-gray-900 to-[#161a26] p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 text-xs flex items-center justify-center font-bold">3B</span>
                <span>MẮT XÍCH KẾ TIẾP TRONG CHUỖI (NEXT LINK)</span>
              </div>

              {nextDeadline ? (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {nextDeadline.time}
                    </span>
                    <span className="text-xs text-gray-400">
                      Hạn chót cứng • {nextDeadline.source === 'calendar' ? 'Lịch' : 'Cài thủ công'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-2">
                    {nextDeadline.title}
                  </h4>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-3">Tiếp theo: 15:45 - Khung giờ dự phòng giải quyết phát sinh.</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
              <span>Còn khoảng 1 giờ 45 phút</span>
              <span className="text-emerald-400 font-medium">Đang đúng mắt xích</span>
            </div>
          </div>
        </div>

        {/* BIG Prominent Action Button: SOMETHING CAME UP (PRD B5) */}
        <div className="pt-2">
          <button
            onClick={() => setInterruptionModalOpen(true)}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-black font-extrabold text-base sm:text-lg shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] cursor-pointer"
          >
            <Zap className="w-6 h-6 fill-black" />
            <span>CÓ VIỆC ĐỘT XUẤT! (SOMETHING CAME UP)</span>
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            2 trường nhận diện (Việc gì & Ai kéo vào) • Lưu điểm quay lại • Quyết định dưới 3 chạm
          </p>
        </div>

      </div>

      {/* Quick Status Bar with WYSIWYG Drill-down */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Tasks completed */}
        <div 
          onClick={() => openDrilldown({
            type: 'tasks',
            title: `${totalCount} việc hôm nay (Khớp 100% với con số)`,
            subtitle: `${completedCount} đã xong • ${blocks.filter(b => b.status === 'in_progress').length} đang chạy • ${blocks.filter(b => b.status === 'planned').length} chưa đến giờ`,
          })}
          className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-500/60 hover:bg-gray-800/80 transition-all cursor-pointer group shadow-sm"
          title="Bấm để mở danh sách 5 việc hôm nay kèm trạng thái và 1 chạm: Xong, Dời, Bỏ"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-400 group-hover:text-indigo-300">Việc đã xong</p>
            <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
          </div>
          <p className="text-lg font-bold text-white mt-0.5 group-hover:text-indigo-400 transition-colors">
            {completedCount} / {totalCount} việc
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">Bấm xem chi tiết cả {totalCount} việc</p>
        </div>

        {/* Metric 2: Deep work minutes */}
        <div 
          onClick={() => openDrilldown({
            type: 'deep_work',
            title: 'Các khối việc sâu hôm nay (Deep Work)',
            subtitle: `Tổng cộng ${deepWorkMinutes} phút tập trung chất lượng cao`,
          })}
          className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-500/60 hover:bg-gray-800/80 transition-all cursor-pointer group shadow-sm"
          title="Bấm để mở danh sách các khối việc sâu và số phút của từng khối"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-400 group-hover:text-indigo-300">Phút việc sâu</p>
            <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
          </div>
          <p className="text-lg font-bold text-indigo-400 mt-0.5">
            {deepWorkMinutes} phút
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">Bấm xem số phút từng khối</p>
        </div>

        {/* Metric 3: Interruption reserve */}
        <div 
          onClick={() => openDrilldown({
            type: 'interruptions',
            title: 'Nhật ký việc chen ngang & Quỹ dự phòng',
            subtitle: `Đã dùng ${intUsedMins}p / ${profile.interruptionReserveMins}p • Còn lại ${Math.max(0, profile.interruptionReserveMins - intUsedMins)} phút`,
          })}
          className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-amber-500/60 hover:bg-gray-800/80 transition-all cursor-pointer group shadow-sm"
          title="Bấm để xem nhật ký chen ngang, loại việc và người kéo bạn vào"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-400 group-hover:text-amber-300">Quỹ chen ngang</p>
            <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
          </div>
          <p className="text-lg font-bold text-amber-400 mt-0.5">
            {intUsedMins} / {profile.interruptionReserveMins}p
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">Còn {Math.max(0, profile.interruptionReserveMins - intUsedMins)}p • Xem người kéo vào</p>
        </div>

        {/* Metric 4: Protected minutes */}
        <div 
          onClick={() => openDrilldown({
            type: 'protected_focus',
            title: 'Thời gian tập trung đã bảo vệ (+45p)',
            subtitle: 'Đạt được từ các việc từ chối hoặc ủy quyền đúng lúc',
          })}
          className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-emerald-500/60 hover:bg-gray-800/80 transition-all cursor-pointer group shadow-sm"
          title="Bấm để xem danh sách các việc đã từ chối/ủy quyền giúp bảo vệ thời gian"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-400 group-hover:text-emerald-300">Đã bảo vệ</p>
            <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
          </div>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">
            +{protectedMins} phút
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">Bấm xem các việc đã từ chối</p>
        </div>
      </div>

    </div>
  );
};
