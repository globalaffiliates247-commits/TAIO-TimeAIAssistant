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
  Sparkles, 
  UserCheck, 
  ChevronRight, 
  AlertTriangle,
  Flame,
  ShieldCheck
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

  const handleTimerToggle = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleAddExtraTime = (mins: number) => {
    setTimerMinutesRemaining(prev => prev + mins);
  };

  const handleFinishEarly = () => {
    if (currentBlock) {
      setCheckInBlock(currentBlock);
      setCheckInModalOpen(true);
    }
  };

  const getPromptToneText = () => {
    if (toneLevel === 1) return 'Khối tập trung đang diễn ra êm đềm. Hãy duy trì dòng chảy.';
    if (toneLevel === 2) return 'Đang tập trung. Giữ đúng tiến độ đến khi kết thúc khối.';
    return 'Khối việc có hạn chót quan trọng. Tập trung tuyệt đối, hạn chế xao nhãng.';
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

      {/* Soft Nudge Proactive Banner (PRD B8) */}
      {nextDeadline && !isOffPlan && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs sm:text-sm shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <Bell className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300">Nhắc nhở nhẹ (Soft nudge): </span>
              <span className="text-slate-200">
                Sắp đến hạn "{nextDeadline.title}" lúc {nextDeadline.time}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => alert('Đã hoãn nhắc nhở thêm 5 phút')}
              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
            >
              Hoãn 5p
            </button>
            <button 
              onClick={() => alert('Sẵn sàng cho mốc kế tiếp!')}
              className="px-3.5 py-1 rounded-xl bg-[#E0401F] text-white hover:bg-[#d03515] text-xs font-bold shadow-md shadow-red-500/20"
            >
              Chuẩn bị
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

      {/* Master Card: Who am I? Where am I? What am I doing? (PRD v0.8 B5) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Role Selector (Who am I?) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
              Trọng tâm hiện tại (Bây giờ - Now)
            </h2>
            
            {/* Role Chip (PRD B5: Who am I right now?) */}
            <div className="flex items-center gap-1.5 ml-1 bg-slate-800/80 border border-slate-700/60 rounded-full px-3 py-1">
              <UserCheck className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[11px] text-slate-400">Vai trò:</span>
              <select
                value={currentUserRole}
                onChange={e => setCurrentUserRole(e.target.value as UserRole)}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-slate-900 text-slate-200">
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleOffPlan}
              className={`text-xs px-3 py-1.5 rounded-xl border transition-all font-medium ${
                isOffPlan 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold' 
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700'
              }`}
            >
              {isOffPlan ? '● Đang Lệch kế hoạch' : 'Giả lập Lệch kế hoạch'}
            </button>
          </div>
        </div>

        {/* B5: Where am I? (Breadcrumb Chain in Goal) */}
        <div className="mb-6 p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-center gap-2 text-xs overflow-x-auto shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Bạn đang ở đâu:
          </span>
          <div className="flex items-center gap-1.5 text-slate-300 font-medium whitespace-nowrap">
            <span className="text-red-400 font-bold">{linkedGoal?.name || 'Mục tiêu chính'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="text-slate-200">{currentBlock?.milestoneName || 'Cột mốc thực thi'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="text-white font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
              {currentBlock?.title || 'Công việc hiện tại'} (Bước {currentBlock?.stepNumber || 3}/{currentBlock?.totalSteps || 5})
            </span>
          </div>
        </div>

        {/* Question 1: What am I doing right now? */}
        <div className="mb-6">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-red-500/15 text-red-400 text-xs flex items-center justify-center font-bold">1</span>
            <span>BẠN ĐANG LÀM GÌ NGAY LÚC NÀY?</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                  TẬP TRUNG SÂU (DEEP WORK)
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentBlock?.startTime || '14:00'} - {currentBlock?.endTime || '15:30'}
                </span>
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

        {/* Question 2: Which big goal does it serve? (Clickable WYSIWYG) */}
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
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
                  <span>Hạn chót: {linkedGoal.deadline}</span>
                  <span className="text-red-400 font-medium">Bấm xem danh sách việc ↗</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Công việc này đang được phân loại "Ngoài mục tiêu lớn"
              </div>
            )}
          </div>
        </div>

        {/* Question 3: Countdown Timer & Next Hard Deadline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Remaining minutes */}
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                3. THỜI GIAN CÒN LẠI CỦA KHỐI NÀY:
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Mục tiêu: {profile.focusBlockDurationMins}p
              </span>
            </div>

            <div className="py-2 flex items-baseline gap-3">
              <span className="text-5xl font-mono font-extrabold text-white tracking-tight">
                {timerMinutesRemaining}
              </span>
              <span className="text-lg text-slate-400 font-bold">phút còn lại</span>
            </div>

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
                title="Xong sớm và check-in ngay"
              >
                Xong sớm
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

        {/* BIG Prominent Action Button: SOMETHING CAME UP (PRD B5) */}
        <div className="pt-2">
          <button
            onClick={() => setInterruptionModalOpen(true)}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#E0401F] to-orange-500 hover:from-[#d03515] hover:to-orange-600 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-red-500/25 flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] cursor-pointer"
          >
            <Zap className="w-6 h-6 fill-white" />
            <span>CÓ VIỆC ĐỘT XUẤT! (SOMETHING CAME UP)</span>
          </button>
          <p className="text-center text-xs text-slate-400 mt-2.5">
            Lưới 12 danh mục 1 chạm • Lưu điểm quay lại • Quyết định tức thì
          </p>
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
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-red-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group shadow-xl backdrop-blur-xl"
          title="Bấm để mở danh sách toàn bộ việc hôm nay kèm trạng thái và 1 chạm: Xong, Dời, Bỏ"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 group-hover:text-red-300">Việc đã xong</p>
            <span className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
          </div>
          <p className="text-xl font-extrabold text-white mt-1 group-hover:text-red-400 transition-colors">
            {completedCount} / {totalCount} việc
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Bấm xem cả {totalCount} việc</p>
        </div>

        {/* Metric 2: Deep work minutes */}
        <div 
          onClick={() => openDrilldown({
            type: 'deep_work',
            title: 'Các khối việc sâu hôm nay (Deep Work)',
            subtitle: `Tổng cộng ${deepWorkMinutes} phút tập trung chất lượng cao`,
          })}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-red-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group shadow-xl backdrop-blur-xl"
          title="Bấm để mở danh sách các khối việc sâu và số phút của từng khối"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 group-hover:text-red-300">Phút việc sâu</p>
            <span className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
          </div>
          <p className="text-xl font-extrabold text-[#E0401F] mt-1">
            {deepWorkMinutes} phút
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Bấm xem số phút từng khối</p>
        </div>

        {/* Metric 3: Interruption reserve */}
        <div 
          onClick={() => openDrilldown({
            type: 'interruptions',
            title: 'Nhật ký việc chen ngang & Quỹ dự phòng',
            subtitle: `Đã dùng ${intUsedMins}p / ${profile.interruptionReserveMins}p • Còn lại ${Math.max(0, profile.interruptionReserveMins - intUsedMins)} phút`,
          })}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group shadow-xl backdrop-blur-xl"
          title="Bấm để xem nhật ký chen ngang"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 group-hover:text-amber-300">Quỹ chen ngang</p>
            <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">Xem ↗</span>
          </div>
          <p className="text-xl font-extrabold text-amber-400 mt-1">
            {intUsedMins} / {profile.interruptionReserveMins}p
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Còn {Math.max(0, profile.interruptionReserveMins - intUsedMins)}p • Xem chi tiết</p>
        </div>

        {/* Metric 4: Protected minutes */}
        <div 
          onClick={() => openDrilldown({
            type: 'protected_focus',
            title: 'Thời gian tập trung đã bảo vệ (+45p)',
            subtitle: 'Đạt được từ các việc từ chối hoặc ủy quyền đúng lúc',
          })}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group shadow-xl backdrop-blur-xl"
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
