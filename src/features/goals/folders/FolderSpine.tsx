// TAIO Time App — Folder Spine Component (PRD v0.3.33 Part H & v0.3.54 Part P)
'use client';

import React, { useState } from 'react';
import { STICKY_COLORS, StickyColor } from '@/features/sticky/model/stickyTypes';

export type WorkAreaType = 'Product' | 'Business' | 'Operations' | 'Personal' | 'uncategorized';

export interface FolderSpineProps {
  area: WorkAreaType;
  label: string;
  color: StickyColor;
  count: number;
  isActive: boolean;
  orientation: 'vertical' | 'horizontal';
  onClick: () => void;
  onDropGoal?: (goalId: string, targetArea: WorkAreaType) => void;
}

export const FolderSpine: React.FC<FolderSpineProps> = ({
  area,
  label,
  color,
  count,
  isActive,
  orientation,
  onClick,
  onDropGoal,
}) => {
  const palette = STICKY_COLORS[color] || STICKY_COLORS.blue;
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const goalId = e.dataTransfer.getData('application/x-taio-goal') || e.dataTransfer.getData('text/plain');
    if (goalId && onDropGoal) {
      onDropGoal(goalId, area);
    }
  };

  if (orientation === 'vertical') {
    return (
      <button
        type="button"
        onClick={onClick}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          backgroundColor: isDragOver ? palette.paper : isActive ? palette.paper : palette.bar,
          color: palette.ink,
          borderRight: isActive ? `2px solid ${palette.paper}` : 'none',
        }}
        className={`w-12 sm:w-14 py-6 px-1 flex flex-col items-center justify-between rounded-l-2xl transition-all cursor-pointer select-none relative -mr-[1px] z-10 ${
          isDragOver
            ? 'ring-2 ring-blue-500 scale-105 z-20 shadow-md font-bold'
            : isActive
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
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        backgroundColor: isDragOver ? palette.paper : isActive ? palette.paper : palette.bar,
        color: palette.ink,
      }}
      className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all cursor-pointer select-none shrink-0 border ${
        isDragOver
          ? 'ring-2 ring-blue-500 scale-105 border-blue-500 shadow-md font-bold'
          : isActive
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
