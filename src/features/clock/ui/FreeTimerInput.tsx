'use client';

import React, { useState, useEffect } from 'react';
import { Play, Timer, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { parseTimerInput } from '../model/parseTimerInput';
import { 
  FreeTimer, 
  MAX_FREE_TIMERS, 
  loadRecentTimerPresets, 
  saveRecentTimerPreset,
  formatTimerSeconds
} from '../model/freeTimers';

interface FreeTimerInputProps {
  activeCount: number;
  currentTaskTitle?: string;
  onAddTimer: (timer: FreeTimer) => void;
}

export const FreeTimerInput: React.FC<FreeTimerInputProps> = ({
  activeCount,
  currentTaskTitle,
  onAddTimer,
}) => {
  const { showToast, language } = useApp();
  const [inputText, setInputText] = useState<string>('');
  const [recentPresets, setRecentPresets] = useState<string[]>([]);

  useEffect(() => {
    setRecentPresets(loadRecentTimerPresets());
  }, []);

  const isLimitReached = activeCount >= MAX_FREE_TIMERS;

  const handleSubmit = (textToParse?: string) => {
    const raw = textToParse !== undefined ? textToParse : inputText;
    if (isLimitReached) {
      showToast?.(language === 'en' 
        ? 'Maximum 3 free timers running simultaneously' 
        : 'Đã đạt tối đa 3 đồng hồ đang chạy cùng lúc');
      return;
    }

    const parsed = parseTimerInput(raw);
    const now = Date.now();

    let title = parsed.title;
    // If in task and title is generic, suggest current task title (spec E2.6.2)
    if ((title === 'Đếm ngược' || title === 'Bấm giờ') && currentTaskTitle) {
      title = `${currentTaskTitle} (${title})`;
    }

    const newTimer: FreeTimer = {
      id: `free-${now}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      mode: parsed.mode,
      startedAt: now,
      endsAt: parsed.targetTimestamp,
      totalDurationSeconds: parsed.durationSeconds,
      status: 'running',
      createdAt: now,
      atTimeStr: parsed.targetTime,
    };

    if (raw.trim()) {
      saveRecentTimerPreset(raw.trim());
      setRecentPresets(loadRecentTimerPresets());
    }

    onAddTimer(newTimer);
    setInputText('');
  };

  const handleQuickPreset = (preset: string) => {
    if (isLimitReached) {
      showToast?.(language === 'en' 
        ? 'Maximum 3 free timers running simultaneously' 
        : 'Đã đạt tối đa 3 đồng hồ đang chạy cùng lúc');
      return;
    }
    handleSubmit(preset);
  };

  return (
    <div className="w-full p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Timer className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-900 tracking-wide">
            {language === 'en' ? 'Free Timers (Multiple)' : 'Bấm giờ riêng (Nhiều đồng hồ)'}
          </span>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
          isLimitReached ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
        }`}>
          {language === 'en' ? `Running: ${activeCount}/${MAX_FREE_TIMERS}` : `Đang chạy: ${activeCount}/${MAX_FREE_TIMERS}`}
        </span>
      </div>

      {/* Single Smart Input Box */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={
            isLimitReached
              ? (language === 'en' ? 'Maximum 3 free timers running' : 'Đã đạt tối đa 3 đồng hồ tự do cùng lúc')
              : (language === 'en' ? 'e.g. "25m tea", "1h30", "15:30 call Alice"...' : 'Gõ: "25p pha trà", "1g30", "15:30 gọi anh Minh", hoặc để trống...')
          }
          className="flex-1 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[var(--taio-brand)] focus:bg-white transition-all"
        />

        <button
          type="button"
          onClick={() => handleSubmit()}
          className="py-2.5 px-4 rounded-2xl bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)] text-[var(--taio-on-brand)] font-bold text-xs shadow-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer taio-btn-primary"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{inputText.trim() ? (language === 'en' ? 'Start' : 'Chạy') : (language === 'en' ? 'Stopwatch' : 'Bấm giờ')}</span>
        </button>
      </div>

      {/* Apple Clock Style: Recents List (PRD v0.3.48 Part C7) */}
      {recentPresets.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>{language === 'en' ? 'Recent Timers' : 'Gần đây'}</span>
            <span className="text-[11px] text-slate-400 font-normal">
              {language === 'en' ? 'Tap Play to start immediately' : 'Chạm Play để chạy ngay 1 chạm'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recentPresets.slice(0, 6).map((rp, i) => {
              const parsed = parseTimerInput(rp);
              const durationStr = parsed.durationSeconds
                ? formatTimerSeconds(parsed.durationSeconds)
                : parsed.targetTime || '00:00';
              const label = parsed.title || rp;

              return (
                <div
                  key={`${rp}-${i}`}
                  className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-lg font-mono font-bold text-slate-900 tracking-tight">
                      {durationStr}
                    </div>
                    <div className="text-[11.5px] text-slate-500 truncate max-w-[140px]">
                      {label}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickPreset(rp)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isLimitReached
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)] text-white shadow-xs hover:scale-105 active:scale-95 cursor-pointer'
                    }`}
                    title={isLimitReached ? (language === 'en' ? 'Max 3 active timers reached' : 'Đã đủ 3 đồng hồ đang chạy') : (language === 'en' ? 'Run now' : 'Chạy ngay')}
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
