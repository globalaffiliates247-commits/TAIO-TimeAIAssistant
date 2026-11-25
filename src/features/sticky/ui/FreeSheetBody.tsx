// TAIO Time App — Continuous Multi-Line Free Sheet Editor (PRD FIX v0.3.32 Part C2 & v0.3.37 Part E)
'use client';

import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { STICKY_COLORS, StickyNote } from '../model/stickyTypes';
import { updateSticky } from '../model/stickyStore';
import { MotivationSticker } from '@/features/motivation';
import { parseTimedText, toMins, toTime } from '../model/timeline';
import { commitQuickLine } from '@/features/tasks';
import { getDeviceCalendarDate } from '@/core/clock';
import { matchLinesWithStableIds } from '../model/lineMatcher';
import { RichNoteEditor } from './RichNoteEditor';

export const FreeSheetBody: React.FC<{ note: StickyNote }> = ({ note }) => {
  const c = STICKY_COLORS[note.color];
  const { addDailyCardItem, updateDailyCardItem, goals } = useApp();

  // Initialize content: from note.content or join legacy lines
  const initialText = note.content ?? note.lines.map(l => l.text).join('\n');
  const [text, setText] = useState(initialText);
  const textRef = useRef(text);
  textRef.current = text;

  const [html, setHtml] = useState(note.contentHtml || '');
  const htmlRef = useRef(html);
  htmlRef.current = html;

  // PRD v0.3.39 Part E2.1-E2.2: Refs for stable persistNow identity across renders
  const noteRef = useRef(note);
  noteRef.current = note;
  const addDailyCardItemRef = useRef(addDailyCardItem);
  addDailyCardItemRef.current = addDailyCardItem;
  const updateDailyCardItemRef = useRef(updateDailyCardItem);
  updateDailyCardItemRef.current = updateDailyCardItem;
  const goalsRef = useRef(goals);
  goalsRef.current = goals;

  const lastSavedTextRef = useRef(initialText);
  const lastSavedHtmlRef = useRef(note.contentHtml || '');

  const [saved, setSaved] = useState(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scheduledMapRef = useRef<Record<string, string>>(note.scheduledMap || {});

  // Sync if external note content changes
  useEffect(() => {
    if (note.content !== undefined && note.content !== textRef.current) {
      setText(note.content);
      textRef.current = note.content;
      lastSavedTextRef.current = note.content;
      if (note.contentHtml !== undefined) {
        setHtml(note.contentHtml);
        htmlRef.current = note.contentHtml;
        lastSavedHtmlRef.current = note.contentHtml;
      }
      setSaved(true);
    }
  }, [note.content, note.contentHtml]);

  // Core persist function (PRD v0.3.39 Part E2.1 & E2.2: Stable identity, only save on change)
  const persistNow = useCallback((contentToSave: string, htmlToSave?: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const currentHtml = htmlToSave !== undefined ? htmlToSave : htmlRef.current;

    // Chỉ ghi khi có thay đổi thực sự
    if (contentToSave === lastSavedTextRef.current && currentHtml === lastSavedHtmlRef.current) {
      return;
    }

    const today = getDeviceCalendarDate();
    const rawLines = contentToSave.split('\n');
    const matchedLines = matchLinesWithStableIds(rawLines, noteRef.current.lines);
    const updatedScheduledMap = { ...scheduledMapRef.current };

    // 1. Process lines starting with time (e.g. "15:30 gọi anh Minh")
    matchedLines.forEach((line, idx) => {
      const trimmed = line.text.trim();
      if (!trimmed) return;

      const parsed = parseTimedText(trimmed);
      if (parsed.time) {
        const lineKey = line.id;
        const legacyKey = `line_${idx}`;
        const existingTaskId = updatedScheduledMap[lineKey] || updatedScheduledMap[legacyKey];

        const dur = parsed.durationMins || 30;
        const endTime = toTime(toMins(parsed.time) + dur);

        if (existingTaskId) {
          updateDailyCardItemRef.current(existingTaskId, {
            text: parsed.rest || 'Công việc không tên',
            start: parsed.time,
            end: endTime,
            extra: { estimateMins: dur },
          });
          if (updatedScheduledMap[legacyKey]) {
            delete updatedScheduledMap[legacyKey];
          }
          updatedScheduledMap[lineKey] = existingTaskId;
        } else {
          const createdId = commitQuickLine(trimmed, today, {
            addDailyCardItem: addDailyCardItemRef.current,
            goals: goalsRef.current,
          });
          if (createdId) {
            updatedScheduledMap[lineKey] = createdId;
          }
        }
      }
    });

    scheduledMapRef.current = updatedScheduledMap;

    const firstLineTrimmed = rawLines.find(l => l.trim())?.trim() || '';
    const title = firstLineTrimmed.slice(0, 40) || 'Ghi chú';

    updateSticky(note.id, {
      content: contentToSave,
      contentHtml: currentHtml,
      lines: matchedLines,
      title,
      scheduledMap: updatedScheduledMap,
    });

    lastSavedTextRef.current = contentToSave;
    lastSavedHtmlRef.current = currentHtml;
    setSaved(true);
  }, [note.id]);

  // Handle typing with 2-second debounce (Rule E2.3)
  const handleChange = (plainText: string, sanitizedHtml: string) => {
    setText(plainText);
    textRef.current = plainText;
    setHtml(sanitizedHtml);
    htmlRef.current = sanitizedHtml;
    setSaved(false);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      persistNow(plainText, sanitizedHtml);
    }, 2000);
  };

  // Immediate save on blur (Rule E2.3)
  const handleBlur = () => {
    persistNow(textRef.current, htmlRef.current);
  };

  // Immediate save on unmount, page hide, visibility change, beforeunload (PRD v0.3.39 Part E2.1 & E2.2)
  useEffect(() => {
    const handleImmediateFlush = () => {
      if (textRef.current !== lastSavedTextRef.current || htmlRef.current !== lastSavedHtmlRef.current) {
        persistNow(textRef.current, htmlRef.current);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleImmediateFlush();
      }
    };

    window.addEventListener('pagehide', handleImmediateFlush);
    window.addEventListener('beforeunload', handleImmediateFlush);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      handleImmediateFlush();
      window.removeEventListener('pagehide', handleImmediateFlush);
      window.removeEventListener('beforeunload', handleImmediateFlush);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [note.id, persistNow]);

  return (
    <div className="flex flex-col gap-1.5 text-[15px] leading-snug min-h-full" style={{ color: c.ink }}>
      {/* Motivation sticker at top of free sheet */}
      {note.hasMotivationSticker && (
        <MotivationSticker
          slotKey="free_sheet"
          context="any"
          size="note"
          className="mb-1"
          palette={c}
          onHide={() => updateSticky(note.id, { hasMotivationSticker: false })}
        />
      )}

      {/* Rich Note Editor with formatting shortcuts & iPhone toolbar (PRD v0.3.57 Part G) */}
      <RichNoteEditor
        color={note.color}
        initialContent={initialText}
        initialHtml={note.contentHtml}
        onChange={handleChange}
        onBlur={handleBlur}
        autoFocus={!text}
      />

      <span className="mt-2 text-[11px] select-none flex items-center justify-between" style={{ color: c.muted }}>
        <span>{saved ? '✓ Đã tự lưu' : '● Đang lưu…'}</span>
        <span>Bôi chọn tự do · Tab lùi cấp · Gõ giờ xếp lịch</span>
      </span>
    </div>
  );
};
