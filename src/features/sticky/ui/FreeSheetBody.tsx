'use client';
// PRD B34 v0.3.26: a loose sticky (ideas, calls…). Each finished line is copied once into Rổ công việc.
import React, { useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { STICKY_COLORS, StickyNote } from '../model/stickyTypes';
import { newLineId, updateSticky } from '../model/stickyStore';
import { MotivationSticker } from '@/features/motivation';

export const FreeSheetBody: React.FC<{ note: StickyNote }> = ({ note }) => {
  const c = STICKY_COLORS[note.color];
  const { addInboxItem } = useApp();
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const lines = note.lines.length ? note.lines : [{ id: 'first', text: '' }];

  const setLines = (next: typeof lines) => updateSticky(note.id, { lines: next, title: next[0]?.text.trim().slice(0, 40) || 'Ghi chú' });
  const sendIfNew = (i: number, list = lines) => {
    const l = list[i];
    if (!l.text.trim() || l.sentToBasket) return list;
    addInboxItem({ title: l.text.trim(), source: 'quick' });
    const next = list.map((x, j) => (j === i ? { ...x, sentToBasket: true } : x));
    setLines(next);
    return next;
  };

  return (
    <div className="flex flex-col gap-1.5 text-[15px] leading-snug" style={{ color: c.ink }}>
      {/* PRD FEATURE v0.3.31 B2: Motivation sticker at top of free sheet */}
      {note.hasMotivationSticker && (
        <MotivationSticker
          slotKey="free_sheet"
          context="any"
          size="note"
          className="mb-1"
          onHide={() => updateSticky(note.id, { hasMotivationSticker: false })}
        />
      )}
      {lines.map((l, i) => (
        <input
          key={l.id}
          ref={el => { refs.current[l.id] = el; }}
          value={l.text}
          placeholder={i === 0 ? 'Ghi một dòng, Enter để xuống dòng…' : ''}
          onChange={e => setLines(lines.map((x, j) => (j === i ? { ...x, text: e.target.value, sentToBasket: x.sentToBasket && x.text === e.target.value } : x)))}
          onBlur={() => sendIfNew(i)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const after = sendIfNew(i);
              const id = newLineId();
              setLines([...after.slice(0, i + 1), { id, text: '' }, ...after.slice(i + 1)]);
              setTimeout(() => refs.current[id]?.focus(), 0);
            }
            if (e.key === 'Backspace' && !l.text && lines.length > 1) {
              e.preventDefault();
              const prev = lines[i - 1];
              setLines(lines.filter((_, j) => j !== i));
              if (prev) setTimeout(() => refs.current[prev.id]?.focus(), 0);
            }
          }}
          className="bg-transparent outline-none placeholder:opacity-60"
          style={{ color: c.ink }}
        />
      ))}
      <span className="mt-2 text-[11.5px]" style={{ color: c.muted }}>Mỗi dòng xong sẽ vào Rổ công việc → Chưa phân loại</span>
    </div>
  );
};
