import {
  Goal,
  TimeBlock,
  AppList,
  ListItem,
  DailyCardItem,
  InterruptionRecord,
  UserProfileDetail,
  UserProfile,
  BacklogCard,
  TimeLedgerSegment,
  GoalProgressType,
  IdeaState,
  ProjectStatus,
  InterruptionActivityCategory,
  TimeLedgerCategory
} from '../../../types';
import { PROFILES } from '../../../data/mockData';
import { toEpochMs } from '../../../core/storage/durableStorage';

export interface ExportedDayBlockResult {
  id?: string;
  blockStart: string;
  blockEnd: string;
  title: string;
  goalMinutes?: Record<string, number>;
  result: 'done' | 'partly_done' | 'not_done';
  note?: string;
  nextStep?: string;
  timeUsedFor?: string;
  movedTo?: string;
  extra?: Record<string, unknown>;
}

export interface ExportedDayInterruption {
  id?: string;
  time: string;
  minutes: number;
  category: string;
  decision: string;
  note?: string;
  extra?: Record<string, unknown>;
}

export interface ExportedDayBackfill {
  id?: string;
  start: string;
  end: string;
  kind: string;
  title: string;
  goalId?: string | null;
  origin?: string;
  source?: string;
  extra?: Record<string, unknown>;
}

export interface ExportedDayDisplaced {
  id?: string;
  title: string;
  minutes: number;
  extra?: Record<string, unknown>;
}

export interface ExportedDayRecord {
  id: string; // equals `date` ("YYYY-MM-DD")
  date: string;
  blockResults: ExportedDayBlockResult[];
  interruptions: ExportedDayInterruption[];
  dayClosedAt?: string;
  backfill?: ExportedDayBackfill[];
  displaced?: ExportedDayDisplaced[];
  topTaskTomorrow?: string;
  undeclaredLabel?: string;
  notes?: string;
  updatedAt?: string | number;
  extra?: Record<string, unknown>;
}

export interface DayTemplateSlot {
  id: string;
  start: string;
  end: string;
  kind: string;
  title: string;
  goalMinutes: Record<string, number>;
  updatedAt?: string | number;
  extra?: Record<string, unknown>;
}

export interface TaioExportV1 {
  format: string;
  formatVersion: number;
  specVersion?: string;
  exportedAt?: string;
  timezone?: string;
  source?: string;
  user?: Record<string, unknown>;
  goals?: Array<Record<string, unknown>>;
  projects?: Array<Record<string, unknown>>;
  lists?: Array<Record<string, unknown>>;
  tasks?: Array<Record<string, unknown>>;
  dayTemplate?: Array<Record<string, unknown>>;
  days?: Array<Record<string, unknown>>;
  notes?: string[];
  [key: string]: unknown;
}

export interface TaioImportPreview {
  isValidFormat: boolean;
  errorMessage?: string;
  payload?: TaioExportV1;
  exportedAt?: string;
  source?: string;
  userDisplayName?: string;
  goalsCount: number;
  projectsCount: number;
  listsCount: number;
  ideaItemsCount: number;
  tasksCount: number;
  dayTemplateCount: number;
  daysCount: number;
  previewLine: string; // e.g. "3 mục tiêu, 3 dự án, 21 việc, 5 ngày"
  invalidRecords: string[];
}

export interface TaioImportSummary {
  mode: 'merge' | 'replace';
  added: number;
  updated: number;
  skippedUnchanged: number;
  skippedInvalid: number;
  invalidDetails: string[];
  breakdown: {
    goals: { added: number; updated: number; skipped: number };
    projects: { added: number; updated: number; skipped: number };
    lists: { added: number; updated: number; skipped: number };
    tasks: { added: number; updated: number; skipped: number };
    dayTemplate: { added: number; updated: number; skipped: number };
    days: { added: number; updated: number; skipped: number };
  };
}

export interface AppImportableState {
  profile: UserProfile;
  userProfileDetail: UserProfileDetail;
  goals: Goal[];
  lists: AppList[];
  listItems: ListItem[];
  blocks: TimeBlock[];
  dailyCardItems: DailyCardItem[];
  interruptions: InterruptionRecord[];
  backlogCards: BacklogCard[];
  timeLedger: TimeLedgerSegment[];
  dayTemplate: DayTemplateSlot[];
  importedDays: ExportedDayRecord[];
}

function extractExtra(obj: Record<string, unknown>, knownKeys: string[]): Record<string, unknown> | undefined {
  const known = new Set(knownKeys);
  const extra: Record<string, unknown> = {};
  let hasKey = false;
  for (const [k, v] of Object.entries(obj)) {
    if (!known.has(k)) {
      extra[k] = v;
      hasKey = true;
    }
  }
  return hasKey ? extra : undefined;
}

function parseMinutesBetween(start: string, end: string): number {
  const [sh, sm] = (start || '00:00').split(':').map(Number);
  const [eh, em] = (end || '00:00').split(':').map(Number);
  if (Number.isNaN(sh) || Number.isNaN(eh)) return 30;
  const sMins = sh * 60 + (sm || 0);
  let eMins = eh * 60 + (em || 0);
  if (eMins <= sMins) eMins += 24 * 60; // overnight e.g. 20:00 -> 01:00
  return Math.max(5, eMins - sMins);
}

/**
 * Step 1 & 2: Parse JSON and compute preview counts + invalid record warnings
 */
