// TAIO Time Domain — Golden Test Vector Runner (PRD v0.3.38 Part F2.5)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { validateWorkNode, rollUpNodeMinutes } from '../src/domain/workNode.ts';
import { computeEvmPacing, computeEstimationEfficiency, extractTaskActualMinutes } from '../src/domain/goalLedger.ts';
import { matchLinesWithStableIds } from '../src/features/sticky/model/lineMatcher.ts';
import { hasStickyChanged } from '../src/features/sticky/model/stickyStore.ts';
import { updateScheduleEntry } from '../src/features/tasks/scheduleWrite.ts';
import { buildTodaySchedule } from '../src/features/tasks/todaySchedule.ts';
import { computeBlockStatus, getDeviceCalendarDate } from '../src/core/clock/index.ts';
import { expandOccurrences } from '../src/domain/events/index.ts';
import { defaultLunarProvider } from '../src/domain/lunar/index.ts';
import { newFreeSticky, updateSticky, closeSticky, getStickyNotesForExport } from '../src/features/sticky/model/stickyStore.ts';
import { computeRingArc } from '../src/domain/clockRing.ts';
import { clockState } from '../src/features/clock/model/clockState.ts';
import { mergeCollectionsByUpdatedAt } from '../src/core/storage/durableStorage.ts';
import { normalizeSpokenVi } from '../src/features/intake/normalizeSpokenVi.ts';
import { normalizeSpokenEn } from '../src/features/intake/normalizeSpokenEn.ts';
import { normalizeGoalVoice } from '../src/features/intake/normalizeGoalVoice.ts';
import { intakeTask } from '../src/features/intake/intakeTask.ts';
import { coalesceAppUsageRecords } from '../src/features/app-usage/coalesce.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testVectorPath = path.resolve(__dirname, '../docs/test-vectors/workNode/workNode.test.json');
if (!fs.existsSync(testVectorPath)) {
  console.log('[test-vectors] Skipping: workNode.test.json not found');
  process.exit(0);
}

const suite = JSON.parse(fs.readFileSync(testVectorPath, 'utf8'));
let passed = 0;
let failed = 0;

for (const tc of suite.testCases) {
  if (tc.name.startsWith('validateWorkNode')) {
    const res = validateWorkNode(tc.input);
    if (res.valid === tc.expected.valid && res.errors.length === tc.expected.errorsCount) {
      passed++;
    } else {
      console.error(`[FAIL] ${tc.name}: expected ${JSON.stringify(tc.expected)}, got ${JSON.stringify(res)}`);
      failed++;
    }
  } else if (tc.name.startsWith('rollUpNodeMinutes')) {
    const allNodes = [tc.parentGoal, tc.childProject, tc.childMilestone];
    const mTotal = rollUpNodeMinutes(tc.childMilestone.id, allNodes, tc.taskMinutesMap);
    const pTotal = rollUpNodeMinutes(tc.childProject.id, allNodes, tc.taskMinutesMap);
    const gTotal = rollUpNodeMinutes(tc.parentGoal.id, allNodes, tc.taskMinutesMap);

    if (
      mTotal === tc.expected.milestoneTotal &&
      pTotal === tc.expected.projectTotal &&
      gTotal === tc.expected.goalTotal
    ) {
      passed++;
    } else {
      console.error(`[FAIL] ${tc.name}: got m=${mTotal}, p=${pTotal}, g=${gTotal}, expected ${JSON.stringify(tc.expected)}`);
      failed++;
    }
  }
}

