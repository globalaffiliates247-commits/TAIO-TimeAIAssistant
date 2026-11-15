// TAIO Time Domain — Golden Test Vector Runner (PRD v0.3.38 Part F2.5)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateWorkNode, rollUpNodeMinutes } from '../src/domain/workNode.ts';
import { computeEvmPacing, computeEstimationEfficiency, extractTaskActualMinutes } from '../src/domain/goalLedger.ts';
import { matchLinesWithStableIds } from '../src/features/sticky/model/lineMatcher.ts';
import { hasStickyChanged } from '../src/features/sticky/model/stickyStore.ts';
import { updateScheduleEntry } from '../src/features/tasks/scheduleWrite.ts';
import { buildTodaySchedule } from '../src/features/tasks/todaySchedule.ts';
import { computeBlockStatus } from '../src/core/clock/index.ts';

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
  const today = '2026-11-15';
  const tomorrow = '2026-11-16';

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

if (failed > 0) {
  console.error(`[test-vectors] FAILED: ${failed} failed, ${passed} passed`);
  process.exit(1);
} else {
  console.log(`[test-vectors] PASSED: All ${passed} golden test vectors passed.`);
}
