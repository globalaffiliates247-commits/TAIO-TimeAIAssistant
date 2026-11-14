// PRD FIX v0.3.28 Part A1: Unified Schedule Write Gateway
import type { TimeBlock, DailyCardItem } from '@/types';
import { timeToMinutes, minutesToTime, getDeviceTimeMinutes, getDeviceCalendarDate } from '@/core/clock';

export interface ScheduleWriteContext {
  updateDailyCardItem: (id: string, patch: Partial<DailyCardItem>) => void;
  setBlocks: React.Dispatch<React.SetStateAction<TimeBlock[]>>;
  dailyCardItems?: DailyCardItem[];
  dayCloseConfig?: { enabled: boolean; time: string; activeDays: number[]; durationMins?: number };
  dayCloseOverrides?: Record<string, { time: string; endTime?: string; durationMins?: number; status?: import('@/types').BlockStatus; count?: number; history?: Array<{ from: string; to: string; at: number }> }>;
  setDayCloseOverrides?: React.Dispatch<React.SetStateAction<Record<string, { time: string; endTime?: string; durationMins?: number; status?: import('@/types').BlockStatus; count?: number; history?: Array<{ from: string; to: string; at: number }> }>>>;
}

/**
 * Unified schedule entry update:
 * - If id is b-user-dayclose or b-ritual-close: updates dayCloseOverrides for today.
 * - If id starts with 'dc-': updates the corresponding DailyCardItem in place
 *   (status, nextStep, end, and touchTimeMinutes -> extra.actualMinutes).
 * - Otherwise: updates blocks array via setBlocks.
 */
export function updateScheduleEntry(
  id: string,
  patch: Partial<TimeBlock>,
  ctx: ScheduleWriteContext
): void {
  // Day-close ritual handler (PRD v0.3.36 Part E)
  if (id === 'b-user-dayclose' || id === 'b-ritual-close') {
    if (ctx.setDayCloseOverrides) {
      const today = getDeviceCalendarDate();
      ctx.setDayCloseOverrides(prev => {
        const cur = prev[today] || {};
        const newTime = patch.startTime || cur.time || ctx.dayCloseConfig?.time || '21:30';
        const newEndTime = patch.endTime || cur.endTime;
        const newStatus = patch.status !== undefined
          ? (patch.status === 'done' ? 'done' : patch.status === 'dropped' ? 'dropped' : 'planned')
          : (cur.status || 'planned');
        return {
          ...prev,
          [today]: {
            ...cur,
            time: newTime,
            endTime: newEndTime,
            status: newStatus,
          },
        };
      });
    }
    return;
  }

  const isCardItem = id.startsWith('dc-') || ctx.dailyCardItems?.some(it => it.id === id);
  if (isCardItem) {
    const cardPatch: Partial<DailyCardItem> = {};
    if (patch.title !== undefined) cardPatch.text = patch.title;
    if (patch.startTime !== undefined) cardPatch.start = patch.startTime;
    if (patch.endTime !== undefined) cardPatch.end = patch.endTime;
    if (patch.goalId !== undefined) cardPatch.goalId = patch.goalId;
    if (patch.goalName !== undefined) cardPatch.goalName = patch.goalName;
    if (patch.returnPoint !== undefined) cardPatch.nextStep = patch.returnPoint;
    if (patch.nextStep !== undefined) cardPatch.nextStep = patch.nextStep;
    if (patch.dodChecklist !== undefined) cardPatch.dodChecklist = patch.dodChecklist;
    if (patch.children !== undefined) cardPatch.children = patch.children;
    if (patch.extensions !== undefined) cardPatch.extensions = patch.extensions;

    if (patch.status !== undefined) {
      if (patch.status === 'done') {
        cardPatch.status = 'done';
        // PRD v0.3.36 Part A4: Việc xong phải luôn có end.
        // Khi một việc chuyển sang done mà chưa có end, ghi end = giờ bấm xong (nếu bấm trong khung) hoặc start + thời lượng (nếu bấm sau khung).
        const existing = ctx.dailyCardItems?.find(it => it.id === id);
        const curStart = patch.startTime || cardPatch.start || existing?.start;
        const curEnd = patch.endTime || cardPatch.end || existing?.end;
        if (curStart && !curEnd) {
          const startM = timeToMinutes(curStart);
          const estM = (typeof existing?.extra?.estimateMins === 'number' ? existing.extra.estimateMins : 30);
          const frameEndM = startM + estM;
          const nowM = getDeviceTimeMinutes();
          const resolvedEndM = (nowM >= startM && nowM <= frameEndM) ? nowM : frameEndM;
          cardPatch.end = minutesToTime(resolvedEndM % 1440);
        }
      } else if (patch.status === 'dropped') cardPatch.status = 'dropped';
      else if (patch.status === 'partly_done') cardPatch.status = 'left';
      else cardPatch.status = 'open';
    }

    if (patch.touchTimeMinutes !== undefined || patch.taskEndType !== undefined || patch.extra !== undefined || patch.type !== undefined) {
      const existing = ctx.dailyCardItems?.find(it => it.id === id);
      const prevExtra = (existing?.extra as Record<string, unknown> | undefined) || {};
      const newExtra: Record<string, unknown> = {
        ...prevExtra,
        ...(patch.extra || {}),
      };
      if (patch.touchTimeMinutes !== undefined) {
        newExtra.actualMinutes = patch.touchTimeMinutes;
      }
      if (patch.taskEndType !== undefined) {
        newExtra.taskEndType = patch.taskEndType;
      }
      if (patch.type !== undefined) {
        newExtra.blockType = patch.type;
      }
      cardPatch.extra = newExtra;
    }

    ctx.updateDailyCardItem(id, cardPatch);
  } else {
    ctx.setBlocks(prev => prev.map(b => {
      if (b.id !== id) return b;
      const today = getDeviceCalendarDate();
      const isTemplateOrRitual = b.isTemplateBlock || b.blockKind === 'ritual';
      const updated = { ...b, ...patch };

      if (isTemplateOrRitual && (patch.status !== undefined || patch.timeboxEndOutcome !== undefined || patch.startTime !== undefined || patch.endTime !== undefined)) {
        updated.statusDate = today;
        updated.dailyStatus = {
          ...(b.dailyStatus || {}),
          [today]: {
            status: patch.status || b.status,
            outcome: patch.timeboxEndOutcome || b.timeboxEndOutcome,
            updatedAt: Date.now(),
          },
        };
        if (patch.startTime || patch.endTime) {
          updated.dailyOverrides = {
            ...(b.dailyOverrides || {}),
            [today]: {
              ...(b.dailyOverrides?.[today] || {}),
              startTime: patch.startTime || b.startTime,
              endTime: patch.endTime || b.endTime,
              status: patch.status || b.status,
            },
          };
        }
      }

      if (patch.status === 'done' && updated.startTime && !updated.endTime) {
        const startM = timeToMinutes(updated.startTime);
        const estM = updated.estimatedMinutes || 30;
        const frameEndM = startM + estM;
        const nowM = getDeviceTimeMinutes();
        const resolvedEndM = (nowM >= startM && nowM <= frameEndM) ? nowM : frameEndM;
        updated.endTime = minutesToTime(resolvedEndM % 1440);
      }
      return updated;
    }));
  }
}
