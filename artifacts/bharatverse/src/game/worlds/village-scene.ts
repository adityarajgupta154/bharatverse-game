import { dampCamera, followCamera, roundCamera } from '../engine/camera';
import { moveActor } from '../engine/movement';
import {
  RIG_FEET,
  RIG_FRAME,
  RIG_PIECES,
  advanceRig,
  createRigState,
  rigPose,
  type RigPieceId,
} from '../engine/rig';
import { RUN_MULTIPLIER, type Vec2 } from '../engine/types';
import {
  ARU_HALF_H,
  ARU_HALF_W,
  WALK_SPEED,
  WALK_TILE,
  createNpcPatrol,
  makeIsWalkable,
  nearestAnchorBuilding,
  nearestVoiceNpc,
  patrolGait,
  type NpcGait,
  type NpcPatrol,
} from '../world-walk';
import { STAGE_W, STAGE_H } from '../../lib/stage';
import type { GameInput } from '../engine/input';
import type { Scene, SceneHud } from '../games/types';
import type { WorldBuilding, WorldConfig, WorldNpc, WorldWalkConfig } from '../world-types';

/**
 * VillageScene (Movement Bridge PRD Tasks 3+) — the canvas renderer behind
 * walk mode's `walkRenderer: 'canvas'` flag. Same Scene contract as the
 * minigame scenes (fixed-step update + STAGE-coordinate render + hud), plus
 * the `debugState()` observation seam the headless verify scripts drive.
 * Parameterized by world data so ONE scene serves every walkable village —
 * it is NOT a GameDef and never enters the GAMES registry; VillageCanvas
 * hosts it inside NodeWorldScreen.
 *
 * NOTE for verify scripts (tsx): runtime imports here are RELATIVE on
 * purpose — tsx cannot resolve the `@/` vite alias. Type-only imports are
 * erased and may point anywhere.
 */

export interface VillageSceneArgs {
  config: WorldConfig;
  walk: WorldWalkConfig;
  /** Preloaded painting + Aru sprite. update() never touches these, so the
   *  headless harness may pass stubs; only render() draws them. */
  images: {
    art: HTMLImageElement;
    aru: HTMLImageElement;
    /** Full-frame rig pieces (aru-rig/*.png). Optional: the headless
     *  harness omits them and render() falls back to the flat sprite. */
    aruRig?: Record<RigPieceId, HTMLImageElement>;
  };
  /**
   * Cut sprites for patrol movers keyed by NPC id (Task 7). Optional — the
   * headless harness omits it (patrols run logic-only), and a mover with no
   * entry simply isn't drawn. Hosts must pass one for every waypointed NPC:
   * with walkArt the painted figure is patched out, so the sprite IS the
   * figure. ax/ay: draw topLeft = pos − (ax, ay); natural facing is right.
   */
  npcSprites?: Record<
    string,
    { img: HTMLImageElement; w: number; h: number; ax: number; ay: number }
  >;
  /** Start position override (?spawn=x,y); defaults to walk.spawn. */
  spawn?: Vec2;
  /**
   * E pressed while a building is in anchor range (Task 5) — the host opens
   * its card, same path as clicking the hotspot. Optional so the headless
   * harness can drive the scene without one.
   */
  onInteract?: (b: WorldBuilding) => void;
  /** Dev/e2e only: freeze the scene in this rig pose (visual goldens). */
  freezeRig?: RigFreezePose;
  /**
   * Dev/e2e only (?moverface=…): pin every patrol's INITIAL facing at
   * creation. Combined with freezeRig — patrols never tick, so facing can
   * never flip back — it exposes the scale(-1,1) mirrored mover draw path
   * to the pixel goldens (npc-mover-shots.spec.ts). Never set in gameplay:
   * unfrozen patrols overwrite facing on their first moving tick.
   */
  freezeMoverFacing?: 1 | -1;
}

/**
 * Dev/e2e freeze hook (?rigfreeze=…) for the aru-rig visual goldens: pins
 * the rig pose + facing at creation and turns update() into a no-op, so a
 * screenshot sees the SAME pixels every frame of every run — no idle sway,
 * no patrol movers, no camera easing, t frozen at 0. Never set in gameplay.
 */
