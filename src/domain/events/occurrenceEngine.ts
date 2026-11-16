// TAIO Time App — Occurrence Engine (PRD v0.3.43 Part A2)
// Pure domain engine: NO React dependencies.
import type { ScheduledEvent, EventOccurrence } from './types.ts';
import type { LunarProvider } from '../lunar/types.ts';

function parseDate(dStr: string): Date {
  const [y, m, d] = dStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const res = new Date(d);
  res.setDate(res.getDate() + n);
  return res;
}

/**
 * Expands a list of ScheduledEvents into concrete daily occurrences within [fromDate, toDate].
 * Fully handles:
 * - Single events (none)
 * - Daily, Weekly, Monthly, Yearly recurrences
 * - Recurrence limits: count and until
 * - Exceptions / overrides (skip, custom start/end, status)
 * - Lunar calendar conversion via optional LunarProvider
 * - Preparation tasks (prepTask)
 */
export function expandOccurrences(
  events: ScheduledEvent[],
  fromDate: string,
  toDate: string,
  lunarProvider?: LunarProvider
): EventOccurrence[] {
  const occurrences: EventOccurrence[] = [];
  const fromD = parseDate(fromDate);
  const toD = parseDate(toDate);

  for (const ev of events) {
    if (ev.deletedAt) continue;

    const startD = parseDate(ev.startDate);
    const recurrence = ev.recurrence;
    const isRecurring = recurrence && recurrence.freq && recurrence.freq !== 'none';
    const exceptions = ev.exceptions || {};

    if (!isRecurring) {
      // Single event
      const dateStr = ev.startDate;
      const d = parseDate(dateStr);
      if (d >= fromD && d <= toD) {
        const ex = exceptions[dateStr];
        if (!ex?.skip) {
          occurrences.push({
            eventId: ev.id,
            date: dateStr,
            title: ev.title,
            allDay: Boolean(ev.allDay),
            start: ex?.start || ev.start,
            end: ex?.end || ev.end,
            category: ev.category,
            source: ev.source || 'taio',
            isException: Boolean(ex),
            status: ex?.status,
            nodeId: ev.nodeId,
          });
        }
      }
      continue;
    }

    // Recurring event
    const freq = recurrence.freq;
    const interval = Math.max(1, recurrence.interval || 1);
    const countLimit = recurrence.count;
    const untilD = recurrence.until ? parseDate(recurrence.until) : null;
    const isLunar = recurrence.calendar === 'lunar';

    let occurrenceCount = 0;
    let curr = new Date(startD);

    if (isLunar && lunarProvider && lunarProvider.isAvailable()) {
      // Annual Lunar event (e.g. Giỗ, Tết)
      const lunarDayMonth = lunarProvider.toLunar({
        day: startD.getDate(),
        month: startD.getMonth() + 1,
        year: startD.getFullYear(),
      });

      if (lunarDayMonth) {
        const startYear = Math.max(fromD.getFullYear() - 1, startD.getFullYear());
        const endYear = toD.getFullYear() + 1;

        for (let y = startYear; y <= endYear; y++) {
          const solar = lunarProvider.toSolar(
            { day: lunarDayMonth.day, month: lunarDayMonth.month, year: y },
            y
          );
          if (!solar) continue;

          const occurrenceDate = new Date(solar.year, solar.month - 1, solar.day);
          if (occurrenceDate < startD) continue;
          if (untilD && occurrenceDate > untilD) break;

          occurrenceCount++;
          if (countLimit && occurrenceCount > countLimit) break;

          if (occurrenceDate >= fromD && occurrenceDate <= toD) {
            const dateStr = formatDate(occurrenceDate);
            const ex = exceptions[dateStr];
            if (!ex?.skip) {
              occurrences.push({
                eventId: ev.id,
                date: dateStr,
                title: ev.title,
                allDay: Boolean(ev.allDay),
                start: ex?.start || ev.start,
                end: ex?.end || ev.end,
                category: ev.category,
                source: ev.source || 'taio',
                isException: Boolean(ex),
                status: ex?.status,
                nodeId: ev.nodeId,
              });
            }
          }
        }
      }
      continue;
    }

    // Standard Solar recurrence
    const maxSteps = 1500; // safety ceiling
    let steps = 0;

    while (steps++ < maxSteps) {
      if (untilD && curr > untilD) break;
      if (curr > toD && (!countLimit || occurrenceCount >= countLimit)) break;

      let matchesWeekday = true;
      if (freq === 'weekly' && recurrence.byWeekday && recurrence.byWeekday.length > 0) {
        matchesWeekday = recurrence.byWeekday.includes(curr.getDay());
      }

      if (matchesWeekday) {
        occurrenceCount++;
        if (countLimit && occurrenceCount > countLimit) break;

        if (curr >= fromD && curr <= toD) {
          const dateStr = formatDate(curr);
          const ex = exceptions[dateStr];
          if (!ex?.skip) {
            occurrences.push({
              eventId: ev.id,
              date: dateStr,
              title: ev.title,
              allDay: Boolean(ev.allDay),
              start: ex?.start || ev.start,
              end: ex?.end || ev.end,
              category: ev.category,
              source: ev.source || 'taio',
              isException: Boolean(ex),
              status: ex?.status,
              nodeId: ev.nodeId,
            });
          }
        }
      }

      // Increment
      if (freq === 'daily') {
        curr = addDays(curr, interval);
      } else if (freq === 'weekly') {
        if (recurrence.byWeekday && recurrence.byWeekday.length > 0) {
          curr = addDays(curr, 1);
        } else {
          curr = addDays(curr, interval * 7);
        }
      } else if (freq === 'monthly') {
        const nextMonth = curr.getMonth() + interval;
        curr = new Date(curr.getFullYear(), nextMonth, startD.getDate());
      } else if (freq === 'yearly') {
        const nextYear = curr.getFullYear() + interval;
        curr = new Date(nextYear, startD.getMonth(), startD.getDate());
      } else {
        break;
      }
    }
  }

  // Sort by date, then allDay first, then start time
  return occurrences.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    return (a.start || '00:00').localeCompare(b.start || '00:00');
  });
}
