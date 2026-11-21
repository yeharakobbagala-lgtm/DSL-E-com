// ============================================================================
// AUDIO NOTIFICATION SERVICE FOR SUPER ADMIN & STORE OPERATIONS
// Synthesizes a luxury multi-harmonic notification chime via Web Audio API,
// with graceful fallback to /audio/order-chime.wav.
// ============================================================================

const SOUND_PREF_KEY = 'dsl_admin_order_sound_enabled';

class SoundService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SOUND_PREF_KEY);
      this.soundEnabled = stored !== null ? stored === 'true' : true;

      // Unlock AudioContext on first user interaction in admin portal
      const unlockAudio = () => {
        this.getOrCreateAudioContext();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };

      window.addEventListener('click', unlockAudio, { once: true, passive: true });
      window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
      window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    }
  }

  private getOrCreateAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  /**
   * Synthesize a crisp, vibrant 3-tone cash register / luxury hotel bell chime.
   * Tone 1: 523.25 Hz (C5) at t=0
   * Tone 2: 659.25 Hz (E5) at t=0.12s
   * Tone 3: 1046.5 Hz (C6) at t=0.24s (crystal clarity)
   */
  public playOrderChime(): void {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getOrCreateAudioContext();
      if (ctx) {
        const now = ctx.currentTime;

        const playTone = (freq: number, start: number, duration: number, gainVal: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          // Bell harmonic
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(freq * 2, start);

          // Smooth exponential volume decay
          gain.gain.setValueAtTime(gainVal, start);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

          gain2.gain.setValueAtTime(gainVal * 0.35, start);
          gain2.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.7);

          osc.connect(gain);
          osc2.connect(gain2);
          gain.connect(ctx.destination);
          gain2.connect(ctx.destination);

          osc.start(start);
          osc2.start(start);
          osc.stop(start + duration);
          osc2.stop(start + duration * 0.7);
        };

        // Note 1: C5
        playTone(523.25, now, 0.7, 0.4);
        // Note 2: E5
        playTone(659.25, now + 0.12, 0.7, 0.45);
        // Note 3: C6 (Crisp high chime)
        playTone(1046.5, now + 0.24, 0.95, 0.55);
        // Note 4: G6 harmonic flourish
        playTone(1567.98, now + 0.28, 0.6, 0.25);
        return;
      }
    } catch (err) {
      console.warn('Web Audio synthesis failed, falling back to audio file:', err);
    }

    // Fallback: HTML5 Audio
    try {
      const audio = new Audio('/audio/order-chime.wav');
      audio.volume = 0.85;
      audio.play().catch((e) => {
        console.warn('HTML5 audio autoplay blocked by browser:', e);
      });
    } catch (err) {
      console.warn('Failed to play fallback audio:', err);
    }
  }

  public testSound(): void {
    const wasEnabled = this.soundEnabled;
    this.soundEnabled = true;
    this.playOrderChime();
    this.soundEnabled = wasEnabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SOUND_PREF_KEY, enabled ? 'true' : 'false');
    }
  }
}

export const soundService = new SoundService();
