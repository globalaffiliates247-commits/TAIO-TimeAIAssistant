'use client';
// PRD FIX v0.3.28 C1: LiveClockStrip — persistent ticker at top of Day Card and Sticky Sheet
// Updates every second. Shows in-progress task + remaining, or upcoming gap, or current time.
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getDeviceTimeMinutes, timeToMinutes, computeBlockStatus } from '@/core/clock';
import { Clock, ExternalLink, Sparkles } from 'lucide-react';
import { startNativeLiveActivity, openNativeAppSettings } from '@/features/native';
import { clockState } from '@/features/clock';
import { MotivationSticker } from '@/features/motivation';
import { useHighlight } from '@/features/prefs';
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

export const LiveClockStrip: React.FC<{ compact?: boolean; showQuote?: boolean }> = ({
  compact = false,
  showQuote = false,
}) => {
  const { scheduleBlocks, dayTemplate, goals, language, palette, isNativePlatform, showToast, freeTimers } = useApp();
  const [nowSec, setNowSec] = useState(() => Date.now());

  const isCool = palette === 'cool';
  const isVi = language === 'vi';
  const { highlightStyle } = useHighlight();

  // Live tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNowSec(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const nowDate = new Date(nowSec);
  const state = clockState(scheduleBlocks, dayTemplate, nowDate, language);

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

  // PRD FIX v0.3.30 Part E2.4: Free timer second line (closest to finish)
  const activeFreeTimers = (freeTimers || []).filter(t => t.status === 'running');
  let topFreeTimer: (typeof activeFreeTimers)[0] | null = null;
  if (activeFreeTimers.length > 0) {
    const countdowns = activeFreeTimers
      .filter(t => (t.mode === 'countdown' || t.mode === 'at_time') && t.endsAt)
      .sort((a, b) => (a.endsAt || 0) - (b.endsAt || 0));
    if (countdowns.length > 0) {
      topFreeTimer = countdowns[0];
    } else {
      topFreeTimer = activeFreeTimers[0];
    }
  }

  const freeTimerRemaining = topFreeTimer
    ? (topFreeTimer.mode === 'stopwatch'
        ? formatSeconds(Math.max(0, Math.floor((nowSec - topFreeTimer.startedAt) / 1000)))
        : formatSeconds(Math.max(0, Math.floor(((topFreeTimer.endsAt || nowSec) - nowSec) / 1000))))
    : '';

  // Sync with Electron floating window & macOS menu tray across all 3 states + free timer (spec E1.3 & E2.4)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).taioAPI?.updateTimer) {
      (window as any).taioAPI.updateTimer({
        title: state.title,
        subtitle: state.subtitle,
        startedAt: state.startedAt,
        endsAt: state.endsAt,
        mode: state.mode,
        remaining: formatSeconds(state.remainingSeconds),
        freeTimer: topFreeTimer ? {
          title: topFreeTimer.title,
          timeStr: freeTimerRemaining,
          mode: topFreeTimer.mode,
        } : null,
      });
    }
  }, [state.title, state.subtitle, state.endsAt, state.mode, topFreeTimer?.id, freeTimerRemaining]);

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

      if (state.block) {
        const { startTimestamp, targetTimestamp, totalMinutes, remainingMinutes } = parseBlockTimestamps(state.block);
        const linkedGoal = goals.find(g => g.id === state.block?.goalId);
        const goalName = linkedGoal?.name || state.block?.goalName || 'Mục tiêu chính';

        const res = await startNativeLiveActivity({
          blockId: state.block.id,
          taskTitle: state.block.title,
          goalName,
          isCountDown: state.block.taskEndType === 'timebox' || !state.block.taskEndType,
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
          isVi ? 'Đồng hồ màn hình khóa đã bật (sẽ hiện khi có việc)' : 'Lock Screen clock enabled'
        );
      }
      return;
    }

    // 3. Web fallback: informative feedback
    showToast(isVi ? `Đồng hồ: ${state.title} (${state.subtitle})` : `Clock: ${state.title}`);
  };

  let contentNode: React.ReactNode = null;
  let isLiveActive = false;

  if (state.mode === 'task') {
    isLiveActive = true;
    const countdown = formatSeconds(state.remainingSeconds);
    contentNode = (
      <div className="flex items-center gap-2 overflow-hidden truncate">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="font-semibold text-slate-800 truncate" title={state.title} style={highlightStyle}>
          {state.title}
        </span>
        <span className="text-slate-400">·</span>
        <span className="font-mono font-bold text-slate-900 shrink-0" style={highlightStyle}>
          {countdown}
        </span>
      </div>
    );
  } else if (state.mode === 'gap') {
    contentNode = (
      <div className="flex items-center gap-2 overflow-hidden truncate">
        <span className="text-slate-500 font-medium shrink-0">
          {isVi ? 'Trống' : 'Free'}
        </span>
        <span className="text-slate-400">·</span>
        <span className="font-medium text-slate-700 truncate">
          {state.subtitle}
        </span>
      </div>
    );
  } else {
    contentNode = (
      <div className="flex items-center gap-2 overflow-hidden truncate">
        <span className="font-mono font-bold text-slate-700 shrink-0" style={highlightStyle}>
          {state.title}
        </span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-500 font-medium truncate">
          {state.subtitle}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={handleOpenDetachedClock}
      title={isVi ? 'Bấm để mở đồng hồ nổi rời' : 'Click to detach clock window'}
      className={`group flex flex-col justify-center px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer select-none border shadow-2xs ${
        compact ? 'mb-2' : 'mb-3'
      } ${
        isLiveActive
          ? isCool
            ? 'bg-blue-50/90 border-blue-200/90 hover:bg-blue-100/90'
            : 'bg-amber-50/90 border-amber-200/90 hover:bg-amber-100/90'
          : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/80'
      }`}
    >
      <div className="flex items-center justify-between w-full">
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

      {/* PRD FIX v0.3.30 Part E2.4: Free Timer secondary line */}
      {topFreeTimer && (
        <div className="flex items-center gap-1.5 pt-1.5 mt-1 border-t border-slate-200/60 text-[11px] text-amber-800 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="truncate max-w-[200px]" title={topFreeTimer.title}>
            {topFreeTimer.title}
          </span>
          <span className="text-slate-300">·</span>
          <span className="font-mono font-bold text-amber-900 shrink-0">
            {freeTimerRemaining}
          </span>
        </div>
      )}

      {/* PRD FEATURE v0.3.31 B3 / v0.3.35 A3: Motivation sticker line only if showQuote=true */}
      {showQuote && state.mode !== 'task' && (
        <div className="pt-1.5 mt-1 border-t border-slate-200/50" onClick={e => e.stopPropagation()}>
          <MotivationSticker slotKey="clock_idle" context="break" size="line" />
        </div>
      )}
    </div>
  );
};
