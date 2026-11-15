'use client';
// PRD B34 v0.3.26 & v0.3.37 Part E: "Tờ ghi nhanh" in Rổ công việc — open today's sheet,
// reopen closed sheets with 1-line preview, and restore from 30-day trash.
import React, { useState } from 'react';
import { getDeviceCalendarDate } from '@/core/clock';
import {
  STICKY_COLORS,
  newFreeSticky,
  openStickyBoard,
  useStickyState,
  restoreSticky,
  updateSticky,
} from '../sticky';
import { useT } from '@/i18n/useT';
import { RotateCcw, Trash2, Archive, Eye } from 'lucide-react';

export const StickySection: React.FC<{ onOpened: () => void }> = ({ onOpened }) => {
  const { notes } = useStickyState();
  const { t } = useT();
  const [showTrash, setShowTrash] = useState(false);
  const today = getDeviceCalendarDate();

  const activeNotes = notes.filter(n => !n.deletedAt);
  const trashNotes = notes.filter(n => n.deletedAt);

  const openSheets = activeNotes.filter(n => n.open);
  const closedSheets = activeNotes.filter(n => !n.open);

  const sortedActive = [...activeNotes].sort((a, b) => b.updatedAt - a.updatedAt);
  const sortedClosed = [...closedSheets].sort((a, b) => b.updatedAt - a.updatedAt);
  const sortedTrash = [...trashNotes].sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));

  return (
    <div className="flex flex-col gap-4">
      {/* Header & Main Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-xl font-extrabold text-[#2B2A26]">{t('basket.sticky_notes', 'Tờ ghi nhanh')}</h3>
          <p className="text-[13px] text-[#6B6658]">{t('basket.sticky_desc', 'Ghi như Sticky Notes. Mỗi dòng là một việc trong Rổ.')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              openStickyBoard(today);
              onOpened();
            }}
            className="h-10 px-4 rounded-xl bg-[#2B2A26] hover:bg-black text-white text-sm font-semibold transition-colors shadow-2xs"
          >
            {t('basket.open_today_journal', 'Mở nhật ký hôm nay')}
          </button>
          <button
            onClick={() => {
              newFreeSticky('pink');
              onOpened();
            }}
            className="h-10 px-4 rounded-xl border border-[#E8E3D6] hover:border-slate-300 bg-white text-sm font-semibold text-[#2B2A26] transition-colors shadow-2xs"
          >
            {t('basket.new_sheet', '+ Tờ mới')}
          </button>
        </div>
      </div>

      {/* Grid of active / recent sheets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sortedActive.map(n => {
          const firstLine = n.lines.find(l => l.text.trim())?.text || '';
          return (
            <button
              key={n.id}
              onClick={() => {
                updateSticky(n.id, { open: true });
                openStickyBoard(today, n.id);
                onOpened();
              }}
              className="text-left rounded-2xl p-3 min-h-[92px] flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-xs border border-black/5"
              style={{ background: STICKY_COLORS[n.color].paper, color: STICKY_COLORS[n.color].ink }}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[13px] font-bold truncate">
                    {n.kind === 'day'
                      ? n.date === today
                        ? t('terms.todayJournal', 'Nhật ký hôm nay')
                        : `Ngày ${n.date!.split('-').reverse().slice(0, 2).join('/')}`
                      : n.title}
                  </span>
                  {n.open && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Đang mở" />
                  )}
                </div>
                {firstLine && n.kind === 'free' && (
                  <p className="text-xs line-clamp-2 mt-1 opacity-80" style={{ color: STICKY_COLORS[n.color].ink }}>
                    {firstLine}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between text-xs mt-2" style={{ color: STICKY_COLORS[n.color].muted }}>
                <span>
                  {n.kind === 'day'
                    ? t('basket.day_sheet', 'Tờ theo ngày')
                    : t('basket.lines_count', {
                        count: n.lines.filter(l => l.text.trim()).length,
                        defaultValue: `${n.lines.filter(l => l.text.trim()).length} dòng`,
                      })}
                  {n.pinned ? t('basket.pinned', ' · đã ghim') : ''}
                </span>
                <span className="text-[10px] uppercase font-semibold">
                  {n.open ? 'Đang mở' : 'Đã đóng'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Closed Sheets section (Rule E2.4: dễ tìm lại tờ đã đóng) */}
      {sortedClosed.length > 0 && (
        <div className="mt-2 p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Archive className="w-4 h-4 text-slate-500" />
            <span>Tờ đã đóng ({sortedClosed.length})</span>
          </div>
          <div className="divide-y divide-slate-100">
            {sortedClosed.map(n => {
              const preview = n.lines.find(l => l.text.trim())?.text || '(Tờ trống)';
              return (
                <div key={n.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: STICKY_COLORS[n.color].bar }}
                    />
                    <span className="font-semibold text-slate-800 shrink-0">{n.title}:</span>
                    <span className="text-slate-500 truncate">{preview}</span>
                  </div>
                  <button
                    onClick={() => {
                      updateSticky(n.id, { open: true });
                      openStickyBoard(today, n.id);
                      onOpened();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Mở lại</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trash Section Toggle (Rule E2.2: Thùng rác 30 ngày) */}
      <div className="pt-2 border-t border-slate-200">
        <button
          onClick={() => setShowTrash(!showTrash)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Thùng rác ({sortedTrash.length})</span>
        </button>

        {showTrash && (
          <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            {sortedTrash.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Thùng rác trống (ghi chú xóa được lưu 30 ngày).</p>
            ) : (
              <div className="divide-y divide-slate-200">
                {sortedTrash.map(n => {
                  const preview = n.lines.find(l => l.text.trim())?.text || '(Tờ trống)';
                  const daysLeft = Math.max(
                    0,
                    Math.ceil((30 * 24 * 3600 * 1000 - (Date.now() - (n.deletedAt || 0))) / (24 * 3600 * 1000))
                  );
                  return (
                    <div key={n.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{n.title}</span>
                          <span className="text-[10px] text-slate-400">còn {daysLeft} ngày</span>
                        </div>
                        <p className="text-slate-500 truncate mt-0.5">{preview}</p>
                      </div>
                      <button
                        onClick={() => {
                          restoreSticky(n.id);
                          onOpened();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold shadow-2xs shrink-0"
                      >
                        <RotateCcw className="w-3 h-3 text-emerald-600" />
                        <span>Khôi phục</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
