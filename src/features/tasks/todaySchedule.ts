// PRD FIX v0.3.28 Part A1: Unified Today's Schedule (Single Source of Truth)
import type { TimeBlock, DailyCardItem } from '@/types';
import { toMins, toTime } from '@/features/sticky/model/timeline';

/**
 * Pure function: build unified today's schedule from blocks and dailyCardItems.
 * - Keeps template blocks and user-created custom blocks.
 * - Transforms each DailyCardItem of `today` with `start` into a TimeBlock.
 * - Sorted by startTime ascending. No duplication inside durable `blocks`.
 */
export function buildTodaySchedule(
  blocks: TimeBlock[] = [],
  dailyCardItems: DailyCardItem[] = [],
  today: string,
  dayCloseConfig?: { enabled: boolean; time: string; activeDays: number[] }
): TimeBlock[] {
  // 1. Existing template blocks and user blocks from blocks array (excluding any old dc- blocks)
  const baseBlocks = (blocks || []).filter(b => !b.id.startsWith('dc-'));

  // v0.3.34 Part A2.3: Synthesize day-close template block from user configuration if enabled
  if (dayCloseConfig && dayCloseConfig.enabled) {
    const [y, m, d] = (today || '').split('-').map(Number);
    const dayDate = (y && m && d) ? new Date(y, m - 1, d) : new Date();
    const dayOfWeek = dayDate.getDay();
    if ((dayCloseConfig.activeDays || []).includes(dayOfWeek)) {
      const hasCloseBlock = baseBlocks.some(b => 
        b.blockKind === 'ritual' && 
        (b.id === 'b-user-dayclose' || b.title.includes('Khép') || b.title.includes('Wrap') || b.title.includes('Đóng ngày'))
      );
      if (!hasCloseBlock) {
        const closeTime = dayCloseConfig.time || '21:30';
        const [ch, cm] = closeTime.split(':').map(Number);
        const endMins = ((ch || 21) * 60 + (cm || 30) + 15) % 1440;
        const endH = String(Math.floor(endMins / 60)).padStart(2, '0');
        const endM = String(endMins % 60).padStart(2, '0');
        baseBlocks.push({
          id: 'b-user-dayclose',
          title: 'Khép lại hôm nay',
          startTime: closeTime,
          endTime: `${endH}:${endM}`,
          type: 'planning',
          status: 'planned',
          isTemplateBlock: true,
          blockKind: 'ritual',
          estimatedMinutes: 15,
          ageDays: 1,
          taskSource: 'template_schedule',
        });
      }
    }
  }

  // 2. Map today's timed daily card items to TimeBlock
  const todayItems = (dailyCardItems || []).filter(
    item => item.date === today && item.start && item.status !== 'dropped'
  );

  const cardBlocks: TimeBlock[] = todayItems.map(item => {
    const start = item.start!;
    const end = item.end || toTime(toMins(start) + 30);
    const extra = (item.extra as Record<string, unknown> | undefined) || {};
    const actualMinutes = typeof extra.actualMinutes === 'number' ? extra.actualMinutes : undefined;
    const taskEndType = (extra.taskEndType as TimeBlock['taskEndType']) || 'timebox';
    const estimateMins = typeof extra.estimateMins === 'number'
      ? extra.estimateMins
      : Math.max(5, (toMins(end) - toMins(start) + 1440) % 1440);

    let status: TimeBlock['status'] = 'planned';
    if (item.status === 'done') {
      status = 'done';
    } else if (item.status === 'dropped') {
      status = 'dropped';
    }

    const chosenType = (extra.blockType as TimeBlock['type']) || undefined;
    const resolvedType: TimeBlock['type'] = chosenType || (item.goalId ? 'deep' : 'personal');

    return {
      id: item.id,
      title: item.text,
      startTime: start,
      endTime: end,
      type: resolvedType,
      status,
      goalId: item.goalId,
      goalName: item.goalName,
      milestoneId: item.milestoneId,
      milestoneName: item.milestoneName,
      returnPoint: item.nextStep,
      nextStep: item.nextStep,
      touchTimeMinutes: actualMinutes,
      estimatedMinutes: estimateMins,
      taskSource: 'sticky_day_sheet',
      taskEndType,
      dodChecklist: item.dodChecklist,
      extra: {
        ...(item.extra || {}),
        typeExplicitlyChosen: Boolean(chosenType),
      },
    };
  });

  // 3. Combine and sort by startTime
  const all = [...baseBlocks, ...cardBlocks];
  return all.sort((a, b) => toMins(a.startTime) - toMins(b.startTime));
}
