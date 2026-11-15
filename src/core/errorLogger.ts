// TAIO Time App — Error Logging and Performance Observer (PRD v0.3.39 Part A2.2 & A2.4)
'use client';

import { APP_VERSION, VERSION_LABEL } from './buildInfo';
import { getStorageItemSync, setStorageItemSync } from './storage/durableStorage';

export interface AppErrorRecord {
  id: string;
  timestamp: string;
  tab: string;
  message: string;
  stackExcerpt: string;
  version: string;
  buildLabel: string;
  syncRunning: boolean;
  lastPayloadApplied?: boolean;
}

export interface LongTaskRecord {
  id: string;
  timestamp: string;
  durationMs: number;
  tab: string;
  syncRunning: boolean;
}

const ERROR_LOG_KEY = 'app_error_journal_v1';
const LONGTASK_LOG_KEY = 'app_longtask_journal_v1';
const MAX_LOG_ENTRIES = 20;

let currentActiveTab = 'now';
let isSyncRunningGetter: () => boolean = () => false;
let isLastPayloadAppliedGetter: () => boolean = () => false;

export function setActiveTabForLogging(tab: string) {
  currentActiveTab = tab;
}

export function registerSyncStatusGetters(
  isRunning: () => boolean,
  isLastApplied: () => boolean
) {
  isSyncRunningGetter = isRunning;
  isLastPayloadAppliedGetter = isLastApplied;
}

export function getRecentErrors(): AppErrorRecord[] {
  return getStorageItemSync<AppErrorRecord[]>(ERROR_LOG_KEY, []);
}

export function logAppError(opts: {
  tab?: string;
  message: string;
  stack?: string;
  syncRunning?: boolean;
  lastPayloadApplied?: boolean;
}) {
  try {
    const rawStack = opts.stack || '';
    const stackLines = rawStack.split('\n').map(l => l.trim()).filter(Boolean);
    const stackExcerpt = stackLines.slice(0, 6).join('\n');

    const entry: AppErrorRecord = {
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      tab: opts.tab || currentActiveTab,
      message: opts.message || 'Unknown Error',
      stackExcerpt,
      version: APP_VERSION,
      buildLabel: VERSION_LABEL,
      syncRunning: opts.syncRunning ?? isSyncRunningGetter(),
      lastPayloadApplied: opts.lastPayloadApplied ?? isLastPayloadAppliedGetter(),
    };

    const current = getRecentErrors();
    const next = [entry, ...current].slice(0, MAX_LOG_ENTRIES);
    setStorageItemSync(ERROR_LOG_KEY, next);
  } catch (e) {
    console.error('[errorLogger] Failed to log error:', e);
  }
}

export function getRecentLongTasks(): LongTaskRecord[] {
  return getStorageItemSync<LongTaskRecord[]>(LONGTASK_LOG_KEY, []);
}

export function logLongTask(durationMs: number) {
  try {
    const entry: LongTaskRecord = {
      id: `lt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      durationMs: Math.round(durationMs),
      tab: currentActiveTab,
      syncRunning: isSyncRunningGetter(),
    };

    const current = getRecentLongTasks();
    const next = [entry, ...current].slice(0, MAX_LOG_ENTRIES);
    setStorageItemSync(LONGTASK_LOG_KEY, next);
  } catch {}
}

export function formatErrorsForClipboard(): string {
  const errors = getRecentErrors();
  if (errors.length === 0) {
    return `[TAIO Error Log - Version ${VERSION_LABEL}]\nKhông có lỗi nào được ghi nhận.`;
  }

  const lines = [
    `=== TAIO Error Log (${VERSION_LABEL}) ===`,
    `Tổng số lỗi ghi nhận: ${errors.length}`,
    '',
  ];

  errors.forEach((err, idx) => {
    lines.push(`--- Lỗi #${idx + 1} ---`);
    lines.push(`Thời gian: ${err.timestamp}`);
    lines.push(`Tab: ${err.tab}`);
    lines.push(`Phiên bản: ${err.version} (${err.buildLabel})`);
    lines.push(`Đồng bộ: ${err.syncRunning ? 'Đang chạy' : 'Đang nghỉ'}${err.lastPayloadApplied ? ' (vừa áp dụng dữ liệu)' : ''}`);
    lines.push(`Thông điệp: ${err.message}`);
    if (err.stackExcerpt) {
      lines.push(`Dấu vết (6 dòng đầu):\n${err.stackExcerpt}`);
    }
    lines.push('');
  });

  return lines.join('\n');
}

export function formatLongTasksForClipboard(): string {
  const tasks = getRecentLongTasks();
  if (tasks.length === 0) {
    return `[TAIO Lag / Long Tasks - Version ${VERSION_LABEL}]\nKhông có đoạn lag > 200ms nào được ghi nhận.`;
  }

  const lines = [
    `=== TAIO Lag / Long Tasks > 200ms (${VERSION_LABEL}) ===`,
    `Tổng số lần ghi nhận: ${tasks.length}`,
    '',
  ];

  tasks.forEach((t, idx) => {
    lines.push(
      `#${idx + 1} | ${t.timestamp} | ${t.durationMs}ms | Tab: ${t.tab} | Đồng bộ: ${t.syncRunning ? 'Đang chạy' : 'Nghỉ'}`
    );
  });

  return lines.join('\n');
}

let initialized = false;

export function initGlobalErrorListeners() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Window error listener
  window.addEventListener('error', (event) => {
    logAppError({
      message: event.message || String(event.error),
      stack: event.error?.stack,
    });
  });

  // Unhandled rejection listener
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    logAppError({
      message: `Unhandled Promise Rejection: ${reason?.message || String(reason)}`,
      stack: reason?.stack,
    });
  });

  // Longtask observer (PRD v0.3.39 Part A2.4)
  try {
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 200) {
            logLongTask(entry.duration);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    }
  } catch {}
}
