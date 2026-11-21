// TAIO Time App — App Usage Measurement Types (PRD v0.3.53 Part A)

export type AppUsageState = 'in_taio' | 'left_clock_running' | 'left_clock_stopped';
export type AppUsageSource = 'mac-focus' | 'ios-lifecycle';

export interface AppUsageRecord {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationSeconds: number;
  appName: string;
  bundleId: string;
  state: AppUsageState;
  source: AppUsageSource;
}

export interface AppUsageSettings {
  enabled: boolean;
  ignoredApps: string[]; // List of app names or bundleIds to skip
}

export const DEFAULT_APP_USAGE_SETTINGS: AppUsageSettings = {
  enabled: false, // Default OFF as required by PRD v0.3.53 Part A6
  ignoredApps: []
};
