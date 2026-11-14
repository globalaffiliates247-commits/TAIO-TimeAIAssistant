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
  now: Date = new Date(),
  lang: 'vi' | 'en' = 'vi'
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
  // PRD FIX v0.3.33 Part D2: A task is considered running when current time is within its frame,
  // or when explicitly started early (with real startedAt timestamp in extra).
  const inProgressBlock = scheduleBlocks.find(b => {
    if (b.status === 'done' || b.status === 'dropped') return false;
    const extra = (b.extra as Record<string, unknown> | undefined) || {};
    const manuallyStartedAt = typeof extra.startedAt === 'number' ? extra.startedAt : undefined;
    if (manuallyStartedAt && b.status === 'in_progress') {
      const durationMins = b.estimatedMinutes || 30;
      const elapsedMins = (nowMs - manuallyStartedAt) / 60000;
      if (elapsedMins >= 0 && elapsedMins < durationMins + 120) {
        return true;
      }
    }
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
    const extra = (inProgressBlock.extra as Record<string, unknown> | undefined) || {};
    const manuallyStartedAt = typeof extra.startedAt === 'number' ? extra.startedAt : undefined;

    const startMins = timeToMinutes(inProgressBlock.startTime);
    const endMins = timeToMinutes(inProgressBlock.endTime);
    const isOvernight = endMins <= startMins;

    const startedAt = manuallyStartedAt || helperToTimestamp(inProgressBlock.startTime);
    const durMins = inProgressBlock.estimatedMinutes || Math.max(5, (endMins - startMins + 1440) % 1440);
    const endsAt = manuallyStartedAt
      ? (manuallyStartedAt + durMins * 60000)
      : helperToTimestamp(inProgressBlock.endTime, isOvernight);
    const remainingSeconds = Math.max(0, Math.floor((endsAt - nowMs) / 1000));

    return {
      mode: 'task',
      title: inProgressBlock.title,
      subtitle: inProgressBlock.goalName || (lang === 'en' ? 'In progress' : 'Đang thực hiện'),
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

    const remH = Math.floor(remainingSeconds / 3600);
    const remM = Math.floor((remainingSeconds % 3600) / 60);
    const timeFormatted = lang === 'en'
      ? (remH > 0 ? (remM > 0 ? `${remH}h${String(remM).padStart(2, '0')}` : `${remH}h`) : `${remM}m`)
      : (remH > 0 ? (remM > 0 ? `${remH}g${String(remM).padStart(2, '0')}` : `${remH}g`) : `${remM}p`);

    return {
      mode: 'gap',
      title: lang === 'en' ? 'Free' : 'Trống',
      subtitle: lang === 'en'
        ? `${timeFormatted} until: ${nextPlannedBlock.title}`
        : `${timeFormatted} nữa tới: ${nextPlannedBlock.title}`,
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
    const timeFormatted = lang === 'en'
      ? (remH > 0 ? (remM > 0 ? `${remH}h${String(remM).padStart(2, '0')}` : `${remH}h`) : `${remM}m`)
      : (remH > 0 ? (remM > 0 ? `${remH}g${String(remM).padStart(2, '0')}` : `${remH}g`) : `${remM}p`);

    return {
      mode: 'template_or_current',
      title: curTimeStr,
      subtitle: lang === 'en'
        ? `${timeFormatted} until ${nextTemplateSlot.title || 'next milestone'}`
        : `còn ${timeFormatted} đến ${nextTemplateSlot.title || 'mốc tiếp theo'}`,
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
  const timeFormatted = lang === 'en'
    ? (remH > 0 ? (remM > 0 ? `${remH}h${String(remM).padStart(2, '0')}` : `${remH}h`) : `${remM}m`)
    : (remH > 0 ? (remM > 0 ? `${remH}g${String(remM).padStart(2, '0')}` : `${remH}g`) : `${remM}p`);

  return {
    mode: 'template_or_current',
    title: curTimeStr,
    subtitle: lang === 'en'
      ? `${timeFormatted} until bedtime`
      : `còn ${timeFormatted} đến giờ ngủ`,
    startedAt: nowMs,
    endsAt,
    remainingSeconds,
    isCountDown: false,
  };
}

/**
 * Unified finder for upcoming tasks (v0.3.34 Part E8).
 * Used by both top clock card and NowNextList to guarantee consistent next-task determination.
 */
export function findUpcomingTasks(
  scheduleBlocks: TimeBlock[] = [],
  nowMins: number = 0,
  limit: number = 3
): TimeBlock[] {
  return (scheduleBlocks || [])
    .filter(b => {
      if (b.status === 'done' || b.status === 'dropped') return false;
      const bStatus = computeBlockStatus(b, nowMins);
      if (bStatus === 'in_progress') return false;
      return bStatus === 'planned' || timeToMinutes(b.startTime) > nowMins;
    })
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    .slice(0, limit);
}
