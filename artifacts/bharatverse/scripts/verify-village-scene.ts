/**
 * Headless movement check for the canvas VillageScene (Movement Bridge PRD
 * Task 4). Drives the REAL scene's fixed-step update() with synthetic input
 * and asserts, against the shipped sindhu-ghati collision mask:
 *
 *  - the spawn→gate→granary corridor is walkable end to end,
 *  - the camera follows Aru and clamps at both painting edges (lock B),
 *  - walls actually stop Aru (box never enters a blocked tile) on all axes,
 *  - diagonal input moves both axes in the open and SLIDES along walls,
 *  - Shift-run multiplies speed by exactly RUN_MULTIPLIER,
 *  - facing/moving debug flags track input,
 *  - (Task 5) anchor-proximity E-prompts appear/clear against the REAL
 *    sindhu buildings, and an E press fires onInteract exactly once —
 *    edge-triggered, and drained when pressed with nothing in range,
 *  - (Task 6) NPC voice bubbles open within NPC_RANGE of a real villager
 *    (coexisting with a building prompt) and close in the dead zones,
 *  - (Task 7) the four authored patrol movers really patrol: each leaves
 *    home, stays on walkable tiles EVERY sampled tick, the child reaches
 *    its far waypoint, dwells there for pauseDurationMs, retraces home,
 *    all departures stay pairwise staggered (never in unison), statics
 *    never move — and voice proximity tracks a mover's LIVE position, not
 *    its painted home,
 *  - (Task 7 guard) a patrol whose first leg is blocked HOLDS at home — no
 *    points[-1] reversal crash — and recovers once the path clears,
 *  - (footsteps) the distance-driven mover gait reads exactly zero at rest
 *    (creation AND the mid-route dwell) and engages mid-leg (bob + sway),
 *    via the same patrolGait function the canvas draw applies,
 *  - (Task 39) the mover whose voice bubble is open stops mid-leg: its
 *    position freezes, moving drops (the gait wobble reads zero), its facing
 *    turns toward Aru — and FLIPS when Aru crosses behind it mid-conversation
 *    — then the patrol resumes its interrupted leg once Aru walks away,
 *  - (Task 8.3) the joystick rim-hold sprint policy engages/releases with
 *    hysteresis (pure applyJoystickRun — the exact code path every scene's
 *    isRunning() reads on touch devices).
 *
 * render() is never called — plain Node, no canvas. Tile coordinates in the
 * comments refer to village-collision.json (64px tiles, 16×24).
 *
 * Run: pnpm --filter @workspace/bharatverse run verify:village-scene
 */
import { createVillageScene } from '../src/game/worlds/village-scene';
import { SINDHU_WALK } from '../src/game/worlds/sindhu-ghati/walk';
import { WORLD_DATA as SINDHU } from '../src/game/worlds/sindhu-ghati/config';
import { WALK_TILE, createNpcPatrol, makeIsWalkable } from '../src/game/world-walk';
import {
  JOY_RUN_ENGAGE,
  JOY_RUN_RELEASE,
  RUN_MULTIPLIER,
  applyJoystickRun,
} from '../src/game/engine/types';
import { STRIDE_PX, createRigState, rigPose } from '../src/game/engine/rig';
import { createHarness } from './lib/scene-harness';
import { STAGE_H } from '../src/lib/stage';

const DT = 1 / 60;

// REAL region data (the config modules are pure/asset-free since the
// world-data task, so tsx can import them): authored anchors drive the
// Task-5 prompt asserts. The mask must agree with the authored imageSize —
// mask-derived dims are the source of truth for the camera math below.
const rows = SINDHU_WALK.mask.length;
const cols = SINDHU_WALK.mask[0]?.length ?? 0;
const config = SINDHU.config;
if (config.imageSize.w !== cols * WALK_TILE || config.imageSize.h !== rows * WALK_TILE) {
  throw new Error('config.imageSize disagrees with the collision mask dimensions');
}

