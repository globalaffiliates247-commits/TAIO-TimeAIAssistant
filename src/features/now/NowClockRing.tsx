'use client';

import React from 'react';
import { useHighlight } from '@/features/prefs';
import { computeRingArc, ClockRingMode } from '@/domain/clockRing';

export interface NowClockRingProps {
  isCountDown?: boolean;
  percent?: number; // legacy fallback (0 to 100)
  mode?: ClockRingMode;
  elapsedFraction?: number; // 0 to 1
  timeText: string;
  subText: string;
  isOverrun?: boolean;
  size?: number;
  isCool?: boolean; // deprecated legacy prop
  onClick?: () => void;
}

export const NowClockRing: React.FC<NowClockRingProps> = ({
  isCountDown,
  percent = 0,
  mode,
  elapsedFraction,
  timeText,
  subText,
  isOverrun = false,
  size = 140,
  onClick,
}) => {
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // PRD v0.3.47 Part C: Stationary boundary point & identical geometry
  const effectiveMode: ClockRingMode = mode || (isCountDown ? 'remaining' : 'elapsed');
  const e = typeof elapsedFraction === 'number' ? elapsedFraction : Math.min(1, Math.max(0, percent / 100));

  const arc = computeRingArc(effectiveMode, e, circumference, isOverrun);

  const { highlightStyle } = useHighlight();

  return (
    <div 
      className="relative flex items-center justify-center shrink-0 cursor-pointer select-none"
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track circle (soft brand tint) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--taio-brand-soft)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--taio-brand)"
          strokeWidth={strokeWidth}
          strokeDasharray={isOverrun ? '6, 4' : `${arc.dashLength} ${circumference}`}
          strokeDashoffset={arc.dashOffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        <span
          className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums"
          style={highlightStyle}
        >
          {timeText}
        </span>
        <span
          className="text-[10px] sm:text-[11px] font-semibold text-slate-500 max-w-[110px] truncate mt-0.5"
          style={highlightStyle}
        >
          {subText}
        </span>
      </div>
    </div>
  );
};
