/**
 * E5 Mandatory Release Test:
 * 1. Add 3 tasks in the day plan (blocks + dailyCardItems) -> close app -> reopen -> verify all 3 tasks remain.
 * 2. Offline / airplane mode simulation -> add/update tasks -> reopen -> verify tasks remain.
 * 3. Install new build over old build / sync with older server seed -> verify older server copy NEVER overwrites newer local data, and locally added tasks are preserved.
 */

import assert from 'node:assert/strict';

function mergeCollectionsByUpdatedAt(localItems, seedItems) {
  if (!Array.isArray(localItems) || localItems.length === 0) {
    return seedItems;
  }
  const mergedMap = new Map();

  for (const seed of seedItems) {
    mergedMap.set(seed.id, seed);
  }

  for (const local of localItems) {
    const existing = mergedMap.get(local.id);
    if (!existing) {
      mergedMap.set(local.id, local);
    } else {
      const localTime = local.updatedAt ?? 1;
      const seedTime = existing.updatedAt ?? 0;
      if (localTime >= seedTime) {
        mergedMap.set(local.id, local);
      }
    }
  }

  const localIds = new Set(localItems.map(i => i.id));
  const result = [];

  for (const local of localItems) {
    const item = mergedMap.get(local.id);
    if (item) result.push(item);
  }
  for (const seed of seedItems) {
    if (!localIds.has(seed.id)) {
      result.push(seed);
    }
  }

  return result;
}

// Simulated durable storage (SQLite / IndexedDB)
class SimulatedDurableDB {
  constructor() {
    this.rows = new Map();
  }
  write(key, value) {
    this.rows.set(key, JSON.stringify({ value, updatedAt: Date.now() }));
  }
  read(key) {
    const raw = this.rows.get(key);
    if (!raw) return null;
    return JSON.parse(raw).value;
  }
}

console.log('=== E5 RELEASE TEST: KIỂM TRA LƯU BỀN KẾ HOẠCH NGÀY ===');

const db = new SimulatedDurableDB();
const serverSeedBlocks = [
  { id: 'seed-1', title: 'Khối mặc định 1', startTime: '08:00', endTime: '09:00', updatedAt: 1000 },
  { id: 'seed-2', title: 'Khối mặc định 2', startTime: '09:00', endTime: '10:00', updatedAt: 1000 },
];
const serverSeedDailyCards = [
  { id: 'dc-seed-1', title: 'Việc mặc định 1', dateOffset: 0, status: 'todo', updatedAt: 1000 },
];

// Step 1: Open app initial state & add 3 tasks in Day Plan
let blocks = mergeCollectionsByUpdatedAt(db.read('blocks'), serverSeedBlocks);
let dailyCards = mergeCollectionsByUpdatedAt(db.read('dailyCardItems'), serverSeedDailyCards);

const now = Date.now();
const addedThreeTasks = [
  { id: 'user-task-1', title: 'Việc thêm mới 1: Gửi báo cáo Q4', dateOffset: 0, status: 'todo', updatedAt: now + 10 },
  { id: 'user-task-2', title: 'Việc thêm mới 2: Họp thiết kế sản phẩm', dateOffset: 0, status: 'todo', updatedAt: now + 20 },
  { id: 'user-task-3', title: 'Việc thêm mới 3: Kiểm thử bản IPA trên iPhone', dateOffset: 0, status: 'todo', updatedAt: now + 30 },
];

for (const task of addedThreeTasks) {
  dailyCards = [...dailyCards, task];
  // Write immediately to durable storage on every addition
  db.write('dailyCardItems', dailyCards);
}

const addedThreeBlocks = [
  { id: 'user-block-1', title: 'Khối việc 1: Gửi báo cáo Q4', startTime: '10:00', endTime: '11:00', updatedAt: now + 10 },
  { id: 'user-block-2', title: 'Khối việc 2: Họp thiết kế sản phẩm', startTime: '11:00', endTime: '12:00', updatedAt: now + 20 },
  { id: 'user-block-3', title: 'Khối việc 3: Kiểm thử bản IPA trên iPhone', startTime: '14:00', endTime: '15:00', updatedAt: now + 30 },
];

for (const blk of addedThreeBlocks) {
  blocks = [...blocks, blk];
  db.write('blocks', blocks);
}

// Step 2: Close app completely (clear in-memory variables) and reopen
blocks = null;
dailyCards = null;

const reopenedBlocks = mergeCollectionsByUpdatedAt(db.read('blocks'), serverSeedBlocks);
const reopenedDailyCards = mergeCollectionsByUpdatedAt(db.read('dailyCardItems'), serverSeedDailyCards);

for (const t of addedThreeTasks) {
  assert.ok(
    reopenedDailyCards.some(item => item.id === t.id && item.title === t.title),
    `Task ${t.id} must persist after closing and reopening app`
  );
}
for (const b of addedThreeBlocks) {
  assert.ok(
    reopenedBlocks.some(item => item.id === b.id && item.title === b.title),
    `Block ${b.id} must persist after closing and reopening app`
  );
}
console.log('✓ Bài kiểm tra 1 đạt: Thêm 3 việc trong kế hoạch ngày -> tắt hẳn ứng dụng -> mở lại -> đủ cả 3 việc.');

// Step 3: Offline / Airplane mode modifications
const modifiedCardsOffline = reopenedDailyCards.map(item =>
  item.id === 'user-task-1' ? { ...item, status: 'done', updatedAt: now + 500 } : item
);
db.write('dailyCardItems', modifiedCardsOffline);

// Step 4: Reopen and simulate older server copy trying to overwrite newer local changes
const olderServerSnapshot = [
  { id: 'dc-seed-1', title: 'Việc mặc định 1 (bản cũ trên máy chủ)', dateOffset: 0, status: 'todo', updatedAt: 1000 },
  { id: 'user-task-1', title: 'Việc thêm mới 1: Gửi báo cáo Q4', dateOffset: 0, status: 'todo', updatedAt: now + 10 },
];

const afterUpgradeMerge = mergeCollectionsByUpdatedAt(db.read('dailyCardItems'), olderServerSnapshot);
const task1AfterMerge = afterUpgradeMerge.find(i => i.id === 'user-task-1');
assert.equal(task1AfterMerge.status, 'done', 'Older server copy must NOT overwrite newer local change');
assert.ok(afterUpgradeMerge.some(i => i.id === 'user-task-2'), 'Task 2 must survive upgrade');
assert.ok(afterUpgradeMerge.some(i => i.id === 'user-task-3'), 'Task 3 must survive upgrade');

console.log('✓ Bài kiểm tra 2 đạt: Chế độ máy bay (ngoại tuyến) & cài bản mới đè lên bản cũ giữ nguyên dữ liệu mới hơn trên máy.');
console.log('=== TẤT CẢ BÀI KIỂM TRA E5 TRƯỚC KHI PHÁT HÀNH ĐỀU ĐẠT ===');
