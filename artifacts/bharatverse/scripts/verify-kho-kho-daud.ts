/**
 * Headless solvability check for the Kho-Kho Daud pole run: tag all 8 poles
 * in order with a real weave (alternating north/south approaches), plus the
 * guard rails — out-of-order and re-tag presses are rejected — and the
 * post-win input freeze.
 *
 * All harness plumbing lives in ./lib/scene-harness.ts — only the route,
 * waypoints, and scene-specific assertions (tag counting) live here.
 *
 * Run: pnpm --filter @workspace/bharatverse run verify:kho-kho-daud
 */
import { createKhoKhoDaudScene } from '../src/game/games/kho-kho-daud-scene';
import { createHarness } from './lib/scene-harness';

// No local state type, no cast: the harness takes the state shape straight
// from the scene's debugState() signature, so a renamed or retyped field
// there breaks this checker at compile time instead of weakening it.
const scene = createKhoKhoDaudScene({} as Record<string, HTMLImageElement>);

const h = createHarness(scene);

function act(expected: number, label: string) {
  const { after } = h.press();
  if (after.tagged !== expected) {
    throw new Error(`${label}: expected tagged=${expected}, got ${after.tagged}`);
  }
  console.log(`OK ${label} — tagged ${after.tagged}/8`);
}

// Out-of-order attempt at pole 6 from below.
h.goTo(864, 544);
act(0, 'reject pole 6 out of order');
// 'Abhi isse nahi…' distinguishes a true out-of-order rejection from the
// generic "no pole in reach" line (both mention the chamakta khamba).
h.expectHint('Abhi isse nahi', 'out-of-order rejection');

// Alternating north/south approaches force a real weave around every solid pole.
h.goTo(224, 544);
act(1, 'tag pole 1 from south');

// -- negative check: an already-tagged pole cannot be tagged again ----------
act(1, 're-tag pole 1 rejected (count stays 1)');
h.expectHint('Abhi isse nahi', 're-tag rejection');

h.goTo(288, 544);
h.goTo(288, 416);
h.goTo(352, 416);
act(2, 'tag pole 2 from north');
h.goTo(416, 416);
h.goTo(416, 544);
h.goTo(480, 544);
act(3, 'tag pole 3 from south');
h.goTo(544, 544);
h.goTo(544, 416);
h.goTo(608, 416);
act(4, 'tag pole 4 from north');
h.goTo(672, 416);
h.goTo(672, 544);
h.goTo(736, 544);
act(5, 'tag pole 5 from south');
h.goTo(800, 544);
h.goTo(800, 416);
h.goTo(864, 416);
act(6, 'tag pole 6 from north');
h.goTo(928, 416);
h.goTo(928, 544);
h.goTo(992, 544);
act(7, 'tag pole 7 from south');
h.goTo(1056, 544);
h.goTo(1056, 416);
h.goTo(1120, 416);
act(8, 'tag pole 8 from north');

// celebration -> won
h.settleAndAssertWon('Khambe chhuo — 8/8');

// -- negative check: after the win the scene freezes ------------------------
h.assertFrozenAfterWin((s) => {
  if (s.tagged !== 8) throw new Error('won-pause: end state drifted after extra input');
});

h.pass('kho-kho daud solvable');
