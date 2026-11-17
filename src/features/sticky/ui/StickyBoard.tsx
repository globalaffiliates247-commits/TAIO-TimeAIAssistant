'use client';
// PRD B34 v0.3.26: shows the open sticky sheets. Desktop: floating, draggable windows; pinned ones stay
// on screen even when the board is closed. Phone: one sheet at a time with colour tabs on top.
import React, { useEffect, useState } from 'react';
import { getDeviceCalendarDate } from '@/core/clock';
import { STICKY_COLORS } from '../model/stickyTypes';
import {
  closeStickyBoard,
  newFreeSticky,
  openStickyBoard,
  setActiveSticky,
  useStickyState,
  toggleHideAllStickyNotes,
  dismissCacheWipeWarning,
} from '../model/stickyStore';
import { StickySheet } from './StickySheet';
import { StickyListPanel } from './StickyListPanel';
import { IconClose, IconPin, IconPlus } from './StickyIcons';
import { Eye, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { Z_LAYERS } from '@/styles/layers';

export const StickyBoard: React.FC = () => {
  const { notes, boardOpen, activeId, isTemporarilyHidden, cacheWipedWarning } = useStickyState();
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    const f = () => setIsPhone(window.innerWidth < 768);
    f();
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  // Global hotkey: Cmd+Shift+H / Ctrl+Shift+H to toggle hide all notes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        toggleHideAllStickyNotes();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // A new calendar day while the board is open: open the new day sheet
  useEffect(() => {
    if (!boardOpen) return;
    const t = setInterval(() => {
      const today = getDeviceCalendarDate();
      if (!notes.some(n => n.kind === 'day' && n.date === today)) openStickyBoard(today);
    }, 60_000);
    return () => clearInterval(t);
  }, [boardOpen, notes]);

  const visible = notes.filter(n => n.open && (boardOpen || n.pinned) && !n.deletedAt);

  return (
    <>
      {/* Sticky List Panel (Sidebar / Drawer) */}
      <StickyListPanel isPhone={isPhone} />

      {/* Cache wipe warning banner (Rule E2.6) */}
      {cacheWipedWarning && (
        <div
          style={{ zIndex: (Z_LAYERS?.STICKY || 42) + 7 }}
          className="fixed top-14 left-1/2 -translate-x-1/2 max-w-md w-[90%] p-3.5 rounded-2xl bg-amber-50 border border-amber-300 shadow-xl flex items-center justify-between gap-3 text-xs text-amber-900"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">Các tờ ghi chú trên máy này đã bị xóa. Khôi phục từ đồng bộ?</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                dismissCacheWipeWarning();
                // trigger sync or prompt user
                window.dispatchEvent(new CustomEvent('taio:open-sync'));
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold text-[11px] hover:bg-amber-700 transition-colors"
            >
              Khôi phục
            </button>
            <button
              onClick={dismissCacheWipeWarning}
              className="p-1 rounded-md text-amber-700 hover:bg-amber-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating restore pill when notes are temporarily hidden (Rule E2.1) */}
      {isTemporarilyHidden && (
        <div
          style={{ zIndex: (Z_LAYERS?.STICKY || 42) + 7 }}
          className="fixed bottom-6 right-6 flex items-center gap-2 p-2 pl-3 rounded-full bg-slate-900/90 text-white text-xs backdrop-blur-md shadow-2xl border border-white/20 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <Eye className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-medium">Các tờ ghi chú đang ẩn</span>
          <button
            onClick={toggleHideAllStickyNotes}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Hiện lại (⌘⇧H)</span>
          </button>
        </div>
      )}

      {visible.length > 0 && isPhone && boardOpen && (
        <div className="fixed inset-0 z-40 bg-[#EFEDE6] flex flex-col" style={{ paddingTop: 'calc(var(--sat, 0px) + 10px)', paddingBottom: 'calc(var(--sab, 0px) + 10px)' }}>
          <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto">
            {visible.map(n => (
              <button key={n.id} onClick={() => setActiveSticky(n.id)}
                className="h-8 px-3 rounded-full text-[13px] flex items-center gap-1.5 shrink-0"
                style={{ background: STICKY_COLORS[n.color].bar, color: STICKY_COLORS[n.color].ink, fontWeight: n.id === (activeId || visible[0].id) ? 700 : 500 }}>
                {n.pinned && <IconPin color={STICKY_COLORS[n.color].muted} size={11} filled />}
                {n.kind === 'day' ? 'Hôm nay' : n.title}
              </button>
            ))}
            <button aria-label="Tờ mới" onClick={() => newFreeSticky('pink')} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0"><IconPlus color="#6B5E2A" /></button>
            <span className="flex-1" />
            <button aria-label="Đóng ghi nhanh" onClick={closeStickyBoard} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0"><IconClose color="#6B5E2A" /></button>
          </div>
          <div className="flex-1 px-3 min-h-0"><StickySheet note={visible.find(n => n.id === activeId) || visible[0]} floating={false} z={0} /></div>
        </div>
      )}

      {visible.length > 0 && !isPhone && (
        <>
          {visible.map((n, i) => {
            const isActive = n.id === activeId;
            const baseZ = n.pinned ? (Z_LAYERS?.STICKY_PINNED || 46) : (Z_LAYERS?.STICKY || 42);
            // Focused / active note always rises to topmost layer (z=52) above inactive notes and list panel
            const z = isActive ? 52 : baseZ + (i % 3);
            return (
              <StickySheet
                key={n.id}
                note={n}
                floating
                z={z}
              />
            );
          })}
        </>
      )}
    </>
  );
};