// 2. Goal Ledger test vectors
const goalLedgerPath = path.resolve(__dirname, '../docs/test-vectors/goalLedger/goalLedger.test.json');
if (fs.existsSync(goalLedgerPath)) {
  const glSuite = JSON.parse(fs.readFileSync(goalLedgerPath, 'utf8'));
  for (const tc of glSuite.testCases) {
    if (tc.name.startsWith('B4.2')) {
      const res = computeEvmPacing(
        tc.input.startDate,
        tc.input.deadlineDate,
        tc.input.plannedHours,
        tc.input.actualHours,
        tc.input.progressPercent,
        new Date(tc.input.asOfDate)
      );
      if (
        res.shouldBeAtPercent === tc.expected.shouldBeAtPercent &&
        res.paceStatus === tc.expected.paceStatus &&
        res.paceLabel === tc.expected.paceLabel
      ) {
        passed++;
      } else {
        console.error(`[FAIL] ${tc.name}: expected ${JSON.stringify(tc.expected)}, got ${JSON.stringify(res)}`);
        failed++;
      }
    } else if (tc.name.startsWith('B4.3')) {
      const res = computeEstimationEfficiency(tc.input.doneTasks);
      if (
        res.efficiencyPercent === tc.expected.efficiencyPercent &&
        res.label === tc.expected.label
      ) {
        passed++;
      } else {
        console.error(`[FAIL] ${tc.name}: expected ${JSON.stringify(tc.expected)}, got ${JSON.stringify(res)}`);
        failed++;
      }
    } else if (tc.name.startsWith('B4.4')) {
      const res = extractTaskActualMinutes(tc.input.task);
      if (res.minutes === tc.expected.minutes && res.isEstimated === tc.expected.isEstimated) {
        passed++;
      } else {
        console.error(`[FAIL] ${tc.name}: expected ${JSON.stringify(tc.expected)}, got ${JSON.stringify(res)}`);
        failed++;
      }
    }
  }
}

// 3. PRD v0.3.39 Part E Tests: Sticky Line Matching & Store Loop Protection
{
  const oldLines = [
    { id: 'l-1', text: '10:00 Họp nhóm 30p', done: false },
    { id: 'l-2', text: '11:00 Viết kịch bản 60p', done: false },
  ];
  // Test E.1: Inserting blank line at top preserves line IDs and task association
  const insertedTop = matchLinesWithStableIds(['', '10:00 Họp nhóm 30p', '11:00 Viết kịch bản 60p'], oldLines);
  if (insertedTop.length === 3 && insertedTop[1].id === 'l-1' && insertedTop[2].id === 'l-2') {
    passed++;
  } else {
    console.error(`[FAIL] Part E.1 matchLinesWithStableIds top insert mismatch:`, insertedTop);
    failed++;
  }

  // Test E.2: Editing line text preserves id
  const editedText = matchLinesWithStableIds(['10:00 Họp nhóm 45p', '11:00 Viết kịch bản 60p'], oldLines);
  if (editedText.length === 2 && editedText[1].id === 'l-2' && editedText[0].id === 'l-1') {
    passed++;
  } else {
    console.error(`[FAIL] Part E.2 matchLinesWithStableIds text edit mismatch:`, editedText);
    failed++;
  }

  // Test E.3: hasStickyChanged returns false for identical content
  const mockNote = {
    id: 'note-1',
    kind: 'free',
    color: 'pink',
    title: 'Ghi chú',
    content: 'hello',
    lines: [{ id: 'l-1', text: 'hello', done: false }],
    scheduledMap: { 'l-1': 'task-1' },
    pinned: false,
    collapsed: false,
    open: true,
    lastOpen: true,
    updatedAt: 1000,
  };
  const noChange = hasStickyChanged(mockNote, {
    content: 'hello',
    lines: [{ id: 'l-1', text: 'hello', done: false }],
    scheduledMap: { 'l-1': 'task-1' },
    title: 'Ghi chú',
  });
  if (noChange === false) {
    passed++;
  } else {
    console.error(`[FAIL] Part E.3 hasStickyChanged should be false when data unchanged`);
    failed++;
  }

  // Test E.4: hasStickyChanged returns true when content changed
  const realChange = hasStickyChanged(mockNote, {
    content: 'hello world',
  });
  if (realChange === true) {
    passed++;
  } else {
    console.error(`[FAIL] Part E.4 hasStickyChanged should be true when data changed`);
    failed++;
  }
}

