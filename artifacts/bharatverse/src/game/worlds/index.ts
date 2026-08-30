import type {
  BuildingState,
  WorldBuilding,
  WorldConfig,
  WorldNpc,
} from '@/game/world-types';
import sindhuBuildings from './sindhu-ghati/buildings.json';
import sindhuNpcs from './sindhu-ghati/npcs.json';
import sindhuArt from '@/assets/images/village-sindhu.jpg';

export interface WorldEntry {
  config: WorldConfig;
  /** Resolved URL of the world painting (width 1024 world px = stage px). */
  art: string;
}

const WORLDS: Record<string, WorldEntry> = {
  'sindhu-ghati': {
    art: sindhuArt,
    config: {
      nodeId: 'sindhu-ghati',
      imageSize: { w: 1024, h: 1536 },
      lines: {
        welcome: 'Duniya ke pehle planned sheher me swagat hai.',
        locked: 'Yeh dwar abhi bandh hai, Aru. Pehle baaki yaadein lauta.',
      },
      buildings: sindhuBuildings as unknown as WorldBuilding[],
      npcs: sindhuNpcs as unknown as WorldNpc[],
    },
  },
};

export function getWorld(nodeId: string | undefined): WorldEntry | undefined {
  return nodeId ? WORLDS[nodeId] : undefined;
}

/** Buildings the story treats as already done when a player first arrives. */
export function initiallyCompleted(config: WorldConfig): ReadonlySet<string> {
  return new Set(
    config.buildings.filter(b => b.initialState === 'explored').map(b => b.id)
  );
}

/**
 * Runtime state = authored initial state + player progress.
 * Completion always wins; unmet `unlocksAfter` always locks.
 */
export function deriveBuildingState(
  b: WorldBuilding,
  completed: ReadonlySet<string>
): BuildingState {
  if (completed.has(b.id)) return 'explored';
  if (b.unlocksAfter.some(id => !completed.has(id))) return 'locked';
  return b.initialState;
}
