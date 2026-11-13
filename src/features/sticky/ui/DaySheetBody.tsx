'use client';
// PRD B34 v0.3.26 / FIX v0.3.28: "Hôm nay" sheet. Lines are Thẻ ngày items (so they sync and show in Rổ công việc):
// a line that starts with a time is "Có giờ", lines under "Chưa xếp giờ" are "Linh động".
import React, { useMemo, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { DailyCardItem } from '@/types';
import { getDeviceNow } from '@/core/clock';
import { STICKY_COLORS, StickyNote } from '../model/stickyTypes';
import {
  findGaps, fmtDuration, nextFreeStart, parseTimedText, priorityOf, suggestDuration,
  suggestForGap, toMins, toTime, durationOf, durationForPlacement, findOverlapItemIds,
} from '../model/timeline';
import { commitQuickLine, matchGoalByTag } from '@/features/tasks';
import { IconHourglass, IconLock, IconSpark, IconOverlap } from './StickyIcons';
import { LiveClockStrip } from '@/features/quick-entry';
import { MotivationSticker } from '@/features/motivation';
import { Clock } from 'lucide-react';

export const DaySheetBody: React.FC<{ note: StickyNote }> = ({ note }) => {
  const c = STICKY_COLORS[note.color];
  const { dailyCardItems, addDailyCardItem, updateDailyCardItem, removeDailyCardItem, toggleDailyCardItem, goals } = useApp();
  const day = note.date!;
  const now = getDeviceNow();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  const items = dailyCardItems.filter(i => i.date === day && i.status !== 'dropped' && i.status !== 'carried');
  const timed = items.filter(i => i.start).sort((a, b) => toMins(a.start!) - toMins(b.start!));
  const flex = items.filter(i => !i.start).reverse(); // oldest first, in the order they were written
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
  const inputRef = useRef<HTMLInputElement>(null);

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

  const renderText = (it: DailyCardItem) =>
    editing === it.id ? (
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <input
          autoFocus value={editText} onChange={e => setEditText(e.target.value)}
          onBlur={() => saveEdit(it)}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(it); if (e.key === 'Escape') setEditing(null); }}
          className="flex-1 bg-transparent outline-none min-w-0" style={{ color: c.ink }}
        />
        {!it.goalId && (
          <span className="text-[10.5px] px-1.5 py-0.5 rounded border border-dashed border-slate-300 text-slate-400 select-none shrink-0" title="Gõ #tên_mục_tiêu để gắn">
            Gắn mục tiêu
          </span>
        )}
      </div>
    ) : (
      <span
        className="flex-1 min-w-0 cursor-text flex items-center flex-wrap gap-1"
        style={{ textDecoration: it.status === 'done' ? 'line-through' : undefined, opacity: it.status === 'done' ? 0.5 : 1 }}
        onClick={() => { setEditing(it.id); setEditText(lineText(it)); }}
      >
        <span>{it.text.replace(/#\d\b/, '').trim()}</span>
        {priorityOf(it.text) < 99 && <span className="text-xs font-semibold" style={{ color: c.muted }}>#{priorityOf(it.text)}</span>}
        {it.goalName && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium shrink-0">
            {it.goalName}
          </span>
        )}
      </span>
    );

  const taken = new Set<string>(skipped);
  const freeTotal = gaps.reduce((s, g) => s + g.mins, 0);

  return (
    <div className="flex flex-col gap-2 text-[15px] leading-snug" style={{ color: c.ink }}>
      {/* PRD FIX v0.3.28 C1: LiveClockStrip at top of DaySheet */}
      <LiveClockStrip compact />

      {/* PRD FEATURE v0.3.31 B1: Motivation Sticker note style at head of "Hôm nay" sheet */}
      <MotivationSticker slotKey="start_day_sheet" context="start_day" size="note" className="mb-1" />

      {leftover.length > 0 && (
        <div className="flex items-center gap-2 text-xs" style={{ color: c.muted }}>
          <span className="flex-1">{leftover.length} việc ngày trước chưa xong</span>
          <button className="underline underline-offset-2 font-semibold" style={{ color: c.ink }}
            onClick={() => leftover.forEach(i => updateDailyCardItem(i.id, { date: day, carryCount: i.carryCount + 1, carriedFromId: i.carriedFromId || i.id }))}>
            Chuyển sang hôm nay
          </button>
        </div>
      )}

      {timed.map(it => {
        const gap = gapAfter.get(it.id);
        const sug = gap ? suggestForGap(flex, taken, gap.mins, dailyCardItems) : undefined;
        if (sug) taken.add(sug.id);
        const isNowRunning = it.start && it.end && toMins(it.start) <= nowMins && nowMins < toMins(it.end) && it.status !== 'done';
        return (
          <React.Fragment key={it.id}>
            <div className="flex items-center gap-2">
              <button title="Chạm để đánh dấu xong" onClick={() => toggleDailyCardItem(it.id)}
                className="font-semibold tabular-nums shrink-0" style={{ color: c.ink }}>{it.start}</button>
              {renderText(it)}
              {isNowRunning && (
                <span className="shrink-0 text-[10.5px] px-1.5 py-0.5 rounded bg-black/5 text-slate-500 font-normal select-none">
                  đang làm
                </span>
              )}
              {durationOf(it) && <span className="shrink-0 h-5 px-2 rounded-full text-[11.5px] font-medium flex items-center" style={pillStyle}>{fmtDuration(durationOf(it)!)}</span>}
              {boundIds.has(it.id) && <span className="shrink-0" title="Đã lên lịch trước"><IconLock color={c.muted} /></span>}
              {overlapIds.has(it.id) && <span className="shrink-0" title="Chồng giờ với việc trước"><IconOverlap color={c.muted} /></span>}
            </div>
            {gap && (
              <div className="flex items-center gap-2 text-sm" style={{ color: c.muted }}>
                <span className="font-semibold tabular-nums">{gap.start}</span>
                <IconHourglass color={c.muted} />
                <span>trống đến {gap.end} · {fmtDuration(gap.mins)}</span>
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
          ref={inputRef} value={draft} placeholder="gõ một dòng… (gõ giờ để xếp lịch)"
          onChange={e => { setDraft(e.target.value); setPill(null); }}
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
          <div key={it.id} className="group/flex flex items-center gap-2">
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
    </div>
  );
};
