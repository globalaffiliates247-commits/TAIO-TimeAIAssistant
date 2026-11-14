// TAIO Time App — Close Day Modal (PRD v0.3.33 Part B)
'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Moon, 
  Target, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  RotateCw, 
  Share2, 
  AlertTriangle,
  Footprints,
  Zap,
  ListChecks
} from 'lucide-react';
import { MotivationSticker } from '@/features/motivation';
import { findDayToClose, formatDayCloseTitle } from '@/features/dayclose';
import { getDeviceCalendarDate } from '@/core/clock';

export const CloseDayModal: React.FC = () => {
  const { 
    closeDayModalOpen, 
    setCloseDayModalOpen, 
    blocks, 
    goals, 
    handleCloseDay,
    profile, 
    dailyCardItems, 
    carryOverItem, 
    setExportModalOpen,
    palette,
    passiveSuggestions,
    setIsActiveCaptureOpen,
    closedDays,
    language,
  } = useApp();

  const isCool = palette === 'cool';

  const [tomorrowTask, setTomorrowTask] = useState<string>('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || '');
  const [closeMethod, setCloseMethod] = useState<'quick' | 'step_by_step'>('quick');

  if (!closeDayModalOpen) return null;

  const today = getDeviceCalendarDate();
  const dayToCloseInfo = findDayToClose(dailyCardItems, closedDays, today);
  const targetDate = dayToCloseInfo ? dayToCloseInfo.targetDate : today;
  const isPastDay = targetDate < today;
  const pendingCardItems = dayToCloseInfo 
    ? dayToCloseInfo.unfinishedItems 
    : dailyCardItems.filter(i => i.date === targetDate && i.status === 'open');

  const completedBlocks = blocks.filter(b => b.status === 'done');
  const modalTitle = formatDayCloseTitle(targetDate, language === 'vi');

  const onConfirmClose = () => {
    handleCloseDay(tomorrowTask, targetDate);
  };

  const handleQuickClose = () => {
    // v0.3.34 Part A2.5: Fast 1-tap close
    for (const item of pendingCardItems) {
      carryOverItem(item.id, isPastDay ? 'today' : 'tomorrow');
    }
    const finalFirstTask = tomorrowTask.trim() || (pendingCardItems[0]?.text || '');
    handleCloseDay(finalFirstTask, targetDate);
  };

  return (
    <div className="fixed app-overlay-safe z-50 bg-black/40 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto overscroll-contain shadow-2xl p-5 sm:p-7 text-slate-900">
        
        {/* Header (Part B2 #2) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${
              isCool 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-red-50 border-red-200 text-[#E0401F]'
            }`}>
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{modalTitle}</h3>
              </div>
              <p className="text-xs text-slate-500">
                {language === 'vi' 
                  ? 'Xem lại việc còn dở và chọn việc đầu tiên cho sáng mai, để tối nay nghỉ cho thảnh thơi.' 
                  : 'Review open tasks and pick the first one for tomorrow, so you can relax tonight.'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setCloseDayModalOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* v0.3.34 Part A2.5: Two ways to close day: Khép nhanh vs Xem từng việc */}
        <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80 mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setCloseMethod('quick')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              closeMethod === 'quick'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${closeMethod === 'quick' ? 'text-amber-600' : ''}`} />
            <span>{language === 'vi' ? 'Khép nhanh (1 chạm)' : 'Fast Close (1-tap)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setCloseMethod('step_by_step')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              closeMethod === 'step_by_step'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListChecks className={`w-3.5 h-3.5 ${closeMethod === 'step_by_step' ? 'text-blue-600' : ''}`} />
            <span>{language === 'vi' ? 'Xem từng việc' : 'Review step-by-step'}</span>
          </button>
        </div>

        {/* PRD FIX v0.3.30 Part B3.4: Dấu báo còn đoạn di chuyển chưa ghi */}
        {(() => {
          const unconfirmedMotionCount = (passiveSuggestions || []).filter(s => s.status === 'pending' && s.source === 'motion').length;
          if (unconfirmedMotionCount <= 0) return null;
          return (
            <div 
              onClick={() => {
                setCloseDayModalOpen(false);
                setIsActiveCaptureOpen(true);
              }}
              className="mb-4 p-3 rounded-2xl bg-orange-50 border border-orange-200/80 text-orange-900 text-xs flex items-center justify-between gap-2 cursor-pointer hover:bg-orange-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="font-semibold">
                  {language === 'vi' 
                    ? `Còn ${unconfirmedMotionCount} đoạn di chuyển chưa ghi` 
                    : `${unconfirmedMotionCount} unconfirmed motion segments`}
                </span>
              </div>
              <span className="text-[11px] font-bold text-orange-600 flex items-center gap-0.5">
                {language === 'vi' ? 'Xem & Ghi ↗' : 'Review ↗'}
              </span>
            </div>
          );
        })()}

        <div className="space-y-4">
          
          {/* Quick Summary Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {language === 'vi' ? 'Kết quả hôm nay của bạn:' : 'Your results for the day:'}
            </span>

            {/* PRD v0.3.33 Part F1.4 & F3.9: Day close summary line */}
            {(() => {
              const targetDayItems = dailyCardItems.filter(i => i.date === targetDate);
              const totalPlanned = targetDayItems.length || blocks.length;
              const doneCount = targetDayItems.filter(i => i.status === 'done').length || completedBlocks.length;
              const droppedCount = targetDayItems.filter(i => i.status === 'dropped').length;
              const carriedCount = targetDayItems.filter(i => i.status === 'carried').length;
              return (
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between shadow-2xs">
                  <span>
                    {language === 'vi'
                      ? `Đã xếp ${totalPlanned} việc · xong ${doneCount} · bỏ qua ${droppedCount} · dời ${carriedCount}`
                      : `Planned ${totalPlanned} tasks · done ${doneCount} · dropped ${droppedCount} · migrated ${carriedCount}`}
                  </span>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-slate-500 text-[11px] block">
                  {language === 'vi' ? 'Nhiệm vụ hoàn thành:' : 'Completed tasks:'}
                </span>
                <p className="font-extrabold text-emerald-600 text-sm mt-0.5">
                  {completedBlocks.length} {language === 'vi' ? 'khối việc' : 'blocks'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-slate-500 text-[11px] block">
                  {language === 'vi' ? 'Tập trung chất lượng:' : 'Deep focus:'}
                </span>
                <p className={`font-extrabold text-sm mt-0.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`}>
                  150 {language === 'vi' ? 'phút việc sâu' : 'deep minutes'}
                </p>
              </div>
            </div>
          </div>

          {/* Unplanned on goal trade-off notice (PRD .2) */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{language === 'vi' ? 'Ghi nhận thời gian ngoài kế hoạch (.2):' : 'Off-plan time recorded:'}</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-900/90 pl-5">
              {language === 'vi' 
                ? 'Hôm nay có 45 phút việc mục tiêu ngoài kế hoạch; Kênh nội dung AI bị đẩy lùi 45 phút. Đã cân bằng lại kế hoạch.' 
                : 'Today included 45 minutes of off-plan goal work; schedule re-balanced.'}
            </p>
          </div>

          {/* v0.3.34 Part A2.5: Fast 1-tap close vs Step-by-step Review */}
          {closeMethod === 'quick' ? (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-xs text-amber-950 uppercase tracking-wide">
                  {language === 'vi' ? 'Khép nhanh một chạm' : 'One-Tap Fast Wrap-Up'}
                </span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                {language === 'vi'
                  ? `Toàn bộ ${pendingCardItems.length} việc còn dở sẽ được tự động dời sang ${isPastDay ? 'hôm nay' : 'ngày mai'}. Bạn có thể thảnh thơi nghỉ ngơi tối nay.`
                  : `All ${pendingCardItems.length} open tasks will be automatically migrated to ${isPastDay ? 'today' : 'tomorrow'}.`}
              </p>
              <button
                type="button"
                onClick={handleQuickClose}
                className="w-full py-3 px-4 rounded-xl bg-[#E0401F] hover:bg-[#c93517] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <span>
                  {isPastDay
                    ? (language === 'vi' ? 'Khép nhanh & Dời sang hôm nay' : 'Fast Close & Move to Today')
                    : (language === 'vi' ? 'Khép nhanh & Dời sang ngày mai' : 'Fast Close & Move to Tomorrow')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Carry-over (Migration) for uncompleted items (Part B2 #5) */
            pendingCardItems.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {isPastDay
                        ? (language === 'vi' ? 'Dời việc chưa xong sang hôm nay:' : 'Carry over remaining tasks to today:')
                        : (language === 'vi' ? 'Dời việc còn lại sang ngày mai (Bullet Journal Migration):' : 'Carry over remaining tasks to tomorrow:')}
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {pendingCardItems.length} {language === 'vi' ? 'việc chưa gạch' : 'remaining'}
                  </span>
                </div>

                <div className="space-y-2">
                  {pendingCardItems.map((item) => (
                    <div key={item.id} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs shadow-xs">
                      <span className="text-slate-800 font-medium truncate flex-1">{item.text}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isPastDay ? (
                          <button
                            onClick={() => carryOverItem(item.id, 'today')}
                            className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 font-semibold text-[10px] transition-colors"
                            title={language === 'vi' ? 'Dời sang thẻ hôm nay' : 'Carry to today'}
                          >
                            {language === 'vi' ? 'Hôm nay' : 'Today'}
                          </button>
                        ) : (
                          <button
                            onClick={() => carryOverItem(item.id, 'tomorrow')}
                            className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 font-semibold text-[10px] transition-colors"
                            title={language === 'vi' ? 'Dời sang thẻ ngày mai' : 'Carry to tomorrow'}
                          >
                            {language === 'vi' ? 'Ngày mai' : 'Tomorrow'}
                          </button>
                        )}
                        <button
                          onClick={() => carryOverItem(item.id, 'leave')}
                          className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] transition-colors"
                          title={language === 'vi' ? 'Để lại thẻ này' : 'Leave on this day'}
                        >
                          {language === 'vi' ? 'Để lại' : 'Leave'}
                        </button>
                        <button
                          onClick={() => carryOverItem(item.id, 'drop')}
                          className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 text-[10px] transition-colors"
                          title={language === 'vi' ? 'Bỏ qua' : 'Drop'}
                        >
                          {language === 'vi' ? 'Bỏ' : 'Drop'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Tomorrow / Morning's Top Task (Part A2 #10) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div>
              <label className={`text-xs font-bold flex items-center gap-1.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`}>
                <Target className="w-4 h-4 shrink-0" />
                <span>
                  {isPastDay
                    ? (language === 'vi' ? 'Sáng nay, bạn làm gì đầu tiên?' : "What's your #1 task first thing this morning?")
                    : (language === 'vi' ? 'Sáng mai, bạn làm gì đầu tiên?' : "What's your #1 task first thing tomorrow morning?")}
                </span>
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {language === 'vi' 
                  ? 'Chọn đúng 1 điều bạn sẽ làm đầu tiên để tạo đà chiến thắng.' 
                  : 'Pick exactly 1 task to do first to build early momentum.'}
              </p>
            </div>

            <input
              type="text"
              value={tomorrowTask}
              onChange={e => setTomorrowTask(e.target.value)}
              placeholder={isPastDay
                ? (language === 'vi' ? 'Nhập việc hàng đầu của sáng nay...' : 'Top task for this morning...')
                : (language === 'vi' ? 'Nhập việc hàng đầu của ngày mai...' : 'Top task for tomorrow...')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 shadow-xs placeholder:text-slate-400"
            />

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {language === 'vi' ? 'Gắn với mục tiêu:' : 'Link to goal:'}
              </label>
              <select
                value={selectedGoalId}
                onChange={e => setSelectedGoalId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none shadow-xs cursor-pointer"
              >
                {goals.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lock Reminder (Part A2 #11) */}
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === 'vi'
                ? `Khép ngày xong, app sẽ nhắc bạn nghỉ lúc ${profile.personalAnchors?.windDownTime || '22:30'}.`
                : `Once day is wrapped up, the app will remind you to rest at ${profile.personalAnchors?.windDownTime || '22:30'}.`}
            </span>
          </div>

          {/* PRD FEATURE v0.3.31 B6: Motivation card for End of Day */}
          <MotivationSticker slotKey="close_day" context="end_day" size="card" />

          {/* Actions (Part A2 #9) */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setCloseDayModalOpen(false);
                setExportModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
              title={language === 'vi' ? 'Xuất snapshot Markdown cho trợ lý AI' : 'Export AI snapshot'}
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'vi' ? 'Xuất AI' : 'Export AI'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCloseDayModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                {language === 'vi' ? 'Để sau' : 'Later'}
              </button>
              <button
                onClick={onConfirmClose}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
                  isCool
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                    : 'bg-[#E0401F] hover:bg-[#c93517] shadow-red-500/20'
                }`}
              >
                <span>
                  {isPastDay
                    ? (language === 'vi' ? `Khép lại ${targetDate}` : `Wrap Up ${targetDate}`)
                    : (language === 'vi' ? 'Khép lại hôm nay' : 'Wrap Up Today')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
