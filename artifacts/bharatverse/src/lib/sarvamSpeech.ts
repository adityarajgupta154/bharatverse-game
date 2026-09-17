import { createSarvamSpeech } from '@workspace/api-client-react';
import { claimVoiceSession, type SpeechHandle } from './speech';

const MAX_AUDIO_BASE64_CHARS = 4_000_000;

function audioBlobUrl(base64: string, mimeType: string): string {
  if (base64.length > MAX_AUDIO_BASE64_CHARS) {
    throw new Error('Sarvam audio response is too large');
  }
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

/**
 * Requests Sarvam's natural Indian voice on demand while keeping the app's
 * one-speaker-at-a-time invariant. The handle exists immediately, so closing
 * a card can abort an in-flight request before audio starts.
 */
export function playSarvamSpeech(
  parts: string[],
  onEnd: () => void,
  onUnavailable: () => void
): SpeechHandle {
  const controller = new AbortController();
  let audio: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;
  let started = false;
  let failedBeforeStart = false;

  const session = claimVoiceSession({
    stopEngine: () => {
      controller.abort();
      audio?.pause();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    onEnd: () => (failedBeforeStart ? onUnavailable() : onEnd()),
  });

  createSarvamSpeech(
    { text: parts.join('\n\n') },
    { signal: controller.signal }
  ).then(
    response => {
      if (controller.signal.aborted) return;
      objectUrl = audioBlobUrl(response.audioBase64, response.mimeType);
      audio = new Audio(objectUrl);
      audio.addEventListener('ended', () => session.finish());
      audio.addEventListener('error', () => {
        if (!started) failedBeforeStart = true;
        session.finish();
      });
      audio.play().then(
        () => {
          started = true;
        },
        () => {
          failedBeforeStart = true;
          session.finish();
        }
      );
    },
    () => {
      if (controller.signal.aborted) return;
      failedBeforeStart = true;
      session.finish();
    }
  );

  return { stop: () => session.finish() };
}