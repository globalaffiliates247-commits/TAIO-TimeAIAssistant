'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, ArrowRight, X, Moon, Utensils, Zap, Clock, ShieldCheck } from 'lucide-react';
import { ActionNudgeType } from '../types';

const NUDGE_ICONS: Record<ActionNudgeType, any> = {
  sleep: Moon,
  meal: Utensils,
  leave_now: Zap,
  start_deep: Clock,
  close_day: ShieldCheck,
  back_to_plan: Clock,
};

export const ActionNudgeBanner: React.FC = () => {
  const { actionNudge, acceptActionNudge, dismissActionNudge } = useApp();

  if (!actionNudge || actionNudge.isDismissed) return null;

  const Icon = NUDGE_ICONS[actionNudge.type] || Bell;

  return (
    <div className="bg-slate-50 border-b border-slate-200 text-slate-900 px-4 sm:px-6 py-2.5 shadow-xs sticky top-[57px] z-30 animate-in slide-in-from-top-2 duration-300">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Context info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 text-[#E0401F] flex items-center justify-center shrink-0 shadow-sm">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                Nhắc nhở 1 hành động
              </span>
              {actionNudge.repeatCount > 1 && (
                <span className="text-[10px] text-slate-400 font-medium">
                  (Đã nhắc {actionNudge.repeatCount} lần)
                </span>
              )}
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#E0401F] to-orange-500 hover:from-[#d03515] hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-red-500/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>{actionNudge.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={dismissActionNudge}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            title="Tạm ẩn (nhắc lại sau 10-15 phút)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
