// TAIO Time App — Spoken Goal Normalization (PRD v0.3.52 Part A6)
import type { Goal } from '../../types/index.ts';

const stripDiacritics = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\s\-_]+/g, '');

/**
 * Normalizes spoken goal references into #tag format when matching an active goal.
 * Returns normalized string.
 */
export function normalizeGoalVoice(text: string, goals: Goal[] = []): string {
  if (!text || !goals.length) return text;

  // Patterns: "cho mục tiêu X", "thuộc mục tiêu X", "for goal X"
  const patterns = [
    /\b(?:cho|thuộc)\s+mục\s+tiêu\s+([^,.;]+)/i,
    /\bfor\s+goal\s+([^,.;]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidateRaw = match[1].trim();
      const normCandidate = stripDiacritics(candidateRaw);

      if (normCandidate) {
        // Find best match in goals list
        const matchedGoal = goals.find(g => {
          const normGoal = stripDiacritics(g.name);
          return normGoal === normCandidate || normGoal.startsWith(normCandidate) || normCandidate.startsWith(normGoal);
        });

        if (matchedGoal) {
          const cleanTag = matchedGoal.name.replace(/[^a-zA-Zà-ỹÀ-Ỹ0-9_]/g, '');
          // Replace the "cho mục tiêu X" segment with #Tag
          return text.replace(match[0], `#${cleanTag}`).trim();
        }
      }
    }
  }

  // If no goal found, return text unchanged as per A6
  return text;
}