// 4. PRD v0.3.40 Part A Tests: Schedule Write Gateway & Template Invariance
{
  const today = getDeviceCalendarDate();
  const tomDate = new Date();
  tomDate.setDate(tomDate.getDate() + 1);
  const tomorrow = getDeviceCalendarDate(tomDate);

  // Test A.1: Stopping a card task sets end time and status 'left' without error
  let dailyCardItems = [
    { id: 'dc-1', date: today, text: 'TAIO MKT', start: '17:20', end: '18:30', status: 'open' },
  ];
  const updateDailyCardItem = (id, patch) => {
    dailyCardItems = dailyCardItems.map(it => it.id === id ? { ...it, ...patch } : it);
  };
  let blocks = [
    {
      id: 'tb-dinner',
      title: 'Ăn tối, thời gian cá nhân',
      startTime: '18:00',
      endTime: '22:00',
      type: 'personal',
      status: 'planned',
      isTemplateBlock: true,
      blockKind: 'routine',
    },
  ];
  const setBlocks = fn => {
    blocks = typeof fn === 'function' ? fn(blocks) : fn;
  };

  updateScheduleEntry('dc-1', { status: 'partly_done', endTime: '17:35', nextStep: 'Review clip' }, {
    updateDailyCardItem,
    setBlocks,
    dailyCardItems,
  });

  const stoppedCard = dailyCardItems.find(i => i.id === 'dc-1');
  const todaySched1 = buildTodaySchedule(blocks, dailyCardItems, today);
  const cardBlock = todaySched1.find(b => b.id === 'dc-1');

  if (stoppedCard && stoppedCard.status === 'left' && stoppedCard.end === '17:35' && cardBlock && cardBlock.status === 'partly_done') {
    passed++;
  } else {
    console.error(`[FAIL] Part A.1 Stop card task failed:`, { stoppedCard, cardBlock });
    failed++;
  }

  // Test A.2: Stopping a fixed template block must NOT mutate root template block in `blocks`
  updateScheduleEntry('tb-dinner', { status: 'partly_done', endTime: '18:45', timeboxEndOutcome: 'continue_later' }, {
    updateDailyCardItem,
    setBlocks,
    dailyCardItems,
  });

  const rootBlock = blocks.find(b => b.id === 'tb-dinner');
  const todaySched2 = buildTodaySchedule(blocks, dailyCardItems, today);
  const todayDinner = todaySched2.find(b => b.id === 'tb-dinner');

  const rootUnchanged = rootBlock.startTime === '18:00' && rootBlock.endTime === '22:00' && rootBlock.status === 'planned';
  const todayOverridden = todayDinner.endTime === '18:45' && todayDinner.status === 'partly_done';

  if (rootUnchanged && todayOverridden) {
    passed++;
  } else {
    console.error(`[FAIL] Part A.2 Template invariance failed: rootUnchanged=${rootUnchanged}, todayOverridden=${todayOverridden}`, { rootBlock, todayDinner });
    failed++;
  }

  // Test A.3: Tomorrow schedule synthesized from the same blocks returns original 18:00–22:00
  const tomorrowSched = buildTodaySchedule(blocks, dailyCardItems, tomorrow);
  const tomorrowDinner = tomorrowSched.find(b => b.id === 'tb-dinner');
  if (tomorrowDinner && tomorrowDinner.startTime === '18:00' && tomorrowDinner.endTime === '22:00' && tomorrowDinner.status === 'planned') {
    passed++;
  } else {
    console.error(`[FAIL] Part A.3 Tomorrow schedule mutated from today's stop:`, tomorrowDinner);
    failed++;
  }
}

// 5. PRD v0.3.43 Part E2.7: Sticky Note Persistence Across Close/Reopen
{
  const testNoteId = newFreeSticky('pink');
  const sampleText = 'Dòng 1: Gặp đối tác\nDòng 2: Chuẩn bị slide\nDòng 3: Gửi báo cáo';
  updateSticky(testNoteId, { content: sampleText });

  // Close note
  closeSticky(testNoteId);
  let notes = getStickyNotesForExport();
  let closedNote = notes.find(n => n.id === testNoteId);

  if (closedNote && closedNote.open === false && closedNote.content === sampleText) {
    passed++;
  } else {
    console.error(`[FAIL] Part E2.7 Sticky close failed to preserve content:`, closedNote);
    failed++;
  }

  // Reopen note
  updateSticky(testNoteId, { open: true });
  notes = getStickyNotesForExport();
  let reopenedNote = notes.find(n => n.id === testNoteId);

  if (reopenedNote && reopenedNote.open === true && reopenedNote.content === sampleText) {
    passed++;
  } else {
    console.error(`[FAIL] Part E2.7 Sticky reopen failed to restore content:`, reopenedNote);
    failed++;
  }
}

