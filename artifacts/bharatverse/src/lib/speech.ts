/**
 * Smriti didi's voice — a thin Web Speech API wrapper for reading discovery
 * cards, HUD dialogue, and building invites aloud (early readers in the
 * 6–11 audience can't comfortably read the text-rich Hinglish copy yet).
 *
 * Discovery cards prefer PREGENERATED narration audio (one consistent
 * storyteller voice — see narrationAudio.ts); this engine is the fallback
 * for devices without those files cached, for content whose audio hasn't
 * been generated yet, and for all other speech surfaces (HUD, invites).
 * Voice pick prefers Indian-English voices because the copy is ROMANIZED
 * Hinglish: en-IN voices pronounce it naturally, while hi-IN voices
 * (expecting Devanagari) tend to mangle Latin script — hi-IN is still the
 * second choice ahead of generic English.
 */

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** en-IN first (best with romanized Hinglish), hi-IN next, then any en. */
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const byLang = (prefix: string) =>
    voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(prefix));
  return byLang('en-in') ?? byLang('hi') ?? byLang('en') ?? null;
}

export interface SpeechHandle {
  /** Stops this playback (safe to call twice; also used on card close). */
  stop(): void;
}

/**
 * One didi, one voice — app-wide, across BOTH engines (speechSynthesis and
 * pregenerated <audio>). Several components own listen buttons; whichever
 * starts a session force-ends the previous one HERE, not via engine
 * events, because not every engine fires onerror for cancelled utterances.
 * The loser's engine is silenced and its onEnd runs synchronously, so its
 * button can never strand in the "Roko" state.
 */
interface Session {
  finish(): void;
}
let active: Session | null = null;

/**
 * Claims the app-wide talking slot. `stopEngine` runs inside finish() only
 * while this session still owns the slot (self-stop or being taken over) —
 * never after a successor owns the engine. `onEnd` always runs, exactly
 * once. Returns the session; call `finish()` to end it from any path
 * (engine completion, user stop, unmount, takeover).
 */
export function claimVoiceSession(opts: {
  stopEngine(): void;
  onEnd(): void;
}): Session {
  active?.finish();

  let ended = false;
  function finish() {
    if (ended) return;
    ended = true;
    if (active === session) {
      active = null;
      opts.stopEngine();
    }
    opts.onEnd();
  }
  const session: Session = { finish };
  active = session;
  return session;
}

/**
 * Speaks the parts in order as one queued session; `onEnd` fires exactly
 * once — after the last part finishes, when stopped, or when another
 * session takes over the voice. Returns a handle to stop.
 */
export function speakParts(parts: string[], onEnd: () => void): SpeechHandle {
  const synth = window.speechSynthesis;
  const session = claimVoiceSession({
    stopEngine: () => synth.cancel(),
    onEnd,
  });
  // Fresh start: clear any leftover queue/paused state (a previous cancel
  // leaves some browsers paused).
  synth.cancel();

  // Voices load async on first use (Chrome) — retry the pick once they land.
  let voice = pickVoice();
  if (!voice && typeof synth.addEventListener === 'function') {
    synth.addEventListener(
      'voiceschanged',
      () => {
        voice = pickVoice();
      },
      { once: true }
    );
  }

  // Keep utterance refs alive for the whole session: Chrome GCs fired-and-
  // forgotten utterances mid-queue, silently dropping their end events.
  const utterances = parts.map((text, i) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? 'en-IN';
    // Storyteller pace for kids: a touch slower, a touch warmer.
    u.rate = 0.92;
    u.pitch = 1.05;
    if (i === parts.length - 1) u.onend = () => session.finish();
    // Any error (including cancel-driven "interrupted") ends the session.
    u.onerror = () => session.finish();
    return u;
  });
  for (const u of utterances) synth.speak(u);

  return { stop: () => session.finish() };
}
