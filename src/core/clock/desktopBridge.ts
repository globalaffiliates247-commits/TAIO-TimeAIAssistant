/**
 * Unified desktop clock window synchronization & launcher (PRD v0.3.44 Part B3)
 * Guarantees timer state is synced to Electron main process before opening the window.
 */

export interface DesktopTimerPayload {
  taskId?: string | null;
  title?: string;
  subtitle?: string;
  mode?: string;
  startedAt?: number;
  endsAt?: number;
  remaining?: string;
  lang?: string;
  isCountDown?: boolean;
  freeTimer?: {
    title: string;
    timeStr: string;
    mode?: string;
  } | null;
  goalTitle?: string;
  goalSize?: string;
  goalTargetHours?: number;
  goalHours?: number;
  goalMins?: number;
}

export function openClockWindowWithSync(payload?: DesktopTimerPayload): void {
  if (typeof window === 'undefined') return;
  const bridge = (window as any).taioAPI;
  if (!bridge) return;

  if (payload && typeof bridge.updateTimer === 'function') {
    try {
      bridge.updateTimer(payload);
    } catch (err) {
      console.warn('[desktopBridge] updateTimer failed', err);
    }
  }

  if (typeof bridge.openClockWindow === 'function') {
    try {
      bridge.openClockWindow();
    } catch (err) {
      console.warn('[desktopBridge] openClockWindow failed', err);
    }
  }
}
