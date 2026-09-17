import buildingsJson from './buildings.json';
import npcsJson from './npcs.json';
import { SINDHU_WALK } from './walk';
import {
  parseWorldBuildings,
  parseWorldNpcs,
  type WorldData,
} from '../../world-validate';

/**
 * Sindhu Ghati (Mohenjo-Daro) — pure world data, no vite assets, so BOTH the
 * app registry (worlds/index.ts) and the headless CI validator
 * (scripts/verify-world-data.ts) consume the SAME checked config. The JSONs
 * are shape-validated ONCE here at import: malformed data fails loudly
 * everywhere instead of shipping as a dead hotspot or mute NPC.
 */
export const WORLD_DATA: WorldData = {
  config: {
    nodeId: 'sindhu-ghati',
    imageSize: { w: 1024, h: 1536 },
    lines: {
      welcome: 'Duniya ke pehle planned sheher me swagat hai.',
      locked: 'Yeh dwar abhi bandh hai, Aru. Pehle baaki yaadein lauta.',
    },
    buildings: parseWorldBuildings(buildingsJson, 'sindhu-ghati'),
    npcs: parseWorldNpcs(npcsJson, 'sindhu-ghati'),
  },
  walk: SINDHU_WALK,
  // Movement Bridge Task 10: canvas VillageScene is the default renderer.
  // The legacy DOM walk path stays intact behind ?walk=dom as the fallback
  // safety net for at least one more milestone (PRD 10.1/10.2).
  walkRenderer: 'canvas',
};
