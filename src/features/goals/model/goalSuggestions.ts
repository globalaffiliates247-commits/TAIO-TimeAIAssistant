// TAIO Time App — Intelligent Goal Keyword Scoring & Suggestion (PRD v0.3.37 Part C)
import type { Goal, Milestone } from '@/types';

const stripAccents = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Common Vietnamese & English stop words + generic app terms with zero or near-zero weight
const STOP_WORDS = new Set([
  'va', 'voi', 'cho', 'cua', 'trong', 'tai', 'tren', 'duoi', 'ra', 'vao',
  'lam', 'di', 'den', 've', 'ngay', 'hom', 'nay', 'mai', 'kia', 'tuan',
  'thang', 'nam', 'gio', 'phut', 'giay', 'viec', 'mot', 'hai', 'ba', 'bon',
  'the', 'a', 'an', 'and', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'from',
  'of', 'is', 'are', 'was', 'were', 'be', 'do', 'task', 'doing', 'done',
  // Generic terms that previously caused ubiquitous false matches (Part C1)
  'taio', 'ai', 'app', 'time', 'du', 'an', 'muc', 'tieu', 'test', 'demo'
]);

const FEEDBACK_STORAGE_KEY = 'taio_goal_suggestion_feedback_v1';
const PREF_KEY_INLINE_CHIP = 'taio_goal_suggestion_inline_chip';

type FeedbackMap = Record<string, number>; // key: "word:goalId" -> count of user choices (+1 / -1)

function loadFeedback(): FeedbackMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveFeedback(fb: FeedbackMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(fb));
  } catch {}
}

export function recordGoalSuggestionFeedback(
  matchedWord: string,
  goalId: string,
  action: 'accept' | 'dismiss'
): void {
  const fb = loadFeedback();
  const key = `${stripAccents(matchedWord)}:${goalId}`;
  const current = fb[key] || 0;
  fb[key] = action === 'accept' ? current + 1 : current - 1;
  saveFeedback(fb);
}

export function isGoalSuggestionInlineChipEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PREF_KEY_INLINE_CHIP) === 'true'; // Default is false (Part C2.5)
  } catch {
    return false;
  }
}

export function setGoalSuggestionInlineChipEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREF_KEY_INLINE_CHIP, enabled ? 'true' : 'false');
  } catch {}
}

export interface GoalSuggestion {
  goal: Goal;
  milestone?: Milestone;
  matchedWord: string;
  score: number;
}

/**
 * Intelligent keyword scoring algorithm (Part C2.3 & C2.4):
 * - Word frequency & rarity (TF-IDF): words appearing in multiple goals get lower weight.
 * - Word length: longer distinctive words get higher scores.
 * - User feedback: past dismissals decrease score; past acceptances increase score.
 * - Returns ranked suggestions (max limit, threshold filtered).
 */
export function findGoalSuggestions(
  taskTitle: string,
  goals: Goal[] = [],
  limit = 3,
  minScore = 1.5
): GoalSuggestion[] {
  if (!taskTitle || !goals.length) return [];

  const normTitle = stripAccents(taskTitle);
  const taskWords = normTitle
    .split(/[^a-z0-9_-]+/i)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));

  if (!taskWords.length) return [];

  // Compute document frequency (DF) across goals for IDF weighting
  const dfMap = new Map<string, number>();
  const goalTokenSets = goals.map(g => {
    const tokens = new Set<string>();
    stripAccents(g.name)
      .split(/[^a-z0-9_-]+/i)
      .filter(w => w.length >= 3 && !STOP_WORDS.has(w))
      .forEach(w => tokens.add(w));
    if (g.milestones) {
      g.milestones.forEach(m => {
        stripAccents(m.name)
          .split(/[^a-z0-9_-]+/i)
          .filter(w => w.length >= 3 && !STOP_WORDS.has(w))
          .forEach(w => tokens.add(w));
      });
    }
    tokens.forEach(w => dfMap.set(w, (dfMap.get(w) || 0) + 1));
    return { goal: g, tokens };
  });

  const feedback = loadFeedback();
  const scoredSuggestions: GoalSuggestion[] = [];

  for (const { goal, tokens } of goalTokenSets) {
    let bestGoalScore = 0;
    let bestWord = '';
    let bestMilestone: Milestone | undefined;

    for (const tw of taskWords) {
      // Check exact word match or prefix match
      for (const gt of tokens) {
        let isMatch = false;
        let matchLength = 0;

        if (gt === tw) {
          isMatch = true;
          matchLength = tw.length;
        } else if (tw.length >= 4 && gt.startsWith(tw)) {
          isMatch = true;
          matchLength = tw.length * 0.8;
        }

        if (isMatch) {
          const docFreq = dfMap.get(gt) || 1;
          const idfWeight = 1 / docFreq; // rarer word = higher weight
          const lengthWeight = Math.min(2.5, Math.log2(matchLength));

          let wordScore = lengthWeight * idfWeight * 2.0;

          // Incorporate user feedback
          const fbKey = `${tw}:${goal.id}`;
          const fbDelta = feedback[fbKey] || 0;
          wordScore += fbDelta * 1.5;

          if (wordScore > bestGoalScore) {
            bestGoalScore = wordScore;
            bestWord = tw;
          }
        }
      }
    }

    // Check if matched any milestone specifically
    if (bestGoalScore >= minScore && goal.milestones) {
      for (const m of goal.milestones) {
        if (m.status === 'completed') continue;
        const normMName = stripAccents(m.name);
        if (taskWords.some(tw => normMName.includes(tw))) {
          bestMilestone = m;
          bestGoalScore += 0.5; // Bonus for milestone match
          break;
        }
      }
    }

    if (bestGoalScore >= minScore) {
      scoredSuggestions.push({
        goal,
        milestone: bestMilestone,
        matchedWord: bestWord,
        score: bestGoalScore,
      });
    }
  }

  // Sort descending by score
  scoredSuggestions.sort((a, b) => b.score - a.score);
  return scoredSuggestions.slice(0, limit);
}

/**
 * High-confidence single suggestion for inline chip (Part C2.5: threshold 3.5, default disabled)
 */
export function findHighConfidenceGoalSuggestion(
  taskTitle: string,
  goals: Goal[] = []
): GoalSuggestion | null {
  if (!isGoalSuggestionInlineChipEnabled()) return null;
  const list = findGoalSuggestions(taskTitle, goals, 1, 3.5);
  return list.length > 0 ? list[0] : null;
}
