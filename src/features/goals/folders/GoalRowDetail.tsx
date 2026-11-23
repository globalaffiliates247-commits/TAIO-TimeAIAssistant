// TAIO Time App — Goal Row Inline Expandable Detail (PRD v0.3.33 Part H & v0.3.54 Part M/N/O)
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
  ChevronDown 
} from 'lucide-react';
import { useT } from '@/i18n/useT';
import { useApp } from '@/context/AppContext';
import { MethodExplainer } from '../ui/MethodExplainer';

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

  const milestones = goal.milestones || [];

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
    const title = window.prompt(
      t('goals.promptTaskTitle')
    );
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

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
      {/* Top row: Measurable result + 4 Action Buttons (Part M3: touch target >= 24x24, gap >= 4px) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
        <div className="space-y-0.5">
          <span className="text-[10.5px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
            {t('goals.target_result', 'Kết quả then chốt')}
          </span>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            {goal.measurableResult || goal.name}
          </p>
        </div>

        {/* 4 Action Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
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
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title={t('goals.methodExplainerTitle')}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsAddingMilestone(true)}
                className="w-6 h-6 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title={t('goals.addMilestoneAction')}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* New Milestone Form */}
          {isAddingMilestone && (
            <form onSubmit={handleAddSubmit} className="p-2.5 rounded-lg bg-white dark:bg-slate-750 border border-[var(--taio-brand)]/40 space-y-2 shadow-2xs">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={t('goals.milestonePlaceholder')}
                className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none"
                autoFocus
              />
              <div className="flex items-center justify-between gap-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingMilestone(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded bg-[var(--taio-brand)] text-[var(--taio-on-brand)] font-bold text-xs"
                  >
                    {t('goals.saveMilestone')}
                  </button>
                </div>
              </div>
            </form>
          )}

          {milestones.length === 0 ? (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 italic py-2 space-y-1">
              <p>{t('goals.no_milestones', 'Chưa có cột mốc nào.')}</p>
              <button
                type="button"
                onClick={handleResetMilestones}
                className="text-[var(--taio-brand)] hover:underline font-medium not-italic"
              >
                {t('goals.suggest3Milestones')}
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {milestones.map((m, idx) => {
                const isCompleted = m.status === 'completed' || m.status === 'done';
                const isEditing = editingMilestoneId === m.id;

                if (isEditing) {
                  return (
                    <div key={m.id} className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 space-y-1.5 shadow-2xs">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="date"
                          value={editDate}
                          onChange={e => setEditDate(e.target.value)}
                          className="px-2 py-0.5 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingMilestoneId(null)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(m.id)}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 font-bold"
                          >
                            <Check className="w-3.5 h-3.5" />
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