// 6. PRD v0.3.43 Part A2: Pure Occurrence Engine (expandOccurrences)
{
  // Test A2.1: Annual solar recurring event
  const annualBday = {
    id: 'evt-bday',
    title: 'Sinh nhật bạn',
    startDate: '2025-05-15',
    allDay: true,
    recurrence: {
      freq: 'yearly',
      interval: 1,
    },
    source: 'taio',
    createdAt: 1000,
    updatedAt: 1000,
  };
  const bdayOccs = expandOccurrences([annualBday], '2025-01-01', '2027-12-31');
  const bdayDates = bdayOccs.map(o => o.date);
  if (
    bdayOccs.length === 3 &&
    bdayDates[0] === '2025-05-15' &&
    bdayDates[1] === '2026-05-15' &&
    bdayDates[2] === '2027-05-15'
  ) {
    passed++;
  } else {
    console.error(`[FAIL] Part A2.1 Annual recurrence mismatch:`, bdayDates);
    failed++;
  }

  // Test A2.2: Weekly event with count limit
  const weeklySync = {
    id: 'evt-weekly',
    title: 'Họp tuần',
    startDate: '2025-06-02', // Monday
    start: '10:00',
    end: '11:00',
    recurrence: {
      freq: 'weekly',
      interval: 1,
      count: 4,
    },
    source: 'taio',
    createdAt: 1000,
    updatedAt: 1000,
  };
  const weeklyOccs = expandOccurrences([weeklySync], '2025-06-01', '2025-08-31');
  if (weeklyOccs.length === 4 && weeklyOccs[3].date === '2025-06-23') {
    passed++;
  } else {
    console.error(`[FAIL] Part A2.2 Weekly count limit mismatch:`, weeklyOccs);
    failed++;
  }

  // Test A2.3: Single event with exception override (skip & custom time)
  const singleEvt = {
    id: 'evt-single',
    title: 'Gặp khách',
    startDate: '2025-07-10',
    start: '14:00',
    end: '15:00',
    exceptions: {
      '2025-07-10': { start: '15:30', end: '16:30' },
    },
    source: 'taio',
    createdAt: 1000,
    updatedAt: 1000,
  };
  const singleOccs = expandOccurrences([singleEvt], '2025-07-01', '2025-07-31');
  if (singleOccs.length === 1 && singleOccs[0].start === '15:30' && singleOccs[0].isException === true) {
    passed++;
  } else {
    console.error(`[FAIL] Part A2.3 Exception override mismatch:`, singleOccs);
    failed++;
  }
}

