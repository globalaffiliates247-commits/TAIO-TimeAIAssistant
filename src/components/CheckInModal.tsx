'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle2, 
  Clock, 
  Bookmark, 
  Sparkles, 
  CalendarCheck,
  ArrowRight,
  Inbox,
  X 
} from 'lucide-react';
import { DodItem } from '../types';

export const CheckInModal: React.FC = () => {
  const { 
    checkInModalOpen, 
    setCheckInModalOpen, 
    checkInBlock, 
    handleCheckInAnswer,
    blocks,
    setCurrentTab,
    setCloseDayModalOpen,
    setInboxModalOpen
  } = useApp();

  const [nextStepInput, setNextStepInput] = useState<string>('');
  const [showNextStepForm, setShowNextStepForm] = useState<boolean>(false);

  // Local DoD checklist state
  const defaultDod: DodItem[] = checkInBlock?.dodChecklist && checkInBlock.dodChecklist.length > 0
    ? checkInBlock.dodChecklist
    : [
        { id: 'd-1', text: 'Hoàn thành các nội dung chính của nhiệm vụ', completed: false },
        { id: 'd-2', text: 'Kiểm tra kết quả không còn lỗi tồn đọng', completed: false },
        { id: 'd-3', text: 'Sẵn sàng bàn giao hoặc lưu trữ an toàn', completed: false },
      ];

  const [checklist, setChecklist] = useState<DodItem[]>(defaultDod);

  if (!checkInModalOpen || !checkInBlock) return null;

  const toggleCheckItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const allCriteriaMet = checklist.every(i => i.completed);
  const waitingCount = blocks.filter(b => b.id !== checkInBlock.id && b.status === 'planned').length;

  // Case 1: Ritual Block (PRD v0.20 B9 - Ritual card: e.g. Close the Day)
  if (checkInBlock.blockKind === 'ritual') {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl p-6 text-slate-900 border-t border-orange-500/30 sm:border">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4" />
              <span>Nghi thức cuối ngày (Daily Ritual)</span>
            </span>
            <button onClick={() => setCheckInModalOpen(false)} className="text-slate-500 hover:text-slate-900">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 mb-6">
            <h3 className="text-xl font-bold text-slate-900">Đến giờ Đóng ngày (2 phút)</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Khóa tổng kết hôm nay, xác nhận các việc chờ, và chọn một nhiệm vụ quan trọng số 1 cho ngày mai để thảnh thơi nghỉ ngơi.
            </p>
            <div className="p-3 rounded-2xl bg-slate-100/60 border border-slate-200/60 text-xs text-slate-700 flex items-center justify-between">
              <span>Đã hoàn thành: <strong>{blocks.filter(b => b.status === 'done').length} việc</strong></span>
              <span>Việc còn chờ: <strong>{waitingCount} việc</strong></span>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => {
                setCheckInModalOpen(false);
                setCloseDayModalOpen(true);
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#E0401F] to-orange-500 hover:from-[#c93517] hover:to-orange-600 text-slate-900 font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              <span>Mở Đóng ngày (2 phút)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleCheckInAnswer('remind_10m')}
              className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Nhắc lại sau 10 phút
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Meeting Block (PRD v0.20 B9 - Ends silently with Inbox prompt)
  if (checkInBlock.blockKind === 'meeting') {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl p-6 text-slate-900 border-t border-purple-500/30 sm:border">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
              Khung giờ họp kết thúc
            </span>
            <button onClick={() => setCheckInModalOpen(false)} className="text-slate-500 hover:text-slate-900">
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">{checkInBlock.title}</h3>
          <p className="text-xs text-slate-700 mb-5">
            Cuộc họp đã kết thúc. Bạn có cần ghi nhanh hành động tiếp theo (Action Item) vào Rổ việc không?
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => {
                setCheckInModalOpen(false);
                setInboxModalOpen(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
            >
              <Inbox className="w-4 h-4" />
              <span>Ghi nhận hành động kế tiếp vào Rổ việc (Inbox)</span>
            </button>
            <button
              onClick={() => handleCheckInAnswer('done')}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Không có gì phát sinh, đánh dấu xong
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Standard Task Timebox with Definition of Done (B9 Anatomy)
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl p-6 text-slate-900 border-t border-orange-500/30 sm:border">
        
        {/* 1. Kicker (small, grey): what happened and when */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100/80 mb-3">
          <span className="text-xs text-slate-500">
            Khung giờ đã kết thúc {checkInBlock.startTime} - {checkInBlock.endTime} · Còn {waitingCount} việc chờ
          </span>
          <button 
            onClick={() => setCheckInModalOpen(false)}
            className="text-slate-500 hover:text-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Title (bold): task name only */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
          {checkInBlock.title}
        </h3>

        {/* 3. Context line: goal it serves */}
        <p className="text-xs text-orange-400 font-semibold mt-1 mb-4 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mục tiêu phục vụ: {checkInBlock.goalName || 'Ngoài mục tiêu chính'}</span>
        </p>

        {/* 4. Question with Definition of Done checklist shown */}
        <div className="p-4 rounded-2xl bg-slate-100/60 border border-slate-200/60 mb-5 space-y-3">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Đạt tiêu chí hoàn thành chưa? Tích chọn tiêu chí đã đạt:
          </label>

          <div className="space-y-2">
            {checklist.map((item) => (
              <div 
                key={item.id}
                onClick={() => toggleCheckItem(item.id)}
                className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  item.completed 
                    ? 'bg-emerald-50 border-emerald-500/50 text-emerald-700' 
                    : 'bg-slate-50/80 border-slate-200/80 hover:border-slate-500 text-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  item.completed ? 'bg-emerald-500 border-emerald-500 text-slate-900' : 'border-slate-500'
                }`}>
                  {item.completed && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className={`text-xs font-medium ${item.completed ? 'line-through text-slate-500' : ''}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Theo chuẩn <strong>Definition of Done (Scrum)</strong></span>
            <button 
              onClick={() => setChecklist(prev => prev.map(i => ({ ...i, completed: true })))}
              className="text-orange-400 hover:underline font-semibold"
            >
              Chọn tất cả
            </button>
          </div>
        </div>

        {/* 5. Actions */}
        {!showNextStepForm ? (
          <div className="space-y-2.5">
            {/* Primary: Meets criteria: Done */}
            <button
              onClick={() => handleCheckInAnswer('done')}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-between transition-all ${
                allCriteriaMet
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-900 shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đạt tiêu chí: Hoàn thành (Done)</span>
              </div>
              <span className="text-[11px] opacity-80">
                {allCriteriaMet ? 'Đạt toàn bộ tiêu chí ✓' : 'Tích chọn để hoàn tất'}
              </span>
            </button>

            {/* Secondary: Not done: continue later */}
            <button
              onClick={() => setShowNextStepForm(true)}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100/80 hover:bg-slate-200 text-slate-800 border border-slate-200/60 text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span>Chưa xong: Làm tiếp sau (Continue later)</span>
              <span className="text-[11px] text-orange-400">Ghi bước kế tiếp ↗</span>
            </button>

            {/* Tertiary: +15 minutes */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCheckInAnswer('more_time', 15)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Cần thêm +15 phút</span>
              </button>

              {/* Text link: Remind me in 10 minutes */}
              <button
                onClick={() => handleCheckInAnswer('remind_10m')}
                className="px-3 py-2.5 text-xs text-slate-500 hover:text-slate-900 hover:underline transition-all"
              >
                Nhắc lại sau 10 phút
              </button>
            </div>
          </div>
        ) : (
          /* Form for "Continue later" (Zeigarnik Effect Reduction) */
          <div className="space-y-3 p-4 rounded-2xl bg-orange-50 border border-orange-500/30 animate-in fade-in duration-200">
            <div>
              <label className="text-xs font-bold text-orange-700 block mb-1 flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-orange-400" />
                <span>Bước kế tiếp cụ thể là gì? (Giảm căng thẳng việc dở dang):</span>
              </label>
              <input
                type="text"
                value={nextStepInput}
                onChange={e => setNextStepInput(e.target.value)}
                placeholder="VD: Cần chỉnh xong bảng phân tích số liệu mục 2..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowNextStepForm(false)}
                className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 text-xs"
              >
                Hủy
              </button>
              <button
                onClick={() => handleCheckInAnswer('continue_later', 0, nextStepInput || 'Làm tiếp việc dang dở')}
                className="flex-1 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-slate-900 font-bold text-xs shadow-md"
              >
                Lưu bước kế tiếp & Dừng an toàn
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
