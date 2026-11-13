'use client';
// PRD FIX v0.3.28 C1: LiveClockStrip — persistent ticker at top of Day Card and Sticky Sheet
// Updates every second. Shows in-progress task + remaining, or upcoming gap, or current time.
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getDeviceTimeMinutes, timeToMinutes, computeBlockStatus } from '@/core/clock';
import { Clock, ExternalLink, Sparkles } from 'lucide-react';

export const LiveClockStrip: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { scheduleBlocks, language, palette } = useApp();
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

  const handleOpenDetachedClock = () => {
    if (typeof window !== 'undefined' && (window as any).taioAPI?.openClockWindow) {
      (window as any).taioAPI.openClockWindow();
    }
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
