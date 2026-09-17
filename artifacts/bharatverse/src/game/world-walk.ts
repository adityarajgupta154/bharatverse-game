import type { Vec2 } from './engine/types';
import type {
  WorldBuilding,
  WorldCollisionGrid,
  WorldNpc,
  WorldWalkConfig,
} from './world-types';

/**
 * Village walking rules (Task: let Aru walk the village) — the PURE logic
 * shared verbatim by the screen hook (useWorldWalk) and the headless
 * reachability check (scripts/verify-village-walk.ts). No DOM, no React.
 *
 * Same conventions as the minigame scenes: 64px tiles, feet-anchored actor,
 * 14x10 half-extents collision box, speed 190 (x1.6 while Shift-running).
 */
export const WALK_TILE = 64;
export const WALK_SPEED = 190;
export const ARU_HALF_W = 14;
export const ARU_HALF_H = 10;
/** Standing within this many px of a building's hotspot rect shows the E-prompt. */
export const INTERACT_PAD = 48;
/** Walking within this many px of an NPC's anchor opens their bubble. */
export const NPC_RANGE = 120;

/** isWalkable(col,row) for moveActor — out-of-range is blocked, per engine contract. */
export function makeIsWalkable(walk: WorldWalkConfig): (col: number, row: number) => boolean {
  const rows = walk.mask;
  return (col, row) =>
    row >= 0 && row < rows.length && col >= 0 && col < rows[row].length && rows[row][col] === '.';
}

/**
 * Expand canonical collision JSON (WorldCollisionGrid) into the '#'/'.'
 * string mask everything else consumes. Throws loudly on malformed data —
 * a broken grid must never silently become "everything walkable".
 */
export function maskFromCollisionGrid(grid: WorldCollisionGrid): string[] {
  const { cols, rows, tileSize, blocked } = grid;
  if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols <= 0 || rows <= 0)
    throw new Error(`collision grid needs positive integer dims, got ${cols}x${rows}`);
  if (tileSize !== WALK_TILE)
    throw new Error(`collision grid tileSize ${tileSize} must equal the engine tile ${WALK_TILE}`);
  const cells: string[][] = Array.from({ length: rows }, () => Array<string>(cols).fill('.'));
  for (const cell of blocked) {
    const [r, c] = cell;
    if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || r >= rows || c < 0 || c >= cols)
      throw new Error(`collision grid blocked cell [${r},${c}] is outside ${rows}x${cols}`);
    cells[r][c] = '#';
  }
  return cells.map(rowCells => rowCells.join(''));
}

/**
 * The inverse — canonical JSON text for a grid, in the exact stable format
 * the repo stores (one line per art row). Used by the /dev/mask-editor
 * export so authored diffs stay reviewable.
 */
export function serializeCollisionGrid(grid: WorldCollisionGrid): string {
  const byRow = new Map<number, string[]>();
  const sorted = [...grid.blocked].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  for (const [r, c] of sorted) {
    if (!byRow.has(r)) byRow.set(r, []);
    byRow.get(r)!.push(`[${r},${c}]`);
  }
  const lines = [...byRow.keys()].sort((a, b) => a - b).map(r => '    ' + byRow.get(r)!.join(', '));
  return `{
  "cols": ${grid.cols},
  "rows": ${grid.rows},
  "tileSize": ${grid.tileSize},
  "blocked": [
${lines.join(',\n')}
  ]
}
`;
}

/** Chebyshev-style distance from a point to a building's hotspot rect (0 = inside). */
export function distanceToBuilding(pos: Vec2, b: WorldBuilding): number {
  const left = b.position.x - b.hotspot.w / 2;
  const right = b.position.x + b.hotspot.w / 2;
  const top = b.position.y - b.hotspot.h / 2;
  const bottom = b.position.y + b.hotspot.h / 2;
  const dx = Math.max(left - pos.x, 0, pos.x - right);
  const dy = Math.max(top - pos.y, 0, pos.y - bottom);
  return Math.max(dx, dy);
}

/** The building Aru would enter with E right now — nearest hotspot within INTERACT_PAD. */
export function nearestPromptBuilding(
  pos: Vec2,
  buildings: WorldBuilding[]
): WorldBuilding | null {
  let best: WorldBuilding | null = null;
  let bestD = Infinity;
  for (const b of buildings) {
    const d = distanceToBuilding(pos, b);
    if (d <= INTERACT_PAD && d < bestD) {
      best = b;
      bestD = d;
    }
  }
  return best;
}

/**
 * Canvas walk mode's E-prompt target (Movement Bridge Task 5) — nearest
 * building whose authored anchorTile CENTER is within interactionRadius
 * (in tiles). This is the data model the world-data validator proves
 * walkable, so a prompted doorway is always actually reachable. The DOM
 * fallback renderer keeps the older hotspot-rect INTERACT_PAD rule above.
 * Buildings without an anchorTile (non-walk regions) never prompt.
 */