const img = {} as HTMLImageElement; // update() never touches images
const entered: string[] = []; // onInteract recorder (Task 5 asserts)
const scene = createVillageScene({
  config,
  walk: SINDHU_WALK,
  images: { art: img, aru: img },
  onInteract: b => entered.push(b.id),
});

const h = createHarness(scene);
const st = () => scene.debugState();

function assert(cond: boolean, msg: string) {
  if (!cond) {
    throw new Error(`${msg} — state=${JSON.stringify(st())}`);
  }
}
const tileOfLeft = (x: number) => Math.floor((x - 14) / WALK_TILE);
const tileOfRight = (x: number) => Math.floor((x + 14) / WALK_TILE);
const tileOfTop = (y: number) => Math.floor((y - 10) / WALK_TILE);

// Raw input for wall pushes — moveAxis would throw on purpose when stuck,
// but here "stuck against the wall" is exactly what we assert.
let raw = { x: 0, y: 0 };
let running = false;
let actionQueued = false;
const rawInput = {
  getDir: () => raw,
  consumeAction: () => {
    const a = actionQueued;
    actionQueued = false;
    return a;
  },
  isRunning: () => running,
};
function push(x: number, y: number, steps: number) {
  raw = { x, y };
  for (let i = 0; i < steps; i++) scene.update(DT, rawInput);
  raw = { x: 0, y: 0 };
}
function settleCamera() {
  // 90 fixed ticks leaves <0.000002% of the initial camera gap at CAM_DAMP
  // 0.18, so the rounded draw camera must equal its clamped target.
  push(0, 0, 90);
}

// -- spawn + bottom camera clamp --------------------------------------------
assert(st().pos.x === SINDHU_WALK.spawn.x && st().pos.y === SINDHU_WALK.spawn.y,
  'spawn must match walk.spawn');
assert(st().cam.x === 0, 'lock B: cam.x must always be 0');
assert(st().cam.y === 944, `bottom clamp: cam.y at spawn must be 944, got ${st().cam.y}`);
console.log('PASS spawn + bottom camera clamp (cam.y=944)');

// -- gate corridor: spawn (col 8, row 21) north into the arch (rows 17-19) --
h.moveAxis('x', 544); // col 8 center — pure col-8 lane for the box
h.moveAxis('y', 1184); // row 18 center, inside the gate arch
console.log(`PASS walk into gate arch ${h.at()}`);

// -- west gate wall (col 6 blocked rows 17-19) -------------------------------
push(-1, 0, 60);
assert(st().pos.x < 500, `west push must travel toward the wall, got x=${st().pos.x}`);
assert(tileOfLeft(st().pos.x) >= 7, 'west wall: box may never enter blocked col 6');
console.log(`PASS west wall stops Aru at x=${st().pos.x.toFixed(1)}`);
const blockedPhase = st().rigPhase;
push(-1, 0, 20);
assert(
  Math.abs(st().rigPhase - blockedPhase) < 1e-9,
  'rig walk phase must freeze while input pushes against a wall'
);
assert(st().rigBlend < 1, 'wall-blocked pose must begin blending back to idle');
console.log('PASS distance-driven rig freezes against a blocked wall');

// -- east gate wall (col 9 blocked rows 17-19) -------------------------------
push(1, 0, 60);
assert(st().pos.x > 550, `east push must travel toward the wall, got x=${st().pos.x}`);
assert(tileOfRight(st().pos.x) <= 8, 'east wall: box may never enter blocked col 9');
console.log(`PASS east wall stops Aru at x=${st().pos.x.toFixed(1)}`);

// -- long corridor through the gate up to the granary row --------------------
h.moveAxis('x', 544);
h.moveAxis('y', 416); // row 6 center — col 8 is walkable rows 6..21 end to end
console.log(`PASS full corridor spawn→granary ${h.at()}`);

