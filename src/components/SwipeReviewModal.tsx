'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  Trash2, 
  CheckCircle2, 
  Layers, 
  Target,
  Zap
} from 'lucide-react';
import { BacklogCard } from '../types';

export const SwipeReviewModal: React.FC = () => {
  const { 
    backlogCards, 
    isSwipeModalOpen, 
    setIsSwipeModalOpen,
    handleSwipeAction,
    goals,
    palette
  } = useApp();

  const isCool = palette === 'cool';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCards, setSessionCards] = useState<BacklogCard[]>([]);
  const [sessionHistory, setSessionHistory] = useState<Array<{ card: BacklogCard; action: 'plan' | 'later' | 'done_now' | 'drop' }>>([]);
  
  // 3-step planning state for current card
  const [isPlanningStep, setIsPlanningStep] = useState(false);
  const [planDuration, setPlanDuration] = useState<number>(30);
  const [planDeadline, setPlanDeadline] = useState<string>('Hôm nay');
  const [planGoalId, setPlanGoalId] = useState<string>('');

  // B28 v0.3.11: Real Tinder-style swipe gesture state
  const cardRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const [dragX, setDragX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Initialize 5 cards on open
  React.useEffect(() => {
    if (isSwipeModalOpen) {
      const deck = backlogCards.slice(0, 5);
      setSessionCards(deck);
      setCurrentIndex(0);
      setSessionHistory([]);
      setIsPlanningStep(false);
      setDragX(0);
    }
  }, [isSwipeModalOpen]);

  if (!isSwipeModalOpen) return null;

  const currentCard = sessionCards[currentIndex];
  const isSessionFinished = currentIndex >= sessionCards.length || !currentCard;

  const handleAction = (action: 'plan' | 'later' | 'done_now' | 'drop') => {
    if (!currentCard) return;
    setDragX(0);

    if (action === 'plan') {
      setIsPlanningStep(true);
      setPlanGoalId(currentCard.goalId || goals[0]?.id || '');
      setPlanDuration(currentCard.estimatedMinutes || 30);
      return;
    }

    handleSwipeAction(currentCard.id, action);
    setSessionHistory(prev => [...prev, { card: currentCard, action }]);
    if (action !== 'done_now') {
      setCurrentIndex(prev => prev + 1);
    }
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

  // Pointer / Touch handlers for Tinder-like swipe
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    setDragX(dx);
  };

  const onPointerEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const width = cardRef.current?.offsetWidth || 320;
    const threshold = width * 0.3; // 30% of card width

    if (dragX <= -threshold) {
      // Swipe Left = Để sau
      handleAction('later');
    } else if (dragX >= threshold) {
      // Swipe Right = Lên lịch
      handleAction('plan');
    } else if (Math.abs(dragX) < 8) {
      // Tap the card = Làm ngay (starts timer + 3-second undo toast)
      handleAction('done_now');
    } else {
      setDragX(0);
    }
    startXRef.current = null;
    startYRef.current = null;
  };

  const cardWidth = cardRef.current?.offsetWidth || 320;
  const swipeRatio = dragX / cardWidth;
  const tiltDeg = Math.max(-15, Math.min(15, swipeRatio * 25));
  const showLeftLabel = swipeRatio <= -0.3;
  const showRightLabel = swipeRatio >= 0.3;

  return (
    <div
      style={{ touchAction: 'none' }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        style={{ overscrollBehavior: 'contain' }}
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs ${
              isCool ? 'bg-blue-600' : 'bg-[#E0401F]'
            }`}>
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Thẻ nhắc việc</h2>
              <p className="text-[11px] text-slate-500">
                Vuốt trái: Để sau • Vuốt phải: Lên lịch • Chạm thẻ: Làm ngay
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsSwipeModalOpen(false)}
            className="text-slate-500 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 flex flex-col items-center">
          {!isSessionFinished ? (
            <div className="w-full space-y-4">
              {/* Progress counter */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Thẻ {currentIndex + 1} / {sessionCards.length}</span>
                <span className="text-[11px] text-amber-700 font-medium">
                  Vì sao thẻ này: {currentCard.whyThisCard}
                </span>
              </div>

              {!isPlanningStep ? (
                /* B28 v0.3.11: Interactive Tinder-style Swipe Card */
                <div
                  ref={cardRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerEnd}
                  onPointerCancel={() => { setIsDragging(false); setDragX(0); }}
                  style={{
                    transform: `translateX(${dragX}px) rotate(${tiltDeg}deg)`,
                    transition: isDragging ? 'none' : 'transform 200ms ease',
                    touchAction: 'none',
                  }}
                  className="relative select-none cursor-grab active:cursor-grabbing w-full min-h-[250px] p-6 rounded-2xl bg-white border border-slate-200 shadow-lg flex flex-col justify-between space-y-4"
                >
                  {/* Threshold Swipe Labels (> 30% width) */}
                  {showLeftLabel && (
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-xl bg-amber-100 border-2 border-amber-500 text-amber-800 font-black text-xs uppercase tracking-wider shadow-sm">
                      ← Để sau
                    </div>
                  )}
                  {showRightLabel && (
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-xl bg-emerald-100 border-2 border-emerald-500 text-emerald-800 font-black text-xs uppercase tracking-wider shadow-sm">
                      Lên lịch →
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {currentCard.type === 'inbox' ? 'Rổ việc' : currentCard.type === 'idea' ? 'Ý tưởng' : 'Nhiệm vụ'}
                      </span>
                      {currentCard.goalName && (
                        <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                          isCool ? 'text-blue-600' : 'text-[#E0401F]'
                        }`}>
                          <Target className="w-3 h-3" />
                          {currentCard.goalName}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {currentCard.text}
                    </h3>

                    {currentCard.note && (
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {currentCard.note}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Ước tính: {currentCard.estimatedMinutes || 15}p
                      </span>
                      <span>Tồn đọng: {currentCard.ageDays} ngày</span>
                    </div>
                    <p className={`text-[11px] font-semibold flex items-center justify-center gap-1 pt-1 ${
                      isCool ? 'text-blue-600' : 'text-[#E0401F]'
                    }`}>
                      <Zap className="w-3 h-3" />
                      <span>Chạm vào thẻ để Làm ngay (có Hoàn tác 3 giây)</span>
                    </p>
                  </div>
                </div>
              ) : (
                /* 3-Step Planning Form */
                <div className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-lg space-y-4 animate-in fade-in">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Lên lịch 3 bước cho: &quot;{currentCard.text}&quot;
                    </h4>
                  </div>

                  {/* Step 1: Duration */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                      1. Thời lượng dự kiến:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {[
                        { label: '2p (Làm ngay)', val: 2 },
                        { label: '15p', val: 15 },
                        { label: '30p', val: 30 },
                        { label: '1 giờ', val: 60 },
                        { label: 'Nửa buổi', val: 180 },
                        { label: 'Chưa rõ', val: 25 },
                      ].map(opt => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => {
                            if (opt.val === 2) {
                              setIsPlanningStep(false);
                              handleAction('done_now');
                              return;
                            }
                            setPlanDuration(opt.val);
                          }}
                          className={`py-1.5 px-2 rounded-lg border font-medium ${
                            planDuration === opt.val 
                              ? (isCool ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#E0401F] text-white border-[#E0401F]')
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Deadline */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                      2. Hạn chót:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {['Hôm nay', 'Chọn ngày', 'Không có'].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setPlanDeadline(d)}
                          className={`py-1.5 rounded-lg border font-medium ${
                            planDeadline === d 
                              ? (isCool ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#E0401F] text-white border-[#E0401F]')
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Goal */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                      3. Thuộc mục tiêu lớn:
                    </label>
                    <select
                      value={planGoalId}
                      onChange={(e) => setPlanGoalId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                    >
                      {goals.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                      <option value="">Ngoài mục tiêu lớn</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPlanningStep(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={submitPlan}
                      className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm ${
                        isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c83515]'
                      }`}
                    >
                      Xếp vào lịch
                    </button>
                  </div>
                </div>
              )}

              {/* B28 v0.3.11: Two arrow buttons (Left = Để sau, Right = Lên lịch) + small trash button (Bỏ hẳn) */}
              {!isPlanningStep && (
                <div className="flex items-center justify-between gap-2.5 pt-2">
                  <button
                    onClick={() => handleAction('later')}
                    className="flex-1 py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 flex items-center justify-center gap-2 transition-all font-bold text-xs"
                  >
                    <ArrowLeft className="w-4 h-4 text-amber-600" />
                    <span>Để sau</span>
                  </button>

                  <button
                    onClick={() => handleAction('drop')}
                    className="p-3 rounded-2xl bg-white border border-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center gap-1 transition-all text-xs font-semibold"
                    title="Bỏ hẳn"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-[11px]">Bỏ hẳn</span>
                  </button>

                  <button
                    onClick={() => handleAction('plan')}
                    className={`flex-1 py-3 px-4 rounded-2xl text-white flex items-center justify-center gap-2 transition-all font-bold text-xs shadow-sm ${
                      isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c83515]'
                    }`}
                  >
                    <span>Lên lịch</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Session Completed Summary */
            <div className="w-full text-center py-6 space-y-5 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Hoàn thành phiên Thẻ nhắc việc!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đã rà soát xong 5 thẻ tồn đọng. Sẵn sàng quay lại công việc chính.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500">Đã lên lịch</span>
                  <p className="text-base font-bold text-slate-900">
                    {sessionHistory.filter(h => h.action === 'plan').length} việc
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500">Làm ngay</span>
                  <p className="text-base font-bold text-emerald-700">
                    {sessionHistory.filter(h => h.action === 'done_now').length} việc
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500">Để sau</span>
                  <p className="text-base font-bold text-amber-700">
                    {sessionHistory.filter(h => h.action === 'later').length} việc
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500">Đã bỏ hẳn</span>
                  <p className="text-base font-bold text-slate-600">
                    {sessionHistory.filter(h => h.action === 'drop').length} việc
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsSwipeModalOpen(false)}
                  className={`w-full py-3 rounded-xl text-white font-bold text-xs tracking-wider uppercase transition-all shadow-sm ${
                    isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c83515]'
                  }`}
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
