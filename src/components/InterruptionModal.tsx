'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InterruptionDecision, InterruptionActivityCategory } from '../types';
import { DEFAULT_ACTIVITY_CATEGORIES } from '../data/mockData';
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
  Check
} from 'lucide-react';

const DURATION_OPTIONS: { mins: number; label: string }[] = [
  { mins: 5, label: '5 phút' },
  { mins: 15, label: '15 phút' },
  { mins: 30, label: '30 phút' },
  { mins: 60, label: '1 giờ' },
  { mins: 120, label: '2 giờ+' },
];

const DECISION_OPTIONS: { id: InterruptionDecision; label: string; icon: React.ReactNode }[] = [
  { id: 'do_now', label: 'Làm ngay', icon: <Play className="w-3.5 h-3.5" /> },
  { id: 'schedule', label: 'Lên lịch', icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: 'delegate', label: 'Ủy quyền', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'decline', label: 'Từ chối', icon: <ShieldX className="w-3.5 h-3.5" /> },
];

export const InterruptionModal: React.FC = () => {
  const { 
    interruptionModalOpen, 
    setInterruptionModalOpen, 
    handleInterruptionSubmit, 
    currentBlock,
    profile,
    currentPaletteColors 
  } = useApp();

  const [returnPoint, setReturnPoint] = useState<string>(
    currentBlock?.returnPoint || (currentBlock ? `Đang làm: "${currentBlock.title}"` : '')
  );
  const [selectedCategory, setSelectedCategory] = useState<InterruptionActivityCategory>('work_came_up');
  const [optionalNote, setOptionalNote] = useState<string>('');
  const [durationMins, setDurationMins] = useState<number>(15);
  const [decision, setDecision] = useState<InterruptionDecision>('do_now');

  if (!interruptionModalOpen) return null;

  const renderIcon = (catId: InterruptionActivityCategory) => {
    switch (catId) {
      case 'eating_drinks': return <Utensils className="w-5 h-5 text-amber-400" />;
      case 'overslept': return <AlarmClockOff className="w-5 h-5 text-indigo-400" />;
      case 'chatting_gossip': return <MessagesSquare className="w-5 h-5 text-cyan-400" />;
      case 'travel': return <Car className="w-5 h-5 text-emerald-400" />;
      case 'research_reading': return <BookOpen className="w-5 h-5 text-blue-400" />;
      case 'drank_too_much': return <Wine className="w-5 h-5 text-purple-400" />;
      case 'phone_scrolling': return <Smartphone className="w-5 h-5 text-pink-400" />;
      case 'calls_messages': return <PhoneCall className="w-5 h-5 text-green-400" />;
      case 'family_matter': return <HeartHandshake className="w-5 h-5 text-rose-400" />;
      case 'work_came_up': return <Briefcase className="w-5 h-5 text-[#E0401F]" />;
      case 'break': return <Coffee className="w-5 h-5 text-amber-300" />;
      default: return <HelpCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleSave = () => {
    const catObj = DEFAULT_ACTIVITY_CATEGORIES.find(c => c.id === selectedCategory);
    const catName = catObj ? catObj.nameVi : 'Việc phát sinh';
    const title = optionalNote.trim() ? `${catName}: ${optionalNote.trim()}` : catName;

    handleInterruptionSubmit({
      title,
      decision,
      returnPoint: returnPoint.trim() || undefined,
      minutes: durationMins,
      category: selectedCategory,
      note: optionalNote.trim() || undefined,
    });

    setInterruptionModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121620] border border-gray-800 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* 1. Title and Cancel */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Có việc phát sinh</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-[#E0401F] border border-red-800/40">
                PRD v0.16 B5
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Chọn 1 danh mục • Chi tiết tùy chọn • Thao tác 1 chạm</p>
          </div>
          <button 
            onClick={() => setInterruptionModalOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          
          {/* 2. Return point of the task being interrupted */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Điểm quay lại của việc đang làm (Return point):</span>
            </div>
            <input
              type="text"
              value={returnPoint}
              onChange={e => setReturnPoint(e.target.value)}
              placeholder="VD: Đang viết dở bảng báo giá, đã xong mục 3..."
              className="w-full bg-black/40 border border-gray-700/80 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#E0401F]"
            />
          </div>

          {/* 3. "What is it?" Grid of 12 large category tiles (3 per row) */}
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
              Việc này là gì? (Chọn 1 chạm)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DEFAULT_ACTIVITY_CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      isSelected
                        ? 'border-[#E0401F] bg-red-950/30 text-white ring-1 ring-[#E0401F]/40 shadow-sm'
                        : 'border-gray-800 bg-gray-900/60 text-gray-300 hover:border-gray-700 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="mb-1">{renderIcon(cat.id)}</div>
                    <span className="text-xs font-semibold leading-tight line-clamp-1">{cat.nameVi}</span>
                    <span className="text-[9px] text-gray-400 line-clamp-1 mt-0.5">{cat.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Optional one-line note */}
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">
              Ghi chú thêm (Chi tiết người gọi, việc gì - Tùy chọn):
            </label>
            <input
              type="text"
              value={optionalNote}
              onChange={e => setOptionalNote(e.target.value)}
              placeholder="VD: Anh Nam gọi hỏi hợp đồng, hoặc chạy đi nhận hàng..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E0401F]"
            />
          </div>

          {/* 5. "How long?" Native Segmented Control */}
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
              Dự kiến bao lâu? (Thời lượng)
            </label>
            <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800">
              {DURATION_OPTIONS.map(d => {
                const isSelected = durationMins === d.mins;
                return (
                  <button
                    key={d.mins}
                    type="button"
                    onClick={() => setDurationMins(d.mins)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      isSelected 
                        ? 'bg-gray-800 text-white shadow-sm' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. "How to handle it?" Native Segmented Control */}
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
              Cách xử lý? (Mặc định: Làm ngay)
            </label>
            <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800 gap-1">
              {DECISION_OPTIONS.map(dec => {
                const isSelected = decision === dec.id;
                return (
                  <button
                    key={dec.id}
                    type="button"
                    onClick={() => setDecision(dec.id)}
                    className={`flex-1 py-1.5 px-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-[#E0401F] text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {dec.icon}
                    <span>{dec.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1 italic">
              {decision === 'do_now' && `Trừ vào quỹ gián đoạn hôm nay (${profile.interruptionReserveMins}p).`}
              {decision === 'schedule' && 'Tự đề xuất khung giờ trống tiếp theo trong ngày.'}
              {decision === 'delegate' && `Chuyển người khác làm. Ghi nhận ${durationMins}p bảo vệ tập trung.`}
              {decision === 'decline' && `Từ chối lịch sự. Giữ trọn ${durationMins}p cho mục tiêu lớn.`}
            </p>
          </div>

          {/* 7. Full-width Save button */}
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-[#E0401F] hover:bg-[#d03515] text-white text-sm font-bold shadow-lg shadow-red-950/40 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <Check className="w-4 h-4" />
            <span>Lưu & Áp dụng</span>
          </button>

        </div>
      </div>
    </div>
  );
};
