'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Bookmark, 
  Sparkles, 
  X,
  Footprints
} from 'lucide-react';
import type { TimeBlock } from '@/types';
import { useT } from '@/i18n/useT';
import { MotivationSticker } from '@/features/motivation';

export interface TimeboxEndCardProps {
  checkInBlock: TimeBlock;
  waitingCount: number;
  onClose: () => void;
  onAnswer: (
    answer: 'done' | 'continue_later' | 'more_time' | 'remind_10m' | 'stop_here',
    extraMins?: number,
    nextStep?: string
  ) => void;
}

export const TimeboxEndCard: React.FC<TimeboxEndCardProps> = ({
  checkInBlock,
  waitingCount,
  onClose,
  onAnswer,
}) => {
  const { t } = useT();
  const [showNextStepForm, setShowNextStepForm] = useState<boolean>(false);
  const [nextStepInput, setNextStepInput] = useState<string>('');

  const hasGoal = Boolean(checkInBlock.goalName && checkInBlock.goalName.trim() && checkInBlock.goalName !== 'Ngoài mục tiêu chính');

  return (
    <div className="fixed app-bottom-sheet-safe z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl p-6 text-slate-900 border-t border-orange-500/30 sm:border">
        {/* Kicker */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100/80 mb-3">
          <span className="text-xs text-slate-500">
            {t('checkin.kicker', {
              start: checkInBlock.startTime,
              end: checkInBlock.endTime,
              count: waitingCount,
              defaultValue: `Khung giờ đã kết thúc ${checkInBlock.startTime} - ${checkInBlock.endTime} · Còn ${waitingCount} việc chờ`,
            })}
          </span>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
          {checkInBlock.title}
        </h3>

        {/* Goal context line - only when linked goal exists */}
        {hasGoal && (
          <p className="text-xs text-orange-500 font-semibold mt-1 mb-4 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {t('checkin.goal_serving', {
                goal: checkInBlock.goalName,
                defaultValue: `Mục tiêu phục vụ: ${checkInBlock.goalName}`,
              })}
            </span>
          </p>
        )}

        <div className={hasGoal ? '' : 'mt-4'} />

        {/* PRD FIX v0.3.30 Part B3.5: Gợi ý nghỉ khi làm việc dài >= 90 phút */}
        {(checkInBlock.estimatedMinutes || 60) >= 90 && (
          <div className="mb-3.5 p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2.5">
            <Footprints className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">
              Bạn đã ngồi {checkInBlock.estimatedMinutes || 90} phút. Đứng dậy đi lại 5 phút?
            </span>
          </div>
        )}

        {/* Action buttons */}
        {!showNextStepForm ? (
          <div className="space-y-2.5">
            {/* Primary: Done right away */}
            <button
              onClick={() => onAnswer('done')}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-between transition-all bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('checkin.done', 'Xong')}</span>
              </div>
              <span className="text-[11px] opacity-90">✓</span>
            </button>

            {/* Secondary: Not done: continue later */}
            <button
              onClick={() => setShowNextStepForm(true)}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100/80 hover:bg-slate-200 text-slate-800 border border-slate-200/60 text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span>{t('checkin.continue_later', 'Chưa xong: làm tiếp sau')}</span>
              <span className="text-[11px] text-orange-500">Ghi bước kế tiếp ↗</span>
            </button>

            {/* Tertiary: +15 minutes & Remind in 10 minutes */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAnswer('more_time', 15)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('checkin.more_time', 'Cần thêm +15 phút')}</span>
              </button>

              <button
                onClick={() => onAnswer('remind_10m')}
                className="px-3 py-2.5 text-xs text-slate-500 hover:text-slate-900 hover:underline transition-all"
              >
                {t('checkin.remind_10m', 'Nhắc lại sau 10 phút')}
              </button>
            </div>
          </div>
        ) : (
          /* Form for "Continue later" (Zeigarnik Effect Reduction) */
          <div className="space-y-3 p-4 rounded-2xl bg-orange-50 border border-orange-500/30 animate-in fade-in duration-200">
            <div>
              <label className="text-xs font-bold text-orange-800 block mb-1 flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-orange-500" />
                <span>{t('checkin.next_step_label', 'Bước kế tiếp cụ thể là gì?')}</span>
              </label>
              <input
                type="text"
                autoFocus
                value={nextStepInput}
                onChange={e => setNextStepInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    onAnswer('continue_later', 0, nextStepInput || 'Làm tiếp việc dang dở');
                  }
                }}
                placeholder={t('checkin.next_step_placeholder', 'VD: Cần chỉnh xong bảng phân tích số liệu mục 2...')}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowNextStepForm(false)}
                className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 text-xs"
              >
                {t('common.cancel', 'Hủy')}
              </button>
              <button
                onClick={() => onAnswer('continue_later', 0, nextStepInput || 'Làm tiếp việc dang dở')}
                className="flex-1 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md"
              >
                {t('checkin.save_next_step', 'Lưu bước kế tiếp & Dừng an toàn')}
              </button>
            </div>
          </div>
        )}
        {/* PRD FEATURE v0.3.31 B4: Motivation line quote */}
        <MotivationSticker slotKey="task_done" context="done" size="line" className="mt-3" />
      </div>
    </div>
  );
};
