// TAIO Time App — Screen Time Module Types (PRD v0.3.53 Part B)

export type ScreenTimeStatus = 'ok' | 'unavailable' | 'notAuthorized';

export interface ScreenTimeThreshold {
  id: string;
  appGroup: string; // e.g. "Social Media", "Entertainment"
  limitMinutes: number;
  enabled: boolean;
}

export interface ScreenTimeAlert {
  id: string;
  appGroup: string;
  limitMinutes: number;
  triggeredAt: string;
  message: string;
}
