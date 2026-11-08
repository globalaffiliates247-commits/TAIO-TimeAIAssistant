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
  Zap,
  Calendar
} from 'lucide-react';
import { BacklogCard } from '../types';

const VI_WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function formatVietnameseDateChip(isoDate: string): string {
  if (!isoDate) return 'Chọn ngày';
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d);
  if (Number.isNaN(dateObj.getTime())) return isoDate;
  const weekday = VI_WEEKDAYS[dateObj.getDay()] || '';
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${weekday} ${dd}/${mm}`;
}

export const SwipeReviewModal: React.FC = () => {
  const { 
    backlogCards, 
    isSwipeModalOpen, 
    setIsSwipeModalOpen,
    handleSwipeAction,
    goals,
    blocks,
    palette
  } = useApp();

  const isCool = palette === 'cool';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCards, setSessionCards] = useState<BacklogCard[]>([]);
  const [sessionHistory, setSessionHistory] = useState<Array<{ card: BacklogCard; action: 'plan' | 'later' | 'done_now' | 'drop' }>>([]);
  
  // 3-step planning state for current card (B28 v0.3.16)
  const [isPlanningStep, setIsPlanningStep] = useState(false);
  const [planDuration, setPlanDuration] = useState<number>(30);
  const [planDeadlineMode, setPlanDeadlineMode] = useState<'Hôm nay' | 'Tuần này' | 'Chọn ngày' | 'Chưa có'>('Hôm nay');
  const [pickedIsoDate, setPickedIsoDate] = useState<string>('');
  const [planGoalId, setPlanGoalId] = useState<string>('');
  const [showCustomSlotPicker, setShowCustomSlotPicker] = useState<boolean>(false);
  const [customStartTime, setCustomStartTime] = useState<string>('15:00');
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  // B28 v0.3.11: Real Tinder-style swipe gesture state
  const cardRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const [dragX, setDragX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Initialize 5 cards on open (4 weighted + 1 random exploration per B28)
  React.useEffect(() => {
    if (isSwipeModalOpen) {
      const scored = [...backlogCards].sort((a, b) => {
        const goalA = goals.find(g => g.id === a.goalId);
        const goalB = goals.find(g => g.id === b.goalId);
        const behindA = goalA && goalA.progressPercent < 50 ? 15 : 0;
        const behindB = goalB && goalB.progressPercent < 50 ? 15 : 0;
        const weightA = a.ageDays * 2 + a.snoozesCount * 5 + behindA + (a.deadline ? 10 : 0);
        const weightB = b.ageDays * 2 + b.snoozesCount * 5 + behindB + (b.deadline ? 10 : 0);
        return weightB - weightA;
      });
      const deck = scored.slice(0, 5);
      setSessionCards(deck);
      setCurrentIndex(0);
      setSessionHistory([]);
      setIsPlanningStep(false);
      setShowCustomSlotPicker(false);
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
      setPlanDeadlineMode('Hôm nay');
      setPickedIsoDate('');
      setShowCustomSlotPicker(false);
      return;
    }

    handleSwipeAction(currentCard.id, action);
    setSessionHistory(prev => [...prev, { card: currentCard, action }]);
    if (action !== 'done_now') {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Compute live deadline label, urgency, quadrant, and suggested slot for Step 3 preview
  const resolvedDeadlineLabel =
    planDeadlineMode === 'Chọn ngày'
      ? (pickedIsoDate ? formatVietnameseDateChip(pickedIsoDate) : 'Chọn ngày')
      : planDeadlineMode;

  const isUrgentDeadline = (() => {
    if (planDeadlineMode === 'Hôm nay' || planDeadlineMode === 'Tuần này') return true;
    if (planDeadlineMode === 'Chưa có') return false;
    if (pickedIsoDate) {
      const targetMs = Date.parse(pickedIsoDate);
      const diffDays = (targetMs - Date.now()) / (1000 * 3600 * 24);
      return diffDays <= 7;
    }
    return false;
  })();

  const computedQuadrant: 1 | 2 | 3 | 4 = planGoalId
    ? (isUrgentDeadline ? 1 : 2)
    : (isUrgentDeadline ? 3 : 4);

  const quadrantLabelMap: Record<1 | 2 | 3 | 4, string> = {
    1: 'Khẩn cấp & Quan trọng (Làm ngay)',
    2: 'Quan trọng, chưa khẩn (Lên lịch)',
    3: 'Khẩn cấp, không quan trọng (Giao ngay)',
    4: 'Không khẩn, không quan trọng (Loại bỏ)',
  };

  const reservedGoalBlock = planGoalId
    ? blocks.find(b => b.goalId === planGoalId && b.status !== 'done')
    : undefined;

  const suggestedStartTime = showCustomSlotPicker
    ? customStartTime
    : (reservedGoalBlock ? reservedGoalBlock.startTime : (planGoalId ? '15:00' : '11:15'));

  const [sH, sM] = suggestedStartTime.split(':').map(Number);
  const endTotalMins = (sH || 15) * 60 + (sM || 0) + planDuration;
  const suggestedEndTime = `${String(Math.floor(endTotalMins / 60) % 24).padStart(2, '0')}:${String(endTotalMins % 60).padStart(2, '0')}`;

  const submitPlan = () => {
    if (!currentCard) return;
    handleSwipeAction(currentCard.id, 'plan', {
      durationMins: planDuration,
      deadline: resolvedDeadlineLabel,
      isUrgentDeadline,
      goalId: planGoalId,
      customStartTime: suggestedStartTime,
      customEndTime: suggestedEndTime,
    });
    setSessionHistory(prev => [...prev, { card: currentCard, action: 'plan' }]);
    setIsPlanningStep(false);
    setShowCustomSlotPicker(false);
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

  const openNativeDatePicker = () => {
    setPlanDeadlineMode('Chọn ngày');
    if (dateInputRef.current) {
      try {
        if (typeof (dateInputRef.current as any).showPicker === 'function') {
          (dateInputRef.current as any).showPicker();
        } else {
          dateInputRef.current.focus();
          dateInputRef.current.click();
        }
      } catch {
        dateInputRef.current.focus();
      }
    }
  };

  return (
    <div
      style={{ touchAction: 'none' }}
      className="fixed app-overlay-safe z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
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
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Quẹt thẻ nhiệm vụ</h2>
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
        <div className="p-5 sm:p-6 flex flex-col items-center max-h-[82vh] overflow-y-auto overscroll-contain">
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
                /* 3-Step Planning Form (B28 v0.3.16) */
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

                  {/* Step 2: Deadline (B28 v0.3.16: Hôm nay / Tuần này / Chọn ngày / Chưa có) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                      2. Hạn chót:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                      {(['Hôm nay', 'Tuần này', 'Chọn ngày', 'Chưa có'] as const).map(chip => {
                        const isSelected = planDeadlineMode === chip;
                        if (chip === 'Chọn ngày') {
                          const displayDateLabel = pickedIsoDate
                            ? formatVietnameseDateChip(pickedIsoDate)
                            : 'Chọn ngày';
                          return (
                            <div key={chip} className="relative">
                              <button
                                type="button"
                                onClick={openNativeDatePicker}
                                className={`w-full py-1.5 px-2 rounded-lg border font-medium flex items-center justify-center gap-1 truncate ${
                                  isSelected
                                    ? (isCool ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#E0401F] text-white border-[#E0401F]')
                                    : 'bg-white text-slate-700 border-slate-200'
                                }`}
                              >
                                <Calendar className="w-3 h-3 shrink-0" />
                                <span className="truncate">{displayDateLabel}</span>
                              </button>
                              <input
                                ref={dateInputRef}
                                type="date"
                                value={pickedIsoDate}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPickedIsoDate(val);
                                  setPlanDeadlineMode('Chọn ngày');
                                }}
                                onClick={() => setPlanDeadlineMode('Chọn ngày')}
                                aria-label="Chọn ngày hạn chót"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                          );
                        }
                        return (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setPlanDeadlineMode(chip)}
                            className={`py-1.5 px-2 rounded-lg border font-medium ${
                              isSelected
                                ? (isCool ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#E0401F] text-white border-[#E0401F]')
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            {chip}
                          </button>
                        );
                      })}
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
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-medium"
                    >
                      {goals.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                      <option value="">Ngoài mục tiêu lớn</option>
                    </select>
                  </div>

                  {/* B28 v0.3.16: What happens after choosing a goal (Priority quadrant + Slot suggestion inside goal's blocks) */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Ưu tiên tự động:</span>
                      <span className={`font-bold px-2 py-0.5 rounded-md ${
                        computedQuadrant === 1
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : computedQuadrant === 2
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {quadrantLabelMap[computedQuadrant]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Khung giờ đề xuất:</span>
                      <span className="font-bold text-slate-900">
                        {suggestedStartTime} – {suggestedEndTime}{' '}
                        <span className="text-[10px] font-normal text-slate-500">
                          ({reservedGoalBlock ? 'Trong khối mục tiêu' : (planGoalId ? 'Khung trống kế tiếp' : 'Quỹ dự phòng')})
                        </span>
                      </span>
                    </div>
                    {showCustomSlotPicker && (
                      <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-600">Chọn giờ bắt đầu khác:</span>
                        <input
                          type="time"
                          value={customStartTime}
                          onChange={(e) => setCustomStartTime(e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 leading-snug pt-0.5">
                      {planGoalId
                        ? '✓ Gắn vào danh sách việc & dự án của mục tiêu; số phút được cộng vào tiến độ mục tiêu.'
                        : '✓ Xếp vào khoảng trống hoặc quỹ dự phòng gián đoạn trong ngày.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPlanningStep(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
                    >
                      Quay lại
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCustomSlotPicker(v => !v)}
                        className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl"
                      >
                        Chọn giờ khác
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
                <h3 className="text-lg font-bold text-slate-900">Hoàn thành phiên Quẹt thẻ nhiệm vụ!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đã rà soát xong 5 thẻ tồn đọng. Sẵn sàng quay lại công việc chính.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500">Đã lên lịch:</span>
                  <p className="text-base font-bold text-emerald-600">
                    {sessionHistory.filter(h => h.action === 'plan').length} việc
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500">Làm ngay:</span>
                  <p className="text-base font-bold text-blue-600">
                    {sessionHistory.filter(h => h.action === 'done_now').length} việc
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500">Để sau:</span>
                  <p className="text-base font-bold text-amber-600">
                    {sessionHistory.filter(h => h.action === 'later').length} việc
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500">Đã bỏ hẳn:</span>
                  <p className="text-base font-bold text-rose-600">
                    {sessionHistory.filter(h => h.action === 'drop').length} việc
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                Còn lại trong rổ: <strong className="text-slate-800">{backlogCards.length} thẻ</strong>
              </div>

              <button
                onClick={() => setIsSwipeModalOpen(false)}
                className={`w-full py-3 rounded-2xl text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
                  isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c83515]'
                }`}
              >
                Quay lại làm việc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
