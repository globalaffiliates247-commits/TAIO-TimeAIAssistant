// TAIO Time App — Speech Recognition Registry (PRD v0.3.52 Part A9)
import type { SpeechEngine } from './SpeechEngine';
import { AppleSpeechEngine } from './appleEngine';
import { TaioSpeechEngine } from './taioEngine';

export * from './SpeechEngine';
export { AppleSpeechEngine } from './appleEngine';
export { TaioSpeechEngine } from './taioEngine';

const appleInstance = new AppleSpeechEngine();
const taioInstance = new TaioSpeechEngine();

/**
 * Returns active speech engine according to preferences (defaults to Apple).
 */
export function getSpeechEngine(engineId = 'apple'): SpeechEngine {
  if (engineId === 'taio') return taioInstance;
  return appleInstance;
}
