import type { WorldCollisionGrid, WorldWalkConfig } from '@/game/world-types';
// Relative runtime imports — verify scripts run this file under tsx, where
// the '@/' alias does not resolve (type-only alias imports are fine).
import { maskFromCollisionGrid } from '../../world-walk';
import { parseWorldCollisionGrid } from '../../world-validate';
import collisionJson from './village-collision.json';

/**
 * Walkable-tile data for the Mohenjo-Daro painting (village-sindhu.jpg,
 * 1024x1536 = 16 cols x 24 rows of 64px tiles).
 *
 * CANONICAL SOURCE: ./village-collision.json (Movement Bridge PRD Task 0.1).
 * Hand-edit it or author visually in the /dev/mask-editor tool and paste the
 * export back. This module only expands it into the '#'/'.' mask the engine
 * and the reachability checks consume.
 *
 * Layout landmarks (rows top→bottom):
 *   1-7   upper-left path + granary plaza (granary cols 6-9, Aakhri Raaz 10-14)
 *   8     open band linking the upper and mid city
 *   9-13  mid city: Great Bath (0-4) | central drain street (5-10) | bazaar (11-14)
 *   14-16 lower plaza, alley past Naali Paheli and toward Sheher Banao
 *   17-21 city wall with the gate arch open at cols 7-8
 *   21-22 ground outside the gate, wells at both corners
 *
 * scripts/verify-village-walk.ts proves every building & NPC stays reachable
 * whenever this data or the world configs change.
 */
// Checked load — shape-validated once at import, so a hand-edit or a bad
// mask-editor paste fails loudly instead of silently warping the walk mask.
export const SINDHU_COLLISION: WorldCollisionGrid =
  parseWorldCollisionGrid(collisionJson, 'sindhu-ghati');

export const SINDHU_WALK: WorldWalkConfig = {
  mask: maskFromCollisionGrid(SINDHU_COLLISION),
  // Just outside the gate arch — Aru enters the city walking north.
  spawn: { x: 512, y: 1376 },
  // The mystery house speaks from behind sealed doors — by design you can
  // hear it only by clicking/hovering, not by walking up to it.
  voiceExceptions: ['mystery-house-resident'],
};