// -- camera follows + interior (unclamped) position --------------------------
// The invariant is the FOLLOW FORMULA (moveAxis arrives within ±4px, so a
// fixed number would be flaky): cam.y = clamp(pos.y - STAGE_H/2, 0, max).
const maxScroll = rows * WALK_TILE - STAGE_H;
const camExpected = Math.min(Math.max(st().pos.y - STAGE_H / 2, 0), maxScroll);
const camExpectedRounded = Math.round(camExpected);
assert(Number.isInteger(st().cam.y), 'draw camera must expose integer pixels only');
assert(
  st().cam.y !== camExpectedRounded,
  'camera must retain a damped follow gap immediately after movement, not hard-snap'
);
settleCamera();
assert(st().cam.y === camExpectedRounded,
  `settled camera must converge to rounded feet-follow target ${camExpectedRounded}, got ${st().cam.y}`);
assert(st().cam.y > 0 && st().cam.y < maxScroll,
  'camera must be OFF both clamps here (proves follow, not clamp)');
console.log(`PASS camera dampens, rounds, then settles on Aru's feet (cam.y=${st().cam.y})`);

// -- north wall (row 5 blocked at col 8) + diagonal wall slide ----------------
push(0, -1, 60);
assert(tileOfTop(st().pos.y) === 6, 'north wall: box may never enter blocked row 5');
assert(st().pos.y < 416, 'north push must have moved up before the wall');
const xBeforeSlide = st().pos.x;
push(-1, -1, 45); // y pinned by the wall, x must keep sliding west
assert(st().pos.x < xBeforeSlide - 30,
  `diagonal slide: x must keep moving along the wall (${xBeforeSlide.toFixed(1)} → ${st().pos.x.toFixed(1)})`);
assert(tileOfTop(st().pos.y) === 6, 'diagonal slide: box still may not enter row 5');
console.log(`PASS north wall + diagonal slide along it ${h.at()}`);

// -- top camera clamp: the col-5 lane (rows 1-7 walkable) reaches row 1, and
// row 1's center y=96 is inside the clamp zone, so cam.y must pin to 0 ------
h.goTo(352, 416); // over to the col-5 lane (row 6 cols 3-9 open)
h.moveAxis('y', 96); // ride the lane to the top walkable row
settleCamera();
assert(st().cam.y === 0, `top clamp: cam.y must be exactly 0, got ${st().cam.y}`);
assert(st().pos.y <= STAGE_H / 2, 'top row must sit inside the clamp zone');
console.log(`PASS top camera clamp (cam.y=0 at ${h.at()})`);
h.moveAxis('y', 480); // back down the same lane before heading east

// -- diagonal in the open: both axes move ------------------------------------
h.goTo(480, 480); // col 7 / row 7 — open 2×2 neighborhood to the south-east
const p0 = { ...st().pos };
push(1, 1, 30);
assert(st().pos.x > p0.x + 20 && st().pos.y > p0.y + 20,
  'open diagonal must advance BOTH axes');
console.log(`PASS open diagonal moves both axes ${h.at()}`);

// -- facing + moving flags ----------------------------------------------------
assert(st().facing === 1, 'facing must be 1 after moving right');
push(-1, 0, 1);
assert(st().facing === -1, 'facing must flip to -1 on left input');
assert(st().moving === true, 'moving must be true while dir is held');
push(0, 0, 1);
assert(st().moving === false, 'moving must be false when input stops');
assert(st().facing === -1, 'facing must persist when standing still');
console.log('PASS facing flip + moving flag');

