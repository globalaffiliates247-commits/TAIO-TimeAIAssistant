// PRD v0.3.36 Part D: Unified Task Snooze / Defer
import type { TimeBlock, DailyCardItem, BlockStatus } from '@/types';
import { timeToMinutes, minutesToTime, getDeviceTimeMinutes, getDeviceCalendarDate } from '@/core/clock';
import type { SnoozeOption } from '@/features/snooze/SnoozePicker';

export interface TaskSnoozeContext {
  updateDailyCardItem: (id: string, patch: Partial<DailyCardItem>) => void;
  setBlocks: React.Dispatch<React.SetStateAction<TimeBlock[]>>;
  dailyCardItems?: DailyCardItem[];
  scheduleBlocks?: TimeBlock[];
  activeRunningTask?: TimeBlock;
  dayCloseConfig?: { enabled: boolean; time: string; activeDays: number[]; durationMins?: number };
  dayCloseOverrides?: Record<string, {
    time: string;
    endTime?: string;
    durationMins?: number;
    status?: BlockStatus;
    count?: number;
    history?: Array<{ from: string; to: string; at: number }>;
  }>;
  setDayCloseOverrides?: React.Dispatch<React.SetStateAction<Record<string, {
    time: string;
    endTime?: string;
    durationMins?: number;
    status?: BlockStatus;
    count?: number;
    history?: Array<{ from: string; to: string; at: number }>;
  }>>>;
  scheduleNativeNotification?: (opts: { id: string; title: string; body: string; delaySeconds: number }) => void;
  showToast?: (msg: string) => void;
  language?: 'vi' | 'en';
}

export interface SnoozeResult {
  action: 'snoozed' | 'deferred_tomorrow' | 'dropped';
  targetTime?: string;
  newEndTime?: string;
  snoozeCount: number;
}

/**
 * Pure & Unified snooze gateway (PRD v0.3.36 Part D):
 * - Records new start/end times strictly into the target block/card for today.
 * - Updates dayCloseOverrides for day-close ritual or block/card in durable storage.
 * - Preserves duration; recalculates endTime.
 * - Schedules native local notification and stores snooze target timestamp.
 * - Returns updated target time and snooze count.
 */
