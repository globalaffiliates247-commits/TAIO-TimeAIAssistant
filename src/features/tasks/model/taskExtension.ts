// TAIO Time App — Unified Task Extension (PRD v0.3.36 Part B)
import type { TimeBlock, DailyCardItem, Goal, TaskExtension } from '@/types';
import { timeToMinutes, minutesToTime, getDeviceTimeMinutes } from '@/core/clock';
import { updateScheduleEntry, ScheduleWriteContext } from '../scheduleWrite';

export interface ExtendTaskContext extends ScheduleWriteContext {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  autoShiftAfter?: boolean;
}

export function getAutoShiftPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = sessionStorage.getItem('taio_auto_shift_after');
    return saved !== null ? saved === 'true' : true;
  } catch {
    return true;
  }
}

/**
 * Format extension history for tooltip or chip details (PRD v0.3.36 Part B2.5)
 * e.g. "Đã gia hạn +5p lúc 21:50, +15p lúc 22:05"
 */
export function formatExtensionHistory(extensions?: TaskExtension[], lang: string = 'vi'): string | null {
  if (!extensions || extensions.length === 0) return null;
  const isVi = lang.startsWith('vi');
  const details = extensions.map(e => {
    const d = new Date(e.at);
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return isVi ? `+${e.mins}p lúc ${timeStr}` : `+${e.mins}m at ${timeStr}`;
  }).join(', ');

  return isVi ? `Đã gia hạn ${details}` : `Extended ${details}`;
}

/**
 * Unified task extension function (PRD v0.3.36 Part B2)
 * Used by:
 * 1. +5p, +10p, +15p, custom mins buttons on NowCurrentCard
 * 2. "thêm thời gian" in timebox check-in
 * 3. shiftTaskTime in AppContext
 */
export function extendTask(
  taskId: string,
  extraMins: number,
  ctx: ExtendTaskContext
): { newEndTime: string; extendedMins: number } | null {
  if (extraMins <= 0) return null;

  // 1. Locate the task
  const cardItem = ctx.dailyCardItems?.find(it => it.id === taskId);
  const curStartTime = cardItem?.start;
  const curEndTime = cardItem?.end;
  const goalId = cardItem?.goalId;
  const extensions: TaskExtension[] = cardItem?.extensions || [];
  const prevActual = typeof cardItem?.extra?.actualMinutes === 'number'
    ? cardItem.extra.actualMinutes
    : (curStartTime && curEndTime ? (timeToMinutes(curEndTime) - timeToMinutes(curStartTime) + 1440) % 1440 : 30);

  const startMins = curStartTime ? timeToMinutes(curStartTime) : getDeviceTimeMinutes();
  const oldEndMins = curEndTime ? timeToMinutes(curEndTime) : (startMins + 30);
  const newEndMins = (oldEndMins + extraMins) % 1440;
  const newEndTime = minutesToTime(newEndMins);

  const newRecord: TaskExtension = {
    at: Date.now(),
    mins: extraMins,
  };
  const updatedExtensions = [...extensions, newRecord];
  const updatedActualMinutes = prevActual + extraMins;

  // 2. Update task via unified gateway
  updateScheduleEntry(
    taskId,
    {
      endTime: newEndTime,
      touchTimeMinutes: updatedActualMinutes,
      extensions: updatedExtensions,
      status: 'extended',
      extra: {
        ...(cardItem?.extra || {}),
        actualMinutes: updatedActualMinutes,
        extensions: updatedExtensions,
      },
    },
    ctx
  );

  // 3. Update Goal actual time (Part B2.2 & B3.4)
  if (goalId) {
    ctx.setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      return {
        ...g,
        actualMinutesTotal: (g.actualMinutesTotal || 0) + extraMins,
        updatedAt: Date.now(),
      };
    }));
  }

  // 4. Auto-shift subsequent tasks if switch is ON (Part B2.4)
  const shouldShift = ctx.autoShiftAfter !== undefined ? ctx.autoShiftAfter : getAutoShiftPreference();
  if (shouldShift && ctx.dailyCardItems) {
    const todayStr = cardItem?.date;
    const subsequent = ctx.dailyCardItems.filter(it => 
      it.id !== taskId &&
      it.date === todayStr &&
      it.status !== 'dropped' &&
      it.status !== 'carried' &&
      !it.isTemplateBlock &&
      it.start &&
      timeToMinutes(it.start) >= oldEndMins &&
      timeToMinutes(it.start) < newEndMins
    );

    for (const sub of subsequent) {
      if (!sub.start) continue;
      const subStartM = timeToMinutes(sub.start) + extraMins;
      const subDur = sub.end ? (timeToMinutes(sub.end) - timeToMinutes(sub.start) + 1440) % 1440 : 30;
      const clampedStartM = Math.min(23 * 60 + 30, subStartM);
      const clampedEndM = Math.min(23 * 60 + 59, clampedStartM + subDur);
      const nextStart = minutesToTime(clampedStartM);
      const nextEnd = minutesToTime(clampedEndM);

      updateScheduleEntry(
        sub.id,
        {
          startTime: nextStart,
          endTime: nextEnd,
        },
        ctx
      );
    }
  }

  return { newEndTime, extendedMins: extraMins };
}
