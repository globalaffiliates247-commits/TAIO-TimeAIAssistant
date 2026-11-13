// TAIO Time App — Resizable Stickies Hook (PRD FIX v0.3.32 Part B)
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export type ResizeDirection = 'e' | 's' | 'w' | 'n' | 'se' | 'sw' | 'ne' | 'nw';

export interface UseStickyResizeProps {
  noteId: string;
  initialX: number;
  initialY: number;
  initialW?: number;
  initialH?: number;
  defaultW: number;
  defaultH: number;
  minW?: number;
  minH?: number;
  onCommit: (patch: { x?: number; y?: number; w?: number; h?: number; collapsed?: boolean }) => void;
}

export function useStickyResize({
  noteId,
  initialX,
  initialY,
  initialW,
  initialH,
  defaultW,
  defaultH,
  minW = 240,
  minH = 160,
  onCommit,
}: UseStickyResizeProps) {
  const [size, setSize] = useState<{ x: number; y: number; w: number; h: number }>({
    x: initialX,
    y: initialY,
    w: initialW || defaultW,
    h: initialH || defaultH,
  });

  const [isResizing, setIsResizing] = useState(false);

  // Sync when props change from external updates
  useEffect(() => {
    setSize(prev => ({
      x: initialX,
      y: initialY,
      w: initialW || prev.w || defaultW,
      h: initialH || prev.h || defaultH,
    }));
  }, [initialX, initialY, initialW, initialH, defaultW, defaultH]);

  const resizeRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    direction: ResizeDirection;
  } | null>(null);

  const startResize = useCallback(
    (direction: ResizeDirection, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const winH = typeof window !== 'undefined' ? window.innerHeight : 800;

      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: size.x,
        origY: size.y,
        origW: size.w,
        origH: size.h,
        direction,
      };

      setIsResizing(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const onPointerMove = (ev: PointerEvent) => {
        if (!resizeRef.current) return;
        const { startX, startY, origX, origY, origW, origH, direction: dir } = resizeRef.current;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        let newX = origX;
        let newY = origY;
        let newW = origW;
        let newH = origH;

        // East / West
        if (dir.includes('e')) {
          newW = Math.max(minW, Math.min(winW - origX, origW + dx));
        } else if (dir.includes('w')) {
          const maxLeftShift = origX;
          const clampedDx = Math.max(-maxLeftShift, Math.min(origW - minW, dx));
          newX = origX + clampedDx;
          newW = origW - clampedDx;
        }

        // South / North
        if (dir.includes('s')) {
          newH = Math.max(minH, Math.min(winH - origY, origH + dy));
        } else if (dir.includes('n')) {
          const maxTopShift = origY;
          const clampedDy = Math.max(-maxTopShift, Math.min(origH - minH, dy));
          newY = origY + clampedDy;
          newH = origH - clampedDy;
        }

        setSize({ x: newX, y: newY, w: newW, h: newH });
      };

      const onPointerUp = (ev: PointerEvent) => {
        if (resizeRef.current) {
          setSize(current => {
            onCommit({ x: current.x, y: current.y, w: current.w, h: current.h });
            return current;
          });
        }
        resizeRef.current = null;
        setIsResizing(false);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },
    [size, minW, minH, onCommit]
  );

  return {
    size,
    isResizing,
    startResize,
  };
}
