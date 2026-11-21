// TAIO Time App — Standalone Frameless Day Sheet Window (PRD v0.3.48 Part C3)
'use client';

import React, { useEffect } from 'react';
import { useStickyState, openStickyBoard, updateSticky } from '../model/stickyStore';
import { STICKY_COLORS } from '../model/stickyTypes';
import { DaySheetBody } from './DaySheetBody';
import { getDeviceCalendarDate } from '@/core/clock';
import { useApp } from '@/context/AppContext';
import { X, Calendar } from 'lucide-react';
import { toLunar } from '@/domain/lunar';

export const StandaloneDaySheetWindow: React.FC = () => {
  const { language } = useApp();
  const today = getDeviceCalendarDate();
  const { notes } = useStickyState();

  useEffect(() => {
    openStickyBoard(today);
  }, [today]);

  const dayNote = notes.find(n => n.kind === 'day' && n.date === today && !n.deletedAt) || notes.find(n => n.kind === 'day' && !n.deletedAt);

  const c = STICKY_COLORS[dayNote?.color || 'yellow'];

  // Lunar text
  let lunarSuffix = '';
  try {
    const lunar = toLunar(today);
    if (lunar) {
      lunarSuffix = language === 'en'
        ? ` · Lunar ${lunar.day}/${lunar.month}`
        : ` · ${lunar.day}/${lunar.month}${lunar.isLeap ? ' nhuận' : ''} Âm lịch`;
    }
  } catch {}

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.close();
    }
  };

  return (
    <div
      style={{ backgroundColor: c.paper }}
      className="fixed inset-0 flex flex-col overflow-hidden text-slate-900 border border-black/10 select-none shadow-2xl font-sans"
    >
      {/* Frameless Drag Header */}
      <header
        style={{
          backgroundColor: c.bar,
          borderBottom: `1px solid ${c.muted}30`,
        }}
        className="h-10 px-3 flex items-center justify-between shrink-0 cursor-move"
        style-webkit-app-region="drag"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <Calendar size={14} style={{ color: c.muted }} />
          <span
            className="text-xs font-bold truncate tracking-tight"
            style={{ color: c.muted }}
          >
            {language === 'en' ? `Today's Journal · ${today}${lunarSuffix}` : `Nhật ký hôm nay · ${today}${lunarSuffix}`}
          </span>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/10 text-slate-600 transition-colors pointer-events-auto"
          style-webkit-app-region="no-drag"
          title={language === 'en' ? 'Close window' : 'Đóng cửa sổ'}
        >
          <X size={14} />
        </button>
      </header>

      {/* Sheet Body */}
      <main
        style={{
          ['--scrollbar-thumb' as any]: `${c.muted}80`,
          ['--scrollbar-thumb-hover' as any]: `${c.muted}B0`,
        }}
        className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain select-text sticky-scrollbar"
        style-webkit-app-region="no-drag"
      >
        {dayNote ? (
          <DaySheetBody note={dayNote} />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
            {language === 'en' ? 'Loading today journal...' : 'Đang tải nhật ký hôm nay...'}
          </div>
        )}
      </main>
    </div>
  );
};
