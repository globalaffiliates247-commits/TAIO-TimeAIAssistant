'use client';
// PRD B34 v0.3.26: "Tờ ghi nhanh" in Rổ công việc — open today's sheet, a new sheet, or an old one.
import React from 'react';
import { getDeviceCalendarDate } from '@/core/clock';
import { STICKY_COLORS, newFreeSticky, openStickyBoard, useStickyState } from '../sticky';

export const StickySection: React.FC<{ onOpened: () => void }> = ({ onOpened }) => {
  const { notes } = useStickyState();
  const today = getDeviceCalendarDate();
  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h3 className="text-xl font-extrabold text-[#2B2A26]">Tờ ghi nhanh</h3>
          <p className="text-[13px] text-[#6B6658]">Ghi như Sticky Notes. Mỗi dòng là một việc trong Rổ.</p>
        </div>
        <button onClick={() => { openStickyBoard(today); onOpened(); }} className="h-10 px-4 rounded-xl bg-[#2B2A26] text-white text-sm font-semibold">Mở tờ Hôm nay</button>
        <button onClick={() => { newFreeSticky('pink'); onOpened(); }} className="h-10 px-4 rounded-xl border border-[#E8E3D6] bg-white text-sm font-semibold text-[#2B2A26]">+ Tờ mới</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sorted.map(n => (
          <button key={n.id} onClick={() => { openStickyBoard(today, n.id); onOpened(); }}
            className="text-left rounded-2xl p-3 min-h-[92px] flex flex-col gap-1"
            style={{ background: STICKY_COLORS[n.color].paper, color: STICKY_COLORS[n.color].ink }}>
            <span className="text-[13px] font-bold">{n.kind === 'day' ? (n.date === today ? 'Hôm nay' : `Ngày ${n.date!.split('-').reverse().slice(0, 2).join('/')}`) : n.title}</span>
            <span className="text-xs" style={{ color: STICKY_COLORS[n.color].muted }}>{n.kind === 'day' ? 'Tờ theo ngày' : `${n.lines.filter(l => l.text.trim()).length} dòng`}{n.pinned ? ' · đã ghim' : ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
