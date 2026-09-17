import type { Page } from '@playwright/test';

/**
 * Shared speech recorder for listen-control specs, covering BOTH voice
 * engines. Real audio can't be asserted headlessly, so specs install this
 * BEFORE the app loads and assert against window.__tts.
 *
 * speechSynthesis + SpeechSynthesisUtterance must be shadowed via
 * Object.defineProperty — speechSynthesis is a getter-only accessor on
 * Window, and plain assignment silently no-ops (the app would then talk to
 * the real engine while the recorder sees nothing).
 *
 * The TTS stub fires NO utterance events on its own, so after "play" the
 * UI stays in its speaking state deterministically. Engine behaviors are
 * triggered explicitly from specs instead:
 *  - fireLastOnEnd(): the engine finishing the queue naturally (the app
 *    only listens on the FINAL utterance's onend);
 *  - fireVoicesChanged(voices): voices arriving late (Chrome loads them
 *    async on first use) for the voice-pick race.
 *
 * window.Audio (pregenerated narration playback) is stubbed too:
 *  - audio.mode 'reject' (DEFAULT): play() rejects, forcing the app's
 *    live-TTS fallback — so all TTS-asserting specs also prove the
 *    fallback chain whenever the card has pregenerated audio;
 *  - audio.mode 'play': play() resolves and the reading stays in audio
 *    (spoken utterances must NOT grow); audio.fireEnded() simulates the
 *    file finishing naturally.
 */
interface StubUtterance {
  text: string;
  onend?: (e: unknown) => void;
  onerror?: (e: unknown) => void;
}

interface StubAudioInstance {
  src: string;
  handlers: Record<string, Array<() => void>>;
}

declare global {
  interface Window {
    __tts: {
      spoken: string[];
      cancels: number;
      utts: StubUtterance[];
      voices: Array<{ lang: string; name: string }>;
      voicesChangedListeners: Array<() => void>;
      /** Fire the final queued utterance's onend; true if it had one. */
      fireLastOnEnd(): boolean;
      /** Deliver voices + notify (and clear) 'voiceschanged' listeners; returns how many were notified. */
      fireVoicesChanged(voices: Array<{ lang: string; name: string }>): number;
      audio: {
        mode: 'reject' | 'play';
        plays: string[];
        pauses: number;
        instances: StubAudioInstance[];
        /** Fire 'ended' on the most recent audio instance; true if it had a listener. */
        fireEnded(): boolean;
      };
    };
  }
}

export async function installTtsStub(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const tts: Window['__tts'] = {
      spoken: [],
      cancels: 0,
      utts: [],
      voices: [],
      voicesChangedListeners: [],
      fireLastOnEnd() {
        const u = tts.utts[tts.utts.length - 1];
        if (!u?.onend) return false;
        u.onend({});
        return true;
      },
      fireVoicesChanged(voices) {
        tts.voices = voices;
        // {once: true} semantics for a single fire: notify then clear.
        const listeners = tts.voicesChangedListeners.splice(0);
        for (const fn of listeners) fn();
        return listeners.length;
      },
      audio: {
        mode: 'reject',
        plays: [],
        pauses: 0,
        instances: [],
        fireEnded() {
          const inst = tts.audio.instances[tts.audio.instances.length - 1];
          const fns = inst?.handlers['ended'];
          if (!fns?.length) return false;
          for (const fn of fns) fn();
          return true;
        },
      },
    };
    window.__tts = tts;
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speak: (u: StubUtterance) => {
          tts.spoken.push(u.text);
          tts.utts.push(u);
        },
        cancel: () => {
          tts.cancels++;
        },
        getVoices: () => tts.voices,
        addEventListener: (type: string, fn: () => void) => {
          if (type === 'voiceschanged') tts.voicesChangedListeners.push(fn);
        },
        removeEventListener: () => {},
        speaking: false,
        pending: false,
        paused: false,
      },
    });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: class {
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      },
    });
    Object.defineProperty(window, 'Audio', {
      configurable: true,
      value: class {
        src: string;
        handlers: Record<string, Array<() => void>> = {};
        constructor(src?: string) {
          this.src = src ?? '';
          tts.audio.instances.push(this);
        }
        addEventListener(type: string, fn: () => void) {
          (this.handlers[type] ??= []).push(fn);
        }
        play() {
          tts.audio.plays.push(this.src);
          return tts.audio.mode === 'play'
            ? Promise.resolve()
            : Promise.reject(new Error('tts-stub: audio disabled (mode=reject)'));
        }
        pause() {
          tts.audio.pauses++;
        }
      },
    });
  });
}

export async function ttsState(page: Page) {
  return page.evaluate(() => ({
    spoken: window.__tts.spoken.length,
    cancels: window.__tts.cancels,
    first: window.__tts.spoken[0] ?? '',
    last: window.__tts.spoken[window.__tts.spoken.length - 1] ?? '',
    all: window.__tts.spoken.join(' | '),
    audioPlays: window.__tts.audio.plays.length,
    audioPauses: window.__tts.audio.pauses,
    lastAudioSrc: window.__tts.audio.plays[window.__tts.audio.plays.length - 1] ?? '',
  }));
}
