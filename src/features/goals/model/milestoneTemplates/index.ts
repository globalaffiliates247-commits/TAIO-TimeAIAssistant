// TAIO Time App — Milestone Templates & Backplanning Generator (PRD v0.3.54 Part N)
import { Milestone } from '@/types';
import { getDeviceCalendarDate } from '@/core/clock';

function formatOffsetDate(baseDateStr: string, offsetDays: number): string {
  const d = new Date(baseDateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

/**
 * Calculates suggested milestones based on backward planning.
 * Divides the timeframe into 3 proportional stages:
 * - Stage 1 (1/3 of duration): Preparation & Draft
 * - Stage 2 (2/3 of duration): Core Deployment & Review
 * - Stage 3 (Final deadline): Completion & Measure Results
 */
export function generateSuggestedMilestones(
  goalId: string,
  horizonDays: number,
  deadline?: string
): Milestone[] {
  const safeDays = Math.max(7, horizonDays || 30);
  const weeks = Math.max(1, Math.ceil(safeDays / 7));
  const w1End = Math.max(1, Math.ceil(weeks / 3));
  const w2End = Math.max(w1End + 1, Math.ceil((weeks * 2) / 3));

  const todayStr = getDeviceCalendarDate();
  const d1 = formatOffsetDate(todayStr, Math.round(safeDays / 3));
  const d2 = formatOffsetDate(todayStr, Math.round((safeDays * 2) / 3));
  const d3 =
    deadline && /^\d{4}-\d{2}-\d{2}$/.test(deadline)
      ? deadline
      : formatOffsetDate(todayStr, safeDays);

  const ts = Date.now();
  return [
    {
      id: `m-${ts}-1`,
      goalId,
      name: `Giai đoạn 1: Chuẩn bị & Bản nháp (Tuần 1-${w1End})`,
      dueDate: d1,
      status: 'pending',
    },
    {
      id: `m-${ts}-2`,
      goalId,
      name: `Giai đoạn 2: Triển khai lõi & Đánh giá (Tuần ${w1End + 1}-${w2End})`,
      dueDate: d2,
      status: 'pending',
    },
    {
      id: `m-${ts}-3`,
      goalId,
      name: `Giai đoạn 3: Hoàn thiện & Đạt kết quả đo lường (Tuần ${w2End + 1}-${weeks})`,
      dueDate: d3,
      status: 'pending',
    },
  ];
}
