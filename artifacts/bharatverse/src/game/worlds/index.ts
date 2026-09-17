import type { BuildingState, WorldBuilding, WorldConfig } from '@/game/world-types';
import { validateWorldData, type WorldData } from '@/game/world-validate';
import { WORLD_DATA as sindhuData } from './sindhu-ghati/config';
import { WORLD_DATA as magadhaData } from './magadha-kaal/config';
import { WORLD_DATA as kalaData } from './kala-bhoomi/config';
import { WORLD_DATA as paramparaData } from './apni-parampara/config';
import { WORLD_DATA as khelData } from './khel-maidan/config';
import sindhuArt from '@/assets/images/village-sindhu.jpg';
import sindhuWalkArt from '@/assets/images/village-sindhu-walk.jpg';
import magadhaArt from '@/assets/images/village-magadha.jpg';
import kalaArt from '@/assets/images/village-kala.jpg';
import paramparaArt from '@/assets/images/village-parampara.jpg';
import khelArt from '@/assets/images/village-khel.jpg';

/**
 * World registry — the ONLY place that knows which node worlds exist.
 *
 * HOW TO ADD A NEW NODE'S WORLD (no screen-code changes needed — PRD Task 8):
 * 1. Drop the world painting in `src/assets/images/` (width MUST be 1024
 *    world px; height may exceed 592 → the screen pans vertically).
 * 2. Create `src/game/worlds/<node-id>/buildings.json` and `npcs.json`
 *    following the schemas in `world-types.ts` (coordinates in world px).
 * 3. Create `src/game/worlds/<node-id>/config.ts` exporting WORLD_DATA
 *    (copy an existing region's — it shape-checks the JSONs at import, and
 *    scripts/verify-world-data.ts auto-discovers it in CI).
 * 4. Add one `defineWorld({...})` entry to `WORLDS` below.
 * That's it: `/world/<node-id>` renders it with the full engine — pan/drag,
 * building gating, NPC dialogue, transitions, and climax → hub restore.
 * (The hub-side node must also exist in `game/nodes.ts` and be unlocked,
 * or the entry gate will redirect to the Memory Map.)
 */
export interface WorldEntry extends WorldData {
  /**
   * Resolved URL of the world painting (width 1024 world px = stage px).
   * The only vite-asset field — everything else lives in the region's pure
   * config.ts (walk mask/spawn, and walkRenderer: 'dom' | 'canvas', the
   * Movement Bridge flag that Task 10 flips per world, URL-overridable via
   * ?walk=canvas|dom).
   */
  art: string;
  /**
   * Canvas walk-mode variant of the painting (Task 7): identical pixels
   * except the patrol movers are cobble-patched out — their cut sprites
   * render on top instead, so nobody is painted twice mid-walk. DOM mode
   * keeps `art`, where those figures stay baked and static.
   */
  walkArt?: string;
}

/**
 * Dev authoring guard: the shared validator (world-validate.ts — same one
 * scripts/verify-world-data.ts runs in CI over ALL regions) throws here the
 * moment a world loads in dev, so config mistakes surface as a crash with a
 * problem list instead of silent dead hotspots. Production skips this —
 * shipped data has already passed CI; the JSON shape checks in each region's
 * config.ts still run everywhere, at import.
 */
function defineWorld(entry: WorldEntry): WorldEntry {
  if (!import.meta.env.DEV) return entry;
  const problems = validateWorldData(entry);
  if (problems.length > 0)
    throw new Error(
      `Invalid world "${entry.config.nodeId}" config:\n- ${problems.join('\n- ')}`
    );
  return entry;
}

const WORLDS: Record<string, WorldEntry> = {
  // NOTE: each key MUST equal its config.nodeId (guard below) — a mismatch
  // would silently load another node's progress under this route.
  'sindhu-ghati': defineWorld({ art: sindhuArt, walkArt: sindhuWalkArt, ...sindhuData }),
  // The four remaining regions each ship one playable finale: their climax
  // building IS the minigame, so winning it restores the whole map node.
  'magadha-kaal': defineWorld({ art: magadhaArt, ...magadhaData }),
  'kala-bhoomi': defineWorld({ art: kalaArt, ...kalaData }),
  'apni-parampara': defineWorld({ art: paramparaArt, ...paramparaData }),
  'khel-maidan': defineWorld({ art: khelArt, ...khelData }),
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
