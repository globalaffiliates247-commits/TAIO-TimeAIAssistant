// PRD FIX v0.3.28 Part A1 & A3: Unified Quick Line Commit with Goal & Duration Parser
import type { Goal, ItemOrigin } from '@/types';
import { parseTimedText, toMins, toTime } from '@/features/sticky/model/timeline';

export interface QuickLineDeps {
  addDailyCardItem: (item: {
    text: string;
    goalId?: string;
    origin?: ItemOrigin;
    start?: string;
    end?: string;
    date?: string;
    extra?: Record<string, unknown>;
  }) => string;
  goals?: Goal[];
}

const stripAccents = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/**
 * Match a tag against goal list:
 * Checks if any word of the goal name starts with the tag (accent-insensitive, case-insensitive).
 * Returns the Goal if exactly 1 goal matches, otherwise null.
 */
export function matchGoalByTag(tag: string, goals: Goal[] = []): Goal | null {
  const normTag = stripAccents(tag);
  if (!normTag) return null;
  const matches = goals.filter(g => {
    const normName = stripAccents(g.name);
    const words = normName.split(/[^a-z0-9]+/i).filter(Boolean);
    return words.some(w => w.startsWith(normTag));
  });
  return matches.length === 1 ? matches[0] : null;
}

/**
 * Parses and commits a single line typed anywhere in the app (Quick Note, Sticky Sheet, Mac Quick Input).
 * Returns the created dailyCardItem id, or undefined if empty.
 */
export function commitQuickLine(
  rawText: string,
  date: string,
  deps: QuickLineDeps
): string | undefined {
  const trimmed = rawText.trim();
  if (!trimmed) return undefined;

  // 1. Parse time & duration via timeline parser
  const parsed = parseTimedText(trimmed);
  let text = parsed.rest;
  if (!text && !parsed.time) return undefined;

  // 2. Goal tag detection: look for #word (excluding priority #1 - #9)
  let goalId: string | undefined;
  let goalName: string | undefined;
  const extra: Record<string, unknown> = {};

  const goalTagMatch = text.match(/#([a-zA-Zà-ỹÀ-Ỹ0-9_]+)/g);
  if (goalTagMatch && deps.goals?.length) {
    for (const rawTagWithHash of goalTagMatch) {
      const tag = rawTagWithHash.slice(1);
      // Skip priority tags #1 - #9
      if (/^[1-9]$/.test(tag)) continue;

      const matchedGoal = matchGoalByTag(tag, deps.goals);
      if (matchedGoal) {
        goalId = matchedGoal.id;
        goalName = matchedGoal.name;
        // Strip #tag from display text
        text = text.replace(rawTagWithHash, ' ').replace(/\s+/g, ' ').trim();
      } else {
        // Tag didn't match or was ambiguous
        extra.unmatchedGoalTag = tag;
      }
    }
  }

  // 3. Duration & End time
  if (parsed.durationMins) {
    extra.estimateMins = parsed.durationMins;
  }

  let end: string | undefined;
  if (parsed.time) {
    const dur = parsed.durationMins || 30;
    end = toTime(toMins(parsed.time) + dur);
  }

  // Fallback text if time only was typed
  if (!text) text = 'Công việc không tên';

  return deps.addDailyCardItem({
    text,
    date,
    start: parsed.time,
    end,
    goalId,
    extra: Object.keys(extra).length > 0 ? extra : undefined,
    origin: 'planned',
  });
}
