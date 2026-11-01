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
  MoveRight, 
  Sparkles, 
  ChevronRight, 
  Target,
  AlertTriangle,
  Layers,
  LayoutGrid
} from 'lucide-react';

const TYPE_CONFIG: Record<BlockType, { label: string; bg: string; text: string; border: string }> = {
  deep: { label: 'Tập trung sâu', bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/40' },
  meeting: { label: 'Họp & Trao đổi', bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/40' },
  interruption: { label: 'Quỹ gián đoạn', bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/40' },
  personal: { label: 'Cá nhân & Nghỉ', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  planning: { label: 'Lập kế hoạch', bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/40' },
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
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <span>Kế hoạch thời gian (Plan)</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Xem và định hình ngày hôm nay cũng như tuần này • Chuyển đổi giữa Dòng thời gian & Ma trận ưu tiên
          </p>
        </div>

        {/* View Switcher: Timeline vs Priority Matrix */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-900 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveView('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'timeline' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Dòng thời gian</span>
            </button>
            <button
              onClick={() => setActiveView('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'matrix' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Ma trận ưu tiên (B16)</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm khối</span>
          </button>
        </div>
      </div>

      {activeView === 'matrix' ? (
        <PriorityMatrix />
      ) : (
        <>
          {/* Weekly Budget Progress (PRD B6) */}
      <div className="bg-[#121620] border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Ngân sách tuần (Weekly Budget)</span>
          </h3>
          <span className="text-xs text-gray-400">Đã dùng 18h / 40h kế hoạch</span>
        </div>

        <div className="space-y-3">
          {goals.map(g => (
            <div 
              key={g.id} 
              onClick={() => openDrilldown({
                type: 'goal_tasks',
                title: `Ngân sách & Nhiệm vụ: ${g.name}`,
                subtitle: `Ngân sách tuần: ${g.dailyBudgetMins * 5 / 60}h/tuần • Đang đúng tiến độ`,
                goalId: g.id,
              })}
              className="space-y-1 p-2 rounded-xl hover:bg-gray-900/60 transition-colors cursor-pointer group"
              title="Bấm để xem các việc phục vụ mục tiêu này"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-200 font-medium group-hover:text-indigo-300 transition-colors">{g.name}</span>
                <span className="text-gray-400">{g.dailyBudgetMins * 5 / 60}h/tuần (Mỗi ngày ~{g.dailyBudgetMins}p) ↗</span>
              </div>
              <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full group-hover:bg-indigo-400 transition-colors" 
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
            className="space-y-1 pt-1 p-2 rounded-xl hover:bg-gray-900/60 transition-colors cursor-pointer group"
            title="Bấm để xem nhật ký chen ngang"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-300 font-medium group-hover:text-amber-200">Quỹ dự phòng gián đoạn tuần</span>
              <span className="text-amber-400">Đã dùng 3.5h / 7.5h (Còn 53%) ↗</span>
            </div>
            <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full group-hover:bg-amber-400 transition-colors" style={{ width: '47%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Plan Timeline */}
      <div className="bg-[#121620] border border-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800/80">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Dòng thời gian hôm nay (Daily Timeline)</span>
          </h3>
          <span className="text-xs text-gray-400">
            Hồ sơ: <strong className="text-indigo-400">{profile.title}</strong>
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
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCurrent 
                    ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : isCompleted
                    ? 'border-gray-800/60 bg-gray-900/30 opacity-70'
                    : 'border-gray-800 bg-gray-900/70 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  {/* Time Badge */}
                  <div className="px-2.5 py-1 rounded-lg bg-gray-800 text-gray-300 text-xs font-semibold whitespace-nowrap">
                    {block.startTime} - {block.endTime}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${conf.bg} ${conf.text} ${conf.border}`}>
                        {conf.label}
                      </span>
                      {block.status === 'done' && (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Đã xong
                        </span>
                      )}
                      {block.status === 'in_progress' && (
                        <span className="text-[11px] text-amber-400 font-bold animate-pulse">
                          ● Đang chạy
                        </span>
                      )}
                    </div>
                    <h4 className={`text-sm font-bold mt-1 ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                      {block.title}
                    </h4>
                    {block.goalName && (
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Target className="w-3 h-3 text-indigo-400" />
                        <span>{block.goalName}</span>
                      </p>
                    )}
                  </div>
                </div>

                {block.returnPoint && (
                  <div className="text-xs bg-indigo-950/50 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-indigo-200 max-w-xs truncate">
                    <span className="font-semibold text-indigo-400">Điểm về: </span>
                    {block.returnPoint}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Important, Not Urgent List (PRD B6) */}
      <div className="bg-[#121620] border border-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Việc quan trọng, không khẩn cấp (Important, Not Urgent)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Các đầu việc lặp lại định kỳ giúp duy trì đà tăng trưởng. Chọn "Làm tuần này" để đưa vào lịch trống.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {IMPORTANT_NOT_URGENT_BACKLOG.map(item => (
            <div key={item.id} className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                <span className="text-[11px] text-gray-400">Dự kiến: {item.defaultMinutes} phút</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleAcceptBacklogItem(item)}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                >
                  Làm tuần này
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}

      {/* Add Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl text-white">
            <h3 className="text-base font-bold mb-4">Thêm khối thời gian mới</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Tên công việc</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Rà soát hợp đồng..."
                  className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Loại khối</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as BlockType)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm focus:outline-none"
                >
                  <option value="deep">Tập trung sâu (Deep Work)</option>
                  <option value="meeting">Họp hành (Meeting)</option>
                  <option value="interruption">Khung dự phòng gián đoạn</option>
                  <option value="personal">Cá nhân / Nghỉ ngơi</option>
                  <option value="planning">Lập kế hoạch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Phục vụ mục tiêu</label>
                <select
                  value={newGoalId}
                  onChange={e => setNewGoalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm focus:outline-none"
                >
                  <option value="">Ngoài mục tiêu chính (Outside goals)</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs"
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