export function nearestAnchorBuilding(
  pos: Vec2,
  buildings: WorldBuilding[]
): WorldBuilding | null {
  let best: WorldBuilding | null = null;
  let bestD = Infinity;
  for (const b of buildings) {
    if (!b.anchorTile) continue;
    const cx = b.anchorTile.col * WALK_TILE + WALK_TILE / 2;
    const cy = b.anchorTile.row * WALK_TILE + WALK_TILE / 2;
    const d = Math.hypot(cx - pos.x, cy - pos.y);
    if (d <= (b.interactionRadius ?? 1.5) * WALK_TILE && d < bestD) {
      best = b;
      bestD = d;
    }
  }
  return best;
}

/** The NPC whose bubble proximity opens — nearest anchor within NPC_RANGE. */
export function nearestVoiceNpc(pos: Vec2, npcs: WorldNpc[]): WorldNpc | null {
  let best: WorldNpc | null = null;
  let bestD = Infinity;
  for (const n of npcs) {
    const d = Math.hypot(n.position.x - pos.x, n.position.y - pos.y);
    if (d <= NPC_RANGE && d < bestD) {
      best = n;
      bestD = d;
    }
  }
  return best;
}

/** BFS over walkable tiles from the spawn — the set Aru can actually reach. */
export function reachableTiles(walk: WorldWalkConfig): boolean[][] {
  const rows = walk.mask.length;
  const cols = walk.mask[0]?.length ?? 0;
  const isWalkable = makeIsWalkable(walk);
  const seen: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const startCol = Math.floor(walk.spawn.x / WALK_TILE);
  const startRow = Math.floor(walk.spawn.y / WALK_TILE);
  if (!isWalkable(startCol, startRow)) return seen;
  const queue: [number, number][] = [[startCol, startRow]];
  seen[startRow][startCol] = true;
  while (queue.length) {
    const [c, r] = queue.shift()!;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nc = c + dc;
      const nr = r + dr;
      if (isWalkable(nc, nr) && !seen[nr][nc]) {
        seen[nr][nc] = true;
        queue.push([nc, nr]);
      }
    }
  }
  return seen;
}

/** Center of a tile in world px — proximity checks measure from here. */
export function tileCenter(col: number, row: number): Vec2 {
  return { x: col * WALK_TILE + WALK_TILE / 2, y: row * WALK_TILE + WALK_TILE / 2 };
}

// ---------------------------------------------------------------------------
// NPC patrol (Movement Bridge PRD Task 7)
// ---------------------------------------------------------------------------

/** Patrol walking speed (px/s) — slower than Aru's WALK_SPEED so villagers amble. */
export const NPC_PATROL_SPEED = 60;
/** End-of-route dwell when npcs.json omits pauseDurationMs. */
export const DEFAULT_PATROL_PAUSE_MS = 2200;
/** Per-mover extra first-departure delay so patrols never start in unison. */
export const PATROL_STAGGER_MS = 900;

export interface NpcPatrolState {
  pos: Vec2;
  facing: 1 | -1;
  moving: boolean;
  /** Px walked along the CURRENT leg — resets whenever a new leg starts
   *  (home departure, waypoint arrival, reversal or bounce). */
  legTravelled: number;
  /** Px left to the current leg's target — 0 while dwelling/at rest. */
  legRemaining: number;
}

// ---------------------------------------------------------------------------
// Procedural gait (Task: real footsteps instead of gliding)
// ---------------------------------------------------------------------------

/** One footstep per this many px of ground covered (~2.3 steps/s at 60px/s). */
export const GAIT_STRIDE_PX = 26;
/** Peak upward bob — small enough to read as walking, not bouncing. */
export const GAIT_BOB_PX = 1.6;
/** Peak sway tilt (rad, ≈1.7°) — alternates sides every footstep. */
export const GAIT_TILT_RAD = 0.03;
/** Amplitude eases in/out within this many px of a leg's endpoints. */
export const GAIT_TAPER_PX = 12;

export interface NpcGait {
  /** Vertical draw offset in px (≤0 — the figure lifts at mid-step). */
  bob: number;
  /** Feet-pivot sway in rad (sign alternates each footstep). */
  tilt: number;
}

/**
 * The distance-driven walk wobble for one mover — same philosophy as Aru's
 * distance-driven rig: the phase advances only with ground actually covered,
 * so a resting mover ALWAYS reads exactly {0,0} (the frozen goldens capture
 * homes byte-identically by construction), and the taper envelope lands the
 * figure softly at each waypoint instead of popping mid-swing. Pure — the
 * canvas draw and the headless verify script share this exact function.
 */
export function patrolGait(s: NpcPatrolState): NpcGait {
  if (!s.moving) return { bob: 0, tilt: 0 };
  const envelope = Math.min(1, s.legTravelled / GAIT_TAPER_PX, s.legRemaining / GAIT_TAPER_PX);
  if (envelope <= 0) return { bob: 0, tilt: 0 };
  const phase = (s.legTravelled / GAIT_STRIDE_PX) * Math.PI; // π per footstep
  return {
    bob: -Math.abs(Math.sin(phase)) * GAIT_BOB_PX * envelope,
    tilt: Math.sin(phase) * GAIT_TILT_RAD * envelope,
  };
}

