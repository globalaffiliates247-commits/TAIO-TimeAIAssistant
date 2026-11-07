'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DailyCardItem, ItemOrigin } from '../types';
import { 
  CheckSquare, 
  Square, 
  RotateCw, 
  Plus, 
  Calendar, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Clock,
  Zap,
  Tag
} from 'lucide-react';

export const DailyCardView: React.FC = () => {
  const { 
    dailyCardItems, 
    addDailyCardItem, 
    toggleDailyCardItem, 
    carryOverItem,
    selectedCardDate,
    setSelectedCardDate,
    goals,
    blocks,
    setMethodLibraryOpen,
    setIsSwipeModalOpen,
    setIsQuestionsModalOpen,
    setIsActiveCaptureOpen,
    activeQuestion
  } = useApp();

  const [newText, setNewText] = useState<string>('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [newOrigin, setNewOrigin] = useState<ItemOrigin>('planned');
  const [displacedBlockId, setDisplacedBlockId] = useState<string>('');
  const [showUnplannedOptions, setShowUnplannedOptions] = useState<boolean>(false);

  // Filter items for current selected date (defaults to today)
  const currentItems = dailyCardItems.filter(i => i.date === selectedCardDate);
  const doneItems = currentItems.filter(i => i.status === 'done');
  const openItems = currentItems.filter(i => i.status === 'open');
  const carriedItems = currentItems.filter(i => i.status === 'carried');

  // Throughput and Planning fallacy hint (B25.4)
  const usualDailyCapacity = 6;
  const currentTotal = currentItems.length;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const displacedBlock = blocks.find(b => b.id === displacedBlockId);

    addDailyCardItem({
      text: newText.trim(),
      goalId: selectedGoalId || undefined,
      origin: newOrigin,
      displacedItemId: displacedBlockId || undefined,
      displacedItemTitle: displacedBlock?.title,
      displacedMinutes: displacedBlock ? 45 : undefined,
    });

    setNewText('');
    setSelectedGoalId('');
    setNewOrigin('planned');
    setDisplacedBlockId('');
    setShowUnplannedOptions(false);
  };

  const handlePrevDay = () => {
    const d = new Date(selectedCardDate);
    d.setDate(d.getDate() - 1);
    setSelectedCardDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedCardDate);
    d.setDate(d.getDate() + 1);
    setSelectedCardDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedCardDate(today);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header & Date Navigation & Planning Fallacy Hint */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
              📝
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Thẻ ngày (Daily Card - Bullet Journal Sticky Note)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Lấy cảm hứng từ thói quen ghi chú giấy dán của Founder • Gạch ngang khi xong • Dời việc có chủ đích
              </p>
            </div>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button 
              onClick={handlePrevDay} 
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white"
              title="Ngày trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleToday}
              className="px-2.5 py-1 rounded-lg font-bold text-slate-800 hover:text-slate-900 bg-white shadow-xs"
            >
              {selectedCardDate === new Date().toISOString().split('T')[0] ? 'Hôm nay' : selectedCardDate}
            </button>
            <button 
              onClick={handleNextDay} 
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white"
              title="Ngày sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRD v0.3.6 B29: Question Chip on Daily Card + Quick Actions for B28 & B30 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs">
          <button
            onClick={() => setIsQuestionsModalOpen(true)}
            className="flex items-center gap-2 text-left group"
          >
            <span className="w-6 h-6 rounded-lg bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0 text-xs font-black shadow-xs">
              ?
            </span>
            <span className="text-xs text-amber-900 font-bold group-hover:underline">
              {activeQuestion ? activeQuestion.text : '3 việc quan trọng nhất bạn cần làm hôm nay là gì?'}
            </span>
          </button>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => setIsSwipeModalOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold border border-slate-200 shadow-xs flex items-center gap-1 transition-all"
              title="Mở Quẹt thẻ nhiệm vụ"
            >
              <span>Quẹt thẻ nhiệm vụ</span>
            </button>
            <button
              onClick={() => setIsActiveCaptureOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-[#E0401F] text-[11px] font-semibold border border-slate-200 shadow-xs flex items-center gap-1 transition-all"
              title="Thu thập chủ động & Ghi bù"
            >
              <span>Ghi bù</span>
            </button>
          </div>
        </div>

        {/* Planning Fallacy & Throughput Hint (B25.4) */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Nhịp năng suất:</strong> Bạn thường hoàn thành trung bình <strong>{usualDailyCapacity} việc/ngày</strong>. Thẻ hôm nay đang có <strong>{currentTotal} việc</strong> {currentTotal > usualDailyCapacity ? '(chú ý nguy cơ quá tải)' : '(vừa vặn, khả thi)'}.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 font-bold shrink-0">
            {doneItems.length}/{currentTotal} xong ({currentTotal > 0 ? Math.round((doneItems.length / currentTotal) * 100) : 0}%)
          </span>
        </div>

        {/* 2. Quick One-Line Add Form (Keep the Sticky-Note feel) */}
        <form onSubmit={handleAddItem} className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder="Ghi nhanh 1 việc (nhập tên việc rồi nhấn Enter)..."
                className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowUnplannedOptions(!showUnplannedOptions)}
              className={`px-3 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
                newOrigin === 'unplanned_goal'
                  ? 'bg-orange-500/20 text-orange-700 border-orange-500/40'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title="Tùy chọn: Việc phát sinh ngoài kế hoạch (Unplanned on goal)"
            >
              <Zap className="w-3.5 h-3.5 inline mr-1" />
              <span>{newOrigin === 'unplanned_goal' ? 'Phát sinh' : 'Tùy chọn'}</span>
            </button>

            <button
              type="submit"
              className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#E0401F] to-orange-500 hover:from-[#c83516] hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm</span>
            </button>
          </div>

          {/* Unplanned on goal options drawer */}
          {showUnplannedOptions && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5 animate-in fade-in shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                    Nguồn gốc công việc (Origin):
                  </label>
                  <select
                    value={newOrigin}
                    onChange={e => setNewOrigin(e.target.value as ItemOrigin)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none shadow-xs"
                  >
                    <option value="planned">Theo kế hoạch (Planned)</option>
                    <option value="unplanned_goal">Ngoài kế hoạch, có phục vụ mục tiêu (Unplanned on goal)</option>
                    <option value="interruption">Việc chen ngang ngoài mục tiêu (Interruption)</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                    Mục tiêu phục vụ (Tùy chọn):
                  </label>
                  <select
                    value={selectedGoalId}
                    onChange={e => setSelectedGoalId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none shadow-xs"
                  >
                    <option value="">Ngoài mục tiêu</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {newOrigin === 'unplanned_goal' && (
                <div>
                  <label className="text-[11px] text-amber-700 font-bold block mb-1">
                    Việc này chiếm thời gian của khối nào? (Bị đẩy lùi - Pushed back):
                  </label>
                  <select
                    value={displacedBlockId}
                    onChange={e => setDisplacedBlockId(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none shadow-xs"
                  >
                    <option value="">Không làm lùi việc nào (dùng thời gian trống)</option>
                    {blocks.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.startTime} - {b.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* 3. The Sticky-Note Card (Tập trung & Trực quan) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
        {/* Sticky note style left accent strip */}
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-gradient-to-b from-amber-400 to-orange-500" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 pl-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Danh sách việc trong ngày ({currentItems.length} việc)
            </h4>
          </div>
          <span className="text-xs text-slate-500 italic">
            Chạm vào để gạch ngang • Việc đã xong vẫn giữ nguyên để ghi nhận thành quả
          </span>
        </div>

        {currentItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Chưa có công việc nào trên thẻ ngày {selectedCardDate}. Hãy nhập một dòng phía trên để bắt đầu!
          </div>
        ) : (
          <div className="space-y-2.5 pl-2">
            {currentItems.map((item) => {
              const isDone = item.status === 'done';
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isDone 
                      ? 'bg-slate-50 border-slate-200 opacity-60' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
                  }`}
                >
                  {/* Left: Checkmark & Strike-through Text */}
                  <div 
                    onClick={() => toggleDailyCardItem(item.id)}
                    className="flex items-center gap-3 cursor-pointer flex-1 select-none"
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                      isDone 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-slate-300 hover:border-orange-500 bg-white'
                    }`}>
                      {isDone && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs sm:text-sm font-medium ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {item.text}
                        </span>

                        {/* Carry Count Badge (↻1, ↻2, ↻3) */}
                        {item.carryCount > 0 && (
                          <span 
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                              item.carryCount >= 3 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                            title={`Việc đã dời ${item.carryCount} lần từ các ngày trước`}
                          >
                            ↻{item.carryCount}
                          </span>
                        )}

                        {/* Origin Badge */}
                        {item.origin === 'unplanned_goal' && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                            Ngoài KH (Có MT)
                          </span>
                        )}

                        {item.origin === 'interruption' && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Chen ngang
                          </span>
                        )}
                      </div>

                      {/* Displaced task note */}
                      {item.displacedItemTitle && (
                        <p className="text-[10px] text-amber-700 mt-0.5">
                          ↳ Chiếm thời gian của: <strong>{item.displacedItemTitle}</strong> (+{item.displacedMinutes || 45}p)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Time Slot, Goal Chip & Carry Action */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {item.start && item.end && (
                      <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                        {item.start} - {item.end}
                      </span>
                    )}

                    {item.goalName && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 max-w-[130px] truncate hidden md:inline">
                        {item.goalName}
                      </span>
                    )}

                    {/* Carry over button if not done */}
                    {!isDone && (
                      <button
                        onClick={() => carryOverItem(item.id, 'tomorrow')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                        title="Dời việc sang ngày mai (Bullet Journal Migration)"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 4. Work Diary Insights (B25.4) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">Đã xong hôm nay</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{doneItems.length} việc</p>
          </div>
          <CheckCircle2 className="w-7 h-7 text-emerald-500/20" />
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">Việc dời (Carried)</span>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {currentItems.filter(i => i.carryCount > 0).length} việc
            </p>
          </div>
          <RotateCw className="w-7 h-7 text-amber-500/20" />
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">Việc ngoài KH (Có MT)</span>
            <p className="text-2xl font-bold text-[#E0401F] mt-1">
              {currentItems.filter(i => i.origin === 'unplanned_goal').length} việc
            </p>
          </div>
          <Zap className="w-7 h-7 text-red-500/20" />
        </div>
      </div>

    </div>
  );
};
