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

if (failed > 0) {
  console.error(`[test-vectors] FAILED: ${failed} failed, ${passed} passed`);
  process.exit(1);
} else {
  console.log(`[test-vectors] PASSED: All ${passed} golden test vectors passed.`);
}
