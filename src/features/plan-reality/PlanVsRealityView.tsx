// TAIO Time App — Plan vs Reality Screen (PRD v0.3.53 Part C)
'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getDeviceCalendarDate, timeToMinutes } from '@/core/clock';
import { getAppUsageForDate, getUnaccountedSeconds, getTopAppsUsage, getAppUsageSettings } from '@/features/app-usage';
import { isScreenTimeEnabled, getActiveScreenTimeAlerts } from '@/features/screentime';
import { formatDuration } from '@/i18n/format';
import { 
  BarChart3, 
  Clock, 
  HelpCircle, 
  AlertTriangle, 
  Laptop, 
  CheckCircle2, 
  Layers, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface Props {
  date?: string;
}

export const PlanVsRealityView: React.FC<Props> = ({ date }) => {
  const { language, scheduleBlocks, dailyCardItems } = useApp();
  const isVi = language === 'vi';
  const today = date || getDeviceCalendarDate();

  const [unaccountedSeconds, setUnaccountedSeconds] = useState(0);
  const [topApps, setTopApps] = useState<Array<{ appName: string; bundleId: string; totalSeconds: number }>>([]);
  const [isUsageEnabled, setIsUsageEnabled] = useState(false);
  const [screenTimeAlerts, setScreenTimeAlerts] = useState<any[]>([]);

  useEffect(() => {
    const settings = getAppUsageSettings();
    setIsUsageEnabled(settings.enabled);
    if (settings.enabled) {
      setUnaccountedSeconds(getUnaccountedSeconds(today));
      setTopApps(getTopAppsUsage(today, 5));
    }
    if (isScreenTimeEnabled()) {
      setScreenTimeAlerts(getActiveScreenTimeAlerts());
    }
  }, [today]);

  // 1. Planned time (calculated from scheduled blocks)
  const todayBlocks = scheduleBlocks.filter(b => b.startTime && b.endTime);
  const plannedMinutes = todayBlocks.reduce((acc, b) => {
    const [sh, sm] = b.startTime.split(':').map(Number);
    const [eh, em] = b.endTime.split(':').map(Number);
    return acc + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  }, 0);

  // 2. Self-reported actual time (completed tasks)
  const doneItems = dailyCardItems.filter(i => i.date === today && i.status === 'done');
  const reportedMinutes = doneItems.reduce((acc, item) => {
    if (item.start && item.end) {
      const mins = Math.max(0, timeToMinutes(item.end) - timeToMinutes(item.start));
      return acc + (mins || 30);
    }
    return acc + 30;
  }, 0);

  const unaccountedMinutes = Math.round(unaccountedSeconds / 60);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[var(--taio-brand-soft)] text-[var(--taio-brand)] flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">
              {isVi ? 'Kế hoạch so với Thực tế' : 'Plan vs Reality'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isVi ? `Phân tích ngày ${today} dựa trên tự khai và đo lường máy` : `Analysis for ${today} based on self-reports & telemetry`}
            </p>
          </div>
        </div>
      </div>

      {/* Metric Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Planned */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <span>{isVi ? 'Kế hoạch đặt ra' : 'Planned Time'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              {isVi ? 'Tự khai' : 'Self-reported'}
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatDuration(plannedMinutes, language)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isVi ? `${todayBlocks.length} khối việc đã xếp lịch` : `${todayBlocks.length} scheduled blocks`}
          </p>
        </div>

        {/* Self-reported Completed */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <span>{isVi ? 'Đã hoàn tất' : 'Completed Actual'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              {isVi ? 'Tự khai' : 'Self-reported'}
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatDuration(reportedMinutes, language)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isVi ? `${doneItems.length} việc đã đánh dấu xong` : `${doneItems.length} tasks marked done`}
          </p>
        </div>

        {/* Unaccounted Time ("thời gian không ai biết") */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <span>{isVi ? 'Chưa rõ mục đích' : 'Unaccounted'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              {isUsageEnabled ? (isVi ? 'Máy đo' : 'Measured') : (isVi ? 'Chưa bật' : 'Off')}
            </span>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {isUsageEnabled ? formatDuration(unaccountedMinutes, language) : '—'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isVi ? 'Rời TAIO khi đồng hồ đã tắt' : 'Away with timer stopped'}
          </p>
        </div>
      </div>

      {/* Top 5 Apps Measured on Mac */}
      {isUsageEnabled && topApps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-slate-500" />
              <span>{isVi ? 'Top ứng dụng chiếm thời gian trên Mac' : 'Top Apps by Active Time (Mac)'}</span>
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              {isVi ? 'Số liệu máy đo tự động' : 'Machine telemetry'}
            </span>
          </div>

          <div className="space-y-2">
            {topApps.map((app, idx) => {
              const mins = Math.round(app.totalSeconds / 60);
              return (
                <div 
                  key={app.bundleId || app.appName || idx}
                  className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {app.appName || app.bundleId || 'Unknown'}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0">
                    {formatDuration(mins, language)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Screen Time Threshold Alerts on iPhone */}
      {screenTimeAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>{isVi ? 'Cảnh báo vượt ngưỡng thời gian dùng màn hình' : 'Screen Time Threshold Alert'}</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold">
              {isVi ? 'Tín hiệu ngưỡng' : 'Threshold alert'}
            </span>
          </div>
          {screenTimeAlerts.map(alert => (
            <p key={alert.id} className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {alert.message || (isVi ? `Đã vượt ngưỡng ${alert.limitMinutes} phút cho nhóm ${alert.appGroup}.` : `Exceeded ${alert.limitMinutes}m for ${alert.appGroup}.`)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
