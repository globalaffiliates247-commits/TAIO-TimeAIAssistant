// TAIO Time App — Focus & Lifecycle Tracker (PRD v0.3.53 Part A1, A4, A7 & v0.3.54 Part C)
import { recordAppUsage, flushAppUsageBuffer } from './store.ts';
import { clockState } from '../../features/clock/model/clockState.ts';

let lastLeaveTime: number | null = null;
let activeWindowCount = 0;
let isInitialized = false;
let currentFrontApp = { appName: '', bundleId: '' };

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

  const win = window as any;

  // PRD v0.3.54 Part C3: Connect via official taioAPI data bridge
  const taioData = win?.taioAPI?.data;
  if (taioData) {
    taioData.get('frontApp').then((app: any) => {
      if (app && app.appName) currentFrontApp = app;
    }).catch(() => {});

    taioData.subscribe('frontApp', (app: any) => {
      if (app && app.appName) currentFrontApp = app;
    });

    taioData.subscribe('appFocus', (data: any) => {
      if (!data.isFocused) {
        lastLeaveTime = data.leaveTime || Date.now();
      } else if (lastLeaveTime) {
        const now = data.returnTime || Date.now();
        const durationSec = data.durationSec || Math.round((now - lastLeaveTime) / 1000);
        if (durationSec > 0) {
          const isClockRunning = checkIsClockRunning();
          const activeApp = data.frontApp || currentFrontApp;
          recordAppUsage({
            date: new Date(lastLeaveTime).toISOString().slice(0, 10),
            startTime: new Date(lastLeaveTime).toISOString(),
            endTime: new Date(now).toISOString(),
            durationSeconds: durationSec,
            appName: activeApp.appName || '',
            bundleId: activeApp.bundleId || '',
            state: isClockRunning ? 'left_clock_running' : 'left_clock_stopped',
            source: 'mac-focus',
          });
        }
        lastLeaveTime = null;
      }
    });
  }

  // Fallback for web / multi-window when taioAPI is not available
  window.addEventListener('focus', handleWindowFocus);
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('beforeunload', () => {
    flushAppUsageBuffer();
  });

  // Track native iOS lifecycle if Capacitor is available
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
            source: 'ios-lifecycle',
          });
        }
        lastLeaveTime = null;
      }
    });
  }
}

function handleWindowFocus(): void {
  activeWindowCount = Math.max(1, activeWindowCount + 1);

  // If taioAPI appFocus already handles multi-window focus, avoid double-recording
  if ((window as any)?.taioAPI?.data) return;

  if (lastLeaveTime) {
    const now = Date.now();
    const durationSec = Math.round((now - lastLeaveTime) / 1000);

    if (durationSec > 0) {
      const isClockRunning = checkIsClockRunning();
      recordAppUsage({
        date: new Date(lastLeaveTime).toISOString().slice(0, 10),
        startTime: new Date(lastLeaveTime).toISOString(),
        endTime: new Date(now).toISOString(),
        durationSeconds: durationSec,
        appName: currentFrontApp.appName || '',
        bundleId: currentFrontApp.bundleId || '',
        state: isClockRunning ? 'left_clock_running' : 'left_clock_stopped',
        source: 'mac-focus',
      });
    }

    lastLeaveTime = null;
  }
}

function handleWindowBlur(): void {
  activeWindowCount = Math.max(0, activeWindowCount - 1);

  if ((window as any)?.taioAPI?.data) return;

  // If no window in this process has focus, record the exit time
  if (activeWindowCount === 0) {
    lastLeaveTime = Date.now();
  }
}
