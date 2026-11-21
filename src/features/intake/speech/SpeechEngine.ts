// TAIO Time App — Speech Recognition Engine Interface (PRD v0.3.52 Part A9)

export interface SpeechEngineCallbacks {
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (errorMessage: string) => void;
  onStateChange?: (listening: boolean) => void;
}

export interface SpeechEngine {
  readonly id: string;
  readonly name: string;
  isAvailable(): boolean;
  start(callbacks: SpeechEngineCallbacks, lang?: string): Promise<boolean>;
  stop(): void;
  isListening(): boolean;
}
