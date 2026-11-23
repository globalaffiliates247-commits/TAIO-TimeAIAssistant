// TAIO Time App — PlanTab Component (PRD v0.3.33 Part E)
'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TimeBlock, BlockType } from '../types';
import { IMPORTANT_NOT_URGENT_BACKLOG } from '../data/mockData';
import { DailyCardView } from './DailyCardView';
import {
  computeBlockStatus,
  getBlockStatusDisplay,
  useDeviceClock,
  getDeviceCalendarDate,
  timeToMinutes,
  minutesToTime,
} from '../core/clock';
import { 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle, 
  Sparkles, 
  Target, 
  Layers, 
  LayoutGrid,
  FileText,
  Trash2,
  Edit2,
  Check,
  X,
  RotateCw,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-react';
import { updateScheduleEntry } from '@/features/tasks';
import { TemplateScheduleModal } from '@/features/schedule-template';
import { AddEventModal, EventsListView, type EventFilterType } from '@/features/events';
import { PlanVsRealityView } from '@/features/plan-reality';
import { useT } from '@/i18n/useT';

const TYPE_CONFIG: Record<BlockType, { labelVi: string; labelEn: string; bg: string; text: string; border: string }> = {
  deep: { labelVi: 'Tập trung sâu', labelEn: 'Deep Work', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/70' },
  meeting: { labelVi: 'Họp & Trao đổi', labelEn: 'Meeting', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/70' },
  interruption: { labelVi: 'Quỹ gián đoạn', labelEn: 'Interruption', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/70' },
  personal: { labelVi: 'Cá nhân & Nghỉ', labelEn: 'Personal & Rest', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/70' },
  planning: { labelVi: 'Lập kế hoạch', labelEn: 'Planning', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200/70' },
};

export const PlanTab: React.FC = () => {
  const { 
    blocks, 
    scheduleBlocks, 
    goals, 
    profile, 
    addNewBlock, 
    addDailyCardItem, 
    updateDailyCardItem, 
    setBlocks, 
    dailyCardItems, 
    openDrilldown,
    language,
    palette
  } = useApp();
  const { t } = useT();
  const { nowMinutes, todayLabel } = useDeviceClock();
  const isCool = palette === 'cool' || palette === 'bright-blue' || palette === 'calm-blue';

  const [activeView, setActiveView] = useState<'card' | 'timeline' | 'reality' | 'matrix' | 'events'>('card');
  const [eventsFilter, setEventsFilter] = useState<EventFilterType>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAddEventModal, setShowAddEventModal] = useState<boolean>(false);
  const [templateModalOpen, setTemplateModalOpen] = useState<boolean>(false);

  React.useEffect(() => {
    const handleOpenEvents = (e: any) => {
      setActiveView('events');
      if (e?.detail?.filter) {
        setEventsFilter(e.detail.filter);
      }
    };
    window.addEventListener('taio:open-events-list', handleOpenEvents);
    return () => window.removeEventListener('taio:open-events-list', handleOpenEvents);
  }, []);

  const [newTitle, setNewTitle] = useState<string>('');
  const [newType, setNewType] = useState<BlockType>('deep');
  const [newStartTime, setNewStartTime] = useState<string>('16:00');
  const [newEndTime, setNewEndTime] = useState<string>('17:00');
  const [newGoalId, setNewGoalId] = useState<string>(goals[0]?.id || '');
  const [addTimeError, setAddTimeError] = useState<string>('');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingStart, setEditingStart] = useState<string>('09:00');
  const [editingEnd, setEditingEnd] = useState<string>('10:00');

  // v0.3.40 Part B: Collapsible Weekly Budget & Completed Timetable tasks
  const [isBudgetExpanded, setIsBudgetExpanded] = useState<boolean>(false);
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState<boolean>(true);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Validate: giờ bắt đầu phải trước giờ kết thúc
    const startMins = timeToMinutes(newStartTime);
    const endMins = timeToMinutes(newEndTime);
    if (startMins >= endMins) {
      setAddTimeError(language === 'vi'
        ? 'Giờ bắt đầu phải trước giờ kết thúc'
        : 'Start time must be before end time');
      return;
    }
    setAddTimeError('');

    const goal = goals.find(g => g.id === newGoalId);
    
    // Part E3.2: Unified - adds to dailyCardItems for today
    addDailyCardItem({
      text: newTitle.trim(),
      start: newStartTime,
      end: newEndTime,
      goalId: newGoalId || undefined,
      goalName: goal ? goal.name : undefined,
      origin: 'planned',
      date: getDeviceCalendarDate(),
      extra: {
        blockType: newType,
        typeExplicitlyChosen: true,
      },
    });

    setNewTitle('');
    setAddTimeError('');
    setShowAddModal(false);
  };

  const handleAcceptBacklogItem = (item: typeof IMPORTANT_NOT_URGENT_BACKLOG[0]) => {
    const goal = goals.find(g => g.id === item.goalId);
    addDailyCardItem({
      text: item.title,
      start: '17:30',
      end: '18:15',
      goalId: item.goalId,
      goalName: goal?.name,
      origin: 'planned',
      date: getDeviceCalendarDate(),
      extra: {
        blockType: 'deep',
        typeExplicitlyChosen: true,
      },
    });
    alert(language === 'en'
      ? `Added "${item.title}" to today's schedule at 17:30!`
      : `Đã đưa "${item.title}" vào lịch hôm nay lúc 17:30!`);
  };

  const sortedBlocks = [...scheduleBlocks]
    .filter(b => Boolean(b.startTime && b.endTime) && b.status !== 'dropped')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* v0.3.40 Part B1: Single compact row header (~44px) */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        {/* View Switcher: Thẻ ngày vs Thời gian biểu */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveView('card')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'card' 
                ? 'bg-[var(--taio-brand)] text-[var(--taio-on-brand)] shadow-xs taio-btn-primary'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('terms.dailyCard', 'Thẻ ngày')}</span>
          </button>
          <button
            onClick={() => setActiveView('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'timeline' 
                ? 'bg-[var(--taio-brand)] text-[var(--taio-on-brand)] shadow-xs taio-btn-primary'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('terms.timetable', 'Thời gian biểu')}</span>
          </button>
          <button
            onClick={() => { setActiveView('events'); setEventsFilter('all'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'events' 
                ? 'bg-[var(--taio-brand)] text-[var(--taio-on-brand)] shadow-xs taio-btn-primary'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Sự kiện' : 'Events'}</span>
          </button>
          <button
            onClick={() => setActiveView('reality')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'reality' 
                ? 'bg-[var(--taio-brand)] text-[var(--taio-on-brand)] shadow-xs taio-btn-primary'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'So với thực tế' : 'Plan vs Reality'}</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveView('events');
              setEventsFilter('routine');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all"
            title={t('plan.templateTitle', 'Quản lý lịch ngày mẫu cố định')}
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{t('terms.templateSchedule', 'Lịch mẫu')}</span>
          </button>

          <button
            onClick={() => setShowAddEventModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all"
            title={t('plan.addEventTitle', 'Thêm sự kiện, sinh nhật, ngày lễ, giỗ...')}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('plan.addEvent', 'Thêm sự kiện')}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[var(--taio-on-brand)] text-xs font-bold shadow-xs transition-all bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)] taio-btn-primary"
          >
            <Plus className="w-4 h-4 text-[var(--taio-on-brand)]" />
            <span>{t('plan.addTask', 'Thêm việc')}</span>
          </button>
        </div>
      </div>

      {activeView === 'card' && <DailyCardView />}
      {activeView === 'events' && <EventsListView initialFilter={eventsFilter} />}
      {activeView === 'reality' && <PlanVsRealityView />}
      {activeView === 'timeline' && (
        <>
          {/* v0.3.40 Part B3: Weekly Budget Progress (Phương án A - Stacked 40h bar, collapsible < 140px) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--taio-brand)]" />
                <span>{language === 'en' ? 'Weekly Budget' : 'Ngân sách tuần'}</span>
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600 font-medium">18 / 40 {language === 'en' ? 'hours' : 'giờ'}</span>
                <button
                  onClick={() => setIsBudgetExpanded(prev => !prev)}
                  className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors"
                >
                  <span>{isBudgetExpanded ? (language === 'en' ? 'Collapse' : 'Thu gọn') : (language === 'en' ? 'View all' : 'Xem tất cả')}</span>
                  {isBudgetExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Stacked 40h Progress Bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/80 flex shadow-inner">
              {goals.map((g, idx) => {
                const colors = ['bg-[var(--taio-brand)]', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-sky-500', 'bg-rose-400'];
                const slicePercent = Math.min(100, (g.dailyBudgetMins * 5 / 60) / 40 * 100);
                return (
                  <div
                    key={g.id}
                    className={`h-full ${colors[idx % colors.length]} transition-all`}
                    style={{ width: `${slicePercent * (g.progressPercent / 100)}%` }}
                    title={`${g.name}: ${g.progressPercent}%`}
                  />
                );
              })}
              {/* Interruption reserve slice */}
              <div className="h-full bg-amber-400/80" style={{ width: '8.75%' }} title={language === 'en' ? 'Interruption reserve: 3.5h / 40h' : 'Quỹ gián đoạn: 3.5h / 40h'} />
            </div>

            {/* Collapsed view: Top 3 pace lag goals */}
            {!isBudgetExpanded ? (
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 pt-1">
                <span className="font-semibold text-slate-700">{language === 'en' ? 'Focus on:' : 'Cần chú ý:'}</span>
                {goals.slice(0, 3).map((g) => (
                  <span
                    key={g.id}
                    onClick={() => openDrilldown({
                      type: 'goal_tasks',
                      title: language === 'en' ? `Budget & Tasks: ${g.name}` : `Ngân sách & Nhiệm vụ: ${g.name}`,
                      subtitle: language === 'en' ? `Weekly budget: ${g.dailyBudgetMins * 5 / 60} hours/week` : `Ngân sách tuần: ${g.dailyBudgetMins * 5 / 60} giờ/tuần`,
                      goalId: g.id,
                    })}
                    className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
                  >
                    {g.name} ({g.progressPercent}%)
                  </span>
                ))}
              </div>
            ) : (
              /* Expanded view: ~36px clean goal rows */
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                {goals.map(g => (
                  <div
                    key={g.id}
                    onClick={() => openDrilldown({
                      type: 'goal_tasks',
                      title: language === 'en' ? `Budget & Tasks: ${g.name}` : `Ngân sách & Nhiệm vụ: ${g.name}`,
                      subtitle: language === 'en' ? `Weekly budget: ${g.dailyBudgetMins * 5 / 60} hours/week` : `Ngân sách tuần: ${g.dailyBudgetMins * 5 / 60} giờ/tuần`,
                      goalId: g.id,
                    })}
                    className="h-9 px-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-between text-xs cursor-pointer group transition-colors"
                  >
                    <span className="text-slate-800 font-medium group-hover:text-slate-900 truncate max-w-[200px] sm:max-w-xs">{g.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 sm:w-36 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-[var(--taio-brand)] rounded-full transition-all"
                          style={{ width: `${Math.min(100, g.progressPercent)}%` }}
                        />
                      </div>
                      <span className="text-slate-500 font-medium w-16 text-right">{g.dailyBudgetMins * 5 / 60}{language === 'en' ? 'h/week' : 'h/tuần'}</span>
                    </div>
                  </div>
                ))}

                {/* Interruption Reserve */}
                <div
                  onClick={() => openDrilldown({
                    type: 'interruptions',
                    title: language === 'en' ? 'Weekly Interruption Reserve (3.5 hrs / 7.5 hrs)' : 'Quỹ dự phòng gián đoạn tuần (3.5 giờ / 7.5 giờ)',
                    subtitle: language === 'en' ? 'Click to view interruptions list' : 'Bấm để xem danh sách việc chen ngang',
                  })}
                  className="h-9 px-3 rounded-xl hover:bg-amber-50/50 border border-transparent hover:border-amber-200 flex items-center justify-between text-xs cursor-pointer group transition-colors"
                >
                  <span className="text-amber-800 font-medium">{language === 'en' ? 'Interruption Reserve' : 'Quỹ dự phòng gián đoạn'}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 sm:w-36 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                      <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: '47%' }} />
                    </div>
                    <span className="text-amber-700 font-medium w-16 text-right">3.5 / 7.5h</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* v0.3.40 Part B4: Timetable List (Thời gian biểu gọn) */}
          {(() => {
            const activeBlocks = sortedBlocks.filter(b => computeBlockStatus(b, nowMinutes, getDeviceCalendarDate()) !== 'done');
            const completedBlocks = sortedBlocks.filter(b => computeBlockStatus(b, nowMinutes, getDeviceCalendarDate()) === 'done');

            return (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--taio-brand)]" />
                    <span>{language === 'en' ? 'Schedule' : 'Thời gian biểu'} ({todayLabel})</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    {language === 'en' ? 'Profile:' : 'Hồ sơ:'} <strong className="text-slate-900">{profile.title}</strong>
                  </span>
                </div>

                {/* Active Blocks List */}
                <div className="space-y-2">
                  {activeBlocks.map((block, idx) => {
                    const prevBlock = idx > 0 ? activeBlocks[idx - 1] : null;
                    const prevEndMins = prevBlock ? timeToMinutes(prevBlock.endTime) : null;
                    const curStartMins = timeToMinutes(block.startTime);
                    const hasGap = prevEndMins !== null && curStartMins > prevEndMins;
                    const gapMins = hasGap ? curStartMins - prevEndMins : 0;

                    const isTemplate = block.isTemplateBlock || block.blockKind === 'ritual' || block.id === 'b-10' || block.id === 'b-user-dayclose' || block.id === 'b-ritual-close';
                    const conf = TYPE_CONFIG[block.type] || TYPE_CONFIG.deep;
                    const computedStatus = computeBlockStatus(block, nowMinutes, getDeviceCalendarDate());
                    const statusDisplay = getBlockStatusDisplay(computedStatus, language);
                    const isCurrent = computedStatus === 'in_progress';
                    const isEditingTitle = editingId === block.id;
                    const isEditingTime = editingTimeId === block.id;
                    const isParallel = Boolean(block.parallelOf || (block.extra as Record<string, unknown> | undefined)?.parallelOf);
                    const typeExplicitlyChosen = (block.extra as Record<string, unknown> | undefined)?.typeExplicitlyChosen || isTemplate;

                    return (
                      <React.Fragment key={block.id}>
                        {hasGap && (
                          <div className="p-2 sm:p-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {language === 'vi'
                                  ? `Trống ${gapMins >= 60 ? `${Math.floor(gapMins / 60)}g ` : ''}${gapMins % 60 ? `${gapMins % 60}p ` : ''}đến ${block.startTime}`
                                  : `Free ${gapMins}m until ${block.startTime}`}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setNewStartTime(prevBlock!.endTime);
                                setNewEndTime(block.startTime);
                                setAddTimeError('');
                                setShowAddModal(true);
                              }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 shadow-2xs transition-colors"
                            >
                              <Plus className="w-3 h-3 text-[var(--taio-brand)]" />
                              <span>{language === 'vi' ? 'Xếp việc' : 'Add task'}</span>
                            </button>
                          </div>
                        )}

                        {/* Template/Routine block: thin single-row band (~36-40px), subtle styling */}
                        {isTemplate ? (
                          <div className="p-2 sm:p-2.5 rounded-xl border border-slate-200/70 bg-slate-50/70 hover:bg-slate-100/60 transition-all flex items-center justify-between gap-2 group">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] font-mono font-medium shrink-0">
                                {block.startTime} – {block.endTime}
                              </span>
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                <span>🔁</span>
                                <span>{language === 'en' ? 'Fixed' : 'Cố định'}</span>
                              </span>
                              <span className="text-xs font-medium text-slate-700 truncate" title={block.title}>
                                {block.title}
                              </span>
                            </div>

                            {/* Actions visible on hover / focus */}
                            <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-1.5 shrink-0 transition-opacity">
                              <button
                                onClick={() => updateScheduleEntry(block.id, { status: 'dropped' }, { updateDailyCardItem, setBlocks, dailyCardItems })}
                                className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200 transition-colors shadow-2xs"
                                title={language === 'en' ? 'Skip this slot for today only' : 'Bỏ qua khung này cho riêng hôm nay'}
                              >
                                {language === 'en' ? 'Skip' : 'Bỏ qua'}
                              </button>
                              <button
                                onClick={() => setTemplateModalOpen(true)}
                                className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200 transition-colors shadow-2xs"
                                title={language === 'en' ? 'Edit template' : 'Sửa lịch mẫu'}
                              >
                                {language === 'en' ? 'Edit template' : 'Sửa mẫu'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Real user task: compact ~44px row */
                          <div
                            className={`p-2.5 sm:p-3 rounded-2xl transition-all space-y-1.5 group ${
                              isParallel ? 'ml-5 border-l-4 border-l-indigo-400 pl-3 bg-indigo-50/40' : ''
                            } ${
                              isCurrent 
                                ? 'border-2 border-[var(--taio-brand)] bg-orange-50/60 shadow-xs ring-1 ring-[var(--taio-brand)]/20'
                                : isParallel
                                  ? 'border border-slate-200 hover:border-slate-300 bg-white shadow-2xs'
                                  : 'border border-slate-200 border-l-[3.5px] border-l-sky-500 hover:border-slate-300 bg-white shadow-2xs'
                            }`}
                          >
                            {/* Row 1: Time, Type, Status, Actions */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isParallel && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                    ∥ {language === 'en' ? 'Parallel' : 'Song song'}
                                  </span>
                                )}

                                {/* Time edit button */}
                                {isEditingTime ? (
                                  <div className="flex items-center gap-1 text-xs shrink-0">
                                    <input
                                      type="time"
                                      value={editingStart}
                                      onChange={e => setEditingStart(e.target.value)}
                                      className="px-2 py-0.5 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                                    />
                                    <span>-</span>
                                    <input
                                      type="time"
                                      value={editingEnd}
                                      onChange={e => setEditingEnd(e.target.value)}
                                      className="px-2 py-0.5 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                                    />
                                    <button
                                      onClick={() => {
                                        updateScheduleEntry(block.id, { startTime: editingStart, endTime: editingEnd }, { updateDailyCardItem, setBlocks, dailyCardItems });
                                        setEditingTimeId(null);
                                      }}
                                      className="p-1 rounded-md bg-emerald-600 text-white"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setEditingTimeId(null)}
                                      className="p-1 rounded-md text-slate-400 hover:bg-slate-200"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingTimeId(block.id);
                                      setEditingStart(block.startTime);
                                      setEditingEnd(block.endTime);
                                    }}
                                    title={language === 'en' ? 'Click to change time' : 'Bấm để đổi giờ'}
                                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-mono font-semibold transition-colors shrink-0"
                                  >
                                    {block.startTime} – {block.endTime}
                                  </button>
                                )}

                                {/* Type tag */}
                                {typeExplicitlyChosen && (
                                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${conf.bg} ${conf.text} ${conf.border}`}>
                                    {language === 'en' ? conf.labelEn : conf.labelVi}
                                  </span>
                                )}

                                {/* Status badge (WCAG AA 4.5:1 contrast) */}
                                <span className={`px-2 py-0.5 rounded-md text-[11px] ${statusDisplay.badgeClass}`}>
                                  {statusDisplay.label}
                                </span>

                                {block.goalName && (
                                  <span className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                                    <Target className="w-3 h-3 text-red-500 shrink-0" />
                                    <span className="truncate max-w-[150px]">{block.goalName}</span>
                                  </span>
                                )}
                              </div>

                              <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-1 shrink-0 ml-auto transition-opacity">
                                <button
                                  onClick={() => {
                                    if (confirm(language === 'en' ? 'Remove this task from schedule?' : 'Xóa công việc này khỏi lịch?')) {
                                      updateScheduleEntry(block.id, { status: 'dropped' }, { updateDailyCardItem, setBlocks, dailyCardItems });
                                    }
                                  }}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title={language === 'en' ? 'Delete task' : 'Xóa công việc'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Row 2: Title full-width */}
                            <div>
                              {isEditingTitle ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={e => setEditingTitle(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        updateScheduleEntry(block.id, { title: editingTitle.trim() }, { updateDailyCardItem, setBlocks, dailyCardItems });
                                        setEditingId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingId(null);
                                      }
                                    }}
                                    className="w-full px-2.5 py-1 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      updateScheduleEntry(block.id, { title: editingTitle.trim() }, { updateDailyCardItem, setBlocks, dailyCardItems });
                                      setEditingId(null);
                                    }}
                                    className="p-1 rounded-md bg-emerald-600 text-white"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <h4
                                  onClick={() => {
                                    setEditingId(block.id);
                                    setEditingTitle(block.title);
                                  }}
                                  title={language === 'en' ? 'Click to edit title' : 'Bấm để sửa tên'}
                                  className="text-sm font-semibold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors leading-snug"
                                >
                                  {block.title}
                                </h4>
                              )}
                            </div>

                            {/* Row 3: Next step (if any) */}
                            {block.nextStep && (
                              <p className="text-amber-800 bg-amber-50 border border-amber-200/60 rounded-md px-2 py-0.5 text-xs font-medium inline-block">
                                {language === 'en' ? 'Next step:' : 'Bước kế tiếp:'} {block.nextStep}
                              </p>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Collapsible Completed Tasks Section at bottom */}
                {completedBlocks.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setIsCompletedCollapsed(prev => !prev)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-xs font-semibold text-slate-600 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{language === 'en' ? `Completed (${completedBlocks.length} tasks)` : `Đã hoàn thành (${completedBlocks.length} việc)`}</span>
                      </span>
                      {isCompletedCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                    </button>

                    {!isCompletedCollapsed && (
                      <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-slate-200">
                        {completedBlocks.map(block => (
                          <div key={block.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono text-[11px] text-slate-400">{block.startTime} – {block.endTime}</span>
                              <span className="line-through text-slate-400 truncate">{block.title}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[10px] font-semibold shrink-0">
                              {language === 'en' ? '✓ Done' : '✓ Xong'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Important, Not Urgent List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{language === 'en' ? 'Important, Not Urgent' : 'Việc quan trọng, chưa khẩn'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'en'
                    ? 'Recurring items that maintain long-term momentum. Click "Do this week" to schedule.'
                    : 'Các đầu việc định kỳ giúp duy trì đà phát triển dài hạn. Bấm "Làm tuần này" để đưa vào lịch.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {IMPORTANT_NOT_URGENT_BACKLOG.map(item => (
                <div key={item.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-all">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                      {language === 'en' ? 'Est:' : 'Dự kiến:'} {item.defaultMinutes} {language === 'en' ? 'mins' : 'phút'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAcceptBacklogItem(item)}
                    className="px-3.5 py-1.5 rounded-xl text-[var(--taio-on-brand)] text-xs font-bold shadow-sm transition-all shrink-0 bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)] taio-btn-primary"
                  >
                    {language === 'en' ? 'Do this week' : 'Làm tuần này'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add Block Modal */}
      {showAddModal && (
        <div className="fixed app-overlay-safe z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl text-slate-900">
            <h3 className="text-base font-bold mb-4">{language === 'en' ? 'Add New Task' : 'Thêm công việc mới'}</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{language === 'en' ? 'Task Title' : 'Tên công việc'}</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. Review contract...' : 'Ví dụ: Rà soát hợp đồng...'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--taio-brand)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{language === 'en' ? 'Start Time' : 'Giờ bắt đầu'}</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={e => {
                      const val = e.target.value;
                      setNewStartTime(val);
                      setAddTimeError('');
                      // Auto-adjust end time: if new start >= current end, push end = start + 30p
                      const startM = timeToMinutes(val);
                      const endM = timeToMinutes(newEndTime);
                      if (startM >= endM) {
                        setNewEndTime(minutesToTime((startM + 30) % 1440));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[var(--taio-brand)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{language === 'en' ? 'End Time' : 'Giờ kết thúc'}</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={e => {
                      const endVal = e.target.value;
                      setNewEndTime(endVal);
                      const startM = timeToMinutes(newStartTime);
                      const endM = timeToMinutes(endVal);
                      if (startM >= endM) {
                        setAddTimeError(language === 'vi'
                          ? 'Giờ bắt đầu phải trước giờ kết thúc'
                          : 'Start time must be before end time');
                      } else {
                        setAddTimeError('');
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-slate-100 border text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 ${
                      addTimeError ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-200 focus:ring-[var(--taio-brand)]'
                    }`}
                  />
                </div>
              </div>
              {addTimeError && (
                <p className="text-xs text-red-500 font-medium -mt-1">{addTimeError}</p>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{language === 'en' ? 'Block Type' : 'Loại khối'}</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as BlockType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--taio-brand)]"
                >
                  <option value="deep">{language === 'en' ? 'Deep Work' : 'Tập trung sâu'}</option>
                  <option value="meeting">{language === 'en' ? 'Meeting' : 'Họp & Trao đổi'}</option>
                  <option value="interruption">{language === 'en' ? 'Interruption Reserve' : 'Quỹ gián đoạn'}</option>
                  <option value="personal">{language === 'en' ? 'Personal & Rest' : 'Cá nhân & Nghỉ'}</option>
                  <option value="planning">{language === 'en' ? 'Planning' : 'Lập kế hoạch'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{language === 'en' ? 'Linked Goal (optional)' : 'Mục tiêu liên kết (tùy chọn)'}</label>
                <select
                  value={newGoalId}
                  onChange={e => setNewGoalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--taio-brand)]"
                >
                  <option value="">{language === 'en' ? 'No linked goal' : 'Không gắn mục tiêu'}</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setAddTimeError(''); }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  {language === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={timeToMinutes(newStartTime) >= timeToMinutes(newEndTime)}
                  className="px-5 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-[var(--taio-on-brand)] text-xs font-bold shadow-md transition-all bg-[var(--taio-brand)] hover:bg-[var(--taio-brand-hover)] taio-btn-primary"
                >
                  {language === 'en' ? 'Add to schedule' : 'Thêm vào lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Schedule Modal */}
      <TemplateScheduleModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
      />

      {/* PRD v0.3.45 Part A: Add Event Modal */}
      <AddEventModal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
      />

    </div>
  );
};
