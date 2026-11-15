// Centralized z-index layers across the entire application (PRD v0.3.37 Part A3)
export const Z_LAYERS = {
  BASE: 0,
  DROPDOWN: 40,
  MODAL_BACKDROP: 50,
  MODAL_CONTENT: 60,
  STICKY: 75,
  STICKY_PINNED: 90,
  STICKY_ACTIVE: 95,
  MINI_TIMER: 85,
  CONFIRM_DIALOG: 900,
  ALARM_FULLSCREEN: 9999, // Absolute topmost overlay for full-screen alarm
  TOAST_NOTIFICATION: 10000,
} as const;

export type ZLayer = keyof typeof Z_LAYERS;
