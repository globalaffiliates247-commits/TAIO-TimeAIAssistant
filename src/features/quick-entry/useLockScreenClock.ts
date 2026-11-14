'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  startNativeLiveActivity, 
  updateNativeLiveActivity, 
  stopNativeLiveActivity,
  syncNativeWidgetSchedule,
  WidgetScheduleItemData
} from '@/features/native';
import { clockState } from '@/features/clock';
import { 
  loadMotivationSettings, 
  loadUserMotivationState, 
  loadServerQuotesCache, 
  getAllQuotes, 
  pickQuote 
} from '@/features/motivation';
import type { TimeBlock } from '@/types';

function buildWidgetSchedule(blocks: TimeBlock[], template: any[], now = new Date(), lang: 'vi' | 'en' = 'vi'): WidgetScheduleItemData[] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  const parseToSeconds = (hhmm: string): number => {
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    const d = new Date(year, month, date, h || 0, m || 0, 0);
    return Math.floor(d.getTime() / 1000);
  };

  const validBlocks = (blocks || [])
    .filter(b => b.startTime && b.endTime)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const items: WidgetScheduleItemData[] = [];

  for (let i = 0; i < validBlocks.length; i++) {
    const b = validBlocks[i];
    const bStart = parseToSeconds(b.startTime);
    const bEnd = parseToSeconds(b.endTime);

    // If gap before this block and after previous block
    if (i > 0) {
      const prevEnd = parseToSeconds(validBlocks[i - 1].endTime);
      if (bStart > prevEnd) {
        items.push({
          title: lang === 'en' ? 'Free' : 'Trống',
          subtitle: lang === 'en' ? `Until "${b.title}"` : `Tới "${b.title}"`,
          startTimestamp: prevEnd,
          targetTimestamp: bStart,
          mode: 'gap',
          isCountDown: true,
        });
      }
    }

    items.push({
      title: b.title,
      subtitle: b.goalName || (lang === 'en' ? 'Main goal' : 'Mục tiêu chính'),
      startTimestamp: bStart,
      targetTimestamp: bEnd,
      mode: 'task',
      isCountDown: b.taskEndType === 'timebox' || !b.taskEndType,
    });
  }

  if (items.length === 0) {
    const nowSec = Math.floor(now.getTime() / 1000);
    // PRD FEATURE v0.3.31 B8: Motivation quote on widget when idle
    let idleSubtitle = lang === 'en' ? 'Time of day' : 'Thời gian trong ngày';
    try {
      const motSettings = loadMotivationSettings();
      if (motSettings.enabled && motSettings.slots.widget) {
        const userState = loadUserMotivationState();
        const serverQuotes = loadServerQuotesCache();
        const allQuotes = getAllQuotes(serverQuotes, userState.customQuotes);
        const q = pickQuote({ quotes: allQuotes, context: 'break', lang: lang as 'vi' | 'en', favorites: userState.favorites });
        if (q) idleSubtitle = q.text;
      }
    } catch {}

    items.push({
      title: 'TAIO Time',
      subtitle: idleSubtitle,
      startTimestamp: nowSec,
      targetTimestamp: nowSec + 86400,
      mode: 'template_or_current',
      isCountDown: false,
    });
  }

  return items;
}

export function useLockScreenClock() {
  const { scheduleBlocks, dayTemplate, goals, isNativePlatform, freeTimers, language } = useApp();
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
      const state = clockState(scheduleBlocks, dayTemplate, now, language);

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

      // PRD FIX v0.3.30 Part E1 (Widget): Sync schedule timeline for Home & Lock Screen Widgets
      try {
        const widgetItems = buildWidgetSchedule(scheduleBlocks, dayTemplate, now, language);
        syncNativeWidgetSchedule(widgetItems);
      } catch (err) {
        console.warn('[useLockScreenClock] Failed to sync widget schedule', err);
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
