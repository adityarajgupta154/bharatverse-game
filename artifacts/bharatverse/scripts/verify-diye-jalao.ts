/**
 * Headless solvability check for the Diye Jalao courtyard game: carry the
 * jyot flame to all 6 diyas, plus the guard rails — no lighting without a
 * flame, no double-take at the jyot, the flame survives an open-floor press,
 * and the post-win input freeze.
 *
 * All harness plumbing lives in ./lib/scene-harness.ts — only the route,
 * waypoints, and scene-specific assertions (flame carry semantics) live here.
 *
 * Run: pnpm --filter @workspace/bharatverse run verify:diye-jalao
 */
import { createDiyeJalaoScene } from '../src/game/games/diye-jalao-scene';
import { createHarness } from './lib/scene-harness';

// No local state type, no cast: the harness takes the state shape straight
// from the scene's debugState() signature, so a renamed or retyped field
// there breaks this checker at compile time instead of weakening it.
const scene = createDiyeJalaoScene({} as Record<string, HTMLImageElement>);

const h = createHarness(scene);

function takeFlame(label: string) {
  h.goTo(736, 480);
  h.goTo(672, 480);
  const { before, after } = h.press();
  if (before.carryingFlame || !after.carryingFlame) throw new Error(`${label}: failed to take flame`);
  console.log(`OK ${label} — lit ${after.lit}/6`);
}

function lightAt(x: number, y: number, label: string) {
  h.goTo(x, y);
  const { before, after } = h.press();
  if (after.lit !== before.lit + 1) throw new Error(`${label}: diya did not light — ${h.hud().hint}`);
  if (after.carryingFlame) throw new Error(`${label}: flame was not consumed`);
  console.log(`OK ${label} — lit ${after.lit}/6`);
}

// -- negative check: a diya press without a flame must be rejected ----------
h.goTo(224, 672);
{
  const { before, after } = h.press();
  if (after.lit !== 0 || before.lit !== 0) throw new Error('unlit diya accepted without flame');
  if (after.carryingFlame) throw new Error('no-flame press somehow granted a flame');
  h.expectHint('Pehle jyot', 'no-flame press');
  console.log('OK reject diya without flame');
}

takeFlame('take flame 1');

// -- negative check: jyot press while already carrying keeps ONE flame ------
{
  const { before, after } = h.press();
  if (!before.carryingFlame || !after.carryingFlame) throw new Error('double-take: flame was lost at the jyot');
  if (after.lit !== before.lit) throw new Error('double-take: lit count changed at the jyot');
  h.expectHint('Lau tumhare saath hai', 'double-take');
  console.log('OK double-take rejected — jyot press while carrying keeps one flame');
}

// -- negative check: an open-floor press must not drop the flame ------------
h.goTo(800, 544);
{
  const { before, after } = h.press();
  if (!before.carryingFlame || !after.carryingFlame) throw new Error('open-floor action dropped the flame');
  h.expectHint('diye tak', 'open-floor press');
}
lightAt(224, 672, 'light diya at (3,10)');

takeFlame('take flame 2');
lightAt(1056, 672, 'light diya at (16,10)');

takeFlame('take flame 3');
h.goTo(736, 224);
lightAt(224, 224, 'light diya at (3,3)');

takeFlame('take flame 4');
h.goTo(736, 224);
lightAt(1056, 224, 'light diya at (16,3)');

takeFlame('take flame 5');
h.goTo(672, 736);
lightAt(480, 800, 'light diya at (7,12)');

takeFlame('take flame 6');
h.goTo(672, 736);
lightAt(864, 800, 'light diya at (13,12)');

// celebration -> won
h.settleAndAssertWon('Diye jalao — 6/6');

// -- negative check: after the win the scene freezes ------------------------
h.assertFrozenAfterWin((s) => {
  if (s.lit !== 6) throw new Error('won-pause: end state drifted after extra input');
});

h.pass('diya courtyard completable');
