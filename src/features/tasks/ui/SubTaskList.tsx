// TAIO Time App — SubTask List Component (PRD v0.3.35 Part D)
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
import { Plus, X, Check, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export interface SubTaskListProps {
  parentId: string;
  childrenItems?: SubTask[];
  onUpdateChildren: (newChildren: SubTask[]) => void;
  isParentEditing?: boolean;
  autoFocusNew?: boolean;
  onDoneAutoFocus?: () => void;
  className?: string;
}

export const SubTaskList: React.FC<SubTaskListProps> = ({
  parentId,
  childrenItems = [],
  onUpdateChildren,
  isParentEditing = false,
  autoFocusNew = false,
  onDoneAutoFocus,
  className = '',
}) => {
  const { language, showToast } = useApp();
  const isEn = language === 'en';

  const [newTitle, setNewTitle] = useState('');
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusNew && newInputRef.current) {
      newInputRef.current.focus();
      onDoneAutoFocus?.();
    }
  }, [autoFocusNew, onDoneAutoFocus]);

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

    const { children, error } = addSubTask(childrenItems, newTitle);
    if (error) {
      showToast?.(error);
      return;
    }
    onUpdateChildren(children);
    setNewTitle('');
    // Keep focus in new input for consecutive fast typing (D6.2: Gõ tên việc con, bấm Enter: thêm việc con thứ hai)
    setTimeout(() => {
      newInputRef.current?.focus();
    }, 0);
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

  return (
    <div className={`space-y-1.5 ml-4 pl-3.5 border-l-2 border-slate-200/90 dark:border-slate-700/60 py-1 ${className}`}>
      {/* Existing sub-tasks */}
      {childrenItems.map((st, idx) => {
        const isEditing = editingSubId === st.id;

        return (
          <div
            key={st.id}
            className="group flex items-center justify-between gap-2 py-0.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Checkbox: toggling does NOT complete parent task (PRD D6.5) */}
              <button
                type="button"
                onClick={e => handleToggle(st.id, e)}
                className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                  st.done
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400'
                }`}
                title={st.done ? (isEn ? 'Mark incomplete' : 'Đánh dấu chưa xong') : (isEn ? 'Mark done' : 'Đánh dấu xong')}
              >
                {st.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </button>

              {/* Title / Inline Edit */}
              {isEditing ? (
                <input
                  type="text"
                  autoFocus
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  onBlur={() => handleSaveEdit(st.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveEdit(st.id);
                    if (e.key === 'Escape') setEditingSubId(null);
                  }}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-orange-500"
                />
              ) : (
                <span
                  onDoubleClick={() => {
                    setEditingSubId(st.id);
                    setEditingTitle(st.title);
                  }}
                  className={`truncate cursor-text ${
                    st.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                  }`}
                  title={st.title}
                >
                  {st.title}
                </span>
              )}
            </div>

            {/* Delete button on hover */}
            <button
              type="button"
              onClick={e => handleRemove(st.id, e)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
              title={isEn ? 'Remove subtask' : 'Xóa việc con'}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      {/* New subtask input line */}
      {childrenItems.length < MAX_SUBTASKS_PER_TASK ? (
        <div className="flex items-center gap-2 pt-0.5" onClick={e => e.stopPropagation()}>
          <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            ref={newInputRef}
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddNew();
              }
            }}
            placeholder={isEn ? 'Add subtask (Enter to save)...' : 'Thêm việc con (Enter để lưu)...'}
            className="flex-1 bg-transparent border-none text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none py-0.5"
          />
          {newTitle.trim() && (
            <button
              type="button"
              onClick={handleAddNew}
              className="text-[10.5px] px-2 py-0.5 rounded bg-slate-900 text-white font-medium hover:bg-black transition-colors"
            >
              {isEn ? 'Add' : 'Thêm'}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{isEn ? 'Limit reached (10/10 subtasks)' : 'Đã đạt giới hạn (10/10 việc con)'}</span>
        </div>
      )}
    </div>
  );
};
