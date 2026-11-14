// TAIO Time App — Goals Tab (PRD v0.3.33 Part H: Dossier Folders)
'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Goal, GoalProgressType } from '../types';
import { GoalFolders, WorkAreaType } from '../features/goals/folders';
import { Plus, Target, Sparkles, X } from 'lucide-react';
import { useT } from '@/i18n/useT';

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

export const GoalsTab: React.FC = () => {
  const {
    goals,
    scheduleBlocks,
    addGoalWithBackplanning,
    openDrilldown,
    deviceLook,
    showToast,
  } = useApp();
  const { t } = useT();

  const [activeArea, setActiveArea] = useState<WorkAreaType>('Product');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form states for new goal
  const [newGoalName, setNewGoalName] = useState<string>('');
  const [measurableResult, setMeasurableResult] = useState<string>('');
  const [horizonDays, setHorizonDays] = useState<number>(90);
  const [dailyBudgetMins, setDailyBudgetMins] = useState<number>(60);
  const [progressType, setProgressType] = useState<GoalProgressType>('tasks');
  const [keyResultTarget, setKeyResultTarget] = useState<number>(50);
  const [keyResultUnit, setKeyResultUnit] = useState<string>('đơn vị');
  const [committedHours, setCommittedHours] = useState<number>(30);

  // Layout orientation (Part H2: 'vertical' default on Mac; 'horizontal' for iPhone / phone view)
  const isPhone = deviceLook === 'phone' || (typeof window !== 'undefined' && window.innerWidth < 768);
  const orientation = isPhone ? 'horizontal' : 'vertical';

  // Summary statistics (Part H1.6)
  const totalGoals = goals.length;
  const dueSoonCount = goals.filter(g => (g.horizonDays && g.horizonDays <= 14) || (g.deadline && g.deadline.includes('7'))).length;

  const handleOpenCreateGoal = (area: WorkAreaType) => {
    setActiveArea(area);
    setShowAddModal(true);
  };

  const handleOpenDedicatedGoalPage = (goal: Goal) => {
    openDrilldown({
      type: 'goal_tasks',
      title: `Mục tiêu: ${goal.name}`,
      subtitle: `${goal.measurableResult || ''} • Hạn: ${goal.deadline || ''}`,
      goalId: goal.id,
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;

    const d = new Date();
    d.setDate(d.getDate() + Number(horizonDays));
    const deadlineStr = d.toLocaleDateString('vi-VN');

    addGoalWithBackplanning({
      name: newGoalName.trim(),
      measurableResult: measurableResult.trim() || newGoalName.trim(),
      horizonDays: Number(horizonDays),
      dailyBudgetMins: Number(dailyBudgetMins),
      deadline: deadlineStr,
      workArea: activeArea,
      progressType,
      keyResultCurrent: 0,
      keyResultTarget: Number(keyResultTarget) || 50,
      keyResultUnit: keyResultUnit.trim() || 'đơn vị',
      committedHours: Number(committedHours) || 30,
    });

    setNewGoalName('');
    setMeasurableResult('');
    setShowAddModal(false);
    showToast(t('goals.created_toast', `Đã thêm mục tiêu vào ngăn ${activeArea}!`));
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header: Single Row per Part H1.6 */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E0401F] flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {t('navbar.goals', 'Mục tiêu')}
            </h2>
            <p className="text-xs text-slate-500">
              {totalGoals} {t('goals.count_unit', 'mục tiêu')} · {dueSoonCount} {t('goals.due_soon', 'sắp tới hạn')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreateGoal(activeArea)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#E0401F] hover:bg-[#c83516] text-white font-bold text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('goals.add_goal', '+ Mục tiêu')}</span>
        </button>
      </div>

      {/* Main Dossier Folders Component */}
      <GoalFolders
        goals={goals}
        scheduleBlocks={scheduleBlocks}
        orientation={orientation}
        activeArea={activeArea}
        onActiveAreaChange={setActiveArea}
        onOpenCreateGoal={handleOpenCreateGoal}
        onOpenDedicatedGoalPage={handleOpenDedicatedGoalPage}
      />

      {/* Goal Creation Modal */}
      {showAddModal && (
        <div className="fixed app-overlay-safe z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E0401F]" />
                <h3 className="text-base font-bold text-slate-900">
                  {t('goals.modal_title', 'Thêm mục tiêu mới')} ({activeArea})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('goals.input_name', 'Tên mục tiêu lớn')}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newGoalName}
                  onChange={e => setNewGoalName(e.target.value)}
                  placeholder="Ví dụ: Ra mắt phiên bản 1.0..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#E0401F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('goals.input_measurable', 'Kết quả đo lường')}
                </label>
                <input
                  type="text"
                  value={measurableResult}
                  onChange={e => setMeasurableResult(e.target.value)}
                  placeholder="Ví dụ: Đạt 100 khách hàng trả phí đầu tiên"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#E0401F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('goals.input_progress_type', 'Cách tính tiến độ')}
                </label>
                <div className="space-y-1.5">
                  {PROGRESS_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setProgressType(opt.id)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                        progressType === opt.id
                          ? 'border-[#E0401F] bg-red-50/60 text-slate-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-bold">{opt.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('goals.input_horizon', 'Thời hạn')}
                  </label>
                  <select
                    value={horizonDays}
                    onChange={e => setHorizonDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value={30}>30 ngày (1 tháng)</option>
                    <option value={60}>60 ngày (2 tháng)</option>
                    <option value={90}>90 ngày (1 quý)</option>
                    <option value={180}>180 ngày (6 tháng)</option>
                    <option value={365}>365 ngày (1 năm)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('goals.input_budget', 'Ngân sách thời gian/ngày')}
                  </label>
                  <select
                    value={dailyBudgetMins}
                    onChange={e => setDailyBudgetMins(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value={30}>30 phút / ngày</option>
                    <option value={45}>45 phút / ngày</option>
                    <option value={60}>60 phút / ngày</option>
                    <option value={90}>90 phút / ngày</option>
                    <option value={120}>120 phút / ngày</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  {t('terms.cancel', 'Hủy')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E0401F] hover:bg-[#d03515] text-white font-bold shadow-xs"
                >
                  {t('goals.create_submit', 'Tạo mục tiêu')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
