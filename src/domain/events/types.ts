// TAIO Time App — Scheduled Events Data Entity (PRD v0.3.43 Part A2)
// Pure domain model: NO React dependencies.

export type EventCategory = 'event' | 'routine' | 'ritual';
export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type CalendarType = 'solar' | 'lunar';
export type ReminderLevel = 'gentle' | 'loud'; // gentle = notification banner, loud = full-screen alarm

export interface EventReminder {
  trigger: 'day_of' | 'days_before' | 'hours_before';
  amount?: number; // e.g. 1 (day), 2 (hours)
  time?: string;   // e.g. "08:00" for "sáng hôm đó"
  level: ReminderLevel;
}

export interface EventRecurrence {
  freq: RecurrenceFrequency;
  interval?: number;     // e.g. every 1 year, every 2 weeks (default 1)
  byWeekday?: number[];  // 0 = Sunday, 1 = Monday ... 6 = Saturday
  count?: number;        // maximum total occurrences
  until?: string;        // stop date YYYY-MM-DD
  calendar?: CalendarType;
}

export interface PrepTaskConfig {
  title: string;
  daysBefore: number;
}

export interface EventOccurrenceOverride {
  skip?: boolean;
  start?: string;
  end?: string;
  status?: 'in_progress' | 'done' | 'dropped';
  outcome?: string;
}

export interface ScheduledEvent {
  id: string;
  title: string;
  note?: string;
  startDate: string; // YYYY-MM-DD
  allDay?: boolean;
  start?: string;    // HH:mm
  end?: string;      // HH:mm
  recurrence?: EventRecurrence;
  reminders?: EventReminder[];
  prepTask?: PrepTaskConfig;
  category: EventCategory;
  nodeId?: string;   // optional link to Goal or Project
  exceptions?: Record<string, EventOccurrenceOverride>; // date YYYY-MM-DD -> override
  source?: string;   // 'taio' | 'external:<calendarId>'
  updatedAt: number;
  deletedAt?: number;
}

export interface EventOccurrence {
  eventId: string;
  date: string;      // YYYY-MM-DD
  title: string;
  allDay: boolean;
  start?: string;
  end?: string;
  category: EventCategory;
  source: string;
  isException?: boolean;
  status?: 'in_progress' | 'done' | 'dropped';
  nodeId?: string;
  prepTaskTitle?: string;
}
