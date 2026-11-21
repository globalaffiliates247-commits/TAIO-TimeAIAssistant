// TAIO Time App — Native Preference Synchronization Service (PRD v0.3.50 Part B2)
'use client';

import { Capacitor } from '@capacitor/core';
import { TAIONative } from '../../native/index.ts';
import { resolveEffectiveLanguage } from '../../../i18n/languages.ts';

export interface PreferenceSyncPayload {
  languagePreference: string;
  palette: string;
  themeMode: string;
}

let lastSyncedPayload: string = '';

/**
 * Synchronizes user preferences (language, palette, themeMode) to iOS UserDefaults & App Group.
 * Ensures resolved effective language (e.g. 'en' or 'vi') is sent instead of 'system'.
 */
export async function syncPreferencesToNative(payload: PreferenceSyncPayload): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const effectiveLang = resolveEffectiveLanguage(payload.languagePreference);
  const payloadString = `${effectiveLang}|${payload.palette}|${payload.themeMode}`;

  if (payloadString === lastSyncedPayload) return;

  try {
    await TAIONative.syncPreferences({
      language: effectiveLang,
      palette: payload.palette,
      themeMode: payload.themeMode,
    });
    lastSyncedPayload = payloadString;
  } catch (err) {
    // Non-blocking in case native plugin call fails on web/mock
  }
}
