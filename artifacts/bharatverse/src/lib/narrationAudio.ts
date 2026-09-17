import { claimVoiceSession, type SpeechHandle } from './speech';

/**
 * Pregenerated "Smriti didi" narration — one warm, consistent storyteller
 * voice for discovery cards on EVERY device, instead of whatever TTS voice
 * a school machine happens to have. Files are generated from the exact
 * same registry text the screen shows (src/game/content/narration.ts), so
 * audio and text can't drift.
 *
 * Discovery is build-time: any mp3 dropped in assets/audio/narration/ is
 * picked up by content id — future regions need zero wiring here, and ids
 * WITHOUT a file simply fall back to live TTS (speakParts). The
 * verify:world-data script soft-warns about shipped ids missing audio.
 */
const files = import.meta.glob('../assets/audio/narration/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const byId = new Map<string, string>();
for (const [path, url] of Object.entries(files)) {
  const id = path.match(/([\w-]+)\.mp3$/)?.[1];
  if (id) byId.set(id, url);
}

/** URL of the pregenerated narration for a content id, if it shipped. */
export function narrationAudioUrl(id: string): string | null {
  return byId.get(id) ?? null;
}

/**
 * Plays a narration file under the same one-voice session as live TTS
 * (starting either silences the other). `onEnd` fires exactly once on
 * completion/stop/takeover; `onUnplayable` fires INSTEAD when the file
 * couldn't start at all (missing/undecodable/blocked) so the caller can
 * fall back to live TTS without flickering its button state.
 */
export function playNarrationAudio(
  url: string,
  onEnd: () => void,
  onUnplayable: () => void
): SpeechHandle {
  const audio = new Audio(url);
  let started = false;
  let failedEarly = false;

  const session = claimVoiceSession({
    stopEngine: () => audio.pause(),
    onEnd: () => (failedEarly ? onUnplayable() : onEnd()),
  });

  audio.addEventListener('ended', () => session.finish());
  audio.addEventListener('error', () => {
    if (!started) failedEarly = true;
    session.finish();
  });
  audio.play().then(
    () => {
      started = true;
    },
    () => {
      // Autoplay policy or load failure before start → let TTS take over.
      failedEarly = true;
      session.finish();
    }
  );

  return { stop: () => session.finish() };
}
