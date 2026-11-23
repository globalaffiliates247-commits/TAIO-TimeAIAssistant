// TAIO Time Domain — Pure WorkNode Data Model & Tree Hierarchies (PRD v0.3.38 Part C & Part F)
import type { Goal, Milestone, GoalProgressType } from '../types';

export type WorkNodeKind = 'goal' | 'project' | 'milestone';

export interface WorkNode {
  id: string;
  kind: WorkNodeKind;
  name: string;
  parentId?: string;
  desiredResult?: string;
  startDate?: string;
  deadline?: string;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  estimatedHours?: number;
  committedHours?: number;
  actualMinutes?: number;
  progressPercent: number;
  progressType?: GoalProgressType;
  status: 'active' | 'completed' | 'paused' | 'archived';
  workArea?: 'Business' | 'Product' | 'Operations' | 'Personal' | 'Other' | 'uncategorized' | string;
  priority?: 1 | 2 | 3 | 4;
  keyResultCurrent?: number;
  keyResultTarget?: number;
  keyResultUnit?: string;
  color?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  extra?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validation rules per PRD v0.3.38 Table C2:
 * - goal: Name required; desiredResult or committedHours required. Deadline, size, parentId optional.
 * - project: Name required; desiredResult (deliverable) and deadline required. ParentId optional (can be standalone).
 * - milestone: Name, parentId, and deadline required.
 */
export function validateWorkNode(node: Partial<WorkNode>): ValidationResult {
  const errors: string[] = [];
  if (!node.name || !node.name.trim()) {
    errors.push('Tên không được để trống');
  }

  const kind = node.kind || 'goal';

  if (kind === 'goal') {
    const hasResult = !!(node.desiredResult && node.desiredResult.trim());
    const hasCommitment = typeof node.committedHours === 'number' && node.committedHours > 0;
    if (!hasResult && !hasCommitment) {
      errors.push('Mục tiêu cần có kết quả đo được hoặc số giờ cam kết');
    }
  } else if (kind === 'project') {
    if (!node.deadline || !node.deadline.trim()) {
      errors.push('Dự án bắt buộc phải có hạn chót');
    }
    if (!node.desiredResult || !node.desiredResult.trim()) {
      errors.push('Dự án bắt buộc phải có sản phẩm bàn giao');
    }
  } else if (kind === 'milestone') {
    if (!node.deadline || !node.deadline.trim()) {
      errors.push('Mốc bắt buộc phải có hạn chót');
    }
    if (!node.parentId || !node.parentId.trim()) {
      errors.push('Mốc bắt buộc phải thuộc một mục tiêu hoặc dự án cha');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Migrate legacy Goals, Milestones, and project ListItems into unified WorkNode collection.
 * Preserves original IDs for zero data loss (Criterion C3.3).
 */
export function convertLegacyToWorkNodes(
  goals: Goal[] = [],
  projectItems: Array<{ id: string; text?: string; name?: string; goalId?: string; deadline?: string; progress?: number; projectStatus?: string; timeSpentMinutes?: number; nextAction?: string }> = []
): WorkNode[] {
  const nodes: WorkNode[] = [];
  const visitedIds = new Set<string>();

  // 1. Convert Goals
  for (const g of goals) {
    if (!g.id) continue;
    visitedIds.add(g.id);

    const goalNode: WorkNode = {
      id: g.id,
      kind: 'goal',
      name: g.name,
      desiredResult: g.measurableResult || '',
      startDate: g.start || g.commitment?.start,
      deadline: g.deadline,
      size: g.size || 'M',
      estimatedHours: g.size === 'XS' ? 4 : g.size === 'S' ? 10 : g.size === 'L' ? 100 : g.size === 'XL' ? 250 : 40,
      committedHours: g.committedHours,
      actualMinutes: g.actualMinutesTotal || 0,
      progressPercent: g.progressPercent || 0,
      progressType: g.progressType || 'tasks',
      status: g.progressPercent >= 100 ? 'completed' : 'active',
      workArea: g.workArea || 'Business',
      keyResultCurrent: g.keyResultCurrent,
      keyResultTarget: g.keyResultTarget,
      keyResultUnit: g.keyResultUnit,
      color: g.color,
      createdAt: g.commitment?.start || Date.now(),
      updatedAt: g.updatedAt || Date.now(),
      extra: g.extra,
    };
    nodes.push(goalNode);

    // 2. Convert nested milestones of each goal
    if (Array.isArray(g.milestones)) {
      for (const m of g.milestones) {
        if (!m.id || visitedIds.has(m.id)) continue;
        visitedIds.add(m.id);
        nodes.push({
          id: m.id,
          kind: 'milestone',
          name: m.name,
          parentId: g.id,
          deadline: m.dueDate,
          progressPercent: m.status === 'completed' ? 100 : 0,
          status: m.status === 'completed' ? 'completed' : 'active',
          workArea: g.workArea || 'Business',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
  }

  // 3. Convert Project listItems
  for (const p of projectItems) {
    if (!p.id || visitedIds.has(p.id)) continue;
    visitedIds.add(p.id);

    nodes.push({
      id: p.id,
      kind: 'project',
      name: p.name || p.text || 'Dự án',
      parentId: p.goalId,
      desiredResult: p.nextAction || 'Sản phẩm bàn giao',
      deadline: p.deadline || '',
      actualMinutes: p.timeSpentMinutes || 0,
      progressPercent: p.progress || 0,
      status: p.projectStatus === 'completed' ? 'completed' : 'active',
      workArea: 'Product',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  return nodes;
}

/**
 * Resolves effective target node id from a task (supporting nodeId, or legacy goalId/milestoneId).
 */
export function resolveTaskNodeId(task: { nodeId?: string; goalId?: string; milestoneId?: string }): string | undefined {
  return task.nodeId || task.milestoneId || task.goalId;
}

/**
 * Pure hierarchical roll-up of actual time from child nodes up to parent goals/projects.
 * Criterion C3.2: Tasks logged under a project roll up actual time to the parent goal!
 */
export function rollUpNodeMinutes(
  nodeId: string,
  nodes: WorkNode[],
  taskDirectMinutesMap: Record<string, number>
): number {
  let total = taskDirectMinutesMap[nodeId] || 0;

  // Find all children of this node recursively
  const children = nodes.filter(n => n.parentId === nodeId);
  for (const child of children) {
    total += rollUpNodeMinutes(child.id, nodes, taskDirectMinutesMap);
  }

  return total;
}