// -- Shift-run: exactly RUN_MULTIPLIER × walk speed ---------------------------
h.goTo(544, 544); // back to the col-8 lane (rows 8-12 open below)
const y0 = st().pos.y;
const walkPhase0 = st().rigPhase;
push(0, 1, 30);
const walked = st().pos.y - y0;
const walkPhase1 = st().rigPhase;
running = true;
const y1 = st().pos.y;
push(0, 1, 30);
const ran = st().pos.y - y1;
const runPhase1 = st().rigPhase;
running = false;
const ratio = ran / walked;
assert(Math.abs(ratio - RUN_MULTIPLIER) < 0.05,
  `run must be ${RUN_MULTIPLIER}× walk speed, got ${ratio.toFixed(3)} (${walked.toFixed(1)}px vs ${ran.toFixed(1)}px)`);
console.log(`PASS run sprint ×${ratio.toFixed(2)} over ${walked.toFixed(0)}px lane`);
const TAU = Math.PI * 2;
const phaseDistance = (to: number, from: number) => (to - from + TAU) % TAU;
const walkPhaseDelta = phaseDistance(walkPhase1, walkPhase0);
const runPhaseDelta = phaseDistance(runPhase1, walkPhase1);
assert(
  Math.abs(walkPhaseDelta - ((walked / STRIDE_PX) * TAU) % TAU) < 1e-9,
  'walk rig phase must equal the actual ground distance covered'
);
assert(
  Math.abs(runPhaseDelta - ((ran / STRIDE_PX) * TAU) % TAU) < 1e-9,
  'run rig phase must equal the larger actual ground distance covered'
);
const fullStride = createRigState();
fullStride.phase = Math.PI / 2;
fullStride.blend = 1;
const walkPose = rigPose(fullStride, false);
const runPose = rigPose(fullStride, true);
assert(
  Math.abs(runPose.angles.legL) > Math.abs(walkPose.angles.legL) * 1.3,
  'run pose must swing legs at least 30% wider than walk'
);
assert(
  Math.abs(runPose.angles.armR) > Math.abs(walkPose.angles.armR) * 1.3,
  'run pose must swing the free arm at least 30% wider than walk'
);
console.log('PASS run rig cycles faster and swings wider');

// -- Task 5: anchor-based E-prompts against the REAL sindhu anchors ----------
// After the sprint Aru sits mid-lane around (544, ~790) — every authored
// anchor is outside its interactionRadius there.
const idlePhase = st().rigPhase;
push(0, 0, 1); // one idle tick — prompt must update even when standing still
assert(st().rigPhase === idlePhase, 'walk phase must not advance while idle');
assert(st().rigBlend < 1, 'walk pose must blend toward idle sway after stopping');
assert(st().prompt === null,
  `mid-corridor must have no prompt, got ${st().prompt?.id}`);
// Press E in the open: the edge must be consumed NOW (drained), not stored.
actionQueued = true;
push(0, 0, 1);
assert(entered.length === 0, 'E with nothing in range must not interact');
// Ride the lane to the granary anchor (row 6, col 7 → center 480,416,
// radius 1.5 tiles = 96px; the col-8 lane at (544,416) is 64px away).
h.moveAxis('y', 416);
push(0, 0, 1);
assert(st().prompt?.id === 'anaaj-bhandaar',
  `granary must prompt at ${h.at()}, got ${st().prompt?.id}`);
assert(entered.length === 0,
  'the earlier drained press must NOT fire on arriving at a doorway');
console.log(`PASS anchor E-prompt appears at the granary ${h.at()}`);

// -- Task 5: E fires onInteract exactly once (edge-triggered) ----------------
actionQueued = true;
push(0, 0, 1);
assert(entered.length === 1 && entered[0] === 'anaaj-bhandaar',
  `E at the granary must fire onInteract once, got ${JSON.stringify(entered)}`);
push(0, 0, 2);
assert(entered.length === 1, 'no new press → no re-fire on later ticks');
console.log('PASS E-press enters the granary exactly once');

// -- Task 5: spawn sits inside the city gate's wide anchor (radius 2.5) ------
const scene2 = createVillageScene({
  config,
  walk: SINDHU_WALK,
  images: { art: img, aru: img },
  // no onInteract: an E press with a prompt up must be a safe no-op
});
scene2.update(DT, rawInput);
assert(scene2.debugState().prompt?.id === 'sheher-ka-dwaar',
  `spawn must prompt the city gate, got ${scene2.debugState().prompt?.id}`);
