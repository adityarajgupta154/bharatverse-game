import { expect, test, type Page } from '@playwright/test';

/**
 * Pixel goldens for Aru's 5-piece walking rig on the village canvas — the
 * guard the rig code review asked for: a bad edit to piece pivots, draw
 * order, or the cut PNGs must fail HERE instead of shipping silently (the
 * headless checks cover phase/blend/camera math, never the drawn pixels).
 *
 * Deterministic by construction, not by settling:
 *  - ?rigfreeze=phase,blend,run,facing pins the rig pose at scene creation
 *    and turns update() into a no-op — no idle sway, no patrol movers, no
 *    camera easing, scene time frozen at 0 from the very first frame.
 *  - ?spawn drops Aru on a fixed walkable tile in the gate corridor, far
 *    from NPC bubbles, building prompts and HUD chrome.
 *  - reduced motion removes the rift entry veil, the world-enter animation
 *    and the ambient NPC bubble cycle.
 *  - 1024x592 viewport = stage scale 1, so world px map 1:1 to page px.
 *
 * Each shot is a tight crop around Aru (not the whole canvas) so the diff
 * budget stays rig-sized, and it is captured at deviceScaleFactor 3: the
 * pieces draw at ~3x on the canvas backing store, so a sub-CSS-pixel limb
 * shift (a small pivot nudge rotates the piece about a point less than a
 * screen px away) still lands as whole diffed device pixels instead of
 * vanishing into anti-aliasing at scale 1.
 *
 * Goldens live in aru-rig-shots.spec.ts-snapshots/ (committed, like the
 * time-rift golden). After a DELIBERATE visual change to the rig art or
 * pose math, regenerate with:
 *   pnpm exec playwright test tests/aru-rig-shots.spec.ts --update-snapshots
 * and eyeball the new crops before committing them.
 */

// 3x backing store for rig-sized sensitivity (see header). The viewport is
// still 1024x592 CSS px = stage scale 1; only capture density rises.
test.use({ deviceScaleFactor: 3 });

/** Gate-corridor tile (col 8, row 18) — walkable, camera unclamped, and no
 *  NPC/building/HUD overlay reaches the crop. */
const SPAWN = { x: 512, y: 1180 };

/** Crop around Aru's feet: the sprite is ~40x84, plus swing + bob + shadow. */
const CROP = { halfW: 70, up: 100, down: 20 };

/**
 * Measured on this setup (frozen scene, DSF-3 device-pixel capture):
 *  - run-to-run noise is ZERO — repeated captures are byte-identical
 *    (hash-compared), because nothing in the scene advances;
 *  - a deliberate legL pivot nudge of 8 frame px (158→166) scores 327-461
 *    diff pixels on the three moving-pose goldens.
 * 80 therefore has real headroom over noise while sitting ~4x below the
 * smallest signal a genuine rig mistake produced. NOTE: the idle golden
 * cannot catch LIMB-PIVOT nudges — at rest every angle is ≈0, and a pivot
 * only matters when its piece rotates. The stride/run/left goldens are the
 * pivot guards; idle guards the rest recomposition, bob and the cut art.
 */
const MAX_DIFF_PIXELS = 80;
const THRESHOLD = 0.1;

async function openFrozenVillage(page: Page, rigfreeze: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1024, height: 592 });
  await page.goto(`/world/sindhu-ghati?spawn=${SPAWN.x},${SPAWN.y}&rigfreeze=${rigfreeze}`);

  // The scene mirrors its frozen state once images are decoded and the
  // first frame has rendered — that mirror IS the readiness signal.
  await page.waitForFunction(() => {
    const w = (window as { __bhvWalk?: { renderer?: string } }).__bhvWalk;
    return w?.renderer === 'canvas';
  });
  // Two more frames so the canvas backing store definitely holds the frozen
  // draw (the mirror is written in the same rAF that paints).
  await page.evaluate(
    () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  );

  const st = await page.evaluate(
    () => (window as unknown as { __bhvWalk: { x: number; y: number; camY: number } }).__bhvWalk
  );
  const box = await page.getByTestId('village-canvas').boundingBox();
  if (!box) throw new Error('village canvas has no bounding box');
  const scale = box.width / 1024; // 1 at the pinned viewport, kept honest
  return {
    clip: {
      x: box.x + (st.x - CROP.halfW) * scale,
      y: box.y + (st.y - st.camY - CROP.up) * scale,
      width: (CROP.halfW * 2) * scale,
      height: (CROP.up + CROP.down) * scale,
    },
  };
}

// phase π/2 → sin = 1: legs/arms at full swing, torso at the bob's deepest
// dip — the most shape-revealing point of the stride cycle.
const MID_STRIDE = (Math.PI / 2).toFixed(4);

for (const shot of [
  {
    name: 'aru-idle',
    rigfreeze: '0,0,0,1',
    what: 'at rest — idle sway at its zero-phase point, all limbs near neutral',
  },
  {
    name: 'aru-walk-stride',
    rigfreeze: `${MID_STRIDE},1,0,1`,
    what: 'mid-stride walk — full contralateral swing, torso dipped',
  },
  {
    name: 'aru-run',
    rigfreeze: `${MID_STRIDE},1,1,1`,
    what: 'run — same phase, amplitudes and bob raised by the run multipliers',
  },
  {
    name: 'aru-walk-left',
    rigfreeze: `${MID_STRIDE},1,0,-1`,
    what: 'left-facing mid-stride — the whole rig mirrored about the feet anchor',
  },
]) {
  test(`rig golden: ${shot.what}`, async ({ page }) => {
    const { clip } = await openFrozenVillage(page, shot.rigfreeze);
    await expect(page).toHaveScreenshot(`${shot.name}.png`, {
      clip,
      maxDiffPixels: MAX_DIFF_PIXELS,
      threshold: THRESHOLD,
      animations: 'disabled',
      // Default 'css' would downsample the 3x backing store right back to
      // CSS pixels and re-hide sub-pixel limb shifts.
      scale: 'device',
    });
  });
}
