'use client';

import React, { useState, useEffect } from 'react';
import { Play, Timer, Sparkles, Clock } from 'lucide-react';
import { parseTimerInput } from '../model/parseTimerInput';
import { 
  FreeTimer, 
  MAX_FREE_TIMERS, 
  loadRecentTimerPresets, 
  saveRecentTimerPreset 
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
  const [inputText, setInputText] = useState<string>('');
  const [recentPresets, setRecentPresets] = useState<string[]>([]);

  useEffect(() => {
    setRecentPresets(loadRecentTimerPresets());
  }, []);

  const isLimitReached = activeCount >= MAX_FREE_TIMERS;

  const handleSubmit = (textToParse?: string) => {
    const raw = textToParse !== undefined ? textToParse : inputText;
    if (isLimitReached) return;

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
    if (isLimitReached) return;
    handleSubmit(preset);
  };

  return (
    <div className="w-full p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Timer className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Đồng hồ tự do (Bấm giờ riêng)
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-500">
          Đang chạy: {activeCount}/{MAX_FREE_TIMERS}
        </span>
      </div>

      {/* Single Smart Input Box */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          disabled={isLimitReached}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={
            isLimitReached
              ? 'Đã đạt tối đa 3 đồng hồ tự do cùng lúc'
              : 'Gõ: "25p pha trà", "1g30", "15:30 gọi anh Minh", hoặc để trống...'
          }
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />

        <button
          type="button"
          disabled={isLimitReached}
          onClick={() => handleSubmit()}
          className="py-2.5 px-4 rounded-xl bg-[#E0401F] hover:bg-[#c93517] disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs shadow-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{inputText.trim() ? 'Chạy' : 'Bấm giờ'}</span>
        </button>
      </div>

      {/* Quick Buttons & Recents */}
      {!isLimitReached && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[11px] text-slate-500 mr-1">Nhanh:</span>
          {['5p', '10p', '25p'].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => handleQuickPreset(p)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            onClick={() => handleQuickPreset('')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
          >
            Bấm giờ
          </button>

          {recentPresets.length > 0 && (
            <>
              <span className="text-slate-300 mx-1">|</span>
              <span className="text-[11px] text-slate-400">Gần đây:</span>
              {recentPresets.map((rp, i) => (
                <button
                  key={`${rp}-${i}`}
                  type="button"
                  onClick={() => handleQuickPreset(rp)}
                  className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 hover:bg-orange-100 text-[10px] font-medium border border-orange-200/50 truncate max-w-[120px] transition-colors cursor-pointer"
                  title={rp}
                >
                  {rp}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
