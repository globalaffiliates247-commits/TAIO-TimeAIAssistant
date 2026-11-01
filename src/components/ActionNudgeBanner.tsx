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
    <div className="bg-gradient-to-r from-indigo-900/90 via-purple-950/90 to-indigo-900/90 border-b border-indigo-500/40 text-white px-4 py-2.5 shadow-lg backdrop-blur-md sticky top-[57px] z-30 animate-in slide-in-from-top-2 duration-300">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        
        {/* Context info */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200">
                Gợi ý 1 hành động (B14)
              </span>
              {actionNudge.repeatCount > 1 && (
                <span className="text-[10px] text-gray-400">
                  (Đã nhắc {actionNudge.repeatCount} lần)
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-100 mt-0.5">
              {actionNudge.context}
            </p>
          </div>
        </div>

        {/* Single Call To Action Button + Dismiss */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={acceptActionNudge}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <span>{actionNudge.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={dismissActionNudge}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Tạm ẩn (nhắc lại sau 10-15 phút)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