export function snoozeScheduleEntry(
  taskId: string,
  option: SnoozeOption,
  ctx: TaskSnoozeContext
): SnoozeResult | null {
  const today = getDeviceCalendarDate();
  const isDayClose = taskId === 'b-user-dayclose' || taskId === 'b-ritual-close';
  const isCard = taskId.startsWith('dc-') || ctx.dailyCardItems?.some(it => it.id === taskId);

  // Locate current task/block metadata
  const blockInSchedule = ctx.scheduleBlocks?.find(b => b.id === taskId);
  const cardInItems = isCard ? ctx.dailyCardItems?.find(it => it.id === taskId) : undefined;
  const blockInBlocks = !isCard ? ctx.scheduleBlocks?.find(b => b.id === taskId) : undefined;

  const title = isDayClose
    ? 'Khép lại hôm nay'
    : (blockInSchedule?.title || cardInItems?.text || 'Công việc');

  const curStartTime = isDayClose
    ? (ctx.dayCloseOverrides?.[today]?.time || ctx.dayCloseConfig?.time || '21:30')
    : (cardInItems?.start || blockInSchedule?.startTime || '20:00');

  const curEndTime = isDayClose
    ? (ctx.dayCloseOverrides?.[today]?.endTime || minutesToTime((timeToMinutes(curStartTime) + (ctx.dayCloseConfig?.durationMins || 15)) % 1440))
    : (cardInItems?.end || blockInSchedule?.endTime || minutesToTime((timeToMinutes(curStartTime) + 30) % 1440));

  // 1. Drop option
  if (option.type === 'drop') {
    if (isDayClose && ctx.setDayCloseOverrides) {
      ctx.setDayCloseOverrides(prev => ({
        ...prev,
        [today]: {
          ...(prev[today] || {}),
          time: curStartTime,
          endTime: curEndTime,
          status: 'dropped',
        },
      }));
    } else if (isCard) {
      ctx.updateDailyCardItem(taskId, { status: 'dropped' });
    } else {
      ctx.setBlocks(prev => prev.map(b => b.id === taskId ? { ...b, status: 'dropped', statusDate: today } : b));
    }
    ctx.showToast?.(ctx.language === 'vi' ? 'Đã bỏ qua hôm nay.' : 'Skipped for today.');
    return { action: 'dropped', snoozeCount: 0 };
  }

  // 2. Defer to tomorrow / morning routine
  if (option.type === 'defer_tomorrow' || option.type === 'tomorrow_morning') {
    if (isDayClose && ctx.setDayCloseOverrides) {
      ctx.setDayCloseOverrides(prev => ({
        ...prev,
        [today]: {
          ...(prev[today] || {}),
          time: curStartTime,
          endTime: curEndTime,
          status: 'dropped',
        },
      }));
      ctx.showToast?.(ctx.language === 'vi' ? 'Đã dời nhắc sang sáng mai trong thẻ Bắt đầu ngày.' : 'Snoozed until tomorrow morning routine.');
    } else if (isCard) {
      ctx.updateDailyCardItem(taskId, { status: 'carried' });
      ctx.showToast?.(ctx.language === 'vi' ? 'Đã dời sang ngày mai.' : 'Deferred to tomorrow.');
    } else {
      ctx.showToast?.(ctx.language === 'vi' ? 'Đã dời sang ngày mai.' : 'Deferred to tomorrow.');
    }
    return { action: 'deferred_tomorrow', snoozeCount: 0 };
  }

  // 3. Compute target time
  let targetTime = '';
  const nowM = getDeviceTimeMinutes();

  if (option.type === 'minutes') {
    const mins = option.minutes || 10;
    const targetM = (nowM + mins) % 1440;
    targetTime = minutesToTime(targetM);
  } else if (option.type === 'specific_time' && option.timeStr) {
    targetTime = option.timeStr;
  } else if (option.type === 'after_task') {
    targetTime = ctx.activeRunningTask?.endTime || minutesToTime((nowM + 15) % 1440);
  } else {
    targetTime = minutesToTime((nowM + 10) % 1440);
  }

  // 4. Calculate duration & new end time
  const curStartM = timeToMinutes(curStartTime);
  const curEndM = timeToMinutes(curEndTime);
  let durM = (curEndM - curStartM + 1440) % 1440;
  if (durM <= 0) {
    durM = isDayClose ? (ctx.dayCloseConfig?.durationMins || 15) : (blockInSchedule?.estimatedMinutes || 30);
  }
  const targetM = timeToMinutes(targetTime);
  const newEndM = (targetM + durM) % 1440;
  const newEndTime = minutesToTime(newEndM);

  let nextSnoozeCount = 1;

  // 5. Apply persistence
  if (isDayClose) {
    const prevOv = ctx.dayCloseOverrides?.[today];
    nextSnoozeCount = (prevOv?.count || 0) + 1;
    const history = [...(prevOv?.history || []), { from: curStartTime, to: targetTime, at: Date.now() }];
    if (ctx.setDayCloseOverrides) {
      ctx.setDayCloseOverrides(prev => ({
        ...prev,
        [today]: {
          time: targetTime,
          endTime: newEndTime,
          durationMins: durM,
          status: 'planned',
          count: nextSnoozeCount,
          history,
        },
      }));
    }
  } else if (isCard) {
    const prevCount = cardInItems?.snoozeCount || 0;
    nextSnoozeCount = prevCount + 1;
    const history = [...(cardInItems?.snoozeHistory || []), { from: curStartTime, to: targetTime, at: Date.now() }];
    ctx.updateDailyCardItem(taskId, {
      start: targetTime,
      end: newEndTime,
      status: 'open',
      snoozeCount: nextSnoozeCount,
      snoozeHistory: history,
    });
  } else {
    const prevCount = blockInBlocks?.snoozeCount || 0;
    nextSnoozeCount = prevCount + 1;
    const history = [...(blockInBlocks?.snoozeHistory || []), { from: curStartTime, to: targetTime, at: Date.now() }];
    ctx.setBlocks(prev => prev.map(b => {
      if (b.id !== taskId) return b;
      return {
        ...b,
        startTime: targetTime,
        endTime: newEndTime,
        status: 'planned',
        statusDate: today,
        snoozeCount: nextSnoozeCount,
        snoozeHistory: history,
        dailyOverrides: {
          ...(b.dailyOverrides || {}),
          [today]: {
            startTime: targetTime,
            endTime: newEndTime,
            status: 'planned',
            snoozes: history,
          },
        },
      };
    }));
  }

  // 6. Reschedule local notification
  const now = new Date();
  const [th, tm] = targetTime.split(':').map(Number);
  const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), th || 0, tm || 0, 0);
  let targetMs = targetDate.getTime();
  if (targetMs <= Date.now()) {
    targetMs += 86400000;
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('taio_snooze_target_ms', String(targetMs));
      window.localStorage.setItem('taio_snooze_title', title);
      window.localStorage.setItem('taio_snooze_count', String(nextSnoozeCount));
      window.localStorage.setItem('taio_snooze_block_id', taskId);
    } catch {}
  }

  if (ctx.scheduleNativeNotification) {
    const delaySeconds = Math.max(1, Math.round((targetMs - Date.now()) / 1000));
    ctx.scheduleNativeNotification({
      id: `snooze_${taskId}_${Date.now()}`,
      title: ctx.language === 'vi' ? `Nhắc lại: ${title}` : `Reminder: ${title}`,
      body: ctx.language === 'vi' ? `Đã đến giờ ${targetTime}: ${title}` : `It's ${targetTime}: ${title}`,
      delaySeconds,
    });
  }

  // 7. Toast feedback
  ctx.showToast?.(
    ctx.language === 'vi'
      ? `Đã dời đến ${targetTime} · ${title}`
      : `Snoozed until ${targetTime} · ${title}`
  );

  return {
    action: 'snoozed',
    targetTime,
    newEndTime,
    snoozeCount: nextSnoozeCount,
  };
}
