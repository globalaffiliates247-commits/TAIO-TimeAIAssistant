'use client';

import React, { useState } from 'react';
import { Clock, Calendar, ArrowRight, X, AlertTriangle, SunMedium } from 'lucide-react';
import type { TimeBlock } from '@/types';

export interface SnoozeOption {
  type: 'minutes' | 'after_task' | 'specific_time' | 'tomorrow_morning' | 'drop' | 'defer_tomorrow';
  minutes?: number;
  timeStr?: string;
}

export interface SnoozePickerProps {
  taskId?: string;
  isDayClose?: boolean;
  activeRunningTask?: TimeBlock;
  snoozeCount?: number;
  language?: 'vi' | 'en';
  onSnooze: (option: SnoozeOption) => void;
  onClose?: () => void;
}

export const SnoozePicker: React.FC<SnoozePickerProps> = ({
  isDayClose = false,
  activeRunningTask,
  snoozeCount = 0,
  language = 'vi',
  onSnooze,
  onClose,
}) => {
  const [showCustomTime, setShowCustomTime] = useState(false);
  const now = new Date();
  const defaultHour = String((now.getHours() + 1) % 24).padStart(2, '0');
  const defaultMinute = String(now.getMinutes()).padStart(2, '0');
  const [customTime, setCustomTime] = useState(`${defaultHour}:${defaultMinute}`);

  const isOverSnoozed = snoozeCount >= 3;

  return (
    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-3 text-slate-800 text-xs animate-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="font-bold text-slate-900 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>{language === 'vi' ? 'Dời thời gian nhắc' : 'Snooze Reminder'}</span>
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Suggested warning if snoozed >= 3 times */}
      {isOverSnoozed && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
          <div className="flex items-start gap-1.5 text-amber-900 text-[11px] font-medium leading-relaxed">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              {language === 'vi'
                ? `Việc này đã dời ${snoozeCount} lần hôm nay. Bạn có muốn đổi kế hoạch?`
                : `Snoozed ${snoozeCount} times today. Want to adjust your plan?`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => onSnooze({ type: 'defer_tomorrow' })}
              className="flex-1 py-1 px-2 rounded-lg bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-900 font-bold text-[11px] transition-colors"
            >
              {language === 'vi' ? 'Để mai' : 'Postpone'}
            </button>
            <button
              type="button"
              onClick={() => onSnooze({ type: 'drop' })}
              className="flex-1 py-1 px-2 rounded-lg bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 font-bold text-[11px] transition-colors"
            >
              {language === 'vi' ? 'Bỏ việc' : 'Drop'}
            </button>
          </div>
        </div>
      )}

      {/* Quick minute intervals */}
      <div className="grid grid-cols-3 gap-1.5">
        {[10, 30, 60].map((mins) => (
          <button
            key={mins}
            type="button"
            onClick={() => onSnooze({ type: 'minutes', minutes: mins })}
            className="py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 font-bold text-slate-800 text-center transition-colors active:scale-95"
          >
            {mins < 60 ? `+${mins}p` : (language === 'vi' ? '+1 giờ' : '+1h')}
          </button>
        ))}
      </div>

      {/* After active running task */}
      {activeRunningTask && (
        <button
          type="button"
          onClick={() => onSnooze({ type: 'after_task' })}
          className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between text-xs font-medium text-slate-700 transition-colors"
        >
          <span className="truncate">
            {language === 'vi' ? 'Sau việc đang làm' : 'After current task'}
            {activeRunningTask.endTime ? ` (${activeRunningTask.endTime})` : ''}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>
      )}

      {/* Day Close Special Option: Sáng mai */}
      {isDayClose && (
        <button
          type="button"
          onClick={() => onSnooze({ type: 'tomorrow_morning' })}
          className="w-full py-2 px-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 text-amber-900 font-semibold flex items-center justify-between text-xs transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <SunMedium className="w-3.5 h-3.5 text-amber-600" />
            <span>{language === 'vi' ? 'Sáng mai (xử lý khi bắt đầu ngày)' : 'Tomorrow morning (handle in morning routine)'}</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        </button>
      )}

      {/* Custom time picker */}
      {!showCustomTime ? (
        <button
          type="button"
          onClick={() => setShowCustomTime(true)}
          className="w-full py-1.5 px-3 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-center text-xs font-medium transition-colors"
        >
          {language === 'vi' ? 'Chọn giờ cụ thể…' : 'Pick specific time…'}
        </button>
      ) : (
        <div className="pt-1 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={() => {
                if (customTime) {
                  onSnooze({ type: 'specific_time', timeStr: customTime });
                }
              }}
              className="py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors"
            >
              {language === 'vi' ? 'Xác nhận' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