actionQueued = true;
scene2.update(DT, rawInput); // must not throw without onInteract
actionQueued = false;
console.log('PASS spawn prompts sheher-ka-dwaar (2.5-tile anchor), E no-op safe');

// -- Task 6: NPC voice proximity (NPC_RANGE 120px) against real npc data -----
// The granary corridor spot doubles as a voice spot: granary-pair stands at
// (510,498), ~89px from here — the bubble and the E-prompt coexist.
assert(st().voiceNpc?.id === 'granary-pair',
  `granary spot must also voice granary-pair, got ${st().voiceNpc?.id}`);
h.moveAxis('y', 672); // central-path-child (512,698) is ~41px from (544,672)
push(0, 0, 1);
assert(st().voiceNpc?.id === 'central-path-child',
  `central path must voice the narrator child, got ${st().voiceNpc?.id}`);
// Dead zone on this lane (x≈547) sits at y∈(851,872): dog/child coverage ends
// by 813, bazaar-trader's narrow band ends at 851, drain-street starts at 872.
h.moveAxis('y', 862);
push(0, 0, 1);
assert(st().voiceNpc === null,
  `(547,862) must be voice-silent, got ${st().voiceNpc?.id}`);
console.log('PASS NPC voice bubble opens by proximity and closes in the gap');

// -- Task 7: NPC patrol — movers really move, never clip, stay staggered -----
// Route data (npcs.json): sack-carrier home (372,272) → (r2,c4)=(288,160),
// pause 1600ms; running-child home (410,678) → (r8,c5)=(352,544) → far
// (r8,c11)=(736,544), pause 1800ms; village-dog home (447,746) →
// (r11,c5)=(352,736), pause 3000ms; gate-guard-left home (430,1375) →
// (r21,c4)=(288,1376), pause 3400ms. The sack route keeps ≥224px clear of
// the (544,416) voice spot asserted above, and the guard paces a row-21
// lane no assert ever visits. Patrols tick inside scene.update, so a
// FRESH scene isolates patrol phase from everything simulated above.
const isWalk = makeIsWalkable(SINDHU_WALK);
const scene3 = createVillageScene({
  config,
  walk: SINDHU_WALK,
  images: { art: img, aru: img },
});
const st3 = () => scene3.debugState();
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