// 7. PRD v0.3.43 Part C: Vietnamese Lunar Calendar Algorithm & Recurrence
{
  // Test C.1: Solar to Lunar for Tết 2025 (2025-01-29 -> 1/1 Ất Tỵ)
  const lunar2025 = defaultLunarProvider.toLunar({ day: 29, month: 1, year: 2025 });
  if (lunar2025 && lunar2025.day === 1 && lunar2025.month === 1 && lunar2025.year === 2025) {
    passed++;
  } else {
    console.error(`[FAIL] Part C.1 Tết 2025 Solar->Lunar mismatch:`, lunar2025);
    failed++;
  }

  // Test C.2: Lunar to Solar for Tết 2026 (1/1 Bính Ngọ -> 2026-02-17)
  const solar2026 = defaultLunarProvider.toSolar({ day: 1, month: 1, year: 2026 }, 2026);
  if (solar2026 && solar2026.day === 17 && solar2026.month === 2 && solar2026.year === 2026) {
    passed++;
  } else {
    console.error(`[FAIL] Part C.2 Tết 2026 Lunar->Solar mismatch:`, solar2026);
    failed++;
  }

  // Test C.3: Lunar recurring event expansion across 3 years
  const tetEvt = {
    id: 'evt-tet',
    title: 'Tết Nguyên Đán',
    startDate: '2025-01-29',
    allDay: true,
    recurrence: {
      freq: 'yearly',
      interval: 1,
      calendar: 'lunar',
    },
    source: 'taio',
    createdAt: 1000,
    updatedAt: 1000,
  };
  const tetOccs = expandOccurrences([tetEvt], '2025-01-01', '2027-12-31', defaultLunarProvider);
  const tetDates = tetOccs.map(o => o.date);
  if (
    tetOccs.length === 3 &&
    tetDates[0] === '2025-01-29' &&
    tetDates[1] === '2026-02-17' &&
    tetDates[2] === '2027-02-06'
  ) {
    passed++;
  } else {
    console.error(`[FAIL] Part C.3 Lunar recurring occurrence mismatch:`, tetDates);
    failed++;
  }

  // Test C.4: Day 30 clamp rule (C1.4): for 29-day month (e.g. Month 2/2025), day 30 clamps safely to 29
  const d29 = defaultLunarProvider.toSolar({ day: 29, month: 2, year: 2025 }, 2025);
  const d30 = defaultLunarProvider.toSolar({ day: 30, month: 2, year: 2025 }, 2025);
  if (d29 && d30 && d29.day === 28 && d29.month === 3 && d30.day === d29.day && d30.month === d29.month) {
    passed++;
  } else {
    console.error(`[FAIL] Part C.4 Day 30 clamp mismatch:`, { d29, d30 });
    failed++;
  }
}

// 6. Clock Window Controller test vectors (PRD v0.3.46 Part A6)
const clockJsPath = path.resolve(__dirname, '../desktop/clock/clock.js');
if (fs.existsSync(clockJsPath)) {
  const clockCode = fs.readFileSync(clockJsPath, 'utf8');
  const modesToTest = [undefined, 'remaining', 'elapsed', 'goal', 'corrupted_state_!#$'];

  for (const mode of modesToTest) {
    try {
      const store = {};
      if (mode !== undefined) {
        store['taio_clock_three_view_mode'] = mode;
      }

      const elements = {};
      function getEl(id) {
        if (!elements[id]) {
          elements[id] = {
            id,
            style: {},
            classList: { toggle: () => {}, add: () => {}, remove: () => {} },
            innerText: '',
            addEventListener: () => {}
          };
        }
        return elements[id];
      }

      const mockDocument = {
        getElementById: (id) => getEl(id),
        documentElement: { clientWidth: 260, clientHeight: 140 }
      };

      const mockWindow = {
        addEventListener: () => {},
        innerWidth: 260,
        innerHeight: 140,
        updateUI: null,
        close: () => {},
        taioAPI: {
          onSyncTimer: () => {},
          getTimerData: () => Promise.resolve(null),
          notifyClockReady: () => {},
          sendTimerAction: () => {},
          sendClockError: () => {}
        }
      };

      const mockLocalStorage = {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; }
      };

      const sandbox = {
        window: mockWindow,
        document: mockDocument,
        localStorage: mockLocalStorage,
        setInterval: () => {},
        console: { ...console, error: () => {} },
        Date,
        Math
      };

      vm.createContext(sandbox);
      vm.runInContext(clockCode, sandbox);

      if (typeof mockWindow.updateUI !== 'function') {
        throw new Error(`window.updateUI was not created for mode: ${mode}`);
      }

      // Test active task update
      const endsAt = Date.now() + 52 * 60 * 1000;
      const startedAt = Date.now() - 8 * 60 * 1000;
      mockWindow.updateUI({
        title: 'Khoá học Claude',
        subtitle: 'Học AI',
        mode: 'task',
        endsAt,
        startedAt,
        goalHours: 2,
        goalMins: 15,
        goalTitle: 'Khóa học Claude',
        goalTargetHours: 40
      });

      const barTitle = getEl('barTitle').innerText;
      const barDigits = getEl('barDigits').innerText;
      if (barTitle === 'Khoá học Claude' && barDigits.length > 0) {
        passed++;
      } else {
        console.error(`[FAIL] Clock test for mode ${mode}: barTitle=${barTitle}, barDigits=${barDigits}`);
        failed++;
      }
    } catch (err) {
      console.error(`[FAIL] Clock test crashed for mode ${mode}:`, err);
      failed++;
    }
  }
}

