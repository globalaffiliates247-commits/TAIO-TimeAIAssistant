// TAIO Time App — Route Error Boundary (PRD v0.3.39 Part A2.1)
'use client';

import React, { useEffect, useState } from 'react';
import { logAppError, formatErrorsForClipboard } from '../core/errorLogger';
import { AlertTriangle, Copy, RotateCw, Check } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retryCount, setRetryCount] = useState(0);
  const [recovering, setRecovering] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Flush storage on error
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('beforeunload'));
    }

    logAppError({
      tab: 'route',
      message: error.message || 'Next.js App Error',
      stack: error.stack,
    });

    if (retryCount < 3) {
      const delays = [500, 1500, 3000];
      const delay = delays[retryCount] || 1500;
      setRecovering(true);

      const timer = setTimeout(() => {
        setRecovering(false);
        setRetryCount(prev => prev + 1);
        reset();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [error, reset, retryCount]);

  const handleCopy = async () => {
    try {
      const text = formatErrorsForClipboard();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  if (recovering) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-amber-200/90 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-2.5 text-xs font-semibold text-amber-900 animate-pulse">
          <RotateCw className="w-4 h-4 animate-spin text-amber-600" />
          <span>Đang khôi phục… / Recovering…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 shadow-2xs">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Có lỗi khiến màn hình này không mở được
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Có lỗi khiến màn hình này không mở được. Hãy báo lại cho TAIO kèm chi tiết lỗi.
          </p>
          <p className="text-[11px] text-slate-400">
            Something went wrong and this screen could not open. Please report it with the error details.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép chi tiết lỗi</span>
              </>
            )}
          </button>

          <button
            onClick={handleReload}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)] text-[var(--taio-on-brand)] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm taio-btn-primary"
          >
            <RotateCw className="w-4 h-4" />
            <span>Tải lại</span>
          </button>
        </div>
      </div>
    </div>
  );
}
