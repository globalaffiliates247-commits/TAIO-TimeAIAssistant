// TAIO Time App — Pinned Goal Quotes Migration & Cross-Language Key Resolution (PRD v0.3.50 Part E)

/**
 * Normalizes any legacy quoteId (e.g. "q-vi-goal-05", "q-en-goal-05") into its canonical language-agnostic quoteKey ("goal-05").
 */
export function normalizeToQuoteKey(idOrKey: string): string {
  if (!idOrKey) return '';
  return idOrKey.replace(/^q-[a-z]+-/, '');
}

/**
 * Migrates user's pinnedGoalQuotes record: converts any old language-specific IDs into canonical quoteKey.
 */
export function migratePinnedGoalQuotes(
  pinnedMap?: Record<string, string>
): Record<string, string> {
  if (!pinnedMap || typeof pinnedMap !== 'object') return {};

  const migrated: Record<string, string> = {};
  for (const [goalId, val] of Object.entries(pinnedMap)) {
    if (typeof val === 'string' && val.trim()) {
      migrated[goalId] = normalizeToQuoteKey(val.trim());
    }
  }
  return migrated;
}
