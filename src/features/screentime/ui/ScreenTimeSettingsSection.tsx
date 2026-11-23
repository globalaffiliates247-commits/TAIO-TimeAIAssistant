// TAIO Time App — Screen Time Settings Section (PRD v0.3.53 Part B6)
'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Check, Sliders, Smartphone } from 'lucide-react';
import { 
  isScreenTimeEnabled, 
  setScreenTimeEnabled, 
  getScreenTimeStatus, 
  requestScreenTimeAuthorization,
  getScreenTimeThresholds,
  saveScreenTimeThresholds,
  type ScreenTimeStatus,
  type ScreenTimeThreshold
} from '../index';

interface Props {
  language?: string;
}

export const ScreenTimeSettingsSection: React.FC<Props> = ({ language = 'vi' }) => {
  const isVi = language === 'vi';
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<ScreenTimeStatus>('unavailable');
  const [thresholds, setThresholds] = useState<ScreenTimeThreshold[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEnabled(isScreenTimeEnabled());
    setThresholds(getScreenTimeThresholds());
    getScreenTimeStatus().then(setStatus);
  }, []);

  const handleToggle = async () => {
    if (enabled) {
      setEnabled(false);
      setScreenTimeEnabled(false);
      return;
    }

    setLoading(true);
    const newStatus = await requestScreenTimeAuthorization();
    setStatus(newStatus);
    setLoading(false);

    if (newStatus === 'ok') {
      setEnabled(true);
      setScreenTimeEnabled(true);
    } else {
      setEnabled(false);
      setScreenTimeEnabled(false);
    }
  };

  const handleThresholdChange = (id: string, mins: number) => {
    const updated = thresholds.map(t => t.id === id ? { ...t, limitMinutes: mins } : t);
    setThresholds(updated);
    saveScreenTimeThresholds(updated);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-4 shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              {isVi ? 'Cảnh báo ngưỡng dùng app (Screen Time)' : 'App Usage Threshold Warning (Screen Time)'}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              {isVi 
                ? 'Nhận tín hiệu khi vượt ngưỡng thời gian dùng ứng dụng trên iPhone (chỉ ngưỡng, không đọc số liệu chi tiết).'
                : 'Get alerts when exceeding app usage thresholds on iPhone (threshold alert only, no detailed telemetry).'}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
            enabled ? 'bg-[var(--taio-brand)]' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Explanation Banner (Part B6) */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-800 dark:text-amber-300 space-y-1 leading-relaxed">
        <div className="font-bold flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{isVi ? 'Lưu ý về quyền riêng tư Apple Screen Time' : 'Apple Screen Time Privacy Note'}</span>
        </div>
        <p>
          {isVi
            ? '1. Tính năng này chỉ nhận biết khi bạn dùng quá ngưỡng đã chọn, tuyệt đối không lấy hay lưu số giờ dùng chi tiết.'
            : '1. This feature only detects when thresholds are exceeded; it never extracts or stores detailed usage metrics.'}
        </p>
        <p>
          {isVi
            ? '2. Theo chính sách Apple, mỗi lúc chỉ có 1 ứng dụng được kết nối Family Controls.'
            : '2. Under Apple policy, only one service can be granted Family Controls access at a time.'}
        </p>
      </div>

      {/* Threshold sliders when enabled */}
      {enabled && (
        <div className="space-y-3 pt-1 border-t border-slate-200/60 dark:border-slate-700/50">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            {isVi ? 'Cài đặt ngưỡng cảnh báo hàng ngày' : 'Daily Alert Thresholds'}
          </label>
          <div className="space-y-2.5">
            {thresholds.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{t.appGroup}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="range"
                    min="15"
                    max="180"
                    step="15"
                    value={t.limitMinutes}
                    onChange={e => handleThresholdChange(t.id, parseInt(e.target.value, 10))}
                    className="w-24 accent-[var(--taio-brand)]"
                  />
                  <span className="font-bold text-slate-900 dark:text-slate-100 min-w-[48px] text-right">
                    {t.limitMinutes} {isVi ? 'phút' : 'min'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
