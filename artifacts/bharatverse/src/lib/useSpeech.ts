import { useEffect, useRef, useState } from 'react';
import { isSpeechSupported, speakParts, type SpeechHandle } from './speech';
import { playNarrationAudio } from './narrationAudio';
import { playSarvamSpeech } from './sarvamSpeech';

/**
 * Shared state for every "Suno" listen affordance (FactCard, Smriti HUD,
 * BuildingCard): one toggle, one `speaking` flag, cleanup on unmount so a
 * closing card/screen always silences didi. Cross-component exclusivity is
 * the voice session registry's job (speech.ts) — when another button
 * starts reading, this hook's onEnd fires and `speaking` resets by itself.
 *
 * Pass `audioUrl` when the content has pregenerated narration (one warm
 * storyteller voice on every device); playback prefers it and falls back
 * to live TTS if the file can't start. Without it, toggle() is pure TTS.
 */
export function useSpeech(opts?: { audioUrl?: string | null }) {
  const audioUrl = opts?.audioUrl ?? null;
  // Pregenerated audio plays through HTMLAudio (universal), so the control
  // is useful even on devices with no speechSynthesis at all.
  // Sarvam is the primary live voice. Device speech remains a resilient
  // fallback when the API/network is unavailable.
  const canListen = true;
  const [speaking, setSpeaking] = useState(false);
  const handleRef = useRef<SpeechHandle | null>(null);

  useEffect(() => () => handleRef.current?.stop(), []); // owner unmounts → didi stops

  function toggle(parts: string[]) {
    if (speaking) {
      handleRef.current?.stop(); // stop()'s onEnd flips `speaking` off
      return;
    }
    const done = () => setSpeaking(false);
    const fallbackToDeviceVoice = () => {
      if (isSpeechSupported()) handleRef.current = speakParts(parts, done);
      else done();
    };
    handleRef.current = audioUrl
      ? playNarrationAudio(audioUrl, done, () => {
          // A shipped file still wins. If it cannot start, Sarvam covers it
          // before the final device-voice fallback.
          handleRef.current = playSarvamSpeech(parts, done, fallbackToDeviceVoice);
        })
      : playSarvamSpeech(parts, done, fallbackToDeviceVoice);
    setSpeaking(true);
  }

  /** Stop without toggling (e.g. the line being read left the screen). */
  function stop() {
    handleRef.current?.stop();
  }

  return { canListen, speaking, toggle, stop };
}
