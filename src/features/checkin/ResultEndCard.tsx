'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Bookmark, 
  Sparkles, 
  AlertCircle,
  X 
} from 'lucide-react';
import type { TimeBlock, DodItem } from '@/types';
import { useT } from '@/i18n/useT';

export interface ResultEndCardProps {
  checkInBlock: TimeBlock;
  waitingCount: number;
  onClose: () => void;
  onAnswer: (
    answer: 'done' | 'continue_later' | 'more_time' | 'remind_10m' | 'stop_here',
    extraMins?: number,
    nextStep?: string
  ) => void;
  onUpdateBlockNotes?: (blockId: string, notes: string) => void;
}

export const ResultEndCard: React.FC<ResultEndCardProps> = ({
  checkInBlock,
  waitingCount,
  onClose,
  onAnswer,
  onUpdateBlockNotes,
}) => {
  const { t } = useT();
  const [showNextStepForm, setShowNextStepForm] = useState<boolean>(false);
  const [nextStepInput, setNextStepInput] = useState<string>('');

  // Reset checklist state whenever checkInBlock.id changes
  const [checklist, setChecklist] = useState<DodItem[]>(() => {
    return (checkInBlock.dodChecklist || []).map(item => ({ ...item }));
  });

  useEffect(() => {
    setChecklist((checkInBlock.dodChecklist || []).map(item => ({ ...item })));
    setShowNextStepForm(false);
    setNextStepInput('');
  }, [checkInBlock.id, checkInBlock.dodChecklist]);

  const toggleCheckItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleSelectAll = () => {
    setChecklist(prev => prev.map(i => ({ ...i, completed: true })));
  };

  const allCriteriaMet = checklist.length > 0 && checklist.every(i => i.completed);

  const hasGoal = Boolean(checkInBlock.goalName && checkInBlock.goalName.trim() && checkInBlock.goalName !== 'Ngoài mục tiêu chính');

  // Handle "Done despite unmet criteria": record missing items into notes
  const handleDoneDespite = () => {
    const missing = checklist.filter(i => !i.completed).map(i => i.text);
    if (missing.length > 0 && onUpdateBlockNotes) {
      const noteAppend = `Chưa đạt tiêu chí: ${missing.join(', ')}`;
      const prevNotes = checkInBlock.notes ? `${checkInBlock.notes} · ` : '';
      onUpdateBlockNotes(checkInBlock.id, `${prevNotes}${noteAppend}`);
    }
    onAnswer('done');
  };

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

        {/* Criteria Checklist Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 my-4 space-y-3">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            {t('checkin.dod_label', 'Tiêu chí hoàn thành')}
          </label>

          <div className="space-y-2">
            {checklist.map((item) => (
              <div 
                key={item.id}
                onClick={() => toggleCheckItem(item.id)}
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  item.completed 
                    ? 'bg-emerald-50 border-emerald-500/50 text-emerald-800' 
                    : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-400'
                }`}>
                  {item.completed && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className={`text-xs font-medium ${item.completed ? 'line-through text-slate-500' : ''}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end text-[11px] text-slate-500 pt-1">
            <button 
              onClick={handleSelectAll}
              className="text-orange-500 hover:underline font-semibold"
            >
              {t('checkin.select_all', 'Chọn tất cả')}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        {!showNextStepForm ? (
          <div className="space-y-2.5">
            {/* Primary: Done (active when allCriteriaMet) */}
            <button
              onClick={() => {
                if (allCriteriaMet) onAnswer('done');
              }}
              disabled={!allCriteriaMet}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-between transition-all ${
                allCriteriaMet
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('checkin.done', 'Xong')}</span>
              </div>
              <span className="text-[11px]">
                {allCriteriaMet ? 'Đạt toàn bộ tiêu chí ✓' : 'Tích chọn để hoàn tất'}
              </span>
            </button>

            {/* Alternative: Done despite unmet criteria */}
            {!allCriteriaMet && (
              <button
                onClick={handleDoneDespite}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('checkin.done_despite', 'Xong dù chưa đủ tiêu chí')}</span>
              </button>
            )}

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
          /* Form for "Continue later" */
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
      </div>
    </div>
  );
};
