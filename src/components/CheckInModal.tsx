'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  CalendarCheck,
  ArrowRight,
  Inbox,
  X 
} from 'lucide-react';
import { TimeboxEndCard, ResultEndCard } from '@/features/checkin';
import { updateScheduleEntry } from '@/features/tasks';

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
    setInboxModalOpen
  } = useApp();

  if (!checkInModalOpen || !checkInBlock) return null;

  const waitingCount = blocks.filter(b => b.id !== checkInBlock.id && b.status === 'planned').length;

  // Case 1: Ritual Block (PRD v0.20 B9 - Ritual card: e.g. Close the Day)
  if (checkInBlock.blockKind === 'ritual') {
    return (
      <div className="fixed app-bottom-sheet-safe z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl p-6 text-slate-900 border-t border-orange-500/30 sm:border">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4" />
              <span>Nghi thức cuối ngày (Daily Ritual)</span>
            </span>
            <button onClick={() => setCheckInModalOpen(false)} className="text-slate-500 hover:text-slate-900">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 mb-6">
            <h3 className="text-xl font-bold text-slate-900">Đến giờ Đóng ngày (2 phút)</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Khóa tổng kết hôm nay, xác nhận các việc chờ, và chọn một nhiệm vụ quan trọng số 1 cho ngày mai để thảnh thơi nghỉ ngơi.
            </p>
            <div className="p-3 rounded-2xl bg-slate-100/60 border border-slate-200/60 text-xs text-slate-700 flex items-center justify-between">
              <span>Đã hoàn thành: <strong>{blocks.filter(b => b.status === 'done').length} việc</strong></span>
              <span>Việc còn chờ: <strong>{waitingCount} việc</strong></span>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => {
                setCheckInModalOpen(false);
                setCloseDayModalOpen(true);
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#E0401F] hover:bg-[#c93517] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
            >
              <span>Mở Đóng ngày (2 phút)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleCheckInAnswer('remind_10m')}
              className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Nhắc lại sau 10 phút
            </button>
          </div>
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
    />
  );
};
