// TAIO Time App — SubTask Model & Helpers (PRD v0.3.35 Part D)
import { SubTask } from '@/types';

export const MAX_SUBTASKS_PER_TASK = 10;

export function generateSubTaskId(): string {
  const rand = Math.random().toString(36).substring(2, 8);
  return `st-${rand}`;
}

export function createSubTask(title: string, note?: string): SubTask {
  return {
    id: generateSubTaskId(),
    title: title.trim(),
    done: false,
    note: note?.trim(),
    createdAt: Date.now(),
  };
}

export function addSubTask(
  current: SubTask[] | undefined,
  title: string,
  note?: string
): { children: SubTask[]; error?: string; created?: SubTask } {
  const list = current ? [...current] : [];
  if (list.length >= MAX_SUBTASKS_PER_TASK) {
    return {
      children: list,
      error: 'Đã đủ 10 việc con / Maximum 10 subtasks reached',
    };
  }

  const sub = createSubTask(title, note);
  list.push(sub);
  return { children: list, created: sub };
}

export function toggleSubTask(
  current: SubTask[] | undefined,
  subTaskId: string
): SubTask[] {
  if (!current) return [];
  return current.map(st => (st.id === subTaskId ? { ...st, done: !st.done } : st));
}

export function updateSubTask(
  current: SubTask[] | undefined,
  subTaskId: string,
  updates: Partial<SubTask>
): SubTask[] {
  if (!current) return [];
  return current.map(st => (st.id === subTaskId ? { ...st, ...updates } : st));
}

export function removeSubTask(
  current: SubTask[] | undefined,
  subTaskId: string
): SubTask[] {
  if (!current) return [];
  return current.filter(st => st.id !== subTaskId);
}

export function getSubTaskProgress(children?: SubTask[]): {
  done: number;
  total: number;
  percent: number;
} {
  if (!children || children.length === 0) {
    return { done: 0, total: 0, percent: 0 };
  }
  const total = children.length;
  const done = children.filter(st => st.done).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, percent };
}
