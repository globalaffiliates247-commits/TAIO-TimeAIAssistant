'use client';
// PRD B34 v0.3.26: one sticky window — toolbar (close, pin, colour, collapse, new) + body.
import React, { useRef, useState } from 'react';
import { STICKY_COLORS, StickyColor, StickyNote } from '../model/stickyTypes';
import { closeSticky, newFreeSticky, setActiveSticky, updateSticky } from '../model/stickyStore';
import { IconClose, IconCollapse, IconPin, IconPlus, IconShirt } from './StickyIcons';
import { Sparkles } from 'lucide-react';
import { DaySheetBody } from './DaySheetBody';
import { FreeSheetBody } from './FreeSheetBody';
import { useStickyResize } from './useStickyResize';
import { getDeviceCalendarDate } from '@/core/clock';

const dayTitle = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const dateObj = new Date(y, (m || 1) - 1, d || 1);
  const wd = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][dateObj.getDay()];
  const today = getDeviceCalendarDate();
  if (date === today) {
    return `Nhật ký hôm nay · ${wd} ${d}/${m}`;
  }
  return `Nhật ký ${wd} ${d}/${m}`;
};

export const StickySheet: React.FC<{ note: StickyNote; floating: boolean; z: number }> = ({ note, floating, z }) => {
  const c = STICKY_COLORS[note.color];
  const [palette, setPalette] = useState(false);
  const defaultW = note.kind === 'day' ? 460 : 300;
  const defaultH = note.kind === 'day' ? 520 : 320;

  const { size, isResizing, startResize } = useStickyResize({
    noteId: note.id,
    initialX: note.x,
    initialY: note.y,
    initialW: note.w,
    initialH: note.h,
    defaultW,
    defaultH,
    minW: 240,
    minH: 160,
    onCommit: patch => updateSticky(note.id, patch),
  });

  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const curX = dragPos?.x ?? size.x;
  const curY = dragPos?.y ?? size.y;
  const btn = 'w-8 h-8 rounded-lg flex items-center justify-center shrink-0';

  const onPointerDown = (e: React.PointerEvent) => {
    if (!floating || (e.target as HTMLElement).closest('button')) return;
    drag.current = { dx: e.clientX - curX, dy: e.clientY - curY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const maxX = Math.max(0, winW - size.w);
    const maxY = Math.max(0, winH - (note.collapsed ? 44 : size.h));
    setDragPos({
      x: Math.max(0, Math.min(maxX, e.clientX - drag.current.dx)),
      y: Math.max(0, Math.min(maxY, e.clientY - drag.current.dy)),
    });
  };
  const onPointerUp = () => {
    if (drag.current && dragPos) updateSticky(note.id, { x: dragPos.x, y: dragPos.y });
    drag.current = null;
    setDragPos(null);
  };

  const handleTitleBarDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    updateSticky(note.id, { collapsed: !note.collapsed });
  };

  const frame: React.CSSProperties = floating
    ? {
        position: 'fixed',
        left: curX,
        top: curY,
        width: size.w,
        height: note.collapsed ? 44 : size.h,
        minWidth: 240,
        minHeight: note.collapsed ? 44 : 160,
        maxHeight: '100vh',
        zIndex: z,
        background: c.paper,
      }
    : { background: c.paper };

  return (
    <div
      style={frame}
      className={`rounded-2xl relative flex flex-col ${
        floating
          ? 'shadow-[0_18px_40px_rgba(60,52,24,.18)] select-none'
          : 'h-full shadow-[0_12px_28px_rgba(60,52,24,.14)]'
      }`}
      onPointerDownCapture={() => setActiveSticky(note.id)}
    >
      {/* Title Bar */}
      <div
        className={`h-11 shrink-0 flex items-center gap-0.5 px-1.5 rounded-t-2xl select-none ${
          floating ? 'cursor-grab active:cursor-grabbing' : ''
        } ${note.collapsed ? 'rounded-b-2xl' : ''}`}
        style={{ background: c.bar, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={handleTitleBarDoubleClick}
      >
        <button className={btn} aria-label="Đóng tờ" onClick={() => closeSticky(note.id)}>
          <IconClose color={c.muted} />
        </button>
        <button
          className={btn}
          aria-label={note.pinned ? 'Bỏ ghim' : 'Ghim lên trên cùng'}
          title="Ghim: tờ luôn hiện trên màn hình"
          style={note.pinned ? { background: 'rgba(0,0,0,.08)' } : undefined}
          onClick={() => updateSticky(note.id, { pinned: !note.pinned })}
        >
          <IconPin color={c.muted} filled={note.pinned} />
        </button>
        <div className="relative">
          <button className={btn} aria-label="Đổi màu" onClick={() => setPalette(v => !v)}>
            <IconShirt color={c.muted} size={16} />
          </button>
          {palette && (
            <div className="absolute left-0 top-10 z-30 bg-white rounded-xl shadow-lg p-2 flex gap-1.5">
              {(Object.keys(STICKY_COLORS) as StickyColor[]).map(k => (
                <button
                  key={k}
                  aria-label={`Màu ${k}`}
                  onClick={() => {
                    updateSticky(note.id, { color: k });
                    setPalette(false);
                  }}
                  className="w-6 h-6 rounded-full"
                  style={{
                    background: STICKY_COLORS[k].bar,
                    boxShadow:
                      k === note.color
                        ? `0 0 0 2px #fff, 0 0 0 4px ${STICKY_COLORS[k].muted}`
                        : undefined,
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <button
          className={btn}
          aria-label={note.collapsed ? 'Mở rộng' : 'Thu gọn'}
          title={note.collapsed ? 'Bấm đúp tiêu đề hoặc nút này để mở lại' : 'Thu gọn'}
          onClick={() => updateSticky(note.id, { collapsed: !note.collapsed })}
        >
          <IconCollapse color={c.muted} size={16} />
        </button>
        {note.kind === 'free' && (
          <button
            className={btn}
            aria-label={note.hasMotivationSticker ? 'Bỏ nhãn động lực' : 'Thêm nhãn động lực'}
            title={note.hasMotivationSticker ? 'Bỏ nhãn động lực' : 'Thêm nhãn động lực'}
            style={note.hasMotivationSticker ? { background: 'rgba(0,0,0,.08)' } : undefined}
            onClick={() => updateSticky(note.id, { hasMotivationSticker: !note.hasMotivationSticker })}
          >
            <Sparkles size={14} color={c.muted} />
          </button>
        )}
        <span
          className="flex-1 text-center text-xs font-bold truncate px-1 cursor-default"
          style={{ color: c.muted }}
          title={note.kind === 'day' ? dayTitle(note.date!) : note.title}
        >
          {note.kind === 'day' ? dayTitle(note.date!) : note.title}
        </span>
        <button className={btn} aria-label="Tờ mới" onClick={() => newFreeSticky('pink')}>
          <IconPlus color={c.muted} size={17} />
        </button>
      </div>

      {/* Body */}
      {!note.collapsed && (
        <div className="px-5 py-4 overflow-y-auto overscroll-contain flex-1 select-text">
          {note.kind === 'day' ? <DaySheetBody note={note} /> : <FreeSheetBody note={note} />}
        </div>
      )}

      {/* Resize handles (floating only, when not collapsed) */}
      {floating && !note.collapsed && (
        <>
          {/* 4 Edge Handles */}
          <div
            onPointerDown={e => startResize('e', e)}
            className="absolute right-0 top-3 bottom-3 w-1.5 cursor-e-resize z-20 hover:bg-black/5 transition-colors"
          />
          <div
            onPointerDown={e => startResize('w', e)}
            className="absolute left-0 top-3 bottom-3 w-1.5 cursor-w-resize z-20 hover:bg-black/5 transition-colors"
          />
          <div
            onPointerDown={e => startResize('s', e)}
            className="absolute bottom-0 left-3 right-3 h-1.5 cursor-s-resize z-20 hover:bg-black/5 transition-colors"
          />
          <div
            onPointerDown={e => startResize('n', e)}
            className="absolute top-0 left-3 right-3 h-1.5 cursor-n-resize z-20 hover:bg-black/5 transition-colors"
          />

          {/* Bottom-right diagonal grip (3 diagonal stripes) */}
          <div
            onPointerDown={e => startResize('se', e)}
            className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize flex items-center justify-center select-none z-30 group p-0.5"
            title="Kéo để đổi kích thước"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              className="opacity-35 group-hover:opacity-85 transition-opacity"
            >
              <line x1="8" y1="2" x2="2" y2="8" stroke={c.muted} strokeWidth="1.2" strokeLinecap="round" />
              <line x1="8" y1="5" x2="5" y2="8" stroke={c.muted} strokeWidth="1.2" strokeLinecap="round" />
              <line x1="8" y1="8" x2="8" y2="8" stroke={c.muted} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};
