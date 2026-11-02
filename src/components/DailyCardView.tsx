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
    setMethodLibraryOpen
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
      <div className="bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              📝
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Thẻ ngày (Daily Card - Bullet Journal Sticky Note)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  PRD v0.3.1 B25
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lấy cảm hứng từ thói quen ghi chú giấy dán của Founder • Gạch ngang khi xong • Dời việc có chủ đích
              </p>
            </div>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button 
              onClick={handlePrevDay} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Ngày trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleToday}
              className="px-2.5 py-1 rounded-lg font-bold text-slate-200 hover:text-white"
            >
              {selectedCardDate === new Date().toISOString().split('T')[0] ? 'Hôm nay' : selectedCardDate}
            </button>
            <button 
              onClick={handleNextDay} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Ngày sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Planning Fallacy & Throughput Hint (B25.4) */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              <strong>Nhịp năng suất:</strong> Bạn thường hoàn thành trung bình <strong>{usualDailyCapacity} việc/ngày</strong>. Thẻ hôm nay đang có <strong>{currentTotal} việc</strong> {currentTotal > usualDailyCapacity ? '(chú ý nguy cơ quá tải)' : '(vừa vặn, khả thi)'}.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 shrink-0">
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
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowUnplannedOptions(!showUnplannedOptions)}
              className={`px-3 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
                newOrigin === 'unplanned_goal'
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
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
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-2.5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] text-slate-400 font-bold uppercase block mb-1">
                    Nguồn gốc công việc (Origin B25):
                  </label>
                  <select
                    value={newOrigin}
                    onChange={e => setNewOrigin(e.target.value as ItemOrigin)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
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
                  <label className="text-[11px] text-amber-300 font-bold block mb-1">
                    Việc này chiếm thời gian của khối nào? (Bị đẩy lùi - Pushed back):
                  </label>
                  <select
                    value={displacedBlockId}
                    onChange={e => setDisplacedBlockId(e.target.value)}
                    className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
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
      <div className="bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Sticky note style left accent strip */}
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-gradient-to-b from-amber-400 to-orange-500" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 pl-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Danh sách việc trong ngày ({currentItems.length} việc)
            </h4>
          </div>
          <span className="text-xs text-slate-400 italic">
            Chạm vào để gạch ngang • Việc đã xong vẫn giữ nguyên để ghi nhận thành quả
          </span>
        </div>

        {currentItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
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
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60' 
                      : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-500 hover:bg-slate-800/90'
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
                        : 'border-slate-500 hover:border-orange-400'
                    }`}>
                      {isDone && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs sm:text-sm font-medium ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                          {item.text}
                        </span>

                        {/* Carry Count Badge (↻1, ↻2, ↻3) */}
                        {item.carryCount > 0 && (
                          <span 
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                              item.carryCount >= 3 
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                            title={`Việc đã dời ${item.carryCount} lần từ các ngày trước`}
                          >
                            ↻{item.carryCount}
                          </span>
                        )}

                        {/* Origin Badge */}
                        {item.origin === 'unplanned_goal' && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-orange-950/60 text-orange-400 border border-orange-800/40">
                            Ngoài KH (Có MT)
                          </span>
                        )}

                        {item.origin === 'interruption' && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                            Chen ngang
                          </span>
                        )}
                      </div>

                      {/* Displaced task note */}
                      {item.displacedItemTitle && (
                        <p className="text-[10px] text-amber-400/90 mt-0.5">
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-700 max-w-[130px] truncate hidden md:inline">
                        {item.goalName}
                      </span>
                    )}

                    {/* Carry over button if not done */}
                    {!isDone && (
                      <button
                        onClick={() => carryOverItem(item.id, 'tomorrow')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition-colors"
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
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">Đã xong hôm nay</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{doneItems.length} việc</p>
          </div>
          <CheckCircle2 className="w-7 h-7 text-emerald-400/30" />
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">Việc dời (Carried)</span>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {currentItems.filter(i => i.carryCount > 0).length} việc
            </p>
          </div>
          <RotateCw className="w-7 h-7 text-amber-400/30" />
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">Việc ngoài KH (Có MT)</span>
            <p className="text-2xl font-bold text-orange-400 mt-1">
              {currentItems.filter(i => i.origin === 'unplanned_goal').length} việc
            </p>
          </div>
          <Zap className="w-7 h-7 text-orange-400/30" />
        </div>
      </div>

    </div>
  );
};
