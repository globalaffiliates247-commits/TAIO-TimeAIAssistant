'use client';
// PRD B24 v0.3.25 & v0.3.39 Part A2.3-A2.4:
// When to sync — on open, foreground, every 3 minutes, 10 seconds after change.
// Auto-sync runs on idle, postponed if typing in last 3s; 3 silent retries on network failure.
import { useEffect, useRef } from 'react';
import { SYNC_DEBOUNCE_MS, SYNC_INTERVAL_MS } from './syncConfig';
import { runSyncRound, SyncDeps } from './syncEngine';

let requestNow: (() => void) | null = null;
/** Lets the settings screen trigger "Đồng bộ ngay". */
export function requestSyncNow() { requestNow?.(); }

const SILENT_RETRY_DELAYS = [2000, 6000, 15000];

export function useSyncLoop(deps: SyncDeps, changeSignal: unknown[]) {
  const depsRef = useRef(deps);
  depsRef.current = deps;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const lastTypedTimeRef = useRef(0);
  const retryCountRef = useRef(0);

  useEffect(() => {
    const handleTyping = () => {
      lastTypedTimeRef.current = Date.now();
    };
    window.addEventListener('keydown', handleTyping, { passive: true });
    return () => window.removeEventListener('keydown', handleTyping);
  }, []);

  useEffect(() => {
    const executeRound = async (isManual = false) => {
      // PRD v0.3.39 Part A2.4: Hoãn nếu người dùng đang gõ trong 3 giây gần nhất (chỉ cho tự động)
      if (!isManual && Date.now() - lastTypedTimeRef.current < 3000) {
        setTimeout(() => executeRound(false), 3000);
        return;
      }

      try {
        const applied = await runSyncRound({
          getPayload: () => depsRef.current.getPayload(),
          applyPayload: (p, m) => depsRef.current.applyPayload(p, m),
        });
        retryCountRef.current = 0; // reset retry counter on success
        if (applied) setTimeout(() => executeRound(false), 2000);
      } catch {
        // PRD v0.3.39 Part A2.3: Thất bại do mạng -> thử lại ngầm 3 lần (2s, 6s, 15s)
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          // Mất mạng hẳn: không thử dồn dập, chờ sự kiện online
          retryCountRef.current = 0;
          return;
        }
        if (retryCountRef.current < 3) {
          const delay = SILENT_RETRY_DELAYS[retryCountRef.current] || 15000;
          retryCountRef.current++;
          setTimeout(() => executeRound(false), delay);
        } else {
          retryCountRef.current = 0;
        }
      }
    };

    // Helper: run when idle (max 5s timeout)
    const runIdle = () => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => executeRound(false), { timeout: 5000 });
      } else {
        setTimeout(() => executeRound(false), 100);
      }
    };

    requestNow = () => executeRound(true);

    const first = setTimeout(() => { startedRef.current = true; runIdle(); }, 3000);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') runIdle();
    }, SYNC_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') runIdle();
    };
    const onOnline = () => {
      runIdle();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);

    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      requestNow = null;
    };
  }, []);

  useEffect(() => {
    if (!startedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => requestNow?.(), { timeout: 5000 });
      } else {
        requestNow?.();
      }
    }, SYNC_DEBOUNCE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, changeSignal);
}
