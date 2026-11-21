// TAIO Time App — Voice Intake Source (PRD v0.3.52 Part B2)
import { intakeTask, type IntakeTaskResult } from '../intakeTask';
import type { Goal } from '@/types';
import type { QuickLineDeps } from '@/features/tasks/quickLine';

export async function processVoiceInput(
  rawSpokenText: string,
  date: string,
  deps: QuickLineDeps,
  goals: Goal[] = [],
  lang: 'vi' | 'en' = 'vi'
): Promise<IntakeTaskResult> {
  return intakeTask({
    source: 'voice',
    rawText: rawSpokenText,
    receivedAt: new Date().toISOString(),
    needsReview: false, // Voice is typed directly into input box and confirmed by user
    date,
    deps,
    goals,
    lang
  });
}
