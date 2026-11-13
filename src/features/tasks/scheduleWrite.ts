// PRD FIX v0.3.28 Part A1: Unified Schedule Write Gateway
import type { TimeBlock, DailyCardItem } from '@/types';

export interface ScheduleWriteContext {
  updateDailyCardItem: (id: string, patch: Partial<DailyCardItem>) => void;
  setBlocks: React.Dispatch<React.SetStateAction<TimeBlock[]>>;
  dailyCardItems?: DailyCardItem[];
}

/**
 * Unified schedule entry update:
 * - If id starts with 'dc-': updates the corresponding DailyCardItem in place
 *   (status, nextStep, end, and touchTimeMinutes -> extra.actualMinutes).
 * - Otherwise: updates blocks array via setBlocks.
 */
export function updateScheduleEntry(
  id: string,
  patch: Partial<TimeBlock>,
  ctx: ScheduleWriteContext
): void {
  if (id.startsWith('dc-')) {
    const cardPatch: Partial<DailyCardItem> = {};
    if (patch.title !== undefined) cardPatch.text = patch.title;
    if (patch.startTime !== undefined) cardPatch.start = patch.startTime;
    if (patch.endTime !== undefined) cardPatch.end = patch.endTime;
    if (patch.goalId !== undefined) cardPatch.goalId = patch.goalId;
    if (patch.goalName !== undefined) cardPatch.goalName = patch.goalName;
    if (patch.returnPoint !== undefined) cardPatch.nextStep = patch.returnPoint;
    if (patch.nextStep !== undefined) cardPatch.nextStep = patch.nextStep;

    if (patch.status !== undefined) {
      if (patch.status === 'done') cardPatch.status = 'done';
      else if (patch.status === 'dropped') cardPatch.status = 'dropped';
      else if (patch.status === 'partly_done') cardPatch.status = 'left';
      else cardPatch.status = 'open';
    }

    if (patch.touchTimeMinutes !== undefined || patch.extra !== undefined) {
      const existing = ctx.dailyCardItems?.find(it => it.id === id);
      const prevExtra = (existing?.extra as Record<string, unknown> | undefined) || {};
      const newExtra: Record<string, unknown> = {
        ...prevExtra,
        ...(patch.extra || {}),
      };
      if (patch.touchTimeMinutes !== undefined) {
        newExtra.actualMinutes = patch.touchTimeMinutes;
      }
      cardPatch.extra = newExtra;
    }

    ctx.updateDailyCardItem(id, cardPatch);
  } else {
    ctx.setBlocks(prev => prev.map(b => (b.id === id ? { ...b, ...patch } : b)));
  }
}