{
  const MOVER_IDS = ['sack-carrier', 'running-child', 'village-dog', 'gate-guard-left'] as const;
  const homes: Record<(typeof MOVER_IDS)[number], { x: number; y: number }> = {
    'sack-carrier': { x: 372, y: 272 },
    'running-child': { x: 410, y: 678 },
    'village-dog': { x: 447, y: 746 },
    'gate-guard-left': { x: 430, y: 1375 },
  };
  const m0 = st3().movers;
  assert(
    Object.keys(m0).length === MOVER_IDS.length && MOVER_IDS.every(id => !!m0[id]),
    `exactly the four authored movers patrol, got [${Object.keys(m0).join(',')}]`
  );
  assert(
    m0['running-child'].x === 410 && m0['running-child'].y === 678,
    'child patrol starts at its painted home'
  );
  const g0 = st3().moverGait;
  assert(
    MOVER_IDS.every(id => g0[id].bob === 0 && g0[id].tilt === 0),
    'every mover resting at home must carry a zero gait offset'
  );

  const childFar = { x: 736, y: 544 };
  let gaitBobPeak = 0; // most-negative bob seen mid-leg (≤0 = upward lift)
  let gaitTiltPeak = 0; // largest |sway| seen mid-leg
  const movedAt: Partial<Record<(typeof MOVER_IDS)[number], number>> = {};
  let reachedFarAt = -1;
  for (let i = 0; i < 60 * 30; i++) {
    scene3.update(DT, rawInput);
    const m = st3().movers;
    // No clipping, sampled EVERY tick of the whole approach (PRD A.3.4).
    for (const id of MOVER_IDS) {
      const p = m[id];
      if (!isWalk(Math.floor(p.x / WALK_TILE), Math.floor(p.y / WALK_TILE)))
        throw new Error(`${id} clipped into a blocked tile at (${p.x.toFixed(1)},${p.y.toFixed(1)})`);
      if (movedAt[id] === undefined && dist(p, homes[id]) > 2) movedAt[id] = i;
    }
    const g = st3().moverGait['running-child'];
    gaitBobPeak = Math.min(gaitBobPeak, g.bob);
    gaitTiltPeak = Math.max(gaitTiltPeak, Math.abs(g.tilt));
    if (dist(m['running-child'], childFar) < 4) {
      reachedFarAt = i;
      break; // stop AT the far end — the dwell assert below needs this moment
    }
  }
  for (const id of MOVER_IDS) assert(movedAt[id] !== undefined, `${id} must leave home`);
  assert(reachedFarAt >= 0, 'child must reach the far waypoint (736,544)');
  // Staggered departures generalize pairwise: sorted first-move ticks must
  // keep ≥0.5s between EVERY neighbouring pair, so no two movers ever pop
  // off their painted spots in unison.
  const departures = MOVER_IDS.map(id => movedAt[id]!).sort((a, b) => a - b);
  for (let k = 1; k < departures.length; k++)
    assert(
      (departures[k] - departures[k - 1]) * DT > 0.5,
      `stagger: departures must differ ≥0.5s pairwise, got ${((departures[k] - departures[k - 1]) * DT).toFixed(2)}s`
    );
  console.log(
    `PASS movers patrol collision-free, staggered (${MOVER_IDS.map(id => `${id} t=${(movedAt[id]! * DT).toFixed(2)}s`).join(', ')})`
  );

  // Dwell: settle onto the endpoint (≤4px remain), then a second into the
  // child's 1.8s end-pause it must not have moved a pixel.
  for (let i = 0; i < 12; i++) scene3.update(DT, rawInput);
  const atFar = { ...st3().movers['running-child'] };
  for (let i = 0; i < 60; i++) scene3.update(DT, rawInput);
  assert(
    dist(st3().movers['running-child'], atFar) < 0.001,
    'child must dwell pauseDurationMs at the route end'
  );
  const gDwell = st3().moverGait['running-child'];
  assert(
    gDwell.bob === 0 && gDwell.tilt === 0,
    'a dwelling mover must land at a zero gait offset — no frozen mid-swing pose'
  );
  assert(
    gaitBobPeak < -1 && gaitTiltPeak > 0.02,
    `mid-leg gait must engage (bob peak ${gaitBobPeak.toFixed(2)}px, sway peak ${gaitTiltPeak.toFixed(3)}rad)`
  );
  console.log(
    `PASS distance-driven gait: zero at rest, bob ${gaitBobPeak.toFixed(2)}px / sway ${gaitTiltPeak.toFixed(3)}rad mid-leg`
  );

  // Reverse: it retraces to home (idle → walk → idle → REVERSE, PRD A.3.4).
  let backAt = -1;
  for (let i = 0; i < 60 * 20 && backAt < 0; i++) {
    scene3.update(DT, rawInput);
    if (dist(st3().movers['running-child'], homes['running-child']) < 4) backAt = i;
  }
  assert(backAt >= 0, 'child must retrace to home after the end pause');
  console.log('PASS patrol dwells at the route end and reverses home');
}

