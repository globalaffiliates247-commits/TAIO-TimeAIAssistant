// TAIO Time App — TAIO Custom Regional Vietnamese Speech Engine (PRD v0.3.52 Part A9)
// Placeholder for future TAIO.CLUB custom speech recognition model specialized for Vietnamese regional accents and local names.
import type { SpeechEngine, SpeechEngineCallbacks } from './SpeechEngine';

export class TaioSpeechEngine implements SpeechEngine {
  readonly id = 'taio';
  readonly name = 'TAIO Regional Voice (Coming Soon)';

  isAvailable(): boolean {
    return false; // Reserved for future release with TAIO.CLUB backend
  }

  isListening(): boolean {
    return false;
  }

  async start(callbacks: SpeechEngineCallbacks, _lang?: string): Promise<boolean> {
    callbacks.onError?.('TAIO Voice Engine đang trong giai đoạn phát triển.');
    return false;
  }

  stop(): void {}
}
