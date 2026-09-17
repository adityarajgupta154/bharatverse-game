/**
 * Village World (inner node layer) — config schemas. Task 0 of Story/NPC PRD v4.1.
 *
 * Rendering decision (locked in Task 0):
 * - Each node's world is its reference painting rendered 1:1 in stage px
 *   (width 1024 = stage width; height may exceed 592 → vertical pan).
 * - All coordinates below are in WORLD px: x 0..1024, y 0..imageSize.h.
 * - Buildings & NPCs are baked into the art; these configs add invisible
 *   interactive hotspots on top (same pattern as the Hub's gate hotspots).
 * - JSON files are authored content only; player progress is stored as
 *   deltas in localStorage (schema-versioned), never inside these configs.
 */

export type BuildingType =
  | 'explore'
  | 'minigame'
  | 'builder'
  | 'climax'
  | 'narrative_gate';

export type BuildingState =
  | 'explored'
  | 'in_progress'
  | 'locked'
  | 'story_mission';

export interface WorldBuilding {
  id: string;
  /** Label as painted in the art, e.g. "Anaaj Bhandaar". */
  name: string;
  /** English subtitle as painted, e.g. "The Great Granary". */
  subtitle: string;
  type: BuildingType;
  /**
   * Authored starting state. Runtime state = this + player progress deltas
   * (a completed building renders as "explored" regardless of initial state).
   */
  initialState: BuildingState;
  /** Center of the clickable zone, world px. */
  position: { x: number; y: number };
  /** Clickable zone size, world px. */
  hotspot: { w: number; h: number };
  /**
   * Canvas walk mode (Movement Bridge PRD Task 0.2): the walkable tile by
   * this building's door. The E-prompt appears when Aru is within
   * `interactionRadius` tiles of its center. The DOM walk fallback keeps
   * using hotspot-rect distance (INTERACT_PAD) instead.
   */
  anchorTile?: { row: number; col: number };
  /** E-prompt range around anchorTile, in tiles (1.5 = 96px). */
  interactionRadius?: number;
  /** Building ids that must ALL be completed before this one unlocks. Empty = free-roam. */
  unlocksAfter: string[];
  /**
   * What a click launches, namespaced:
   * "explore:<factCardId>" — fact-card popup (Explore stage)
   * "minigame:<id>"        — minigame screen
   * "builder:<id>"         — builder screen
   * "climax:<id>"          — node ending
   * "recap:<id>"           — story recap / intro replay
   */
  routeTarget: string;
}

export type NpcCategory = 'ambient' | 'context' | 'narrator';

export interface WorldNpc {
  id: string;
  /** Human-readable name for accessibility labels, e.g. "Anaaj rakshak". */
  name?: string;
  category: NpcCategory;
  /** Anchor (feet) of the painted NPC, world px. */
  position: { x: number; y: number };
  /** Hover zone size, world px (component applies a sensible default if omitted). */
  hotspot?: { w: number; h: number };
  /** Bilingual lines — `hi` (Hinglish) is shown in-game; `en` reserved for a future language toggle. */
  dialogueLines: { hi: string; en: string }[];
  /** For context NPCs: the building whose theme this NPC previews. */
  linkedBuildingId?: string;
  /** Reserved for future animated sprite NPCs (PRD §A.4.4 fallback: v1 ships baked-art static NPCs). */
  spriteId?: string;
  /**
   * Patrol route in collision-grid tiles (Movement Bridge PRD Task 0.3).
   * The NPC walks home → each waypoint in order → reverse, pausing
   * `pauseDurationMs` at the ends. Empty or absent = deliberately static
   * (seated/working figures — most painted NPCs). Every waypoint tile must
   * be walkable & reachable — enforced by scripts/verify-village-walk.ts.
   */
  waypoints?: { row: number; col: number }[];
  /** How long a patrolling NPC idles at each end of its route (ms). */
  pauseDurationMs?: number;
}

/**
 * Optional walking layer for a world (Aru walks the painting instead of the
 * player panning it). Purely data — the walk engine lives in world-walk.ts.
 */
export interface WorldWalkConfig {
  /**
   * Tile collision mask: one string per 64px row, one char per 64px column
   * ('#' = blocked, '.' = walkable). Dimensions must match imageSize / 64.
   */
  mask: string[];
  /** Aru's feet position on entering the world, world px. Must be walkable. */
  spawn: { x: number; y: number };
  /**
   * NPC ids that are ALLOWED to be unreachable by walk-up proximity (voices
   * from sealed buildings). Everyone else must be reachable — enforced by
   * scripts/verify-village-walk.ts.
   */
  voiceExceptions?: string[];
}

/**
 * Canonical authored collision data for a walkable world (Movement Bridge
 * PRD Task 0.1) — the JSON that the /dev/mask-editor tool reads & writes.
 * `blocked` lists [row, col] pairs; every other tile is walkable. Loaders
 * expand it into a WorldWalkConfig mask via maskFromCollisionGrid().
 */
export interface WorldCollisionGrid {
  cols: number;
  rows: number;
  tileSize: number;
  blocked: [number, number][];
}

export interface WorldConfig {
  nodeId: string;
  /** Logical size of the world painting. Width MUST be 1024 (1:1 with stage px). */
  imageSize: { w: number; h: number };
  /** Smriti's pinned dialogue for this world (config-driven so the screen stays generic). */
  lines: {
    /** Default line while roaming the world. */
    welcome: string;
    /** Shown when the player taps a locked building. */
    locked: string;
  };
  buildings: WorldBuilding[];
  npcs: WorldNpc[];
}
