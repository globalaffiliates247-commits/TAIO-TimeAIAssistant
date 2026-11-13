import { DailyCardItem, Goal, GoalProgressType, TimeBlock } from '@/types';

export interface GoalMetricsResult {
  progressType: GoalProgressType;
  progressPercent: number;
  basisText: string;
  effortHours: number;
  effortMinutes: number;
  effortText: string;
  timeEfficiencyPercent: number | null;
  timeEfficiencyLabel: string | null;
  completedTasksCount: number;
  totalTasksCount: number;
  estimatedDoneMinutes: number;
  actualDoneMinutes: number;
}

export interface TaskEfficiencyResult {
  estimatedMinutes: number;
  actualMinutes: number;
  efficiencyPercent: number;
  isFasterThanEstimated: boolean;
  isOnTime: boolean;
}

export function getBlockEstimatedMinutes(block: TimeBlock): number {
  if (block.estimatedMinutes && block.estimatedMinutes > 0) {
    return block.estimatedMinutes;
  }
  if (block.timeLimitMins && block.timeLimitMins > 0) {
    return block.timeLimitMins;
  }
  if (block.startTime && block.endTime) {
    const [sh, sm] = block.startTime.split(':').map(Number);
    const [eh, em] = block.endTime.split(':').map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    if (diff > 0) return diff;
  }
  return 30;
}

export function getBlockActualMinutes(block: TimeBlock): number {
  if (block.cycleTimeMinutes && block.cycleTimeMinutes > 0) {
    return block.cycleTimeMinutes;
  }
  if (block.touchTimeMinutes && block.touchTimeMinutes > 0) {
    return block.touchTimeMinutes;
  }
  return getBlockEstimatedMinutes(block);
}

export function computeTaskTimeEfficiency(block: TimeBlock): TaskEfficiencyResult {
  const estimatedMinutes = Math.max(1, getBlockEstimatedMinutes(block));
  const actualMinutes = Math.max(1, getBlockActualMinutes(block));
  // B7 v0.3.19: Time efficiency = estimated time of finished task ÷ actual time spent
  const efficiencyPercent = Math.round((estimatedMinutes / actualMinutes) * 100);
  return {
    estimatedMinutes,
    actualMinutes,
    efficiencyPercent,
    isFasterThanEstimated: efficiencyPercent > 100,
    isOnTime: efficiencyPercent >= 95 && efficiencyPercent <= 105,
  };
}

