/**
 * Headless solvability check for the Naali Paheli drain puzzle.
 *
 * Drives the REAL scene's fixed-step update() with synthetic input along a
 * known-good waypoint route and asserts the full win chain: 5 pickups, 5
 * placements (shape-matched), water flow, won=true. No canvas involved —
 * render() is never called, so it runs in plain Node.
 *
 * Also asserts the guard rails kids rely on:
 *  - wrong-shape placement is REJECTED (piece stays in hand + feedback),
 *  - a carried piece can be set down away from gaps and re-picked,
 *  - after the win the scene freezes (no movement, no further actions).
 *
 * All harness plumbing (input stub, walker, budgets, act assertions, freeze
 * probe) lives in ./lib/scene-harness.ts — only the route, waypoints, and
 * scene-specific assertions live here.
 *
 * Run: pnpm --filter @workspace/bharatverse run verify:drain-puzzle
 * Exits non-zero (with a position trace) if the level is not completable —
 * rerun this after ANY change to the level layout, radii, or movement.
 */
import { createDrainPuzzleScene } from '../src/game/games/drain-puzzle-scene';
import { createHarness, makeCarryAct } from './lib/scene-harness';

// No local state type, no cast: the harness takes the state shape straight
// from the scene's debugState() signature, so a renamed or retyped field
// there breaks this checker at compile time instead of weakening it.
const scene = createDrainPuzzleScene({} as Record<string, HTMLImageElement>);

const h = createHarness(scene);
const act = makeCarryAct(h, {
  count: (s) => s.placed,
  total: 5,
  word: 'placed',
  rejectHint: 'muda (L) tukda chahiye',
  dropHint: 'neeche rakh diya',
});

// Waypoint route (level px). Legs use axis-clear lanes; see the level layout
// in drain-puzzle-scene.ts. Spawn is (160, 736).
h.goTo(160, 480);
act('pick', 'pick straight #1 at (2,7)');
h.goTo(483, 480);

// -- negative check: wrong shape must be rejected ---------------------------
// Carry the STRAIGHT piece next to the CORNER gap (8,8) (center 544,544;
// (483,542) is ~61px away, inside PLACE_RADIUS=72): the scene must refuse,
// keep the piece in hand, and explain what's needed.
h.goTo(483, 542);
act('reject', 'wrong shape: straight refused at corner gap (8,8)');

h.goTo(483, 352);
act('place', 'place straight in gap (8,5)');

h.goTo(483, 542);
h.goTo(354, 542);
h.goTo(354, 800);
act('pick', 'pick corner #1 at (5,12)');

// -- negative check: drop away from any gap, then pick it back up -----------
// No gap is within PLACE_RADIUS of (5,12), so the action sets the piece down
// on the street tile under Aru; a second press must pick it back up.
act('drop', 'set corner down on the street at (5,12)');
act('pick', 're-pick corner at (5,12)');

h.goTo(545, 800);
h.goTo(545, 586);
act('place', 'place corner in gap (8,8)');

h.goTo(545, 719);
h.goTo(78, 719);
h.goTo(78, 74);
h.goTo(832, 74);
h.goTo(860, 74);
h.goTo(860, 160);
act('pick', 'pick straight #2 at (13,2)');
h.goTo(860, 74);
h.goTo(352, 74);
h.goTo(352, 117);
act('place', 'place straight in gap (5,2)');

h.goTo(352, 80);
h.goTo(672, 80);
h.goTo(672, 244);
h.goTo(615, 244);
h.goTo(615, 416);
h.goTo(670, 416);
act('pick', 'pick corner #2 at (10,6)');
h.goTo(615, 416);
h.goTo(615, 160);
h.goTo(591, 160);
act('place', 'place corner in gap (8,2)');

h.goTo(591, 80);
h.goTo(78, 80);
h.goTo(78, 719);
h.goTo(689, 719);
h.goTo(689, 608);
h.goTo(920, 608);
h.goTo(920, 800);
act('pick', 'pick straight #3 at (14,12)');
h.goTo(920, 586);
h.goTo(800, 586);
act('place', 'place straight in gap (12,8)');

// water flow -> won
const { end, hud } = h.settleAndAssertWon('Naali jodo — 5/5');
console.log(`waterT=${end.waterT.toFixed(2)} won=${end.won}`);
console.log(`objective="${hud.objective}" hint="${hud.hint}"`);

// -- negative check: after the win the scene freezes ------------------------
h.assertFrozenAfterWin((s) => {
  if (s.placed !== 5) throw new Error('won-pause: end state drifted after extra input');
});

h.pass('puzzle completable');
