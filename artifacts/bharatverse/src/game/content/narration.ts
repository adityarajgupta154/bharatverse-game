import type { DiscoveryDef } from './index';

/**
 * Discovery-card narration (Task: Smriti reads cards aloud) — the PURE text
 * side of the listen feature, kept beside the content registry so every
 * current and future region's cards get audio with zero per-card wiring:
 * whatever ships in index.ts is exactly what Smriti reads.
 *
 * Returns the card as ordered speakable parts (one utterance each — the
 * gaps between parts double as natural storyteller pauses, and short
 * utterances avoid the long-utterance cutoffs some engines have):
 *   intro → each ◆ section ("heading — body") → the fun-fact box with its
 *   on-card label as the spoken hook.
 *
 * Kept free of browser APIs so the headless content validator
 * (scripts/verify-world-data.ts, run under tsx) asserts every registry
 * entry narrates sanely at CI time.
 */
export function discoveryNarration(d: DiscoveryDef): string[] {
  const factLabel = d.kind === 'recap' ? 'Raaz ki baat' : 'Kya jaante ho?';
  return [
    d.intro,
    ...d.sections.map(s => `${s.heading} ${sentenceGap(s.heading)}${s.body}`),
    `${factLabel} ${d.funFact}`,
  ];
}

/** Headings that already end in punctuation flow straight into the body. */
function sentenceGap(heading: string): string {
  return /[?!.…]$/.test(heading.trim()) ? '' : '— ';
}
