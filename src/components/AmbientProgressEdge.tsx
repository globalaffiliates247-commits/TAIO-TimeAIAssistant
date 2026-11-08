'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

export const AmbientProgressEdge: React.FC = () => {
  const { currentBlock, timerMinutesRemaining, currentPaletteColors } = useApp();

  if (!currentBlock) return null;

  // Determine block total duration (default 90 or calculate from startTime & endTime)
  let totalDuration = 90;
  try {
    const [startH, startM] = currentBlock.startTime.split(':').map(Number);
    const [endH, endM] = currentBlock.endTime.split(':').map(Number);
    const diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff > 0) totalDuration = diff;
  } catch (e) {
    totalDuration = 90;
  }

  const elapsed = Math.max(0, totalDuration - timerMinutesRemaining);
  const progressPercent = Math.min(100, Math.max(5, Math.round((elapsed / totalDuration) * 100)));

  // Color mapping based on block type
  let edgeColor = currentPaletteColors.deepWork;
  if (currentBlock.type === 'meeting') edgeColor = currentPaletteColors.meeting;
  if (currentBlock.type === 'interruption') edgeColor = currentPaletteColors.interruption;
  if (currentBlock.type === 'personal') edgeColor = currentPaletteColors.personal;
  if (currentBlock.type === 'planning') edgeColor = currentPaletteColors.planning;

  return (
    <div 
      style={{ top: 'var(--sat, 0px)' }}
      className="fixed left-0 right-0 h-1 z-50 bg-black/40 overflow-hidden pointer-events-none"
      title={`Tiến độ ngoại vi: Đã trôi qua ${elapsed}/${totalDuration} phút (${progressPercent}%)`}
    >
      <div 
        className="h-full transition-all duration-1000 ease-out shadow-sm"
        style={{ 
          width: `${progressPercent}%`,
          backgroundColor: edgeColor,
          boxShadow: `0 0 8px ${edgeColor}`
        }}
      />
    </div>
  );
};
