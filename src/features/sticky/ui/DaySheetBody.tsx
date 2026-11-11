'use client';
// PRD B34 v0.3.26: "Hôm nay" sheet. Lines are Thẻ ngày items (so they sync and show in Rổ công việc):
// a line that starts with a time is "Có giờ", lines under "Chưa xếp giờ" are "Linh động".
import React, { useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { DailyCardItem } from '@/types';
import { getDeviceNow } from '@/core/clock';
import { STICKY_COLORS, StickyNote } from '../model/stickyTypes';
import {
  findGaps, fmtDuration, nextFreeStart, parseTimedText, priorityOf, suggestDuration,
  suggestForGap, toMins, toTime, durationOf,
} from '../model/timeline';
import { IconHourglass, IconLock, IconSpark } from './StickyIcons';

export const DaySheetBody: React.FC<{ note: StickyNote }> = ({ note }) => {
  const c = STICKY_COLORS[note.color];
  const { dailyCardItems, addDailyCardItem, updateDailyCardItem, removeDailyCardItem, toggleDailyCardItem } = useApp();
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
    const p = parseTimedText(draft);
    if (!p.rest) return;
    if (!p.time) {
      addDailyCardItem({ text: draft.trim(), date: day, origin: 'planned' });
      setDraft('');
      return;
    }
    const dur = p.durationMins ?? pill ?? undefined;
    const end = dur ? toTime(toMins(p.time) + dur) : undefined;
    addDailyCardItem({ text: p.rest, date: day, start: p.time, end, origin: 'planned' });
    setPill(null);
    // After a duration is set, the next line starts at the next free time (founder flow, 15:45 -> 16:15)
    setDraft(end ? `${nextFreeStart([...timed, { id: 'new', start: p.time, end } as DailyCardItem], toMins(end))} ` : '');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveEdit = (it: DailyCardItem) => {
    const p = parseTimedText(editText);
    if (!p.rest) { removeDailyCardItem(it.id); setEditing(null); return; }
    const oldDur = durationOf(it);
    const dur = p.durationMins ?? oldDur;
    if (p.time) {
      updateDailyCardItem(it.id, { text: p.rest, start: p.time, end: dur ? toTime(toMins(p.time) + dur) : undefined });
    } else {
      updateDailyCardItem(it.id, { text: p.rest, start: undefined, end: undefined }); // time removed -> unscheduled
    }
    setEditing(null);
  };

  const lineText = (it: DailyCardItem) => (it.start ? `${it.start} ${it.text}${durationOf(it) ? ` ${durationOf(it)}p` : ''}` : it.text);
  const pillStyle: React.CSSProperties = { border: `1px solid ${c.line}`, color: c.muted };

  const renderText = (it: DailyCardItem) =>
    editing === it.id ? (
      <input
        autoFocus value={editText} onChange={e => setEditText(e.target.value)}
        onBlur={() => saveEdit(it)}
        onKeyDown={e => { if (e.key === 'Enter') saveEdit(it); if (e.key === 'Escape') setEditing(null); }}
        className="flex-1 bg-transparent outline-none min-w-0" style={{ color: c.ink }}
      />
    ) : (
      <span
        className="flex-1 min-w-0 cursor-text"
        style={{ textDecoration: it.status === 'done' ? 'line-through' : undefined, opacity: it.status === 'done' ? 0.5 : 1 }}
        onClick={() => { setEditing(it.id); setEditText(lineText(it)); }}
      >
        {it.text.replace(/#\d\b/, '').trim()}
        {priorityOf(it.text) < 99 && <span className="ml-1.5 text-xs font-semibold" style={{ color: c.muted }}>#{priorityOf(it.text)}</span>}
      </span>
    );

  const taken = new Set<string>(skipped);
  const freeTotal = gaps.reduce((s, g) => s + g.mins, 0);

  return (
    <div className="flex flex-col gap-2 text-[15px] leading-snug" style={{ color: c.ink }}>
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
        const sug = gap ? suggestForGap(flex, taken) : undefined;
        if (sug) taken.add(sug.id);
        return (
          <React.Fragment key={it.id}>
            <div className="flex items-center gap-2">
              <button title="Chạm để đánh dấu xong" onClick={() => toggleDailyCardItem(it.id)}
                className="font-semibold tabular-nums shrink-0" style={{ color: c.ink }}>{it.start}</button>
              {renderText(it)}
              {durationOf(it) && <span className="shrink-0 h-5 px-2 rounded-full text-[11.5px] font-medium flex items-center" style={pillStyle}>{fmtDuration(durationOf(it)!)}</span>}
              {boundIds.has(it.id) && <span className="shrink-0" title="Đã lên lịch trước"><IconLock color={c.muted} /></span>}
            </div>
            {gap && (
              <div className="flex items-center gap-2 text-sm" style={{ color: c.muted }}>
                <span className="font-semibold tabular-nums">{gap.start}</span>
                <IconHourglass color={c.muted} />
                <span>trống đến {gap.end} · {fmtDuration(gap.mins)}</span>
              </div>
            )}
            {gap && sug && (
              <div className="flex items-center gap-2 text-[13.5px] pl-12" style={{ color: c.ink }}>
                <IconSpark color={c.muted} />
                <span className="flex-1 min-w-0">Gợi ý: {sug.text.replace(/#\d\b/, '').trim()} · {fmtDuration(Math.min(gap.mins, suggestDuration(sug.text, sug.goalId, dailyCardItems, gap.mins)))}</span>
                <button className="underline underline-offset-2 font-semibold text-[12.5px]"
                  onClick={() => updateDailyCardItem(sug.id, { start: gap.start, end: toTime(toMins(gap.start) + Math.min(gap.mins, suggestDuration(sug.text, sug.goalId, dailyCardItems, gap.mins))) })}>
                  Xếp vào
                </button>
                <button className="text-[12.5px]" style={{ color: c.muted }} onClick={() => setSkipped(new Set([...skipped, sug.id]))}>Khác</button>
              </div>
            )}
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
      {flex.map(it => (
        <div key={it.id} className="flex items-center gap-2">
          <button title="Chạm để đánh dấu xong" onClick={() => toggleDailyCardItem(it.id)} className="shrink-0" style={{ color: c.muted }}>•</button>
          {renderText(it)}
        </div>
      ))}
      <input
        value={flexDraft} placeholder="thêm việc chưa xếp giờ…"
        onChange={e => setFlexDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && flexDraft.trim()) { addDailyCardItem({ text: flexDraft.trim(), date: day }); setFlexDraft(''); } }}
        className="bg-transparent outline-none placeholder:opacity-60" style={{ color: c.ink }}
      />

      <div className="mt-2 pt-2 flex items-center justify-between text-[11.5px]" style={{ borderTop: `1px solid ${c.line}`, color: c.muted }}>
        <span>Tự lưu · {items.length} việc hôm nay</span>
        <span>Còn trống: {fmtDuration(freeTotal)}</span>
      </div>
    </div>
  );
};
