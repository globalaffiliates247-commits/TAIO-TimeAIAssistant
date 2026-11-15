// TAIO Time Domain — Pure Goal Ledger & EVM Metrics (PRD v0.3.38 Part B2 & Part F)
import type { Goal, TimeBlock, DailyCardItem } from '../types';
import type { WorkNode } from './workNode';

export type OverviewPeriod = 'week' | 'month' | 'quarter' | 'year';
export type GroupingDimension = 'goal' | 'project' | 'workArea';

export interface TaskTimeRecord {
  id: string;
  title: string;
  nodeId?: string;
  goalId?: string;
  workArea?: string;
  isDone: boolean;
  estimatedMinutes: number;
  actualMinutes: number;
  isEstimatedOnly: boolean;
  completedAt?: string | number;
  date?: string; // YYYY-MM-DD
}

export interface GoalLedgerEntry {
  id: string;
  name: string;
  kind: 'goal' | 'project' | 'milestone' | 'unassigned' | 'undeclared';
  workArea: string;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  plannedHours: number;
  actualHours: number;
  progressPercent: number;
  shouldBeAtPercent: number; // PV %
  spi: number; // EV / PV
  paceStatus: 'on_track' | 'behind' | 'ahead';
  paceLabel: string;
  paceDeviationPercent: number;
  efficiencyPercent: number | null; // CPI: null if < 3 done tasks
  efficiencyLabel: string;
  doneTasksCount: number;
  totalTasksCount: number;
  allocationPercent: number; // Share of total time in period
  velocityHoursPerWeek?: number;
  forecastDate?: string;
  forecastDelayDays?: number;
}

export interface OverviewLedgerResult {
  period: OverviewPeriod;
  year: number;
  totalLoggedHours: number;
  goalHours: number;
  nonGoalHours: number;
  entries: GoalLedgerEntry[];
  allocationBar: Array<{
    id: string;
    label: string;
    hours: number;
    percent: number;
    color?: string;
    kind: string;
  }>;
  summary: {
    totalGoals: number;
    onTrackCount: number;
    behindCount: number;
    aheadCount: number;
    goalTimeRatioPercent: number;
  };
}

export const SIZE_HOURS: Record<string, number> = {
  XS: 4,
  S: 10,
  M: 40,
  L: 100,
  XL: 250,
};

/**
 * Pure calculation of actual task minutes based on real timestamps and extensions (PRD B2.1).
 * Never defaults to hardcoded 30 minutes.
 */
export function extractTaskActualMinutes(task: {
  actualMinutes?: number;
  startedAt?: number;
  endsAt?: number;
  start?: string;
  end?: string;
  extensions?: Array<{ mins?: number; addedMinutes?: number }>;
  extra?: Record<string, unknown>;
  estimatedMinutes?: number;
}): { minutes: number; isEstimated: boolean } {
  // 1. Explicit actualMinutes
  if (typeof task.actualMinutes === 'number' && task.actualMinutes > 0) {
    return { minutes: task.actualMinutes, isEstimated: false };
  }
  const extra = task.extra || {};
  if (typeof extra.actualMinutes === 'number' && extra.actualMinutes > 0) {
    return { minutes: extra.actualMinutes, isEstimated: false };
  }

  // 2. Real timestamps (startedAt & endsAt or now)
  const startedAt = typeof extra.startedAt === 'number' ? extra.startedAt : task.startedAt;
  const endedAt = typeof extra.endedAt === 'number' ? extra.endedAt : task.endsAt;
  if (typeof startedAt === 'number' && typeof endedAt === 'number' && endedAt > startedAt) {
    let diff = Math.max(1, Math.round((endedAt - startedAt) / 60000));
    // Include extension records
    if (Array.isArray(task.extensions)) {
      const extMins = task.extensions.reduce((sum, e) => sum + (e.mins || e.addedMinutes || 0), 0);
      diff += extMins;
    }
    return { minutes: diff, isEstimated: false };
  }

  // 3. Time slot diff on schedule (startTime & endTime or start & end)
  const startStr = task.start || (extra.startTime as string);
  const endStr = task.end || (extra.endTime as string);
  if (startStr && endStr) {
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff > 0) {
      return { minutes: diff, isEstimated: true };
    }
  }

  // 4. Initial estimate as fallback (explicitly marked as estimated)
  const est = task.estimatedMinutes || (extra.estimateMins as number) || (extra.rawEstimateMin as number);
  if (typeof est === 'number' && est > 0) {
    return { minutes: est, isEstimated: true };
  }

  return { minutes: 0, isEstimated: true };
}

/**
 * Pure calculation of EVM schedule pacing and "should-be-at" line.
 * Linear EVM baseline: PV = plannedHours * (timeElapsed / totalDuration).
 */
