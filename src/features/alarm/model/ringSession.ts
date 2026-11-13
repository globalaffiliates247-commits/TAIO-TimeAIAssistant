// PRD FIX v0.3.30 Part F: Ring Session manager & Synthetic Chimes
import { AlarmSettings, ALARM_RING_MAX_MINS } from './alarmTypes';

let activeAudioContext: AudioContext | null = null;
let activeInterval: any = null;
let activeAudioElement: HTMLAudioElement | null = null;

export function stopRingSessionAudio(): void {
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }
  if (activeAudioContext) {
    try {
      activeAudioContext.close();
    } catch {}
    activeAudioContext = null;
  }
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {}
    activeAudioElement = null;
  }
}

// 1. Default Pleasant Chime: C5, E5, G5, B5, C6
export function playDefaultChime(volume = 0.8): void {
  stopRingSessionAudio();
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    activeAudioContext = ctx;

    const playSequence = () => {
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 987.77, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(volume * 0.3, now + idx * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.3);
      });
    };

    playSequence();
    activeInterval = setInterval(playSequence, 2000);
  } catch (err) {
    console.error('[ringSession] playDefaultChime failed', err);
  }
}

// 2. Gentle Chime: Warm, peaceful slow bell tones (F4, A4, C5)
export function playGentleChime(volume = 0.8): void {
  stopRingSessionAudio();
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    activeAudioContext = ctx;

    const playSequence = () => {
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const freqs = [349.23, 440.0, 523.25];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.2);
        gain.gain.setValueAtTime(0, now + idx * 0.2);
        gain.gain.linearRampToValueAtTime(volume * 0.25, now + idx * 0.2 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.2 + 2.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.2);
        osc.stop(now + idx * 0.2 + 2.1);
      });
    };

    playSequence();
    activeInterval = setInterval(playSequence, 3200);
  } catch (err) {
    console.error('[ringSession] playGentleChime failed', err);
  }
}

// 3. Urgent Chime: Staccato two-tone wake-up alert (A5 + E6)
export function playUrgentChime(volume = 0.8): void {
  stopRingSessionAudio();
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    activeAudioContext = ctx;

    const playSequence = () => {
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const freqs = [880.0, 1318.51, 880.0, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(volume * 0.15, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.2);
      });
    };

    playSequence();
    activeInterval = setInterval(playSequence, 1200);
  } catch (err) {
    console.error('[ringSession] playUrgentChime failed', err);
  }
}

// Custom file playback
export function playCustomAudio(sourceUrl: string, volume = 0.8): void {
  stopRingSessionAudio();
  try {
    const audio = new Audio(sourceUrl);
    audio.volume = volume;
    audio.loop = true;
    activeAudioElement = audio;
    audio.play().catch(err => {
      console.warn('[ringSession] audio.play failed, falling back to default chime', err);
      playDefaultChime(volume);
    });
  } catch {
    playDefaultChime(volume);
  }
}

/**
 * Total sound options available in round-robin switcher:
 * 0: Mặc định (Default Chime)
 * 1: Nhẹ nhàng (Gentle Chime)
 * 2: Dồn dập (Urgent Chime)
 * 3: Bài nhạc riêng (Custom Sound - only if user configured one)
 */
export function getSoundOptionsCount(settings: AlarmSettings): number {
  return settings.customSound ? 4 : 3;
}

export function playSoundByIndex(index: number, settings: AlarmSettings): void {
  const total = getSoundOptionsCount(settings);
  const normalized = ((index % total) + total) % total;

  if (normalized === 0) {
    playDefaultChime(settings.volume);
  } else if (normalized === 1) {
    playGentleChime(settings.volume);
  } else if (normalized === 2) {
    playUrgentChime(settings.volume);
  } else if (normalized === 3 && settings.customSound) {
    const src = settings.customSound.dataBase64 || settings.customSound.uri;
    if (src) {
      playCustomAudio(src, settings.volume);
    } else {
      playDefaultChime(settings.volume);
    }
  } else {
    playDefaultChime(settings.volume);
  }
}
