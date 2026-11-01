'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Goal } from '../types';
import { 
  Target, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  Layers, 
  Compass, 
  TrendingUp, 
  ArrowRight
} from 'lucide-react';

export const GoalsTab: React.FC = () => {
  const { goals, setGoals, addGoalWithBackplanning } = useApp();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form for Back-planning (PRD B7)
  const [newGoalName, setNewGoalName] = useState<string>('');
  const [measurableResult, setMeasurableResult] = useState<string>('');
  const [horizonDays, setHorizonDays] = useState<number>(90);
  const [dailyBudgetMins, setDailyBudgetMins] = useState<number>(60);
  const [workArea, setWorkArea] = useState<'Product' | 'Business' | 'Operations' | 'Personal'>('Product');

  const handleBackplanningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;

    // Calculate deadline date
    const d = new Date();
    d.setDate(d.getDate() + Number(horizonDays));
    const deadlineStr = d.toLocaleDateString('vi-VN');

    addGoalWithBackplanning({
      name: newGoalName,
      measurableResult,
      horizonDays: Number(horizonDays),
      dailyBudgetMins: Number(dailyBudgetMins),
      deadline: deadlineStr,
      workArea,
    });

    setNewGoalName('');
    setMeasurableResult('');
    setShowAddModal(false);
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const updatedM: typeof g.milestones = g.milestones.map(m => {
        if (m.id !== milestoneId) return m;
        const newStatus: 'pending' | 'completed' = m.status === 'completed' ? 'pending' : 'completed';
        return { ...m, status: newStatus };
      });
      const completedCount = updatedM.filter(m => m.status === 'completed').length;
      const progressPercent = Math.round((completedCount / updatedM.length) * 100);
      return { ...g, milestones: updatedM, progressPercent };
    }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-[#E0401F]" />
            <span>Mục tiêu & Lộ trình (Goals / Roadmap)</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 text-[#E0401F] border border-red-800/40">
              PRD D3: Red Accent
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Bao quát cả bề rộng (Breadth - các mảng việc) và bề sâu (Depth - hoàn thành rốt ráo)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E0401F] hover:bg-[#d03515] text-white text-xs font-semibold shadow-md shadow-red-950/30 transition-all self-start sm:self-center"
        >
          <Sparkles className="w-4 h-4" />
          <span>Lập mục tiêu ngược (Back-planning)</span>
        </button>
      </div>

      {/* Breadth Overview: Work Areas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['Product', 'Business', 'Operations', 'Personal'] as const).map(area => {
          const areaGoals = goals.filter(g => g.workArea === area);
          return (
            <div key={area} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{area}</span>
              <p className="text-lg font-bold text-white mt-1">{areaGoals.length} mục tiêu</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-orange-400">
                <TrendingUp className="w-3 h-3" />
                <span>Đang duy trì nhịp</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal Cards */}
      <div className="space-y-5">
        {goals.map((goal) => {
          const pendingMilestones = goal.milestones.filter(m => m.status === 'pending');
          const nextMilestone = pendingMilestones[0];

          return (
            <div key={goal.id} className="bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-950/40 text-orange-400 border border-orange-800/40">
                    {goal.workArea}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white">{goal.name}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>Hạn chót: <strong className="text-slate-200">{goal.deadline}</strong></span>
                  <span>Thời gian: <strong className="text-orange-400">{goal.dailyBudgetMins}p/ngày</strong></span>
                </div>
              </div>

              {/* Measurable Target */}
              <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wide">
                  Kết quả có thể đo lường (Measurable Result):
                </span>
                <p className="text-xs sm:text-sm text-slate-200 mt-0.5 font-medium">
                  {goal.measurableResult}
                </p>
              </div>

              {/* Progress Bar (PRD D3: Red Accent only on summary screens) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Tiến độ mục tiêu (Closeness to done)</span>
                  <span className="text-orange-400 font-bold">{goal.progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-[#E0401F] to-orange-500 rounded-full transition-all duration-500" 
                    style={{ width: `${goal.progressPercent}%` }} 
                  />
                </div>
              </div>

              {/* Milestones Hierarchy (Depth) */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Cột mốc thực thi (Milestones - Chiều sâu):
                </span>
                <div className="space-y-1.5">
                  {goal.milestones.map((m) => {
                    const isDone = m.status === 'completed';
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleMilestone(goal.id, m.id)}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isDone 
                            ? 'bg-slate-950/40 border-slate-800/60 opacity-60' 
                            : 'bg-slate-800/60 border-slate-700/60 hover:border-orange-500/50 hover:bg-slate-800/90'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-orange-400' : 'text-slate-600'}`} />
                          <span className={`text-xs sm:text-sm font-medium ${isDone ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                            {m.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {m.dueDate}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Back-planning Modal (PRD B7) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl text-white">
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 text-[#E0401F] text-xs font-semibold mb-2 border border-red-800/40">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kế hoạch ngược thông minh (Back-planning)</span>
              </div>
              <h3 className="text-lg font-bold">Thêm mục tiêu mới</h3>
              <p className="text-xs text-gray-400 mt-1">
                Bạn cung cấp tầm nhìn và thời gian mỗi ngày, TAIO sẽ tự động gợi ý các cột mốc thực thi.
              </p>
            </div>

            <form onSubmit={handleBackplanningSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Tên mục tiêu lớn</label>
                <input
                  type="text"
                  required
                  value={newGoalName}
                  onChange={e => setNewGoalName(e.target.value)}
                  placeholder="Ví dụ: Chinh phục thị trường Đông Nam Á..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-sm focus:outline-none focus:border-[#E0401F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Kết quả đo lường (Measurable Result)</label>
                <input
                  type="text"
                  required
                  value={measurableResult}
                  onChange={e => setMeasurableResult(e.target.value)}
                  placeholder="Ví dụ: Đạt 100 khách hàng trả phí đầu tiên"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-sm focus:outline-none focus:border-[#E0401F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Tầm nhìn (Horizon)</label>
                  <select
                    value={horizonDays}
                    onChange={e => setHorizonDays(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-sm focus:outline-none"
                  >
                    <option value={30}>30 ngày (1 tháng)</option>
                    <option value={60}>60 ngày (2 tháng)</option>
                    <option value={90}>90 ngày (1 quý)</option>
                    <option value={180}>180 ngày (6 tháng)</option>
                    <option value={365}>365 ngày (1 năm)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Ngân sách thời gian/ngày</label>
                  <select
                    value={dailyBudgetMins}
                    onChange={e => setDailyBudgetMins(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-sm focus:outline-none"
                  >
                    <option value={30}>30 phút / ngày</option>
                    <option value={45}>45 phút / ngày</option>
                    <option value={60}>60 phút / ngày</option>
                    <option value={90}>90 phút / ngày</option>
                    <option value={120}>120 phút / ngày</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Mảng công việc (Work Area)</label>
                <select
                  value={workArea}
                  onChange={e => setWorkArea(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-sm focus:outline-none"
                >
                  <option value="Product">Sản phẩm (Product)</option>
                  <option value="Business">Kinh doanh & Bán hàng (Business)</option>
                  <option value="Operations">Vận hành & Đội ngũ (Operations)</option>
                  <option value="Personal">Phát triển cá nhân (Personal)</option>
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
                  className="px-5 py-2.5 rounded-xl bg-[#E0401F] hover:bg-[#d03515] text-white font-medium text-xs shadow-md shadow-red-950/40"
                >
                  Tạo lộ trình mục tiêu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