export function computeEvmPacing(
  startDateStr: string | undefined,
  deadlineDateStr: string | undefined,
  plannedHours: number,
  actualHours: number,
  progressPercent: number,
  asOfDate: Date = new Date('2026-11-15T00:00:00Z')
): {
  shouldBeAtPercent: number;
  pv: number;
  ev: number;
  ac: number;
  spi: number;
  paceStatus: 'on_track' | 'behind' | 'ahead';
  paceLabel: string;
  deviationPercent: number;
} {
  const asOfMs = asOfDate.getTime();
  const year = asOfDate.getFullYear();

  const startMs = startDateStr
    ? new Date(startDateStr).getTime()
    : new Date(`${year}-01-01T00:00:00Z`).getTime();
  const deadMs = deadlineDateStr
    ? new Date(deadlineDateStr).getTime()
    : new Date(`${year}-12-31T23:59:59Z`).getTime();

  let timeElapsedRatio = 1;
  if (deadMs > startMs) {
    timeElapsedRatio = Math.max(0, Math.min(1, (asOfMs - startMs) / (deadMs - startMs)));
  }

  const shouldBeAtPercent = Math.round(timeElapsedRatio * 100);
  const pv = Math.round(plannedHours * timeElapsedRatio * 10) / 10;
  const ev = Math.round(plannedHours * (progressPercent / 100) * 10) / 10;
  const ac = actualHours;

  const spi = pv > 0 ? Math.round((ev / pv) * 100) / 100 : 1;
  const deviation = Math.abs(progressPercent - shouldBeAtPercent);

  let paceStatus: 'on_track' | 'behind' | 'ahead' = 'on_track';
  let paceLabel = 'đúng nhịp';

  if (spi < 0.9) {
    paceStatus = 'behind';
    paceLabel = `chậm ${deviation}%`;
  } else if (spi > 1.1) {
    paceStatus = 'ahead';
    paceLabel = `vượt ${deviation}%`;
  }

  return {
    shouldBeAtPercent,
    pv,
    ev,
    ac,
    spi,
    paceStatus,
    paceLabel,
    deviationPercent: deviation,
  };
}

/**
 * Pure calculation of CPI (estimation efficiency = total estimate / total actual).
 * If completed tasks < 3: returns null / 'chưa đủ dữ liệu' (Criterion B2.4 & B4.3).
 */
export function computeEstimationEfficiency(
  doneTasks: Array<{ estimatedMinutes: number; actualMinutes: number }>
): { efficiencyPercent: number | null; label: string } {
  if (doneTasks.length < 3) {
    return {
      efficiencyPercent: null,
      label: 'chưa đủ dữ liệu',
    };
  }

  const totalEst = doneTasks.reduce((sum, t) => sum + Math.max(1, t.estimatedMinutes), 0);
  const totalAct = doneTasks.reduce((sum, t) => sum + Math.max(1, t.actualMinutes), 0);

  if (totalAct <= 0) return { efficiencyPercent: null, label: 'chưa đủ dữ liệu' };

  const eff = Math.round((totalEst / totalAct) * 100);
  return {
    efficiencyPercent: eff,
    label: `${eff}%`,
  };
}

/**
 * Pure calculation of the entire Goal Ledger & Overview analytics across all dimensions.
 */
