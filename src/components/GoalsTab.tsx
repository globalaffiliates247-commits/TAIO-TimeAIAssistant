'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GoalProgressType } from '../types';
import { computeGoalMetrics, computeTaskTimeEfficiency } from '../features/goals/goalMetrics';
import {
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Gauge,
  Plus,
  Edit3
} from 'lucide-react';

const WORK_AREA_LABELS: Record<'Product' | 'Business' | 'Operations' | 'Personal', string> = {
  Product: 'Sản phẩm',
  Business: 'Kinh doanh',
  Operations: 'Vận hành',
  Personal: 'Cá nhân',
};

const PROGRESS_TYPE_OPTIONS: { id: GoalProgressType; label: string; desc: string }[] = [
  {
    id: 'tasks',
    label: 'Hoàn thành các việc',
    desc: 'Số việc đã xong chia cho tổng số việc của mục tiêu (mỗi việc tính là 1 đơn vị)',
  },
  {
    id: 'key_result',
    label: 'Kết quả đo được',
    desc: 'Con số thực tế đạt được chia cho con số mục tiêu (cập nhật 1 chạm)',
  },
  {
    id: 'time_commitment',
    label: 'Có mặt đủ thời gian',
    desc: 'Số giờ đã dành ra chia cho tổng số giờ cam kết (dành cho rèn luyện, thói quen)',
  },
];

const QUADRANT_ACTION_TAGS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Làm ngay',
  2: 'Lên lịch',
  3: 'Giao ngay',
  4: 'Loại bỏ',
};

