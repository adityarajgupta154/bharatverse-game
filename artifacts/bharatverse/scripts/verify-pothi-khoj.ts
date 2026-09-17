/**
 * Headless solvability check for the Pothi Khoj library game: 6 pothis onto
 * their subject shelves, plus wrong-shelf rejection, floor drop + same-pothi
 * re-pick, and the post-win input freeze.
 *
 * All harness plumbing lives in ./lib/scene-harness.ts — only the route,
 * waypoints, and scene-specific assertions live here.
 *
 * Run: pnpm --filter @workspace/bharatverse run verify:pothi-khoj
 */
import { createPothiKhojScene } from '../src/game/games/pothi-khoj-scene';
import { createHarness, makeCarryAct } from './lib/scene-harness';

// No local state type, no cast: the harness takes the state shape straight
// from the scene's debugState() signature, so a renamed or retyped field
// there breaks this checker at compile time instead of weakening it.
const scene = createPothiKhojScene({} as Record<string, HTMLImageElement>);

const h = createHarness(scene);
const act = makeCarryAct(h, {
  count: (s) => s.shelved,
  total: 6,
  word: 'shelved',
  rejectHint: 'Icon milao',
  dropHint: 'neeche rakh di',
});

// Pick ganit at (12,11), reject at jyotish shelf, drop and re-pick, then shelf it.
h.goTo(800, 736);
act('pick', 'pick ganit pothi 1');
h.goTo(800, 352);
h.goTo(928, 352);
h.goTo(928, 224);
h.goTo(1056, 224);
act('reject', 'wrong jyotish shelf');
h.goTo(928, 224);
h.goTo(928, 352);
h.goTo(864, 352);
act('drop', 'floor drop ganit');
act('pick', 're-pick ganit');
// The seam exposes the carried SUBJECT; no other ground pothi is anywhere
// near the drop tile, so subject equality proves the same pothi came back.
if (h.state().carried !== 'ganit') {
  throw new Error(`re-pick grabbed ${h.state().carried ?? 'nothing'}, expected the dropped ganit pothi`);
}
h.goTo(672, 352);
h.goTo(672, 224);
act('place', 'shelf ganit pothi 1');

h.goTo(608, 224);
h.goTo(608, 416);
act('pick', 'pick ganit pothi 2');
h.goTo(672, 416);
h.goTo(672, 224);
act('place', 'shelf ganit pothi 2');

h.goTo(608, 224);
h.goTo(416, 224);
h.goTo(416, 736);
act('pick', 'pick ayurveda pothi 1');
h.goTo(288, 736);
h.goTo(288, 224);
act('place', 'shelf ayurveda pothi 1');

h.goTo(224, 224);
h.goTo(224, 480);
h.goTo(160, 480);
act('pick', 'pick ayurveda pothi 2');
h.goTo(224, 480);
h.goTo(224, 224);
h.goTo(288, 224);
act('place', 'shelf ayurveda pothi 2');

h.goTo(288, 224);
h.goTo(928, 224);
h.goTo(928, 352);
act('pick', 'pick jyotish pothi 1');
h.goTo(1056, 352);
h.goTo(1056, 224);
act('place', 'shelf jyotish pothi 1');

h.goTo(1120, 224);
h.goTo(1120, 480);
act('pick', 'pick jyotish pothi 2');
h.goTo(1056, 480);
h.goTo(1056, 224);
act('place', 'shelf jyotish pothi 2');

// celebration -> won
h.settleAndAssertWon('Pothiyan rakho — 6/6');

// -- negative check: after the win the scene freezes ------------------------
h.assertFrozenAfterWin((s) => {
  if (s.shelved !== 6) throw new Error('won-pause: end state drifted after extra input');
});

h.pass('pothi khoj solvable');
