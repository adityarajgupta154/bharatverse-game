/**
 * Headless solvability check for the Rangoli Rang courtyard game: 6 color
 * pots poured in laal → peela → neela order, plus an out-of-order rejection,
 * an open-floor drop + same-pot re-pick, and the post-win input freeze.
 *
 * All harness plumbing lives in ./lib/scene-harness.ts — only the route,
 * waypoints, and scene-specific assertions live here.
 *
 * Run: pnpm --filter @workspace/bharatverse run verify:rangoli-rang
 */
import { createRangoliRangScene } from '../src/game/games/rangoli-rang-scene';
import { createHarness, makeCarryAct } from './lib/scene-harness';

// No local state type, no cast: the harness takes the state shape straight
// from the scene's debugState() signature, so a renamed or retyped field
// there breaks this checker at compile time instead of weakening it.
const scene = createRangoliRangScene({} as Record<string, HTMLImageElement>);

const h = createHarness(scene);
const act = makeCarryAct(h, {
  count: (s) => s.poured,
  total: 6,
  word: 'poured',
  rejectHint: 'Pehle',
  dropHint: 'yahin rakh diya',
});

h.goTo(1056, 736);
act('pick', 'pick first laal');
h.goTo(672, 544);
act('place', 'pour first laal');

h.goTo(224, 544);
h.goTo(224, 224);
act('pick', 'pick second laal');
h.goTo(672, 224);
h.goTo(672, 544);
act('place', 'pour second laal');

h.goTo(928, 544);
h.goTo(928, 800);
act('pick', 'pick neela early');
h.goTo(672, 800);
h.goTo(672, 544);
act('reject', 'reject neela before peela');
const droppedColor = h.state().carried;
if (droppedColor !== 'neela') {
  throw new Error(`expected to be carrying neela, got ${droppedColor ?? 'nothing'}`);
}
h.goTo(800, 544);
h.goTo(800, 608);
act('drop', 'put neela down on open floor');

h.goTo(1056, 608);
h.goTo(1056, 224);
act('pick', 'pick first peela');
h.goTo(672, 224);
h.goTo(672, 544);
act('place', 'pour first peela');

h.goTo(224, 544);
h.goTo(224, 736);
act('pick', 'pick second peela');
h.goTo(672, 736);
h.goTo(672, 544);
act('place', 'pour second peela');

h.goTo(800, 544);
h.goTo(800, 608);
act('pick', 're-pick dropped neela');
// The seam exposes the carried COLOR; the other neela pot sits far across the
// aangan, so color equality at the drop tile proves the same pot came back.
if (h.state().carried !== droppedColor) {
  throw new Error(
    `re-pick grabbed ${h.state().carried ?? 'nothing'}, expected the dropped ${droppedColor} pot`
  );
}
h.goTo(672, 608);
h.goTo(672, 544);
act('place', 'pour first neela');

h.goTo(416, 544);
h.goTo(416, 160);
act('pick', 'pick second neela');
h.goTo(672, 160);
h.goTo(672, 544);
act('place', 'pour second neela');

// celebration -> won
h.settleAndAssertWon('Rangoli bharo — 6/6');

// -- negative check: after the win the scene freezes ------------------------
h.assertFrozenAfterWin((s) => {
  if (s.poured !== 6) throw new Error('won-pause: end state drifted after extra input');
});

h.pass('rangoli completable');
