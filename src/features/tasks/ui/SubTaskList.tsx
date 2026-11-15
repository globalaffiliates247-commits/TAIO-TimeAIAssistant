// TAIO Time App — SubTask List Component (PRD v0.3.35 Part D & v0.3.37 Part F)
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SubTask } from '@/types';
import {
  MAX_SUBTASKS_PER_TASK,
  addSubTask,
  toggleSubTask,
  updateSubTask,
  removeSubTask,
} from '../model/subTaskModel';
import { parseTimedText } from '@/features/sticky/model/timeline';
import { Plus, X, Check, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export interface SubTaskListProps {
  parentId: string;
  childrenItems?: SubTask[];
  onUpdateChildren: (newChildren: SubTask[]) => void;
  isParentEditing?: boolean;
  autoFocusNew?: boolean;
  onDoneAutoFocus?: () => void;
  isInputOpen?: boolean;
  onCloseInput?: () => void;
  onFocusParent?: () => void;
  parentDurationMins?: number;
  gapToNextMins?: number;
  className?: string;
}

export const SubTaskList: React.FC<SubTaskListProps> = ({
  parentId,
  childrenItems = [],
  onUpdateChildren,
  isParentEditing = false,
  autoFocusNew = false,
  onDoneAutoFocus,
  isInputOpen = false,
  onCloseInput,
  onFocusParent,
  parentDurationMins,
  gapToNextMins,
  className = '',
}) => {
  const { language, showToast } = useApp();
  const isEn = language === 'en';

  const [newTitle, setNewTitle] = useState('');
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((autoFocusNew || isInputOpen) && newInputRef.current) {
      newInputRef.current.focus();
      onDoneAutoFocus?.();
    }
  }, [autoFocusNew, isInputOpen, onDoneAutoFocus]);

  const handleToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleSubTask(childrenItems, id);
    onUpdateChildren(updated);
  };

  const handleAddNew = () => {
    if (!newTitle.trim()) return;
    if (childrenItems.length >= MAX_SUBTASKS_PER_TASK) {
      showToast?.(isEn ? 'Maximum 10 subtasks reached' : 'Đã đủ tối đa 10 việc con');
      return;
    }

    const parsed = parseTimedText(newTitle);
    const cleanTitle = parsed.rest || newTitle.trim();
    let subMins = parsed.durationMins;

    if (!subMins) {
      // Auto-allocate duration based on parent task's budget or gap to next task
      const totalBudget = parentDurationMins || (gapToNextMins && gapToNextMins > 0 ? gapToNextMins : 30);
      const assignedSoFar = childrenItems.reduce((sum, c) => sum + (c.estimatedMinutes || 0), 0);
      const remainingBudget = Math.max(0, totalBudget - assignedSoFar);
      if (remainingBudget >= 10) {
        subMins = Math.max(5, Math.min(remainingBudget, Math.round(remainingBudget / 2)));
      } else {
        subMins = Math.max(5, Math.floor(totalBudget / (childrenItems.length + 1)));
      }
    }

    const { children, error } = addSubTask(childrenItems, cleanTitle, undefined, subMins);
    if (error) {
      showToast?.(error);
      return;
    }
    onUpdateChildren(children);
    setNewTitle('');
    // Keep focus in new input for consecutive fast typing
    setTimeout(() => {
      newInputRef.current?.focus();
    }, 0);
  };

  const handleBlurNew = () => {
    if (newTitle.trim()) {
      handleAddNew();
    } else {
      onCloseInput?.();
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeSubTask(childrenItems, id);
    onUpdateChildren(updated);
  };

  const handleSaveEdit = (id: string) => {
    if (editingTitle.trim()) {
      const updated = updateSubTask(childrenItems, id, { title: editingTitle.trim() });
      onUpdateChildren(updated);
    }
    setEditingSubId(null);
  };

  // Rule F2.4 & F2.5: If no subtasks exist and input is not open, do not render empty tree line
  if (childrenItems.length === 0 && !isInputOpen && !autoFocusNew) {
    return null;
  }

  return (
    <div className={`space-y-1.5 ml-4 pl-3.5 border-l-2 border-slate-200/90 py-1 ${className}`}>
      {/* Existing sub-tasks */}
      {childrenItems.map((st, idx) => {
        const isEditing = editingSubId === st.id;

        return (
          <div
            key={st.id}
            className="group flex items-center justify-between gap-2 py-0.5 text-xs text-slate-700 hover:text-slate-900"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Checkbox toggle */}
              <button
                type="button"
                onClick={e => handleToggle(st.id, e)}
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  st.done
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 hover:border-slate-400 bg-white'
                }`}
                title={st.done ? (isEn ? 'Mark undone' : 'Đánh dấu chưa xong') : (isEn ? 'Mark done' : 'Đánh dấu xong')}
              >
                {st.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </button>

              {/* Title or edit input */}
              {isEditing ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  onBlur={() => handleSaveEdit(st.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveEdit(st.id);
                    if (e.key === 'Escape') setEditingSubId(null);
                  }}
                  autoFocus
                  className="flex-1 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                />
              ) : (
                <span
                  onDoubleClick={() => {
                    setEditingSubId(st.id);
                    setEditingTitle(st.title);
                  }}
                  className={`truncate cursor-text ${
                    st.done ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}
                  title={st.title}
                >
                  {st.title}
                </span>
              )}

              {Boolean(st.estimatedMinutes) && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 font-mono font-medium shrink-0">
                  {st.estimatedMinutes}p
                </span>
              )}
            </div>

            {/* Delete button on hover */}
            <button
              type="button"
              onClick={e => handleRemove(st.id, e)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-all cursor-pointer shrink-0"
              title={isEn ? 'Remove subtask' : 'Xóa việc con'}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      {/* New subtask input line (Rule F2.5: only shown on demand, never static) */}
      {(isInputOpen || autoFocusNew) && childrenItems.length < MAX_SUBTASKS_PER_TASK && (
        <div className="flex items-center gap-2 pt-0.5" onClick={e => e.stopPropagation()}>
          <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            ref={newInputRef}
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onBlur={handleBlurNew}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (newTitle.trim()) {
                  handleAddNew();
                } else {
                  // Rule F2.3: Empty + Enter closes subtask input and returns to parent line
                  onCloseInput?.();
                  onFocusParent?.();
                }
              } else if (e.key === 'Backspace' && !newTitle) {
                // Rule F2.3: Empty + Backspace closes subtask input
                e.preventDefault();
                onCloseInput?.();
                onFocusParent?.();
              } else if (e.key === 'Escape') {
                // Rule F2.3: Escape closes subtask input
                e.preventDefault();
                onCloseInput?.();
                onFocusParent?.();
              }
            }}
            placeholder={isEn ? 'Add subtask (Enter to save)...' : 'Thêm việc con (Enter để lưu)...'}
            className="flex-1 bg-transparent border-none text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none py-0.5"
          />
          {newTitle.trim() && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddNew();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddNew();
              }}
              className="text-[10.5px] px-2 py-0.5 rounded bg-slate-900 text-white font-medium hover:bg-black transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              {isEn ? 'Add' : 'Thêm'}
            </button>
          )}
        </div>
      )}

      {childrenItems.length >= MAX_SUBTASKS_PER_TASK && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium pt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{isEn ? 'Limit reached (10/10 subtasks)' : 'Đã đạt giới hạn (10/10 việc con)'}</span>
        </div>
      )}
    </div>
  );
};