export interface RigFreezePose {
  /** Walk-cycle phase in rad (π/2 = mid-stride, sin = 1). */
  phase: number;
  /** 0 = full idle pose … 1 = full walk pose. */
  blend: number;
  /** Idle-sway phase in rad; defaults to 0 (the near-rest sway point). */
  idlePhase?: number;
  running?: boolean;
  facing?: 1 | -1;
}

/** Observation seam for headless verify scripts + ?debug mirroring. */
export interface VillageDebugState {
  /** Aru's feet in world px. */
  pos: Vec2;
  /** Rounded draw camera (integer px) — what render() and overlays use. */
  cam: Vec2;
  facing: 1 | -1;
  moving: boolean;
  /** Building Aru can enter with E right now (anchor proximity), or null. */
  prompt: WorldBuilding | null;
  /** NPC whose bubble opens because Aru stands nearby (NPC_RANGE), or null. */
  voiceNpc: WorldNpc | null;
  /** Live patrol movers by NPC id (Task 7) — empty when nothing patrols.
   *  x/y is the live position; facing/moving mirror the machine so the
   *  conversation-hold asserts (Task 39) can watch a held mover turn
   *  toward Aru and stop stepping. Plain Vec2 readers keep working. */
  movers: Record<string, Vec2 & { facing: 1 | -1; moving: boolean }>;
  /** The gait wobble each mover's draw applies right now — exactly {0,0} at
   *  rest. Exposed so the headless verify proves footsteps can't silently die. */
  moverGait: Record<string, NpcGait>;
  /** Walk-cycle phase (rad) — advances only with ground actually covered. */
  rigPhase: number;
  /** Rig pose blend: 0 idle sway … 1 full walk cycle. */
  rigBlend: number;
  /** Always false — villages aren't winnable; kept for scene-harness compat. */
  won: boolean;
}

export interface VillageScene extends Scene {
  debugState(): VillageDebugState;
}

/** Same visual grounding as the DOM walk renderer: 84px tall, feet-anchored. */
const SPRITE_H = 84;
/** DOM bob is 0.32s ease alternate → one full up-down cycle every 0.64s. */
const BOB_CYCLE_S = 0.64;

