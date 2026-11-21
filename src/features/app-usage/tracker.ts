// TAIO Time App — Focus & Lifecycle Tracker (PRD v0.3.53 Part A1, A4, A7)
import { recordAppUsage, flushAppUsageBuffer } from './store';
import { clockState } from '@/features/clock/model/clockState';

let lastLeaveTime: number | null = null;
let activeWindowCount = 0;
let isInitialized = false;

function checkIsClockRunning(): boolean {
  try {
    const cs = clockState();
    return cs?.mode === 'task';
  } catch (_) {
    return false;
  }
}

export function initAppUsageTracker(): void {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // Track page focus & blur across windows
  window.addEventListener('focus', handleWindowFocus);
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('beforeunload', () => {
    flushAppUsageBuffer();
  });

  // Track native iOS lifecycle if Capacitor is available
  const win = window as any;
  if (win?.Capacitor?.Plugins?.App) {
    win.Capacitor.Plugins.App.addListener('appStateChange', (state: { isActive: boolean }) => {
      if (!state.isActive) {
        lastLeaveTime = Date.now();
      } else if (lastLeaveTime) {
        const now = Date.now();
        const durationSec = Math.round((now - lastLeaveTime) / 1000);
        if (durationSec > 0) {
          const isClockRunning = checkIsClockRunning();
          recordAppUsage({
            date: new Date(lastLeaveTime).toISOString().slice(0, 10),
            startTime: new Date(lastLeaveTime).toISOString(),
            endTime: new Date(now).toISOString(),
            durationSeconds: durationSec,
            appName: '',
            bundleId: '',
            state: isClockRunning ? 'left_clock_running' : 'left_clock_stopped',
            source: 'ios-lifecycle'
          });
        }
        lastLeaveTime = null;
      }
    });
  }
}

function handleWindowFocus(): void {
  activeWindowCount = Math.max(1, activeWindowCount + 1);

  if (lastLeaveTime) {
    const now = Date.now();
    const durationSec = Math.round((now - lastLeaveTime) / 1000);

    if (durationSec > 0) {
      const isClockRunning = checkIsClockRunning();
      // On Mac, frontmost app could be detected via bridge or fallback
      const frontApp = (window as any).__taio_front_app || { appName: '', bundleId: '' };

      recordAppUsage({
        date: new Date(lastLeaveTime).toISOString().slice(0, 10),
        startTime: new Date(lastLeaveTime).toISOString(),
        endTime: new Date(now).toISOString(),
        durationSeconds: durationSec,
        appName: frontApp.appName || '',
        bundleId: frontApp.bundleId || '',
        state: isClockRunning ? 'left_clock_running' : 'left_clock_stopped',
        source: 'mac-focus'
      });
    }

    lastLeaveTime = null;
  }
}

function handleWindowBlur(): void {
  activeWindowCount = Math.max(0, activeWindowCount - 1);

  // If no window in this process has focus, record the exit time
  if (activeWindowCount === 0) {
    lastLeaveTime = Date.now();
  }
}
