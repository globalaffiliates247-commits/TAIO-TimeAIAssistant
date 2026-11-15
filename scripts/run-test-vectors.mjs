// TAIO Time Domain — Golden Test Vector Runner (PRD v0.3.38 Part F2.5)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateWorkNode, rollUpNodeMinutes } from '../src/domain/workNode.ts';
import { computeEvmPacing, computeEstimationEfficiency, extractTaskActualMinutes } from '../src/domain/goalLedger.ts';

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

if (failed > 0) {
  console.error(`[test-vectors] FAILED: ${failed} failed, ${passed} passed`);
  process.exit(1);
} else {
  console.log(`[test-vectors] PASSED: All ${passed} golden test vectors passed.`);
}