// 10. Clock Ring & Bar Geometry test vectors (PRD v0.3.47 Part C)
const ringCirc = 100;
const ringTests = [
  { e: 0, remDash: 100, remOffset: 0, elapDash: 0, elapOffset: 0, isOverrun: false },
  { e: 0.25, remDash: 75, remOffset: -25, elapDash: 25, elapOffset: 0, isOverrun: false },
  { e: 0.5, remDash: 50, remOffset: -50, elapDash: 50, elapOffset: 0, isOverrun: false },
  { e: 1.0, remDash: 0, remOffset: -100, elapDash: 100, elapOffset: 0, isOverrun: false },
  { e: 0.8, remDash: 100, remOffset: 0, elapDash: 100, elapOffset: 0, isOverrun: true },
];

for (const rt of ringTests) {
  const rem = computeRingArc('remaining', rt.e, ringCirc, rt.isOverrun);
  const elap = computeRingArc('elapsed', rt.e, ringCirc, rt.isOverrun);

  if (
    rem.dashLength === rt.remDash &&
    rem.dashOffset === rt.remOffset &&
    elap.dashLength === rt.elapDash &&
    elap.dashOffset === rt.elapOffset
  ) {
    passed++;
  } else {
    console.error(`[FAIL] Ring test for e=${rt.e}, overrun=${rt.isOverrun}: got rem=(${rem.dashLength}, ${rem.dashOffset}), elap=(${elap.dashLength}, ${elap.dashOffset})`);
    failed++;
  }
}

// 11. Gap Time Stability & StartedAt Non-Reset Test Vector (PRD v0.3.48 Part A4)
{
  const testBlocks = [
    {
      id: 'block-prev',
      title: 'Khối sâu 1',
      startTime: '09:00',
      endTime: '10:00',
      status: 'completed',
    },
    {
      id: 'block-next',
      title: 'Khối sâu 2',
      startTime: '10:30',
      endTime: '11:30',
      status: 'planned',
    },
  ];

  // At T1 = 10:01:00 (1 minute after previous block ended at 10:00)
  const t1Date = new Date();
  t1Date.setHours(10, 1, 0, 0);
  const state1 = clockState(testBlocks, [], t1Date);

  const tPrevEnd = new Date(t1Date);
  tPrevEnd.setHours(10, 0, 0, 0);
  const expectedStartMs = tPrevEnd.getTime();
  const elapsedSec1 = Math.floor((t1Date.getTime() - state1.startedAt) / 1000);

  // At T2 = 10:01:02 (2 seconds later, mimicking the 2000ms syncTimer pulse)
  const t2Date = new Date();
  t2Date.setHours(10, 1, 2, 0);
  const state2 = clockState(testBlocks, [], t2Date);
  const elapsedSec2 = Math.floor((t2Date.getTime() - state2.startedAt) / 1000);

  if (
    state1.mode === 'gap' &&
    state2.mode === 'gap' &&
    state1.startedAt === expectedStartMs &&
    state2.startedAt === expectedStartMs &&
    state1.startedAt === state2.startedAt &&
    elapsedSec1 === 60 &&
    elapsedSec2 === 62
  ) {
    passed++;
  } else {
    console.error(`[FAIL] Gap clockState test A4: 
      mode1=${state1.mode}, mode2=${state2.mode},
      startedAt1=${state1.startedAt}, startedAt2=${state2.startedAt}, expectedStartMs=${expectedStartMs},
      elapsedSec1=${elapsedSec1} (expected 60), elapsedSec2=${elapsedSec2} (expected 62)`);
    failed++;
  }
}