export function parseAndValidateTaioExport(rawJson: string): TaioImportPreview {
  const emptyPreview: TaioImportPreview = {
    isValidFormat: false,
    goalsCount: 0,
    projectsCount: 0,
    listsCount: 0,
    ideaItemsCount: 0,
    tasksCount: 0,
    dayTemplateCount: 0,
    daysCount: 0,
    previewLine: '0 mục tiêu, 0 dự án, 0 việc, 0 ngày',
    invalidRecords: [],
  };

  if (!rawJson || !rawJson.trim()) {
    return { ...emptyPreview, errorMessage: 'Nội dung file trống.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { ...emptyPreview, errorMessage: 'File không đúng định dạng JSON hợp lệ.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ...emptyPreview, errorMessage: 'Cấu trúc JSON phải là một đối tượng (Object).' };
  }

  const obj = parsed as Record<string, unknown>;
  if (obj.format && obj.format !== 'taio-time-export') {
    return {
      ...emptyPreview,
      errorMessage: `Định dạng file "${String(obj.format)}" không khớp chuẩn "taio-time-export".`,
    };
  }
  if (obj.formatVersion !== undefined && Number(obj.formatVersion) !== 1) {
    return {
      ...emptyPreview,
      errorMessage: `Phiên bản định dạng v${String(obj.formatVersion)} chưa được hỗ trợ (cần formatVersion: 1).`,
    };
  }

  const invalidRecords: string[] = [];

  // Validate goals
  let goalsCount = 0;
  if (Array.isArray(obj.goals)) {
    obj.goals.forEach((g, idx) => {
      if (g && typeof g === 'object' && typeof (g as Record<string, unknown>).id === 'string' && typeof (g as Record<string, unknown>).name === 'string') {
        goalsCount++;
      } else {
        invalidRecords.push(`goals[${idx}]: thiếu id hoặc name`);
      }
    });
  }

  // Validate projects
  let projectsCount = 0;
  if (Array.isArray(obj.projects)) {
    obj.projects.forEach((p, idx) => {
      if (p && typeof p === 'object' && typeof (p as Record<string, unknown>).id === 'string' && typeof (p as Record<string, unknown>).name === 'string') {
        projectsCount++;
      } else {
        invalidRecords.push(`projects[${idx}]: thiếu id hoặc name`);
      }
    });
  }

  // Validate lists
  let listsCount = 0;
  let ideaItemsCount = 0;
  if (Array.isArray(obj.lists)) {
    obj.lists.forEach((l, idx) => {
      if (l && typeof l === 'object' && typeof (l as Record<string, unknown>).id === 'string' && typeof (l as Record<string, unknown>).name === 'string') {
        listsCount++;
        const items = (l as Record<string, unknown>).items;
        if (Array.isArray(items)) {
          items.forEach((it, itemIdx) => {
            if (typeof it === 'string') return;
            if (it && typeof it === 'object' && typeof (it as Record<string, unknown>).id === 'string' && typeof (it as Record<string, unknown>).text === 'string') {
              ideaItemsCount++;
            } else {
              invalidRecords.push(`lists[${idx}].items[${itemIdx}]: thiếu id hoặc text`);
            }
          });
        }
      } else {
        invalidRecords.push(`lists[${idx}]: thiếu id hoặc name`);
      }
    });
  }

  // Validate tasks
  let tasksCount = 0;
  if (Array.isArray(obj.tasks)) {
    obj.tasks.forEach((t, idx) => {
      if (t && typeof t === 'object' && typeof (t as Record<string, unknown>).id === 'string' && typeof (t as Record<string, unknown>).title === 'string') {
        tasksCount++;
      } else {
        invalidRecords.push(`tasks[${idx}]: thiếu id hoặc title`);
      }
    });
  }

  // Validate dayTemplate
  let dayTemplateCount = 0;
  if (Array.isArray(obj.dayTemplate)) {
    obj.dayTemplate.forEach((slot, idx) => {
      if (
        slot &&
        typeof slot === 'object' &&
        typeof (slot as Record<string, unknown>).start === 'string' &&
        typeof (slot as Record<string, unknown>).end === 'string' &&
        typeof (slot as Record<string, unknown>).title === 'string'
      ) {
        dayTemplateCount++;
      } else {
        invalidRecords.push(`dayTemplate[${idx}]: thiếu start, end hoặc title`);
      }
    });
  }

  // Validate days
  let daysCount = 0;
  if (Array.isArray(obj.days)) {
    obj.days.forEach((d, idx) => {
      if (d && typeof d === 'object' && typeof (d as Record<string, unknown>).date === 'string') {
        daysCount++;
      } else {
        invalidRecords.push(`days[${idx}]: thiếu trường date`);
      }
    });
  }

  const userObj = (obj.user && typeof obj.user === 'object' ? obj.user : undefined) as Record<string, unknown> | undefined;

  return {
    isValidFormat: true,
    payload: obj as TaioExportV1,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : undefined,
    source: typeof obj.source === 'string' ? obj.source : undefined,
    userDisplayName: typeof userObj?.displayName === 'string' ? userObj.displayName : undefined,
    goalsCount,
    projectsCount,
    listsCount,
    ideaItemsCount,
    tasksCount,
    dayTemplateCount,
    daysCount,
    previewLine: `${goalsCount} mục tiêu, ${projectsCount} dự án, ${tasksCount} việc, ${daysCount} ngày`,
    invalidRecords,
  };
}

function mergeItemById<T extends { id: string; updatedAt?: string | number }>(
  existingList: T[],
  incomingItem: T,
  incomingTs: number,
  mode: 'merge' | 'replace',
  counters: { added: number; updated: number; skipped: number }
): T[] {
  const idx = existingList.findIndex(item => item.id === incomingItem.id);
  if (idx === -1) {
    counters.added++;
    return [...existingList, { ...incomingItem, updatedAt: incomingTs }];
  }

  if (mode === 'replace') {
    counters.updated++;
    const next = [...existingList];
    next[idx] = { ...incomingItem, updatedAt: incomingTs };
    return next;
  }

  const existingItem = existingList[idx];
  const existingTs = toEpochMs(existingItem.updatedAt);

  // If existing item has no timestamp (initial mock data) or incoming file is newer -> update
  if (existingTs === 0 || incomingTs > existingTs) {
    counters.updated++;
    const next = [...existingList];
    next[idx] = { ...incomingItem, updatedAt: incomingTs };
    return next;
  }

  // Otherwise same or older timestamp -> idempotent skip
  counters.skipped++;
  return existingList;
}

function mapInterruptionCategory(rawCat: string): InterruptionActivityCategory {
  const c = (rawCat || '').toLowerCase();
  if (c === 'chat' || c.includes('chat')) return 'chatting_gossip';
  if (c.includes('call') || c.includes('message')) return 'calls_messages';
  if (c.includes('eat') || c.includes('drink')) return 'eating_drinks';
  if (c.includes('travel') || c.includes('move')) return 'travel';
  if (c.includes('exercise') || c.includes('walk')) return 'exercise';
  if (c.includes('family')) return 'family_matter';
  if (c.includes('work')) return 'work_came_up';
  if (c.includes('phone') || c.includes('scroll')) return 'phone_scrolling';
  if (c.includes('sleep') || c.includes('overslept')) return 'overslept';
  if (c.includes('break') || c.includes('rest')) return 'break';
  return 'other';
}

/**
 * Step 3 & 4: Apply idempotent Merge or Replace import
 */