export function computeGoalMetrics(
  goal: Goal,
  blocks: TimeBlock[],
  dailyCardItems: DailyCardItem[] = []
): GoalMetricsResult {
  const progressType: GoalProgressType = goal.progressType || 'tasks';

  const linkedBlocks = blocks.filter(
    (b) => b.goalId === goal.id && b.status !== 'dropped' && !b.isTemplateBlock
  );
  const blockIds = new Set(linkedBlocks.map((b) => b.id));
  const linkedDailyItems = dailyCardItems.filter(
    (item) =>
      item.goalId === goal.id &&
      item.status !== 'dropped' &&
      !blockIds.has(item.id) &&
      !linkedBlocks.some((b) => b.title === item.text)
  );

  const completedBlocks = linkedBlocks.filter((b) => b.status === 'done');
  const completedDaily = linkedDailyItems.filter((item) => item.status === 'done');

  const completedTasksCount = completedBlocks.length + completedDaily.length;
  const totalTasksCount = linkedBlocks.length + linkedDailyItems.length;

  // Effort minutes: actual minutes from schedule blocks + untimed daily card items (counted once per id)
  const blocksEffortMinutes = linkedBlocks.reduce((acc, b) => {
    if (b.status === 'done' || b.status === 'in_progress' || b.status === 'partly_done') {
      return acc + getBlockActualMinutes(b);
    }
    return acc;
  }, 0);
  const dailyEffortMinutes = linkedDailyItems.reduce((acc, it) => {
    if (it.status === 'done') {
      const extra = (it.extra as Record<string, unknown> | undefined) || {};
      const actual = typeof extra.actualMinutes === 'number'
        ? extra.actualMinutes
        : (typeof extra.estimateMins === 'number' ? extra.estimateMins : 30);
      return acc + actual;
    }
    return acc;
  }, 0);
  const effortMinutes = Math.max(goal.actualMinutesTotal || 0, blocksEffortMinutes + dailyEffortMinutes);

  const effortHours = Math.round((effortMinutes / 60) * 10) / 10;
  const effortText =
    effortMinutes >= 60
      ? `${effortHours} giờ công sức (${effortMinutes} phút)`
      : `${effortMinutes} phút công sức`;

  // Time efficiency (B7 v0.3.19): estimated time of finished tasks ÷ actual time spent on them
  const estimatedDoneMinutes = completedBlocks.reduce(
    (acc, b) => acc + Math.max(1, getBlockEstimatedMinutes(b)),
    0
  );
  const actualDoneMinutes = completedBlocks.reduce(
    (acc, b) => acc + Math.max(1, getBlockActualMinutes(b)),
    0
  );

  let timeEfficiencyPercent: number | null = null;
  let timeEfficiencyLabel: string | null = null;
  if (progressType !== 'time_commitment' && completedBlocks.length > 0 && actualDoneMinutes > 0) {
    timeEfficiencyPercent = Math.round((estimatedDoneMinutes / actualDoneMinutes) * 100);
    const estHoursText =
      estimatedDoneMinutes >= 60
        ? `${Math.round((estimatedDoneMinutes / 60) * 10) / 10} giờ`
        : `${estimatedDoneMinutes} phút`;
    const actHoursText =
      actualDoneMinutes >= 60
        ? `${Math.round((actualDoneMinutes / 60) * 10) / 10} giờ`
        : `${actualDoneMinutes} phút`;
    timeEfficiencyLabel = `Hiệu suất thời gian: ${timeEfficiencyPercent}% (ước lượng ${estHoursText} / thực tế ${actHoursText})`;
  }

  let progressPercent = 0;
  let basisText = '';

  if (progressType === 'key_result') {
    let current = Math.max(0, goal.keyResultCurrent ?? 0);
    const target = Math.max(1, goal.keyResultTarget ?? 100);
    const unit = goal.keyResultUnit || 'đơn vị';

    // PRD FIX v0.3.30 Part B5: Auto-track steps goals from Core Motion pedometer
    const isStepGoal = /bước|step/i.test(unit) || /bước|step/i.test(goal.name);
    if (isStepGoal) {
      const stepsFromItems = linkedDailyItems.reduce((acc, it) => {
        const extra = (it.extra as Record<string, unknown> | undefined) || {};
        return acc + (typeof extra.steps === 'number' ? extra.steps : 0);
      }, 0);
      current = Math.max(current, stepsFromItems);
    }

    progressPercent = Math.min(100, Math.round((current / target) * 100));
    basisText = `Cơ sở: ${current.toLocaleString('vi-VN')}/${target.toLocaleString('vi-VN')} ${unit}`;
  } else if (progressType === 'time_commitment') {
    const committedHours = Math.max(1, goal.committedHours ?? 20);
    const committedMinutes = committedHours * 60;
    progressPercent = Math.min(100, Math.round((effortMinutes / committedMinutes) * 100));
    basisText = `Cơ sở: ${effortHours} giờ / ${committedHours} giờ cam kết`;
  } else {
    // 'tasks' (default — units-completed method, each task counts as 1 regardless of duration)
    if (totalTasksCount > 0) {
      progressPercent = Math.min(
        100,
        Math.round((completedTasksCount / totalTasksCount) * 100)
      );
    } else {
      progressPercent = 0;
    }
    const newTasksNote =
      goal.newTasksAddedCount && goal.newTasksAddedCount > 0
        ? ` · thêm ${goal.newTasksAddedCount} việc mới`
        : '';
    basisText = `Cơ sở: ${completedTasksCount}/${totalTasksCount} việc hoàn thành${newTasksNote}`;
  }

  return {
    progressType,
    progressPercent,
    basisText,
    effortHours,
    effortMinutes,
    effortText,
    timeEfficiencyPercent,
    timeEfficiencyLabel,
    completedTasksCount,
    totalTasksCount,
    estimatedDoneMinutes,
    actualDoneMinutes,
  };
}
