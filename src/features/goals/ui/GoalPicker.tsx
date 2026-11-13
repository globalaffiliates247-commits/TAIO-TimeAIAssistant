// TAIO Time App — GoalPicker Component (PRD FIX v0.3.32 Part A)
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Goal, Milestone } from '@/types';
import { useApp } from '@/context/AppContext';
import { useT } from '@/i18n/useT';
import { Target, ChevronRight, ChevronDown, Plus, Search, Check, X } from 'lucide-react';

export interface GoalPickerProps {
  currentGoalId?: string;
  currentMilestoneId?: string;
  onSelect: (goalId?: string, goalName?: string, milestoneId?: string, milestoneName?: string) => void;
  onClose: () => void;
  initialSearch?: string;
  className?: string;
}

const RECENT_GOALS_KEY = 'taio_recent_goals';

export function getRecentGoalIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_GOALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecentGoalId(goalId: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecentGoalIds().filter(id => id !== goalId);
    current.unshift(goalId);
    localStorage.setItem(RECENT_GOALS_KEY, JSON.stringify(current.slice(0, 10)));
  } catch {
    // Ignore
  }
}

const stripAccents = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export const GoalPicker: React.FC<GoalPickerProps> = ({
  currentGoalId,
  currentMilestoneId,
  onSelect,
  onClose,
  initialSearch = '',
  className = '',
}) => {
  const { goals, addGoalWithBackplanning } = useApp();
  const { t } = useT();
  const [search, setSearch] = useState(initialSearch);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(
    () => new Set(currentGoalId ? [currentGoalId] : [])
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Sort goals: most recently used on top
  const sortedGoals = useMemo(() => {
    const recentIds = getRecentGoalIds();
    const rankMap = new Map<string, number>();
    recentIds.forEach((id, idx) => rankMap.set(id, idx));

    return [...goals].sort((a, b) => {
      const rankA = rankMap.has(a.id) ? rankMap.get(a.id)! : 999;
      const rankB = rankMap.has(b.id) ? rankMap.get(b.id)! : 999;
      if (rankA !== rankB) return rankA - rankB;
      return (b.updatedAt ? Number(b.updatedAt) : 0) - (a.updatedAt ? Number(a.updatedAt) : 0);
    });
  }, [goals]);

  // Filter goals & milestones by search query
  const filteredItems = useMemo(() => {
    const q = stripAccents(search);
    if (!q) return sortedGoals;

    return sortedGoals.filter(g => {
      const nameMatch = stripAccents(g.name).includes(q);
      const milestoneMatch = g.milestones?.some(
        m => m.status !== 'completed' && stripAccents(m.name).includes(q)
      );
      return nameMatch || milestoneMatch;
    });
  }, [sortedGoals, search]);

  const toggleExpand = (goalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGoals(prev => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  };

  const handleSelectGoal = (goal: Goal) => {
    saveRecentGoalId(goal.id);
    onSelect(goal.id, goal.name, undefined, undefined);
    onClose();
  };

  const handleSelectMilestone = (goal: Goal, milestone: Milestone) => {
    saveRecentGoalId(goal.id);
    onSelect(goal.id, goal.name, milestone.id, milestone.name);
    onClose();
  };

  const handleClearGoal = () => {
    onSelect(undefined, undefined, undefined, undefined);
    onClose();
  };

  const handleCreateNewGoal = () => {
    const title = newGoalTitle.trim();
    if (!title) return;

    // Create new goal with default 30-day horizon
    const generatedMilestones: Milestone[] = [
      { id: `m-${Date.now()}-1`, goalId: '', name: 'Giai đoạn 1: Chuẩn bị', dueDate: '10 ngày tới', status: 'pending' },
      { id: `m-${Date.now()}-2`, goalId: '', name: 'Giai đoạn 2: Triển khai', dueDate: '20 ngày tới', status: 'pending' },
      { id: `m-${Date.now()}-3`, goalId: '', name: 'Giai đoạn 3: Hoàn thiện', dueDate: '30 ngày tới', status: 'pending' },
    ];

    const newGoalId = `g-${Date.now()}`;
    addGoalWithBackplanning({
      name: title,
      measurableResult: title,
      horizonDays: 30,
      dailyBudgetMins: 60,
      deadline: '30 ngày tới',
      workArea: 'Personal',
      progressType: 'tasks',
    });

    saveRecentGoalId(newGoalId);
    onSelect(newGoalId, title, undefined, undefined);
    onClose();
  };

  const showSearch = goals.length >= 6 || !!search;

  return (
    <div
      ref={containerRef}
      onMouseDown={e => {
        // Prevent active input from blurring prematurely
        e.stopPropagation();
      }}
      className={`absolute z-50 mt-1 w-72 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden text-xs flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-150 ${className}`}
      style={{ maxHeight: 360 }}
    >
      {/* Search Input (shown when >= 6 goals or filtered) */}
      {showSearch && (
        <div className="p-2 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50/70">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('goals.searchPlaceholder') || 'Tìm mục tiêu...'}
            className="flex-1 bg-transparent outline-none text-xs text-slate-800 placeholder:text-slate-400 min-w-0"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="p-0.5 rounded hover:bg-slate-200 text-slate-400"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Action rows: "Không gắn mục tiêu" and "+ Mục tiêu mới" */}
      <div className="p-1.5 border-b border-slate-100 flex flex-col gap-0.5 bg-white">
        <button
          type="button"
          onClick={handleClearGoal}
          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-between text-slate-600 hover:text-slate-900 transition-colors"
        >
          <span className="font-normal">{t('goals.noGoal') || 'Không gắn mục tiêu'}</span>
          {!currentGoalId && <Check className="w-3.5 h-3.5 text-emerald-600" />}
        </button>

        {!isCreatingNew ? (
          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 text-blue-600 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('goals.newGoal') || '+ Mục tiêu mới'}</span>
          </button>
        ) : (
          <div className="p-1 flex items-center gap-1 bg-slate-50 rounded-lg border border-blue-200">
            <input
              type="text"
              value={newGoalTitle}
              onChange={e => setNewGoalTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateNewGoal();
                if (e.key === 'Escape') setIsCreatingNew(false);
              }}
              placeholder={t('goals.enterNewGoalName') || 'Tên mục tiêu, Enter để tạo...'}
              className="flex-1 bg-transparent outline-none text-xs px-1 text-slate-800 placeholder:text-slate-400"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreateNewGoal}
              className="px-2 py-0.5 rounded bg-blue-600 text-white font-medium text-[11px]"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* Goals & Milestones Tree */}
      <div className="overflow-y-auto flex-1 p-1 space-y-0.5">
        {filteredItems.length === 0 ? (
          <div className="py-4 text-center text-slate-400 text-xs">
            {search ? 'Không tìm thấy mục tiêu phù hợp' : 'Chưa có mục tiêu'}
          </div>
        ) : (
          filteredItems.map(goal => {
            const isGoalSelected = currentGoalId === goal.id && !currentMilestoneId;
            const hasMilestones = (goal.milestones || []).filter(m => m.status !== 'completed').length > 0;
            const isExpanded = expandedGoals.has(goal.id) || !!search;
            const activeMilestones = (goal.milestones || []).filter(m => m.status !== 'completed');

            return (
              <div key={goal.id} className="flex flex-col">
                {/* Goal Item */}
                <div
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    isGoalSelected
                      ? 'bg-blue-50 text-blue-800 font-semibold'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                  onClick={() => handleSelectGoal(goal)}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {hasMilestones ? (
                      <button
                        type="button"
                        onClick={e => toggleExpand(goal.id, e)}
                        className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ) : (
                      <span className="w-4" />
                    )}
                    <span className="truncate">{goal.name}</span>
                  </div>
                  {isGoalSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </div>

                {/* Milestone Sub-items (Indented 1 level) */}
                {hasMilestones && isExpanded && (
                  <div className="ml-5 pl-2 border-l border-slate-200 space-y-0.5 py-0.5">
                    {activeMilestones.map(m => {
                      const isMilestoneSelected = currentMilestoneId === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleSelectMilestone(goal, m)}
                          className={`flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-colors ${
                            isMilestoneSelected
                              ? 'bg-blue-50 text-blue-800 font-semibold'
                              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span className="truncate">{m.name}</span>
                          {isMilestoneSelected && (
                            <Check className="w-3 h-3 text-blue-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
