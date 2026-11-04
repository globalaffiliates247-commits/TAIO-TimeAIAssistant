'use client';

import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, ArrowRight, X, Moon, Utensils, Zap, Clock, ShieldCheck } from 'lucide-react';
import { ActionNudgeType } from '../types';

const NUDGE_ICONS: Record<ActionNudgeType, any> = {
  sleep: Moon,
  sleep_next_day: Moon,
  meal: Utensils,
  leave_now: Zap,
  start_deep: Clock,
  close_day: ShieldCheck,
  back_to_plan: Clock,
};

export const ActionNudgeBanner: React.FC = () => {
  const { actionNudge, acceptActionNudge, dismissActionNudge, palette } = useApp();
  const isCool = palette === 'cool';

  // B14 v0.3.11: Banner auto-hides after 15 seconds if the user does nothing (counts as ignored)
  useEffect(() => {
    if (!actionNudge || actionNudge.isDismissed) return;
    const timer = setTimeout(() => {
      dismissActionNudge();
    }, 15000);
    return () => clearTimeout(timer);
  }, [actionNudge, dismissActionNudge]);

  if (!actionNudge || actionNudge.isDismissed) return null;

  const Icon = NUDGE_ICONS[actionNudge.type] || Bell;

  return (
    <div className="bg-slate-50 border-b border-slate-200 text-slate-900 px-4 sm:px-6 py-2.5 shadow-xs animate-in slide-in-from-top-2 duration-300">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Context info */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
            isCool ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-red-50 border-red-200 text-[#E0401F]'
          }`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isCool ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                Nhắc nhở 1 hành động
              </span>
              {actionNudge.repeatCount > 1 && (
                <span className="text-[10px] text-slate-500 font-medium">
                  (Đã nhắc {actionNudge.repeatCount} lần)
                </span>
              )}
              <span className="text-[10px] text-slate-400">Tự ẩn sau 15 giây</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-800 mt-0.5">
              {actionNudge.context}
            </p>
          </div>
        </div>

        {/* Single Call To Action Button + Dismiss */}
        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
          <button
            onClick={acceptActionNudge}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm active:scale-[0.98] transition-all cursor-pointer ${
              isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#d03515]'
            }`}
          >
            <span>{actionNudge.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={dismissActionNudge}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            title="Tạm ẩn (nhắc lại sau 15 phút)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
