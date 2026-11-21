/**
 * Unified desktop clock window synchronization & launcher (PRD v0.3.44 Part B3 & v0.3.47 Part A3)
 * Guarantees timer state & color palette is synced to Electron main process before opening the window.
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
  palette?: string;
  theme?: string;
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

  const currentPalette = document.documentElement.getAttribute('data-palette') || 'red';
  const isDark = document.documentElement.classList.contains('dark');
  const enrichedPayload: DesktopTimerPayload = {
    palette: currentPalette,
    theme: isDark ? 'dark' : 'light',
    ...(payload || {}),
  };

  if (typeof bridge.updateTimer === 'function') {
    try {
      bridge.updateTimer(enrichedPayload);
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
