import { expect, test, type Page } from '@playwright/test';

/**
 * Pixel goldens for the village patrol movers (sack-carrier, running-child,
 * village-dog, gate-guard-left) on the village canvas — the same guard
 * aru-rig-shots.spec.ts gives Aru's rig, aimed at the mover draw path
 * instead: cut sprite + ax/ay anchor placement (npc-sprites.ts), the
 * painted-over home spot in the walk art, and the shadow ellipse under each
 * figure (village-scene.ts). A bad edit to any of those must fail HERE
 * instead of shipping silently — the headless checks cover patrol logic,
 * never the drawn pixels.
 *
 * Deterministic by construction, exactly like the rig shots:
 *  - ?rigfreeze pins the scene at creation and turns update() into a no-op.
 *    Patrols never tick, so every mover rests at its authored HOME position
 *    from npcs.json with moving=false and facing=1 — the distance-driven
 *    gait (world-walk.patrolGait) reads exactly {bob:0, tilt:0} at rest, so
 *    the cut sprite sits pixel-exactly over its patched-out painted spot.
 *  - ?spawn drops Aru on a PER-SHOT walkable tile picked so the target
 *    mover's home is on screen at the clamped camera, the crop clears the
 *    TopNav chrome (stage rows 0-72), and Aru, his shadow, his a11y marker
 *    and every open voice bubble stay outside the crop (each entry
 *    documents its own margins).
 *  - reduced motion removes the entry veil and the ambient bubble cycle;
 *    frozen proximity keeps every dialogue bubble closed, and idle mover
 *    hotspots paint nothing.
 *  - 1024x592 viewport = stage scale 1, so world px map 1:1 to page px.
 *
 * Each shot crops tight around ONE mover, centered on its live position
 * from the __bhvWalk mirror (not a hardcoded home): if a home moves in
 * npcs.json the window follows the figure automatically — and the golden
 * still reddens, because the painting behind the sprite changes. Crop
 * extents derive from NPC_SPRITE_DEFS: sprite spans pos-(ax,ay) to
 * pos+(w-ax, h-ay) facing right and pos-(w-ax)..pos+ax horizontally when
 * mirrored, so halfW covers max(ax, w-ax) both ways; the shadow ellipse
 * adds ±0.26*w around pos.x and pos.y+2±5, plus margin so an anchor nudge
 * shifts pixels WITHIN the crop.
 *
 * Mirrored (facing -1) variants ride the same freeze: a mover's facing
 * only flips when its patrol machine ticks, and the freeze forbids ticking
 * — so ?moverface=-1 (same dev/e2e query family, threaded NodeWorldScreen
 * → VillageCanvas → createVillageScene → createNpcPatrol) pins each
 * patrol's INITIAL facing at scene creation, and the frozen frame draws
 * the scale(-1,1) mirror branch in village-scene.ts. Reflected around the
 * anchor, a wrong offset there (e.g. -(w-ax) instead of -ax) shifts the
 * whole figure |w-2ax| px (child 16, dog 2) and reddens ONLY the -left
 * goldens — exactly the gap the right-facing shots cannot see.
 *
 * Captured at deviceScaleFactor 3 with scale:'device' (see the rig spec
 * header): a 1-frame-px anchor mistake lands as whole diffed device pixels
 * instead of vanishing into anti-aliasing at scale 1.
 *
 * Goldens live in npc-mover-shots.spec.ts-snapshots/ (committed). After a
 * DELIBERATE change to the cut art, anchors or shadow math, regenerate:
 *   pnpm exec playwright test tests/npc-mover-shots.spec.ts --update-snapshots
 * and eyeball the new crops before committing them.
 */

// 3x backing store for sprite-sized sensitivity (see header).
test.use({ deviceScaleFactor: 3 });

/** Drain-street tile (col 9, row 11) — walkable, camY 440 shows the child
 *  AND dog homes clear of the TopNav, and Aru's sprite/shadow reach neither
 *  crop (84px east of the child's). No NPC voices within 120px of it. */
const MID_SPAWN = { x: 608, y: 736 };

/** Upper-path tile (col 3, row 3) for the sack-carrier shot — camY clamps
 *  to 0, putting the crop top (world y 164) under the TopNav line with room
 *  to spare; Aru stands 156px southwest of the home anchor, outside every
 *  NPC's 120px voice range, so no bubble opens anywhere on screen. */
const PLAZA_SPAWN = { x: 224, y: 224 };

/** Gate-lane tile (col 11, row 21) for the gate-guard shot — camY clamps to
 *  the bottom (944); Aru stands 306px east of the guard, and the only NPC
 *  he wakes (well-woman-right, 21px away) bubbles ~180px right of the
 *  crop's right edge. */
const GATE_SPAWN = { x: 736, y: 1376 };

/** Aru's frozen pose is irrelevant to the mover crops — any valid value
 *  freezes the whole scene; idle keeps him visually quiet. */
const RIGFREEZE = '0,0,0,1';