export function computeGoalLedger(
  goals: Goal[],
  dailyCardItems: DailyCardItem[] = [],
  scheduleBlocks: TimeBlock[] = [],
  period: OverviewPeriod = 'year',
  targetYear: number = 2026,
  asOfDate: Date = new Date('2026-11-15T12:00:00Z')
): OverviewLedgerResult {
  // 1. Gather all tasks once (deduplicated by id)
  const taskMap = new Map<string, TaskTimeRecord>();

  for (const it of dailyCardItems) {
    const { minutes, isEstimated } = extractTaskActualMinutes(it);
    const est = it.extra && typeof it.extra.estimateMins === 'number'
      ? it.extra.estimateMins
      : (it.extra && typeof it.extra.rawEstimateMin === 'number' ? it.extra.rawEstimateMin : 30);

    taskMap.set(it.id, {
      id: it.id,
      title: it.text,
      nodeId: it.nodeId,
      goalId: it.goalId,
      isDone: it.status === 'done',
      estimatedMinutes: est,
      actualMinutes: minutes,
      isEstimatedOnly: isEstimated,
      date: it.date,
    });
  }

  for (const b of scheduleBlocks) {
    if (taskMap.has(b.id) || b.isTemplateBlock) continue;
    const { minutes, isEstimated } = extractTaskActualMinutes(b);
    const est = b.estimatedMinutes || (b.extra && typeof b.extra.rawEstimateMin === 'number' ? b.extra.rawEstimateMin : 30);

    taskMap.set(b.id, {
      id: b.id,
      title: b.title,
      nodeId: b.nodeId,
      goalId: b.goalId,
      isDone: b.status === 'done',
      estimatedMinutes: est,
      actualMinutes: minutes,
      isEstimatedOnly: isEstimated,
    });
  }

  const allTasks = Array.from(taskMap.values());

  // 2. Filter goals relevant to target year (B2.7)
  const yearStr = String(targetYear);
  const relevantGoals = goals.filter(g => {
    if (!g.deadline && !g.start) return true; // Keep undated goals with prompt to set deadline
    const startYear = g.start ? g.start.slice(0, 4) : yearStr;
    const endYear = g.deadline ? g.deadline.slice(0, 4) : yearStr;
    return (startYear <= yearStr && endYear >= yearStr);
  });

  // 3. Compute time & EVM metrics per goal
  let totalGoalMinutes = 0;
  let unassignedMinutes = 0;

  const goalEntries: GoalLedgerEntry[] = relevantGoals.map(g => {
    const goalTasks = allTasks.filter(t => t.goalId === g.id || t.nodeId === g.id);
    const doneTasks = goalTasks.filter(t => t.isDone);

    const actualMins = goalTasks.reduce((sum, t) => sum + t.actualMinutes, 0);
    const actualHours = Math.round((actualMins / 60) * 10) / 10;
    totalGoalMinutes += actualMins;

    const plannedHours = g.size ? (SIZE_HOURS[g.size] || 40) : (g.committedHours || 40);
    const progressPercent = g.progressPercent || (goalTasks.length > 0 ? Math.round((doneTasks.length / goalTasks.length) * 100) : 0);

    const pacing = computeEvmPacing(
      g.start || g.commitment?.start,
      g.deadline,
      plannedHours,
      actualHours,
      progressPercent,
      asOfDate
    );

    const eff = computeEstimationEfficiency(doneTasks);

    return {
      id: g.id,
      name: g.name,
      kind: 'goal',
      workArea: g.workArea || 'Business',
      size: g.size || 'M',
      plannedHours,
      actualHours,
      progressPercent,
      shouldBeAtPercent: pacing.shouldBeAtPercent,
      spi: pacing.spi,
      paceStatus: pacing.paceStatus,
      paceLabel: pacing.paceLabel,
      paceDeviationPercent: pacing.deviationPercent,
      efficiencyPercent: eff.efficiencyPercent,
      efficiencyLabel: eff.label,
      doneTasksCount: doneTasks.length,
      totalTasksCount: goalTasks.length,
      allocationPercent: 0, // calculated below
    };
  });

  // Calculate unassigned & undeclared time
  const unassignedTasks = allTasks.filter(t => !t.goalId && !t.nodeId);
  unassignedMinutes = unassignedTasks.reduce((sum, t) => sum + t.actualMinutes, 0);
  const unassignedHours = Math.round((unassignedMinutes / 60) * 10) / 10;

  const undeclaredMinutes = 0; // Default buffer or gap
  const totalAllMinutes = Math.max(1, totalGoalMinutes + unassignedMinutes + undeclaredMinutes);
  const totalAllHours = Math.round((totalAllMinutes / 60) * 10) / 10;

  // Compute allocation shares (summing to 100% per Criterion B4.5)
  for (const entry of goalEntries) {
    entry.allocationPercent = Math.round(((entry.actualHours * 60) / totalAllMinutes) * 100);
  }

  // Sort by allocation percent descending (B3.1)
  goalEntries.sort((a, b) => b.allocationPercent - a.allocationPercent);

  // Allocation bar items (including unassigned & undeclared)
  const allocationBar: OverviewLedgerResult['allocationBar'] = goalEntries
    .filter(e => e.allocationPercent > 0)
    .map(e => ({
      id: e.id,
      label: e.name,
      hours: e.actualHours,
      percent: e.allocationPercent,
      kind: 'goal',
    }));

  const unassignedPercent = Math.max(0, 100 - allocationBar.reduce((sum, item) => sum + item.percent, 0));
  if (unassignedPercent > 0) {
    allocationBar.push({
      id: 'unassigned',
      label: 'Không gắn mục tiêu',
      hours: unassignedHours,
      percent: unassignedPercent,
      kind: 'unassigned',
      color: '#94a3b8',
    });
  }

  const onTrackCount = goalEntries.filter(g => g.paceStatus === 'on_track').length;
  const behindCount = goalEntries.filter(g => g.paceStatus === 'behind').length;
  const aheadCount = goalEntries.filter(g => g.paceStatus === 'ahead').length;

  return {
    period,
    year: targetYear,
    totalLoggedHours: totalAllHours,
    goalHours: Math.round((totalGoalMinutes / 60) * 10) / 10,
    nonGoalHours: unassignedHours,
    entries: goalEntries,
    allocationBar,
    summary: {
      totalGoals: goalEntries.length,
      onTrackCount,
      behindCount,
      aheadCount,
      goalTimeRatioPercent: Math.round((totalGoalMinutes / totalAllMinutes) * 100),
    },
  };
}
