// TAIO Time App — Telegram Intake Source (PRD v0.3.52 Part B2 & Part C)
// Prepared architecture for upcoming Telegram Bot synchronization.
// Note: Only publishable client access allowed in app. Service_role keys must never be bundled in client code.

import { intakeTask, type IntakeTaskResult } from '../intakeTask';
import type { Goal } from '@/types';
import type { QuickLineDeps } from '@/features/tasks/quickLine';

export interface TelegramIncomingMessage {
  telegramMessageId: string;
  senderChatId: string;
  text: string;
  sentAt: string;
}

/**
 * Handles incoming message synced from Telegram intake pipeline.
 * Messages always go through review queue (needsReview: true).
 */
export async function processTelegramMessage(
  msg: TelegramIncomingMessage,
  date: string,
  deps: QuickLineDeps,
  goals: Goal[] = [],
  lang: 'vi' | 'en' = 'vi'
): Promise<IntakeTaskResult> {
  return intakeTask({
    source: 'telegram',
    rawText: msg.text,
    receivedAt: msg.sentAt,
    externalId: `tg-${msg.telegramMessageId}`,
    needsReview: true, // Telegram tasks require review in Rổ công việc
    date,
    deps,
    goals,
    lang
  });
}
