'use client';
// PRD FIX v0.3.28 C1: LiveClockStrip — persistent ticker at top of Day Card and Sticky Sheet
// Updates every second. Shows in-progress task + remaining, or upcoming gap, or current time.
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getDeviceTimeMinutes, timeToMinutes, computeBlockStatus } from '@/core/clock';
import { Clock, ExternalLink, Sparkles } from 'lucide-react';
import { startNativeLiveActivity, openNativeAppSettings } from '@/features/native';
import type { TimeBlock } from '@/types';

function parseBlockTimestamps(block: TimeBlock): { startTimestamp: number; targetTimestamp: number; totalMinutes: number; remainingMinutes: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const nowSec = Math.floor(now.getTime() / 1000);

  const [startH, startM] = (block.startTime || '00:00').split(':').map(Number);
  const [endH, endM] = (block.endTime || '23:59').split(':').map(Number);

  const startDate = new Date(year, month, date, startH || 0, startM || 0, 0);
  const endDate = new Date(year, month, date, endH || 0, endM || 0, 0);

  if (endDate.getTime() <= startDate.getTime()) {
    endDate.setDate(endDate.getDate() + 1);
  }

  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const targetTimestamp = Math.floor(endDate.getTime() / 1000);

  const totalMinutes = Math.max(5, Math.round((targetTimestamp - startTimestamp) / 60));
  const remainingMinutes = Math.max(1, Math.round((targetTimestamp - nowSec) / 60));

  return { startTimestamp, targetTimestamp, totalMinutes, remainingMinutes };
}

