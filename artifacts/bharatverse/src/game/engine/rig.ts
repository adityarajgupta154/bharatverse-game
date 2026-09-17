import type { Vec2 } from './types';

/**
 * Aru's cutout ("paper-doll") rig — Rig+Camera PRD Tasks 1-3. Pure math +
 * piece metadata, no DOM/canvas: the scene renderer consumes rigPose() and
 * the headless verify script drives advanceRig() directly.
 *
 * The five pieces live in src/assets/images/aru-rig/ as FULL-FRAME 372×800
 * cutouts of the original aru-sprite-cut.png (same canvas, so piece and
 * frame coordinates are identical — no per-piece offset bookkeeping). They
 * were cut with feathered masks that overlap at every joint; recomposing all
 * five at rest angles reproduces the flat sprite (verified at cut time,
 * diff ≈1% of pixels, all on feather edges).
 *
 * Walk cycle (PRD Task 1.3): each limb rotates about its joint pivot by
 * amplitude × sin(phase); left/right pieces sit π apart so they alternate,
 * and each arm swings contralaterally (with the OPPOSITE side's leg). The
 * torso+arms bob twice per stride via |sin(phase)|.
 *
 * Phase is DISTANCE-driven (PRD Task 2.1): it advances with ground actually
 * covered after collision, never with wall-blocked input, so legs only swing
 * while Aru genuinely moves. Standing still blends into a slow time-driven
 * idle sway instead of freezing (Task 2.2). Running raises the amplitudes;
 * cadence rises for free because distance/second rises (Task 2.3).
 */

export type RigPieceId = 'torso' | 'armL' | 'armR' | 'legL' | 'legR';

/** Shared source frame of every piece PNG (matches aru-sprite-cut.png). */
export const RIG_FRAME = { w: 372, h: 800 } as const;

/** Feet anchor inside the frame — same grounding as the flat sprite's
 *  centered, bottom-aligned draw. */
export const RIG_FEET = { x: RIG_FRAME.w / 2, y: RIG_FRAME.h } as const;

export interface RigPieceDef {
  id: RigPieceId;
  /** Joint pivot in frame px: shoulders for arms, hips for legs. */
  pivot: Vec2;
  /** Torso-attached pieces ride the bob; legs stay planted on the ground. */
  bobs: boolean;
}

/**
 * Draw order back→front. Arms sit over the torso (their sleeves overlap the
 * kurta in the art); the torso's kurta hem covers both hip pivots; legL
 * carries the dhoti's central hanging fold, so it draws over legR.
 * armL = the raised orb arm (viewer left), armR = the hanging arm.
 */
export const RIG_PIECES: readonly RigPieceDef[] = [
  { id: 'legR', pivot: { x: 293, y: 496 }, bobs: false },
  { id: 'legL', pivot: { x: 158, y: 496 }, bobs: false },
  { id: 'torso', pivot: { x: 186, y: 400 }, bobs: true },
  { id: 'armR', pivot: { x: 312, y: 252 }, bobs: true },
  { id: 'armL', pivot: { x: 172, y: 200 }, bobs: true },
];

/** World px covered per full stride cycle (two steps). WALK_SPEED 190 →
 *  ~2 cycles/s walking, ~3.3 running — a brisk, kid-sized cadence. */
export const STRIDE_PX = 92;

// Swing amplitudes (radians) at full walk blend.
const AMP_LEG = 0.38;
/** The hanging arm swings freely… */
const AMP_ARM = 0.3;
/** …but the orb arm stays steadier — Aru is carrying the memory light. */
const AMP_ARM_ORB = 0.13;
/** Run swings wider (cadence already rises with speed — Task 2.3). */
const AMP_RUN_MULT = 1.35;
/** Torso dip per footfall, frame px (~2 screen px at the 84px draw). */
const BOB_PX = 18;
const BOB_RUN_MULT = 1.4;

// Idle sway — a subtly breathing rest pose, never a hard freeze (Task 2.2).
const IDLE_RATE = 1.7; // rad/s
const IDLE_ARM = 0.05;
const IDLE_BOB_PX = 5;

/** Walk↔idle pose blend rate, per second (≈0.15/tick at 60Hz). */
const BLEND_RATE = 9;

export interface RigState {
  /** Walk-cycle phase in rad — advances with DISTANCE moved (Task 2.1). */
  phase: number;
  /** Idle-sway phase in rad — advances with TIME while resting. */
  idlePhase: number;
  /** 0 = full idle pose … 1 = full walk pose (Task 2.2 blending). */
  blend: number;
}

export function createRigState(): RigState {
  return { phase: 0, idlePhase: 0, blend: 0 };
}

/**
 * Advance the rig by one fixed step. `movedPx` MUST be the actual distance
 * covered after collision resolution — pushing into a wall passes 0, which
 * freezes the walk phase and blends the pose back to idle sway.
 */
export function advanceRig(rig: RigState, movedPx: number, dt: number): void {
  const TAU = Math.PI * 2;
  if (movedPx > 0) {
    rig.phase = (rig.phase + (movedPx / STRIDE_PX) * TAU) % TAU;
  } else {
    rig.idlePhase = (rig.idlePhase + IDLE_RATE * dt) % TAU;
  }
  const target = movedPx > 0 ? 1 : 0;
  rig.blend += (target - rig.blend) * Math.min(1, BLEND_RATE * dt);
  if (Math.abs(rig.blend - target) < 0.01) rig.blend = target;
}

export interface RigPose {
  /** Rotation per piece in rad (natural right-facing frame). */
  angles: Record<RigPieceId, number>;
  /** Vertical offset in frame px (negative = up) for `bobs` pieces. */
  bob: number;
}

/** Blend-mixed pose for the current state. Pure: same state → same pose. */
export function rigPose(rig: RigState, running: boolean): RigPose {
  const walk = rig.blend * (running ? AMP_RUN_MULT : 1);
  const idle = 1 - rig.blend;
  const s = Math.sin(rig.phase);
  const sOpp = Math.sin(rig.phase + Math.PI);
  const iSway = Math.sin(rig.idlePhase);
  return {
    angles: {
      torso: 0,
      // Legs alternate π apart (Task 1.3)…
      legL: walk * AMP_LEG * s,
      legR: walk * AMP_LEG * sOpp,
      // …and each arm swings with the OPPOSITE leg (contralateral gait),
      // easing into a gentle two-arm sway while idle.
      armR: walk * AMP_ARM * s + idle * IDLE_ARM * iSway,
      armL: walk * AMP_ARM_ORB * sOpp + idle * IDLE_ARM * 0.7 * Math.sin(rig.idlePhase + 1.1),
    },
    bob:
      -walk * (running ? BOB_RUN_MULT : 1) * BOB_PX * Math.abs(s) -
      idle * IDLE_BOB_PX * (0.5 + 0.5 * iSway),
  };
}