// -- Task 39 (+ Task 7 live-tracking): a voiced mover holds and faces Aru ----
// Aru parks AT the child's far waypoint — the child's painted home is
// ~353px away, far outside NPC_RANGE, so its bubble can only open when the
// LIVE patrol position walks into range (the Task-7 proof, kept). The
// moment it does, the patrol machine must HOLD: the child freezes mid-leg
// facing Aru instead of strolling past him mid-sentence, stays frozen while
// Aru walks around it (facing flipping to track him), and resumes its
// interrupted leg toward (736,544) once Aru leaves the range. No other NPC
// sits within NPC_RANGE of the park spot, and the granary-pair static
// (510,498) stays ≥19px farther than the child at every asserted Aru spot,
// so the child owns the bubble throughout the engagement window.
h.moveAxis('y', 544); // col-8 lane up to row 8 (open cols 2-12)
h.moveAxis('x', 736); // row-8 lane east to the far waypoint
{
  const child = () => st().movers['running-child'];
  const far = { x: 736, y: 544 };
  let voiced = false;
  for (let i = 0; i < 60 * 40 && !voiced; i++) {
    scene.update(DT, rawInput);
    if (st().voiceNpc?.id === 'running-child') voiced = true;
  }
  assert(voiced, 'live patrol position must drive voice proximity at (736,544)');
  scene.update(DT, rawInput); // engagement keys on the PREVIOUS tick's voice
  const held = { x: child().x, y: child().y };
  // Entering range 120px out from (736±4,544) pins the freeze spot deep
  // inside the (352,544)→(736,544) leg — never at either endpoint.
  assert(
    held.x > 352 + 40 && held.x < 736 - 40,
    `child must be caught MID-LEG, got x=${held.x.toFixed(1)}`
  );
  for (let i = 0; i < 60; i++) scene.update(DT, rawInput);
  assert(dist(child(), held) < 0.001, 'voiced mover must freeze in place');
  assert(st().voiceNpc?.id === 'running-child', 'child must stay voiced while held');
  assert(!child().moving, 'held mover must report moving=false (walk bob stops)');
  assert(
    child().facing === (st().pos.x >= held.x ? 1 : -1),
    `held child must face Aru, got facing=${child().facing}`
  );
  console.log(`PASS voiced mover freezes mid-leg facing Aru (x=${held.x.toFixed(1)})`);

  // Walk BEHIND the frozen child — Aru crosses to its west side while
  // staying inside NPC_RANGE the whole way (max gap 50px+arrive tolerance),
  // so the hold must persist and the facing must flip mid-conversation.
  h.moveAxis('x', held.x - 50);
  push(0, 0, 2); // let the flip land (engagement lags voice by one step)
  assert(st().voiceNpc?.id === 'running-child', 'child still voiced 50px behind');
  assert(dist(child(), held) < 0.001, 'child must stay frozen while Aru circles it');
  assert(child().facing === -1, 'child must flip to face Aru on its west side');
  console.log('PASS held mover flips facing when Aru crosses behind it');

  // Leave westward out of range: the bubble releases the child and the
  // patrol must resume the interrupted leg on its own — the existing
  // handoff guarantee, now driven by ARU leaving instead of the mover.
  h.moveAxis('x', 480);
  push(0, 0, 1);
  assert(
    (st().voiceNpc?.id ?? null) !== 'running-child',
    'voice must release once Aru walks out of range'
  );
  let resumed = false;
  for (let i = 0; i < 60 * 10 && !resumed; i++) {
    scene.update(DT, rawInput);
    if (dist(child(), held) > 8) resumed = true;
  }
  assert(resumed, 'patrol must resume after Aru leaves the range');
  let reachedFar = false;
  for (let i = 0; i < 60 * 10 && !reachedFar; i++) {
    scene.update(DT, rawInput);
    if (dist(child(), far) < 4) reachedFar = true;
  }
  assert(reachedFar, 'resumed patrol must finish its interrupted leg to (736,544)');
  console.log('PASS patrol resumes its leg once Aru walks away');
}

