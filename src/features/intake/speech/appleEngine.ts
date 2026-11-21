// TAIO Time App — Apple Speech Recognition Engine (PRD v0.3.52 Part A3 & A9)
import type { SpeechEngine, SpeechEngineCallbacks } from './SpeechEngine';

// Extended window for Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
  Capacitor?: any;
}

export class AppleSpeechEngine implements SpeechEngine {
  readonly id = 'apple';
  readonly name = 'Apple Speech';

  private activeRecognition: any = null;
  private listening = false;
  private maxDurationTimer: any = null;

  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindow;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition || win.Capacitor?.isNativePlatform());
  }

  isListening(): boolean {
    return this.listening;
  }

  async start(callbacks: SpeechEngineCallbacks, lang = 'vi-VN'): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindow;

    // Check for native Capacitor bridge
    if (win.Capacitor?.isNativePlatform?.() && win.Capacitor?.Plugins?.TAIOSpeechPlugin) {
      try {
        const plugin = win.Capacitor.Plugins.TAIOSpeechPlugin;
        this.listening = true;
        callbacks.onStateChange?.(true);

        // Listen for partial and final events
        await plugin.addListener('onSpeechResult', (data: { text: string; isFinal: boolean }) => {
          if (data.isFinal) {
            callbacks.onFinal?.(data.text);
            this.stop();
          } else {
            callbacks.onPartial?.(data.text);
          }
        });

        await plugin.startRecognition({ lang, maxSeconds: 60 });

        this.maxDurationTimer = setTimeout(() => {
          this.stop();
        }, 60000);

        return true;
      } catch (err: any) {
        this.listening = false;
        callbacks.onStateChange?.(false);
        callbacks.onError?.(err?.message || 'Speech recognition initialization failed');
        return false;
      }
    }

    // Web Speech API fallback
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      callbacks.onError?.('Thiết bị không hỗ trợ nhận dạng giọng nói trên trình duyệt này.');
      return false;
    }

    try {
      this.activeRecognition = new SpeechRec();
      this.activeRecognition.continuous = true;
      this.activeRecognition.interimResults = true;
      this.activeRecognition.lang = lang === 'en' ? 'en-US' : 'vi-VN';

      this.activeRecognition.onstart = () => {
        this.listening = true;
        callbacks.onStateChange?.(true);
      };

      this.activeRecognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        if (finalText) {
          callbacks.onFinal?.(finalText);
        } else if (interimText) {
          callbacks.onPartial?.(interimText);
        }
      };

      this.activeRecognition.onerror = (event: any) => {
        const errType = event.error;
        let msg = 'Lỗi nhận dạng giọng nói.';
        if (errType === 'not-allowed') {
          msg = 'Quyền micro bị từ chối. Vui lòng cấp quyền trong Cài đặt.';
        } else if (errType === 'network') {
          msg = 'Cần kết nối mạng để nhận dạng giọng nói.';
        } else if (errType === 'no-speech') {
          msg = 'Không nghe thấy tiếng nói, vui lòng thử lại.';
        }
        callbacks.onError?.(msg);
        this.stop();
      };

      this.activeRecognition.onend = () => {
        this.listening = false;
        callbacks.onStateChange?.(false);
      };

      this.activeRecognition.start();

      // 60-second limit as specified in A3 #5
      this.maxDurationTimer = setTimeout(() => {
        this.stop();
      }, 60000);

      return true;
    } catch (e: any) {
      this.listening = false;
      callbacks.onStateChange?.(false);
      callbacks.onError?.(e?.message || 'Không thể khởi động micro.');
      return false;
    }
  }

  stop(): void {
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch (_) {}
      this.activeRecognition = null;
    }
    const win = (typeof window !== 'undefined' ? (window as unknown as IWindow) : null);
    if (win?.Capacitor?.isNativePlatform?.() && win?.Capacitor?.Plugins?.TAIOSpeechPlugin) {
      try {
        win.Capacitor.Plugins.TAIOSpeechPlugin.stopRecognition();
      } catch (_) {}
    }
    this.listening = false;
  }
}
