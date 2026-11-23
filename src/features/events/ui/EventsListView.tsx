// TAIO Time App — Events List View (PRD v0.3.43 Part A2 & v0.3.54 Part F)
'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { expandOccurrences, EventOccurrence, ScheduledEvent } from '@/domain/events';
import { defaultLunarProvider, toLunar } from '@/domain/lunar';
import { getDeviceCalendarDate } from '@/core/clock';
import { EventDetailModal } from './EventDetailModal';
import { AddEventModal } from './AddEventModal';
import { 
  Calendar, 
  Clock, 
  RotateCw, 
  Plus, 
  Filter, 
  Moon, 
  ExternalLink, 
  Bookmark, 
  CalendarDays,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export type EventFilterType = 'all' | 'event' | 'routine' | 'external' | 'lunar';

interface EventsListViewProps {
  initialFilter?: EventFilterType;
}

export const EventsListView: React.FC<EventsListViewProps> = ({ initialFilter = 'all' }) => {
  const { scheduledEvents, language, palette } = useApp();
  const isVi = language === 'vi';
  const isCool = palette === 'cool' || palette === 'bright-blue' || palette === 'calm-blue';

  const [activeFilter, setActiveFilter] = useState<EventFilterType>(initialFilter);
  const [selectedOccurrence, setSelectedOccurrence] = useState<EventOccurrence | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const today = getDeviceCalendarDate();

  // Expand occurrences for 365 days starting from beginning of current month
  const expandedList = useMemo(() => {
    const fromDate = today.slice(0, 7) + '-01';
    const d = new Date(fromDate);
    d.setFullYear(d.getFullYear() + 1);
    const toDate = d.toISOString().slice(0, 10);

    const occurrences = expandOccurrences(
      scheduledEvents || [],
      fromDate,
      toDate,
      defaultLunarProvider
    );

    // Map base event recurrence metadata
    const eventMap = new Map<string, ScheduledEvent>();
    for (const ev of (scheduledEvents || [])) {
      eventMap.set(ev.id, ev);
    }

    return occurrences.map(occ => {
      const base = eventMap.get(occ.eventId);
      return {
        ...occ,
        baseEvent: base,
      };
    });
  }, [scheduledEvents, today]);

  // Filter list
  const filteredList = useMemo(() => {
    return expandedList.filter(item => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'event') return item.category === 'event' || !item.category;
      if (activeFilter === 'routine') return item.category === 'routine';
      if (activeFilter === 'external') return item.source?.startsWith('external');
      if (activeFilter === 'lunar') return item.baseEvent?.recurrence?.calendar === 'lunar';
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [expandedList, activeFilter]);

  // Group occurrences by Month (YYYY-MM)
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, typeof filteredList> = {};
    for (const item of filteredList) {
      const monthKey = item.date.slice(0, 7);
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(item);
    }
    return groups;
  }, [filteredList]);

  // Recurrence label helper
  const getRecurrenceLabel = (item: typeof filteredList[0]) => {
    const rec = item.baseEvent?.recurrence;
    if (!rec || rec.freq === 'none') return null;

    if (rec.calendar === 'lunar') {
      return isVi ? 'Lặp Âm lịch hằng năm' : 'Yearly Lunar';
    }
    if (rec.count) {
      return isVi ? `còn ${rec.count} lần` : `${rec.count} left`;
    }
    switch (rec.freq) {
      case 'yearly':
        return isVi ? 'Hằng năm' : 'Yearly';
      case 'daily':
        return isVi ? 'Mỗi ngày' : 'Daily';
      case 'weekly':
        return isVi ? 'Hằng tuần' : 'Weekly';
      case 'monthly':
        return isVi ? 'Hằng tháng' : 'Monthly';
      default:
        return isVi ? 'Lặp lại' : 'Repeating';
    }
  };

  // Format month heading
  const formatMonthHeader = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    if (isVi) {
      return `Tháng ${month}, năm ${year}`;
    }
    const d = new Date(year, (month || 1) - 1, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  // Format day of week
  const formatWeekday = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const day = new Date(y, (m || 1) - 1, d || 1).getDay();
    if (isVi) {
      return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day];
    }
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day];
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
            }`}
          >
            {isVi ? 'Tất cả' : 'All'}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('event')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'event'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100/70'
            }`}
          >
            <CalendarDays size={12} />
            {isVi ? 'Sự kiện' : 'Events'}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('routine')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'routine'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70'
            }`}
          >
            <RotateCw size={12} />
            {isVi ? 'Khung chuẩn' : 'Routine'}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('external')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'external'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ExternalLink size={12} />
            {isVi ? 'Lịch ngoài' : 'External'}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('lunar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'lunar'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100/70'
            }`}
          >
            <Moon size={12} />
            {isVi ? 'Âm lịch' : 'Lunar'}
          </button>
        </div>

        {/* Add Event Button */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            isCool
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              : 'bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)] text-[var(--taio-on-brand)] shadow-xs taio-btn-primary'
          }`}
        >
          <Plus size={14} />
          <span>{isVi ? 'Thêm sự kiện' : 'Add Event'}</span>
        </button>
      </div>

      {/* Events List grouped by Month */}
      {Object.keys(groupedByMonth).length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center text-slate-400 space-y-3 shadow-2xs">
          <Calendar className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
          <p className="text-sm font-medium">
            {isVi ? 'Chưa có sự kiện nào theo bộ lọc này.' : 'No events found matching this filter.'}
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="text-xs text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
          >
            <Plus size={12} />
            {isVi ? 'Tạo sự kiện mới ngay' : 'Create an event now'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByMonth).map(([monthKey, items]) => (
            <div key={monthKey} className="space-y-2">
              {/* Month Header */}
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  <span>{formatMonthHeader(monthKey)}</span>
                  <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                    {items.length}
                  </span>
                </h3>
              </div>

              {/* Event Cards */}
              <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {items.map((item, idx) => {
                  const isToday = item.date === today;
                  const lunar = toLunar(item.date);
                  const recLabel = getRecurrenceLabel(item);

                  return (
                    <div
                      key={`${item.eventId}-${item.date}-${idx}`}
                      onClick={() => setSelectedOccurrence(item)}
                      className="p-3 sm:px-4 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                    >
                      {/* Left: Date Block & Details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Date badge */}
                        <div className={`w-12 text-center shrink-0 py-1 rounded-xl border ${
                          isToday
                            ? 'bg-red-50 border-red-200 text-red-700 font-bold'
                            : 'bg-slate-50 border-slate-200/60 text-slate-700'
                        }`}>
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            {formatWeekday(item.date)}
                          </div>
                          <div className="text-sm font-black leading-tight">
                            {item.date.slice(8)}
                          </div>
                          {lunar && (
                            <div className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                              {lunar.day}/{lunar.month}Â
                            </div>
                          )}
                        </div>

                        {/* Title & Info */}
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </span>

                            {/* Recurrence Badge */}
                            {recLabel && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200/50 shrink-0">
                                <RotateCw size={9} />
                                {recLabel}
                              </span>
                            )}

                            {/* Category Badge */}
                            {item.category === 'routine' && (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/50 shrink-0">
                                {isVi ? 'Khung chuẩn' : 'Routine'}
                              </span>
                            )}
                          </div>

                          {/* Time & Lunar details */}
                          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {item.allDay
                                ? (isVi ? 'Cả ngày' : 'All day')
                                : `${item.start || ''}${item.end ? ` - ${item.end}` : ''}`}
                            </span>

                            {lunar && (
                              <span className="text-slate-400">
                                · {isVi ? `${lunar.day}/${lunar.month} Âm lịch` : `Lunar ${lunar.day}/${lunar.month}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Chevron */}
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedOccurrence && (
        <EventDetailModal
          occurrence={selectedOccurrence}
          onClose={() => setSelectedOccurrence(null)}
        />
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <AddEventModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};
