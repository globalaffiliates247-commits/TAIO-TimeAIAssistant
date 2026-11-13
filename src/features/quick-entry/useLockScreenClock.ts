'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  startNativeLiveActivity, 
  updateNativeLiveActivity, 
  stopNativeLiveActivity 
} from '@/features/native';
import { clockState } from '@/features/clock';

export function useLockScreenClock() {
  const { scheduleBlocks, dayTemplate, goals, isNativePlatform, freeTimers } = useApp();
  const lastRunningBlockIdRef = useRef<string | null>(null);
  const lastPayloadRef = useRef<string>('');

  useEffect(() => {
    if (!isNativePlatform) return;

    const syncLiveActivity = () => {
      // Check user preference (defaults to true)
      let isEnabled = true;
      try {
        const saved = window.localStorage.getItem('taio_lockscreen_clock_enabled');
        if (saved !== null) isEnabled = saved === 'true';
      } catch {}

      if (!isEnabled) {
        if (lastRunningBlockIdRef.current) {
          stopNativeLiveActivity();
          lastRunningBlockIdRef.current = null;
          lastPayloadRef.current = '';
        }
        return;
      }

      // Universal 3-state clock calculation (spec E1.1 & E1.4)
      const now = new Date();
      const state = clockState(scheduleBlocks, dayTemplate, now);

      const blockId = state.block?.id || `anchor-${state.mode}`;
      const taskTitle = state.title;
      // PRD FIX v0.3.30 Part E2.4: Secondary free timer line on lock screen banner
      const activeFreeTimers = (freeTimers || []).filter(t => t.status === 'running');
      const goalName = activeFreeTimers.length > 0
        ? `${state.subtitle} • ⏱️ ${activeFreeTimers[0].title}`
        : state.subtitle;
      const startTimestamp = Math.floor(state.startedAt / 1000);
      const targetTimestamp = Math.floor(state.endsAt / 1000);
      const totalMinutes = Math.max(5, Math.round((state.endsAt - state.startedAt) / 60000));
      const remainingMinutes = Math.max(1, Math.round(state.remainingSeconds / 60));
      const isCountDown = state.isCountDown;

      const payloadKey = `${blockId}|${taskTitle}|${goalName}|${targetTimestamp}|${state.mode}`;

      if (lastRunningBlockIdRef.current !== blockId) {
        startNativeLiveActivity({
          blockId,
          taskTitle,
          goalName,
          isCountDown,
          totalMinutes,
          remainingMinutes,
          startTimestamp,
          targetTimestamp,
        }).then(res => {
          if (res.ok) {
            lastRunningBlockIdRef.current = blockId;
            lastPayloadRef.current = payloadKey;
          }
        });
      } else if (lastPayloadRef.current !== payloadKey) {
        updateNativeLiveActivity({
          taskTitle,
          goalName,
          isCountDown,
          totalMinutes,
          remainingMinutes,
          isPaused: false,
          startTimestamp,
          targetTimestamp,
        }).then(res => {
          if (res.ok) {
            lastPayloadRef.current = payloadKey;
          }
        });
      }
    };

    // Run initial sync
    syncLiveActivity();

    // Re-check periodically and on visibility changes / focus
    const interval = setInterval(syncLiveActivity, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncLiveActivity();
      }
    };

    const handleFocus = () => {
      syncLiveActivity();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [scheduleBlocks, dayTemplate, goals, isNativePlatform]);
}
