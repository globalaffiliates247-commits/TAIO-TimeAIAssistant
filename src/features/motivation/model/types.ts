// TAIO Time App — Motivation Quote Model & Types (PRD FEATURE v0.3.31)

export type QuoteContext = 'start_day' | 'start_task' | 'break' | 'done' | 'end_day' | 'goal' | 'any';

export interface MotivationQuote {
  id: string;
  text: string;
  author?: string;
  lang: 'vi' | 'en';
  contexts: QuoteContext[];
  goalKeywords?: string[];
  weight: number; // 1-3
  active: boolean;
  source: 'taio' | 'user';
  verified?: boolean;
  media?: { type: 'audio' | 'image'; url: string };
  updatedAt?: string;
  linkedGoalId?: string;

  // v0.3.34 Part C5: Multi-language Quote metadata
  originalLang?: string; // Ngôn ngữ gốc của câu (ví dụ 'en', 'vi')
  originalText?: string; // Nguyên văn câu gốc của tác giả
  translationOf?: string; // ID của câu gốc nếu đây là bản dịch

  // v0.3.35 Part B3 & B4: Anonymous reaction counters (Admin visible)
  heartCount?: number;
  hideCount?: number;
}

export interface UserMotivationState {
  customQuotes: MotivationQuote[];
  favorites: string[]; // quote ids
  pinnedQuoteId?: string;
  hiddenTodaySlots: Record<string, string>; // slotKey -> dateString YYYY-MM-DD
  historySlots: Record<string, { quoteId: string; date: string }>; // slotKey -> { quoteId, date }
  recentQuoteIds: { quoteId: string; date: string }[]; // last 7 days history
}

export type StickerSize = 'line' | 'note' | 'card';

export interface MotivationSettings {
  enabled: boolean; // Master toggle
  slots: {
    start_day_sheet: boolean; // 1: Đầu tờ Ghi nhanh Hôm nay (default: true)
    free_sheet: boolean;      // 2: Tờ ghi chú tự do (default: false)
    clock_idle: boolean;      // 3: Đồng hồ lúc trống/hết việc (default: true)
    task_done: boolean;       // 4: Thẻ hết giờ khi bấm Xong (default: false)
    alarm_start: boolean;     // 5: Màn hình chuông đầu khung (default: false)
    close_day: boolean;       // 6: Chốt ngày (default: true)
    goals_tab: boolean;       // 7: Tab Mục tiêu (default: true)
    widget: boolean;          // 8: Widget & màn hình khóa (default: false)
  };
}

export const DEFAULT_MOTIVATION_SETTINGS: MotivationSettings = {
  enabled: true,
  slots: {
    start_day_sheet: true,
    free_sheet: false,
    clock_idle: true,
    task_done: false,
    alarm_start: false,
    close_day: true,
    goals_tab: true,
    widget: false,
  },
};
