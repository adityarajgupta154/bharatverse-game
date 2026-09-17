import childCut from '@/assets/images/npc-child-cut.png';
import dogCut from '@/assets/images/npc-dog-cut.png';
import gateGuardCut from '@/assets/images/npc-gate-guard-cut.png';
import sackCarrierCut from '@/assets/images/npc-sack-carrier-cut.png';

/**
 * Cut sprites for patrol movers (Movement Bridge PRD Task 7). Each cut is
 * the figure lifted straight out of the village painting (background
 * removed), and `ax/ay` place the crop back EXACTLY over its painted spot
 * when the NPC stands at its authored home position:
 * draw topLeft = pos − (ax, ay).
 *
 * `village-sindhu-walk.jpg` (WorldEntry.walkArt) is the same painting with
 * every registered figure patched out, so at rest nothing changes visually
 * — and nobody is painted twice once they walk away. Natural facing of every
 * cut is RIGHT; the scene mirrors around the anchor for facing = -1.
 */
export interface NpcSpriteDef {
  src: string;
  w: number;
  h: number;
  /** Anchor offset: sprite topLeft = npc pos − (ax, ay). */
  ax: number;
  ay: number;
}

export const NPC_SPRITE_DEFS: Record<string, NpcSpriteDef> = {
  // crop rect (348,172) 56×102 from village-sindhu.jpg; home anchor (372,272)
  'npc-sack-carrier': { src: sackCarrierCut, w: 56, h: 102, ax: 24, ay: 100 },
  // crop rect (368,562) 68×108 from village-sindhu.jpg; home anchor (410,678)
  'npc-child': { src: childCut, w: 68, h: 108, ax: 42, ay: 116 },
  // crop rect (410,690) 72×62; home anchor (447,746)
  'npc-dog': { src: dogCut, w: 72, h: 62, ax: 37, ay: 56 },
  // crop rect (405,1272) 50×113; home anchor (430,1375)
  'npc-gate-guard': { src: gateGuardCut, w: 50, h: 113, ax: 25, ay: 103 },
};
