import buildingsJson from './buildings.json';
import npcsJson from './npcs.json';
import {
  parseWorldBuildings,
  parseWorldNpcs,
  type WorldData,
} from '../../world-validate';

/** Magadha Kaal (Nalanda) — pure checked world data; see sindhu-ghati/config.ts. */
export const WORLD_DATA: WorldData = {
  config: {
    nodeId: 'magadha-kaal',
    imageSize: { w: 1024, h: 1024 },
    lines: {
      welcome: 'Gyan ki dharti Nalanda me swagat hai, Aru.',
      locked: 'Yeh dwar abhi bandh hai, Aru. Pehle Sindhu Ghati ki aur yaadein lautao.',
    },
    buildings: parseWorldBuildings(buildingsJson, 'magadha-kaal'),
    npcs: parseWorldNpcs(npcsJson, 'magadha-kaal'),
  },
};
