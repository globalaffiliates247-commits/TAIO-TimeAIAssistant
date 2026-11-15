// TAIO Time App — Recent Error & Lag Log Section in Profile Data Settings (PRD v0.3.39 Part A2.2 & A2.4)
'use client';

import React, { useState } from 'react';
import { Copy, Check, Bug, Activity } from 'lucide-react';
import {
  getRecentErrors,
  getRecentLongTasks,
  formatErrorsForClipboard,
  formatLongTasksForClipboard,
} from '@/core/errorLogger';

interface Props {
  language: string;
}

export const RecentErrorLogSection: React.FC<Props> = ({ language }) => {
  const isEn = language === 'en';
  const [copiedErrors, setCopiedErrors] = useState(false);
  const [copiedTasks, setCopiedTasks] = useState(false);

  const errors = getRecentErrors();
  const longTasks = getRecentLongTasks();

  const handleCopyErrors = async () => {
    try {
      const text = formatErrorsForClipboard();
      await navigator.clipboard.writeText(text);
      setCopiedErrors(true);
      setTimeout(() => setCopiedErrors(false), 2500);
    } catch {
      alert('Không thể sao chép vào bộ nhớ tạm.');
    }
  };

  const handleCopyLag = async () => {
    try {
      const text = formatLongTasksForClipboard();
      await navigator.clipboard.writeText(text);
      setCopiedTasks(true);
      setTimeout(() => setCopiedTasks(false), 2500);
    } catch {
      alert('Không thể sao chép vào bộ nhớ tạm.');
    }
  };

  return (
    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-800">
            {isEn ? 'Recent Error Details' : 'Chi tiết lỗi gần đây'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">
            {errors.length} {isEn ? 'errors' : 'lỗi'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">
            {longTasks.length} {isEn ? 'lags' : 'đoạn lag'}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        {isEn
          ? 'Stores the last 20 runtime errors and long tasks (>200ms) on this device for debugging and technical support.'
          : 'Lưu trữ 20 lỗi và đoạn lag (>200ms) gần nhất trên thiết bị này để phục vụ hỗ trợ kỹ thuật và chuẩn đoán sự cố.'}
      </p>

      <div className="flex items-center gap-2 flex-wrap pt-1">
        <button
          type="button"
          onClick={handleCopyErrors}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          {copiedErrors ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isEn ? 'Copied errors!' : 'Đã sao chép chi tiết lỗi!'}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>{isEn ? 'Copy error details' : 'Sao chép chi tiết lỗi'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCopyLag}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          {copiedTasks ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isEn ? 'Copied lag log!' : 'Đã sao chép sổ lag!'}</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span>{isEn ? 'Copy lag details (>200ms)' : 'Sao chép sổ lag (>200ms)'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