export function createVillageScene({
  config,
  walk,
  images,
  npcSprites,
  spawn,
  onInteract,
  freezeRig,
  freezeMoverFacing,
}: VillageSceneArgs): VillageScene {
  const levelW = config.imageSize.w;
  const levelH = config.imageSize.h;
  const isWalkable = makeIsWalkable(walk);

  // Task 7: one patrol machine per waypointed NPC (statics return null).
  // moverIndex = patrols.length so first departures stagger mover-by-mover.
  const patrols: NpcPatrol[] = [];
  for (const n of config.npcs) {
    const p = createNpcPatrol(n, isWalkable, patrols.length, freezeMoverFacing ?? 1);
    if (p) patrols.push(p);
  }

  // NPC list with patrol movers at their LIVE positions (statics pass
  // through untouched) — voice proximity must track the walking figure,
  // not the empty patched spot where it used to be painted.
  const liveNpcs = (): WorldNpc[] => {
    if (patrols.length === 0) return config.npcs;
    const live = new Map(patrols.map(p => [p.npc.id, p.state().pos]));
    return config.npcs.map(n => {
      const lp = live.get(n.id);
      return lp ? { ...n, position: lp } : n;
    });
  };

  let pos: Vec2 = { ...(spawn ?? walk.spawn) };
  let facing: 1 | -1 = 1;
  let moving = false;
  let running = false;
  let prompt: WorldBuilding | null = null;
  let voiceNpc: WorldNpc | null = null;
  let t = 0;
  const rig = createRigState();

  // Golden-shot freeze (see RigFreezePose): pin the pose before the first
  // frame so every render — first to last — draws identical pixels.
  const frozen = !!freezeRig;
  if (freezeRig) {
    rig.phase = freezeRig.phase;
    rig.idlePhase = freezeRig.idlePhase ?? 0;
    rig.blend = freezeRig.blend;
    facing = freezeRig.facing ?? 1;
    running = freezeRig.running ?? false;
  }

  // Lock B: level width === stage width, so cam.x is always 0 — the camera
  // only travels vertically, clamped so the view never leaves the painting.
  // The target anchors on `pos` — Aru's feet/ground point (the same point
  // the sprite grounds on and the collision box centers on), never a sprite
  // corner (PRD Task 5).
  const camTarget = (): Vec2 => followCamera(pos, levelW, levelH, STAGE_W, STAGE_H);
  // Damped follow (PRD Task 6): the FLOAT camera eases toward the target;
  // draw code rounds it. Starts snapped so entering a world never plays a
  // catch-up swoop.
  let camF: Vec2 = camTarget();

  return {
    update(dt: number, input: GameInput) {
      // Frozen for a visual golden: nothing advances — not time (mover bob),
      // not the rig, not patrols, not the camera, not proximity prompts.
      if (frozen) return;
      t += dt;
      const dir = input.getDir();
      moving = dir.x !== 0 || dir.y !== 0;
      // `?.` — the headless harness input stub may omit isRunning.
      running = moving && (input.isRunning?.() ?? false);
      let movedPx = 0;
      if (moving) {
        const speed = WALK_SPEED * (running ? RUN_MULTIPLIER : 1);
        const prev = pos;
        pos = moveActor(pos, dir, speed, dt, WALK_TILE, isWalkable, ARU_HALF_W, ARU_HALF_H);
        movedPx = Math.hypot(pos.x - prev.x, pos.y - prev.y);
        if (dir.x !== 0) facing = dir.x < 0 ? -1 : 1;
      }
      // Rig phase is DISTANCE-driven (Rig PRD Task 2): a wall-blocked push
      // covers 0px, so the legs stop swinging and the pose blends to idle.
      advanceRig(rig, movedPx, dt);
      // Damped camera follow (PRD Task 6) — ease toward the target, keep
      // the float; render() rounds. Fixed-step keeps the ease rate stable.
      camF = dampCamera(camF, camTarget());
      // Task 7: patrols advance even while Aru stands still — the village
      // moves on its own. Ticked BEFORE proximity so voice sees live spots.
      // Task 39: the mover whose voice bubble is open (voiceNpc from the
      // PREVIOUS tick — one fixed step of lag, invisible at 60Hz and
      // self-stabilizing: a held mover stays put, so it stays nearest)
      // holds in place and faces Aru instead of strolling off mid-sentence;
      // every other patrol walks on.
      for (const p of patrols) p.tick(dt, voiceNpc?.id === p.npc.id ? pos : null);
      // Proximity + E run EVERY tick, moving or not — a kid standing still
      // at a doorway must still see the prompt and be able to enter.
      prompt = nearestAnchorBuilding(pos, config.buildings);
      voiceNpc = nearestVoiceNpc(pos, liveNpcs());
      // Drain the edge-triggered press even when nothing is in range
      // (DOM-hook parity: a press in the open must not fire later at a door).
      const pressed = input.consumeAction?.() ?? false;
      if (pressed && prompt) onInteract?.(prompt);
    },

    render(ctx: CanvasRenderingContext2D) {
      // Integer camera for every draw offset (PRD Tasks 4 + 6.2: round
      // AFTER damping) — sub-pixel translates shimmer the scaled painting.
      const cam = roundCamera(camF);
      // Defensive clear — the clamped camera should always be fully covered
      // by the painting, so any visible dark band = a camera bug, not art.
      ctx.fillStyle = '#0b0805';
      ctx.fillRect(0, 0, STAGE_W, STAGE_H);
      ctx.save();
      ctx.translate(-cam.x, -cam.y);
      // Destination size pinned to config.imageSize (not the file's natural
      // size) so a mis-exported art file distorts visibly instead of
      // silently shifting the collision alignment.
      ctx.drawImage(images.art, 0, 0, levelW, levelH);

      // Actors paint back-to-front by feet Y (Task 7) so Aru passes in
      // front of a mover standing higher up the street and behind one below.
      const actors: { y: number; draw: () => void }[] = [];

      patrols.forEach(p => {
        const meta = npcSprites?.[p.npc.id];
        if (!meta) return; // no cut registered: logic-only mover
        const s = p.state();
        actors.push({
          y: s.pos.y,
          draw: () => {
            // Distance-driven gait (world-walk.patrolGait): a tiny lift +
            // sway only while ground is actually covered — exactly {0,0} at
            // rest, so the frozen home goldens keep byte-identical pixels.
            const gait = patrolGait(s);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(s.pos.x, s.pos.y + 2, meta.w * 0.26, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Feet-pivot transform: translate to the anchor point, sway
            // there, mirror inside the swayed frame. Mirroring around the
            // anchor keeps the feet planted: under scale(-1,1) the SAME -ax
            // offset yields the reflected span — and with gait {0,0} this
            // matrix equals the pre-gait draw exactly.
            ctx.save();
            ctx.translate(s.pos.x, s.pos.y + gait.bob);
            if (gait.tilt !== 0) ctx.rotate(gait.tilt);
            if (s.facing === -1) ctx.scale(-1, 1);
            ctx.drawImage(meta.img, -meta.ax, -meta.ay, meta.w, meta.h);
            ctx.restore();
          },
        });
      });

      // Aru — feet-anchored, same grounding as the DOM renderer (84px
      // sprite, soft shadow). The rig uses five full-frame cutouts, so every
      // piece shares the original sprite's frame coordinates and the feet
      // never move when a limb rotates.
      const { x, y } = pos;
      actors.push({
        y,
        draw: () => {
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.beginPath();
          ctx.ellipse(x, y + 2, 18, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          const rigImages = images.aruRig;
          if (!rigImages) {
            // Safe fallback for old callers and the headless harness.
            const aru = images.aru;
            const w = (aru.width / Math.max(1, aru.height)) * SPRITE_H;
            const bob = moving
              ? -3 * Math.abs(Math.sin((t * Math.PI * 2) / BOB_CYCLE_S))
              : 0;
            ctx.save();
            if (facing === -1) {
              ctx.translate(x, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(aru, -w / 2, y - SPRITE_H + bob, w, SPRITE_H);
            } else {
              ctx.drawImage(aru, x - w / 2, y - SPRITE_H + bob, w, SPRITE_H);
            }
            ctx.restore();
            return;
          }

          const pose = rigPose(rig, running);
          const scale = SPRITE_H / RIG_FRAME.h;
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(facing * scale, scale);
          for (const piece of RIG_PIECES) {
            const image = rigImages[piece.id];
            const bob = piece.bobs ? pose.bob : 0;
            const px = piece.pivot.x - RIG_FEET.x;
            const py = piece.pivot.y - RIG_FEET.y;
            ctx.save();
            ctx.translate(0, bob);
            ctx.translate(px, py);
            ctx.rotate(pose.angles[piece.id]);
            ctx.translate(-px, -py);
            ctx.drawImage(image, -RIG_FEET.x, -RIG_FEET.y, RIG_FRAME.w, RIG_FRAME.h);
            ctx.restore();
          }
          ctx.restore();
        },
      });

      actors.sort((a, b) => a.y - b.y);
      for (const a of actors) a.draw();
      ctx.restore();
    },

    hud(): SceneHud {
      return {
        objective: 'Village ghoomo',
        hint: 'WASD ya Arrows — chalo · Shift — daudo',
        won: false,
      };
    },

    debugState(): VillageDebugState {
      const movers: VillageDebugState['movers'] = {};
      const moverGait: Record<string, NpcGait> = {};
      for (const p of patrols) {
        const s = p.state();
        movers[p.npc.id] = { x: s.pos.x, y: s.pos.y, facing: s.facing, moving: s.moving };
        moverGait[p.npc.id] = patrolGait(s);
      }
      return {
        pos: { ...pos },
        cam: roundCamera(camF),
        facing,
        moving,
        prompt,
        voiceNpc,
        movers,
        moverGait,
        rigPhase: rig.phase,
        rigBlend: rig.blend,
        won: false,
      };
    },
  };
}