export const LiveClockStrip: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { scheduleBlocks, goals, language, palette, isNativePlatform, showToast } = useApp();
  const [nowSec, setNowSec] = useState(() => Date.now());

  const isCool = palette === 'cool';
  const isVi = language === 'vi';

  // Live tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNowSec(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const nowDate = new Date(nowSec);
  const nowHours = nowDate.getHours();
  const nowMinutes = nowDate.getMinutes();
  const nowSeconds = nowDate.getSeconds();
  const nowMinsExact = nowHours * 60 + nowMinutes + nowSeconds / 60;
  const nowMins = Math.floor(nowMinsExact);

  const curTimeStr = `${String(nowHours).padStart(2, '0')}:${String(nowMinutes).padStart(2, '0')}:${String(nowSeconds).padStart(2, '0')}`;

  // 1. Current in-progress task
  const inProgressBlock = scheduleBlocks.find(b => computeBlockStatus(b, nowMins) === 'in_progress');

  // 2. Next planned task
  const nextPlannedBlock = scheduleBlocks
    .filter(b => computeBlockStatus(b, nowMins) === 'planned')
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  // Format remaining time string
  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleOpenDetachedClock = async () => {
    // 1. macOS Desktop: Open separate floating clock window
    if (typeof window !== 'undefined' && (window as any).taioAPI?.openClockWindow) {
      (window as any).taioAPI.openClockWindow();
      return;
    }

    // 2. iOS / Native platform: tap on clock strip controls/reports Lock Screen Clock
    if (isNativePlatform) {
      try {
        window.localStorage.setItem('taio_lockscreen_clock_enabled', 'true');
      } catch {}

      if (inProgressBlock) {
        const { startTimestamp, targetTimestamp, totalMinutes, remainingMinutes } = parseBlockTimestamps(inProgressBlock);
        const linkedGoal = goals.find(g => g.id === inProgressBlock.goalId);
        const goalName = linkedGoal?.name || inProgressBlock.goalName || 'Mục tiêu chính';

        const res = await startNativeLiveActivity({
          blockId: inProgressBlock.id,
          taskTitle: inProgressBlock.title,
          goalName,
          isCountDown: inProgressBlock.taskEndType === 'timebox' || !inProgressBlock.taskEndType,
          totalMinutes,
          remainingMinutes,
          startTimestamp,
          targetTimestamp,
        });

        if (res.ok) {
          showToast(isVi ? 'Đồng hồ đang hiện trên màn hình khóa' : 'Clock is now active on Lock Screen');
        } else if (res.error === 'live_activity_disabled_by_user') {
          showToast(
            isVi ? 'Hoạt động trực tiếp đã bị tắt trong Cài đặt iPhone' : 'Live Activities disabled in iPhone Settings',
            () => { openNativeAppSettings(); },
            'error',
            isVi ? 'Mở Cài đặt' : 'Settings'
          );
        } else if (res.error === 'ios_version_unsupported') {
          showToast(
            isVi ? 'Cần iOS 16.1 trở lên để hiện đồng hồ màn hình khóa' : 'Requires iOS 16.1 or later',
            undefined,
            'error'
          );
        } else {
          showToast(res.message || res.error || (isVi ? 'Không thể bật đồng hồ' : 'Failed to start clock'), undefined, 'error');
        }
      } else {
        showToast(
          isVi ? 'Đồng hồ màn hình khóa đã bật (sẽ hiện khi có việc đang chạy)' : 'Lock Screen clock enabled (will show when task is running)'
        );
      }
      return;
    }

    // 3. Web fallback: informative feedback
    showToast(isVi ? `Đồng hồ hiện tại: ${curTimeStr}` : `Current Clock: ${curTimeStr}`);
  };

  let contentNode: React.ReactNode = null;
  let isLiveActive = false;

  if (inProgressBlock) {
    isLiveActive = true;
    const endMins = timeToMinutes(inProgressBlock.endTime);
    const diffSec = Math.max(0, Math.floor((endMins - nowMinsExact) * 60));
    const countdown = formatSeconds(diffSec);

    contentNode = (
      <div className="flex items-center gap-2 overflow-hidden truncate">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="font-semibold text-slate-800 truncate" title={inProgressBlock.title}>
          {inProgressBlock.title}
        </span>
        <span className="text-slate-400">·</span>
        <span className="font-mono font-bold text-slate-900 shrink-0">
          {countdown}
        </span>
      </div>
    );
  } else if (nextPlannedBlock) {
    const nextStartMins = timeToMinutes(nextPlannedBlock.startTime);
    const diffSec = Math.max(0, Math.floor((nextStartMins - nowMinsExact) * 60));
    const countdown = formatSeconds(diffSec);

    contentNode = (
      <div className="flex items-center gap-2 overflow-hidden truncate">
        <span className="text-slate-500 font-medium shrink-0">
          {isVi ? 'Trống' : 'Free'}
        </span>
        <span className="text-slate-400">·</span>
        <span className="font-mono font-semibold text-slate-700 shrink-0">
          {countdown} {isVi ? 'nữa tới:' : 'until:'}
        </span>
        <span className="font-medium text-slate-700 truncate" title={nextPlannedBlock.title}>
          {nextPlannedBlock.title}
        </span>
      </div>
    );
  } else {
    contentNode = (
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="font-mono font-bold text-slate-700 shrink-0">
          {curTimeStr}
        </span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-500 font-medium truncate">
          {isVi ? 'Chưa có việc có giờ' : 'No timed tasks scheduled'}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={handleOpenDetachedClock}
      title={isVi ? 'Bấm để mở đồng hồ nổi rời' : 'Click to detach clock window'}
      className={`group flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer select-none border shadow-2xs ${
        compact ? 'mb-2' : 'mb-3'
      } ${
        isLiveActive
          ? isCool
            ? 'bg-blue-50/90 border-blue-200/90 hover:bg-blue-100/90'
            : 'bg-amber-50/90 border-amber-200/90 hover:bg-amber-100/90'
          : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/80'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Clock className={`w-3.5 h-3.5 shrink-0 ${isLiveActive ? 'text-emerald-600' : 'text-slate-500'}`} />
        {contentNode}
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2 text-slate-400 group-hover:text-slate-700 transition-colors">
        <span className="text-[10px] hidden sm:inline font-mono">
          {isVi ? 'Đồng hồ' : 'Clock'}
        </span>
        <ExternalLink className="w-3 h-3" />
      </div>
    </div>
  );
};