// -- Task 7 guard: blocked first leg holds, never crashes, recovers ----------
// The runtime bounce retraces to the PREVIOUS route point — which doesn't
// exist while the mover still sits at home (at=0). Naively flipping dir
// there targets points[-1] and crashes on structurally valid (drifted)
// data: validation proves waypoint TILES walkable, not the straight segment
// out of home. Gate the segment shut, prove the mover holds; open it, prove
// the patrol recovers on its own.
{
  const childNpc = config.npcs.find(n => n.id === 'running-child');
  assert(!!childNpc, 'running-child exists to clone for the gated patrol test');
  // Home sits 1px west of the col-3|4 boundary so the very first step is the
  // blocked one (tile (3,3) itself stays walkable, as validation guarantees).
  const home = { x: 4 * WALK_TILE - 1, y: 3.5 * WALK_TILE };
  const far = { x: 9.5 * WALK_TILE, y: 3.5 * WALK_TILE };
  let gateOpen = false;
  const gated = (col: number, row: number) => row === 3 && (gateOpen || col <= 3);
  const patrol = createNpcPatrol(
    { ...childNpc!, id: 'gated-test', position: { ...home }, waypoints: [{ row: 3, col: 9 }], pauseDurationMs: 100 },
    gated,
    0
  );
  assert(!!patrol, 'gated test npc builds a patrol');
  for (let i = 0; i < 60 * 3; i++) patrol!.tick(DT); // ~28 blocked retry cycles
  const held = patrol!.state();
  assert(
    dist(held.pos, home) < 0.001 && !held.moving,
    `blocked first leg must hold at home, got (${held.pos.x.toFixed(1)},${held.pos.y.toFixed(1)})`
  );
  gateOpen = true;
  let recoveredAt = -1;
  for (let i = 0; i < 60 * 8 && recoveredAt < 0; i++) {
    patrol!.tick(DT);
    const p = patrol!.state().pos;
    if (!gated(Math.floor(p.x / WALK_TILE), Math.floor(p.y / WALK_TILE)))
      throw new Error(`gated patrol entered a blocked tile at (${p.x.toFixed(1)},${p.y.toFixed(1)})`);
    if (dist(p, far) < 4) recoveredAt = i;
  }
  assert(recoveredAt >= 0, 'patrol must recover and reach the waypoint once the path clears');
  console.log('PASS blocked-at-home patrol holds (no points[-1] crash) and recovers');
}

// -- Task 8.3: joystick rim-hold sprint (engine hysteresis policy) -----------
// Touch sprint = push the thumb to the rim; walking pushes stay well under
// ENGAGE, the band between RELEASE and ENGAGE holds the previous state so
// the flag can't flicker while a kid's thumb wobbles on the boundary.
{
  assert(JOY_RUN_RELEASE < JOY_RUN_ENGAGE, 'hysteresis band must be ordered');
  const mid = (JOY_RUN_ENGAGE + JOY_RUN_RELEASE) / 2;
  assert(!applyJoystickRun(false, { x: 0.5, y: 0 }), 'half push must not sprint');
  assert(applyJoystickRun(false, { x: JOY_RUN_ENGAGE, y: 0 }), 'rim push engages sprint');
  assert(applyJoystickRun(false, { x: 0, y: -1 }), 'full push engages on any axis');
  assert(applyJoystickRun(true, { x: mid, y: 0 }), 'in-band wobble keeps an engaged sprint');
  assert(!applyJoystickRun(false, { x: mid, y: 0 }), 'in-band push alone never STARTS a sprint');
  assert(!applyJoystickRun(true, { x: 0.5, y: 0 }), 'dropping under RELEASE ends the sprint');
  assert(!applyJoystickRun(true, null), 'letting go of the joystick ends the sprint');
  console.log('PASS joystick rim-hold sprint hysteresis (engage/hold/release)');
}

// -- villages are never "won" -------------------------------------------------
assert(st().won === false && scene.hud().won === false, 'village must never report won');

h.pass('canvas VillageScene movement + camera + collision verified');
