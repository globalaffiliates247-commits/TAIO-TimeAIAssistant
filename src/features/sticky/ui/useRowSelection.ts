// TAIO Time App — Multi-Row Selection Hook (PRD FIX v0.3.32 Part C3)
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { DailyCardItem } from '@/types';

export interface UseRowSelectionOptions {
  items: DailyCardItem[];
  isEditing: boolean;
  onDeleteItems: (itemsToDelete: DailyCardItem[]) => void;
  onRestoreItems?: (restoredItems: DailyCardItem[]) => void;
  onReorderFlex?: (fromIndex: number, toIndex: number) => void;
}

export interface UndoBatch {
  items: DailyCardItem[];
  timestamp: number;
}

export function useRowSelection({
  items,
  isEditing,
  onDeleteItems,
  onRestoreItems,
}: UseRowSelectionOptions) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [undoToast, setUndoToast] = useState<{ count: number; items: DailyCardItem[] } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDeletedRef = useRef<DailyCardItem[]>([]);

  // Clear toast timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const selectRow = useCallback(
    (id: string, isShift: boolean, isMetaOrCtrl: boolean = false) => {
      setSelectedIds(prev => {
        const next = new Set(prev);

        if (isShift && lastSelectedId) {
          const idxA = items.findIndex(i => i.id === lastSelectedId);
          const idxB = items.findIndex(i => i.id === id);
          if (idxA !== -1 && idxB !== -1) {
            const start = Math.min(idxA, idxB);
            const end = Math.max(idxA, idxB);
            const range = items.slice(start, end + 1).map(i => i.id);
            return new Set([...prev, ...range]);
          }
        }

        if (isMetaOrCtrl) {
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }

        // Single click: select only this item
        return new Set([id]);
      });

      setLastSelectedId(id);
    },
    [items, lastSelectedId]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(i => i.id)));
  }, [items]);

  // Pointer drag to select multiple rows
  const handleRowPointerDown = useCallback(
    (id: string, e: React.PointerEvent) => {
      if (isEditing || (e.target as HTMLElement).closest('input, button, [contenteditable]')) return;
      if (e.shiftKey) {
        selectRow(id, true, false);
      } else if (e.metaKey || e.ctrlKey) {
        selectRow(id, false, true);
      } else {
        selectRow(id, false, false);
        setIsDragSelecting(true);
      }
    },
    [isEditing, selectRow]
  );

  const handleRowPointerEnter = useCallback(
    (id: string) => {
      if (isDragSelecting) {
        setSelectedIds(prev => new Set([...prev, id]));
      }
    },
    [isDragSelecting]
  );

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDragSelecting) setIsDragSelecting(false);
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [isDragSelecting]);

  // Delete selected rows
  const deleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;

    const toDelete = items.filter(i => selectedIds.has(i.id));
    if (toDelete.length === 0) return;

    // Part C3 #6: Confirm before bulk deleting tasks with actual running time
    const hasActualTime = toDelete.some(it => {
      const extra = (it.extra as Record<string, unknown> | undefined) || {};
      return typeof extra.actualMinutes === 'number' && extra.actualMinutes > 0;
    });

    if (hasActualTime) {
      const ok = window.confirm(
        'Trong các việc được chọn có việc đã chạy đồng hồ thực tế. Bạn có chắc muốn xóa không?'
      );
      if (!ok) return;
    }

    lastDeletedRef.current = toDelete;
    onDeleteItems(toDelete);
    clearSelection();

    // Show undo toast for 5 seconds (Part C3 #3)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoToast({ count: toDelete.length, items: toDelete });
    undoTimeoutRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 5000);
  }, [selectedIds, items, onDeleteItems, clearSelection]);

  // Undo delete
  const handleUndo = useCallback(() => {
    if (lastDeletedRef.current.length > 0 && onRestoreItems) {
      onRestoreItems(lastDeletedRef.current);
      lastDeletedRef.current = [];
      setUndoToast(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  }, [onRestoreItems]);

  // Copy selected rows to clipboard
  const copySelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const selectedItems = items.filter(i => selectedIds.has(i.id));
    const text = selectedItems
      .map(i => (i.start ? `${i.start} ${i.text}` : i.text))
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Ignore
    }
  }, [selectedIds, items]);

  // Cut selected rows
  const cutSelected = useCallback(async () => {
    await copySelected();
    deleteSelected();
  }, [copySelected, deleteSelected]);

  // Global keyboard shortcuts (when not typing in an input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // ⌘A when not in an input
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a' && !isInput) {
        e.preventDefault();
        selectAll();
        return;
      }

      // ⌘Z undo when not in an input
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !isInput) {
        if (undoToast || lastDeletedRef.current.length > 0) {
          e.preventDefault();
          handleUndo();
          return;
        }
      }

      // Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        if (selectedIds.size > 0) {
          e.preventDefault();
          deleteSelected();
          return;
        }
      }

      // ⌘C copy
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && !isInput) {
        if (selectedIds.size > 0) {
          e.preventDefault();
          copySelected();
          return;
        }
      }

      // ⌘X cut
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'x' && !isInput) {
        if (selectedIds.size > 0) {
          e.preventDefault();
          cutSelected();
          return;
        }
      }

      // Arrow navigation
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !isInput && items.length > 0) {
        e.preventDefault();
        const currentIdx = lastSelectedId
          ? items.findIndex(i => i.id === lastSelectedId)
          : -1;
        const nextIdx =
          e.key === 'ArrowUp'
            ? Math.max(0, currentIdx - 1)
            : Math.min(items.length - 1, currentIdx + 1);
        const nextItem = items[nextIdx];
        if (nextItem) {
          selectRow(nextItem.id, e.shiftKey, false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, isEditing, selectedIds, lastSelectedId, selectAll, deleteSelected, copySelected, cutSelected, handleUndo, undoToast, selectRow]);

  return {
    selectedIds,
    isDragSelecting,
    selectRow,
    clearSelection,
    selectAll,
    deleteSelected,
    copySelected,
    cutSelected,
    undoToast,
    handleUndo,
    handleRowPointerDown,
    handleRowPointerEnter,
  };
}
