// TAIO Time App — Cross-Window Synchronization Bus (PRD v0.3.50 Part A1)
'use client';

export interface WindowBusMessage {
  dataset: 'sticky' | 'dailyCardItems' | 'blocks' | 'goals' | 'dayReviews' | (string & {});
  timestamp: number;
  senderId: string;
  payload?: any;
}

type WindowBusListener = (msg: WindowBusMessage) => void;

const SENDER_ID = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `win-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const CHANNEL_NAME = 'taio_window_bus';
const STORAGE_SYNC_KEY = 'taio_window_bus_storage_event';

let channel: BroadcastChannel | null = null;
const listeners = new Set<WindowBusListener>();

// A4: Track currently focused/active editing item id to prevent cursor jumping
const activeEditingMap = new Map<string, string>();

export function setActiveEditingId(dataset: string, id: string | null): void {
  if (id) {
    activeEditingMap.set(dataset, id);
  } else {
    activeEditingMap.delete(dataset);
  }
}

export function getActiveEditingId(dataset: string): string | null {
  return activeEditingMap.get(dataset) || null;
}

export function getWindowSenderId(): string {
  return SENDER_ID;
}

// Initialize channel and fallback listeners
if (typeof window !== 'undefined') {
  try {
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        try {
          const msg = event.data as WindowBusMessage;
          if (msg && typeof msg === 'object' && msg.senderId && msg.senderId !== SENDER_ID) {
            listeners.forEach((fn) => {
              try {
                fn(msg);
              } catch {}
            });
          }
        } catch {}
      };
    }
  } catch {
    channel = null;
  }

  // Fallback: window 'storage' event across tabs/windows
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === STORAGE_SYNC_KEY && e.newValue) {
      try {
        const msg = JSON.parse(e.newValue) as WindowBusMessage;
        if (msg && typeof msg === 'object' && msg.senderId && msg.senderId !== SENDER_ID) {
          listeners.forEach((fn) => {
            try {
              fn(msg);
            } catch {}
          });
        }
      } catch {}
    }
  });
}

/**
 * Broadcasts a dataset change to all other windows/tabs.
 */
export function broadcastWindowBus(
  dataset: WindowBusMessage['dataset'],
  payload?: any
): void {
  const msg: WindowBusMessage = {
    dataset,
    timestamp: Date.now(),
    senderId: SENDER_ID,
    payload,
  };

  // 1. BroadcastChannel
  if (channel) {
    try {
      channel.postMessage(msg);
    } catch {}
  }

  // 2. Storage fallback trigger
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(msg));
    } catch {}
  }
}

/**
 * Subscribes to window bus messages from other windows.
 */
export function subscribeWindowBus(listener: WindowBusListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
