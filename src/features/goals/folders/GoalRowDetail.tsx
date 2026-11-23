// TAIO Time App — Goal Row Inline Expandable Detail (PRD v0.3.33 Part H & v0.3.54 Part M/N/O/P)
'use client';

import React, { useState } from 'react';
import { Goal, TimeBlock, Milestone } from '@/types';
import { 
  Flag, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  RotateCcw, 
  HelpCircle, 
  ChevronUp, 
  ChevronDown,
  FolderSync,
  Save
} from 'lucide-react';
import { useT } from '@/i18n/useT';
import { useApp } from '@/context/AppContext';
import { MethodExplainer } from '../ui/MethodExplainer';
import { getAreaLabel, getAreaQuestion } from './areaLabels';

export interface GoalRowDetailProps {
  goal: Goal;
  todayBlocks: TimeBlock[];
  onOpenDedicatedPage: () => void;
}

export const GoalRowDetail: React.FC<GoalRowDetailProps> = ({
  goal,
  todayBlocks,
  onOpenDedicatedPage,
}) => {
  const { t } = useT();
  const { 
    toggleMilestoneDone, 
    updateMilestone, 
    addMilestone, 
    deleteMilestone, 
    reorderMilestones, 
    resetMilestonesToSuggestions,
    deleteGoal,
    updateGoal,
    customAreaNames,
    profile,
    showToast,
    addDailyCardItem,
    selectedCardDate,
    language 
  } = useApp();

  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');

  // PRD Part P: Inline Goal Editing
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalName, setGoalName] = useState(goal.name);
  const [measurableResult, setMeasurableResult] = useState(goal.measurableResult || '');
  const [deadline, setDeadline] = useState(goal.deadline || '');

  // PRD Part P: Move Group Menu
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const milestones = goal.milestones || [];
  const standardAreas = ['Product', 'Business', 'Operations', 'Personal'] as const;

  const handleStartEdit = (m: Milestone) => {
    setEditingMilestoneId(m.id);
    setEditName(m.name);
    setEditDate(m.dueDate || '');
  };

  const handleSaveEdit = (mId: string) => {
    if (editName.trim()) {
      updateMilestone(goal.id, mId, { name: editName.trim(), dueDate: editDate.trim() });
    }
    setEditingMilestoneId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      addMilestone(goal.id, newName.trim(), newDate.trim() || goal.deadline || '');
      setNewName('');
      setNewDate('');
      setIsAddingMilestone(false);
    }
  };

  const handleMoveMilestone = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= milestones.length) return;
    const reordered = [...milestones];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    reorderMilestones(goal.id, reordered);
  };

  const handleAddTaskToGoal = () => {
    const title = window.prompt(t('goals.promptTaskTitle'));
    if (title && title.trim()) {
      addDailyCardItem({
        text: title.trim(),
        goalId: goal.id,
        goalName: goal.name,
        date: selectedCardDate,
        status: 'open',
      });
    }
  };

  const handleDeleteGoal = () => {
    if (window.confirm(t('goals.confirmDeleteGoal'))) {
      deleteGoal(goal.id);
    }
  };

  const handleResetMilestones = () => {
    if (window.confirm(t('goals.confirmResetMilestones'))) {
      resetMilestonesToSuggestions(goal.id);
    }
  };

  const handleSaveGoalInfo = () => {
    if (goalName.trim()) {
      updateGoal(goal.id, {
        name: goalName.trim(),
        measurableResult: measurableResult.trim() || goalName.trim(),
        deadline: deadline.trim(),
      });
      setIsEditingGoal(false);
      showToast(t('goals.goalDetailsUpdated', 'Đã lưu thông tin mục tiêu!'));
    }
  };

  const handleSelectArea = (targetArea: string) => {
    updateGoal(goal.id, { workArea: targetArea });
    setShowMoveMenu(false);
    const targetLabel = getAreaLabel(targetArea, profile?.type, customAreaNames, language);
    showToast(
      language === 'vi'
        ? `Đã chuyển sang nhóm ${targetLabel}!`
        : `Moved to ${targetLabel}!`
    );
  };

  const currentAreaLabel = getAreaLabel(goal.workArea || 'uncategorized', profile?.type, customAreaNames, language);

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
      {/* Top row: Measurable result + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
        {isEditingGoal ? (
          <div className="flex-1 space-y-2 pr-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                {t('goals.input_name', 'Tên mục tiêu')}
              </label>
              <input
                type="text"
                value={goalName}
                onChange={e => setGoalName(e.target.value)}
                className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  {t('goals.target_result', 'Kết quả then chốt')}
                </label>
                <input
                  type="text"
                  value={measurableResult}
                  onChange={e => setMeasurableResult(e.target.value)}
                  className="w-full text-xs px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  {t('goals.deadline', 'Hạn chót')}
                </label>
                <input
                  type="text"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full text-xs px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveGoalInfo}
                className="px-2.5 py-1 rounded-lg bg-[var(--taio-brand)] text-white text-xs font-semibold flex items-center gap-1 shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t('common.save', 'Lưu')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setGoalName(goal.name);
                  setMeasurableResult(goal.measurableResult || '');
                  setDeadline(goal.deadline || '');
                  setIsEditingGoal(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
              >
                {t('common.cancel', 'Hủy')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                {t('goals.target_result', 'Kết quả then chốt')}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {currentAreaLabel}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              {goal.measurableResult || goal.name}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 relative">
          {/* PRD Part P: Move Group Button with Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className="h-8 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              title={t('goals.changeCategory', 'Chuyển nhóm')}
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('goals.changeCategory', 'Chuyển nhóm')}</span>
            </button>

            {showMoveMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 z-40 w-64 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl space-y-1"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60 mb-1">
                  {t('goals.selectNewGroup', 'Chọn nhóm mới')}
                </div>
                {standardAreas.map(areaKey => {
                  const label = getAreaLabel(areaKey, profile?.type, customAreaNames, language);
                  const question = getAreaQuestion(areaKey, profile?.type, language);
                  const isCurrent = (goal.workArea || 'uncategorized') === areaKey;

                  return (
                    <button
                      key={areaKey}
                      type="button"
                      onClick={() => handleSelectArea(areaKey)}
                      className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex flex-col gap-0.5 cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{label}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight font-normal">
                        {question}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Edit Goal Button */}
          {!isEditingGoal && (
            <button
              type="button"
              onClick={() => setIsEditingGoal(true)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title={t('goals.editGoal', 'Sửa mục tiêu')}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleAddTaskToGoal}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title={t('goals.addTaskToGoal')}
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetMilestones}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title={t('goals.regenerateMilestones')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenDedicatedPage}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title={t('goals.open_page', 'Mở trang mục tiêu')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDeleteGoal}
            className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title={t('goals.deleteGoalAction')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid: 2 columns (Milestones & Today's tasks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
        {/* Column 1: Editable Milestones (Part N1 & O) */}
        <div className="space-y-2.5 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Flag className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('goals.milestones', 'Cột mốc')} ({milestones.length})</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsExplainerOpen(true)}
                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                title={t('goals.methodExplainerTitle', 'Giải thích phương pháp')}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsAddingMilestone(true)}
                className="text-[11px] text-[var(--taio-brand)] hover:underline font-semibold"
              >
                + {t('goals.addMilestone', 'Thêm mốc')}
              </button>
            </div>
          </div>

          {/* Inline Add Milestone Form */}
          {isAddingMilestone && (
            <form onSubmit={handleAddSubmit} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 space-y-2 shadow-2xs">
              <input
                type="text"
                autoFocus
                placeholder={t('goals.milestoneNamePlaceholder', 'Tên cột mốc mới...')}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
              />
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder={t('goals.dueDateFormatPlaceholder', 'Hạn chót (VD: 15/12)')}
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-32 px-2 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="submit"
                    className="p-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    title={t('common.save', 'Lưu')}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingMilestone(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={t('common.cancel', 'Hủy')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {milestones.length === 0 ? (
            <div className="text-center py-4 space-y-1">
              <p className="text-[11px] text-slate-400 italic">
                {t('goals.noMilestones')}
              </p>
              <button
                type="button"
                onClick={() => setIsExplainerOpen(true)}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                {t('goals.learnBackplanning', 'Tìm hiểu cách lập kế hoạch ngược')}
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {milestones.map((m, idx) => {
                const isCompleted = m.status === 'completed' || m.status === 'done';
                const isEditing = editingMilestoneId === m.id;

                if (isEditing) {
                  return (
                    <div
                      key={m.id}
                      className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1.5"
                    >
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                        autoFocus
                      />
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={editDate}
                          onChange={e => setEditDate(e.target.value)}
                          placeholder="Hạn chót"
                          className="w-28 px-2 py-0.5 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(m.id)}
                            className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMilestoneId(null)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs group"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleMilestoneDone(goal.id, m.id)}
                        className="w-5 h-5 flex items-center justify-center shrink-0 cursor-pointer"
                        title={isCompleted ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 transition-colors ${
                            isCompleted ? 'text-emerald-500 fill-emerald-100 dark:fill-emerald-950' : 'text-slate-300 hover:text-slate-500'
                          }`}
                        />
                      </button>
                      <span className={`text-[11.5px] truncate ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100 font-medium'}`}>
                        {m.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {m.dueDate && (
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mr-1">
                          {m.dueDate}
                        </span>
                      )}

                      {/* Reorder and Edit action icons on hover */}
                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveMilestone(idx, 'up')}
                          className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Di chuyển lên"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === milestones.length - 1}
                          onClick={() => handleMoveMilestone(idx, 'down')}
                          className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Di chuyển xuống"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(m)}
                          className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Sửa tên / ngày"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMilestone(goal.id, m.id)}
                          className="w-5 h-5 flex items-center justify-center text-rose-400 hover:text-rose-600 cursor-pointer"
                          title="Xoá cột mốc"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 2: Today's tasks */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{t('goals.today_tasks', 'Việc hôm nay')} ({todayBlocks.length})</span>
            </span>
            <button
              type="button"
              onClick={handleAddTaskToGoal}
              className="text-[11px] text-[var(--taio-brand)] hover:underline font-semibold"
            >
              + {t('goals.addTaskBtn')}
            </button>
          </div>

          {todayBlocks.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic py-2">
              {t('goals.no_today_tasks', 'Hôm nay chưa có việc nào gắn với mục tiêu này')}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {todayBlocks.map(b => (
                <div
                  key={b.id}
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11.5px] text-slate-800 dark:text-slate-200 truncate">
                      {b.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {b.startTime}–{b.endTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Explainer Modal */}
      <MethodExplainer isOpen={isExplainerOpen} onClose={() => setIsExplainerOpen(false)} />
    </div>
  );
};