export interface NpcPatrol {
  readonly npc: WorldNpc;
  /**
   * Advance the state machine by dt SECONDS (scene fixed-step). While
   * `engage` is set (Aru's feet in world px — the scene passes it while
   * this mover's voice bubble is open) the machine HOLDS instead of
   * advancing: position, leg progress and dwell countdown all freeze and
   * the facing turns toward the engager, so a villager mid-conversation
   * stops and looks at Aru instead of strolling away. Passing null/omitting
   * it resumes the route exactly where it paused.
   */
  tick(dt: number, engage?: Vec2 | null): void;
  state(): NpcPatrolState;
}

/**
 * Build the idle → walk-to-next-waypoint → idle → reverse machine for one
 * NPC, or null for statics (no waypoints — intentional per PRD A.3.4).
 * Route = painted home position, then each waypoint's tile center; at either
 * route end the NPC dwells pauseDurationMs and retraces. `moverIndex`
 * staggers the FIRST departure (pause + index·PATROL_STAGGER_MS) so movers
 * stay out of phase instead of marching in unison.
 *
 * Collision: authored waypoints are validated walkable (world-validate) and
 * the whole open grid is connectivity-proven (verify-village-walk), so
 * straight segments stay on open tiles. The per-step guard below is a
 * belt-and-braces runtime bounce: if data ever drifts so a step would enter
 * a blocked tile, the NPC turns around instead of clipping into walls.
 *
 * `initialFacing` is a dev/e2e golden hook (?moverface=…): facing normally
 * flips only while the machine ticks a leftward leg, and the golden freeze
 * forbids ticking — pinning it at creation is the only way a frozen scene
 * can show the mirrored draw path. Gameplay always uses the default 1 (the
 * cut sprites' natural right facing).
 */
export function createNpcPatrol(
  npc: WorldNpc,
  isWalkable: (col: number, row: number) => boolean,
  moverIndex: number,
  initialFacing: 1 | -1 = 1
): NpcPatrol | null {
  const wps = npc.waypoints ?? [];
  if (wps.length === 0) return null;
  const points: Vec2[] = [{ ...npc.position }, ...wps.map(w => tileCenter(w.col, w.row))];
  const pause = (npc.pauseDurationMs ?? DEFAULT_PATROL_PAUSE_MS) / 1000;

  let at = 0; // index of the last reached route point
  let dir: 1 | -1 = 1;
  let pos: Vec2 = { ...points[0] };
  let facing: 1 | -1 = initialFacing;
  let moving = false;
  let wait = pause + (moverIndex * PATROL_STAGGER_MS) / 1000;
  let legTravelled = 0;
  let legRemaining = 0;

  return {
    npc,
    tick(dt: number, engage?: Vec2 | null) {
      if (engage) {
        // Conversation hold (voice bubble open): freeze the WHOLE machine —
        // same shape as the blocked-at-home hold below, nothing structural
        // mutates — and face the engager. dx === 0 keeps the current facing
        // instead of picking a side arbitrarily. The dwell countdown pauses
        // too, so a long chat never silently eats a route-end dwell.
        if (engage.x !== pos.x) facing = engage.x < pos.x ? -1 : 1;
        moving = false;
        return;
      }
      if (wait > 0) {
        wait -= dt;
        moving = false;
        return;
      }
      const target = points[at + dir];
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.hypot(dx, dy);
      if (dx !== 0) facing = dx < 0 ? -1 : 1;
      moving = true;
      const step = NPC_PATROL_SPEED * dt;
      if (dist <= step) {
        pos = { ...target };
        legTravelled = 0;
        legRemaining = 0;
        at += dir;
        if (at === 0 || at === points.length - 1) {
          dir = dir === 1 ? -1 : 1;
          wait = pause;
          moving = false;
        }
        return;
      }
      const nx = pos.x + (dx / dist) * step;
      const ny = pos.y + (dy / dist) * step;
      if (!isWalkable(Math.floor(nx / WALK_TILE), Math.floor(ny / WALK_TILE))) {
        // Bounce = retrace toward the previous route point — but ONLY if one
        // exists. At a route END (e.g. blocked first leg out of home after
        // data drift) reversing would target points[-1]; hold direction
        // instead and retry the same leg after the pause, so the NPC waits
        // in place and recovers by itself if the blockage clears.
        const back = at + (dir === 1 ? -1 : 1);
        if (back >= 0 && back < points.length) dir = dir === 1 ? -1 : 1;
        wait = pause;
        moving = false;
        legTravelled = 0;
        legRemaining = 0;
        return;
      }
      pos = { x: nx, y: ny };
      legTravelled += step;
      legRemaining = dist - step;
    },
    state(): NpcPatrolState {
      return { pos: { ...pos }, facing, moving, legTravelled, legRemaining };
    },
  };
}
