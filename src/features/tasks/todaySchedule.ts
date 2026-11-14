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
  dayCloseConfig?: { enabled: boolean; time: string; activeDays: number[]; durationMins?: number },
  dayCloseOverrides?: Record<string, { time: string; endTime?: string; durationMins?: number; status?: import('@/types').BlockStatus; count?: number; history?: Array<{ from: string; to: string; at: number }> }>
): TimeBlock[] {
  // 1. Existing template blocks and user blocks from blocks array (excluding old dc- blocks and purged mock b-ritual-close)
  const baseBlocks = (blocks || [])
    .filter(b => !b.id.startsWith('dc-') && b.id !== 'b-ritual-close')
    .map(b => {
      // Apply today's daily override if present for recurring template blocks
      if ((b.isTemplateBlock || b.blockKind === 'ritual') && b.dailyOverrides && b.dailyOverrides[today]) {
        const ov = b.dailyOverrides[today];
        return {
          ...b,
          startTime: ov.startTime || b.startTime,
          endTime: ov.endTime || b.endTime,
          status: ov.status || b.status,
          statusDate: today,
        };
      }
      return b;
    });

  // v0.3.34 Part A2.3 & v0.3.36 Part E: Single synthesized Day Close block from user configuration
  if (dayCloseConfig && dayCloseConfig.enabled) {
    const [y, m, d] = (today || '').split('-').map(Number);
    const dayDate = (y && m && d) ? new Date(y, m - 1, d) : new Date();
    const dayOfWeek = dayDate.getDay();
    if ((dayCloseConfig.activeDays || []).includes(dayOfWeek)) {
      // PRD v0.3.36 Part E2.3: Only match exact b-user-dayclose; eliminate title string heuristic
      const hasCloseBlock = baseBlocks.some(b => b.id === 'b-user-dayclose');
      if (!hasCloseBlock) {
        const todayOverride = dayCloseOverrides?.[today];
        const closeTime = todayOverride?.time || dayCloseConfig.time || '21:30';
        const dur = todayOverride?.durationMins || dayCloseConfig.durationMins || 15;
        const [ch, cm] = closeTime.split(':').map(Number);
        const endMins = ((ch || 21) * 60 + (cm || 30) + dur) % 1440;
        const endH = String(Math.floor(endMins / 60)).padStart(2, '0');
        const endM = String(endMins % 60).padStart(2, '0');
        const effectiveStatus = todayOverride?.status || 'planned';
        baseBlocks.push({
          id: 'b-user-dayclose',
          title: 'Khép lại hôm nay',
          startTime: closeTime,
          endTime: todayOverride?.endTime || `${endH}:${endM}`,
          type: 'planning',
          status: effectiveStatus,
          statusDate: today,
          dailyStatus: {
            [today]: { status: effectiveStatus },
          },
          dailyOverrides: todayOverride ? { [today]: { ...todayOverride, status: effectiveStatus } } : undefined,
          isTemplateBlock: true,
          blockKind: 'ritual',
          estimatedMinutes: dur,
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
      children: item.children,
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
