'use client';
// PRD B34 v0.3.26: one sticky window — toolbar (close, pin, colour, collapse, new) + body.
import React, { useRef, useState } from 'react';
import { STICKY_COLORS, StickyColor, StickyNote } from '../model/stickyTypes';
import { closeSticky, newFreeSticky, setActiveSticky, updateSticky, trashSticky, toggleStickyListPanel } from '../model/stickyStore';
import { IconClose, IconCollapse, IconPin, IconPlus, IconShirt } from './StickyIcons';
import { Lightbulb, Trash2, EyeOff, Layers, Calendar, FileText, ExternalLink } from 'lucide-react';
import { DaySheetBody } from './DaySheetBody';
import { FreeSheetBody } from './FreeSheetBody';
import { useStickyResize } from './useStickyResize';
import { getDeviceCalendarDate } from '@/core/clock';
import { useApp } from '@/context/AppContext';
import { toLunar } from '@/domain/lunar';
import { AddEventModal } from '@/features/events';

const dayTitle = (date: string, lang: 'vi' | 'en' | string = 'vi') => {
  const [y, m, d] = date.split('-').map(Number);
  const dateObj = new Date(y, (m || 1) - 1, d || 1);
  const today = getDeviceCalendarDate();
  
  // PRD v0.3.45 Part C: Hiển thị Âm lịch
  let lunarSuffix = '';
  try {
    const lunar = toLunar(date);
    if (lunar) {
      lunarSuffix = lang === 'en' 
        ? ` · Lunar ${lunar.day}/${lunar.month}` 
        : ` · ${lunar.day}/${lunar.month}${lunar.isLeap ? ' nhuận' : ''} Âm lịch`;
    }
  } catch {
    lunarSuffix = '';
  }

  if (lang === 'en') {
    const wdEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (date === today) {
      return `Today's Journal · ${wdEn}, ${monthsEn[(m || 1) - 1]} ${d}${lunarSuffix}`;
    }
    return `Journal · ${wdEn}, ${monthsEn[(m || 1) - 1]} ${d}${lunarSuffix}`;
  }
  const wd = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][dateObj.getDay()];
  if (date === today) {
    return `Nhật ký hôm nay · ${wd} ${d}/${m}${lunarSuffix}`;
  }
  return `Nhật ký ${wd} ${d}/${m}${lunarSuffix}`;
};

