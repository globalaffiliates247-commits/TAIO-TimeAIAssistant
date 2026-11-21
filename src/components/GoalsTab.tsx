// TAIO Time App — Goals Tab (PRD v0.3.33 Part H: Dossier Folders)
'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Goal, GoalProgressType } from '../types';
import { GoalFolders, WorkAreaType } from '../features/goals/folders';
import { OverviewScreen } from '../features/overview';
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
    palette,
    language,
  } = useApp();
  const { t } = useT();

  const isCool = palette === 'cool';

  const progressTypeOptions: { id: GoalProgressType; label: string; desc: string }[] = [
    {
      id: 'tasks',
      label: language === 'en' ? 'Task Completion' : 'Hoàn thành các việc',
      desc: language === 'en'
        ? 'Tasks done divided by total goal tasks (1 unit per task)'
        : 'Số việc đã xong chia cho tổng số việc của mục tiêu (mỗi việc tính là 1 đơn vị)',
    },
    {
      id: 'key_result',
      label: language === 'en' ? 'Measurable Result' : 'Kết quả đo được',
      desc: language === 'en'
        ? 'Actual metric reached divided by target metric (one-tap update)'
        : 'Con số thực tế đạt được chia cho con số mục tiêu (cập nhật 1 chạm)',
    },
    {
      id: 'time_commitment',
      label: language === 'en' ? 'Time Commitment' : 'Có mặt đủ thời gian',
      desc: language === 'en'
        ? 'Hours spent divided by total committed hours (for practice, habits)'
        : 'Số giờ đã dành ra chia cho tổng số giờ cam kết (dành cho rèn luyện, thói quen)',
    },
  ];

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
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[var(--taio-brand-soft)] text-[var(--taio-brand)]">
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
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-white font-bold text-xs shadow-sm transition-all bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)]"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>{t('goals.add_goal', 'Mục tiêu')}</span>
        </button>
      </div>

      {/* PRD v0.3.38 Part B3.3: Toàn cảnh là phần đầu của tab Mục tiêu */}
      <OverviewScreen />

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
                <Sparkles className="w-4 h-4 text-[var(--taio-brand)]" />
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
                  placeholder={language === 'en' ? 'e.g. Launch version 1.0...' : 'Ví dụ: Ra mắt phiên bản 1.0...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[var(--taio-brand)] focus:ring-1 focus:ring-[var(--taio-brand)]"
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
                  placeholder={language === 'en' ? 'e.g. Reach 100 paying customers' : 'Ví dụ: Đạt 100 khách hàng trả phí đầu tiên'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[var(--taio-brand)] focus:ring-1 focus:ring-[var(--taio-brand)]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('goals.input_progress_type', 'Cách tính tiến độ')}
                </label>
                <div className="space-y-1.5">
                  {progressTypeOptions.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setProgressType(opt.id)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                        progressType === opt.id
                          ? 'border-[var(--taio-brand)] bg-[var(--taio-brand-soft)] text-slate-900 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100/70'
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
                    <option value={30}>{language === 'en' ? '30 days (1 month)' : '30 ngày (1 tháng)'}</option>
                    <option value={60}>{language === 'en' ? '60 days (2 months)' : '60 ngày (2 tháng)'}</option>
                    <option value={90}>{language === 'en' ? '90 days (1 quarter)' : '90 ngày (1 quý)'}</option>
                    <option value={180}>{language === 'en' ? '180 days (6 months)' : '180 ngày (6 tháng)'}</option>
                    <option value={365}>{language === 'en' ? '365 days (1 year)' : '365 ngày (1 năm)'}</option>
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
                    <option value={30}>{language === 'en' ? '30 mins / day' : '30 phút / ngày'}</option>
                    <option value={45}>{language === 'en' ? '45 mins / day' : '45 phút / ngày'}</option>
                    <option value={60}>{language === 'en' ? '60 mins / day' : '60 phút / ngày'}</option>
                    <option value={90}>{language === 'en' ? '90 mins / day' : '90 phút / ngày'}</option>
                    <option value={120}>{language === 'en' ? '120 mins / day' : '120 phút / ngày'}</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
                >
                  {t('terms.cancel', 'Hủy')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-bold shadow-xs transition-all bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)]"
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
