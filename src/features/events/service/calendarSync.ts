// PRD v0.3.45 Part D: iOS Calendar (EventKit) Read-only Sync Service
import { Capacitor } from '@capacitor/core';
import { TAIONative } from '@/features/native';
import type { EventOccurrence } from '@/domain/events';
import { getStorageItemSync, setStorageItemSync, removeStorageItemSync } from '@/core/storage/durableStorage';

const STORAGE_KEY_CONNECTED = 'ios_calendar_connected';

export function isIOSCalendarConnected(): boolean {
  return getStorageItemSync<boolean>(STORAGE_KEY_CONNECTED, false);
}

export function setIOSCalendarConnected(connected: boolean): void {
  if (connected) {
    setStorageItemSync(STORAGE_KEY_CONNECTED, true);
  } else {
    removeStorageItemSync(STORAGE_KEY_CONNECTED);
  }
}

export async function checkIOSCalendarPermission(): Promise<{ status: string; authorized: boolean }> {
  if (!Capacitor.isPluginAvailable('TAIONative')) {
    return { status: 'unsupported', authorized: false };
  }
  try {
    const res = await TAIONative.getCalendarPermissionStatus();
    return res;
  } catch (e) {
    console.warn('checkIOSCalendarPermission error:', e);
    return { status: 'error', authorized: false };
  }
}

export async function requestIOSCalendarAccess(): Promise<{ granted: boolean; error?: string }> {
  if (!Capacitor.isPluginAvailable('TAIONative')) {
    return { granted: false, error: 'Chỉ hỗ trợ trên thiết bị iOS (iPhone/iPad)' };
  }
  try {
    const res = await TAIONative.requestCalendarPermission();
    if (res.granted) {
      setIOSCalendarConnected(true);
    }
    return res;
  } catch (e: any) {
    console.warn('requestIOSCalendarAccess error:', e);
    return { granted: false, error: e?.message || 'Lỗi xin quyền truy cập lịch' };
  }
}

export async function fetchIOSCalendarOccurrences(
  startDate: string,
  endDate?: string
): Promise<EventOccurrence[]> {
  if (!isIOSCalendarConnected()) return [];
  if (!Capacitor.isPluginAvailable('TAIONative')) return [];

  try {
    const res = await TAIONative.fetchCalendarEvents({ startDate, endDate: endDate || startDate });
    if (!res.ok || !Array.isArray(res.events)) return [];

    return res.events.map(ev => ({
      eventId: `ext-ios-${ev.id}`,
      title: ev.title || '(Không có tiêu đề)',
      date: ev.date || startDate,
      allDay: Boolean(ev.allDay),
      start: ev.start,
      end: ev.end,
      category: 'event',
      source: 'external:ios-calendar',
    }));
  } catch (e) {
    console.warn('fetchIOSCalendarOccurrences error:', e);
    return [];
  }
}