// PRD v0.3.50 Part A: Test vectors for mergeCollectionsByUpdatedAt with tombstones
{
  const localItems = [
    { id: 'item-1', title: 'Gọi anh Minh', updatedAt: 1000 },
    { id: 'item-2', title: 'Soạn báo cáo (bản cũ)', updatedAt: 1200 },
    { id: 'item-3', title: 'Chỉ có ở cửa sổ A', updatedAt: 1500 },
  ];

  const remoteItems = [
    { id: 'item-1', title: 'Gọi anh Minh (vẫn thế)', updatedAt: 900 },
    { id: 'item-2', title: 'Soạn báo cáo (đã sửa ở cửa sổ B)', updatedAt: 1800 },
    { id: 'item-4', title: 'Mua vé (mới ở cửa sổ B)', updatedAt: 1600 },
    { id: 'item-5', title: 'Mục đã bị xoá nhưng còn sót', updatedAt: 2000 },
  ];

  const deletedIds = ['item-5']; // Tombstone

  const merged = mergeCollectionsByUpdatedAt(localItems, remoteItems, deletedIds);

  const item1 = merged.find(i => i.id === 'item-1');
  const item2 = merged.find(i => i.id === 'item-2');
  const item3 = merged.find(i => i.id === 'item-3');
  const item4 = merged.find(i => i.id === 'item-4');
  const item5 = merged.find(i => i.id === 'item-5');

  if (
    item1?.title === 'Gọi anh Minh' &&
    item2?.title === 'Soạn báo cáo (đã sửa ở cửa sổ B)' &&
    item3?.title === 'Chỉ có ở cửa sổ A' &&
    item4?.title === 'Mua vé (mới ở cửa sổ B)' &&
    item5 === undefined &&
    merged.length === 4
  ) {
    passed++;
  } else {
    console.error(`[FAIL] mergeCollectionsByUpdatedAt test failed: ${JSON.stringify(merged)}`);
    failed++;
  }
}

// PRD v0.3.50 Part F3: Quote parity test between Vietnamese and English
{
  const viQuotes = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/features/motivation/model/defaultQuotes.vi.json'), 'utf8'));
  const enQuotes = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/features/motivation/model/defaultQuotes.en.json'), 'utf8'));

  const enQuoteKeys = new Set(enQuotes.map(q => q.quoteKey).filter(Boolean));
  const missingKeys = [];

  for (const q of viQuotes) {
    if (q.quoteKey && !enQuoteKeys.has(q.quoteKey)) {
      missingKeys.push(q.quoteKey);
    }
  }

  if (missingKeys.length === 0 && viQuotes.length === enQuotes.length) {
    passed++;
  } else {
    console.error(`[FAIL] Part F3 Quote parity test: missing in EN: ${missingKeys.join(', ')} (VI: ${viQuotes.length}, EN: ${enQuotes.length})`);
    failed++;
  }
}

// PRD v0.3.52 Part A5: Vietnamese spoken speech normalization (20 test cases)
{
  const viCases = [
    ['tám giờ', '8h'],
    ['tám giờ ba mươi', '8h30'],
    ['tám giờ rưỡi', '8h30'],
    ['mười lăm phút', '15 phút'],
    ['một tiếng rưỡi', '1h30'],
    ['hai mươi phút', '20 phút'],
    ['nửa tiếng', '30 phút'],
    ['bảy giờ tối', '19h'],
    ['bảy giờ sáng', '7h'],
    ['mười hai giờ trưa', '12h'],
    ['mười hai giờ đêm', '0h'],
    ['hai giờ chiều', '14h'],
    ['năm giờ chiều', '17h'],
    ['mười giờ đêm', '22h'],
    ['nửa giờ', '30 phút'],
    ['hai tiếng', '2h'],
    ['hai tiếng rưỡi', '2h30'],
    ['ba tiếng', '3h'],
    ['tám giờ rưỡi họp với anh Minh ba mươi phút', '8h30 họp với anh Minh 30 phút'],
    ['bảy giờ tối gọi khách', '19h gọi khách']
  ];

  let viPassed = 0;
  for (const [input, expected] of viCases) {
    const res = normalizeSpokenVi(input);
    if (res === expected) {
      viPassed++;
    } else {
      console.error(`[FAIL] normalizeSpokenVi('${input}'): got '${res}', expected '${expected}'`);
    }
  }

  if (viPassed === viCases.length) {
    passed++;
  } else {
    failed++;
  }
}

