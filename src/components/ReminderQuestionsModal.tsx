'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  HelpCircle, 
  Compass, 
  Calendar, 
  Target, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  CheckCircle2,
  Filter
} from 'lucide-react';
import { ReminderQuestion } from '../types';

export const ReminderQuestionsModal: React.FC = () => {
  const { 
    reminderQuestions, 
    isQuestionsModalOpen, 
    setIsQuestionsModalOpen,
    activeQuestion,
    setActiveQuestion,
    setCurrentTab,
    setIsSwipeModalOpen
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<'all' | 'today' | 'week' | 'goals'>('all');

  if (!isQuestionsModalOpen) return null;

  const filteredQuestions = reminderQuestions.filter(q => 
    activeCategory === 'all' || q.category === activeCategory
  );

  const handleAction = (q: ReminderQuestion) => {
    setIsQuestionsModalOpen(false);
    if (q.targetScreen === 'swipe_review') {
      setIsSwipeModalOpen(true);
    } else if (q.targetScreen === 'daycard') {
      setCurrentTab('plan');
    } else {
      setCurrentTab(q.targetScreen as any);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E0401F] to-amber-500 flex items-center justify-center shadow-md shadow-red-500/20">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Câu hỏi nhắc việc</h2>
              </div>
              <p className="text-[11px] text-slate-500">
                Những câu hỏi định hướng hành vi đúng thời điểm (Theo Benjamin Franklin & Peter Bregman)
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsQuestionsModalOpen(false)}
            className="text-slate-500 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs: Tất cả | Hôm nay | Tuần này | Mục tiêu lớn */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'Tất cả câu hỏi' },
            { id: 'today', label: '1. Hôm nay' },
            { id: 'week', label: '2. Tuần này' },
            { id: 'goals', label: '3. Mục tiêu lớn' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                activeCategory === tab.id
                  ? 'bg-[#E0401F] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body: List of Questions with Live Answer Cards */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
          {filteredQuestions.map(q => {
            const isSelected = activeQuestion?.id === q.id;
            return (
              <div
                key={q.id}
                onClick={() => setActiveQuestion(q)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isSelected 
                    ? 'bg-slate-50 border-[#E0401F]/50 shadow-md shadow-red-500/10' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                      {q.category === 'today' ? 'Hôm nay' : q.category === 'week' ? 'Tuần này' : 'Mục tiêu lớn'}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-800 pt-1 leading-snug">
                      &quot;{q.text}&quot;
                    </h4>
                  </div>
                </div>

                {/* Answer Card based on user data */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#ff7556] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Dữ liệu thực tế của bạn: </strong>
                    <span>{q.answerSummary}</span>
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="flex items-center justify-end pt-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction(q); }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#E0401F] text-slate-800 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>{q.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
