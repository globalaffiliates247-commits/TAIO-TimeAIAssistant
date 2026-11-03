'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Sparkles, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Layers, 
  Target, 
  Zap,
  RotateCcw
} from 'lucide-react';
import { BacklogCard } from '../types';

export const SwipeReviewModal: React.FC = () => {
  const { 
    backlogCards, 
    isSwipeModalOpen, 
    setIsSwipeModalOpen,
    handleSwipeAction,
    goals
  } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCards, setSessionCards] = useState<BacklogCard[]>([]);
  const [sessionHistory, setSessionHistory] = useState<Array<{ card: BacklogCard; action: 'plan' | 'later' | 'done_now' | 'drop' }>>([]);
  
  // 3-step planning state for current card
  const [isPlanningStep, setIsPlanningStep] = useState(false);
  const [planDuration, setPlanDuration] = useState<number>(30);
  const [planDeadline, setPlanDeadline] = useState<string>('Hôm nay');
  const [planGoalId, setPlanGoalId] = useState<string>('');

  // Initialize 5 cards on open
  React.useEffect(() => {
    if (isSwipeModalOpen) {
      const deck = backlogCards.slice(0, 5);
      setSessionCards(deck);
      setCurrentIndex(0);
      setSessionHistory([]);
      setIsPlanningStep(false);
    }
  }, [isSwipeModalOpen, backlogCards]);

  if (!isSwipeModalOpen) return null;

  const currentCard = sessionCards[currentIndex];
  const isSessionFinished = currentIndex >= sessionCards.length || !currentCard;

  const handleAction = (action: 'plan' | 'later' | 'done_now' | 'drop') => {
    if (!currentCard) return;

    if (action === 'plan') {
      setIsPlanningStep(true);
      setPlanGoalId(currentCard.goalId || goals[0]?.id || '');
      setPlanDuration(currentCard.estimatedMinutes || 30);
      return;
    }

    handleSwipeAction(currentCard.id, action);
    setSessionHistory(prev => [...prev, { card: currentCard, action }]);
    setCurrentIndex(prev => prev + 1);
  };

  const submitPlan = () => {
    if (!currentCard) return;
    handleSwipeAction(currentCard.id, 'plan', {
      durationMins: planDuration,
      deadline: planDeadline,
      goalId: planGoalId,
    });
    setSessionHistory(prev => [...prev, { card: currentCard, action: 'plan' }]);
    setIsPlanningStep(false);
    setCurrentIndex(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E0401F] to-amber-500 flex items-center justify-center shadow-md shadow-red-500/20">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Thẻ nhắc việc</h2>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-[#ff7556] border border-red-500/30">
                  B28
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Lướt rổ tồn đọng • Phiên 5 thẻ theo phương pháp Spaced Repetition
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsSwipeModalOpen(false)}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 flex flex-col items-center">
          
          {!isSessionFinished ? (
            <div className="w-full space-y-4">
              
              {/* Progress counter */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Thẻ {currentIndex + 1} / {sessionCards.length}</span>
                <span className="text-[11px] text-amber-400/90 font-medium">
                  {currentCard.whyThisCard}
                </span>
              </div>

              {!isPlanningStep ? (
                /* The Main Swipe Card */
                <div className="w-full min-h-[260px] p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900 border border-slate-700/80 shadow-xl flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {currentCard.type === 'inbox' ? 'Rổ việc' : currentCard.type === 'idea' ? 'Ý tưởng' : 'Nhiệm vụ'}
                      </span>
                      {currentCard.goalName && (
                        <span className="text-[10px] font-semibold text-[#ff7556] flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {currentCard.goalName}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {currentCard.text}
                    </h3>

                    {currentCard.note && (
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                        {currentCard.note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Ước tính: {currentCard.estimatedMinutes || 15}p
                    </span>
                    <span>Tồn đọng: {currentCard.ageDays} ngày</span>
                  </div>
                </div>
              ) : (
                /* 3-Step Planning Form (PRD B28) */
                <div className="w-full p-5 rounded-2xl bg-slate-900 border border-[#E0401F]/40 shadow-xl space-y-4 animate-in fade-in">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Lên lịch 3 bước cho: &quot;{currentCard.text}&quot;
                    </h4>
                  </div>

                  {/* Step 1: Duration */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                      1. Thời lượng dự kiến:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      {[15, 30, 60, 90].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setPlanDuration(mins)}
                          className={`py-1.5 rounded-lg border font-medium ${
                            planDuration === mins 
                              ? 'bg-[#E0401F] text-white border-[#E0401F]' 
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {mins}p
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Deadline */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                      2. Hạn chót:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {['Hôm nay', 'Ngày mai', 'Tuần này'].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setPlanDeadline(d)}
                          className={`py-1.5 rounded-lg border font-medium ${
                            planDeadline === d 
                              ? 'bg-[#E0401F] text-white border-[#E0401F]' 
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Goal */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                      3. Thuộc mục tiêu lớn:
                    </label>
                    <select
                      value={planGoalId}
                      onChange={(e) => setPlanGoalId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      {goals.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPlanningStep(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={submitPlan}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#E0401F] hover:bg-[#c83515] rounded-xl shadow-lg shadow-red-500/25"
                    >
                      Xếp vào lịch Kế hoạch
                    </button>
                  </div>
                </div>
              )}

              {/* 4 Actions Buttons (PRD B28) */}
              {!isPlanningStep && (
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {/* Later (Swipe Left) */}
                  <button
                    onClick={() => handleAction('later')}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1 transition-all group"
                  >
                    <ArrowLeft className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-bold">Để sau</span>
                  </button>

                  {/* Plan (Swipe Right) */}
                  <button
                    onClick={() => handleAction('plan')}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1 transition-all group"
                  >
                    <ArrowRight className="w-5 h-5 text-sky-400 group-hover:translate-x-1 transition-transform" />
                    <span className="text-[10px] font-bold">Lên lịch</span>
                  </button>

                  {/* Do Now 2min (Swipe Up) */}
                  <button
                    onClick={() => handleAction('done_now')}
                    className="p-3 rounded-2xl bg-[#E0401F]/15 border border-[#E0401F]/40 hover:bg-[#E0401F]/30 text-white flex flex-col items-center justify-center gap-1 transition-all group shadow-md shadow-red-500/10"
                  >
                    <ArrowUp className="w-5 h-5 text-[#ff7556] group-hover:-translate-y-1 transition-transform" />
                    <span className="text-[10px] font-bold">Làm ngay 2p</span>
                  </button>

                  {/* Drop (Trash) */}
                  <button
                    onClick={() => handleAction('drop')}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-700/80 hover:bg-red-950/40 text-slate-400 hover:text-red-400 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Bỏ qua</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Session Completed Summary (PRD B28) */
            <div className="w-full text-center py-6 space-y-5 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Hoàn thành phiên lướt rổ!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Đã rà soát xong 5 thẻ tồn đọng theo đúng phương pháp Spaced Repetition.
                </p>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Đã lên lịch</span>
                  <p className="text-base font-bold text-sky-400">
                    {sessionHistory.filter(h => h.action === 'plan').length} việc
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Làm ngay 2 phút</span>
                  <p className="text-base font-bold text-emerald-400">
                    {sessionHistory.filter(h => h.action === 'done_now').length} việc
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Để sau (Spaced)</span>
                  <p className="text-base font-bold text-amber-400">
                    {sessionHistory.filter(h => h.action === 'later').length} việc
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Đã bỏ bớt</span>
                  <p className="text-base font-bold text-slate-400">
                    {sessionHistory.filter(h => h.action === 'drop').length} việc
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsSwipeModalOpen(false)}
                  className="w-full py-3 rounded-xl bg-[#E0401F] hover:bg-[#c83515] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-red-500/25"
                >
                  Xong & Quay lại làm việc
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
