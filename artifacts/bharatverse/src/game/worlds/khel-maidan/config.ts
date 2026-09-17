import buildingsJson from './buildings.json';
import npcsJson from './npcs.json';
import {
  parseWorldBuildings,
  parseWorldNpcs,
  type WorldData,
} from '../../world-validate';

/** Khel Maidan — pure checked world data; see sindhu-ghati/config.ts. */
export const WORLD_DATA: WorldData = {
  config: {
    nodeId: 'khel-maidan',
    imageSize: { w: 1024, h: 1024 },
    lines: {
      welcome: 'Maidan pukaar raha hai — daud lagane ko taiyaar?',
      locked: 'Yeh dwar abhi bandh hai, Aru. Pehle 2 kshetra explore karo.',
    },
    buildings: parseWorldBuildings(buildingsJson, 'khel-maidan'),
    npcs: parseWorldNpcs(npcsJson, 'khel-maidan'),
  },
};
