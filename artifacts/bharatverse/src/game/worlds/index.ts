import type {
  BuildingState,
  WorldBuilding,
  WorldConfig,
  WorldNpc,
} from '@/game/world-types';
import { STAGE_W, STAGE_H } from '@/lib/stage';
import { getGameForRouteTarget } from '@/game/games';
import sindhuBuildings from './sindhu-ghati/buildings.json';
import sindhuNpcs from './sindhu-ghati/npcs.json';
import sindhuArt from '@/assets/images/village-sindhu.jpg';

/**
 * World registry — the ONLY place that knows which node worlds exist.
 *
 * HOW TO ADD A NEW NODE'S WORLD (no screen-code changes needed — PRD Task 8):
 * 1. Drop the world painting in `src/assets/images/` (width MUST be 1024
 *    world px; height may exceed 592 → the screen pans vertically).
 * 2. Create `src/game/worlds/<node-id>/buildings.json` and `npcs.json`
 *    following the schemas in `world-types.ts` (coordinates in world px).
 * 3. Add one `defineWorld({...})` entry to `WORLDS` below.
 * That's it: `/world/<node-id>` renders it with the full engine — pan/drag,
 * building gating, NPC dialogue, transitions, and climax → hub restore.
 * (The hub-side node must also exist in `game/nodes.ts` and be unlocked,
 * or the entry gate will redirect to the Memory Map.)
 */
export interface WorldEntry {
  config: WorldConfig;
  /** Resolved URL of the world painting (width 1024 world px = stage px). */
  art: string;
}

/**
 * Dev-only authoring guard: catches config mistakes (typos, out-of-bounds
 * coordinates, dangling ids) the moment a world loads, instead of as silent
 * dead hotspots. Production skips this — shipped data has already passed.
 */
function defineWorld(entry: WorldEntry): WorldEntry {
  if (!import.meta.env.DEV) return entry;
  const { config } = entry;
  const problems: string[] = [];
  const where = `world "${config.nodeId}"`;

  if (config.imageSize.w !== STAGE_W)
    problems.push(`imageSize.w must be ${STAGE_W} (1:1 with stage px), got ${config.imageSize.w}`);
  if (config.imageSize.h < STAGE_H)
    problems.push(`imageSize.h ${config.imageSize.h} is shorter than the ${STAGE_H}px stage`);
  if (!config.lines.welcome || !config.lines.locked)
    problems.push('lines.welcome and lines.locked must be non-empty');

  const buildingIds = new Set<string>();
  for (const b of config.buildings) {
    if (buildingIds.has(b.id)) problems.push(`duplicate building id "${b.id}"`);
    buildingIds.add(b.id);
    if (!/^(explore|minigame|builder|climax|recap):/.test(b.routeTarget))
      problems.push(`building "${b.id}" routeTarget "${b.routeTarget}" has an unknown namespace`);
    // A registered 2D game must declare THIS building as its completion
    // target — otherwise winning would mark the wrong building complete.
    const game = getGameForRouteTarget(b.routeTarget);
    if (game && game.buildingId !== b.id)
      problems.push(
        `building "${b.id}" routeTarget "${b.routeTarget}" launches game "${game.id}", but that game declares buildingId "${game.buildingId}" — they must match`
      );
    if (!Number.isFinite(b.position.x) || !Number.isFinite(b.position.y))
      problems.push(`building "${b.id}" position must be finite numbers`);
    else if (b.position.x < 0 || b.position.x > STAGE_W || b.position.y < 0 || b.position.y > config.imageSize.h)
      problems.push(`building "${b.id}" position is outside the painting`);
  }
  for (const b of config.buildings) {
    for (const dep of b.unlocksAfter) {
      if (!buildingIds.has(dep))
        problems.push(`building "${b.id}" unlocksAfter unknown id "${dep}"`);
    }
  }
  const climaxCount = config.buildings.filter(b => b.type === 'climax').length;
  if (climaxCount !== 1)
    problems.push(`exactly one climax building required (it fires the hub region-restore), got ${climaxCount}`);

  const npcIds = new Set<string>();
  for (const n of config.npcs) {
    if (npcIds.has(n.id)) problems.push(`duplicate npc id "${n.id}"`);
    npcIds.add(n.id);
    if (n.dialogueLines.length === 0) problems.push(`npc "${n.id}" has no dialogue lines`);
    if (n.linkedBuildingId && !buildingIds.has(n.linkedBuildingId))
      problems.push(`npc "${n.id}" links unknown building "${n.linkedBuildingId}"`);
    if (!Number.isFinite(n.position.x) || !Number.isFinite(n.position.y))
      problems.push(`npc "${n.id}" position must be finite numbers`);
    else if (n.position.x < 0 || n.position.x > STAGE_W || n.position.y < 0 || n.position.y > config.imageSize.h)
      problems.push(`npc "${n.id}" position is outside the painting`);
  }

  if (problems.length > 0)
    throw new Error(`Invalid ${where} config:\n- ${problems.join('\n- ')}`);
  return entry;
}

const WORLDS: Record<string, WorldEntry> = {
  // NOTE: each key MUST equal its config.nodeId (guard below) — a mismatch
  // would silently load another node's progress under this route.
  'sindhu-ghati': defineWorld({
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
  }),
};

if (import.meta.env.DEV) {
  for (const [key, entry] of Object.entries(WORLDS)) {
    if (key !== entry.config.nodeId)
      throw new Error(
        `WORLDS registry key "${key}" must equal its config.nodeId "${entry.config.nodeId}"`
      );
  }
}

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
