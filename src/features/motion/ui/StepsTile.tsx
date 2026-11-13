'use client';

import React from 'react';
import { Footprints, ArrowUpRight } from 'lucide-react';

interface StepsTileProps {
  stepsToday: number;
  movingMinutesToday: number;
  unconfirmedCount?: number;
  onClick: () => void;
}

export const StepsTile: React.FC<StepsTileProps> = ({
  stepsToday,
  movingMinutesToday,
  unconfirmedCount = 0,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="p-4 rounded-3xl bg-white border border-slate-200/90 hover:border-orange-300 transition-all shadow-xs cursor-pointer group flex items-center justify-between gap-3"
      title="Bấm để mở thẻ AI đoán sẵn"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 group-hover:scale-105 transition-transform">
          <Footprints className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Vận động hôm nay
            </span>
            {unconfirmedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#E0401F] text-white">
                +{unconfirmedCount}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
              {stepsToday.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              bước
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-semibold text-orange-600">
              {movingMinutesToday} phút di chuyển
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-orange-600 transition-colors">
        <span className="text-[11px] font-bold hidden sm:inline">AI đoán</span>
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </div>
  );
};
