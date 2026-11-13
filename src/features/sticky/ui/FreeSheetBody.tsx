// TAIO Time App — Continuous Multi-Line Free Sheet Editor (PRD FIX v0.3.32 Part C2)
'use client';

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { STICKY_COLORS, StickyNote } from '../model/stickyTypes';
import { updateSticky } from '../model/stickyStore';
import { MotivationSticker } from '@/features/motivation';
import { parseTimedText, toMins, toTime } from '../model/timeline';
import { commitQuickLine } from '@/features/tasks';
import { getDeviceCalendarDate } from '@/core/clock';

export const FreeSheetBody: React.FC<{ note: StickyNote }> = ({ note }) => {
  const c = STICKY_COLORS[note.color];
  const { addInboxItem, addDailyCardItem, updateDailyCardItem, goals } = useApp();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize content: from note.content or join legacy lines
  const initialText = note.content ?? note.lines.map(l => l.text).join('\n');
  const [text, setText] = useState(initialText);
  const scheduledMapRef = useRef<Record<string, string>>(note.scheduledMap || {});

  // Sync if external note content changes
  useEffect(() => {
    if (note.content !== undefined && note.content !== text) {
      setText(note.content);
    }
  }, [note.content]);

  // Auto-resize textarea to fit content without scrollbars
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(160, el.scrollHeight)}px`;
  };

  useLayoutEffect(() => {
    autoResize();
  }, [text]);

  const handleBlur = () => {
    const today = getDeviceCalendarDate();
    const rawLines = text.split('\n');
    const updatedScheduledMap = { ...scheduledMapRef.current };

    // 1. Process lines starting with time (e.g. "15:30 gọi anh Minh")
    rawLines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const parsed = parseTimedText(trimmed);
      if (parsed.time) {
        // Line starts with time -> sync to today's schedule
        const lineKey = `line_${idx}`;
        const existingTaskId = updatedScheduledMap[lineKey];

        const dur = parsed.durationMins || 30;
        const endTime = toTime(toMins(parsed.time) + dur);

        if (existingTaskId) {
          // Update existing task without creating duplicates (Criteria C5 #4)
          updateDailyCardItem(existingTaskId, {
            text: parsed.rest || 'Công việc không tên',
            start: parsed.time,
            end: endTime,
            extra: { estimateMins: dur },
          });
        } else {
          // Create new task and map it
          const createdId = commitQuickLine(trimmed, today, { addDailyCardItem, goals });
          if (createdId) {
            updatedScheduledMap[lineKey] = createdId;
          }
        }
      }
    });

    scheduledMapRef.current = updatedScheduledMap;

    // 2. Persist to sticky store
    const lines = rawLines.map((l, i) => ({
      id: note.lines[i]?.id || `line-${Date.now()}-${i}`,
      text: l,
      done: note.lines[i]?.done || false,
    }));

    const firstLineTrimmed = rawLines.find(l => l.trim())?.trim() || '';
    const title = firstLineTrimmed.slice(0, 40) || 'Ghi chú';

    updateSticky(note.id, {
      content: text,
      lines,
      title,
      scheduledMap: updatedScheduledMap,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current;
    if (!el) return;

    // Tab / Shift+Tab for Indentation (Part C2 #3)
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;

      if (e.shiftKey) {
        // Shift+Tab: Unindent
        if (text.slice(lineStart, lineStart + 2) === '  ') {
          const next = text.slice(0, lineStart) + text.slice(lineStart + 2);
          setText(next);
          setTimeout(() => {
            el.selectionStart = Math.max(lineStart, start - 2);
            el.selectionEnd = Math.max(lineStart, end - 2);
          }, 0);
        } else if (text[lineStart] === '\t') {
          const next = text.slice(0, lineStart) + text.slice(lineStart + 1);
          setText(next);
          setTimeout(() => {
            el.selectionStart = Math.max(lineStart, start - 1);
            el.selectionEnd = Math.max(lineStart, end - 1);
          }, 0);
        }
      } else {
        // Tab: Indent 2 spaces
        const next = text.slice(0, lineStart) + '  ' + text.slice(lineStart);
        setText(next);
        setTimeout(() => {
          el.selectionStart = start + 2;
          el.selectionEnd = end + 2;
        }, 0);
      }
    }
  };

  return (
    <div className="flex flex-col gap-1.5 text-[15px] leading-snug min-h-full" style={{ color: c.ink }}>
      {/* Motivation sticker at top of free sheet */}
      {note.hasMotivationSticker && (
        <MotivationSticker
          slotKey="free_sheet"
          context="any"
          size="note"
          className="mb-1"
          onHide={() => updateSticky(note.id, { hasMotivationSticker: false })}
        />
      )}

      {/* Single continuous multi-line editor (PRD FIX v0.3.32 Part C2) */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Ghi ý nghĩ, công việc, danh sách… (gõ giờ '15:30 làm việc' để tự xếp lịch)"
        rows={6}
        className="w-full flex-1 bg-transparent outline-none resize-none overflow-hidden placeholder:opacity-50 text-[15px] leading-relaxed select-text font-normal"
        style={{ color: c.ink }}
        autoFocus={!text}
      />

      <span className="mt-2 text-[11px] select-none" style={{ color: c.muted }}>
        Tự lưu · Bôi chọn tự do, Tab lùi cấp, gõ giờ tự xếp lịch
      </span>
    </div>
  );
};
