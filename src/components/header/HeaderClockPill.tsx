'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { clockState } from '@/features/clock';
import { getDeviceTimeMinutes, timeToMinutes } from '@/core/clock';
import { Clock, Hourglass, Coffee } from 'lucide-react';

export const HeaderClockPill: React.FC = () => {
  const { scheduleBlocks, dayTemplate, language, setCurrentTab, currentBlock } = useApp();
  const [, setTick] = useState(0);

  // 1-second ticker for live pill update
  useEffect(() => {
    const timer = setInterval(() => setTick(t => (t + 1) % 10000), 1000);
    return () => clearInterval(timer);
  }, []);

  const now = new Date();
  const st = clockState(scheduleBlocks, dayTemplate, now, language as 'vi' | 'en');
  const nowMins = getDeviceTimeMinutes();

  let displayText = '';
  let fullTitle = '';
  let IconComponent = Clock;

  if (st.mode === 'task' && st.block) {
    IconComponent = Hourglass;
    const mins = Math.floor(st.remainingSeconds / 60);
    const secs = st.remainingSeconds % 60;
    displayText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    fullTitle = `${st.block.title} (${displayText} còn lại)`;
  } else {
    // Idle or gap
    IconComponent = Coffee;
    if (st.next) {
      const nextMins = timeToMinutes(st.next.startTime);
      const diff = Math.max(0, nextMins - nowMins);
      displayText = diff > 60 ? `${Math.floor(diff / 60)}g${diff % 60}p` : `${diff}p`;
      fullTitle = `${language === 'vi' ? 'Trống · Tiếp theo lúc' : 'Free · Next at'} ${st.next.startTime}: ${st.next.title}`;
    } else {
      displayText = language === 'vi' ? 'Trống' : 'Idle';
      fullTitle = language === 'vi' ? 'Không còn việc có giờ hôm nay' : 'No more scheduled tasks today';
    }
  }

  const handleClick = () => {
    if (typeof window !== 'undefined') {
      const bridge = (window as unknown as { taioAPI?: { openClockWindow?: () => void } }).taioAPI;
      if (bridge?.openClockWindow) {
        bridge.openClockWindow();
        return;
      }
    }
    setCurrentTab('now');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={fullTitle}
      className="max-w-[140px] h-8 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95 shadow-xs shrink-0 cursor-pointer overflow-hidden"
    >
      <IconComponent className="w-3.5 h-3.5 text-slate-600 shrink-0" />
      <span className="truncate tabular-nums font-bold text-xs">{displayText}</span>
    </button>
  );
};
