'use client';

import React from 'react';

export interface NowClockRingProps {
  isCountDown: boolean;
  percent: number; // 0 to 100
  timeText: string;
  subText: string;
  isOverrun?: boolean;
  size?: number;
  isCool?: boolean;
  onClick?: () => void;
}

export const NowClockRing: React.FC<NowClockRingProps> = ({
  isCountDown,
  percent,
  timeText,
  subText,
  isOverrun = false,
  size = 140,
  isCool = false,
  onClick,
}) => {
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  const colorPrimary = isCool ? '#007aff' : '#E0401F';
  const colorTrack = isCool ? '#e0f2fe' : '#fee2e2';

  return (
    <div 
      className="relative flex items-center justify-center shrink-0 cursor-pointer select-none"
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorTrack}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorPrimary}
          strokeWidth={strokeWidth}
          strokeDasharray={isOverrun ? '6, 4' : `${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
          {timeText}
        </span>
        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 max-w-[110px] truncate mt-0.5">
          {subText}
        </span>
      </div>
    </div>
  );
};
