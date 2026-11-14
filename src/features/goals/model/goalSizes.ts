import type { Goal } from '@/types';

export type GoalTShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

export const DEFAULT_GOAL_SIZE_HOURS: Record<GoalTShirtSize, number> = {
  XS: 4,
  S: 10,
  M: 40,
  L: 100,
  XL: 250,
};

export function getGoalTargetHours(
  goal: Goal,
  customSizes?: Record<GoalTShirtSize, number>
): number {
  if (typeof goal.committedHours === 'number' && goal.committedHours > 0) {
    return goal.committedHours;
  }
  if (goal.size) {
    const table = customSizes || DEFAULT_GOAL_SIZE_HOURS;
    return table[goal.size] || 40;
  }
  return 40;
}
