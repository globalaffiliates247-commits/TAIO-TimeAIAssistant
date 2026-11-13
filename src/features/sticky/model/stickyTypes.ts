// PRD B34 v0.3.26: quick capture as Sticky Notes (Mac Stickies / Windows Sticky Notes style).
export type StickyColor = 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange';

export const STICKY_COLORS: Record<StickyColor, { paper: string; bar: string; ink: string; muted: string; line: string }> = {
  yellow: { paper: '#FFF6C2', bar: '#FCEB8E', ink: '#3B3418', muted: '#A0925A', line: '#F0E3A2' },
  pink:   { paper: '#FDE3EC', bar: '#F8C8D9', ink: '#4A2434', muted: '#A05A78', line: '#F4CCDA' },
  green:  { paper: '#E3F6E8', bar: '#CDEFD6', ink: '#1F4A2E', muted: '#5E8A6C', line: '#C8E8D1' },
  blue:   { paper: '#E1EDFC', bar: '#CFE3FA', ink: '#24405F', muted: '#5C7EA8', line: '#C9DCF3' },
  purple: { paper: '#EEE9FB', bar: '#E2D9F8', ink: '#352A5C', muted: '#7A6CA8', line: '#DCD3F3' },
  orange: { paper: '#FDEBDD', bar: '#FCDCC4', ink: '#4F2D14', muted: '#A06A42', line: '#F3D3BB' },
};

export interface StickyLine {
  id: string;
  text: string;
  done?: boolean;
  sentToBasket?: boolean; // free-sheet lines are copied once into Rổ công việc
}

/** 'day' = the sheet for one calendar day, backed by Thẻ ngày items; 'free' = a loose note. */
export interface StickyNote {
  id: string;
  kind: 'day' | 'free';
  date?: string;          // kind 'day'
  title: string;
  color: StickyColor;
  pinned: boolean;
  collapsed: boolean;
  open: boolean;          // shown on screen
  x: number;
  y: number;
  w?: number;
  h?: number;
  lines: StickyLine[];    // kind 'free' only
  content?: string;       // v0.3.32 C2: continuous multi-line text
  scheduledMap?: Record<string, string>; // maps line token/idx to dailyCardItemId
  hasMotivationSticker?: boolean; // v0.3.31 B2: "Thêm nhãn động lực"
  updatedAt: number;
}
