'use client';
// PRD FIX v0.3.28 B3: QuickLineInput — single-line task input on NowTab (Mac & desktop optimized)
// Press Enter calls commitQuickLine. Below lists today's scheduled tasks + link to open full sheet.
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getDeviceCalendarDate, getDeviceTimeMinutes, computeBlockStatus } from '@/core/clock';
import { commitQuickLine } from '@/features/tasks';
import { openStickyBoard } from '@/features/sticky';
import { Plus, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react';

export const QuickLineInput: React.FC = () => {
  const {
    addDailyCardItem,
    goals,
    scheduleBlocks,
    language,
    palette,
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const isCool = palette === 'cool';
  const isVi = language === 'vi';
  const today = getDeviceCalendarDate();
  const nowMins = getDeviceTimeMinutes();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputVal.trim()) {
      e.preventDefault();
      commitQuickLine(inputVal.trim(), today, { addDailyCardItem, goals });
      setInputVal('');
    }
  };

  // Scheduled tasks for today sorted by start time
  const todayScheduled = scheduleBlocks
    .filter(b => b.startTime && b.endTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs mb-4">
      {/* Input row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isVi
                ? 'Gõ việc nhanh (vd: 14:00 Họp dự án #congviec 45p) rồi nhấn Enter...'
                : 'Quick add (e.g. 14:00 Team sync #work 45m) then press Enter...'
            }
            className="w-full h-11 pl-4 pr-10 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => {
              if (inputVal.trim()) {
                commitQuickLine(inputVal.trim(), today, { addDailyCardItem, goals });
                setInputVal('');
              }
            }}
            disabled={!inputVal.trim()}
            className={`absolute right-1.5 top-1.5 h-8 px-2.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
              inputVal.trim()
                ? isCool
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  : 'bg-[#E0401F] hover:bg-[#d03515] text-white shadow-xs'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isVi ? 'Thêm' : 'Add'}</span>
          </button>
        </div>
      </div>

      {/* Today's scheduled timeline preview & link */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 max-w-full text-xs text-slate-600 scrollbar-none">
          <span className="font-semibold text-slate-500 shrink-0 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {isVi ? 'Lịch hôm nay:' : 'Today:'}
          </span>
          {todayScheduled.length === 0 ? (
            <span className="text-slate-400 italic">
              {isVi ? 'Chưa có việc xếp giờ' : 'No timed tasks yet'}
            </span>
          ) : (
            todayScheduled.slice(0, 4).map(block => {
              const status = computeBlockStatus(block, nowMins);
              const isCurrent = status === 'in_progress';
              const isDone = block.status === 'done';
              return (
                <span
                  key={block.id}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl shrink-0 font-medium border text-[11px] ${
                    isDone
                      ? 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                      : isCurrent
                      ? isCool
                        ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                        : 'bg-red-50 text-[#E0401F] border-red-200 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                  title={`${block.startTime} - ${block.endTime}: ${block.title}`}
                >
                  {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  {block.startTime} {block.title.length > 15 ? `${block.title.slice(0, 15)}…` : block.title}
                </span>
              );
            })
          )}
          {todayScheduled.length > 4 && (
            <span className="text-[11px] text-slate-400 shrink-0 font-semibold">
              +{todayScheduled.length - 4} {isVi ? 'việc nữa' : 'more'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => openStickyBoard(today)}
          className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline self-end sm:self-center"
        >
          <span>{isVi ? 'Mở tờ ghi chú đầy đủ' : 'Open full sticky sheet'}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
