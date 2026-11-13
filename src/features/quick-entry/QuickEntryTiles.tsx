'use client';
// PRD FIX v0.3.28 B1: QuickEntryTiles — Two large cards at the top of NowTab (iPhone & Mac)
// 1. Quick Note: shows today's task count, tap opens Sticky Board
// 2. Clock: live countdown when in progress, or "Start" with next task name
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getDeviceCalendarDate, getDeviceTimeMinutes, timeToMinutes, minutesToTime, computeBlockStatus } from '@/core/clock';
import { openStickyBoard } from '@/features/sticky';
import { updateScheduleEntry } from '@/features/tasks';
import { StickyNote, Clock, Play, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TimeBlock } from '@/types';

export const QuickEntryTiles: React.FC = () => {
  const {
    scheduleBlocks,
    dailyCardItems,
    currentBlock,
    updateDailyCardItem,
    setBlocks,
    isTimerRunning,
    setIsTimerRunning,
    language,
    palette,
  } = useApp();

  const isCool = palette === 'cool';
  const isVi = language === 'vi';
  const today = getDeviceCalendarDate();

  // Current live time ticker (updates every second for precision)
  const [nowSec, setNowSec] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowSec(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Today tasks count from dailyCardItems
  const todayItems = dailyCardItems.filter(it => it.date === today && it.status !== 'dropped' && it.status !== 'carried');
  const pendingCount = todayItems.filter(it => it.status !== 'done').length;
  const totalCount = todayItems.length;

  // Active in-progress block or next planned block
  const nowMins = getDeviceTimeMinutes();
  const inProgressBlock = scheduleBlocks.find(b => computeBlockStatus(b, nowMins) === 'in_progress');
  const nextPlannedBlock = scheduleBlocks
    .filter(b => computeBlockStatus(b, nowMins) === 'planned')
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  // Calculate live countdown for in-progress block
  let countdownStr = '';
  if (inProgressBlock) {
    const endMins = timeToMinutes(inProgressBlock.endTime);
    const startMins = timeToMinutes(inProgressBlock.startTime);
    const nowDate = new Date(nowSec);
    const currentMinsWithSec = nowDate.getHours() * 60 + nowDate.getMinutes() + nowDate.getSeconds() / 60;
    const diffSec = Math.max(0, Math.floor((endMins - currentMinsWithSec) * 60));

    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;

    if (h > 0) {
      countdownStr = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    } else {
      countdownStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }

  // Handle starting next block immediately
  const handleStartNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextPlannedBlock) {
      openStickyBoard(today);
      return;
    }
    const currentHM = minutesToTime(nowMins);
    const duration = Math.max(15, timeToMinutes(nextPlannedBlock.endTime) - timeToMinutes(nextPlannedBlock.startTime));
    const newEndHM = minutesToTime(nowMins + duration);

    updateScheduleEntry(
      nextPlannedBlock.id,
      {
        startTime: currentHM,
        endTime: newEndHM,
        status: 'in_progress',
      },
      { updateDailyCardItem, setBlocks, dailyCardItems }
    );
    setIsTimerRunning(true);
  };

  const handleClockTileClick = () => {
    // If desktop electron has clock window API, trigger it
    if (typeof window !== 'undefined' && (window as any).taioAPI?.openClockWindow) {
      (window as any).taioAPI.openClockWindow();
      return;
    }
    // Otherwise open sticky sheet
    openStickyBoard(today);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-2">
      {/* Tile 1: Ghi nhanh (Quick Notes) */}
      <button
        type="button"
        onClick={() => openStickyBoard(today)}
        className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border border-amber-200/70 hover:border-amber-300 text-left transition-all duration-200 shadow-xs hover:shadow-md active:scale-[0.99] overflow-hidden"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF6C2] border border-[#F0E3A2] text-[#8C7A32] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <StickyNote className="w-5 h-5 text-[#8C7A32]" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                {isVi ? 'Ghi nhanh' : 'Quick Notes'}
              </span>
              <p className="text-[11px] text-amber-700/80">
                {isVi ? 'Thẻ ngày hôm nay' : 'Today Sheet'}
              </p>
            </div>
          </div>
          <span className="w-7 h-7 rounded-full bg-amber-100/70 text-amber-800 flex items-center justify-center text-xs font-bold group-hover:bg-amber-200 transition-colors">
            {totalCount}
          </span>
        </div>

        <div className="mt-4 pt-2 border-t border-amber-100/80 flex items-center justify-between w-full">
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              {pendingCount > 0 ? (
                <>
                  {pendingCount} <span className="text-sm font-semibold text-slate-500">{isVi ? 'việc cần làm' : 'tasks left'}</span>
                </>
              ) : (
                <span className="text-emerald-700 text-base font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {isVi ? 'Đã hoàn tất hết' : 'All done today'}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            {isVi ? 'Mở tờ' : 'Open'} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </button>

      {/* Tile 2: Đồng hồ (Clock) */}
      <button
        type="button"
        onClick={handleClockTileClick}
        className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-3xl border text-left transition-all duration-200 shadow-xs hover:shadow-md active:scale-[0.99] overflow-hidden ${
          inProgressBlock
            ? isCool
              ? 'bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 border-blue-200/80 hover:border-blue-300'
              : 'bg-gradient-to-br from-red-50/80 via-white to-red-50/30 border-red-200/80 hover:border-red-300'
            : 'bg-gradient-to-br from-slate-50/80 via-white to-slate-50/30 border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform ${
                inProgressBlock
                  ? isCool
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-red-100 text-[#E0401F] border border-red-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span
                className={`text-xs font-bold uppercase tracking-wide ${
                  inProgressBlock
                    ? isCool ? 'text-blue-900' : 'text-[#A02A12]'
                    : 'text-slate-700'
                }`}
              >
                {isVi ? 'Đồng hồ' : 'Clock'}
              </span>
              <p className="text-[11px] text-slate-500">
                {inProgressBlock
                  ? isVi ? 'Đang thực hiện' : 'In Progress'
                  : nextPlannedBlock
                  ? `${isVi ? 'Kế tiếp lúc' : 'Next at'} ${nextPlannedBlock.startTime}`
                  : isVi ? 'Không có việc tiếp theo' : 'No upcoming task'}
              </p>
            </div>
          </div>

          {inProgressBlock && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                isCool ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-[#E0401F]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {isVi ? 'Đang chạy' : 'Live'}
            </span>
          )}
        </div>

        <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between w-full">
          {inProgressBlock ? (
            <>
              <div className="truncate max-w-[65%]">
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
                  {countdownStr}
                </div>
                <p className="text-xs text-slate-600 font-medium truncate" title={inProgressBlock.title}>
                  {inProgressBlock.title}
                </p>
              </div>
              <span
                className={`text-xs font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ${
                  isCool ? 'text-blue-700' : 'text-[#E0401F]'
                }`}
              >
                {isVi ? 'Mở' : 'View'} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </>
          ) : (
            <>
              <div className="truncate max-w-[65%]">
                <div className="text-sm font-bold text-slate-800 truncate" title={nextPlannedBlock?.title}>
                  {nextPlannedBlock ? nextPlannedBlock.title : (isVi ? 'Chưa xếp giờ' : 'No tasks scheduled')}
                </div>
                <p className="text-[11px] text-slate-500">
                  {nextPlannedBlock
                    ? `${nextPlannedBlock.startTime} - ${nextPlannedBlock.endTime}`
                    : (isVi ? 'Bấm để thêm việc' : 'Tap to add task')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartNext}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1 hover:opacity-95 active:scale-95 transition-all ${
                  isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isVi ? 'Bắt đầu' : 'Start'}</span>
              </button>
            </>
          )}
        </div>
      </button>
    </div>
  );
};
