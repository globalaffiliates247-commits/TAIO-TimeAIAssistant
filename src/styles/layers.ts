// Centralized z-index layers across the entire application (PRD v0.3.37 Part A3 & v0.3.42 Fix)
export const Z_LAYERS = {
  BASE: 0,
  DROPDOWN: 40,
  NAVBAR: 40,
  STICKY: 42,
  STICKY_ACTIVE: 44,
  STICKY_PINNED: 46,
  STICKY_PINNED_ACTIVE: 48,
  MODAL_BACKDROP: 50,
  MODAL_CONTENT: 60,
  CONFIRM_DIALOG: 100,
  ALARM_FULLSCREEN: 9999, // Absolute topmost overlay for full-screen alarm
  TOAST_NOTIFICATION: 10000,
} as const;

export type ZLayer = keyof typeof Z_LAYERS;
