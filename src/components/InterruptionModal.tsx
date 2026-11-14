'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InterruptionDecision, InterruptionActivityCategory, InterruptionSituation } from '../types';
import { 
  DEFAULT_ACTIVITY_CATEGORIES, 
  SITUATION_1_CATEGORIES, 
  SITUATION_2_CATEGORIES 
} from '../data/mockData';
import { 
  X, 
  Bookmark, 
  Utensils, 
  AlarmClockOff, 
  MessagesSquare, 
  Car, 
  BookOpen, 
  Wine, 
  Smartphone, 
  PhoneCall, 
  HeartHandshake, 
  Briefcase, 
  Coffee, 
  HelpCircle,
  Play,
  Calendar,
  Users,
  ShieldX,
  Check,
  Dumbbell,
  Clock,
  Inbox,
  ChevronDown,
  Sparkles
} from 'lucide-react';

const DURATION_OPTIONS: { mins: number; label: string }[] = [
  { mins: 0, label: 'Đồng hồ live' },
  { mins: 5, label: '5 phút' },
  { mins: 15, label: '15 phút' },
  { mins: 30, label: '30 phút' },
  { mins: 60, label: '1 giờ' },
];

export const InterruptionModal: React.FC = () => {
  const { 
    interruptionModalOpen, 
    setInterruptionModalOpen, 
    handleInterruptionSubmit, 
    currentBlock,
    profile,
    palette,
    currentPaletteColors 
  } = useApp();

  const isCool = palette === 'cool';
  const brandColor = currentPaletteColors.brandAccent;

  // : Situation 1 (Declared in moment) vs Situation 2 (Recalled on review)
  const [situation, setSituation] = useState<InterruptionSituation>('moment');
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);

  const [returnPoint, setReturnPoint] = useState<string>(
    currentBlock?.returnPoint || (currentBlock ? `Đang làm: "${currentBlock.title}"` : '')
  );
  const [selectedCategory, setSelectedCategory] = useState<InterruptionActivityCategory>('calls_messages');
  const [optionalNote, setOptionalNote] = useState<string>('');
  const [durationMins, setDurationMins] = useState<number>(15);
  
  // v0.3.9 B5: Mặc định "Bạn sẽ...?" là "postpone" (Để sau)
  const [decision, setDecision] = useState<InterruptionDecision>('postpone');

  if (!interruptionModalOpen) return null;

  const renderIcon = (catId: InterruptionActivityCategory) => {
    switch (catId) {
      case 'calls_messages': return <PhoneCall className="w-5 h-5 text-emerald-500" />;
      case 'work_came_up': return <Briefcase className={`w-5 h-5 ${isCool ? 'text-blue-500' : 'text-[#E0401F]'}`} />;
      case 'family_matter': return <HeartHandshake className="w-5 h-5 text-rose-500" />;
      case 'eating_drinks': return <Utensils className="w-5 h-5 text-amber-500" />;
      case 'travel': return <Car className="w-5 h-5 text-indigo-500" />;
      case 'break': return <Coffee className="w-5 h-5 text-orange-500" />;
      case 'prev_task_over': return <Briefcase className="w-5 h-5 text-amber-500" />;
      case 'chatting_gossip': return <MessagesSquare className="w-5 h-5 text-cyan-500" />;
      case 'phone_scrolling': return <Smartphone className="w-5 h-5 text-pink-500" />;
      case 'research_reading': return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'overslept': return <AlarmClockOff className="w-5 h-5 text-purple-500" />;
      case 'drank_too_much': return <Wine className="w-5 h-5 text-red-500" />;
      case 'exercise': return <Dumbbell className="w-5 h-5 text-emerald-500" />;
      default: return <HelpCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const currentCategoryList = showAllCategories 
    ? DEFAULT_ACTIVITY_CATEGORIES 
    : (situation === 'moment' ? SITUATION_1_CATEGORIES : SITUATION_2_CATEGORIES);

  const handleSave = () => {
    const catObj = DEFAULT_ACTIVITY_CATEGORIES.find(c => c.id === selectedCategory);
    const catName = catObj ? catObj.nameVi : 'Việc phát sinh';
    const title = optionalNote.trim() ? `${catName}: ${optionalNote.trim()}` : catName;

    handleInterruptionSubmit({
      title,
      decision,
      returnPoint: returnPoint.trim() || undefined,
      minutes: durationMins || 15,
      category: selectedCategory,
      note: optionalNote.trim() || undefined,
      situation,
      isDistraction: situation === 'review',
    });

    setInterruptionModalOpen(false);
  };

  return (
    <div className="fixed app-overlay-safe z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
      <div className={`w-full max-w-lg max-h-[92vh] overflow-y-auto overscroll-contain rounded-3xl shadow-2xl p-5 sm:p-6 transition-colors duration-200 ${
        isCool 
          ? 'bg-white text-slate-800 border border-slate-200' 
          : 'bg-white text-stone-900 border border-stone-200'
      } animate-in fade-in zoom-in-95 duration-200`}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold flex items-center gap-1.5">
                <span>Ghi nhận gián đoạn & việc phát sinh</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Tối ưu thao tác 1 chạm • Mặc định "Để sau" vào Rổ công việc</p>
          </div>
          <button 
            onClick={() => setInterruptionModalOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Situation Segmented Switch () */}
        <div className="mb-4 bg-slate-100/80 p-1 rounded-2xl flex border border-slate-200/80">
          <button
            type="button"
            onClick={() => { setSituation('moment'); setSelectedCategory('calls_messages'); setDecision('postpone'); }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
              situation === 'moment'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tình huống 1: Khai báo tức thì
          </button>
          <button
            type="button"
            onClick={() => { setSituation('review'); setSelectedCategory('prev_task_over'); setDecision('do_now'); }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
              situation === 'review'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tình huống 2: Hồi tưởng xem lại (Xao nhãng)
          </button>
        </div>

        <div className="space-y-4">
          
          {/* 2. Return point of the task being interrupted */}
          {situation === 'moment' && (
            <div className={`p-3 rounded-2xl border ${isCool ? 'bg-blue-50/50 border-blue-100' : 'bg-amber-50/60 border-amber-100'}`}>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Bookmark className={`w-3.5 h-3.5 ${isCool ? 'text-blue-600' : 'text-[#E0401F]'}`} />
                <span>Điểm quay lại việc đang làm (Return point):</span>
              </div>
              <input
                type="text"
                value={returnPoint}
                onChange={e => setReturnPoint(e.target.value)}
                placeholder="VD: Đang viết dở bảng báo giá, đã xong mục 3..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          {/* 3. Category Grid: 6 tiles (Hick's Law) + "Xem tất cả" */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                {situation === 'moment' ? 'Việc này là gì? (Chọn 1 chạm)' : 'Thời gian vừa rồi bạn đã dùng cho gì?'}
              </label>
              <button 
                type="button"
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
              >
                <span>{showAllCategories ? 'Thu gọn' : 'Xem tất cả'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showAllCategories ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {currentCategoryList.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? isCool
                          ? 'border-blue-500 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                          : 'border-[#E0401F] bg-red-50/80 text-red-950 ring-2 ring-red-500/20 shadow-sm'
                        : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="mb-1.5">{renderIcon(cat.id)}</div>
                    <span className="text-xs font-bold leading-tight line-clamp-1">{cat.nameVi}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{cat.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Optional one-line note */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Ghi chú thêm (Chi tiết người gọi / việc gì - Tùy chọn):
            </label>
            <input
              type="text"
              value={optionalNote}
              onChange={e => setOptionalNote(e.target.value)}
              placeholder="VD: Anh Nam gọi hỏi hợp đồng, hoặc chạy đi nhận hàng..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* 5. "How long?" (Tùy chọn thời lượng / đồng hồ live) */}
          {situation === 'moment' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wide">
                Dự kiến bao lâu? (Tùy chọn)
              </label>
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                {DURATION_OPTIONS.map(d => {
                  const isSelected = durationMins === d.mins;
                  return (
                    <button
                      key={d.mins}
                      type="button"
                      onClick={() => setDurationMins(d.mins)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                        isSelected 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. "Bạn sẽ...?" Segmented Control () */}
          {situation === 'moment' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wide flex items-center justify-between">
                <span>Bạn sẽ xử lý thế nào?</span>
                <span className="text-[10px] font-normal lowercase text-slate-500">(Mặc định: Để sau)</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDecision('postpone')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    decision === 'postpone'
                      ? isCool
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-[#E0401F] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Để sau</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('do_now')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    decision === 'do_now'
                      ? isCool
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-[#E0401F] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Làm luôn</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('parallel')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    decision === 'parallel'
                      ? isCool
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-[#E0401F] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="font-mono font-black text-xs leading-none">∥</span>
                  <span>Làm kèm</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('delegate')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    decision === 'delegate'
                      ? isCool
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-[#E0401F] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Nhờ người</span>
                </button>
              </div>

              {/* Giải thích rõ kết quả theo PRD v0.3.9 & v0.3.33 Part F */}
              <p className="text-[11px] text-slate-500 mt-2 px-1">
                {decision === 'postpone' && '• Cho vào Rổ công việc kèm thông báo 3 giây, lập tức quay lại việc chính.'}
                {decision === 'do_now' && `• Bật đồng hồ chen ngang, giảm trừ vào quỹ dự phòng hôm nay (${profile.interruptionReserveMins}p).`}
                {decision === 'parallel' && '• Ghi là việc kèm chạy song song với việc chính hiện tại.'}
                {decision === 'delegate' && '• Lưu vào Rổ công việc được gán nhãn "chờ người khác" (GTD).'}
                {decision === 'decline' && '• Từ chối việc ngoài, ghi nhận thời gian tập trung được bảo vệ trọn vẹn.'}
              </p>
            </div>
          )}

          {/* 7. Full-width Save button */}
          <button
            type="button"
            onClick={handleSave}
            className={`w-full py-3 rounded-2xl text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 mt-3 ${
              isCool
                ? 'bg-[#007AFF] hover:bg-[#0066d6] shadow-blue-500/20'
                : 'bg-[#E0401F] hover:bg-[#c93517] shadow-red-500/20'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Xác nhận & Áp dụng</span>
          </button>

        </div>
      </div>
    </div>
  );
};