/**
 * Measured on this setup (frozen scene, DSF-3 device-pixel capture):
 *  - run-to-run noise is ZERO — two independently captured runs produce
 *    byte-identical PNGs (sha256-compared) for ALL EIGHT goldens (both
 *    facings of all four movers), because nothing advances;
 *  - a deliberate 8 frame-px anchor nudge in npc-sprites.ts scores
 *    18209 diff pixels on the child golden (ax 42→50) and 11018 on the
 *    dog golden (ay 56→48); the same ax nudge scores 18139 / 11377 on the
 *    mirrored -left goldens (ax 42→50, ax 37→45). Re-measured for the
 *    Task-38 movers: ax 24→32 scores 16021 / 14554 (sack-carrier right /
 *    -left) and ax 25→33 scores 16321 / 17350 (gate-guard right / -left);
 *  - the plausible mirror-math mistake — -(w-ax) instead of -ax under
 *    scale(-1,1) — shifts the mirrored cut |w-2ax| px and scores 23736
 *    (child, 16 px) / 5884 (dog, 2 px) on the -left goldens while BOTH
 *    right-facing shots stay green: the exact blind spot these variants
 *    close. The sack-carrier shifts 8 px under it (ax-nudge magnitude
 *    class); the gate-guard's dead-centre anchor makes it a 0 px no-op
 *    there (its -left golden guards the flipped ART instead — see the
 *    shot comment).
 * 80 therefore sits far below the smallest signal any real mistake
 * produced (5884), with zero measured noise underneath it.
 */
const MAX_DIFF_PIXELS = 80;
const THRESHOLD = 0.1;

async function openFrozenVillage(
  page: Page,
  spawn: { x: number; y: number },
  face: 1 | -1 = 1
) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1024, height: 592 });
  // face -1 → &moverface=-1: pins every patrol's initial facing so the
  // frozen scene draws the mirrored branch (default 1 needs no param —
  // that IS the gameplay default, keeping the right goldens honest).
  await page.goto(
    `/world/sindhu-ghati?spawn=${spawn.x},${spawn.y}&rigfreeze=${RIGFREEZE}` +
      (face === -1 ? '&moverface=-1' : '')
  );

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

  return page.evaluate(
    () =>
      (
        window as unknown as {
          __bhvWalk: { camY: number; movers: Record<string, { x: number; y: number }> };
        }
      ).__bhvWalk
  );
}

for (const shot of [
  {
    name: 'mover-sack-carrier',
    id: 'sack-carrier',
    spawn: PLAZA_SPAWN,
    // npc-sack-carrier cut: 56x102, anchor (24,100) → sprite x -24..+32
    // facing right, -32..+24 mirrored (halfW 46 covers both), y -100..+2;
    // shadow x ±14.6, y -3..+7. The painted neighbour's feet (world y≤166)
    // sit statically in the crop's top rows.
    crop: { halfW: 46, up: 108, down: 12 },
    what: 'the sack-carrier at home — cut sprite over its patched plaza spot',
    whatLeft: 'the sack-carrier at home facing left — mirrored cut, sack still shouldered',
  },
  {
    name: 'mover-running-child',
    id: 'running-child',
    spawn: MID_SPAWN,
    // npc-child cut: 68x108, anchor (42,116) → sprite x -42..+26 facing
    // right, -26..+42 mirrored (halfW 56 covers both), y -116..-8;
    // shadow x ±17.7, y -3..+7. down stays short of the dog's head at y+12.
    crop: { halfW: 56, up: 124, down: 12 },
    what: 'the running child at home — cut sprite over its patched spot, shadow at rest',
    whatLeft: 'the running child at home facing left — mirrored cut, feet still planted',
  },
  {
    name: 'mover-village-dog',
    id: 'village-dog',
    spawn: MID_SPAWN,
    // npc-dog cut: 72x62, anchor (37,56) → sprite x -37..+35 facing right,
    // -35..+37 mirrored (halfW 52 covers both), y -56..+6;
    // shadow x ±18.7, y -3..+7.
    crop: { halfW: 52, up: 64, down: 16 },
    what: 'the village dog at home — cut sprite over its patched spot, shadow at rest',
    whatLeft: 'the village dog at home facing left — mirrored cut, feet still planted',
  },
  {
    name: 'mover-gate-guard',
    id: 'gate-guard-left',
    spawn: GATE_SPAWN,
    // npc-gate-guard cut: 50x113, anchor (25,103) → sprite x ±25 for BOTH
    // facings (dead-centre anchor: the classic -(w-ax) mirror mistake is a
    // 0px no-op here, so the -left golden guards the flipped ART, not the
    // offset), y -103..+10; shadow x ±13, y -3..+7. The crop's bottom rows
    // catch the static top edge of the gate nameplate (world y≥1390).
    crop: { halfW: 40, up: 111, down: 20 },
    what: 'the gate guard at home — cut sprite over its patched wall spot',
    whatLeft: 'the gate guard at home facing left — mirrored cut against the same wall',
  },
]) {
  for (const variant of [
    { file: shot.name, face: 1, what: shot.what },
    { file: `${shot.name}-left`, face: -1, what: shot.whatLeft },
  ] as const) {
    test(`mover golden: ${variant.what}`, async ({ page }) => {
      const st = await openFrozenVillage(page, shot.spawn, variant.face);
      const mover = st.movers[shot.id];
      if (!mover) throw new Error(`no live mover '${shot.id}' in the __bhvWalk mirror`);

      const box = await page.getByTestId('village-canvas').boundingBox();
      if (!box) throw new Error('village canvas has no bounding box');
      const scale = box.width / 1024; // 1 at the pinned viewport, kept honest

      await expect(page).toHaveScreenshot(`${variant.file}.png`, {
        clip: {
          x: box.x + (mover.x - shot.crop.halfW) * scale,
          y: box.y + (mover.y - st.camY - shot.crop.up) * scale,
          width: shot.crop.halfW * 2 * scale,
          height: (shot.crop.up + shot.crop.down) * scale,
        },
        maxDiffPixels: MAX_DIFF_PIXELS,
        threshold: THRESHOLD,
        animations: 'disabled',
        // Default 'css' would downsample the 3x backing store right back to
        // CSS pixels and re-hide sub-pixel anchor shifts.
        scale: 'device',
      });
    });
  }
}
