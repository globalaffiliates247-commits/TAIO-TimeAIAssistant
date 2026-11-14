// TAIO Time App — Lịch ngày mẫu (Template Schedule) Modal (PRD v0.3.33 Part E3.6)
'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TimeBlock } from '@/types';
import { saveDurableState } from '@/core/storage/durableStorage';
import { 
  X, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  RotateCw, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export interface TemplateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateScheduleModal: React.FC<TemplateScheduleModalProps> = ({ isOpen, onClose }) => {
  const { blocks, setBlocks, language, palette } = useApp();
  const isCool = palette === 'cool';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStart, setEditStart] = useState('08:00');
  const [editEnd, setEditEnd] = useState('09:00');

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('12:00');
  const [newEnd, setNewEnd] = useState('12:30');

  if (!isOpen) return null;

  const templateBlocks = (blocks || []).filter(
    b => b.isTemplateBlock || b.blockKind === 'ritual' || b.id === 'b-10' || b.id === 'b-ritual-close'
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleDelete = (id: string) => {
    const next = blocks.filter(b => b.id !== id);
    setBlocks(next);
    saveDurableState('blocks', next, Date.now());
  };

  const handleStartEdit = (b: TimeBlock) => {
    setEditingId(b.id);
    setEditTitle(b.title);
    setEditStart(b.startTime);
    setEditEnd(b.endTime);
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) return;
    const next = blocks.map(b => {
      if (b.id === id) {
        return {
          ...b,
          title: editTitle.trim(),
          startTime: editStart,
          endTime: editEnd,
          isTemplateBlock: true,
          updatedAt: Date.now(),
        };
      }
      return b;
    });
    setBlocks(next);
    saveDurableState('blocks', next, Date.now());
    setEditingId(null);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const nowTs = Date.now();
    const newBlock: TimeBlock = {
      id: `tpl-${nowTs}-${Math.random().toString(36).slice(2, 6)}`,
      title: newTitle.trim(),
      startTime: newStart,
      endTime: newEnd,
      type: 'personal',
      status: 'planned',
      isTemplateBlock: true,
      blockKind: 'ritual',
      estimatedMinutes: 30,
      ageDays: 1,
      updatedAt: nowTs,
    };
    const next = [...blocks, newBlock];
    setBlocks(next);
    saveDurableState('blocks', next, nowTs);
    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div className="fixed app-overlay-safe z-50 bg-black/40 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain shadow-2xl p-6 sm:p-7 text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${
              isCool 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-red-50 border-red-200 text-[#E0401F]'
            }`}>
              <RotateCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {language === 'vi' ? 'Lịch ngày mẫu' : 'Daily Template Schedule'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'vi' 
                  ? 'Các khung giờ cố định lặp lại mỗi ngày (ăn, nghỉ, nghi thức)' 
                  : 'Recurring daily anchor slots (meals, rest, daily rituals)'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of template blocks */}
        <div className="space-y-2.5 mb-5">
          {templateBlocks.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              {language === 'vi' ? 'Chưa có khung giờ mẫu nào.' : 'No template slots configured.'}
            </div>
          ) : (
            templateBlocks.map(b => {
              const isEditingThis = editingId === b.id;

              if (isEditingThis) {
                return (
                  <div key={b.id} className="p-3 rounded-2xl border border-amber-300 bg-amber-50/50 space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none"
                    />
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 text-[11px]">Bắt đầu:</span>
                        <input
                          type="time"
                          value={editStart}
                          onChange={e => setEditStart(e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 text-[11px]">Kết thúc:</span>
                        <input
                          type="time"
                          value={editEnd}
                          onChange={e => setEditEnd(e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                        />
                      </div>
                      <div className="flex-1 flex justify-end gap-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 rounded-lg text-slate-500 hover:bg-slate-200 text-xs"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleSaveEdit(b.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={b.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white flex items-center justify-between gap-3 transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold shrink-0">
                      {b.startTime} - {b.endTime}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                        <span>🔁</span>
                        <span>{b.title}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEdit(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                      title={language === 'vi' ? 'Sửa' : 'Edit'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title={language === 'vi' ? 'Xóa khỏi lịch mẫu' : 'Delete from template'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add new template slot form */}
        {isAdding ? (
          <form onSubmit={handleAddNew} className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-2.5 mb-4">
            <h4 className="text-xs font-bold text-slate-800">
              {language === 'vi' ? 'Thêm khung giờ mẫu mới' : 'Add New Template Slot'}
            </h4>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder={language === 'vi' ? 'Ví dụ: Ăn trưa & Nghỉ ngơi...' : 'e.g. Lunch & Break...'}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none"
            />
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[11px]">Bắt đầu:</span>
                <input
                  type="time"
                  value={newStart}
                  onChange={e => setNewStart(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[11px]">Kết thúc:</span>
                <input
                  type="time"
                  value={newEnd}
                  onChange={e => setNewEnd(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                />
              </div>
              <div className="flex-1 flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-200 text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-xl text-white font-bold text-xs ${
                    isCool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#E0401F] hover:bg-[#c93517]'
                  }`}
                >
                  Thêm
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors mb-4"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'vi' ? 'Thêm khung giờ mẫu' : 'Add Template Slot'}</span>
          </button>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            {language === 'vi' ? 'Hoàn tất' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};
