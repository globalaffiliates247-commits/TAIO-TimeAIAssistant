// PRD B24 v0.3.25: cross-device sync backend (Supabase). The publishable/anon key is public by
// design: the table is closed (RLS on, no grants) and only the taio_sync_* functions are callable.
// Build-time override: NEXT_PUBLIC_TAIO_SYNC_URL / NEXT_PUBLIC_TAIO_SYNC_KEY.
export const SYNC_URL =
  process.env.NEXT_PUBLIC_TAIO_SYNC_URL || 'https://ghcxhvoipnhldcnuowet.supabase.co';
export const SYNC_KEY = process.env.NEXT_PUBLIC_TAIO_SYNC_KEY || 'sb_publishable_kpo9th6v4kRBIvR8sZz1uw_H5BUnyUe';

export const SYNC_ENABLED = !!SYNC_URL && !!SYNC_KEY;
export const SYNC_INTERVAL_MS = 3 * 60 * 1000; // while the app is open and visible
export const SYNC_DEBOUNCE_MS = 10 * 1000;     // after a local change
