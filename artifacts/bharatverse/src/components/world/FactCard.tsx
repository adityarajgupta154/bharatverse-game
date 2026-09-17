import { Square, Volume2 } from 'lucide-react';
import type { DiscoveryDef } from '@/game/content';
import { discoveryNarration } from '@/game/content/narration';
import { narrationAudioUrl } from '@/lib/narrationAudio';
import { useSpeech } from '@/lib/useSpeech';
import { useRef } from 'react';
import { CardShell } from './CardShell';

/**
 * The written discovery behind a building — an explore fact card or a recap
 * story replay (BuildingCard's "Khoj Shuru Karo" / "Kahani Phir Se Suno"
 * opens it in place of the activation card). Same visual language, one size
 * up: intro line, ◆ sections, a "Kya Jaante Ho?" / "Raaz ki Baat" box, and
 * — for a not-yet-explored fact card — the "Yaad Lautao" action that
 * returns the building's memory (the caller marks it complete). Regions
 * shipping new content reuse this component as-is; only content/index.ts
 * entries are per-building. Modal chrome (brackets, backdrop, close, focus
 * rules) comes from CardShell; the primary CTA takes initial focus.
 */
export function FactCard({
  discovery,
  explored,
  onRestore,
  onClose,
}: {
  discovery: DiscoveryDef;
  /** The building's memory is already back — CTA just closes. */
  explored: boolean;
  /** Explore cards until explored: return the memory (mark complete + close). */
  onRestore?: () => void;
  onClose: () => void;
}) {
  const ctaRef = useRef<HTMLButtonElement>(null);

  // Smriti reads the card aloud (early readers). Pregenerated narration
  // (one warm storyteller voice on every device) plays when this card's
  // audio shipped; otherwise live TTS voices the same registry text — so
  // future regions still work with zero wiring until their audio lands.
  const { canListen, speaking, toggle } = useSpeech({
    audioUrl: narrationAudioUrl(discovery.id),
  });
  const toggleListen = () => toggle(discoveryNarration(discovery));

  const recap = discovery.kind === 'recap';

  return (
    <CardShell
      label={discovery.title}
      widthClass="w-[380px]"
      paddingClass="p-[16px]"
      initialFocusRef={ctaRef}
      onClose={onClose}
    >
      <span className="text-[6.5px] text-primary/90 uppercase tracking-[0.16em] font-medium">
        {discovery.kicker}
      </span>
      <h2 className="font-title-serif text-[15px] font-bold text-white tracking-wide mt-[3px] leading-tight text-glow">
        {discovery.title}
      </h2>
      <span className="text-[7.5px] text-primary/80 block mt-[2px]">{discovery.subtitle}</span>

      {canListen && (
        <button
          onClick={toggleListen}
          aria-pressed={speaking}
          aria-label={speaking ? 'Roko — Smriti didi ka padhna roko' : 'Suno — Smriti didi se card suno'}
          data-testid="discovery-listen"
          className="mx-auto mt-[7px] flex items-center gap-[5px] text-[7px] uppercase tracking-[0.16em] font-bold text-primary border border-primary/35 rounded-full px-[10px] py-[4px] hover:bg-primary/10 transition-colors"
        >
          {speaking ? (
            <>
              <Square className="w-[8px] h-[8px] animate-pulse" aria-hidden />
              Roko
            </>
          ) : (
            <>
              <Volume2 className="w-[9px] h-[9px]" aria-hidden />
              Suno
            </>
          )}
        </button>
      )}

      <div className="w-[85%] h-px bg-primary/20 my-[9px] mx-auto" />

      <p className="text-[8px] leading-[1.65] text-foreground/90 px-[8px]">{discovery.intro}</p>

      <div className="mt-[10px] px-[6px] space-y-[8px] text-left">
        {discovery.sections.map(s => (
          <div key={s.heading} className="flex gap-[7px]">
            <span className="text-primary text-[7.5px] leading-[1.7] shrink-0">◆</span>
            <div>
              <span className="block text-[8px] font-bold text-primary/95 tracking-wide">
                {s.heading}
              </span>
              <p className="text-[7.5px] leading-[1.65] text-foreground/85 mt-[1px]">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-[10px] mx-[6px] rounded border border-primary/30 bg-primary/[0.06] px-[9px] py-[7px] text-left">
        <span className="text-[6.5px] uppercase tracking-[0.16em] text-primary font-bold">
          ✦ {recap ? 'Raaz ki Baat' : 'Kya Jaante Ho?'}
        </span>
        <p className="text-[7.5px] leading-[1.65] text-foreground/85 mt-[3px]">
          {discovery.funFact}
        </p>
      </div>

      {!recap && explored && (
        <span className="block mx-auto w-fit mt-[9px] text-[6.5px] uppercase tracking-[0.14em] text-primary/70 border border-primary/25 rounded-full px-[8px] py-[3px]">
          ✓ Yaad laut chuki hai
        </span>
      )}
      <button
        ref={ctaRef}
        onClick={onRestore ?? onClose}
        className="block mx-auto mt-[10px] text-[8.5px] uppercase tracking-[0.16em] font-bold text-black bg-primary hover:bg-primary/85 rounded-full px-[16px] py-[6px] transition-colors"
      >
        {recap ? 'Chalo, Yaadein Lautayein!' : onRestore ? '✦ Yaad Lautao' : 'Village Wapas Chalo'}
      </button>
    </CardShell>
  );
}
