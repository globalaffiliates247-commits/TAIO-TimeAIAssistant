'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Plus, 
  Check, 
  Trash2, 
  AlertCircle, 
  Clock, 
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { 
  FreeTimer, 
  getFreeTimerRemainingSeconds, 
  getFreeTimerElapsedSeconds, 
  formatTimerSeconds 
} from '../model/freeTimers';

interface FreeTimerListProps {
  timers: FreeTimer[];
  onTogglePause: (id: string) => void;
  onAddSeconds: (id: string, sec: number) => void;
  onFinishTimer: (timer: FreeTimer, recordToLog: boolean) => void;
  onDeleteTimer: (id: string) => void;
  onRestartTimer: (id: string) => void;
}

export const FreeTimerList: React.FC<FreeTimerListProps> = ({
  timers,
  onTogglePause,
  onAddSeconds,
  onFinishTimer,
  onDeleteTimer,
  onRestartTimer,
}) => {
  const [nowSec, setNowSec] = useState(() => Date.now());
  const [confirmDialogTimer, setConfirmDialogTimer] = useState<{
    timer: FreeTimer;
    elapsedMinutes: number;
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowSec(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timers || timers.length === 0) return null;

  return (
    <div className="w-full space-y-2.5">
      {timers.map(t => {
        const isCountdown = t.mode === 'countdown' || t.mode === 'at_time';
        const remainingSec = getFreeTimerRemainingSeconds(t, nowSec);
        const elapsedSec = getFreeTimerElapsedSeconds(t, nowSec);
        const isEnded = isCountdown && remainingSec <= 0 && t.status !== 'paused';
        const elapsedMinutes = Math.max(1, Math.round(elapsedSec / 60));

        // Over 2 hours alert for stopwatch (spec E2.6.3)
        const isStopwatchOver2Hours = !isCountdown && elapsedSec >= 7200;

        return (
          <div
            key={t.id}
            className={`p-3.5 rounded-2xl border transition-all shadow-xs ${
              isEnded
                ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/40'
                : t.status === 'paused'
                ? 'bg-slate-50/80 border-slate-200 opacity-80'
                : 'bg-white border-slate-200'
            }`}
          >
            {/* Top row: Title & Digits */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    isEnded 
                      ? 'bg-amber-500 animate-ping' 
                      : t.status === 'paused' 
                      ? 'bg-slate-400' 
                      : 'bg-emerald-500 animate-pulse'
                  }`} />
                  <h4 className="text-xs font-bold text-slate-900 truncate" title={t.title}>
                    {t.title}
                  </h4>
                </div>
                {t.atTimeStr && (
                  <p className="text-[10px] text-slate-500 ml-3.5">
                    Hẹn lúc {t.atTimeStr}
                  </p>
                )}
              </div>

              {/* Time digits */}
              <div className="text-right shrink-0">
                <span className={`font-mono font-bold text-base sm:text-lg ${
                  isEnded ? 'text-amber-600' : 'text-slate-900'
                }`}>
                  {isCountdown
                    ? isEnded ? '00:00' : formatTimerSeconds(remainingSec)
                    : formatTimerSeconds(elapsedSec)}
                </span>
                <span className="block text-[10px] text-slate-400 font-medium">
                  {isCountdown ? (isEnded ? 'Hết giờ!' : 'còn lại') : 'đang đếm'}
                </span>
              </div>
            </div>

            {/* Warning if stopwatch > 2 hours */}
            {isStopwatchOver2Hours && (
              <div className="mb-2 p-2 rounded-xl bg-orange-50 border border-orange-200 text-[11px] text-orange-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>Bạn còn đang bấm giờ không? (Đã chạy hơn 2 giờ)</span>
              </div>
            )}

            {/* Bottom Controls Row: Pause, +1p, +5p, Restart, Finish, Delete */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-1.5 flex-wrap">
              <div className="flex items-center gap-1">
                {/* Pause / Resume */}
                <button
                  type="button"
                  onClick={() => onTogglePause(t.id)}
                  className="p-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title={t.status === 'paused' ? 'Tiếp tục' : 'Tạm dừng'}
                >
                  {t.status === 'paused' ? (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Tiếp</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3 fill-current" />
                      <span>Dừng</span>
                    </>
                  )}
                </button>

                {/* +1p / +5p for countdown */}
                {isCountdown && (
                  <>
                    <button
                      type="button"
                      onClick={() => onAddSeconds(t.id, 60)}
                      className="p-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                      title="Thêm 1 phút"
                    >
                      +1p
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddSeconds(t.id, 300)}
                      className="p-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                      title="Thêm 5 phút"
                    >
                      +5p
                    </button>
                  </>
                )}

                {/* Restart for ended timers */}
                {isEnded && (
                  <button
                    type="button"
                    onClick={() => onRestartTimer(t.id)}
                    className="p-1.5 px-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Làm lại</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Finish / Xong button */}
                <button
                  type="button"
                  onClick={() => setConfirmDialogTimer({ timer: t, elapsedMinutes })}
                  className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Xong</span>
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onDeleteTimer(t.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Xóa đồng hồ này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Confirmation Dialog: "Ghi X phút '[tên]' vào sổ thời gian?" (spec E2.6.1) */}
      {confirmDialogTimer && (
        <div className="fixed app-overlay-safe z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <BookOpen className="w-4 h-4 text-orange-500" />
              <span>Ghi vào Sổ thời gian?</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có muốn ghi <strong>{confirmDialogTimer.elapsedMinutes} phút</strong> của &ldquo;<strong>{confirmDialogTimer.timer.title}</strong>&rdquo; thành việc hoàn thành hôm nay không?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onFinishTimer(confirmDialogTimer.timer, false);
                  setConfirmDialogTimer(null);
                }}
                className="py-2 px-3.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Bỏ qua
              </button>
              <button
                type="button"
                onClick={() => {
                  onFinishTimer(confirmDialogTimer.timer, true);
                  setConfirmDialogTimer(null);
                }}
                className="py-2 px-4 rounded-xl bg-[#E0401F] hover:bg-[#c93517] text-white text-xs font-bold shadow-xs transition-colors"
              >
                Ghi vào sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
