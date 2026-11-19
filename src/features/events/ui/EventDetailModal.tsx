'use client';

import React from 'react';
import { X, Calendar, Clock, RotateCw, Moon, Trash2, AlertCircle, Smartphone } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { EventOccurrence } from '@/domain/events';

interface EventDetailModalProps {
  occurrence: EventOccurrence | null;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  occurrence,
  onClose,
}) => {
  const { 
    language, 
    scheduledEvents, 
    deleteScheduledEvent, 
    addOccurrenceException,
    showToast 
  } = useApp();

  if (!occurrence) return null;

  const isExternal = occurrence.source?.startsWith('external');
  const baseEvent = !isExternal ? scheduledEvents?.find(e => e.id === occurrence.eventId) : null;

  const handleSkipOccurrence = () => {
    if (confirm(language === 'vi' ? `Bỏ qua sự kiện "${occurrence.title}" riêng ngày hôm nay?` : `Skip "${occurrence.title}" for today?`)) {
      addOccurrenceException(occurrence.eventId, occurrence.date, { skip: true });
      showToast(language === 'vi' ? 'Đã bỏ qua sự kiện hôm nay' : 'Skipped for today');
      onClose();
    }
  };

  const handleDeleteEvent = () => {
    if (confirm(language === 'vi' ? `Xóa vĩnh viễn sự kiện "${occurrence.title}" khỏi lịch?` : `Delete event "${occurrence.title}"?`)) {
      deleteScheduledEvent(occurrence.eventId);
      showToast(language === 'vi' ? 'Đã xóa sự kiện' : 'Event deleted');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[var(--taio-brand)]">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              {language === 'vi' ? 'Chi tiết sự kiện' : 'Event Details'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-[var(--taio-brand)] border border-orange-200">
                {language === 'vi' ? 'Sự kiện' : 'Event'}
              </span>
              {isExternal && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  <span>{language === 'vi' ? 'Lịch iPhone (chỉ xem)' : 'iPhone Calendar'}</span>
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">
              {occurrence.title}
            </h2>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{language === 'vi' ? 'Ngày:' : 'Date:'} <strong className="font-mono">{occurrence.date}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                {occurrence.allDay 
                  ? (language === 'vi' ? 'Diễn ra cả ngày' : 'All day') 
                  : `${occurrence.start} – ${occurrence.end || '?'}`}
              </span>
            </div>

            {baseEvent?.recurrence && baseEvent.recurrence.freq !== 'none' && (
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  {language === 'vi' ? 'Lặp lại:' : 'Recurrence:'} <strong>{baseEvent.recurrence.freq}</strong>
                  {baseEvent.recurrence.calendar === 'lunar' && ' (Âm lịch)'}
                </span>
              </div>
            )}

            {baseEvent?.note && (
              <div className="pt-2 border-t border-slate-200/60 text-slate-600">
                {baseEvent.note}
              </div>
            )}
          </div>

          {isExternal ? (
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {language === 'vi'
                  ? 'Sự kiện này được đọc trực tiếp từ Lịch iPhone. Để chỉnh sửa hoặc xóa, vui lòng mở ứng dụng Lịch của Apple.'
                  : 'This event is read from Apple Calendar. To edit or delete, please open the Apple Calendar app.'}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDeleteEvent}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Xóa sự kiện' : 'Delete'}</span>
              </button>

              <div className="flex items-center gap-2">
                {baseEvent?.recurrence && baseEvent.recurrence.freq !== 'none' && (
                  <button
                    type="button"
                    onClick={handleSkipOccurrence}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    {language === 'vi' ? 'Bỏ qua hôm nay' : 'Skip today'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  {language === 'vi' ? 'Đóng' : 'Close'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
