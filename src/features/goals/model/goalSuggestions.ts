// TAIO Time App — Goal Keyword Matching & Auto-Suggestion (PRD FIX v0.3.32 Part A5)
import type { Goal, Milestone } from '@/types';

const stripAccents = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Common Vietnamese & English stop words that should not trigger suggestions
const STOP_WORDS = new Set([
  'va', 'voi', 'cho', 'cua', 'trong', 'tai', 'tren', 'duoi', 'ra', 'vao',
  'lam', 'di', 'den', 've', 'ngay', 'hom', 'nay', 'mai', 'kia', 'tuan',
  'thang', 'nam', 'gio', 'phut', 'giay', 'viec', 'mot', 'hai', 'ba', 'bon',
  'the', 'a', 'an', 'and', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'from',
  'of', 'is', 'are', 'was', 'were', 'be', 'do', 'task', 'doing', 'done'
]);

export interface GoalSuggestion {
  goal: Goal;
  milestone?: Milestone;
  matchedWord: string;
}

/**
 * Pure function: matches task title against goals and their milestones.
 * Checks for significant words (>= 3 chars or uppercase acronyms) matching words in goal or milestone names.
 * Runs completely client-side without network requests.
 */
export function findGoalSuggestion(taskTitle: string, goals: Goal[] = []): GoalSuggestion | null {
  if (!taskTitle || !goals.length) return null;

  const normTitle = stripAccents(taskTitle);
  // Extract words of length >= 3, excluding stop words
  const words = normTitle
    .split(/[^a-z0-9_-]+/i)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));

  if (!words.length) return null;

  for (const goal of goals) {
    const normGoalName = stripAccents(goal.name);
    const goalWords = normGoalName.split(/[^a-z0-9_-]+/i).filter(Boolean);

    // 1. Check milestone matches first (more specific)
    if (goal.milestones?.length) {
      for (const m of goal.milestones) {
        if (m.status === 'completed') continue;
        const normMName = stripAccents(m.name);
        const mWords = normMName.split(/[^a-z0-9_-]+/i).filter(Boolean);
        for (const w of words) {
          if (mWords.some(mw => mw === w || (w.length >= 4 && mw.startsWith(w)))) {
            return { goal, milestone: m, matchedWord: w };
          }
        }
      }
    }

    // 2. Check goal name match
    for (const w of words) {
      if (goalWords.some(gw => gw === w || (w.length >= 4 && gw.startsWith(w)))) {
        return { goal, matchedWord: w };
      }
    }
  }

  return null;
}
