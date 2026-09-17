/**
 * Headless solvability check for the Sheher Banao city builder.
 *
 * Drives the REAL scene's fixed-step update() with synthetic input along a
 * known-good waypoint route and asserts the full chain: 6 pickups, a wrong-
 * plot rejection (bundle kept in hand + HUD guidance), a street drop + SAME-
 * bundle re-pick, 6 matched placements, celebration, won=true, and a post-win
 * input freeze. No canvas involved — render() is never called.
 *
 * All harness plumbing lives in ./lib/scene-harness.ts — only the route,
 * waypoints, and scene-specific assertions live here.
 *
 * Run: pnpm --filter @workspace/bharatverse run verify:city-builder
 * Exits non-zero (with a position trace) if the level is not completable —
 * rerun this after ANY change to the level layout, radii, or movement.
 */
import { createCityBuilderScene } from '../src/game/games/city-builder-scene';
import { createHarness, makeCarryAct } from './lib/scene-harness';

// No local state type, no cast: the harness takes the state shape straight
// from the scene's debugState() signature, so a renamed or retyped field
// there breaks this checker at compile time instead of weakening it.
const scene = createCityBuilderScene({} as Record<string, HTMLImageElement>);

const h = createHarness(scene);
const act = makeCarryAct(h, {
  count: (s) => s.placed,
  total: 6,
  word: 'placed',
  rejectHint: 'Icon milao',
  dropHint: 'neeche rakh diya',
});

// Waypoint route (level px). Spawn is (672, 736) on the main street.
// Plots: ghar(352,160)(992,160)(288,608)  anaaj(800,288)  snan(480,416)  bazaar(800,608)
// Bundles: ghar(96,352)(1184,96)(672,800)  anaaj(96,736)  snan(1184,736)  bazaar(1184,416)

h.goTo(672, 800);
act('pick', 'pick ghar bundle at (10,12)');
h.goTo(672, 736);
h.goTo(736, 736);
h.goTo(736, 608);
act('reject', 'wrong plot: ghar bundle onto bazaar plot (12,9)');
h.goTo(736, 544);
h.goTo(304, 544);
act('place', 'place ghar at plot (4,9)');

h.goTo(352, 544);
h.goTo(352, 672);
h.goTo(96, 672);
h.goTo(96, 736);
act('pick', 'pick anaaj bundle at (1,11)');
h.goTo(96, 800);
h.goTo(736, 800);
h.goTo(736, 288);
act('place', 'place anaaj at plot (12,4)');

h.goTo(736, 352);
h.goTo(96, 352);
act('pick', 'pick ghar bundle at (1,5)');
h.goTo(96, 96);
h.goTo(352, 96);
act('place', 'place ghar at plot (5,2)');

h.goTo(1184, 96);
act('pick', 'pick ghar bundle at (18,1)');
h.goTo(992, 96);
act('place', 'place ghar at plot (15,2)');

h.goTo(1184, 96);
h.goTo(1184, 416);
act('pick', 'pick bazaar bundle at (18,6)');
h.goTo(1184, 608);
h.goTo(864, 608);
act('place', 'place bazaar at plot (12,9)');

h.goTo(1184, 608);
h.goTo(1184, 736);
act('pick', 'pick snan bundle at (18,11)');

// -- negative check: drop on the street, then re-pick the SAME bundle -------
// debugState().carried exposes the bundle id here, so we can prove the
// re-pick grabs the exact bundle that was set down, not some other one.
const snanId = h.state().carried;
if (snanId === null) throw new Error('snan pickup did not register a carried bundle id');
h.goTo(1184, 800);
act('drop', 'drop snan bundle on the street at (18,12)');
act('pick', 're-pick snan bundle at (18,12)');
if (h.state().carried !== snanId) {
  throw new Error(
    `re-pick grabbed a different bundle — dropped ${snanId}, now carrying ${h.state().carried ?? 'nothing'}`
  );
}
console.log(`OK same-bundle re-pick — ${snanId} set down and picked back up`);
h.goTo(480, 800);
h.goTo(480, 480);
act('place', 'place snan at plot (7,6)');

// celebration -> won
const { end, hud } = h.settleAndAssertWon('Sheher banao — 6/6');
console.log(`celebrateT=${end.celebrateT.toFixed(2)} won=${end.won}`);
console.log(`objective="${hud.objective}" hint="${hud.hint}"`);

// -- negative check: after the win the scene freezes ------------------------
h.assertFrozenAfterWin((s) => {
  if (s.placed !== 6) throw new Error('won-pause: end state drifted after extra input');
});

h.pass('city buildable');