export function applyTaioImport(
  payload: TaioExportV1,
  currentState: AppImportableState,
  mode: 'merge' | 'replace'
): { nextState: AppImportableState; summary: TaioImportSummary } {
  const fileExportedTs = toEpochMs(payload.exportedAt) || Date.parse('2026-11-08T20:00:00+07:00');
  const invalidDetails: string[] = [];

  const breakdown = {
    goals: { added: 0, updated: 0, skipped: 0 },
    projects: { added: 0, updated: 0, skipped: 0 },
    lists: { added: 0, updated: 0, skipped: 0 },
    tasks: { added: 0, updated: 0, skipped: 0 },
    dayTemplate: { added: 0, updated: 0, skipped: 0 },
    days: { added: 0, updated: 0, skipped: 0 },
  };

  // Start from current state (merge) or clean state (replace)
  let nextProfile: UserProfile = currentState.profile;
  let nextProfileDetail: UserProfileDetail = { ...currentState.userProfileDetail };
  let nextGoals: Goal[] = mode === 'replace' ? [] : [...currentState.goals];
  let nextLists: AppList[] = mode === 'replace' ? [] : [...currentState.lists];
  let nextListItems: ListItem[] = mode === 'replace' ? [] : [...currentState.listItems];
  let nextBlocks: TimeBlock[] = mode === 'replace' ? [] : [...currentState.blocks];
  let nextDailyCards: DailyCardItem[] = mode === 'replace' ? [] : [...currentState.dailyCardItems];
  let nextInterruptions: InterruptionRecord[] = mode === 'replace' ? [] : [...currentState.interruptions];
  let nextBacklogCards: BacklogCard[] = mode === 'replace' ? [] : [...currentState.backlogCards];
  let nextDayTemplate: DayTemplateSlot[] = mode === 'replace' ? [] : [...currentState.dayTemplate];
  let nextImportedDays: ExportedDayRecord[] = mode === 'replace' ? [] : [...currentState.importedDays];

  // 1. User profile
  if (payload.user && typeof payload.user === 'object') {
    const u = payload.user;
    if (typeof u.displayName === 'string' && u.displayName.trim()) {
      nextProfileDetail.displayName = u.displayName.trim();
    }
    if (typeof u.defaultHomeScreen === 'string') {
      const hs = u.defaultHomeScreen as UserProfileDetail['defaultHomeScreen'];
      if (['inbox', 'daycard', 'now', 'plan', 'lists'].includes(hs)) {
        nextProfileDetail.defaultHomeScreen = hs;
      }
    }
    if (typeof u.profile === 'string') {
      const pKey = u.profile === 'business_owner' ? 'owner' : u.profile;
      if (pKey in PROFILES) {
        nextProfile = PROFILES[pKey as keyof typeof PROFILES];
      }
    }
    const extraUser = extractExtra(u, ['displayName', 'profile', 'defaultHomeScreen']);
    if (extraUser) {
      nextProfileDetail.extra = { ...(nextProfileDetail.extra || {}), ...extraUser };
    }
    nextProfileDetail.updatedAt = fileExportedTs;
  }

  // 2. Parse Days first so we can also compute cumulative actualMinutes per goal
  const actualMinsByGoal: Record<string, number> = {};
  const plannedMinsByGoal: Record<string, number> = {};

  if (Array.isArray(payload.days)) {
    payload.days.forEach((rawDay, idx) => {
      if (!rawDay || typeof rawDay !== 'object' || typeof rawDay.date !== 'string') {
        invalidDetails.push(`days[${idx}]: thiếu trường date`);
        return;
      }
      const dateStr = rawDay.date.trim();
      const dayTs = toEpochMs(rawDay.updatedAt as string | number | undefined) || fileExportedTs;

      const blockResults: ExportedDayBlockResult[] = [];
      if (Array.isArray(rawDay.blockResults)) {
        rawDay.blockResults.forEach((br: unknown, brIdx: number) => {
          if (!br || typeof br !== 'object') return;
          const bObj = br as Record<string, unknown>;
          if (typeof bObj.blockStart !== 'string' || typeof bObj.blockEnd !== 'string' || typeof bObj.title !== 'string') {
            invalidDetails.push(`days[${dateStr}].blockResults[${brIdx}]: thiếu blockStart/blockEnd/title`);
            return;
          }
          const goalMins = (bObj.goalMinutes && typeof bObj.goalMinutes === 'object' ? bObj.goalMinutes : {}) as Record<string, number>;
          const resStatus = (bObj.result === 'done' || bObj.result === 'partly_done' || bObj.result === 'not_done')
            ? bObj.result
            : 'done';

          for (const [gid, mins] of Object.entries(goalMins)) {
            const numMins = Number(mins) || 0;
            plannedMinsByGoal[gid] = (plannedMinsByGoal[gid] || 0) + numMins;
            if (resStatus === 'done' || resStatus === 'partly_done') {
              actualMinsByGoal[gid] = (actualMinsByGoal[gid] || 0) + numMins;
            }
          }

          blockResults.push({
            id: typeof bObj.id === 'string' ? bObj.id : `br-${dateStr}-${bObj.blockStart}-${bObj.blockEnd}`,
            blockStart: bObj.blockStart,
            blockEnd: bObj.blockEnd,
            title: bObj.title,
            goalMinutes: goalMins,
            result: resStatus,
            note: typeof bObj.note === 'string' ? bObj.note : undefined,
            nextStep: typeof bObj.nextStep === 'string' ? bObj.nextStep : undefined,
            timeUsedFor: typeof bObj.timeUsedFor === 'string' ? bObj.timeUsedFor : undefined,
            movedTo: typeof bObj.movedTo === 'string' ? bObj.movedTo : undefined,
            extra: extractExtra(bObj, ['id', 'blockStart', 'blockEnd', 'title', 'goalMinutes', 'result', 'note', 'nextStep', 'timeUsedFor', 'movedTo']),
          });
        });
      }

      const dayInterruptions: ExportedDayInterruption[] = [];
      if (Array.isArray(rawDay.interruptions)) {
        rawDay.interruptions.forEach((intr: unknown, iIdx: number) => {
          if (!intr || typeof intr !== 'object') return;
          const iObj = intr as Record<string, unknown>;
          if (typeof iObj.time !== 'string') {
            invalidDetails.push(`days[${dateStr}].interruptions[${iIdx}]: thiếu time`);
            return;
          }
          dayInterruptions.push({
            id: typeof iObj.id === 'string' ? iObj.id : `int-${dateStr}-${iObj.time}-${String(iObj.category || 'other')}`,
            time: iObj.time,
            minutes: Number(iObj.minutes) || 15,
            category: String(iObj.category || 'other'),
            decision: String(iObj.decision || 'now'),
            note: typeof iObj.note === 'string' ? iObj.note : undefined,
            extra: extractExtra(iObj, ['id', 'time', 'minutes', 'category', 'decision', 'note']),
          });
        });
      }

      const dayBackfill: ExportedDayBackfill[] = [];
      if (Array.isArray(rawDay.backfill)) {
        rawDay.backfill.forEach((bf: unknown, bfIdx: number) => {
          if (!bf || typeof bf !== 'object') return;
          const bfObj = bf as Record<string, unknown>;
          if (typeof bfObj.start !== 'string' || typeof bfObj.end !== 'string' || typeof bfObj.title !== 'string') {
            invalidDetails.push(`days[${dateStr}].backfill[${bfIdx}]: thiếu start/end/title`);
            return;
          }
          const gid = typeof bfObj.goalId === 'string' ? bfObj.goalId : null;
          if (gid) {
            const dur = parseMinutesBetween(bfObj.start, bfObj.end);
            actualMinsByGoal[gid] = (actualMinsByGoal[gid] || 0) + dur;
          }
          dayBackfill.push({
            id: typeof bfObj.id === 'string' ? bfObj.id : `bf-${dateStr}-${bfObj.start}-${bfObj.end}`,
            start: bfObj.start,
            end: bfObj.end,
            kind: String(bfObj.kind || 'personal'),
            title: bfObj.title,
            goalId: gid,
            origin: typeof bfObj.origin === 'string' ? bfObj.origin : 'planned',
            source: typeof bfObj.source === 'string' ? bfObj.source : undefined,
            extra: extractExtra(bfObj, ['id', 'start', 'end', 'kind', 'title', 'goalId', 'origin', 'source']),
          });
        });
      }

      const dayDisplaced: ExportedDayDisplaced[] = [];
      if (Array.isArray(rawDay.displaced)) {
        rawDay.displaced.forEach((dp: unknown) => {
          if (!dp || typeof dp !== 'object') return;
          const dpObj = dp as Record<string, unknown>;
          if (typeof dpObj.title !== 'string') return;
          dayDisplaced.push({
            id: typeof dpObj.id === 'string' ? dpObj.id : `disp-${dateStr}-${dpObj.title}`,
            title: dpObj.title,
            minutes: Number(dpObj.minutes) || 30,
            extra: extractExtra(dpObj, ['id', 'title', 'minutes']),
          });
        });
      }

      const exportedDay: ExportedDayRecord = {
        id: dateStr,
        date: dateStr,
        blockResults,
        interruptions: dayInterruptions,
        dayClosedAt: typeof rawDay.dayClosedAt === 'string' ? rawDay.dayClosedAt : undefined,
        backfill: dayBackfill.length > 0 ? dayBackfill : undefined,
        displaced: dayDisplaced.length > 0 ? dayDisplaced : undefined,
        topTaskTomorrow: typeof rawDay.topTaskTomorrow === 'string' ? rawDay.topTaskTomorrow : undefined,
        undeclaredLabel: typeof rawDay.undeclaredLabel === 'string' ? rawDay.undeclaredLabel : undefined,
        notes: typeof rawDay.notes === 'string' ? rawDay.notes : undefined,
        updatedAt: dayTs,
        extra: extractExtra(rawDay, [
          'id',
          'date',
          'blockResults',
          'interruptions',
          'dayClosedAt',
          'backfill',
          'displaced',
          'topTaskTomorrow',
          'undeclaredLabel',
          'notes',
          'updatedAt',
        ]),
      };

      nextImportedDays = mergeItemById(nextImportedDays, exportedDay, dayTs, mode, breakdown.days);
    });
  }

  // 3. Goals
  if (Array.isArray(payload.goals)) {
    payload.goals.forEach((rawGoal, idx) => {
      if (!rawGoal || typeof rawGoal !== 'object' || typeof rawGoal.id !== 'string' || typeof rawGoal.name !== 'string') {
        invalidDetails.push(`goals[${idx}]: thiếu id hoặc name`);
        return;
      }
      const gId = rawGoal.id.trim();
      const gName = rawGoal.name.trim();
      const gTs = toEpochMs(rawGoal.updatedAt as string | number | undefined) || fileExportedTs;
      const pType: GoalProgressType =
        rawGoal.progressType === 'key_result' || rawGoal.progressType === 'time_commitment' || rawGoal.progressType === 'tasks'
          ? rawGoal.progressType
          : 'tasks';

      const commitmentObj = (rawGoal.commitment && typeof rawGoal.commitment === 'object' ? rawGoal.commitment : undefined) as
        | { minutesPerDay?: number; days?: number; start?: string }
        | undefined;
      const keyResultObj = (rawGoal.keyResult && typeof rawGoal.keyResult === 'object' ? rawGoal.keyResult : undefined) as
        | { label?: string; target?: number; current?: number }
        | undefined;

      const minsPerDay = Number(commitmentObj?.minutesPerDay) || 60;
      const horizonDays = Number(commitmentObj?.days) || 60;
      const committedHours = commitmentObj
        ? Math.round(((minsPerDay * horizonDays) / 60) * 10) / 10
        : undefined;

      let deadlineStr = typeof rawGoal.deadline === 'string' ? rawGoal.deadline : '';
      if (!deadlineStr && commitmentObj?.start && commitmentObj?.days) {
        const startMs = Date.parse(commitmentObj.start);
        if (!Number.isNaN(startMs)) {
          deadlineStr = new Date(startMs + horizonDays * 86400000).toISOString().split('T')[0];
        }
      }
      if (!deadlineStr) deadlineStr = '2027-01-09';

      const desc = typeof rawGoal.description === 'string' ? rawGoal.description : gName;

      const mappedGoal: Goal = {
        id: gId,
        name: gName,
        measurableResult: desc,
        horizonDays,
        dailyBudgetMins: minsPerDay,
        deadline: deadlineStr,
        milestones: [],
        workArea: gId === 'g1' ? 'Personal' : gId === 'g3' ? 'Business' : 'Product',
        progressPercent: 0,
        progressType: pType,
        keyResultUnit: keyResultObj?.label,
        keyResultTarget: typeof keyResultObj?.target === 'number' ? keyResultObj.target : undefined,
        keyResultCurrent: typeof keyResultObj?.current === 'number' ? keyResultObj.current : undefined,
        committedHours,
        plannedMinutesTotal: plannedMinsByGoal[gId] || minsPerDay * 5,
        actualMinutesTotal: actualMinsByGoal[gId] || 0,
        start: typeof rawGoal.start === 'string' ? rawGoal.start : commitmentObj?.start,
        commitment: commitmentObj
          ? {
              minutesPerDay: minsPerDay,
              days: horizonDays,
              start: commitmentObj.start || '2026-10-31',
            }
          : undefined,
        updatedAt: gTs,
        extra: extractExtra(rawGoal, [
          'id',
          'name',
          'progressType',
          'commitment',
          'keyResult',
          'start',
          'deadline',
          'description',
          'updatedAt',
        ]),
      };

      nextGoals = mergeItemById(nextGoals, mappedGoal, gTs, mode, breakdown.goals);
    });
  }

  const goalNameMap = new Map<string, string>(nextGoals.map(g => [g.id, g.name]));

  // 4. Lists & Projects
  if (Array.isArray(payload.lists)) {
    payload.lists.forEach((rawList, idx) => {
      if (!rawList || typeof rawList !== 'object' || typeof rawList.id !== 'string' || typeof rawList.name !== 'string') {
        invalidDetails.push(`lists[${idx}]: thiếu id hoặc name`);
        return;
      }
      const lId = rawList.id.trim();
      const lType = rawList.type === 'idea' || rawList.type === 'project' || rawList.type === 'checklist' ? rawList.type : 'idea';
      const lTs = toEpochMs(rawList.updatedAt as string | number | undefined) || fileExportedTs;
      const isoDate = new Date(lTs).toISOString();

      const appList: AppList = {
        id: lId,
        name: rawList.name.trim(),
        type: lType,
        tag: lType === 'idea' ? '#ytuong' : lType === 'project' ? '#duan' : '#checklist',
        pinned: true,
        archived: false,
        createdAt: isoDate,
        updatedAt: isoDate,
        extra: extractExtra(rawList, ['id', 'name', 'type', 'items', 'updatedAt']),
      };

      nextLists = mergeItemById(nextLists, appList, lTs, mode, breakdown.lists);

      if (Array.isArray(rawList.items)) {
        rawList.items.forEach((rawItem, itemIdx) => {
          // String item in project list (e.g. "p-time-app") is handled via top-level `projects`
          if (typeof rawItem === 'string') return;
          if (!rawItem || typeof rawItem !== 'object') return;
          const itObj = rawItem as Record<string, unknown>;
          if (typeof itObj.id !== 'string' || typeof itObj.text !== 'string') {
            invalidDetails.push(`lists[${lId}].items[${itemIdx}]: thiếu id hoặc text`);
            return;
          }
          const itemCreated = typeof itObj.createdAt === 'string' ? itObj.createdAt : isoDate;
          const itemTs = toEpochMs(itObj.updatedAt as string | number | undefined) || fileExportedTs;
          const ideaState: IdeaState =
            itObj.state === 'considering' || itObj.state === 'used' || itObj.state === 'dropped' ? itObj.state : 'new';

          const listItem: ListItem = {
            id: itObj.id.trim(),
            listId: lId,
            text: itObj.text.trim(),
            note: typeof itObj.note === 'string' ? itObj.note : undefined,
            order: itemIdx + 1,
            archived: false,
            createdAt: itemCreated,
            updatedAt: new Date(itemTs).toISOString(),
            source: 'typed',
            ideaState: lType === 'idea' ? ideaState : undefined,
            checked: lType === 'checklist' ? Boolean(itObj.checked) : undefined,
            extra: extractExtra(itObj, ['id', 'text', 'state', 'createdAt', 'updatedAt', 'note', 'checked']),
          };

          // Merge into nextListItems without double-counting top-level list counter
          const dummyCounter = { added: 0, updated: 0, skipped: 0 };
          nextListItems = mergeItemById(nextListItems, listItem, itemTs, mode, dummyCounter);

          // Also ensure idea is available in BacklogCards for B28 Quẹt thẻ nhiệm vụ
          const backlogCard: BacklogCard = {
            id: `bc-${listItem.id}`,
            text: listItem.text,
            type: 'idea',
            sourceId: listItem.id,
            ageDays: Math.max(1, Math.round((fileExportedTs - (Date.parse(itemCreated) || fileExportedTs)) / 86400000)),
            snoozesCount: 0,
            whyThisCard: `Ý tưởng từ danh sách "${appList.name}"`,
            estimatedMinutes: 30,
            updatedAt: itemTs,
          };
          nextBacklogCards = mergeItemById(nextBacklogCards, backlogCard, itemTs, mode, { added: 0, updated: 0, skipped: 0 });
        });
      }
    });
  }

  if (Array.isArray(payload.projects)) {
    // Ensure a project list exists
    let projectList = nextLists.find(l => l.type === 'project');
    if (!projectList) {
      const isoNow = new Date(fileExportedTs).toISOString();
      projectList = {
        id: 'l-projects',
        name: 'Dự án TAIO.CLUB',
        type: 'project',
        tag: '#duan',
        pinned: true,
        archived: false,
        createdAt: isoNow,
        updatedAt: isoNow,
      };
      nextLists.push(projectList);
    }

    payload.projects.forEach((rawProj, idx) => {
      if (!rawProj || typeof rawProj !== 'object' || typeof rawProj.id !== 'string' || typeof rawProj.name !== 'string') {
        invalidDetails.push(`projects[${idx}]: thiếu id hoặc name`);
        return;
      }
      const pId = rawProj.id.trim();
      const pTs = toEpochMs(rawProj.updatedAt as string | number | undefined) || fileExportedTs;
      const gId = typeof rawProj.goalId === 'string' ? rawProj.goalId : undefined;
      const pStatus: ProjectStatus =
        rawProj.status === 'planned' ||
        rawProj.status === 'active' ||
        rawProj.status === 'paused' ||
        rawProj.status === 'done' ||
        rawProj.status === 'cancelled'
          ? rawProj.status
          : 'active';

      const projItem: ListItem = {
        id: pId,
        listId: projectList!.id,
        text: rawProj.name.trim(),
        order: idx + 1,
        archived: false,
        createdAt: typeof rawProj.start === 'string' ? rawProj.start : new Date(pTs).toISOString(),
        updatedAt: new Date(pTs).toISOString(),
        source: 'typed',
        goalId: gId,
        goalName: gId ? goalNameMap.get(gId) : undefined,
        startDate: typeof rawProj.start === 'string' ? rawProj.start : undefined,
        deadline: typeof rawProj.deadline === 'string' ? rawProj.deadline : undefined,
        projectStatus: pStatus,
        progressMode: 'auto',
        progress: typeof rawProj.progress === 'number' ? rawProj.progress : 0,
        nextAction: typeof rawProj.nextAction === 'string' ? rawProj.nextAction : undefined,
        timeSpentMinutes: gId ? actualMinsByGoal[gId] || 0 : 0,
        links: gId ? [{ kind: 'goal', id: gId }] : [],
        extra: extractExtra(rawProj, ['id', 'name', 'goalId', 'status', 'start', 'deadline', 'nextAction', 'progress', 'updatedAt']),
      };

      nextListItems = mergeItemById(nextListItems, projItem, pTs, mode, breakdown.projects);
    });
  }

  // 5. Tasks (Matrix & Goal tasks)
  if (Array.isArray(payload.tasks)) {
    payload.tasks.forEach((rawTask, idx) => {
      if (!rawTask || typeof rawTask !== 'object' || typeof rawTask.id !== 'string' || typeof rawTask.title !== 'string') {
        invalidDetails.push(`tasks[${idx}]: thiếu id hoặc title`);
        return;
      }
      const tId = rawTask.id.trim();
      const tTitle = rawTask.title.trim();
      const tTs = toEpochMs(rawTask.updatedAt as string | number | undefined) || fileExportedTs;
      const gId = typeof rawTask.goalId === 'string' ? rawTask.goalId : undefined;
      const matrixVal =
        rawTask.matrix === 'do_now' || rawTask.matrix === 'delegate' || rawTask.matrix === 'schedule' || rawTask.matrix === 'drop'
          ? rawTask.matrix
          : 'schedule';

      const quadrant: 1 | 2 | 3 | 4 =
        matrixVal === 'do_now' ? 1 : matrixVal === 'delegate' ? 3 : matrixVal === 'schedule' ? 2 : 4;

      const rawEst = rawTask.estimateMin;
      const estMins = typeof rawEst === 'number' && rawEst > 0 ? rawEst : 30;
      const createdAtStr = typeof rawTask.createdAt === 'string' ? rawTask.createdAt : undefined;
      const ageDays = createdAtStr
        ? Math.max(1, Math.round((fileExportedTs - (Date.parse(createdAtStr) || fileExportedTs)) / 86400000))
        : 1;

      const taskBlock: TimeBlock = {
        id: tId,
        title: tTitle,
        startTime: '',
        endTime: '',
        type: gId ? 'deep' : 'interruption',
        status: rawTask.status === 'done' ? 'done' : rawTask.status === 'dropped' ? 'dropped' : 'planned',
        goalId: gId,
        goalName: gId ? goalNameMap.get(gId) : undefined,
        quadrant,
        matrixGroup: matrixVal,
        isImportant: quadrant === 1 || quadrant === 2,
        isUrgent: quadrant === 1 || quadrant === 3,
        estimatedMinutes: estMins,
        ageDays,
        deadline: typeof rawTask.deadline === 'string' ? rawTask.deadline : undefined,
        notes: typeof rawTask.note === 'string' ? rawTask.note : undefined,
        taskSource: typeof rawTask.source === 'string' ? rawTask.source : 'matrix',
        carryFrom: typeof rawTask.carryFrom === 'string' ? rawTask.carryFrom : undefined,
        createdAt: createdAtStr,
        isTemplateBlock: false,
        updatedAt: tTs,
        extra: {
          ...(extractExtra(rawTask, [
            'id',
            'title',
            'goalId',
            'estimateMin',
            'deadline',
            'createdAt',
            'updatedAt',
            'status',
            'matrix',
            'source',
            'note',
            'carryFrom',
          ]) || {}),
          rawEstimateMin: rawEst ?? null,
        },
      };

      nextBlocks = mergeItemById(nextBlocks, taskBlock, tTs, mode, breakdown.tasks);

      // Also sync open tasks without a time slot into BacklogCards for B28 Quẹt thẻ nhiệm vụ
      if (taskBlock.status !== 'done' && taskBlock.status !== 'dropped') {
        const backlogTaskCard: BacklogCard = {
          id: `bc-task-${tId}`,
          text: tTitle,
          note: taskBlock.notes,
          type: 'task',
          sourceId: tId,
          ageDays,
          snoozesCount: 0,
          goalId: gId,
          goalName: gId ? goalNameMap.get(gId) : undefined,
          whyThisCard: taskBlock.carryFrom
            ? `Chuyển tiếp từ ngày ${taskBlock.carryFrom}`
            : taskBlock.deadline
              ? `Hạn chót: ${taskBlock.deadline.replace('T', ' ')}`
              : 'Việc đang mở trong Ma trận ưu tiên',
          estimatedMinutes: estMins,
          deadline: taskBlock.deadline,
          updatedAt: tTs,
        };
        nextBacklogCards = mergeItemById(nextBacklogCards, backlogTaskCard, tTs, mode, { added: 0, updated: 0, skipped: 0 });
      }
    });
  }

  // Find latest imported day to reflect its block results on the active schedule
  const sortedDays = [...nextImportedDays].sort((a, b) => a.date.localeCompare(b.date));
  const latestDay = sortedDays[sortedDays.length - 1];

  // 6. DayTemplate
  if (Array.isArray(payload.dayTemplate)) {
    payload.dayTemplate.forEach((rawSlot, idx) => {
      if (
        !rawSlot ||
        typeof rawSlot !== 'object' ||
        typeof rawSlot.start !== 'string' ||
        typeof rawSlot.end !== 'string' ||
        typeof rawSlot.title !== 'string'
      ) {
        invalidDetails.push(`dayTemplate[${idx}]: thiếu start, end hoặc title`);
        return;
      }
      const start = rawSlot.start.trim();
      const end = rawSlot.end.trim();
      const title = rawSlot.title.trim();
      const kind = typeof rawSlot.kind === 'string' ? rawSlot.kind : 'personal';
      const slotId = typeof rawSlot.id === 'string' ? rawSlot.id : `tpl-${start}-${end}`;
      const slotTs = toEpochMs(rawSlot.updatedAt as string | number | undefined) || fileExportedTs;
      const goalMinutes = (rawSlot.goalMinutes && typeof rawSlot.goalMinutes === 'object' ? rawSlot.goalMinutes : {}) as Record<string, number>;

      const slotRecord: DayTemplateSlot = {
        id: slotId,
        start,
        end,
        kind,
        title,
        goalMinutes,
        updatedAt: slotTs,
        extra: extractExtra(rawSlot, ['id', 'start', 'end', 'kind', 'title', 'goalMinutes', 'updatedAt']),
      };

      nextDayTemplate = mergeItemById(nextDayTemplate, slotRecord, slotTs, mode, breakdown.dayTemplate);

      // Also create/update timeline template blocks (skipping 00:00-07:00 and 23:00-24:00 sleep blocks in task timeline)
      if (kind !== 'sleep') {
        const primaryGoalId = Object.keys(goalMinutes)[0];
        const matchedResult = latestDay?.blockResults.find(
          br => br.blockStart === start && br.blockEnd === end
        );
        const blockType =
          kind === 'goal_work'
            ? 'deep'
            : kind === 'meeting'
              ? 'meeting'
              : kind === 'interruption_buffer'
                ? 'interruption'
                : kind === 'planning'
                  ? 'planning'
                  : 'personal';

        const blockStatus =
          matchedResult?.result === 'done'
            ? 'done'
            : matchedResult?.result === 'partly_done'
              ? 'partly_done'
              : 'planned';

        const durMins = parseMinutesBetween(start, end);

        const tplBlock: TimeBlock = {
          id: slotId,
          title,
          startTime: start,
          endTime: end,
          type: blockType,
          status: blockStatus,
          goalId: primaryGoalId,
          goalName: primaryGoalId ? goalNameMap.get(primaryGoalId) : undefined,
          estimatedMinutes: durMins,
          touchTimeMinutes: blockStatus === 'done' || blockStatus === 'partly_done' ? durMins : undefined,
          cycleTimeMinutes: blockStatus === 'done' || blockStatus === 'partly_done' ? durMins : undefined,
          nextStep: matchedResult?.nextStep,
          notes: matchedResult?.note || matchedResult?.timeUsedFor,
          isTemplateBlock: true,
          templateKind: kind,
          goalMinutes,
          updatedAt: slotTs,
        };

        nextBlocks = mergeItemById(nextBlocks, tplBlock, slotTs, mode, { added: 0, updated: 0, skipped: 0 });
      }
    });
  }

  // 7. Populate DailyCardItems and Interruptions from importedDays so Thẻ ngày & Nhật ký công việc show all 5 days
  for (const dayRec of nextImportedDays) {
    const dTs = toEpochMs(dayRec.updatedAt) || fileExportedTs;

    for (const br of dayRec.blockResults) {
      const primaryGoalId = br.goalMinutes ? Object.keys(br.goalMinutes)[0] : undefined;
      const dcId = `dc-${dayRec.date}-${br.blockStart}-${br.blockEnd}`;
      const dcStatus =
        br.result === 'done'
          ? 'done'
          : br.result === 'partly_done'
            ? 'carried'
            : br.movedTo === 'tomorrow'
              ? 'carried'
              : 'left';

      const dcItem: DailyCardItem = {
        id: dcId,
        text: br.nextStep ? `${br.title} (Bước tiếp: ${br.nextStep})` : br.title,
        date: dayRec.date,
        goalId: primaryGoalId,
        goalName: primaryGoalId ? goalNameMap.get(primaryGoalId) : undefined,
        start: br.blockStart,
        end: br.blockEnd,
        status: dcStatus,
        carryCount: br.result === 'partly_done' || br.movedTo === 'tomorrow' ? 1 : 0,
        origin: 'planned',
        note: br.note,
        nextStep: br.nextStep,
        timeUsedFor: br.timeUsedFor,
        movedTo: br.movedTo,
        updatedAt: dTs,
      };
      nextDailyCards = mergeItemById(nextDailyCards, dcItem, dTs, mode, { added: 0, updated: 0, skipped: 0 });
    }

    if (dayRec.backfill) {
      for (const bf of dayRec.backfill) {
        const dcBfId = `dc-${dayRec.date}-bf-${bf.start}-${bf.end}`;
        const gId = bf.goalId || undefined;
        const dcBfItem: DailyCardItem = {
          id: dcBfId,
          text: `${bf.title} (Ghi bù ${bf.start}–${bf.end})`,
          date: dayRec.date,
          goalId: gId,
          goalName: gId ? goalNameMap.get(gId) : undefined,
          start: bf.start,
          end: bf.end,
          status: 'done',
          carryCount: 0,
          origin: bf.origin === 'unplanned_on_goal' ? 'unplanned_goal' : 'planned',
          updatedAt: dTs,
        };
        nextDailyCards = mergeItemById(nextDailyCards, dcBfItem, dTs, mode, { added: 0, updated: 0, skipped: 0 });
      }
    }

    if (dayRec.displaced) {
      dayRec.displaced.forEach((dp, dpIdx) => {
        const dcDpId = `dc-${dayRec.date}-disp-${dpIdx}`;
        const dcDpItem: DailyCardItem = {
          id: dcDpId,
          text: `[Bị đẩy lùi ${dp.minutes}p] ${dp.title}`,
          date: dayRec.date,
          status: 'carried',
          carryCount: 1,
          origin: 'planned',
          displacedItemTitle: dp.title,
          displacedMinutes: dp.minutes,
          updatedAt: dTs,
        };
        nextDailyCards = mergeItemById(nextDailyCards, dcDpItem, dTs, mode, { added: 0, updated: 0, skipped: 0 });
      });
    }

    for (const intr of dayRec.interruptions) {
      const intId = intr.id || `int-${dayRec.date}-${intr.time}-${intr.category}`;
      const cat = mapInterruptionCategory(intr.category);
      const intrRecord: InterruptionRecord = {
        id: intId,
        timestamp: `${dayRec.date} ${intr.time}`,
        date: dayRec.date,
        title: intr.note ? `${intr.category}: ${intr.note}` : `Việc chen ngang (${intr.category}) lúc ${intr.time}`,
        minutes: intr.minutes,
        decision: intr.decision === 'now' ? 'do_now' : 'postpone',
        category: cat,
        note: intr.note,
        situation: 'moment',
        updatedAt: dTs,
        extra: intr.extra,
      };
      nextInterruptions = mergeItemById(nextInterruptions, intrRecord, dTs, mode, { added: 0, updated: 0, skipped: 0 });
    }
  }

  // 8. Rebuild 24-hour TimeLedger from dayTemplate if dayTemplate was provided
  let nextTimeLedger = currentState.timeLedger;
  if (nextDayTemplate.length > 0) {
    nextTimeLedger = nextDayTemplate.map((slot, idx) => {
      const cat: TimeLedgerCategory =
        slot.kind === 'sleep'
          ? 'sleep'
          : slot.kind === 'goal_work'
            ? 'goal_work'
            : slot.kind === 'meeting'
              ? 'meeting'
              : slot.kind === 'planning'
                ? 'planning'
                : slot.kind === 'interruption_buffer'
                  ? 'interruption'
                  : 'personal';
      return {
        id: `tl-tpl-${idx}-${slot.start}`,
        start: slot.start,
        end: slot.end,
        durationMins: parseMinutesBetween(slot.start, slot.end),
        category: cat,
        label: slot.title,
        linkedTaskTitle: slot.title,
      };
    });
  }

  const totalAdded =
    breakdown.goals.added +
    breakdown.projects.added +
    breakdown.lists.added +
    breakdown.tasks.added +
    breakdown.dayTemplate.added +
    breakdown.days.added;

  const totalUpdated =
    breakdown.goals.updated +
    breakdown.projects.updated +
    breakdown.lists.updated +
    breakdown.tasks.updated +
    breakdown.dayTemplate.updated +
    breakdown.days.updated;

  const totalSkipped =
    breakdown.goals.skipped +
    breakdown.projects.skipped +
    breakdown.lists.skipped +
    breakdown.tasks.skipped +
    breakdown.dayTemplate.skipped +
    breakdown.days.skipped;

  return {
    nextState: {
      profile: nextProfile,
      userProfileDetail: nextProfileDetail,
      goals: nextGoals,
      lists: nextLists,
      listItems: nextListItems,
      blocks: nextBlocks,
      dailyCardItems: nextDailyCards,
      interruptions: nextInterruptions,
      backlogCards: nextBacklogCards,
      timeLedger: nextTimeLedger,
      dayTemplate: nextDayTemplate,
      importedDays: nextImportedDays,
    },
    summary: {
      mode,
      added: totalAdded,
      updated: totalUpdated,
      skippedUnchanged: totalSkipped,
      skippedInvalid: invalidDetails.length,
      invalidDetails,
      breakdown,
    },
  };
}

