'use client';
// PRD B34 v0.3.26 / FIX v0.3.28: "Hôm nay" sheet. Lines are Thẻ ngày items (so they sync and show in Rổ công việc):
// a line that starts with a time is "Có giờ", lines under "Chưa xếp giờ" are "Linh động".
import React, { useMemo, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { DailyCardItem } from '@/types';
import { getDeviceNow, getDeviceCalendarDate } from '@/core/clock';
import { STICKY_COLORS, StickyNote } from '../model/stickyTypes';
import {
  findGaps, fmtDuration, nextFreeStart, parseTimedText, priorityOf, suggestDuration,
  suggestForGap, toMins, toTime, durationOf, durationForPlacement, findOverlapItemIds,
} from '../model/timeline';
import { commitQuickLine, matchGoalByTag } from '@/features/tasks';
import { IconHourglass, IconLock, IconSpark, IconOverlap } from './StickyIcons';
import { LiveClockStrip } from '@/features/quick-entry';
import { MotivationSticker } from '@/features/motivation';
import { GoalPicker, findGoalSuggestion } from '@/features/goals';
import { useRowSelection } from './useRowSelection';
import { updateScheduleEntry } from '@/features/tasks';
import { getPreviousDay } from '@/features/dayclose';
import { TemplateScheduleModal } from '@/features/schedule-template';
import { Clock, Trash2, Copy, Calendar, X, RotateCw } from 'lucide-react';

export const DaySheetBody: React.FC<{ note: StickyNote }> = ({ note }) => {
  const c = STICKY_COLORS[note.color];
  const { 
    dailyCardItems, 
    addDailyCardItem, 
    updateDailyCardItem, 
    removeDailyCardItem, 
    toggleDailyCardItem, 
    goals,
    scheduleBlocks,
    setBlocks,
    setCloseDayModalOpen,
    language,
    showToast
  } = useApp();
  const day = note.date!;
  const today = getDeviceCalendarDate();
  const isToday = day === today;
  const now = getDeviceNow();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const [showTemplateBlocks, setShowTemplateBlocks] = useState(true);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const rawDayItems = dailyCardItems.filter(i => i.date === day && i.status !== 'dropped' && i.status !== 'carried');

  // Part E3.1: Read unified scheduleBlocks for today, or dailyCardItems for other days
  const timed = useMemo(() => {
    if (isToday && scheduleBlocks) {
      return scheduleBlocks
        .filter(b => Boolean(b.startTime && b.endTime) && b.status !== 'dropped')
        .filter(b => {
          if (!showTemplateBlocks && (b.isTemplateBlock || b.blockKind === 'ritual' || b.id === 'b-10' || b.id === 'b-ritual-close')) {
            return false;
          }
          return true;
        })
        .map(b => {
          const isTemplate = Boolean(b.isTemplateBlock || b.blockKind === 'ritual' || b.id === 'b-10' || b.id === 'b-ritual-close');
          return {
            id: b.id,
            text: b.title,
            start: b.startTime,
            end: b.endTime,
            date: day,
            status: b.status === 'done' ? ('done' as const) : ('open' as const),
            carryCount: 0,
            origin: 'planned' as const,
            goalId: b.goalId,
            goalName: b.goalName,
            milestoneId: b.milestoneId,
            milestoneName: b.milestoneName,
            nextStep: b.nextStep,
            isTemplateBlock: isTemplate,
            extra: b.extra,
          } as DailyCardItem & { isTemplateBlock?: boolean };
        })
        .sort((a, b) => toMins(a.start!) - toMins(b.start!));
    }
    return rawDayItems.filter(i => i.start).sort((a, b) => toMins(a.start!) - toMins(b.start!));
  }, [isToday, scheduleBlocks, showTemplateBlocks, rawDayItems, day]);

  const items = useMemo(() => {
    const flexItems = rawDayItems.filter(i => !i.start);
    return [...timed, ...flexItems];
  }, [timed, rawDayItems]);

  const flex = rawDayItems.filter(i => !i.start).reverse(); // oldest first, in the order they were written
  const leftover = dailyCardItems.filter(i => i.date < day && i.status === 'open');
  const gaps = findGaps(timed, nowMins);
  const gapAfter = new Map(gaps.map(g => [g.afterId, g]));
  const boundIds = new Set(gaps.map(g => timed.find(t => t.start === g.end)?.id));
  const overlapIds = useMemo(() => findOverlapItemIds(timed), [timed]);

  // Composer for timed lines (prefilled with the next free time after accepting a duration)
  const [draft, setDraft] = useState('');
  const [pill, setPill] = useState<number | null>(null); // accepted duration for the draft
  const [flexDraft, setFlexDraft] = useState('');
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [pickerItemId, setPickerItemId] = useState<string | null>(null);
  const [overlapTargetId, setOverlapTargetId] = useState<string | null>(null);
  const [hashFilter, setHashFilter] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // PRD v0.3.33 Part F2.2: Parallel and shift actions for overlapping tasks
  const handleMakeParallel = (targetItem: DailyCardItem) => {
    const idx = timed.findIndex(t => t.id === targetItem.id);
    const prev = idx > 0 ? timed[idx - 1] : null;
    const parentId = prev ? prev.id : undefined;
    updateScheduleEntry(
      targetItem.id,
      {
        extra: { ...(targetItem.extra || {}), parallelOf: parentId }
      },
      { updateDailyCardItem, setBlocks, dailyCardItems }
    );
    showToast?.(language === 'vi' ? 'Đã chuyển thành việc làm song song!' : 'Marked as parallel task!');
  };

  const handleShiftAfter = (targetItem: DailyCardItem) => {
    const idx = timed.findIndex(t => t.id === targetItem.id);
    const prev = idx > 0 ? timed[idx - 1] : null;
    if (!prev?.end) return;
    const dur = durationOf(targetItem) || 30;
    const newStartMins = toMins(prev.end);
    const newEndMins = newStartMins + dur;
    updateScheduleEntry(
      targetItem.id,
      {
        startTime: toTime(newStartMins),
        endTime: toTime(newEndMins),
      },
      { updateDailyCardItem, setBlocks, dailyCardItems }
    );
    showToast?.(language === 'vi' ? `Đã dời việc sau sang ${toTime(newStartMins)}!` : `Shifted to start after at ${toTime(newStartMins)}!`);
  };

  // Multi-row selection & actions (PRD FIX v0.3.32 Part C3)
  const {
    selectedIds,
    selectRow,
    clearSelection,
    selectAll,
    deleteSelected,
    copySelected,
    undoToast,
    handleUndo,
    handleRowPointerDown,
    handleRowPointerEnter,
  } = useRowSelection({
    items,
    isEditing: editing !== null,
    onDeleteItems: toDelete => {
      toDelete.forEach(it => removeDailyCardItem(it.id));
    },
    onRestoreItems: restored => {
      restored.forEach(it => {
        addDailyCardItem({
          text: it.text,
          date: it.date,
          start: it.start,
          end: it.end,
          goalId: it.goalId,
          goalName: it.goalName,
          milestoneId: it.milestoneId,
          milestoneName: it.milestoneName,
          status: it.status,
          extra: it.extra,
        });
      });
    },
  });

  const handlePasteMultiLine = (e: React.ClipboardEvent<HTMLInputElement>, isFlex: boolean = false) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && pasted.includes('\n')) {
      e.preventDefault();
      const rawLines = pasted.split('\n').map(l => l.trim()).filter(Boolean);
      rawLines.forEach(line => {
        commitQuickLine(line, day, { addDailyCardItem, goals });
      });
      if (isFlex) setFlexDraft('');
      else setDraft('');
    }
  };

  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleTouchStart = (id: string) => {
    touchTimerRef.current = setTimeout(() => {
      selectRow(id, false, true);
    }, 400);
  };
  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const handleCarrySelectedToTomorrow = () => {
    const d = new Date(day);
    d.setDate(d.getDate() + 1);
    const tomorrowStr = getDeviceCalendarDate(d);
    const toCarry = items.filter(i => selectedIds.has(i.id));
    toCarry.forEach(it => {
      updateDailyCardItem(it.id, {
        date: tomorrowStr,
        carryCount: (it.carryCount || 0) + 1,
        carriedFromId: it.carriedFromId || it.id,
      });
    });
    clearSelection();
  };

  const parsed = parseTimedText(draft);
  const suggested = parsed.time && parsed.rest && !parsed.durationMins ? suggestDuration(parsed.rest, undefined, dailyCardItems) : null;

  const commitDraft = () => {
    if (!draft.trim()) return;
    const p = parseTimedText(draft);
    if (!p.rest && !p.time) return;

    // Use unified commitQuickLine (FIX v0.3.28 A1 & A3: handles #goal, time, duration)
    const createdId = commitQuickLine(draft, day, { addDailyCardItem, goals });
    setPill(null);

    // After a duration is set, the next line starts at the next free time (founder flow, 15:45 -> 16:15)
    const dur = p.durationMins ?? pill ?? undefined;
    const end = dur && p.time ? toTime(toMins(p.time) + dur) : undefined;
    setDraft(end ? `${nextFreeStart([...timed, { id: createdId || 'new', start: p.time, end } as DailyCardItem], toMins(end))} ` : '');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveEdit = (it: DailyCardItem) => {
    const p = parseTimedText(editText);
    if (!p.rest && !p.time) { removeDailyCardItem(it.id); setEditing(null); return; }

    // Goal tag detection on edit (FIX v0.3.28 A3)
    let goalId = it.goalId;
    let goalName = it.goalName;
    let milestoneId = it.milestoneId;
    let milestoneName = it.milestoneName;
    let text = p.rest;
    const goalTagMatch = text.match(/#([a-zA-Zà-ỹÀ-Ỹ0-9_]+)/g);
    if (goalTagMatch && goals.length) {
      for (const rawTagWithHash of goalTagMatch) {
        const tag = rawTagWithHash.slice(1);
        if (/^[1-9]$/.test(tag)) continue;
        const matchedGoal = matchGoalByTag(tag, goals);
        if (matchedGoal) {
          goalId = matchedGoal.id;
          goalName = matchedGoal.name;
          milestoneId = undefined;
          milestoneName = undefined;
          text = text.replace(rawTagWithHash, ' ').replace(/\s+/g, ' ').trim();
        }
      }
    }

    const oldDur = durationOf(it);
    const existingExtra = (it.extra as Record<string, unknown> | undefined) || {};
    const oldEst = typeof existingExtra.estimateMins === 'number' ? existingExtra.estimateMins : undefined;
    const dur = p.durationMins ?? oldDur ?? oldEst;

    if (p.time) {
      const newExtra = { ...existingExtra };
      if (dur) newExtra.estimateMins = dur;
      updateDailyCardItem(it.id, {
        text,
        goalId,
        goalName,
        milestoneId,
        milestoneName,
        start: p.time,
        end: dur ? toTime(toMins(p.time) + dur) : undefined,
        extra: newExtra,
      });
    } else {
      // Time removed -> unscheduled
      const newExtra = { ...existingExtra };
      if (p.durationMins ?? oldEst) {
        newExtra.estimateMins = p.durationMins ?? oldEst;
      } else {
        delete newExtra.estimateMins;
      }
      updateDailyCardItem(it.id, {
        text,
        goalId,
        goalName,
        milestoneId,
        milestoneName,
        start: undefined,
        end: undefined,
        extra: newExtra,
      });
    }
    setEditing(null);
  };

  const lineText = (it: DailyCardItem) => {
    const est = (it.extra as Record<string, unknown> | undefined)?.estimateMins as number | undefined;
    if (it.start) {
      return `${it.start} ${it.text}${durationOf(it) ? ` ${durationOf(it)}p` : ''}`;
    }
    return est ? `${it.text} ${est}p` : it.text;
  };

  const pillStyle: React.CSSProperties = { border: `1px solid ${c.line}`, color: c.muted };

  const renderGoalBadge = (it: DailyCardItem, isEditingLine: boolean) => {
    const hasGoal = !!it.goalId;
    const extra = (it.extra as Record<string, unknown> | undefined) || {};
    const sug = (!hasGoal && !extra.dismissGoalSuggestion)
      ? findGoalSuggestion(isEditingLine ? editText : it.text, goals)
      : null;
    const isPickerOpen = pickerItemId === it.id;

    const goalLabel = it.goalName
      ? `${it.goalName}${it.milestoneName ? ` › ${it.milestoneName}` : ''}`
      : null;

    return (
      <div className="relative inline-flex items-center gap-1 shrink-0">
        {hasGoal ? (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
            onClick={() => setPickerItemId(isPickerOpen ? null : it.id)}
            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0 flex items-center gap-1 transition-colors border border-slate-200/60"
            title="Bấm để đổi hoặc bỏ gắn mục tiêu"
          >
            <span className="truncate max-w-[150px]">{goalLabel}</span>
          </button>
        ) : sug ? (
          <div className="inline-flex items-center rounded-lg border border-dashed border-amber-300 bg-amber-50/70 text-amber-900 text-[10.5px] overflow-hidden shrink-0">
            <span
              className="px-1.5 py-0.5 font-normal text-amber-800/90 truncate max-w-[130px]"
              title={`Gợi ý tự động từ từ khóa "${sug.matchedWord}"`}
            >
              Gợi ý: {sug.goal.name}{sug.milestone ? ` › ${sug.milestone.name}` : ''}
            </span>
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => {
                updateDailyCardItem(it.id, {
                  goalId: sug.goal.id,
                  goalName: sug.goal.name,
                  milestoneId: sug.milestone?.id,
                  milestoneName: sug.milestone?.name,
                });
              }}
              className="px-1.5 py-0.5 font-bold hover:bg-emerald-100 text-emerald-700 transition-colors"
              title="Nhận gợi ý"
            >
              ✓
            </button>
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => {
                updateDailyCardItem(it.id, {
                  extra: { ...extra, dismissGoalSuggestion: true }
                });
              }}
              className="px-1.5 py-0.5 font-bold hover:bg-slate-200 text-slate-500 hover:text-slate-800 border-l border-amber-200/80 transition-colors"
              title="Bỏ gợi ý"
            >
              ×
            </button>
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => setPickerItemId(isPickerOpen ? null : it.id)}
              className="px-1 py-0.5 border-l border-amber-200/80 hover:bg-amber-100 text-amber-700"
              title="Chọn mục tiêu khác"
            >
              ▾
            </button>
          </div>
        ) : (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
            onClick={() => setPickerItemId(isPickerOpen ? null : it.id)}
            className="text-[10.5px] px-1.5 py-0.5 rounded border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-500 font-normal shrink-0 transition-colors"
            title="Bấm để gắn mục tiêu hoặc gõ #tên"
          >
            Gắn mục tiêu
          </button>
        )}

        {isPickerOpen && (
          <GoalPicker
            currentGoalId={it.goalId}
            currentMilestoneId={it.milestoneId}
            initialSearch={hashFilter}
            onSelect={(gId, gName, mId, mName) => {
              let updatedText = isEditingLine ? editText : it.text;
              if (hashFilter) {
                updatedText = updatedText.replace(new RegExp(`#${hashFilter}\\b|#${hashFilter}$`), '').trim();
                if (isEditingLine) setEditText(updatedText);
              }
              updateDailyCardItem(it.id, {
                text: updatedText,
                goalId: gId,
                goalName: gName,
                milestoneId: mId,
                milestoneName: mName,
              });
              setPickerItemId(null);
              setHashFilter('');
            }}
            onClose={() => {
              setPickerItemId(null);
              setHashFilter('');
            }}
            className="right-0 top-full mt-1"
          />
        )}
      </div>
    );
  };

  const renderText = (it: DailyCardItem) =>
    editing === it.id ? (
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <input
          autoFocus value={editText}
          onChange={e => {
            const val = e.target.value;
            setEditText(val);
            const hashMatch = val.match(/#([a-zA-Zà-ỹÀ-Ỹ0-9_-]*)$/);
            if (hashMatch) {
              setPickerItemId(it.id);
              setHashFilter(hashMatch[1]);
            } else if (pickerItemId === it.id && hashFilter) {
              setPickerItemId(null);
              setHashFilter('');
            }
          }}
          onBlur={() => {
            if (pickerItemId !== it.id) {
              saveEdit(it);
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (pickerItemId !== it.id) saveEdit(it);
            }
            if (e.key === 'Escape') {
              if (pickerItemId === it.id) {
                setPickerItemId(null);
                setHashFilter('');
              } else {
                setEditing(null);
              }
            }
          }}
          className="flex-1 bg-transparent outline-none min-w-0" style={{ color: c.ink }}
        />
        {renderGoalBadge(it, true)}
      </div>
    ) : (
      <span
        className="flex-1 min-w-0 cursor-text flex items-center flex-wrap gap-1.5"
        style={{ textDecoration: it.status === 'done' ? 'line-through' : undefined, opacity: it.status === 'done' ? 0.5 : 1 }}
        onClick={() => { setEditing(it.id); setEditText(lineText(it)); }}
      >
        <span>{it.text.replace(/#\d\b/, '').trim()}</span>
        {priorityOf(it.text) < 99 && <span className="text-xs font-semibold" style={{ color: c.muted }}>#{priorityOf(it.text)}</span>}
        {renderGoalBadge(it, false)}
      </span>
    );

  const taken = new Set<string>(skipped);
  const freeTotal = gaps.reduce((s, g) => s + g.mins, 0);

  const handleToggleItem = (it: DailyCardItem & { isTemplateBlock?: boolean }) => {
    if (it.isTemplateBlock) {
      const nextStatus = it.status === 'done' ? 'planned' : 'done';
      updateScheduleEntry(it.id, { status: nextStatus }, { updateDailyCardItem, setBlocks, dailyCardItems });
    } else {
      toggleDailyCardItem(it.id);
    }
  };

  return (
    <div className="flex flex-col gap-2 text-[15px] leading-snug" style={{ color: c.ink }}>
      {/* PRD FIX v0.3.28 C1: LiveClockStrip at top of DaySheet */}
      <LiveClockStrip compact />

      {/* PRD FEATURE v0.3.31 B1: Motivation Sticker note style at head of "Hôm nay" sheet */}
      <MotivationSticker slotKey="start_day_sheet" context="start_day" size="note" className="mb-1" />

      {/* Part E3.3: Toggle template blocks */}
      <div className="flex items-center justify-between text-xs px-1" style={{ color: c.muted }}>
        <span className="text-[11.5px] font-semibold">
          {timed.length} việc có giờ · {flex.length} linh động
        </span>
        <button
          onClick={() => setShowTemplateBlocks(v => !v)}
          className="text-[11px] hover:underline cursor-pointer"
          style={{ color: c.ink }}
        >
          {showTemplateBlocks ? 'Ẩn khung cố định' : 'Hiện khung cố định'}
        </button>
      </div>

      {/* Part A2 #4: Leftover tasks wording */}
      {leftover.length > 0 && (() => {
        const yesterday = getPreviousDay(day);
        const onlyYesterday = leftover.every(i => i.date === yesterday);
        const label = onlyYesterday
          ? `Còn ${leftover.length} việc từ hôm qua đang chờ bạn`
          : `Còn ${leftover.length} việc từ những ngày trước đang chờ bạn`;
        return (
          <div className="flex items-center gap-2 text-xs py-1" style={{ color: c.muted }}>
            <span className="flex-1 font-medium">{label}</span>
            <button
              className="underline underline-offset-2 font-semibold cursor-pointer"
              style={{ color: c.ink }}
              onClick={() => leftover.forEach(i => updateDailyCardItem(i.id, { date: day, carryCount: (i.carryCount || 0) + 1, carriedFromId: i.carriedFromId || i.id }))}
            >
              Làm tiếp hôm nay
            </button>
            <span>·</span>
            <button
              className="underline underline-offset-2 font-semibold cursor-pointer"
              style={{ color: c.ink }}
              onClick={() => setCloseDayModalOpen(true)}
            >
              Xem lại
            </button>
          </div>
        );
      })()}

      {timed.map(it => {
        const gap = gapAfter.get(it.id);
        const sug = gap ? suggestForGap(flex, taken, gap.mins, dailyCardItems) : undefined;
        if (sug) taken.add(sug.id);
        const isNowRunning = it.start && it.end && toMins(it.start) <= nowMins && nowMins < toMins(it.end) && it.status !== 'done';
        const isParallel = Boolean(it.parallelOf || (it.extra as Record<string, unknown> | undefined)?.parallelOf);
        return (
          <React.Fragment key={it.id}>
            <div
              onPointerDown={e => handleRowPointerDown(it.id, e)}
              onPointerEnter={() => handleRowPointerEnter(it.id)}
              onTouchStart={() => handleTouchStart(it.id)}
              onTouchEnd={handleTouchEnd}
              className={`group/row flex items-center gap-2 px-1.5 py-0.5 -mx-1 rounded-lg transition-colors relative ${
                isParallel ? 'ml-5 pl-2.5 border-l-2 border-slate-300' : ''
              } ${
                selectedIds.has(it.id) ? 'bg-black/10 ring-1 ring-black/15' : 'hover:bg-black/[0.03]'
              }`}
            >
              {isParallel && (
                <span className="shrink-0 text-xs font-mono font-bold text-slate-500" title="Việc làm song song (Làm kèm)">
                  ∥
                </span>
              )}
              <button title="Chạm để đánh dấu xong" onClick={() => handleToggleItem(it)}
                className="font-semibold tabular-nums shrink-0 cursor-pointer" style={{ color: c.ink }}>{it.start}</button>
              {it.isTemplateBlock && (
                <span className="shrink-0 text-xs" title="Khung cố định theo lịch mẫu">🔁</span>
              )}
              {renderText(it)}
              {isNowRunning && (
                <span className="shrink-0 text-[10.5px] px-1.5 py-0.5 rounded bg-black/5 text-slate-500 font-normal select-none">
                  đang làm
                </span>
              )}
              {durationOf(it) && <span className="shrink-0 h-5 px-2 rounded-full text-[11.5px] font-medium flex items-center" style={pillStyle}>{fmtDuration(durationOf(it)!)}</span>}
              {boundIds.has(it.id) && <span className="shrink-0" title="Đã lên lịch trước"><IconLock color={c.muted} /></span>}
              {overlapIds.has(it.id) && (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOverlapTargetId(overlapTargetId === it.id ? null : it.id);
                    }}
                    className="cursor-pointer p-0.5 hover:bg-amber-100 rounded transition-colors"
                    title="Chồng giờ với việc trước — Bấm để: Làm song song hoặc Dời việc sau"
                  >
                    <IconOverlap color={c.muted} />
                  </button>
                  {overlapTargetId === it.id && (
                    <div className="absolute z-30 left-0 top-6 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 min-w-[140px] text-xs space-y-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMakeParallel(it);
                          setOverlapTargetId(null);
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-slate-100 rounded-lg font-semibold text-slate-800 flex items-center gap-1.5"
                      >
                        <span className="font-mono font-bold text-slate-500">∥</span>
                        <span>{language === 'vi' ? 'Làm song song' : 'Run in parallel'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShiftAfter(it);
                          setOverlapTargetId(null);
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-slate-100 rounded-lg font-semibold text-slate-800 flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{language === 'vi' ? 'Dời việc sau' : 'Postpone start'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Template quick actions */}
              {it.isTemplateBlock && (
                <div className="opacity-0 group-hover/row:opacity-100 flex items-center gap-1 text-[11px] shrink-0 transition-opacity">
                  <button
                    onClick={() => updateScheduleEntry(it.id, { status: 'dropped' }, { updateDailyCardItem, setBlocks, dailyCardItems })}
                    className="hover:underline text-slate-400 hover:text-slate-600"
                    title="Bỏ qua khung này hôm nay"
                  >
                    Bỏ qua
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => setTemplateModalOpen(true)}
                    className="hover:underline text-slate-400 hover:text-slate-600"
                    title="Sửa lịch ngày mẫu"
                  >
                    Sửa mẫu
                  </button>
                </div>
              )}
            </div>
            {gap && (
              <div className="flex items-center gap-2 text-sm py-0.5" style={{ color: c.muted }}>
                <span className="font-semibold tabular-nums">{gap.start}</span>
                <IconHourglass color={c.muted} />
                <span>Bạn có {fmtDuration(gap.mins)} trống đến {gap.end}</span>
              </div>
            )}
            {gap && sug && (() => {
              const dur = durationForPlacement(sug, dailyCardItems);
              const fits = dur <= gap.mins;
              return (
                <div className="flex items-center gap-2 text-[13.5px] pl-12" style={{ color: c.ink }}>
                  <IconSpark color={c.muted} />
                  <span className="flex-1 min-w-0">
                    Gợi ý: {sug.text.replace(/#\d\b/, '').trim()} · {fits ? fmtDuration(dur) : `cần ${fmtDuration(dur)}, trống ${fmtDuration(gap.mins)}`}
                  </span>
                  {fits ? (
                    <button
                      className="underline underline-offset-2 font-semibold text-[12.5px]"
                      onClick={() => updateDailyCardItem(sug.id, {
                        start: gap.start,
                        end: toTime(toMins(gap.start) + dur),
                      })}
                    >
                      Xếp vào
                    </button>
                  ) : (
                    <button
                      className="underline underline-offset-2 font-semibold text-[12.5px]"
                      onClick={() => updateDailyCardItem(sug.id, {
                        start: gap.start,
                        end: gap.end,
                        nextStep: `Còn lại ${dur - gap.mins}p`,
                      })}
                    >
                      Xếp {gap.mins}p
                    </button>
                  )}
                  <button className="text-[12.5px]" style={{ color: c.muted }} onClick={() => setSkipped(new Set([...skipped, sug.id]))}>
                    Khác
                  </button>
                </div>
              );
            })()}
          </React.Fragment>
        );
      })}

      {/* composer */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={inputRef} value={draft} placeholder="Hôm nay bạn muốn làm xong điều gì?"
          onChange={e => { setDraft(e.target.value); setPill(null); }}
          onPaste={e => handlePasteMultiLine(e, false)}
          onKeyDown={e => {
            if (e.key === 'Tab' && suggested && pill === null) { e.preventDefault(); setPill(suggested); }
            if (e.key === 'Enter') commitDraft();
          }}
          className="flex-1 min-w-[160px] bg-transparent outline-none placeholder:opacity-60" style={{ color: c.ink }}
        />
        {suggested && (
          <button onClick={() => setPill(pill ? null : suggested)}
            className="h-6 px-2.5 rounded-full text-xs font-medium flex items-center"
            style={pill ? { border: `1px solid ${c.muted}`, color: c.ink } : { border: `1.5px dashed ${c.line}`, color: c.muted }}>
            {fmtDuration(suggested)}{pill ? '' : ' · Tab'}
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-[11.5px] font-semibold tracking-wide" style={{ color: c.muted }}>CHƯA XẾP GIỜ · LÀM KHI CÓ HỨNG</span>
        <span className="flex-1 h-px" style={{ background: c.line }} />
      </div>
      {flex.map(it => {
        const est = (it.extra as Record<string, unknown> | undefined)?.estimateMins as number | undefined;
        return (
          <div
            key={it.id}
            onPointerDown={e => handleRowPointerDown(it.id, e)}
            onPointerEnter={() => handleRowPointerEnter(it.id)}
            onTouchStart={() => handleTouchStart(it.id)}
            onTouchEnd={handleTouchEnd}
            className={`group/flex flex items-center gap-2 px-1.5 py-0.5 -mx-1 rounded-lg transition-colors ${
              selectedIds.has(it.id) ? 'bg-black/10 ring-1 ring-black/15' : 'hover:bg-black/[0.03]'
            }`}
          >
            <button title="Chạm để đánh dấu xong" onClick={() => toggleDailyCardItem(it.id)} className="shrink-0" style={{ color: c.muted }}>•</button>
            {renderText(it)}
            {/* PRD FIX v0.3.28 C1: Small clock button to start unscheduled task immediately */}
            <button
              type="button"
              title="Bắt đầu việc này ngay bây giờ"
              onClick={() => {
                const dur = durationForPlacement(it, dailyCardItems) || 30;
                const startHM = toTime(nowMins);
                const endHM = toTime(nowMins + dur);
                updateDailyCardItem(it.id, { start: startHM, end: endHM });
              }}
              className="opacity-0 group-hover/flex:opacity-100 hover:opacity-100 focus:opacity-100 p-0.5 rounded hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-opacity shrink-0"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
            {est && (
              <span className="shrink-0 h-5 px-2 rounded-full text-[11.5px] font-medium flex items-center" style={pillStyle}>
                {fmtDuration(est)}
              </span>
            )}
          </div>
        );
      })}
      <input
        value={flexDraft} placeholder="thêm việc chưa xếp giờ…"
        onChange={e => setFlexDraft(e.target.value)}
        onPaste={e => handlePasteMultiLine(e, true)}
        onKeyDown={e => {
          if (e.key === 'Enter' && flexDraft.trim()) {
            commitQuickLine(flexDraft, day, { addDailyCardItem, goals });
            setFlexDraft('');
          }
        }}
        className="bg-transparent outline-none placeholder:opacity-60" style={{ color: c.ink }}
      />

      <div className="mt-2 pt-2 flex items-center justify-between text-[11.5px]" style={{ borderTop: `1px solid ${c.line}`, color: c.muted }}>
        <span>Tự lưu · {items.length} việc hôm nay</span>
        <span>Còn trống: {fmtDuration(freeTotal)}</span>
      </div>

      {/* 5-second Undo Toast (PRD FIX v0.3.32 C3 #3) */}
      {undoToast && (
        <div className="sticky bottom-1 left-0 right-0 mx-auto px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 z-40">
          <span>Đã xóa {undoToast.count} dòng</span>
          <button
            type="button"
            onClick={handleUndo}
            className="font-bold underline underline-offset-2 text-amber-300 hover:text-amber-200"
          >
            Hoàn tác
          </button>
        </div>
      )}

      {/* iPhone Multi-row Selection Action Bar (PRD FIX v0.3.32 C4 #2) */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-1 left-0 right-0 mx-auto p-2 rounded-2xl bg-white border border-slate-300 shadow-xl flex items-center justify-between gap-2 z-40 animate-in fade-in slide-in-from-bottom-3 text-slate-800">
          <span className="text-xs font-semibold px-1 text-slate-600">
            {selectedIds.size} việc
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={deleteSelected}
              className="px-2.5 py-1 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-medium text-xs flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
            <button
              type="button"
              onClick={copySelected}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Chép</span>
            </button>
            <button
              type="button"
              onClick={handleCarrySelectedToTomorrow}
              className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs flex items-center gap-1 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Để mai</span>
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 ml-1"
              title="Bỏ chọn"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <TemplateScheduleModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
      />
    </div>
  );
};