export const StickySheet: React.FC<{ note: StickyNote; floating: boolean; z: number }> = ({ note, floating, z }) => {
  const { language, showToast } = useApp();
  const c = STICKY_COLORS[note.color];
  const [palette, setPalette] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  const handleTrash = () => {
    const { undo } = trashSticky(note.id);
    showToast(
      language === 'vi' ? 'Đã chuyển tờ vào thùng rác (lưu 30 ngày)' : 'Note moved to trash (kept 30 days)',
      undo,
      'confirmation',
      language === 'vi' ? 'Hoàn tác' : 'Undo'
    );
  };
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
        <button className={btn} aria-label="Ẩn tờ (Đóng)" title="Ẩn tờ này (Mở lại bất cứ lúc nào từ Rổ công việc hoặc Danh sách phiếu)" onClick={() => closeSticky(note.id)}>
          <IconClose color={c.muted} />
        </button>
        {/* PRD v0.3.43 Part E: Bảng danh sách phiếu (Notes & Journals) */}
        <button
          className={btn}
          aria-label="Danh sách phiếu"
          title="Danh sách tất cả phiếu ghi chú và nhật ký"
          onClick={toggleStickyListPanel}
        >
          <Layers size={13} color={c.muted} />
        </button>
        {note.kind === 'free' && (
          <button
            className={btn}
            aria-label="Xóa tờ"
            title="Xóa tờ (Chuyển vào thùng rác 30 ngày có thể hoàn tác)"
            onClick={handleTrash}
          >
            <Trash2 size={13} color={c.muted} />
          </button>
        )}
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
        {note.kind === 'day' && typeof window !== 'undefined' && Boolean((window as any).taioAPI?.openDaySheetWindow) && (
          <button
            className={btn}
            aria-label={language === 'vi' ? 'Tách cửa sổ riêng' : 'Detach to separate window'}
            title={language === 'vi' ? 'Tách cửa sổ riêng (⌥⌘A)' : 'Detach to separate window (⌥⌘A)'}
            onClick={() => {
              (window as any).taioAPI.openDaySheetWindow();
              closeSticky(note.id);
            }}
          >
            <ExternalLink size={14} color={c.muted} />
          </button>
        )}
        {note.kind === 'free' && (
          <button
            className={btn}
            aria-label={note.hasMotivationSticker ? 'Bỏ nhãn động lực' : 'Thêm nhãn động lực'}
            title={note.hasMotivationSticker ? 'Bỏ nhãn động lực' : 'Thêm nhãn động lực'}
            style={note.hasMotivationSticker ? { background: 'rgba(0,0,0,.08)' } : undefined}
            onClick={() => updateSticky(note.id, { hasMotivationSticker: !note.hasMotivationSticker })}
          >
            <Lightbulb size={14} color={c.muted} />
          </button>
        )}
        <span
          className={`flex-1 text-center text-xs font-bold truncate px-1 ${
            note.kind === 'day' ? 'cursor-pointer hover:underline transition-all' : 'cursor-default'
          }`}
          style={{ color: c.muted }}
          title={note.kind === 'day' ? (language === 'vi' ? 'Mở Lịch sự kiện' : 'Open Events') : note.title}
          onClick={() => {
            if (note.kind === 'day') {
              window.dispatchEvent(new CustomEvent('taio:open-events-list', { detail: { filter: 'all' } }));
              window.dispatchEvent(new CustomEvent('taio:switch-tab', { detail: 'plan' }));
            }
          }}
        >
          {note.kind === 'day' ? dayTitle(note.date!, language) : note.title}
        </span>
        <div className="relative">
          <button
            className={btn}
            aria-label="Tùy chọn tạo mới"
            title={language === 'vi' ? 'Thêm mới...' : 'Add new...'}
            onClick={() => setPlusMenuOpen(!plusMenuOpen)}
          >
            <IconPlus color={c.muted} size={17} />
          </button>

          {plusMenuOpen && (
            <>
              {/* Backdrop to close menu on click outside */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setPlusMenuOpen(false)} 
              />
              <div 
                className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-1.5 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100/90 text-left font-medium transition-colors cursor-pointer text-slate-700"
                  onClick={() => {
                    setPlusMenuOpen(false);
                    newFreeSticky('pink');
                  }}
                >
                  <FileText size={15} className="text-slate-500 shrink-0" />
                  <span>{language === 'vi' ? 'Tờ ghi chú mới' : 'New note sheet'}</span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-orange-50 text-left font-medium transition-colors cursor-pointer text-slate-700 hover:text-orange-900"
                  onClick={() => {
                    setPlusMenuOpen(false);
                    setShowAddEventModal(true);
                  }}
                >
                  <Calendar size={15} className="text-orange-600 shrink-0" />
                  <span>{language === 'vi' ? 'Thêm sự kiện' : 'Add event'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showAddEventModal && (
        <AddEventModal
          isOpen={showAddEventModal}
          onClose={() => setShowAddEventModal(false)}
          initialDate={note.kind === 'day' ? note.date : getDeviceCalendarDate()}
        />
      )}

      {/* Body */}
      {!note.collapsed && (
        <div
          style={{
            ['--scrollbar-thumb' as any]: `${c.muted}80`,
            ['--scrollbar-thumb-hover' as any]: `${c.muted}B0`,
          }}
          className="px-5 py-4 overflow-y-auto overscroll-contain flex-1 select-text sticky-scrollbar"
        >
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
