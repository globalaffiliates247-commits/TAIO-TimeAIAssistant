// TAIO Time App — Folder Spine Component (PRD v0.3.33 Part H)
'use client';

import React from 'react';
import { STICKY_COLORS, StickyColor } from '@/features/sticky/model/stickyTypes';

export type WorkAreaType = 'Product' | 'Business' | 'Operations' | 'Personal';

export interface FolderSpineProps {
  area: WorkAreaType;
  label: string;
  color: StickyColor;
  count: number;
  isActive: boolean;
  orientation: 'vertical' | 'horizontal';
  onClick: () => void;
}

export const FolderSpine: React.FC<FolderSpineProps> = ({
  area: _area,
  label,
  color,
  count,
  isActive,
  orientation,
  onClick,
}) => {
  const palette = STICKY_COLORS[color];

  if (orientation === 'vertical') {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          backgroundColor: isActive ? palette.paper : palette.bar,
          color: palette.ink,
          borderRight: isActive ? `2px solid ${palette.paper}` : 'none',
        }}
        className={`w-12 sm:w-14 py-6 px-1 flex flex-col items-center justify-between rounded-l-2xl transition-all cursor-pointer select-none relative -mr-[1px] z-10 ${
          isActive
            ? 'shadow-xs font-bold ring-1 ring-black/5'
            : 'opacity-75 hover:opacity-95 hover:brightness-102'
        }`}
        title={`${label} (${count} mục tiêu)`}
      >
        {/* Count Pill */}
        <span
          style={{ backgroundColor: palette.bar, color: palette.ink }}
          className="w-6 h-6 rounded-full text-[11px] font-mono font-bold flex items-center justify-center shrink-0 border border-black/5"
        >
          {count}
        </span>

        {/* Vertical Spine Title */}
        <div
          className="text-xs font-semibold tracking-wider my-auto py-4 [writing-mode:vertical-rl] rotate-180"
          style={{ color: palette.ink }}
        >
          {label}
        </div>

        {/* Small bottom dot if active */}
        <div
          className={`w-1.5 h-1.5 rounded-full transition-opacity ${
            isActive ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundColor: palette.ink }}
        />
      </button>
    );
  }

  // Horizontal strip orientation (for iPhone swipe strip or horizontal layout)
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        backgroundColor: isActive ? palette.paper : palette.bar,
        color: palette.ink,
      }}
      className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all cursor-pointer select-none shrink-0 border ${
        isActive
          ? 'shadow-xs font-bold border-black/10 ring-1 ring-black/5'
          : 'border-transparent opacity-75 hover:opacity-100'
      }`}
    >
      <span className="text-xs">{label}</span>
      <span
        style={{ backgroundColor: palette.bar, color: palette.ink }}
        className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border border-black/5"
      >
        {count}
      </span>
    </button>
  );
};
