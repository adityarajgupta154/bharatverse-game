import buildingsJson from './buildings.json';
import npcsJson from './npcs.json';
import {
  parseWorldBuildings,
  parseWorldNpcs,
  type WorldData,
} from '../../world-validate';

/** Apni Parampara (Utsav Aangan) — pure checked world data; see sindhu-ghati/config.ts. */
export const WORLD_DATA: WorldData = {
  config: {
    nodeId: 'apni-parampara',
    imageSize: { w: 1024, h: 1024 },
    lines: {
      welcome: 'Utsav ka aangan tumhara hi intezaar kar raha tha!',
      locked: 'Yeh dwar abhi bandh hai, Aru.',
    },
    buildings: parseWorldBuildings(buildingsJson, 'apni-parampara'),
    npcs: parseWorldNpcs(npcsJson, 'apni-parampara'),
  },
};
