// TAIO Time App — Rich Note Editor for Free Sticky Notes (PRD v0.3.57 Part G)
'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { STICKY_COLORS, StickyColor } from '../model/stickyTypes';

interface RichNoteEditorProps {
  color: StickyColor;
  initialContent: string;
  initialHtml?: string;
  placeholder?: string;
  onChange: (plainText: string, html: string) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

/**
 * Whitelist sanitizer: retains only plain text and <b>, <i>, <u>, <s>, <br>, <div>.
 * Strips all attributes, scripts, images, links, tables, styles, classes.
 */
export function sanitizeStickyHtml(rawHtml: string): string {
  if (typeof window === 'undefined') return rawHtml;
  if (!rawHtml) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  function cleanNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || '');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();

    // Dangerous tags to drop completely with children
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED'].includes(tag)) {
      return null;
    }

    // Line breaks
    if (tag === 'BR') {
      return document.createElement('br');
    }

    // Formatting tags to preserve
    let cleanEl: HTMLElement | null = null;
    if (tag === 'B' || tag === 'STRONG') {
      cleanEl = document.createElement('b');
    } else if (tag === 'I' || tag === 'EM') {
      cleanEl = document.createElement('i');
    } else if (tag === 'U') {
      cleanEl = document.createElement('u');
    } else if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') {
      cleanEl = document.createElement('s');
    } else if (tag === 'DIV' || tag === 'P') {
      cleanEl = document.createElement('div');
    }

    if (cleanEl) {
      // Append sanitized children without attributes
      for (let i = 0; i < el.childNodes.length; i++) {
        const child = cleanNode(el.childNodes[i]);
        if (child) cleanEl.appendChild(child);
      }
      return cleanEl;
    }

    // For any other tags (e.g. span, a, h1, etc.), strip the wrapper but keep clean children
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = cleanNode(el.childNodes[i]);
      if (child) fragment.appendChild(child);
    }
    return fragment;
  }

  const container = document.createElement('div');
  for (let i = 0; i < doc.body.childNodes.length; i++) {
    const child = cleanNode(doc.body.childNodes[i]);
    if (child) container.appendChild(child);
  }

  return container.innerHTML;
}

