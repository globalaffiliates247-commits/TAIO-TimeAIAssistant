'use client';
// PRD B34 v0.3.26: one sticky window — toolbar (close, pin, colour, collapse, new) + body.
import React, { useRef, useState } from 'react';
import { STICKY_COLORS, StickyColor, StickyNote } from '../model/stickyTypes';
import { closeSticky, newFreeSticky, setActiveSticky, updateSticky } from '../model/stickyStore';
import { IconClose, IconCollapse, IconPin, IconPlus, IconShirt } from './StickyIcons';
import { DaySheetBody } from './DaySheetBody';
import { FreeSheetBody } from './FreeSheetBody';

const dayTitle = (date: string) => {
  const d = new Date(`${date}T00:00:00`);
  const wd = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][d.getDay()];
  return `Hôm nay · ${wd} ${d.getDate()}/${d.getMonth() + 1}`;
};

export const StickySheet: React.FC<{ note: StickyNote; floating: boolean; z: number }> = ({ note, floating, z }) => {
  const c = STICKY_COLORS[note.color];
  const [palette, setPalette] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const x = pos?.x ?? note.x, y = pos?.y ?? note.y;
  const btn = 'w-8 h-8 rounded-lg flex items-center justify-center shrink-0';

  const onPointerDown = (e: React.PointerEvent) => {
    if (!floating || (e.target as HTMLElement).closest('button')) return;
    drag.current = { dx: e.clientX - x, dy: e.clientY - y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos({ x: Math.max(0, e.clientX - drag.current.dx), y: Math.max(0, e.clientY - drag.current.dy) });
  };
  const onPointerUp = () => {
    if (drag.current && pos) updateSticky(note.id, { x: pos.x, y: pos.y });
    drag.current = null;
  };

  const frame: React.CSSProperties = floating
    ? { position: 'fixed', left: x, top: y, width: note.kind === 'day' ? 460 : 300, zIndex: z, background: c.paper }
    : { background: c.paper };

  return (
    <div
      style={frame}
      className={`rounded-2xl overflow-visible flex flex-col ${floating ? 'shadow-[0_18px_40px_rgba(60,52,24,.18)] max-h-[80vh]' : 'h-full shadow-[0_12px_28px_rgba(60,52,24,.14)]'}`}
      onPointerDownCapture={() => setActiveSticky(note.id)}
    >
      <div
        className={`h-11 shrink-0 flex items-center gap-0.5 px-1.5 rounded-t-2xl select-none ${floating ? 'cursor-grab active:cursor-grabbing' : ''} ${note.collapsed ? 'rounded-b-2xl' : ''}`}
        style={{ background: c.bar, touchAction: 'none' }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      >
        <button className={btn} aria-label="Đóng tờ" onClick={() => closeSticky(note.id)}><IconClose color={c.muted} /></button>
        <button className={btn} aria-label={note.pinned ? 'Bỏ ghim' : 'Ghim lên trên cùng'} title="Ghim: tờ luôn hiện trên màn hình"
          style={note.pinned ? { background: 'rgba(0,0,0,.08)' } : undefined}
          onClick={() => updateSticky(note.id, { pinned: !note.pinned })}><IconPin color={c.muted} filled={note.pinned} /></button>
        <div className="relative">
          <button className={btn} aria-label="Đổi màu" onClick={() => setPalette(v => !v)}><IconShirt color={c.muted} size={16} /></button>
          {palette && (
            <div className="absolute left-0 top-10 z-10 bg-white rounded-xl shadow-lg p-2 flex gap-1.5">
              {(Object.keys(STICKY_COLORS) as StickyColor[]).map(k => (
                <button key={k} aria-label={`Màu ${k}`} onClick={() => { updateSticky(note.id, { color: k }); setPalette(false); }}
                  className="w-6 h-6 rounded-full"
                  style={{ background: STICKY_COLORS[k].bar, boxShadow: k === note.color ? `0 0 0 2px #fff, 0 0 0 4px ${STICKY_COLORS[k].muted}` : undefined }} />
              ))}
            </div>
          )}
        </div>
        <button className={btn} aria-label={note.collapsed ? 'Mở rộng' : 'Thu gọn'} onClick={() => updateSticky(note.id, { collapsed: !note.collapsed })}><IconCollapse color={c.muted} size={16} /></button>
        <span className="flex-1 text-center text-xs font-bold truncate px-1" style={{ color: c.muted }}>
          {note.kind === 'day' ? dayTitle(note.date!) : note.title}
        </span>
        <button className={btn} aria-label="Tờ mới" onClick={() => newFreeSticky('pink')}><IconPlus color={c.muted} size={17} /></button>
      </div>
      {!note.collapsed && (
        <div className="px-5 py-4 overflow-y-auto overscroll-contain flex-1">
          {note.kind === 'day' ? <DaySheetBody note={note} /> : <FreeSheetBody note={note} />}
        </div>
      )}
    </div>
  );
};
