// PRD FIX v0.3.30 Part E1: Pure clockState function (Universal 3-state clock)
import type { TimeBlock } from '@/types';
import type { DayTemplateSlot } from '@/features/data-transfer';
import { timeToMinutes, computeBlockStatus } from '@/core/clock';

export type ClockMode = 'task' | 'gap' | 'template_or_current';

export interface ClockStateResult {
  mode: ClockMode;
  title: string;
  subtitle: string;
  startedAt: number; // epoch ms
  endsAt: number;    // epoch ms
  remainingSeconds: number;
  isCountDown: boolean;
  next?: {
    id: string;
    title: string;
    startTime: string;
  };
  block?: TimeBlock;
}

/**
 * Pure function to calculate clock state from scheduleBlocks and dayTemplate.
 * Three display states per spec E1.1:
 * 1. Inside a task: task title + task remaining time.
 * 2. In a gap: "Trống" + countdown to next scheduled task.
 * 3. No more scheduled tasks: current time + countdown to next day template anchor (e.g. bed time).
 */
export function clockState(
  scheduleBlocks: TimeBlock[] = [],
  dayTemplate: DayTemplateSlot[] = [],
  now: Date = new Date()
): ClockStateResult {
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const nowMs = now.getTime();
  const nowHours = now.getHours();
  const nowMinutes = now.getMinutes();
  const nowSeconds = now.getSeconds();
  const nowMinsExact = nowHours * 60 + nowMinutes + nowSeconds / 60;
  const nowMins = Math.floor(nowMinsExact);

  const curTimeStr = `${String(nowHours).padStart(2, '0')}:${String(nowMinutes).padStart(2, '0')}`;

  const helperToTimestamp = (timeStr: string, isNextDay = false): number => {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    const d = new Date(year, month, date, h || 0, m || 0, 0, 0);
    if (isNextDay) d.setDate(d.getDate() + 1);
    return d.getTime();
  };

  // 1. Current in-progress task
  const inProgressBlock = scheduleBlocks.find(b => {
    if (b.status === 'in_progress') return true;
    if (b.status === 'done' || b.status === 'dropped') return false;
    return computeBlockStatus(b, nowMins) === 'in_progress';
  });

  // 2. Next planned task
  const nextPlannedBlock = scheduleBlocks
    .filter(b => {
      if (b.status === 'done' || b.status === 'dropped') return false;
      return computeBlockStatus(b, nowMins) === 'planned';
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  // Case 1: In a task
  if (inProgressBlock) {
    const startMins = timeToMinutes(inProgressBlock.startTime);
    const endMins = timeToMinutes(inProgressBlock.endTime);
    const isOvernight = endMins <= startMins;

    const startedAt = helperToTimestamp(inProgressBlock.startTime);
    const endsAt = helperToTimestamp(inProgressBlock.endTime, isOvernight);
    const remainingSeconds = Math.max(0, Math.floor((endsAt - nowMs) / 1000));

    return {
      mode: 'task',
      title: inProgressBlock.title,
      subtitle: inProgressBlock.goalName || 'Đang thực hiện',
      startedAt,
      endsAt,
      remainingSeconds,
      isCountDown: inProgressBlock.taskEndType === 'timebox' || !inProgressBlock.taskEndType,
      next: nextPlannedBlock ? {
        id: nextPlannedBlock.id,
        title: nextPlannedBlock.title,
        startTime: nextPlannedBlock.startTime,
      } : undefined,
      block: inProgressBlock,
    };
  }

  // Case 2: In a gap between tasks
  if (nextPlannedBlock) {
    const nextStartMins = timeToMinutes(nextPlannedBlock.startTime);
    const endsAt = helperToTimestamp(nextPlannedBlock.startTime, nextStartMins < nowMins);
    const remainingSeconds = Math.max(0, Math.floor((endsAt - nowMs) / 1000));
    const startedAt = nowMs;

    return {
      mode: 'gap',
      title: 'Trống',
      subtitle: `nữa tới: ${nextPlannedBlock.title}`,
      startedAt,
      endsAt,
      remainingSeconds,
      isCountDown: true,
      next: {
        id: nextPlannedBlock.id,
        title: nextPlannedBlock.title,
        startTime: nextPlannedBlock.startTime,
      },
      block: nextPlannedBlock,
    };
  }

  // Case 3: No more scheduled tasks today -> show current time + next day template anchor
  let nextTemplateSlot: DayTemplateSlot | undefined;
  if (Array.isArray(dayTemplate) && dayTemplate.length > 0) {
    // Find next template slot today
    nextTemplateSlot = dayTemplate
      .filter(s => timeToMinutes(s.start) > nowMins)
      .sort((a, b) => a.start.localeCompare(b.start))[0];

    // Or first template slot tomorrow
    if (!nextTemplateSlot) {
      nextTemplateSlot = [...dayTemplate].sort((a, b) => a.start.localeCompare(b.start))[0];
    }
  }

  if (nextTemplateSlot) {
    const slotStartMins = timeToMinutes(nextTemplateSlot.start);
    const isTomorrow = slotStartMins <= nowMins;
    const endsAt = helperToTimestamp(nextTemplateSlot.start, isTomorrow);
    const remainingSeconds = Math.max(0, Math.floor((endsAt - nowMs) / 1000));

    const remH = Math.floor(remainingSeconds / 3600);
    const remM = Math.floor((remainingSeconds % 3600) / 60);
    const timeFormatted = remH > 0 ? `${remH}g${String(remM).padStart(2, '0')}` : `${remM}p`;

    return {
      mode: 'template_or_current',
      title: curTimeStr,
      subtitle: `còn ${timeFormatted} đến ${nextTemplateSlot.title || 'mốc tiếp theo'}`,
      startedAt: nowMs,
      endsAt,
      remainingSeconds,
      isCountDown: false,
    };
  }

  // Fallback anchor: Default sleep / winddown anchor at 22:30
  const defaultBedTime = '22:30';
  const defaultBedMins = timeToMinutes(defaultBedTime);
  const isTomorrowBed = defaultBedMins <= nowMins;
  const endsAt = helperToTimestamp(defaultBedTime, isTomorrowBed);
  const remainingSeconds = Math.max(0, Math.floor((endsAt - nowMs) / 1000));
  const remH = Math.floor(remainingSeconds / 3600);
  const remM = Math.floor((remainingSeconds % 3600) / 60);
  const timeFormatted = remH > 0 ? `${remH}g${String(remM).padStart(2, '0')}` : `${remM}p`;

  return {
    mode: 'template_or_current',
    title: curTimeStr,
    subtitle: `còn ${timeFormatted} đến giờ ngủ`,
    startedAt: nowMs,
    endsAt,
    remainingSeconds,
    isCountDown: false,
  };
}
