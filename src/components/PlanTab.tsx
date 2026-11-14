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
  RotateCw
} from 'lucide-react';
import { updateScheduleEntry } from '@/features/tasks';
import { TemplateScheduleModal } from '@/features/schedule-template';

const TYPE_CONFIG: Record<BlockType, { label: string; bg: string; text: string; border: string }> = {
  deep: { label: 'Tập trung sâu', bg: 'bg-rose-500/15', text: 'text-rose-700', border: 'border-rose-500/30' },
  meeting: { label: 'Họp & Trao đổi', bg: 'bg-purple-500/15', text: 'text-purple-700', border: 'border-purple-500/30' },
  interruption: { label: 'Quỹ gián đoạn', bg: 'bg-amber-500/15', text: 'text-amber-700', border: 'border-amber-500/30' },
  personal: { label: 'Cá nhân & Nghỉ', bg: 'bg-emerald-500/15', text: 'text-emerald-700', border: 'border-emerald-500/30' },
  planning: { label: 'Lập kế hoạch', bg: 'bg-cyan-500/15', text: 'text-cyan-700', border: 'border-cyan-500/30' },
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
    language 
  } = useApp();
  const { nowMinutes, todayLabel } = useDeviceClock();

  const [activeView, setActiveView] = useState<'card' | 'timeline' | 'matrix'>('card');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [templateModalOpen, setTemplateModalOpen] = useState<boolean>(false);

  const [newTitle, setNewTitle] = useState<string>('');
  const [newType, setNewType] = useState<BlockType>('deep');
  const [newStartTime, setNewStartTime] = useState<string>('16:00');
  const [newEndTime, setNewEndTime] = useState<string>('17:00');
  const [newGoalId, setNewGoalId] = useState<string>(goals[0]?.id || '');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingStart, setEditingStart] = useState<string>('09:00');
  const [editingEnd, setEditingEnd] = useState<string>('10:00');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
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
    alert(`Đã đưa "${item.title}" vào lịch hôm nay lúc 17:30!`);
  };

  const sortedBlocks = [...scheduleBlocks]
    .filter(b => Boolean(b.startTime && b.endTime) && b.status !== 'dropped')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E0401F] flex items-center justify-center text-white shadow-sm">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span>Kế hoạch thời gian</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Xem và định hình ngày hôm nay cũng như tuần này • Chuyển đổi giữa Thẻ ngày, Dòng thời gian & Ma trận ưu tiên
          </p>
        </div>

        {/* View Switcher: Daily Card vs Timeline vs Priority Matrix */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveView('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'card' 
                  ? 'bg-[#E0401F] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Thẻ ngày</span>
            </button>
            <button
              onClick={() => setActiveView('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'timeline' 
                  ? 'bg-[#E0401F] text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Dòng thời gian</span>
            </button>
          </div>

          <button
            onClick={() => setTemplateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-all"
            title="Quản lý lịch ngày mẫu cố định"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Lịch mẫu</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 text-[#E0401F]" />
            <span>Thêm việc</span>
          </button>
        </div>
      </div>

      {activeView === 'card' && <DailyCardView />}
      {activeView === 'timeline' && (
        <>
          {/* Weekly Budget Progress */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#E0401F]" />
                <span>Ngân sách tuần</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">Đã dùng 18 giờ / 40 giờ kế hoạch</span>
            </div>

            <div className="space-y-3.5">
              {goals.map(g => (
                <div 
                  key={g.id} 
                  onClick={() => openDrilldown({
                    type: 'goal_tasks',
                    title: `Ngân sách & Nhiệm vụ: ${g.name}`,
                    subtitle: `Ngân sách tuần: ${g.dailyBudgetMins * 5 / 60} giờ/tuần • Đang đúng tiến độ`,
                    goalId: g.id,
                  })}
                  className="space-y-1.5 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                  title="Bấm để xem danh sách nhiệm vụ của mục tiêu này"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-800 font-semibold group-hover:text-slate-900 transition-colors">{g.name}</span>
                    <span className="text-slate-500 font-mono text-xs">{g.dailyBudgetMins * 5 / 60} giờ/tuần (~{g.dailyBudgetMins} phút/ngày) ↗</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className="h-full bg-[#E0401F] rounded-full transition-all" 
                      style={{ width: `${Math.min(100, (g.progressPercent + 20))}%` }} 
                    />
                  </div>
                </div>
              ))}

              {/* Interruption Reserve Budget */}
              <div 
                onClick={() => openDrilldown({
                  type: 'interruptions',
                  title: 'Quỹ dự phòng gián đoạn tuần (3.5 giờ / 7.5 giờ)',
                  subtitle: 'Bấm để xem danh sách việc chen ngang và người kéo bạn vào',
                })}
                className="space-y-1.5 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                title="Bấm để xem nhật ký chen ngang"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-amber-700 font-semibold group-hover:text-amber-700">Quỹ dự phòng gián đoạn tuần</span>
                  <span className="text-amber-600 font-mono text-xs">Đã dùng 3.5 giờ / 7.5 giờ (Còn 53%) ↗</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: '47%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Daily Plan Timeline */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E0401F]" />
                <span>Dòng thời gian ({todayLabel})</span>
              </h3>
              <span className="text-xs text-slate-500">
                Hồ sơ: <strong className="text-slate-900">{profile.title}</strong>
              </span>
            </div>

            {/* Timeline List (Part E3.4: Interactive with inline edit, delete, gaps with +) */}
            <div className="space-y-3">
              {sortedBlocks.map((block, idx) => {
                const prevBlock = idx > 0 ? sortedBlocks[idx - 1] : null;
                const prevEndMins = prevBlock ? timeToMinutes(prevBlock.endTime) : null;
                const curStartMins = timeToMinutes(block.startTime);
                const hasGap = prevEndMins !== null && curStartMins > prevEndMins;
                const gapMins = hasGap ? curStartMins - prevEndMins : 0;

                const isTemplate = block.isTemplateBlock || block.blockKind === 'ritual' || block.id === 'b-10' || block.id === 'b-ritual-close';
                const conf = TYPE_CONFIG[block.type] || TYPE_CONFIG.deep;
                const computedStatus = computeBlockStatus(block, nowMinutes);
                const statusDisplay = getBlockStatusDisplay(computedStatus);
                const isCompleted = computedStatus === 'done';
                const isCurrent = computedStatus === 'in_progress';
                const isEditingTitle = editingId === block.id;
                const isEditingTime = editingTimeId === block.id;

                const typeExplicitlyChosen = (block.extra as Record<string, unknown> | undefined)?.typeExplicitlyChosen || isTemplate;

                return (
                  <React.Fragment key={block.id}>
                    {hasGap && (
                      <div className="p-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {language === 'vi'
                              ? `Bạn có ${gapMins >= 60 ? `${Math.floor(gapMins / 60)} giờ ` : ''}${gapMins % 60 ? `${gapMins % 60}p ` : ''}trống đến ${block.startTime}`
                              : `You have ${gapMins}m free until ${block.startTime}`}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setNewStartTime(prevBlock!.endTime);
                            setNewEndTime(block.startTime);
                            setShowAddModal(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 shadow-2xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#E0401F]" />
                          <span>{language === 'vi' ? 'Xếp việc' : 'Add task'}</span>
                        </button>
                      </div>
                    )}

                    <div
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent 
                          ? 'border-red-300 bg-red-50/70 ring-1 ring-red-400/40 shadow-xs'
                          : isCompleted
                          ? 'border-slate-200 bg-slate-50/70 opacity-70'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                        {/* Time Badge (clickable to edit time) */}
                        {isEditingTime ? (
                          <div className="flex items-center gap-1 text-xs shrink-0">
                            <input
                              type="time"
                              value={editingStart}
                              onChange={e => setEditingStart(e.target.value)}
                              className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                            />
                            <span>-</span>
                            <input
                              type="time"
                              value={editingEnd}
                              onChange={e => setEditingEnd(e.target.value)}
                              className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-mono text-xs"
                            />
                            <button
                              onClick={() => {
                                updateScheduleEntry(block.id, { startTime: editingStart, endTime: editingEnd }, { updateDailyCardItem, setBlocks, dailyCardItems });
                                setEditingTimeId(null);
                              }}
                              className="p-1 rounded-md bg-emerald-600 text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingTimeId(null)}
                              className="p-1 rounded-md text-slate-400 hover:bg-slate-200"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingTimeId(block.id);
                              setEditingStart(block.startTime);
                              setEditingEnd(block.endTime);
                            }}
                            title="Bấm để đổi giờ"
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-mono font-bold whitespace-nowrap transition-colors shrink-0"
                          >
                            {block.startTime} - {block.endTime}
                          </button>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {typeExplicitlyChosen && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${conf.bg} ${conf.text} ${conf.border}`}>
                                {conf.label}
                              </span>
                            )}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusDisplay.badgeClass}`}>
                              {statusDisplay.label}
                            </span>
                            {isTemplate && (
                              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-0.5 bg-slate-100 px-2 py-0.5 rounded-full" title="Khung cố định theo lịch mẫu">
                                🔁 Khung cố định
                              </span>
                            )}
                          </div>

                          {/* Title with inline edit */}
                          {isEditingTitle ? (
                            <div className="flex items-center gap-2 mt-1">
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
                                className="w-full px-2.5 py-1 rounded-lg border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none"
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
                              title="Bấm để sửa tên"
                              className={`text-sm sm:text-base font-bold mt-1 cursor-pointer hover:underline ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}
                            >
                              {block.title}
                            </h4>
                          )}

                          {block.nextStep && (
                            <p className="text-xs text-amber-700 font-medium mt-0.5">
                              Bước kế tiếp: {block.nextStep}
                            </p>
                          )}
                          {block.goalName && (
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-red-400" />
                              <span>{block.goalName}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isTemplate ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateScheduleEntry(block.id, { status: 'dropped' }, { updateDailyCardItem, setBlocks, dailyCardItems })}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold transition-colors"
                              title="Bỏ qua khung này cho riêng hôm nay"
                            >
                              Bỏ qua hôm nay
                            </button>
                            <button
                              onClick={() => setTemplateModalOpen(true)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold transition-colors"
                              title="Sửa lịch mẫu"
                            >
                              Sửa lịch mẫu
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm('Xóa công việc này khỏi lịch?')) {
                                updateScheduleEntry(block.id, { status: 'dropped' }, { updateDailyCardItem, setBlocks, dailyCardItems });
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa công việc"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Important, Not Urgent List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Việc quan trọng, chưa khẩn</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Các đầu việc định kỳ giúp duy trì đà phát triển dài hạn. Bấm "Làm tuần này" để đưa vào lịch.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {IMPORTANT_NOT_URGENT_BACKLOG.map(item => (
                <div key={item.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-all">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">Dự kiến: {item.defaultMinutes} phút</span>
                  </div>
                  <button
                    onClick={() => handleAcceptBacklogItem(item)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#E0401F] hover:bg-[#d03515] text-white text-xs font-bold shadow-sm transition-all shrink-0"
                  >
                    Làm tuần này
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
            <h3 className="text-base font-bold mb-4">Thêm công việc mới</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tên công việc</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Rà soát hợp đồng..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E0401F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#E0401F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#E0401F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Loại khối</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as BlockType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E0401F]"
                >
                  <option value="deep">Tập trung sâu</option>
                  <option value="meeting">Họp & Trao đổi</option>
                  <option value="interruption">Quỹ gián đoạn</option>
                  <option value="personal">Cá nhân & Nghỉ</option>
                  <option value="planning">Lập kế hoạch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Mục tiêu liên kết (tùy chọn)</label>
                <select
                  value={newGoalId}
                  onChange={e => setNewGoalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E0401F]"
                >
                  <option value="">Không gắn mục tiêu</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E0401F] hover:bg-[#d03515] text-white text-xs font-bold shadow-md transition-all"
                >
                  Thêm vào lịch
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

    </div>
  );
};
