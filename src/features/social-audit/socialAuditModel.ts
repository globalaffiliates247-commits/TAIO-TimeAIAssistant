// PRD B12 (v0.3.24): social time audit computed from the user's own records.
// v0.3.22 showed a hard-coded sample (spec example text + invented consequences, "4 tiếng" for 2 h + 1 h).
// Rules: no data -> empty state; never invent consequences; health shown only as facts the app has.
import type { InterruptionRecord, TimeBlock } from '@/types';
import { getDeviceCalendarDate, getDeviceNow, timeToMinutes } from '@/core/clock';

export const SOCIAL_BUDGET = { eveningsPerWeek: 2, maxHoursEach: 3 }; // spec B12 example defaults

export interface SocialOuting {
  id: string;
  date?: string;
  startTime: string;     // record timestamp "20:05"
  endTime?: string;      // planned end time
  outMinutes: number;    // time at the place
  travelMinutes: number; // both ways
  totalMinutes: number;
  title: string;
}

export interface NextDayCost {
  missedWork: string[];      // morning blocks not done
  movedMeetings: string[];   // meeting blocks not done
}

export interface SocialAudit {
  latest: SocialOuting | null;
  deepBlocksEquivalent: number;   // one decimal
  weekCount: number;
  weekOverLimit: number;          // outings this week longer than maxHoursEach
  nextDay: NextDayCost | null;    // only when the latest outing was yesterday evening
}

const DONE = new Set(['done', 'extended']);

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

export function toOuting(r: InterruptionRecord): SocialOuting {
  const travel = (r.travelBufferMins ?? 30) * 2; // default 30 minutes each way, editable later
  return {
    id: r.id,
    date: r.date,
    startTime: r.timestamp,
    endTime: r.socialEndTime,
    outMinutes: r.minutes,
    travelMinutes: travel,
    totalMinutes: r.minutes + travel,
    title: r.title,
  };
}

export function buildSocialAudit(
  interruptions: InterruptionRecord[],
  todayBlocks: TimeBlock[],
  focusBlockMins: number,
  now: Date = getDeviceNow()
): SocialAudit {
  const outings = interruptions.filter(r => r.decision === 'go_social').map(toOuting);
  const latest = outings[0] ?? null; // records are stored newest first

  const weekStart = getDeviceCalendarDate(startOfWeek(now));
  const thisWeek = outings.filter(o => o.date && o.date >= weekStart);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  let nextDay: NextDayCost | null = null;
  if (latest?.date === getDeviceCalendarDate(yesterday)) {
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const morningMissed = todayBlocks.filter(
      b => timeToMinutes(b.startTime) < 12 * 60 && timeToMinutes(b.endTime) <= nowMins && !DONE.has(b.status)
    );
    nextDay = {
      missedWork: morningMissed.filter(b => b.type !== 'meeting').map(b => `${b.startTime} ${b.title}`),
      movedMeetings: morningMissed.filter(b => b.type === 'meeting').map(b => `${b.startTime} ${b.title}`),
    };
  }

  return {
    latest,
    deepBlocksEquivalent: latest ? Math.round((latest.totalMinutes / Math.max(1, focusBlockMins)) * 10) / 10 : 0,
    weekCount: thisWeek.length,
    weekOverLimit: thisWeek.filter(o => o.totalMinutes > SOCIAL_BUDGET.maxHoursEach * 60).length,
    nextDay,
  };
}

export function formatHours(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? (m ? `${h} giờ ${m} phút` : `${h} giờ`) : `${m} phút`;
}
