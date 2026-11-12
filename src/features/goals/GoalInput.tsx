// TAIO Time App — Goal Quick Input with NLP (PRD B35.2 / v0.3.27)
'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useT } from '../../i18n/useT';
import { parseViGoal, ParsedGoal } from './parsers/vi';
import { parseEnGoal } from './parsers/en';
import { Target, Sparkles, Calendar, Hash, Clock } from 'lucide-react';

export const GoalInput: React.FC = () => {
  const { addGoalWithBackplanning, showToast, language, palette } = useApp();
  const { t } = useT();
  const isCool = palette === 'cool';
  const [text, setText] = useState('');

  const parsed: ParsedGoal | null = useMemo(() => {
    if (text.trim().length < 3) return null;
    return language === 'en' ? parseEnGoal(text) : parseViGoal(text);
  }, [text, language]);

  const handleCreate = () => {
    if (!parsed || !text.trim()) return;

    const progressType = parsed.type === 'key_result'
      ? 'key_result'
      : parsed.type === 'time_commitment'
        ? 'time_commitment'
        : 'tasks';

    const horizonDays = parsed.deadlineRaw ? 90 : 30;

    addGoalWithBackplanning({
      name: parsed.title,
      measurableResult: parsed.type === 'key_result'
        ? `${parsed.target} ${parsed.unit}`
        : parsed.type === 'time_commitment'
          ? `${parsed.duration} phút/${parsed.period || 'ngày'}`
          : parsed.title,
      horizonDays,
      dailyBudgetMins: parsed.duration || 60,
      deadline: parsed.deadlineRaw || (language === 'vi' ? '30 ngày tới' : 'in 30 days'),
      workArea: 'Personal',
      progressType,
      keyResultTarget: parsed.target,
      keyResultUnit: parsed.unit,
      keyResultCurrent: 0,
      commitment: parsed.type === 'time_commitment' && parsed.duration
        ? { minutesPerDay: parsed.duration, days: horizonDays, start: new Date().toISOString().slice(0, 10) }
        : undefined,
    });

    showToast(t('goals.toastCreated'));
    setText('');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
          isCool ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-[#E0401F]'
        }`}>
          <Target className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">{t('goals.newGoalTitle')}</h3>
      </div>

      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && parsed) handleCreate(); }}
        placeholder={t('goals.inputPlaceholder')}
        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
      />

      {/* Live NLP Preview */}
      {parsed && (
        <div className="flex flex-wrap gap-1.5 items-center animate-in fade-in duration-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />

          {/* Type badge */}
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
            parsed.type === 'key_result'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : parsed.type === 'time_commitment'
                ? 'bg-violet-50 text-violet-700 border-violet-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}>
            {parsed.type === 'key_result' && (
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {t('goals.previewTypeKeyResult', { target: parsed.target, unit: parsed.unit })}
              </span>
            )}
            {parsed.type === 'time_commitment' && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t('goals.previewTypeAttendance', { duration: parsed.duration })}
              </span>
            )}
            {parsed.type === 'tasks' && t('goals.previewTypeTasks')}
          </span>

          {/* Deadline badge */}
          {parsed.deadlineRaw && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {t('goals.previewDeadline', { deadline: parsed.deadlineRaw })}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-400">{t('goals.quickAddHint')}</p>
        <button
          type="button"
          onClick={handleCreate}
          disabled={!parsed}
          className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c83515]'
          }`}
        >
          {t('goals.createBtn')}
        </button>
      </div>
    </div>
  );
};