export const RichNoteEditor: React.FC<RichNoteEditorProps> = ({
  color,
  initialContent,
  initialHtml,
  placeholder = "Ghi ý nghĩ, công việc, danh sách… (gõ giờ '15:30 làm việc' để tự xếp lịch)",
  onChange,
  onBlur,
  autoFocus = false,
}) => {
  const c = STICKY_COLORS[color];
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isComposingRef = useRef(false);

  // Initialize editor content once
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    if (initialHtml) {
      el.innerHTML = sanitizeStickyHtml(initialHtml);
    } else if (initialContent) {
      // Convert plain text newlines to clean divs
      const safeLines = initialContent.split('\n');
      if (safeLines.length === 1) {
        el.textContent = safeLines[0];
      } else {
        el.innerHTML = safeLines.map(line => `<div>${line ? line.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '<br>'}</div>`).join('');
      }
    } else {
      el.innerHTML = '';
    }

    if (autoFocus && !initialContent && !initialHtml) {
      el.focus();
    }
  }, []); // Run once on mount

  const handleInput = useCallback(() => {
    if (isComposingRef.current) return;
    const el = editorRef.current;
    if (!el) return;

    // innerText produces clean plain text with newlines
    const plainText = el.innerText.replace(/\r\n/g, '\n');
    const sanitizedHtml = sanitizeStickyHtml(el.innerHTML);

    onChange(plainText, sanitizedHtml);
  }, [onChange]);

  // Execute formatting command without losing focus/selection
  const execFormat = (cmd: 'bold' | 'italic' | 'underline' | 'strikeThrough') => {
    document.execCommand(cmd, false);
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMeta = e.metaKey || e.ctrlKey;

    // Formatting shortcuts (Part G #1)
    if (isMeta && !e.shiftKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        execFormat('bold');
        return;
      }
      if (key === 'i') {
        e.preventDefault();
        execFormat('italic');
        return;
      }
      if (key === 'u') {
        e.preventDefault();
        execFormat('underline');
        return;
      }
    }

    // Strikethrough: ⌘⇧X / Ctrl+Shift+X or ⌘⇧S / Ctrl+Shift+S (Part G #1)
    if (isMeta && e.shiftKey) {
      const key = e.key.toLowerCase();
      if (key === 'x' || key === 's') {
        e.preventDefault();
        execFormat('strikeThrough');
        return;
      }
    }

    // Tab / Shift+Tab for indent (Part G #5 & v0.3.32 Part C2)
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Unindent: outdent block if possible
        document.execCommand('outdent', false);
      } else {
        // Indent with 2 spaces
        document.execCommand('insertText', false, '  ');
      }
      handleInput();
      return;
    }
  };

  // Paste handler: clean HTML & drop unsafe elements (Part G #3)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    const rawHtml = clipboardData.getData('text/html');
    const plainText = clipboardData.getData('text/plain');

    if (rawHtml) {
      const clean = sanitizeStickyHtml(rawHtml);
      document.execCommand('insertHTML', false, clean);
    } else if (plainText) {
      document.execCommand('insertText', false, plainText);
    }
    handleInput();
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-[160px]">
      {/* ContentEditable rich editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={handleInput}
        onCompositionStart={() => { isComposingRef.current = true; }}
        onCompositionEnd={() => { isComposingRef.current = false; handleInput(); }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          if (onBlur) onBlur();
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className="w-full flex-1 bg-transparent outline-none resize-none overflow-y-auto placeholder:opacity-50 text-[15px] leading-relaxed select-text font-normal whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:opacity-40 empty:before:pointer-events-none"
        style={{ color: c.ink, minHeight: '140px' }}
      />

      {/* iPhone / Mobile floating formatting toolbar: B · I · U · S (Part G #6) */}
      {isFocused && (
        <div
          className="sticky bottom-0 left-0 right-0 py-1 px-2 flex items-center gap-1.5 backdrop-blur-md rounded-xl border shadow-xs transition-opacity duration-150 z-10 self-start"
          style={{
            backgroundColor: `${c.paper}E6`,
            borderColor: `${c.muted}33`,
          }}
          onMouseDown={(e) => {
            // Prevent editor blur when tapping toolbar buttons
            e.preventDefault();
          }}
        >
          <button
            type="button"
            title="In đậm (⌘B / Ctrl+B)"
            onClick={() => execFormat('bold')}
            className="w-7 h-7 flex items-center justify-center rounded-lg border text-xs font-black transition-colors hover:bg-black/5 active:scale-95"
            style={{ color: c.ink, borderColor: `${c.muted}40` }}
          >
            B
          </button>
          <button
            type="button"
            title="In nghiêng (⌘I / Ctrl+I)"
            onClick={() => execFormat('italic')}
            className="w-7 h-7 flex items-center justify-center rounded-lg border text-xs italic font-serif transition-colors hover:bg-black/5 active:scale-95"
            style={{ color: c.ink, borderColor: `${c.muted}40` }}
          >
            I
          </button>
          <button
            type="button"
            title="Gạch chân (⌘U / Ctrl+U)"
            onClick={() => execFormat('underline')}
            className="w-7 h-7 flex items-center justify-center rounded-lg border text-xs underline font-semibold transition-colors hover:bg-black/5 active:scale-95"
            style={{ color: c.ink, borderColor: `${c.muted}40` }}
          >
            U
          </button>
          <button
            type="button"
            title="Gạch ngang (⌘⇧X / Ctrl+Shift+X)"
            onClick={() => execFormat('strikeThrough')}
            className="w-7 h-7 flex items-center justify-center rounded-lg border text-xs line-through font-semibold transition-colors hover:bg-black/5 active:scale-95"
            style={{ color: c.ink, borderColor: `${c.muted}40` }}
          >
            S
          </button>
        </div>
      )}
    </div>
  );
};
