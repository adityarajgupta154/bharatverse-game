import buildingsJson from './buildings.json';
import npcsJson from './npcs.json';
import {
  parseWorldBuildings,
  parseWorldNpcs,
  type WorldData,
} from '../../world-validate';

/** Kala Bhoomi (Shilpgram) — pure checked world data; see sindhu-ghati/config.ts. */
export const WORLD_DATA: WorldData = {
  config: {
    nodeId: 'kala-bhoomi',
    imageSize: { w: 1024, h: 1024 },
    lines: {
      welcome: 'Rang aur shilp ki bhoomi me swagat hai.',
      locked: 'Yeh dwar abhi bandh hai, Aru. Pehle Apni Parampara poori karo.',
    },
    buildings: parseWorldBuildings(buildingsJson, 'kala-bhoomi'),
    npcs: parseWorldNpcs(npcsJson, 'kala-bhoomi'),
  },
};
