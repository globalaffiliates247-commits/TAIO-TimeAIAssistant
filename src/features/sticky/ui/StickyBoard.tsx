'use client';
// PRD B34 v0.3.26: shows the open sticky sheets. Desktop: floating, draggable windows; pinned ones stay
// on screen even when the board is closed. Phone: one sheet at a time with colour tabs on top.
import React, { useEffect, useState } from 'react';
import { getDeviceCalendarDate } from '@/core/clock';
import { STICKY_COLORS } from '../model/stickyTypes';
import { closeStickyBoard, newFreeSticky, openStickyBoard, setActiveSticky, useStickyState } from '../model/stickyStore';
import { StickySheet } from './StickySheet';
import { IconClose, IconPin, IconPlus } from './StickyIcons';

export const StickyBoard: React.FC = () => {
  const { notes, boardOpen, activeId } = useStickyState();
  const [isPhone, setIsPhone] = useState(false);
  useEffect(() => {
    const f = () => setIsPhone(window.innerWidth < 768);
    f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f);
  }, []);
  // A new calendar day while the board is open: open the new day sheet (yesterday's becomes a diary page).
  useEffect(() => {
    if (!boardOpen) return;
    const t = setInterval(() => {
      const today = getDeviceCalendarDate();
      if (!notes.some(n => n.kind === 'day' && n.date === today)) openStickyBoard(today);
    }, 60_000);
    return () => clearInterval(t);
  }, [boardOpen, notes]);

  const visible = notes.filter(n => n.open && (boardOpen || n.pinned));
  if (!visible.length) return null;

  if (isPhone) {
    if (!boardOpen) return null;
    const active = visible.find(n => n.id === activeId) || visible[0];
    return (
      <div className="fixed inset-0 z-[70] bg-[#EFEDE6] flex flex-col" style={{ paddingTop: 'calc(var(--sat, 0px) + 10px)', paddingBottom: 'calc(var(--sab, 0px) + 10px)' }}>
        <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto">
          {visible.map(n => (
            <button key={n.id} onClick={() => setActiveSticky(n.id)}
              className="h-8 px-3 rounded-full text-[13px] flex items-center gap-1.5 shrink-0"
              style={{ background: STICKY_COLORS[n.color].bar, color: STICKY_COLORS[n.color].ink, fontWeight: n.id === active.id ? 700 : 500 }}>
              {n.pinned && <IconPin color={STICKY_COLORS[n.color].muted} size={11} filled />}
              {n.kind === 'day' ? 'Hôm nay' : n.title}
            </button>
          ))}
          <button aria-label="Tờ mới" onClick={() => newFreeSticky('pink')} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0"><IconPlus color="#6B5E2A" /></button>
          <span className="flex-1" />
          <button aria-label="Đóng ghi nhanh" onClick={closeStickyBoard} className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0"><IconClose color="#6B5E2A" /></button>
        </div>
        <div className="flex-1 px-3 min-h-0"><StickySheet note={active} floating={false} z={0} /></div>
      </div>
    );
  }

  return (
    <>
      {visible.map((n, i) => (
        <StickySheet key={n.id} note={n} floating z={(n.pinned ? 90 : 75) + (n.id === activeId ? 5 : 0) + i * 0} />
      ))}
    </>
  );
};
