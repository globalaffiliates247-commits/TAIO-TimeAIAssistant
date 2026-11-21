// TAIO Time App — Unified Intake Gate (PRD v0.3.52 Part B1)
import { normalizeSpokenVi } from './normalizeSpokenVi.ts';
import { normalizeSpokenEn } from './normalizeSpokenEn.ts';
import { normalizeGoalVoice } from './normalizeGoalVoice.ts';
import { isExternalIdProcessed, markExternalIdProcessed, enqueueReviewItem } from './reviewQueue.ts';
import { commitQuickLine, type QuickLineDeps } from '../tasks/quickLine.ts';
import type { Goal } from '../../types/index.ts';

export interface IntakeTaskInput {
  source: 'voice' | 'telegram' | 'manual';
  rawText: string;
  receivedAt?: string;
  externalId?: string;
  needsReview?: boolean;
  date?: string;
  deps?: QuickLineDeps;
  goals?: Goal[];
  lang?: 'vi' | 'en';
}

export interface IntakeTaskResult {
  status: 'committed' | 'queued' | 'duplicate' | 'empty';
  createdId?: string;
  normalizedText: string;
}

/**
 * Single entry door for all external inputs (Voice, Telegram, Quick API).
 * Normalizes speech, maps goals, deduplicates, and commits or routes to review queue.
 */
export function intakeTask(input: IntakeTaskInput): IntakeTaskResult {
  const raw = (input.rawText || '').trim();
  if (!raw) {
    return { status: 'empty', normalizedText: '' };
  }

  // 1. Deduplication Check (Part B3)
  if (input.externalId && isExternalIdProcessed(input.externalId)) {
    return { status: 'duplicate', normalizedText: raw };
  }

  // 2. Normalize Spoken Numbers & Durations (Part A5)
  const isEn = input.lang === 'en';
  const spokenNormalized = isEn ? normalizeSpokenEn(raw) : normalizeSpokenVi(raw);

  // 3. Normalize Goal Voice Mentions (Part A6)
  const normalizedText = normalizeGoalVoice(spokenNormalized, input.goals || []);

  // 4. Route to Review Queue if needed (Part B4)
  if (input.needsReview) {
    enqueueReviewItem({
      source: input.source,
      rawText: raw,
      normalizedText,
      receivedAt: input.receivedAt || new Date().toISOString(),
      externalId: input.externalId
    });

    if (input.externalId) {
      markExternalIdProcessed(input.externalId);
    }

    return { status: 'queued', normalizedText };
  }

  // 5. Direct commit via existing commitQuickLine
  let createdId: string | undefined;
  if (input.deps) {
    const targetDate = input.date || new Date().toISOString().slice(0, 10);
    createdId = commitQuickLine(normalizedText, targetDate, input.deps);
  }

  if (input.externalId) {
    markExternalIdProcessed(input.externalId);
  }

  return {
    status: 'committed',
    createdId,
    normalizedText
  };
}
