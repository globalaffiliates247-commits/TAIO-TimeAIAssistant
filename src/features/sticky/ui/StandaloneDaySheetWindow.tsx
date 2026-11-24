// TAIO Time App — Standalone Frameless Day Sheet Window (PRD v0.3.48 Part C3 & v0.3.54 Parts D, E, F)
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useStickyState, openStickyBoard } from '../model/stickyStore';
import { STICKY_COLORS } from '../model/stickyTypes';
import { DaySheetBody } from './DaySheetBody';
import { getDeviceCalendarDate } from '@/core/clock';
import { useApp } from '@/context/AppContext';
import { X, Calendar, Pin, ChevronUp, ChevronDown } from 'lucide-react';
import { toLunar } from '@/domain/lunar';
import { getStorageItemSync, setStorageItemSync } from '@/core/storage/durableStorage';

const STORAGE_KEY_PINNED = 'taio_day_sheet_pinned';
const STORAGE_KEY_HEIGHT = 'taio_day_sheet_expanded_height';

export const StandaloneDaySheetWindow: React.FC = () => {
  const { language } = useApp();
  const isVi = language === 'vi';
  const today = getDeviceCalendarDate();
  const { notes } = useStickyState();

  const [isPinned, setIsPinned] = useState<boolean>(() => {
    return getStorageItemSync<boolean>(STORAGE_KEY_PINNED, true);
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const rememberedHeightRef = useRef<number>(680);

  useEffect(() => {
    openStickyBoard(today);
    const savedHeight = getStorageItemSync<number>(STORAGE_KEY_HEIGHT, 680);
    if (savedHeight && savedHeight > 100) {
      rememberedHeightRef.current = savedHeight;
    }
  }, [today]);

  const dayNote = notes.find(n => n.kind === 'day' && n.date === today && !n.deletedAt) || notes.find(n => n.kind === 'day' && !n.deletedAt);
  const c = STICKY_COLORS[dayNote?.color || 'yellow'];

  // Lunar text
  let lunarSuffix = '';
  try {
    const lunar = toLunar(today);
    if (lunar) {
      lunarSuffix = isVi
        ? ` · ${lunar.day}/${lunar.month}${lunar.isLeap ? ' nhuận' : ''} Âm lịch`
        : ` · Lunar ${lunar.day}/${lunar.month}`;
    }
  } catch {}

  const handleTogglePin = () => {
    const nextPin = !isPinned;
    setIsPinned(nextPin);
    setStorageItemSync(STORAGE_KEY_PINNED, nextPin);
    const win = window as any;
    if (win?.taioAPI?.window?.pin) {
      win.taioAPI.window.pin('day-sheet', nextPin);
    }
  };

  const handleToggleCollapse = () => {
    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);
    const win = window as any;
    if (win?.taioAPI?.window?.setHeight) {
      if (nextCollapsed) {
        if (typeof window !== 'undefined' && window.innerHeight > 100) {
          rememberedHeightRef.current = window.innerHeight;
          setStorageItemSync(STORAGE_KEY_HEIGHT, window.innerHeight);
        }
        win.taioAPI.window.setHeight('day-sheet', 40);
      } else {
        win.taioAPI.window.setHeight('day-sheet', rememberedHeightRef.current || 680);
      }
    }
  };

  const handleClose = () => {
    const win = window as any;
    if (win?.taioAPI?.window?.close) {
      win.taioAPI.window.close('day-sheet');
    } else if (typeof window !== 'undefined') {
      window.close();
    }
  };

  const handleOpenEventsList = () => {
    const win = window as any;
    if (win?.taioAPI?.data?.act) {
      win.taioAPI.data.act('scheduledEvents', 'openInApp', { view: 'events-list', filter: 'all' });
    }
    if (win?.taioAPI?.window?.open) {
      win.taioAPI.window.open('main');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('taio:navigate', { detail: { tab: 'plan', view: 'events', filter: 'all' } }));
    }
  };

  return (
    <div
      style={{ backgroundColor: c.paper }}
      className="fixed inset-0 flex flex-col overflow-hidden text-slate-900 border border-black/10 select-none shadow-2xl font-sans"
    >
      {/* Frameless Drag Header (PRD v0.3.54 Part D: proper WebkitAppRegion drag CSS) */}
      <header
        style={{
          backgroundColor: c.bar,
          borderBottom: isCollapsed ? 'none' : `1px solid ${c.muted}30`,
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
        onDoubleClick={handleToggleCollapse}
        className="h-10 px-3 flex items-center justify-between shrink-0 cursor-move app-drag-region"
      >
        {/* Date & Lunar header — Click opens Events list (PRD v0.3.54 Part F2) */}
        <button
          type="button"
          onClick={handleOpenEventsList}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title={isVi ? 'Mở Lịch sự kiện' : 'Open Events'}
          className="flex items-center gap-1.5 text-xs font-bold tracking-tight group hover:underline text-left pointer-events-auto cursor-pointer app-no-drag transition-opacity"
        >
          <Calendar size={13} style={{ color: c.muted }} className="shrink-0 group-hover:opacity-80" />
          <span style={{ color: c.muted }} className="truncate">
            {isVi ? `Nhật ký hôm nay · ${today}${lunarSuffix}` : `Today's Journal · ${today}${lunarSuffix}`}
          </span>
        </button>

        {/* 3 Header action buttons: Thu gọn · Ghim · Đóng (PRD v0.3.54 Part E1, E2, E3) */}
        <div
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          className="flex items-center gap-1 shrink-0 pointer-events-auto app-no-drag"
        >
          {/* 1. Thu gọn (Collapse) */}
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-black/10 text-slate-700 transition-colors"
            title={
              isCollapsed
                ? isVi ? 'Mở rộng cửa sổ' : 'Expand window'
                : isVi ? 'Thu gọn về thanh tiêu đề' : 'Collapse to title bar'
            }
            aria-label="Collapse"
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {/* 2. Ghim (Pin) */}
          <button
            type="button"
            onClick={handleTogglePin}
            className={`w-6 h-6 rounded-md flex items-center justify-center hover:bg-black/10 transition-colors ${
              isPinned ? 'text-amber-700 font-bold' : 'text-slate-600'
            }`}
            title={
              isPinned
                ? isVi ? 'Bỏ ghim' : 'Unpin'
                : isVi ? 'Ghim: luôn hiện trên các cửa sổ khác' : 'Pin: keep above other windows'
            }
            aria-label="Pin"
          >
            <Pin size={13} fill={isPinned ? 'currentColor' : 'none'} />
          </button>

          {/* 3. Đóng (Close) */}
          <button
            type="button"
            onClick={handleClose}
            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-500/15 hover:text-red-700 text-slate-600 transition-colors"
            title={isVi ? 'Đóng cửa sổ. Mở lại bằng ⌥⌘A' : 'Close window. Reopen with ⌥⌘A'}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      {/* Sheet Body — Hidden when collapsed */}
      {!isCollapsed && (
        <main
          style={{
            ['--scrollbar-thumb' as any]: `${c.muted}80`,
            ['--scrollbar-thumb-hover' as any]: `${c.muted}B0`,
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
          className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain select-text sticky-scrollbar app-no-drag"
        >
          {dayNote ? (
            <DaySheetBody note={dayNote} />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              {isVi ? 'Đang tải nhật ký hôm nay...' : 'Loading today journal...'}
            </div>
          )}
        </main>
      )}
    </div>
  );
};
