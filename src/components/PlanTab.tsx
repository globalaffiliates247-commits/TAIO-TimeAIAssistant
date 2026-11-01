'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TimeBlock, BlockType } from '../types';
import { IMPORTANT_NOT_URGENT_BACKLOG } from '../data/mockData';
import { PriorityMatrix } from './PriorityMatrix';
import { 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle, 
  Sparkles, 
  Target, 
  Layers, 
  LayoutGrid
} from 'lucide-react';

const TYPE_CONFIG: Record<BlockType, { label: string; bg: string; text: string; border: string }> = {
  deep: { label: 'Tập trung sâu', bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30' },
  meeting: { label: 'Họp & Trao đổi', bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
  interruption: { label: 'Quỹ gián đoạn', bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
  personal: { label: 'Cá nhân & Nghỉ', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  planning: { label: 'Lập kế hoạch', bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30' },
};

export const PlanTab: React.FC = () => {
  const { blocks, goals, profile, addNewBlock, openDrilldown } = useApp();
  const [activeView, setActiveView] = useState<'timeline' | 'matrix'>('timeline');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newType, setNewType] = useState<BlockType>('deep');
  const [newStartTime, setNewStartTime] = useState<string>('16:00');
  const [newEndTime, setNewEndTime] = useState<string>('17:00');
  const [newGoalId, setNewGoalId] = useState<string>(goals[0]?.id || '');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const goal = goals.find(g => g.id === newGoalId);
    addNewBlock({
      title: newTitle,
      startTime: newStartTime,
      endTime: newEndTime,
      type: newType,
      status: 'planned',
      goalId: newGoalId || undefined,
      goalName: goal ? goal.name : undefined,
    });
    setNewTitle('');
    setShowAddModal(false);
  };

  const handleAcceptBacklogItem = (item: typeof IMPORTANT_NOT_URGENT_BACKLOG[0]) => {
    const goal = goals.find(g => g.id === item.goalId);
    addNewBlock({
      title: item.title,
      startTime: '17:30',
      endTime: '18:15',
      type: 'deep',
      status: 'planned',
      goalId: item.goalId,
      goalName: goal?.name,
    });
    alert(`Đã đưa "${item.title}" vào lịch hôm nay lúc 17:30!`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E0401F] to-orange-500 flex items-center justify-center text-white shadow-md shadow-red-500/25">
              <Calendar className="w-4 h-4" />
            </div>
            <span>Kế hoạch thời gian (Plan)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Xem và định hình ngày hôm nay cũng như tuần này • Chuyển đổi giữa Dòng thời gian & Ma trận ưu tiên
          </p>
        </div>

        {/* View Switcher: Timeline vs Priority Matrix */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-md">
            <button
              onClick={() => setActiveView('timeline')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'timeline' 
                  ? 'bg-gradient-to-r from-[#E0401F] to-orange-500 text-white shadow-md shadow-red-500/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Dòng thời gian</span>
            </button>
            <button
              onClick={() => setActiveView('matrix')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'matrix' 
                  ? 'bg-gradient-to-r from-[#E0401F] to-orange-500 text-white shadow-md shadow-red-500/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Ma trận ưu tiên (B16)</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[#E0401F]" />
            <span>Thêm khối</span>
          </button>
        </div>
      </div>

      {activeView === 'matrix' ? (
        <PriorityMatrix />
      ) : (
        <>
          {/* Weekly Budget Progress (PRD B6) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#E0401F]" />
                <span>Ngân sách tuần (Weekly Budget)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Đã dùng 18h / 40h kế hoạch</span>
            </div>

            <div className="space-y-3.5">
              {goals.map(g => (
                <div 
                  key={g.id} 
                  onClick={() => openDrilldown({
                    type: 'goal_tasks',
                    title: `Ngân sách & Nhiệm vụ: ${g.name}`,
                    subtitle: `Ngân sách tuần: ${g.dailyBudgetMins * 5 / 60}h/tuần • Đang đúng tiến độ`,
                    goalId: g.id,
                  })}
                  className="space-y-1.5 p-3 rounded-2xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-all cursor-pointer group"
                  title="Bấm để xem danh sách nhiệm vụ của mục tiêu này"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-200 font-semibold group-hover:text-white transition-colors">{g.name}</span>
                    <span className="text-slate-400 font-mono text-xs">{g.dailyBudgetMins * 5 / 60}h/tuần (~{g.dailyBudgetMins}p/ngày) ↗</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-[#E0401F] to-orange-500 rounded-full group-hover:brightness-110 transition-all" 
                      style={{ width: `${Math.min(100, (g.progressPercent + 20))}%` }} 
                    />
                  </div>
                </div>
              ))}

              {/* Interruption Reserve Budget */}
              <div 
                onClick={() => openDrilldown({
                  type: 'interruptions',
                  title: 'Quỹ dự phòng gián đoạn tuần (3.5h / 7.5h)',
                  subtitle: 'Bấm để xem danh sách việc chen ngang và người kéo bạn vào',
                })}
                className="space-y-1.5 p-3 rounded-2xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-all cursor-pointer group"
                title="Bấm để xem nhật ký chen ngang"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-amber-300 font-semibold group-hover:text-amber-200">Quỹ dự phòng gián đoạn tuần</span>
                  <span className="text-amber-400 font-mono text-xs">Đã dùng 3.5h / 7.5h (Còn 53%) ↗</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full group-hover:brightness-110 transition-all" style={{ width: '47%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Daily Plan Timeline */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E0401F]" />
                <span>Dòng thời gian hôm nay (Daily Timeline)</span>
              </h3>
              <span className="text-xs text-slate-400">
                Hồ sơ: <strong className="text-white">{profile.title}</strong>
              </span>
            </div>

            {/* Timeline List */}
            <div className="space-y-3">
              {blocks.map((block) => {
                const conf = TYPE_CONFIG[block.type] || TYPE_CONFIG.deep;
                const isCompleted = block.status === 'done';
                const isCurrent = block.status === 'in_progress';

                return (
                  <div
                    key={block.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrent 
                        ? 'border-red-500/60 bg-red-950/20 ring-1 ring-red-500/40 shadow-lg'
                        : isCompleted
                        ? 'border-slate-800/60 bg-slate-900/40 opacity-70'
                        : 'border-slate-700/60 bg-slate-800/70 hover:border-slate-600 hover:bg-slate-800/90'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      {/* Time Badge */}
                      <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/70 text-slate-300 text-xs font-mono font-bold whitespace-nowrap">
                        {block.startTime} - {block.endTime}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${conf.bg} ${conf.text} ${conf.border}`}>
                            {conf.label}
                          </span>
                          {block.status === 'done' && (
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Đã xong
                            </span>
                          )}
                          {block.status === 'in_progress' && (
                            <span className="text-[11px] text-amber-400 font-extrabold animate-pulse">
                              ● Đang diễn ra
                            </span>
                          )}
                        </div>
                        <h4 className={`text-sm sm:text-base font-bold mt-1 ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                          {block.title}
                        </h4>
                        {block.goalName && (
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-red-400" />
                            <span>{block.goalName}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {block.returnPoint && (
                      <div className="text-xs bg-slate-900/90 border border-slate-700/60 px-3.5 py-2 rounded-xl text-slate-300 max-w-xs truncate shadow-sm">
                        <span className="font-bold text-amber-400">Điểm về: </span>
                        {block.returnPoint}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Important, Not Urgent List (PRD B6) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Việc quan trọng, không khẩn cấp (Important, Not Urgent)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Các đầu việc định kỳ giúp duy trì đà phát triển dài hạn. Bấm "Làm tuần này" để đưa vào lịch.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {IMPORTANT_NOT_URGENT_BACKLOG.map(item => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-3 shadow-md hover:border-slate-600 transition-all">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{item.title}</h4>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">Dự kiến: {item.defaultMinutes} phút</span>
                  </div>
                  <button
                    onClick={() => handleAcceptBacklogItem(item)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#E0401F] to-orange-500 hover:from-[#d03515] hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-red-500/20 transition-all shrink-0"
                  >
                    Làm tuần này
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl text-white">
            <h3 className="text-base font-bold mb-4">Thêm khối thời gian mới</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên công việc</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Rà soát hợp đồng..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E0401F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Loại khối</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as BlockType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none"
                >
                  <option value="deep">Tập trung sâu (Deep Work)</option>
                  <option value="meeting">Họp hành (Meeting)</option>
                  <option value="interruption">Khung dự phòng gián đoạn</option>
                  <option value="personal">Cá nhân / Nghỉ ngơi</option>
                  <option value="planning">Lập kế hoạch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phục vụ mục tiêu</label>
                <select
                  value={newGoalId}
                  onChange={e => setNewGoalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none"
                >
                  <option value="">Ngoài mục tiêu chính (Outside goals)</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E0401F] hover:bg-[#d03515] text-white font-bold text-xs shadow-md shadow-red-500/25"
                >
                  Thêm vào lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