// PRD v0.3.52 Part A5: English spoken speech normalization (10 test cases)
{
  const enCases = [
    ['eight thirty', '8:30'],
    ['seven pm', '19:00'],
    ['seven am', '7:00'],
    ['half an hour', '30m'],
    ['one and a half hours', '1h30'],
    ['fifteen minutes', '15m'],
    ['twenty minutes', '20m'],
    ['quarter past eight', '8:15'],
    ['quarter to nine', '8:45'],
    ['two and a half hours', '2h30']
  ];

  let enPassed = 0;
  for (const [input, expected] of enCases) {
    const res = normalizeSpokenEn(input);
    if (res === expected) {
      enPassed++;
    } else {
      console.error(`[FAIL] normalizeSpokenEn('${input}'): got '${res}', expected '${expected}'`);
    }
  }

  if (enPassed === enCases.length) {
    passed++;
  } else {
    failed++;
  }
}

// PRD v0.3.52 Part A6: Goal voice reference normalization
{
  const sampleGoals = [{ id: 'g1', name: 'Kênh AI' }, { id: 'g2', name: 'Sức khỏe' }];
  const res1 = normalizeGoalVoice('làm clip cho mục tiêu Kênh AI', sampleGoals);
  const res2 = normalizeGoalVoice('viết bài cho mục tiêu không tồn tại', sampleGoals);

  if (res1 === 'làm clip #KênhAI' && res2 === 'viết bài cho mục tiêu không tồn tại') {
    passed++;
  } else {
    console.error(`[FAIL] normalizeGoalVoice test failed: res1='${res1}', res2='${res2}'`);
    failed++;
  }
}

// PRD v0.3.52 Part B3: External intake deduplication
{
  const extId = `test-ext-${Date.now()}`;
  const first = intakeTask({ source: 'voice', rawText: 'việc thử nghiệm', externalId: extId });
  const second = intakeTask({ source: 'voice', rawText: 'việc thử nghiệm', externalId: extId });

  if (first.status === 'committed' && second.status === 'duplicate') {
    passed++;
  } else {
    console.error(`[FAIL] intakeTask deduplication failed: first=${first.status}, second=${second.status}`);
    failed++;
  }
}

// PRD v0.3.53 Part A3: Coalesce sub-10s intervals
{
  const recs = [
    { id: '1', date: '2026-11-21', startTime: '10:00:00', endTime: '10:05:00', durationSeconds: 300, appName: 'Safari', bundleId: 'com.apple.Safari', state: 'in_taio', source: 'mac-focus' },
    { id: '2', date: '2026-11-21', startTime: '10:05:00', endTime: '10:05:05', durationSeconds: 5, appName: 'Finder', bundleId: 'com.apple.finder', state: 'in_taio', source: 'mac-focus' },
    { id: '3', date: '2026-11-21', startTime: '10:05:05', endTime: '10:20:00', durationSeconds: 895, appName: 'Figma', bundleId: 'com.figma.Desktop', state: 'left_clock_running', source: 'mac-focus' }
  ];
  const coalesced = coalesceAppUsageRecords(recs);

  if (coalesced.length === 2 && coalesced[0].durationSeconds === 305 && coalesced[1].durationSeconds === 895) {
    passed++;
  } else {
    console.error(`[FAIL] coalesceAppUsageRecords test failed: ${JSON.stringify(coalesced)}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`[test-vectors] FAILED: ${failed} failed, ${passed} passed`);
  process.exit(1);
} else {
  console.log(`[test-vectors] PASSED: All ${passed} golden test vectors passed.`);
}
