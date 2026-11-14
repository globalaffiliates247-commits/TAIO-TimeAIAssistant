'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CalendarCheck,
  ArrowRight,
  Inbox,
  X,
  Clock,
  Settings
} from 'lucide-react';
import { TimeboxEndCard, ResultEndCard } from '@/features/checkin';
import { SnoozePicker, type SnoozeOption } from '@/features/snooze';
import { updateScheduleEntry } from '@/features/tasks';
import { getDeviceCalendarDate, getDeviceTimeMinutes, timeToMinutes, minutesToTime } from '@/core/clock';

export const CheckInModal: React.FC = () => {
  const { 
    checkInModalOpen, 
    setCheckInModalOpen, 
    checkInBlock, 
    handleCheckInAnswer,
    blocks,
    dailyCardItems,
    updateDailyCardItem,
    setBlocks,
    setCloseDayModalOpen,
    setInboxModalOpen,
    currentBlock,
    language,
    showToast,
    setIsProfileModalOpen,
    snoozeBlock,
    dayCloseOverrides,
  } = useApp();

  const [isSnoozePickerOpen, setIsSnoozePickerOpen] = useState(false);

  if (!checkInModalOpen || !checkInBlock) return null;

  const todayStr = getDeviceCalendarDate();
  const waitingTasks = dailyCardItems.filter(i => i.date === todayStr && i.status === 'open');
  const waitingCount = waitingTasks.length;
  const estMinutes = Math.max(2, Math.min(15, Math.ceil(waitingCount * 0.7) + 2));

  const isDayClose = checkInBlock.blockKind === 'ritual' || checkInBlock.id === 'b-user-dayclose';
  const todaySnoozeCount = isDayClose
    ? (dayCloseOverrides?.[todayStr]?.count || checkInBlock.snoozeCount || 0)
    : (checkInBlock.snoozeCount || (checkInBlock as any).snoozeHistory?.length || 0);

  const handleSnoozeAction = (opt: SnoozeOption) => {
    setIsSnoozePickerOpen(false);
    snoozeBlock(checkInBlock.id, opt);
    setCheckInModalOpen(false);
  };

  // Case 1: Ritual Block (v0.3.34 Part A2.3 - A2.6: Khép lại hôm nay)
  if (checkInBlock.blockKind === 'ritual') {
    return (
      <div className="fixed app-bottom-sheet-safe z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl p-6 text-slate-900 border-t border-orange-500/30 sm:border relative">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4" />
              <span>{language === 'vi' ? 'Khép lại hôm nay' : 'Wrap up today'}</span>
            </span>
            <button 
              onClick={() => {
                setCheckInModalOpen(false);
                setIsSnoozePickerOpen(false);
              }} 
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {language === 'vi' ? 'Đến giờ khép lại hôm nay' : 'Time to wrap up today'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'vi' 
                    ? `khoảng ${estMinutes} phút · ${waitingCount} việc đang chờ` 
                    : `approx ${estMinutes} mins · ${waitingCount} open tasks`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckInModalOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold hover:underline shrink-0"
                title="Cài đặt giờ khép ngày"
              >
                {language === 'vi' ? 'Đổi giờ nhắc khép ngày' : 'Change time'}
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {language === 'vi'
                ? 'Xem lại việc còn dở và chọn việc đầu tiên cho sáng mai, để tối nay nghỉ cho thảnh thơi.'
                : 'Review open tasks and pick the first one for tomorrow, so you can relax tonight.'}
            </p>

            <div className="p-3 rounded-2xl bg-slate-100/60 border border-slate-200/60 text-xs text-slate-700 flex items-center justify-between">
              <span>{language === 'vi' ? 'Đã hoàn thành:' : 'Done:'} <strong>{dailyCardItems.filter(i => i.date === todayStr && i.status === 'done').length} việc</strong></span>
              <span>{language === 'vi' ? 'Việc còn chờ:' : 'Waiting:'} <strong>{waitingCount} việc</strong></span>
            </div>
          </div>

          {isSnoozePickerOpen ? (
            <div className="mb-4">
              <SnoozePicker
                isDayClose={true}
                activeRunningTask={currentBlock}
                snoozeCount={todaySnoozeCount}
                language={language as 'vi' | 'en'}
                onSnooze={handleSnoozeAction}
                onClose={() => setIsSnoozePickerOpen(false)}
              />
            </div>
          ) : (
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setCheckInModalOpen(false);
                  setCloseDayModalOpen(true);
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#E0401F] hover:bg-[#c93517] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>{language === 'vi' ? 'Khép ngày bây giờ' : 'Wrap up now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsSnoozePickerOpen(true)}
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                {language === 'vi' ? 'Dời…' : 'Snooze…'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Case 2: Meeting Block (PRD v0.20 B9 - Ends silently with Inbox prompt)
  if (checkInBlock.blockKind === 'meeting') {
    return (
      <div className="fixed app-bottom-sheet-safe z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl p-6 text-slate-900 border-t border-purple-500/30 sm:border">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
              Khung giờ họp kết thúc
            </span>
            <button onClick={() => setCheckInModalOpen(false)} className="text-slate-500 hover:text-slate-900">
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">{checkInBlock.title}</h3>
          <p className="text-xs text-slate-700 mb-5">
            Cuộc họp đã kết thúc. Bạn có cần ghi nhanh hành động tiếp theo (Action Item) vào Rổ việc không?
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => {
                setCheckInModalOpen(false);
                setInboxModalOpen(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
            >
              <Inbox className="w-4 h-4" />
              <span>Ghi nhận hành động kế tiếp vào Rổ việc (Inbox)</span>
            </button>
            <button
              onClick={() => handleCheckInAnswer('done')}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Không có gì phát sinh, đánh dấu xong
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Standard Task
  // Rule A2: Acceptance criteria only exist if user typed them for until_done_* tasks.
  const hasUserDod = Boolean(checkInBlock.dodChecklist && checkInBlock.dodChecklist.length > 0);
  const isResultEnd = (
    checkInBlock.taskEndType === 'until_done_pausable' || 
    checkInBlock.taskEndType === 'until_done_atomic'
  ) && hasUserDod;

  const handleUpdateBlockNotes = (blockId: string, notes: string) => {
    updateScheduleEntry(
      blockId,
      { notes },
      { updateDailyCardItem, setBlocks, dailyCardItems }
    );
  };

  if (isResultEnd) {
    return (
      <ResultEndCard
        checkInBlock={checkInBlock}
        waitingCount={waitingCount}
        onClose={() => setCheckInModalOpen(false)}
        onAnswer={handleCheckInAnswer}
        onSnooze={handleSnoozeAction}
        snoozeCount={todaySnoozeCount}
        onUpdateBlockNotes={handleUpdateBlockNotes}
      />
    );
  }

  return (
    <TimeboxEndCard
      checkInBlock={checkInBlock}
      waitingCount={waitingCount}
      onClose={() => setCheckInModalOpen(false)}
      onAnswer={handleCheckInAnswer}
      onSnooze={handleSnoozeAction}
      snoozeCount={todaySnoozeCount}
    />
  );
};
