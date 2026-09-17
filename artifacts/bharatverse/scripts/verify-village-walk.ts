/**
 * Headless reachability check for village walking (Task: Aru walks the
 * village). Proves — with the SAME functions the screen uses — that from the
 * spawn tile Aru can actually reach:
 *   - every building (some reachable tile center within INTERACT_PAD of its
 *     hotspot rect → the E-prompt appears there), and
 *   - every NPC (some reachable tile center within NPC_RANGE of its anchor →
 *     the proximity bubble opens), except ids listed in walk.voiceExceptions.
 *
 * Run: pnpm verify:village-walk   (part of the verify:games chain)
 */
import { WORLD_DATA as SINDHU } from '../src/game/worlds/sindhu-ghati/config';
import {
  INTERACT_PAD,
  NPC_RANGE,
  WALK_TILE,
  distanceToBuilding,
  makeIsWalkable,
  reachableTiles,
  tileCenter,
} from '../src/game/world-walk';

// Checked load (world-data task): the region's config.ts shape-validated the
// JSONs at import — no casts, schema drift dies loudly before this runs.
const { buildings, npcs } = SINDHU.config;
const walk = SINDHU.walk;
if (!walk) throw new Error('sindhu-ghati must ship a walk config');

let pass = 0;
let fail = 0;
function check(ok: boolean, label: string) {
  if (ok) {
    pass++;
    console.log(`  PASS ${label}`);
  } else {
    fail++;
    console.log(`  FAIL ${label}`);
  }
}

console.log('verify-village-walk: sindhu-ghati');

// --- mask sanity (mirrors the dev-only defineWorld guard, but runs in CI) ---
const ROWS = SINDHU.config.imageSize.h / WALK_TILE;
const COLS = SINDHU.config.imageSize.w / WALK_TILE;
check(walk.mask.length === ROWS, `mask has ${ROWS} rows`);
check(
  walk.mask.every(r => r.length === COLS && !/[^#.]/.test(r)),
  `every row has ${COLS} cols of '#'/'.'`
);
const isWalkable = makeIsWalkable(walk);
check(
  isWalkable(Math.floor(walk.spawn.x / WALK_TILE), Math.floor(walk.spawn.y / WALK_TILE)),
  `spawn (${walk.spawn.x},${walk.spawn.y}) is walkable`
);
for (const id of walk.voiceExceptions ?? []) {
  check(npcs.some(n => n.id === id), `voiceException "${id}" is a real npc`);
}

// --- BFS from spawn ---
const seen = reachableTiles(walk);
const reachable: { x: number; y: number }[] = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (seen[r][c]) reachable.push(tileCenter(c, r));
  }
}
const open = walk.mask.join('').split('').filter(ch => ch === '.').length;
check(reachable.length === open, `all ${open} walkable tiles connect to the spawn (got ${reachable.length})`);

// --- every building prompts somewhere reachable ---
for (const b of buildings) {
  const ok = reachable.some(t => distanceToBuilding(t, b) <= INTERACT_PAD);
  check(ok, `building "${b.id}" reachable (E-prompt within ${INTERACT_PAD}px of a tile)`);
}

// --- every NPC speaks when walked up to (minus documented voices) ---
const exceptions = new Set(walk.voiceExceptions ?? []);
for (const n of npcs) {
  if (exceptions.has(n.id)) {
    console.log(`  SKIP npc "${n.id}" — documented voiceException`);
    continue;
  }
  const ok = reachable.some(
    t => Math.hypot(t.x - n.position.x, t.y - n.position.y) <= NPC_RANGE
  );
  check(ok, `npc "${n.id}" reachable (bubble within ${NPC_RANGE}px of a tile)`);
}

console.log(`\nverify-village-walk: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