export const GoalsTab: React.FC = () => {
  const {
    goals,
    setGoals,
    blocks,
    dailyCardItems,
    addGoalWithBackplanning,
    markTaskDone,
    addNewBlock,
    showToast
  } = useApp();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingKrGoalId, setEditingKrGoalId] = useState<string | null>(null);
  const [krInputVal, setKrInputVal] = useState<string>('');

  // Form for Back-planning (PRD B7)
  const [newGoalName, setNewGoalName] = useState<string>('');
  const [measurableResult, setMeasurableResult] = useState<string>('');
  const [horizonDays, setHorizonDays] = useState<number>(90);
  const [dailyBudgetMins, setDailyBudgetMins] = useState<number>(60);
  const [workArea, setWorkArea] = useState<'Product' | 'Business' | 'Operations' | 'Personal'>('Product');
  const [progressType, setProgressType] = useState<GoalProgressType>('tasks');
  const [keyResultTarget, setKeyResultTarget] = useState<number>(50);
  const [keyResultUnit, setKeyResultUnit] = useState<string>('người dùng');
  const [committedHours, setCommittedHours] = useState<number>(30);

  const handleBackplanningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;

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
      progressType,
      keyResultCurrent: 0,
      keyResultTarget: Number(keyResultTarget) || 50,
      keyResultUnit: keyResultUnit.trim() || 'đơn vị',
      committedHours: Number(committedHours) || 30,
    });

    setNewGoalName('');
    setMeasurableResult('');
    setProgressType('tasks');
    setShowAddModal(false);
    showToast(`Đã tạo mục tiêu "${newGoalName}"!`);
  };

  const handleChangeProgressType = (goalId: string, nextType: GoalProgressType) => {
    setGoals(prev =>
      prev.map(g => {
        if (g.id !== goalId) return g;
        const updated = {
          ...g,
          progressType: nextType,
          keyResultCurrent: g.keyResultCurrent ?? 10,
          keyResultTarget: g.keyResultTarget ?? 50,
          keyResultUnit: g.keyResultUnit || 'đơn vị',
          committedHours: g.committedHours ?? 20,
          updatedAt: Date.now(),
        };
        const metrics = computeGoalMetrics(updated, blocks, dailyCardItems);
        return { ...updated, progressPercent: metrics.progressPercent };
      })
    );
    showToast('Đã đổi cách tính phần trăm tiến độ của mục tiêu.');
  };

  const handleQuickUpdateKeyResult = (goalId: string, nextValue: number) => {
    setGoals(prev =>
      prev.map(g => {
        if (g.id !== goalId) return g;
        const updated = {
          ...g,
          keyResultCurrent: Math.max(0, nextValue),
          updatedAt: Date.now(),
        };
        const metrics = computeGoalMetrics(updated, blocks, dailyCardItems);
        return { ...updated, progressPercent: metrics.progressPercent };
      })
    );
    setEditingKrGoalId(null);
    showToast('Đã cập nhật con số kết quả thực tế!');
  };

  const handleAddTaskToGoal = (goalId: string, goalName: string) => {
    const title = prompt(`Nhập tên việc mới cho mục tiêu "${goalName}":`);
    if (!title || !title.trim()) return;
    addNewBlock({
      title: title.trim(),
      startTime: '16:30',
      endTime: '17:15',
      type: 'deep',
      status: 'planned',
      goalId,
      goalName,
      quadrant: 2,
      isImportant: true,
      isUrgent: false,
      estimatedMinutes: 45,
      deadline: 'Tuần này',
    });
    // Record that a new task was added (B7 v0.3.18: breaking a task or adding new tasks lowers % on purpose and shows note)
    setGoals(prev =>
      prev.map(g =>
        g.id === goalId
          ? {
              ...g,
              newTasksAddedCount: (g.newTasksAddedCount || 0) + 1,
              updatedAt: Date.now(),
            }
          : g
      )
    );
    showToast(`Đã thêm việc mới vào mục tiêu "${goalName}".`);
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prev =>
      prev.map(g => {
        if (g.id !== goalId) return g;
        const updatedM = g.milestones.map(m => {
          if (m.id !== milestoneId) return m;
          const newStatus: 'pending' | 'completed' = m.status === 'completed' ? 'pending' : 'completed';
          return { ...m, status: newStatus };
        });
        return { ...g, milestones: updatedM, updatedAt: Date.now() };
      })
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#E0401F]" />
            <span>Mục tiêu & Lộ trình</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi mức độ tiến gần tới đích và hiệu suất thời gian của từng mục tiêu lớn
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E0401F] hover:bg-[#d03515] text-white text-xs font-bold shadow-sm transition-all self-start sm:self-center"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span>Lập mục tiêu ngược</span>
        </button>
      </div>

      {/* Breadth Overview: Work Areas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['Product', 'Business', 'Operations', 'Personal'] as const).map(area => {
          const areaGoals = goals.filter(g => g.workArea === area);
          return (
            <div key={area} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {WORK_AREA_LABELS[area]}
              </span>
              <p className="text-lg font-bold text-slate-900 mt-1">{areaGoals.length} mục tiêu</p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-[#E0401F] font-semibold">
                <TrendingUp className="w-3 h-3" />
                <span>Đang duy trì nhịp</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal Cards */}
      <div className="space-y-5">
        {goals.map(goal => {
          const metrics = computeGoalMetrics(goal, blocks, dailyCardItems);
          const currentType = metrics.progressType;

          return (
            <div key={goal.id} className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-50 text-[#E0401F] border border-red-200">
                    {WORK_AREA_LABELS[goal.workArea] || goal.workArea}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">{goal.name}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>
                    Hạn chót: <strong className="text-slate-800">{goal.deadline}</strong>
                  </span>
                  <span>
                    Ngân sách: <strong className="text-[#E0401F]">{goal.dailyBudgetMins} phút/ngày</strong>
                  </span>
                </div>
              </div>

              {/* Measurable Target */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-[#E0401F] uppercase tracking-wide">
                  Kết quả đo lường:
                </span>
                <p className="text-xs sm:text-sm text-slate-800 mt-0.5 font-medium">
                  {goal.measurableResult}
                </p>
              </div>

              {/* B7 v0.3.18 & v0.3.19: Progress Type Selector + Dynamic % + Basis Line + Separate Effort & Time Efficiency */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                {/* Progress Type Switcher on Goal Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Cách tính tiến độ:
                  </span>
                  <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    {PROGRESS_TYPE_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleChangeProgressType(goal.id, opt.id)}
                        title={opt.desc}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          currentType === opt.id
                            ? 'bg-[#E0401F] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress % and One-line Basis right under the % */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700">Tiến độ hoàn thành</span>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        {metrics.basisText}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-black text-[#E0401F]">
                        {metrics.progressPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Flat progress bar (no gradient per D4/D5) */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#E0401F] rounded-full transition-all duration-500"
                      style={{ width: `${metrics.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* One-tap update for Key Result */}
                {currentType === 'key_result' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {editingKrGoalId === goal.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={krInputVal}
                          onChange={e => setKrInputVal(e.target.value)}
                          className="w-24 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900"
                        />
                        <span className="text-xs text-slate-500">
                          / {goal.keyResultTarget || 100} {goal.keyResultUnit || 'đơn vị'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickUpdateKeyResult(goal.id, Number(krInputVal))}
                          className="px-2.5 py-1 rounded-lg bg-[#E0401F] text-white text-xs font-bold"
                        >
                          Lưu
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickUpdateKeyResult(
                              goal.id,
                              (goal.keyResultCurrent || 0) + 1
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800"
                        >
                          +1 {goal.keyResultUnit || 'đơn vị'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingKrGoalId(goal.id);
                            setKrInputVal(String(goal.keyResultCurrent ?? 0));
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Cập nhật số liệu</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Separate Effort Hours & Time Efficiency (B7 v0.3.19: never mixed into % for key_result and tasks) */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Đã dành: {metrics.effortText}</span>
                  </span>

                  {metrics.timeEfficiencyPercent !== null && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border ${
                        metrics.timeEfficiencyPercent >= 100
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                      title="Hiệu suất thời gian = Thời gian ước lượng của các việc đã xong ÷ Thời gian thực tế đã bỏ ra (>100% là nhanh hơn dự kiến)"
                    >
                      <Gauge className="w-3.5 h-3.5" />
                      <span>
                        Hiệu suất thời gian: {metrics.timeEfficiencyPercent}% (ước lượng {metrics.estimatedDoneMinutes} phút / thực tế {metrics.actualDoneMinutes} phút)
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Milestones Hierarchy (Depth) */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Cột mốc thực thi:
                </span>
                <div className="space-y-1.5">
                  {goal.milestones.map(m => {
                    const isDone = m.status === 'completed';
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleMilestone(goal.id, m.id)}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isDone
                            ? 'bg-slate-50 border-slate-200 opacity-65'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className={`text-xs sm:text-sm font-medium ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {m.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 whitespace-nowrap">
                          {m.dueDate}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tasks linked to this Goal */}
              {(() => {
                const goalTasks = blocks.filter(b => b.goalId === goal.id && b.status !== 'dropped');
                const totalPlannedMins = goalTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 60), 0);
                return (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Công việc thuộc mục tiêu ({metrics.completedTasksCount}/{metrics.totalTasksCount} việc hoàn thành • dự kiến {totalPlannedMins} phút):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddTaskToGoal(goal.id, goal.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold"
                      >
                        <Plus className="w-3 h-3 text-[#E0401F]" />
                        <span>Thêm việc</span>
                      </button>
                    </div>
                    {goalTasks.length > 0 && (
                      <div className="space-y-1.5">
                        {goalTasks.map(t => {
                          const eff = t.status === 'done' ? computeTaskTimeEfficiency(t) : null;
                          return (
                            <div
                              key={t.id}
                              onClick={() => markTaskDone(t.id)}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${t.status === 'done' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span className={`font-medium truncate ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                  {t.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-slate-500 font-mono">
                                {eff && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                                    Hiệu suất {eff.efficiencyPercent}%
                                  </span>
                                )}
                                {t.quadrant && (
                                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700">
                                    {QUADRANT_ACTION_TAGS[t.quadrant]}
                                  </span>
                                )}
                                <span>{t.startTime}–{t.endTime}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {/* Back-planning Modal (PRD B7) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#E0401F] text-xs font-semibold mb-2 border border-red-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kế hoạch ngược thông minh</span>
              </div>
              <h3 className="text-lg font-bold">Thêm mục tiêu mới</h3>
              <p className="text-xs text-slate-500 mt-1">
                Chọn cách đo tiến độ phù hợp để biết chính xác bạn đã tiến gần tới đích bao nhiêu phần trăm.
              </p>
            </div>

            <form onSubmit={handleBackplanningSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên mục tiêu lớn</label>
                <input
                  type="text"
                  required
                  value={newGoalName}
                  onChange={e => setNewGoalName(e.target.value)}
                  placeholder="Ví dụ: Ra mắt phiên bản chính thức..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#E0401F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Kết quả đo lường</label>
                <input
                  type="text"
                  required
                  value={measurableResult}
                  onChange={e => setMeasurableResult(e.target.value)}
                  placeholder="Ví dụ: Đạt 100 khách hàng trả phí đầu tiên"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#E0401F]"
                />
              </div>

              {/* B7 v0.3.18: Choose Progress Type when creating goal */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Cách tính phần trăm tiến độ (mặc định: Hoàn thành các việc)
                </label>
                <div className="space-y-2">
                  {PROGRESS_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setProgressType(opt.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        progressType === opt.id
                          ? 'border-[#E0401F] bg-red-50/60 text-slate-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {progressType === 'key_result' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Con số mục tiêu</label>
                    <input
                      type="number"
                      min={1}
                      value={keyResultTarget}
                      onChange={e => setKeyResultTarget(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Đơn vị đo</label>
                    <input
                      type="text"
                      value={keyResultUnit}
                      onChange={e => setKeyResultUnit(e.target.value)}
                      placeholder="người dùng, bài viết..."
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                </div>
              )}

              {progressType === 'time_commitment' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tổng số giờ cam kết</label>
                  <input
                    type="number"
                    min={1}
                    value={committedHours}
                    onChange={e => setCommittedHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Thời hạn</label>
                  <select
                    value={horizonDays}
                    onChange={e => setHorizonDays(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none"
                  >
                    <option value={30}>30 ngày (1 tháng)</option>
                    <option value={60}>60 ngày (2 tháng)</option>
                    <option value={90}>90 ngày (1 quý)</option>
                    <option value={180}>180 ngày (6 tháng)</option>
                    <option value={365}>365 ngày (1 năm)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ngân sách thời gian/ngày</label>
                  <select
                    value={dailyBudgetMins}
                    onChange={e => setDailyBudgetMins(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none"
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mảng công việc</label>
                <select
                  value={workArea}
                  onChange={e => setWorkArea(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none"
                >
                  <option value="Product">Sản phẩm</option>
                  <option value="Business">Kinh doanh & Bán hàng</option>
                  <option value="Operations">Vận hành & Đội ngũ</option>
                  <option value="Personal">Phát triển cá nhân</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E0401F] hover:bg-[#d03515] text-white font-bold text-xs shadow-sm"
                >
                  Tạo mục tiêu & Lộ trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
