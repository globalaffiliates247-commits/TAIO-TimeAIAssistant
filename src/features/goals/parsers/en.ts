// TAIO Time App — English Goal Sentence Parser (PRD B35.2 / v0.3.27)
import type { ParsedGoal } from './vi';

const TIME_PATTERNS = [
  // "30 minutes every day", "1 hour per week"
  /(\d+)\s*(minutes?|mins?|hours?|hrs?)\s*(every|per|each|a)\s*(day|week|month)/i,
  // "every day 30 minutes"
  /(every|each|per)\s*(day|week|month)\s*(\d+)\s*(minutes?|mins?|hours?|hrs?)/i,
];

const QUANTITY_PATTERN = /(\d+)\s+(clips?|videos?|articles?|posts?|pages?|books?|km|miles?|sessions?|items?|products?|orders?|clients?|customers?|%|dollars?|euros?)/i;

const DEADLINE_PATTERNS = [
  /(before\s+.+)$/i,
  /(by\s+.+)$/i,
  /(within\s+\d+\s*(days?|weeks?|months?).*)$/i,
  /(due\s+.+)$/i,
  /(deadline\s+.+)$/i,
];

export function parseEnGoal(input: string): ParsedGoal {
  const trimmed = input.trim();

  // 1. Time commitment
  for (const pat of TIME_PATTERNS) {
    const m = trimmed.match(pat);
    if (m) {
      let duration: number;
      let period: string;

      if (/^\d/.test(m[1])) {
        duration = parseInt(m[1], 10);
        const timeUnit = m[2].toLowerCase();
        if (timeUnit.startsWith('hour') || timeUnit.startsWith('hr')) duration *= 60;
        period = m[4];
      } else {
        duration = parseInt(m[3], 10);
        const timeUnit = m[4].toLowerCase();
        if (timeUnit.startsWith('hour') || timeUnit.startsWith('hr')) duration *= 60;
        period = m[2];
      }

      return {
        type: 'time_commitment',
        duration,
        period,
        title: trimmed,
      };
    }
  }

  // 2. Quantity / key_result
  const qm = trimmed.match(QUANTITY_PATTERN);
  if (qm) {
    const target = parseInt(qm[1], 10);
    const unit = qm[2];

    let deadlineRaw: string | undefined;
    for (const dp of DEADLINE_PATTERNS) {
      const dm = trimmed.match(dp);
      if (dm) {
        deadlineRaw = dm[1].trim();
        break;
      }
    }

    return {
      type: 'key_result',
      target,
      unit,
      deadlineRaw,
      title: trimmed,
    };
  }

  // 3. Check deadline
  let deadlineRaw: string | undefined;
  for (const dp of DEADLINE_PATTERNS) {
    const dm = trimmed.match(dp);
    if (dm) {
      deadlineRaw = dm[1].trim();
      break;
    }
  }

  // 4. Default: tasks
  return {
    type: 'tasks',
    deadlineRaw,
    title: trimmed,
  };
}
