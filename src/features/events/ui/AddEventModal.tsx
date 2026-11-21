'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, Bell, Tag, RotateCw, Moon, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getDeviceCalendarDate } from '@/core/clock';
import type { 
  ScheduledEvent, 
  EventCategory, 
  RecurrenceFrequency, 
  CalendarType, 
  ReminderLevel, 
  EventReminder 
} from '@/domain/events';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  initialDate,
}) => {
  const { language, addScheduledEvent, showToast, palette } = useApp();
  const isCool = palette === 'cool';

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(initialDate || getDeviceCalendarDate());
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [timeError, setTimeError] = useState<string | null>(null);

  // Recurrence
  const [freq, setFreq] = useState<RecurrenceFrequency>('none');
  const [isLunar, setIsLunar] = useState(false);

  // Category
  const [category, setCategory] = useState<EventCategory>('event');

  // Reminders
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTiming, setReminderTiming] = useState<'day_of' | 'days_before'>('days_before');
  const [reminderDays, setReminderDays] = useState(1);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [reminderLevel, setReminderLevel] = useState<ReminderLevel>('gentle');

  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert(language === 'vi' ? 'Vui lòng nhập tên sự kiện' : 'Please enter event title');
      return;
    }

    if (!isAllDay && startTime && endTime && startTime >= endTime) {
      setTimeError(language === 'vi' ? 'Giờ bắt đầu phải trước giờ kết thúc' : 'Start time must be before end time');
      return;
    }

    const reminders: EventReminder[] = [];
    if (hasReminder) {
      reminders.push({
        trigger: reminderTiming === 'days_before' ? 'days_before' : 'day_of',
        amount: reminderTiming === 'days_before' ? reminderDays : 0,
        time: reminderTime,
        level: reminderLevel,
      });
    }

    const newEvent: Omit<ScheduledEvent, 'id' | 'updatedAt'> = {
      title: title.trim(),
      startDate,
      allDay: isAllDay,
      start: isAllDay ? undefined : startTime,
      end: isAllDay ? undefined : endTime,
      category,
      note: note.trim() || undefined,
      source: 'taio',
      recurrence: freq !== 'none' ? {
        freq,
        calendar: (freq === 'yearly' && isLunar) ? 'lunar' : 'solar',
      } : undefined,
      reminders: reminders.length > 0 ? reminders : undefined,
    };

    addScheduledEvent(newEvent);
    showToast(language === 'vi' ? `✓ Đã thêm sự kiện "${title.trim()}"` : `✓ Added event "${title.trim()}"`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[var(--taio-brand)]">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              {language === 'vi' ? 'Thêm sự kiện mới' : 'Add New Event'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              {language === 'vi' ? 'Tên sự kiện *' : 'Event Title *'}
            </label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={language === 'vi' ? 'Ví dụ: Thăm Thầy Thiện, Sinh nhật mẹ...' : 'e.g., Visit teacher, Birthday...'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[var(--taio-brand)]"
              autoFocus
              required
            />
          </div>

          {/* Date & All Day Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                {language === 'vi' ? 'Ngày diễn ra *' : 'Event Date *'}
              </label>
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-[var(--taio-brand)]"
                required
              />
            </div>

            <div className="space-y-1 flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                <input 
                  type="checkbox"
                  checked={isAllDay}
                  onChange={e => setIsAllDay(e.target.checked)}
                  className="rounded text-[var(--taio-brand)] focus:ring-[var(--taio-brand)]"
                />
                <span className="text-xs font-semibold text-slate-700">
                  {language === 'vi' ? 'Sự kiện cả ngày' : 'All-day event'}
                </span>
              </label>
            </div>
          </div>

          {/* Start / End Time if not all day */}
          {!isAllDay && (
            <div className="space-y-1 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    {language === 'vi' ? 'Giờ bắt đầu' : 'Start time'}
                  </label>
                  <input 
                    type="time"
                    value={startTime}
                    onChange={e => {
                      setStartTime(e.target.value);
                      setTimeError(null);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    {language === 'vi' ? 'Giờ kết thúc' : 'End time'}
                  </label>
                  <input 
                    type="time"
                    value={endTime}
                    onChange={e => {
                      setEndTime(e.target.value);
                      setTimeError(null);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>
              {timeError && (
                <p className="text-[11px] text-red-600 font-semibold">{timeError}</p>
              )}
            </div>
          )}

          {/* Recurrence & Lunar option */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'vi' ? 'Lặp lại' : 'Recurrence'}</span>
              </label>
              <select
                value={freq}
                onChange={e => setFreq(e.target.value as RecurrenceFrequency)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800"
              >
                <option value="none">{language === 'vi' ? 'Không lặp' : 'Does not repeat'}</option>
                <option value="daily">{language === 'vi' ? 'Hàng ngày' : 'Daily'}</option>
                <option value="weekly">{language === 'vi' ? 'Hàng tuần' : 'Weekly'}</option>
                <option value="monthly">{language === 'vi' ? 'Hàng tháng' : 'Monthly'}</option>
                <option value="yearly">{language === 'vi' ? 'Hàng năm (Sinh nhật, Giỗ...)' : 'Yearly'}</option>
              </select>
            </div>

            {freq === 'yearly' && (
              <label className="flex items-center gap-2 pt-2 border-t border-slate-200/60 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={isLunar}
                  onChange={e => setIsLunar(e.target.checked)}
                  className="rounded text-[var(--taio-brand)] focus:ring-[var(--taio-brand)]"
                />
                <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-amber-500" />
                  <span>{language === 'vi' ? 'Tính theo Âm lịch (cho ngày giỗ, Tết...)' : 'Lunar Calendar'}</span>
                </span>
              </label>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'vi' ? 'Phân loại' : 'Category'}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('event')}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  category === 'event' 
                    ? 'bg-orange-50 border-[var(--taio-brand)] text-[var(--taio-brand)]' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {language === 'vi' ? '📅 Sự kiện' : 'Event'}
              </button>
              <button
                type="button"
                onClick={() => setCategory('routine')}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  category === 'routine' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {language === 'vi' ? '⚡ Thói quen' : 'Routine'}
              </button>
              <button
                type="button"
                onClick={() => setCategory('ritual')}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  category === 'ritual' 
                    ? 'bg-purple-50 border-purple-500 text-purple-700' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {language === 'vi' ? '✨ Nghi thức' : 'Ritual'}
              </button>
            </div>
          </div>

          {/* Reminders */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'vi' ? 'Cài đặt nhắc nhở' : 'Reminders'}</span>
              </span>
              <input 
                type="checkbox"
                checked={hasReminder}
                onChange={e => setHasReminder(e.target.checked)}
                className="rounded text-[var(--taio-brand)] focus:ring-[var(--taio-brand)]"
              />
            </label>

            {hasReminder && (
              <div className="pt-2 border-t border-slate-200/60 space-y-2.5">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <select
                    value={reminderTiming}
                    onChange={e => setReminderTiming(e.target.value as any)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium"
                  >
                    <option value="days_before">{language === 'vi' ? 'Trước ngày diễn ra' : 'Days before'}</option>
                    <option value="day_of">{language === 'vi' ? 'Đúng ngày diễn ra' : 'Day of event'}</option>
                  </select>

                  {reminderTiming === 'days_before' && (
                    <div className="flex items-center gap-1">
                      <input 
                        type="number"
                        min={1}
                        max={30}
                        value={reminderDays}
                        onChange={e => setReminderDays(Math.max(1, Number(e.target.value) || 1))}
                        className="w-12 px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs text-center font-mono"
                      />
                      <span className="text-slate-600">{language === 'vi' ? 'ngày lúc' : 'days at'}</span>
                    </div>
                  )}

                  <input 
                    type="time"
                    value={reminderTime}
                    onChange={e => setReminderTime(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">{language === 'vi' ? 'Mức độ:' : 'Level:'}</span>
                  <button
                    type="button"
                    onClick={() => setReminderLevel('gentle')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      reminderLevel === 'gentle' 
                        ? 'bg-amber-50 border-amber-400 text-amber-800' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {language === 'vi' ? '🔔 Nhẹ nhàng (Thông báo)' : 'Gentle'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderLevel('loud')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      reminderLevel === 'loud' 
                        ? 'bg-rose-50 border-rose-400 text-rose-800' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {language === 'vi' ? '🚨 Báo động (Chuông)' : 'Loud'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              {language === 'vi' ? 'Ghi chú thêm (tuỳ chọn)' : 'Notes (optional)'}
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder={language === 'vi' ? 'Chi tiết, địa điểm, người tham gia...' : 'Details, location...'}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[var(--taio-brand)]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)]"
            >
              {language === 'vi' ? 'Lưu sự kiện' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
