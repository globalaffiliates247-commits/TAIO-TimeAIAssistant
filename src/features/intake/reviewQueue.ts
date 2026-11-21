// TAIO Time App — Intake Review Queue & Deduplication (PRD v0.3.52 Part B3 & B4)
import { getStorageItemSync, setStorageItemSync } from '../../core/storage/durableStorage.ts';

export interface IntakePendingItem {
  id: string;
  source: 'voice' | 'telegram' | 'manual';
  rawText: string;
  normalizedText: string;
  receivedAt: string;
  externalId?: string;
  status: 'pending' | 'accepted' | 'dismissed';
}

const STORAGE_KEY_PROCESSED_EXTERNAL_IDS = 'taio_processed_external_ids';
const STORAGE_KEY_REVIEW_QUEUE = 'taio_intake_review_queue';

// In-memory cache for ultra-fast check
const processedIdsCache = new Set<string>();

export function isExternalIdProcessed(externalId?: string): boolean {
  if (!externalId) return false;
  if (processedIdsCache.has(externalId)) return true;

  const stored = getStorageItemSync<string[]>(STORAGE_KEY_PROCESSED_EXTERNAL_IDS, []);
  if (Array.isArray(stored)) {
    stored.forEach(id => processedIdsCache.add(id));
  }

  return processedIdsCache.has(externalId);
}

export function markExternalIdProcessed(externalId?: string): void {
  if (!externalId) return;
  processedIdsCache.add(externalId);

  const arr = Array.from(processedIdsCache).slice(-1000); // keep last 1000
  setStorageItemSync<string[]>(STORAGE_KEY_PROCESSED_EXTERNAL_IDS, arr);
}

export function getReviewQueue(): IntakePendingItem[] {
  return getStorageItemSync<IntakePendingItem[]>(STORAGE_KEY_REVIEW_QUEUE, []);
}

export function enqueueReviewItem(item: Omit<IntakePendingItem, 'id' | 'status'>): IntakePendingItem {
  const newItem: IntakePendingItem = {
    ...item,
    id: `intake-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    status: 'pending'
  };

  const current = getReviewQueue();
  current.unshift(newItem);
  setStorageItemSync<IntakePendingItem[]>(STORAGE_KEY_REVIEW_QUEUE, current.slice(0, 200));

  return newItem;
}
