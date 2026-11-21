'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { ActiveAlarmState, AlarmSettings, ALARM_RING_MAX_MINS, SNOOZE_PRESETS } from '../model/alarmTypes';
import { Z_LAYERS } from '@/styles/layers';
import { SnoozePicker } from './SnoozePicker';
import { SoundSwitch } from './SoundSwitch';
import { playSoundByIndex, stopRingSessionAudio } from '../model/ringSession';
import { useT } from '@/i18n/useT';
import { useApp } from '@/context/AppContext';
import { MotivationSticker } from '@/features/motivation';

interface AlarmScreenProps {
  alarmState: ActiveAlarmState;
  alarmSettings: AlarmSettings;
  onDismiss: () => void;
  onSnooze: (mins: number) => void;
  onUpdateSettings?: (patch: Partial<AlarmSettings>) => void;
  onOpenSettings?: () => void;
}

export const AlarmScreen: React.FC<AlarmScreenProps> = ({
  alarmState,
  alarmSettings,
  onDismiss,
  onSnooze,
  onUpdateSettings,
  onOpenSettings,
}) => {
  const { t } = useT();
  const { themeMode, palette, language } = useApp();

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = themeMode === 'dark' || (themeMode === 'system' && (typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false));
  const isCool = palette === 'cool';

  // Local state for snooze minutes & sound index
  const [snoozeMins, setSnoozeMins] = useState<number>(() => alarmSettings.snoozeDurationMins || 5);
  const [soundIndex, setSoundIndex] = useState<number>(() => alarmState.currentSoundIndex || 0);
  const [isStoppedAfter15Mins, setIsStoppedAfter15Mins] = useState<boolean>(Boolean(alarmState.isAutoStopped));

  // Auto-stop sound after 15 minutes without human interaction (spec F2.3)
  useEffect(() => {
    if (!alarmState.isActive) return;

    const ringStart = alarmState.ringStartedAt || Date.now();
    const maxDurationMs = ALARM_RING_MAX_MINS * 60 * 1000;

    const checkTimeout = () => {
      const elapsed = Date.now() - ringStart;
      if (elapsed >= maxDurationMs) {
        stopRingSessionAudio();
        setIsStoppedAfter15Mins(true);
      }
    };

    checkTimeout();
    const timer = setInterval(checkTimeout, 5000);
    return () => clearInterval(timer);
  }, [alarmState.isActive, alarmState.ringStartedAt]);

  // Keyboard navigation shortcuts (spec F2.4): Enter, Space, Arrows, M
  useEffect(() => {
    if (!alarmState.isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onDismiss();
      } else if (e.code === 'Space') {
        e.preventDefault();
        onSnooze(snoozeMins);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSnoozeMins(prev => {
          const idx = SNOOZE_PRESETS.indexOf(prev as any);
          const nextIdx = Math.max(0, (idx === -1 ? 3 : idx) - 1);
          const val = SNOOZE_PRESETS[nextIdx];
          if (onUpdateSettings) onUpdateSettings({ snoozeDurationMins: val });
          return val;
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSnoozeMins(prev => {
          const idx = SNOOZE_PRESETS.indexOf(prev as any);
          const nextIdx = Math.min(SNOOZE_PRESETS.length - 1, (idx === -1 ? 3 : idx) + 1);
          const val = SNOOZE_PRESETS[nextIdx];
          if (onUpdateSettings) onUpdateSettings({ snoozeDurationMins: val });
          return val;
        });
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleSwitchSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alarmState.isActive, snoozeMins, soundIndex, onDismiss, onSnooze]);

  if (!alarmState.isActive) return null;

  const handleSnoozeMinutesChange = (newMins: number) => {
    setSnoozeMins(newMins);
    if (onUpdateSettings) {
      onUpdateSettings({ snoozeDurationMins: newMins });
    }
  };

  const handleSwitchSound = () => {
    const nextIdx = soundIndex + 1;
    setSoundIndex(nextIdx);
    playSoundByIndex(nextIdx, alarmSettings);
  };

  return (
    <div
      className={`fixed inset-0 flex flex-col justify-between backdrop-blur-xl animate-in fade-in duration-300 ${
        isDark ? 'bg-zinc-950/95 text-white' : 'bg-slate-50/95 text-slate-900'
      }`}
      style={{
        zIndex: Z_LAYERS.ALARM_FULLSCREEN,
        paddingTop: 'calc(var(--sat, 0px) + 20px)',
        paddingBottom: 'calc(var(--sab, 0px) + 28px)',
        paddingLeft: '20px',
        paddingRight: '20px',
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border ${
          isDark 
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
            : 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-amber-400' : 'bg-amber-600'} ${isStoppedAfter15Mins ? '' : 'animate-ping'}`} />
          <span>
            {isStoppedAfter15Mins 
              ? (language === 'en' ? 'Alarm Stopped' : 'Báo thức đã ngừng') 
              : (language === 'en' ? 'Block Start Alarm' : 'Báo thức bắt đầu khối')}
          </span>
        </div>

        {/* Top Right: Sound Switch button */}
        <SoundSwitch
          currentIndex={soundIndex}
          settings={alarmSettings}
          onSwitch={handleSwitchSound}
          onOpenSettings={onOpenSettings}
          isDark={isDark}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center text-center my-auto px-4 max-w-md mx-auto">
        {/* Bell Icon: animates while ringing, stops when 15-min limit reached */}
        <div className="relative mb-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
            isDark ? 'bg-amber-500/20' : 'bg-amber-100'
          } ${isStoppedAfter15Mins ? '' : 'animate-pulse'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isDark ? 'bg-amber-500/30' : 'bg-amber-200'
            }`}>
              <Bell className={`w-9 h-9 ${isDark ? 'text-amber-400' : 'text-amber-600'} ${isStoppedAfter15Mins ? 'opacity-80' : 'animate-bounce'}`} />
            </div>
          </div>
        </div>

        {/* Task Title */}
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mb-2 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          {alarmState.blockTitle || (language === 'en' ? 'Time to start scheduled block' : 'Đến giờ bắt đầu khối thời gian')}
        </h1>

        {/* PRD FEATURE v0.3.31 B5: Motivation line under task title */}
        <MotivationSticker
          slotKey="alarm_start"
          context="start_task"
          size="line"
          className={`mb-4 max-w-sm ${
            isDark ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
          }`}
        />

        {/* Status Line: if stopped after 15 mins, report accurately (spec F2.3) */}
        {isStoppedAfter15Mins ? (
          <div className={`p-3 rounded-xl border text-xs font-medium mb-5 ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {t('alarm.stopped_after_15m', {
              time: alarmState.startTime || '',
              defaultValue: language === 'en'
                ? `Alarm stopped after 15 minutes · rang at ${alarmState.startTime || ''}`
                : `Chuông đã ngừng sau 15 phút · báo lúc ${alarmState.startTime || ''}`
            })}
          </div>
        ) : (
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm mb-4 ${
            isDark ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
          }`}>
            <Clock className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <span>
              {language === 'en' ? 'Starts at ' : 'Bắt đầu lúc '}
              {alarmState.startTime || (language === 'en' ? 'right now' : 'ngay bây giờ')}
            </span>
          </div>
        )}

        {/* Snooze repeat count indicator if > 0 (spec F2.1.5) */}
        {(alarmState.snoozeCount || 0) > 0 && (
          <p className={`text-xs font-medium mb-4 ${isDark ? 'text-amber-400/90' : 'text-amber-700'}`}>
            {t('alarm.snooze_count', {
              count: alarmState.snoozeCount,
              defaultValue: language === 'en'
                ? `Snoozed ${alarmState.snoozeCount} time(s)`
                : `Đã báo lại ${alarmState.snoozeCount} lần`
            })}
          </p>
        )}

        {/* Fallback warning if custom sound file was missing */}
        {alarmState.isFallbackDefault && alarmState.fallbackReason && (
          <div className="w-full text-left p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs leading-relaxed mb-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-rose-100">{alarmState.fallbackReason}</p>
                {onOpenSettings && (
                  <button
                    onClick={() => {
                      onDismiss();
                      onOpenSettings();
                    }}
                    className="mt-2 text-rose-300 underline font-semibold hover:text-rose-100"
                  >
                    {language === 'en' ? 'Reselect audio file now' : 'Chọn lại file âm thanh ngay'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
        {/* Primary Action Button: "Vào việc ngay" (spec F2.5) */}
        <button
          onClick={onDismiss}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
            isCool
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25'
              : isDark
                ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/25'
                : 'bg-[#E11D2E] bg-[var(--taio-brand)] hover:bg-[#C4182A] hover:bg-[var(--taio-brand-hover)] text-white shadow-red-500/25'
          }`}
        >
          <BellOff className="w-5 h-5" />
          <span>{t('alarm.dismiss', 'Vào việc ngay')}</span>
        </button>

        {/* Snooze Picker with minus, center action, plus (spec F2.1) */}
        <SnoozePicker
          currentMinutes={snoozeMins}
          onMinutesChange={handleSnoozeMinutesChange}
          onSnooze={onSnooze}
          isDark={isDark}
        />
      </div>
    </div>
  );
};
