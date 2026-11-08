import React from 'react';
import { Bell, BellOff, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { ActiveAlarmState } from '../model/alarmTypes';

interface AlarmScreenProps {
  alarmState: ActiveAlarmState;
  onDismiss: () => void;
  onSnooze: (mins?: number) => void;
  onOpenSettings?: () => void;
}

export const AlarmScreen: React.FC<AlarmScreenProps> = ({
  alarmState,
  onDismiss,
  onSnooze,
  onOpenSettings,
}) => {
  if (!alarmState.isActive) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-zinc-950/95 backdrop-blur-xl text-white animate-in fade-in duration-300"
      style={{
        paddingTop: 'calc(var(--sat, 0px) + 24px)',
        paddingBottom: 'calc(var(--sab, 0px) + 32px)',
        paddingLeft: '24px',
        paddingRight: '24px',
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Báo thức bắt đầu khối
        </div>
        <span className="text-zinc-400 text-sm font-mono">{alarmState.startTime || ''}</span>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center text-center my-auto px-4 max-w-md mx-auto">
        {/* Animated Bell Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
            <div className="w-16 h-16 rounded-full bg-amber-500/30 flex items-center justify-center">
              <Bell className="w-9 h-9 text-amber-400 animate-bounce" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
          {alarmState.blockTitle || 'Đến giờ bắt đầu khối thời gian'}
        </h1>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-sm mb-6">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Bắt đầu lúc {alarmState.startTime || 'ngay bây giờ'}</span>
        </div>

        {/* Fallback warning if custom sound file was missing (PRD B32) */}
        {alarmState.isFallbackDefault && alarmState.fallbackReason && (
          <div className="w-full text-left p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs leading-relaxed mb-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-rose-100">{alarmState.fallbackReason}</p>
                {onOpenSettings && (
                  <button
                    onClick={() => {
                      onDismiss();
                      onOpenSettings();
                    }}
                    className="mt-2 text-rose-300 underline font-semibold hover:text-rose-100"
                  >
                    Chọn lại file âm thanh ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
        <button
          onClick={onDismiss}
          className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-zinc-950 font-bold text-base shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
        >
          <BellOff className="w-5 h-5" />
          <span>Vào việc ngay (Tắt chuông)</span>
        </button>

        <button
          onClick={() => onSnooze(5)}
          className="w-full py-3.5 px-6 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:scale-[0.98] text-zinc-300 font-semibold text-sm border border-zinc-800 transition-all flex items-center justify-center gap-2"
        >
          <Clock className="w-4 h-4 text-zinc-400" />
          <span>Báo lại sau 5 phút</span>
        </button>
      </div>
    </div>
  );
};
