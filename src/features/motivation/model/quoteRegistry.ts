// TAIO Time App — Quote Registry for Cross-Slot/Screen Deduplication (PRD v0.3.35 Part A)
'use client';

type RegistryListener = () => void;

class QuoteRegistry {
  private activeQuotes: Map<string, { quoteId: string; ts: number }> = new Map();
  private listeners: Set<RegistryListener> = new Set();
  private channel: BroadcastChannel | null = null;
  private storageKey = 'taio_active_quote_registry';

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel('taio_quote_registry_channel');
          this.channel.onmessage = (event) => {
            if (event.data && typeof event.data === 'object') {
              this.syncFromRemote(event.data);
            }
          };
        }
      } catch {}
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const now = Date.now();
          // Filter out stale entries older than 24 hours
          for (const [slot, item] of Object.entries(parsed)) {
            const entry = item as { quoteId: string; ts: number };
            if (entry && entry.quoteId && now - entry.ts < 24 * 60 * 60 * 1000) {
              this.activeQuotes.set(slot, entry);
            }
          }
        }
      }
    } catch {}
  }

  private persistAndBroadcast() {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, { quoteId: string; ts: number }> = {};
      this.activeQuotes.forEach((val, key) => {
        obj[key] = val;
      });
      localStorage.setItem(this.storageKey, JSON.stringify(obj));
      if (this.channel) {
        this.channel.postMessage(obj);
      }
    } catch {}
    this.notify();
  }

  private syncFromRemote(data: Record<string, { quoteId: string; ts: number }>) {
    let changed = false;
    for (const [slot, item] of Object.entries(data)) {
      if (item && item.quoteId) {
        const current = this.activeQuotes.get(slot);
        if (!current || current.quoteId !== item.quoteId) {
          this.activeQuotes.set(slot, item);
          changed = true;
        }
      }
    }
    if (changed) this.notify();
  }

  public register(slotKey: string, quoteId: string) {
    if (!slotKey || !quoteId) return;
    const current = this.activeQuotes.get(slotKey);
    if (current && current.quoteId === quoteId) return;
    this.activeQuotes.set(slotKey, { quoteId, ts: Date.now() });
    this.persistAndBroadcast();
  }

  public unregister(slotKey: string) {
    if (this.activeQuotes.has(slotKey)) {
      this.activeQuotes.delete(slotKey);
      this.persistAndBroadcast();
    }
  }

  public getActiveQuoteIds(excludeSlotKey?: string): string[] {
    const list: string[] = [];
    this.activeQuotes.forEach((val, key) => {
      if (key !== excludeSlotKey && val.quoteId) {
        list.push(val.quoteId);
      }
    });
    return Array.from(new Set(list));
  }

  public isSlotActive(slotKey: string): boolean {
    return this.activeQuotes.has(slotKey);
  }

  public subscribe(listener: RegistryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch {}
    });
  }
}

export const quoteRegistry = new QuoteRegistry();