/**
 * Round-trip export: build `taio-time-export` v1 JSON from current app state
 */
export function buildTaioExportV1(state: AppImportableState): TaioExportV1 {
  const projectItems = state.listItems.filter(
    li => state.lists.find(l => l.id === li.listId)?.type === 'project' && !li.archived
  );

  const exportedGoals = state.goals.map(g => {
    const base: Record<string, unknown> = {
      ...(g.extra || {}),
      id: g.id,
      name: g.name,
      progressType: g.progressType || 'tasks',
    };
    if (g.progressType === 'time_commitment' && g.commitment) {
      base.commitment = g.commitment;
    } else if (g.progressType === 'time_commitment' && g.committedHours) {
      base.commitment = {
        minutesPerDay: g.dailyBudgetMins || 45,
        days: g.horizonDays || 90,
        start: g.start || '2026-10-31',
      };
    }
    if (g.progressType === 'key_result') {
      base.keyResult = {
        label: g.keyResultUnit || 'kết quả',
        target: g.keyResultTarget ?? 10,
        current: g.keyResultCurrent ?? 0,
      };
    }
    if (g.start) base.start = g.start;
    if (g.deadline) base.deadline = g.deadline;
    base.description = g.measurableResult;
    return base;
  });

  const exportedProjects = projectItems.map(p => ({
    ...(p.extra || {}),
    id: p.id,
    name: p.text,
    goalId: p.goalId || null,
    status: p.projectStatus || 'active',
    start: p.startDate || null,
    deadline: p.deadline || null,
    nextAction: p.nextAction || '',
  }));

  const exportedLists = state.lists
    .filter(l => !l.archived)
    .map(l => {
      const itemsForList = state.listItems.filter(li => li.listId === l.id && !li.archived);
      return {
        ...(l.extra || {}),
        id: l.id,
        name: l.name,
        type: l.type,
        items:
          l.type === 'project'
            ? itemsForList.map(li => li.id)
            : itemsForList.map(li => ({
                ...(li.extra || {}),
                id: li.id,
                text: li.text,
                state: li.ideaState || 'new',
                createdAt: li.createdAt,
              })),
      };
    });

  const matrixTasks = state.blocks.filter(b => !b.isTemplateBlock);
  const exportedTasks = matrixTasks.map(t => {
    const rawEst = t.extra && 'rawEstimateMin' in t.extra ? t.extra.rawEstimateMin : t.estimatedMinutes ?? null;
    const cleanExtra = { ...(t.extra || {}) };
    delete cleanExtra.rawEstimateMin;
    const matrixCode =
      t.matrixGroup ||
      (t.quadrant === 1 ? 'do_now' : t.quadrant === 3 ? 'delegate' : t.quadrant === 2 ? 'schedule' : 'drop');

    return {
      ...cleanExtra,
      id: t.id,
      title: t.title,
      goalId: t.goalId || null,
      estimateMin: rawEst,
      deadline: t.deadline || null,
      createdAt: t.createdAt,
      status: t.status === 'done' ? 'done' : t.status === 'dropped' ? 'dropped' : 'open',
      matrix: matrixCode,
      source: t.taskSource || 'matrix',
      ...(t.notes ? { note: t.notes } : {}),
      ...(t.carryFrom ? { carryFrom: t.carryFrom } : {}),
    };
  });

  const exportedDayTemplate = state.dayTemplate.map(slot => ({
    ...(slot.extra || {}),
    start: slot.start,
    end: slot.end,
    kind: slot.kind,
    title: slot.title,
    goalMinutes: slot.goalMinutes || {},
  }));

  const exportedDays = state.importedDays.map(d => ({
    ...(d.extra || {}),
    date: d.date,
    blockResults: d.blockResults.map(br => ({
      ...(br.extra || {}),
      blockStart: br.blockStart,
      blockEnd: br.blockEnd,
      title: br.title,
      goalMinutes: br.goalMinutes || {},
      result: br.result,
      ...(br.note ? { note: br.note } : {}),
      ...(br.nextStep ? { nextStep: br.nextStep } : {}),
      ...(br.timeUsedFor ? { timeUsedFor: br.timeUsedFor } : {}),
      ...(br.movedTo ? { movedTo: br.movedTo } : {}),
    })),
    interruptions: d.interruptions.map(intr => ({
      ...(intr.extra || {}),
      time: intr.time,
      minutes: intr.minutes,
      category: intr.category,
      decision: intr.decision,
      note: intr.note ?? '',
    })),
    ...(d.dayClosedAt ? { dayClosedAt: d.dayClosedAt } : {}),
    ...(d.backfill ? { backfill: d.backfill } : {}),
    ...(d.displaced ? { displaced: d.displaced } : {}),
    ...(d.topTaskTomorrow ? { topTaskTomorrow: d.topTaskTomorrow } : {}),
    ...(d.undeclaredLabel ? { undeclaredLabel: d.undeclaredLabel } : {}),
    ...(d.notes ? { notes: d.notes } : {}),
  }));

  return {
    format: 'taio-time-export',
    formatVersion: 1,
    specVersion: '0.3.20',
    exportedAt: new Date().toISOString(),
    timezone: 'Asia/Ho_Chi_Minh',
    user: {
      ...(state.userProfileDetail.extra || {}),
      displayName: state.userProfileDetail.displayName,
      profile: state.profile.type === 'owner' ? 'business_owner' : state.profile.type,
      defaultHomeScreen: state.userProfileDetail.defaultHomeScreen,
    },
    goals: exportedGoals,
    projects: exportedProjects,
    lists: exportedLists,
    tasks: exportedTasks,
    dayTemplate: exportedDayTemplate,
    days: exportedDays,
  };
}
