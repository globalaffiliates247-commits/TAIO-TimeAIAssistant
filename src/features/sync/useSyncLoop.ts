'use client';
// PRD B24 v0.3.25: when to sync — on open, when the app comes back to the foreground,
// every 3 minutes while visible, and 10 seconds after a local change.
import { useEffect, useRef } from 'react';
import { SYNC_DEBOUNCE_MS, SYNC_INTERVAL_MS } from './syncConfig';
import { runSyncRound, SyncDeps } from './syncEngine';

let requestNow: (() => void) | null = null;
/** Lets the settings screen trigger "Đồng bộ ngay". */
export function requestSyncNow() { requestNow?.(); }

export function useSyncLoop(deps: SyncDeps, changeSignal: unknown[]) {
  const depsRef = useRef(deps);
  depsRef.current = deps;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      const applied = await runSyncRound({
        getPayload: () => depsRef.current.getPayload(),
        applyPayload: (p, m) => depsRef.current.applyPayload(p, m),
      });
      if (applied) setTimeout(run, 2000); // push the merged state after React re-renders
    };
    requestNow = run;
    const first = setTimeout(() => { startedRef.current = true; run(); }, 3000); // after local data is loaded
    const timer = setInterval(() => { if (document.visibilityState === 'visible') run(); }, SYNC_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') run(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      requestNow = null;
    };
  }, []);

  useEffect(() => {
    if (!startedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => requestNow?.(), SYNC_DEBOUNCE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, changeSignal);
}
