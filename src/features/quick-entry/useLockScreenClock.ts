'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  startNativeLiveActivity, 
  updateNativeLiveActivity, 
  stopNativeLiveActivity 
} from '@/features/native';
import { timeToMinutes, computeBlockStatus } from '@/core/clock';
import type { TimeBlock } from '@/types';

function parseBlockTimestamps(block: TimeBlock): { startTimestamp: number; targetTimestamp: number; totalMinutes: number; remainingMinutes: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const nowSec = Math.floor(now.getTime() / 1000);

  const [startH, startM] = (block.startTime || '00:00').split(':').map(Number);
  const [endH, endM] = (block.endTime || '23:59').split(':').map(Number);

  const startDate = new Date(year, month, date, startH || 0, startM || 0, 0);
  const endDate = new Date(year, month, date, endH || 0, endM || 0, 0);

  // If end is earlier than start (overnight block), add 1 day
  if (endDate.getTime() <= startDate.getTime()) {
    endDate.setDate(endDate.getDate() + 1);
  }

  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const targetTimestamp = Math.floor(endDate.getTime() / 1000);

  const totalMinutes = Math.max(5, Math.round((targetTimestamp - startTimestamp) / 60));
  const remainingMinutes = Math.max(1, Math.round((targetTimestamp - nowSec) / 60));

  return { startTimestamp, targetTimestamp, totalMinutes, remainingMinutes };
}

export function useLockScreenClock() {
  const { scheduleBlocks, goals, isNativePlatform } = useApp();
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

      // Determine current in-progress task from scheduleBlocks
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();

      const inProgressBlock = scheduleBlocks.find(b => {
        if (b.status === 'in_progress') return true;
        if (b.status === 'done' || b.status === 'dropped') return false;
        return computeBlockStatus(b, nowMins) === 'in_progress';
      });

      if (!inProgressBlock) {
        if (lastRunningBlockIdRef.current) {
          stopNativeLiveActivity();
          lastRunningBlockIdRef.current = null;
          lastPayloadRef.current = '';
        }
        return;
      }

      const { startTimestamp, targetTimestamp, totalMinutes, remainingMinutes } = parseBlockTimestamps(inProgressBlock);
      const linkedGoal = goals.find(g => g.id === inProgressBlock.goalId);
      const goalName = linkedGoal?.name || inProgressBlock.goalName || 'Mục tiêu chính';
      const isCountDown = inProgressBlock.taskEndType === 'timebox' || !inProgressBlock.taskEndType;

      const payloadKey = `${inProgressBlock.id}|${inProgressBlock.title}|${inProgressBlock.startTime}|${inProgressBlock.endTime}|${goalName}|${targetTimestamp}`;

      if (lastRunningBlockIdRef.current !== inProgressBlock.id) {
        // New block started
        startNativeLiveActivity({
          blockId: inProgressBlock.id,
          taskTitle: inProgressBlock.title,
          goalName,
          isCountDown,
          totalMinutes,
          remainingMinutes,
          startTimestamp,
          targetTimestamp,
        }).then(res => {
          if (res.ok) {
            lastRunningBlockIdRef.current = inProgressBlock.id;
            lastPayloadRef.current = payloadKey;
          }
        });
      } else if (lastPayloadRef.current !== payloadKey) {
        // Same block updated (title, times, etc.)
        updateNativeLiveActivity({
          taskTitle: inProgressBlock.title,
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
  }, [scheduleBlocks, goals, isNativePlatform]);
}
