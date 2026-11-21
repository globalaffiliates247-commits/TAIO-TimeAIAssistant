// TAIO Time App — Dedicated Live Activities for Free Timers (PRD v0.3.50 Part C)
'use client';

import { useEffect, useRef } from 'react';
import { FreeTimer } from '../clock/model/freeTimers.ts';
import {
  startNativeLiveActivity,
  updateNativeLiveActivity,
  stopNativeLiveActivity,
} from '../native/index.ts';

const MAX_FREE_TIMER_ACTIVITIES = 3;

export function useFreeTimerLiveActivities(
  freeTimers: FreeTimer[],
  language: string,
  onLimitExceeded?: (msg: string) => void
) {
  // Track currently active live activities by free timer ID
  const activeTimerIdsRef = useRef<Set<string>>(new Set());
  const lastStateMapRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const runningTimers = (freeTimers || []).filter(t => t.status === 'running');

    // C3: Limit to max 3 concurrent free timer activities
    if (runningTimers.length > MAX_FREE_TIMER_ACTIVITIES && onLimitExceeded) {
      const msg = language === 'en'
        ? 'Maximum 3 free timers displayed on Lock Screen simultaneously'
        : 'Chỉ hỗ trợ tối đa 3 đồng hồ riêng trên màn hình khoá cùng lúc';
      onLimitExceeded(msg);
    }

    const eligibleTimers = runningTimers.slice(0, MAX_FREE_TIMER_ACTIVITIES);
    const eligibleIdSet = new Set(eligibleTimers.map(t => t.id));

    // 1. Stop activities for timers that are no longer running or deleted
    for (const prevId of activeTimerIdsRef.current) {
      if (!eligibleIdSet.has(prevId)) {
        stopNativeLiveActivity({ blockId: `timer:${prevId}` });
        activeTimerIdsRef.current.delete(prevId);
        lastStateMapRef.current.delete(prevId);
      }
    }

    // 2. Start or update eligible timers
    const now = Date.now();
    for (const ft of eligibleTimers) {
      const blockId = `timer:${ft.id}`;
      const taskTitle = ft.title || (language === 'en' ? 'Timer' : 'Đồng hồ riêng');
      const goalName = language === 'en' ? 'Free Timer' : 'Đồng hồ riêng';

      const isCountDown = ft.mode !== 'stopwatch';
      const startTimestamp = Math.floor(ft.startedAt / 1000);
      const targetTimestamp = ft.endsAt ? Math.floor(ft.endsAt / 1000) : startTimestamp + 3600;
      const totalMinutes = ft.totalDurationSeconds
        ? Math.max(1, Math.round(ft.totalDurationSeconds / 60))
        : 60;
      const remainingSeconds = ft.endsAt ? Math.max(0, Math.floor((ft.endsAt - now) / 1000)) : 0;
      const remainingMinutes = Math.max(1, Math.round(remainingSeconds / 60));

      const payloadKey = `${taskTitle}|${targetTimestamp}|${ft.status}`;

      if (!activeTimerIdsRef.current.has(ft.id)) {
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
            activeTimerIdsRef.current.add(ft.id);
            lastStateMapRef.current.set(ft.id, payloadKey);
          }
        });
      } else if (lastStateMapRef.current.get(ft.id) !== payloadKey) {
        updateNativeLiveActivity({
          blockId,
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
            lastStateMapRef.current.set(ft.id, payloadKey);
          }
        });
      }
    }
  }, [freeTimers, language, onLimitExceeded]);

  // Clean up all when unmounting
  useEffect(() => {
    return () => {
      for (const id of activeTimerIdsRef.current) {
        stopNativeLiveActivity({ blockId: `timer:${id}` });
      }
      activeTimerIdsRef.current.clear();
      lastStateMapRef.current.clear();
    };
  }, []);
}
