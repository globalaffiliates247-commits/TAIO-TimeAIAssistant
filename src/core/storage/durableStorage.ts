'use client';

import { Capacitor } from '@capacitor/core';
import { TAIONative } from '../../features/native';

const IDB_NAME = 'taio_durable_db';
const IDB_VERSION = 1;
const IDB_STORE = 'kv_store';
const LS_PREFIX = 'taio_durable_v1_';

export interface DurableRecord<T = unknown> {
  key: string;
  value: T;
  updatedAt: number;
}

function openIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet<T>(key: string, value: T, updatedAt: number): Promise<void> {
  const db = await openIndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put({ key, value, updatedAt });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function idbGet<T>(key: string): Promise<DurableRecord<T> | null> {
  const db = await openIndexedDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result as DurableRecord<T>);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbClearAll(): Promise<void> {
  const db = await openIndexedDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Write a state slice to durable storage immediately:
 * 1) Native SQLite (on iOS/Android via TAIONative plugin)
 * 2) IndexedDB (on Web & WebView)
 * 3) localStorage mirror for synchronous fallback
 */
export async function saveDurableState<T>(key: string, value: T, updatedAt: number = Date.now()): Promise<void> {
  const serialized = JSON.stringify({ key, value, updatedAt });

  // 1. Synchronous mirror for instant read
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${LS_PREFIX}${key}`, serialized);
    }
  } catch {
    // Ignore quota/private mode errors
  }

  // 2. IndexedDB durable write
  await idbSet(key, value, updatedAt);

  // 3. Native SQLite write when inside Capacitor native shell
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      await TAIONative.sqliteSetItem({
        key,
        value: JSON.stringify(value),
        updatedAt,
      });
    } catch {
      // Fallback already persisted in IndexedDB
    }
  }
}

/**
 * Load a state slice from durable storage (Native SQLite + IndexedDB + localStorage),
 * always returning the copy with the newest `updatedAt` timestamp so an origin change
 * or WebView cache purge never loses native SQLite data.
 */
export async function loadDurableState<T>(key: string): Promise<DurableRecord<T> | null> {
  const candidates: DurableRecord<T>[] = [];

  // 1. Check Native SQLite first when on native platform
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const sqliteRes = await TAIONative.sqliteGetItem({ key });
      if (sqliteRes && sqliteRes.value) {
        const parsed = JSON.parse(sqliteRes.value) as T;
        candidates.push({
          key,
          value: parsed,
          updatedAt: sqliteRes.updatedAt || Date.now(),
        });
      }
    } catch {
      // Continue to IndexedDB
    }
  }

  // 2. Check IndexedDB
  const idbRecord = await idbGet<T>(key);
  if (idbRecord && idbRecord.value !== undefined) {
    candidates.push(idbRecord);
  }

  // 3. Check localStorage mirror
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`${LS_PREFIX}${key}`);
      if (raw) {
        const parsed = JSON.parse(raw) as DurableRecord<T>;
        if (parsed && parsed.value !== undefined) {
          candidates.push(parsed);
        }
      }
    }
  } catch {
    // Ignore parse errors
  }

  if (candidates.length === 0) return null;

  // Pick candidate with newest updatedAt
  candidates.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return candidates[0];
}

/**
 * Clear all durable storage (B27 "Xóa toàn bộ dữ liệu")
 */
export async function clearAllDurableState(): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(LS_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => window.localStorage.removeItem(k));
    }
  } catch {}

  await idbClearAll();

  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      await TAIONative.sqliteClearAll();
    } catch {}
  }
}

export function toEpochMs(ts?: string | number): number {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * PRD E5 Merge Rule:
 * On opening, the app shows local data first, then merges with the server.
 * A newer local change is NEVER overwritten by an older server copy
 * (compare per-item update time; the newest wins, and local additions are preserved).
 */
export function mergeCollectionsByUpdatedAt<T extends { id: string; updatedAt?: string | number }>(
  localItems: T[],
  serverItems: T[],
  deletedIds: string[] = []
): T[] {
  const deletedSet = new Set(deletedIds);
  const mergedMap = new Map<string, T>();
  const orderIds: string[] = [];

  // 1. Place all local items first (preserving user's local order and additions)
  for (const localItem of localItems) {
    if (deletedSet.has(localItem.id)) continue;
    mergedMap.set(localItem.id, localItem);
    orderIds.push(localItem.id);
  }

  // 2. Merge server items only if not deleted locally and strictly newer than local item
  for (const serverItem of serverItems) {
    if (deletedSet.has(serverItem.id)) continue;
    const existingLocal = mergedMap.get(serverItem.id);
    if (!existingLocal) {
      mergedMap.set(serverItem.id, serverItem);
      orderIds.push(serverItem.id);
    } else {
      const localTime = toEpochMs(existingLocal.updatedAt) || 1;
      const serverTime = toEpochMs(serverItem.updatedAt) || 0;
      if (serverTime > localTime) {
        mergedMap.set(serverItem.id, serverItem);
      }
    }
  }

  return orderIds.map(id => mergedMap.get(id)!).filter(Boolean);
}
