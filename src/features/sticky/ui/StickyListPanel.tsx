'use client';
// TAIO Time App — Sticky List Panel (PRD v0.3.43 Part E)
// Desktop sidebar (260px) & mobile drawer for managing sticky notes and journals.
import React, { useState, useMemo } from 'react';
import { 
  useStickyState, 
  newFreeSticky, 
  updateSticky, 
  setActiveSticky, 
  trashSticky,
  setStickyListPanelOpen,
  openStickyBoard,
  openStickyNote,
} from '../model/stickyStore';
import { STICKY_COLORS, StickyColor, StickyNote, getStickyNoteTitle } from '../model/stickyTypes';
import { useApp } from '@/context/AppContext';
import { getDeviceCalendarDate } from '@/core/clock';
import { 
  Search, 
  Plus, 
  X, 
  Trash2, 
  Calendar, 
  StickyNote as NoteIcon, 
  Layers,
  ArrowUpDown
} from 'lucide-react';

export const StickyListPanel: React.FC<{ isPhone?: boolean }> = ({ isPhone = false }) => {
  const { notes, activeId, listPanelOpen } = useStickyState();
  const { language, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'modified' | 'created' | 'color'>('modified');
  const today = getDeviceCalendarDate();

  if (!listPanelOpen) return null;

  const freeNotes = notes.filter(n => n.kind === 'free' && !n.deletedAt);
  const dayNotes = notes.filter(n => n.kind === 'day' && !n.deletedAt);

  // Filter & sort
  const filteredFreeNotes = useMemo(() => {
    let list = freeNotes;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(n => {
        const titleMatch = n.title.toLowerCase().includes(q);
        const contentMatch = n.content?.toLowerCase().includes(q);
        const linesMatch = n.lines?.some(l => l.text.toLowerCase().includes(q));
        return titleMatch || contentMatch || linesMatch;
      });
    }

    return list.sort((a, b) => {
      if (sortBy === 'modified') return b.updatedAt - a.updatedAt;
      if (sortBy === 'color') return a.color.localeCompare(b.color);
      return a.updatedAt - b.updatedAt; // created/oldest
    });
  }, [freeNotes, searchQuery, sortBy]);

  const filteredDayNotes = useMemo(() => {
    return dayNotes.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [dayNotes]);

  const getFirstLineTitle = (n: StickyNote): string => {
    if (n.content && n.content.trim()) {
      const first = n.content.split('\n').find(l => l.trim());
      if (first) return first.trim();
    }
    if (n.lines && n.lines.length > 0) {
      const first = n.lines.find(l => l.text.trim());
      if (first) return first.text.trim();
    }
    return language === 'vi' ? 'Phiếu trống' : 'Empty note';
  };

  const formatModifiedTime = (ts: number): string => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    if (isToday) {
      return `${hh}:${mm}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return language === 'vi' ? `Hôm qua ${hh}:${mm}` : `Yesterday ${hh}:${mm}`;
    }

    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const handleOpenNote = (n: StickyNote) => {
    if (n.kind === 'day' && n.date) {
      openStickyBoard(n.date, n.id);
      if (!isPhone && (typeof n.x !== 'number' || n.x < 310)) {
        updateSticky(n.id, { x: 320 });
      }
    } else {
      openStickyNote(n.id);
    }
    if (isPhone) {
      setStickyListPanelOpen(false);
    }
  };

  const handleTrashNote = (e: React.MouseEvent, n: StickyNote) => {
    e.stopPropagation();
    const { undo } = trashSticky(n.id);
    showToast(
      language === 'vi' ? 'Đã chuyển phiếu vào thùng rác (lưu 30 ngày)' : 'Note moved to trash (kept 30 days)',
      undo,
      'confirmation',
      language === 'vi' ? 'Hoàn tác' : 'Undo'
    );
  };

  const handleCreateNew = () => {
    const newId = newFreeSticky('pink');
    if (newId) {
      if (!isPhone) {
        const created = notes.find(n => n.id === newId);
        if (created && (typeof created.x !== 'number' || created.x < 310)) {
          updateSticky(newId, { x: 320 });
        }
      }
      setActiveSticky(newId);
    }
    if (isPhone) {
      setStickyListPanelOpen(false);
    }
  };

  return (
    <div
      style={{ zIndex: 47 }}
      className={`bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl flex flex-col select-none ${
        isPhone
          ? 'fixed inset-0 z-[70] p-4'
          : 'fixed top-14 left-4 w-72 max-h-[82vh] rounded-2xl animate-in fade-in slide-in-from-left-4 duration-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-600" />
          <span className="font-bold text-xs text-slate-800">
            {language === 'vi' ? 'Danh sách phiếu' : 'Notes & Journals'}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
            {freeNotes.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCreateNew}
            aria-label="Tạo phiếu mới"
            title={language === 'vi' ? 'Tạo phiếu mới (+)' : 'Create new note (+)'}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setStickyListPanelOpen(false)}
            aria-label="Đóng bảng"
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="p-2 border-b border-slate-100 flex items-center gap-1.5">
        <div className="flex-1 relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'vi' ? 'Tìm nội dung...' : 'Search notes...'}
            className="w-full pl-8 pr-6 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200/80 outline-none focus:bg-white focus:border-amber-400 text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Sort button */}
        <button
          onClick={() => {
            if (sortBy === 'modified') setSortBy('created');
            else if (sortBy === 'created') setSortBy('color');
            else setSortBy('modified');
          }}
          title={
            sortBy === 'modified'
              ? (language === 'vi' ? 'Sắp xếp: Mới sửa trước' : 'Sort: Recently edited')
              : sortBy === 'created'
              ? (language === 'vi' ? 'Sắp xếp: Cũ nhất trước' : 'Sort: Oldest first')
              : (language === 'vi' ? 'Sắp xếp: Theo màu' : 'Sort: By color')
          }
          className="p-1.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer shrink-0"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 p-1.5 space-y-1">
        {/* Section 1: Ghi chú */}
        <div className="px-2 pt-1 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <NoteIcon className="w-3 h-3" />
            <span>{language === 'vi' ? 'Ghi chú' : 'Notes'}</span>
          </span>
        </div>

        {filteredFreeNotes.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">
            {searchQuery
              ? (language === 'vi' ? 'Không tìm thấy phiếu phù hợp' : 'No matching notes')
              : (language === 'vi' ? 'Chưa có phiếu ghi chú nào' : 'No notes yet')}
          </div>
        ) : (
          filteredFreeNotes.map(n => {
            const c = STICKY_COLORS[n.color] || STICKY_COLORS.pink;
            const title = getFirstLineTitle(n);
            const isEmpty = title === (language === 'vi' ? 'Phiếu trống' : 'Empty note');
            const isActive = n.id === activeId && n.open;

            return (
              <div
                key={n.id}
                onClick={() => handleOpenNote(n)}
                className={`group px-2.5 py-2 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-100/70 border border-amber-300/80 shadow-xs'
                    : 'hover:bg-slate-100/80 border border-transparent'
                }`}
              >
                {/* Color Pill */}
                <div
                  className="w-2.5 h-7 rounded-full shrink-0"
                  style={{ background: c.bar }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs truncate ${
                      isEmpty ? 'italic text-slate-400' : 'font-semibold text-slate-800'
                    }`}
                  >
                    {title}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span>{formatModifiedTime(n.updatedAt)}</span>
                    {n.pinned && (
                      <span className="text-amber-700 bg-amber-50 px-1 py-0.2 rounded text-[9px] font-bold">
                        {language === 'vi' ? 'Đã ghim' : 'Pinned'}
                      </span>
                    )}
                    {!n.open && (
                      <span className="text-slate-400 bg-slate-100 px-1 py-0.2 rounded text-[9px]">
                        {language === 'vi' ? 'Đã ẩn' : 'Closed'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions on hover */}
                <button
                  type="button"
                  onClick={e => handleTrashNote(e, n)}
                  title={language === 'vi' ? 'Chuyển vào thùng rác (30 ngày)' : 'Move to trash (30 days)'}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}

        {/* Section 2: Nhật ký */}
        <div className="px-2 pt-3 pb-1 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{language === 'vi' ? 'Nhật ký' : 'Journals'}</span>
          </span>
        </div>

        {filteredDayNotes.map(n => {
          const isTodayNote = n.date === today;
          const isActive = n.id === activeId && n.open;

          return (
            <div
              key={n.id}
              onClick={() => handleOpenNote(n)}
              className={`px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-100/70 border border-amber-300/80 shadow-xs'
                  : 'hover:bg-slate-100/80 border border-transparent'
              }`}
            >
              <div className="w-2.5 h-5 rounded-full shrink-0 bg-amber-300" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-slate-800">
                  {getStickyNoteTitle(n, today, language, false)}
                </span>
              </div>
              {isTodayNote && (
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                  {language === 'vi' ? 'Hiện tại' : 'Current'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
