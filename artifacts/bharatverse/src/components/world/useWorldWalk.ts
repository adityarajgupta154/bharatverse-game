import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useGameInput, type GameInputControls } from '@/game/engine/input';
import { useGameLoop } from '@/game/engine/loop';
import { moveActor } from '@/game/engine/movement';
import { followCamera } from '@/game/engine/camera';
import { RUN_MULTIPLIER, type Vec2 } from '@/game/engine/types';
import { STAGE_W, STAGE_H } from '@/lib/stage';
import {
  ARU_HALF_H,
  ARU_HALF_W,
  WALK_SPEED,
  WALK_TILE,
  makeIsWalkable,
  nearestPromptBuilding,
  nearestVoiceNpc,
} from '@/game/world-walk';
import type { WorldBuilding, WorldConfig, WorldWalkConfig } from '@/game/world-types';

/**
 * Village walking (Task: let Aru walk the village) — drives Aru + the camera
 * for worlds that declare a walk config. Reuses the minigame engine as-is:
 * useGameInput (WASD/arrows/joystick + E + Shift-run), useGameLoop (fixed
 * 60Hz), moveActor (mask collision), followCamera (clamped follow).
 *
 * Rendering is DOM, not canvas: the loop mutates the painting layer's and
 * Aru's transforms directly via refs (no React state at 60Hz). React state
 * changes only on discrete events — prompt building enters/leaves range,
 * voice NPC changes, facing flips, moving starts/stops — plus a throttled
 * camera value for the pan indicator and NPC bubble flip logic.
 *
 * IMPORTANT: the layer/Aru elements must NOT set `transform` in their JSX
 * style — React would clobber the loop's writes on unrelated re-renders.
 */
export interface UseWorldWalkArgs {
  /** null = world has no walking — the hook stays dormant (hooks must not be conditional). */
  walk: WorldWalkConfig | null;
  config: WorldConfig | null;
  /** false while a building card / exit veil is up — freezes Aru, keeps render. */
  enabled: boolean;
  /** ?spawn=x,y override (dev + e2e); ignored unless it lands on a walkable tile. */
  spawnOverride?: Vec2 | null;
  /** ?debug — mirrors {x,y,prompt,npc} to window.__bhvWalk for e2e/authoring. */
  debug?: boolean;
  layerRef: React.RefObject<HTMLDivElement | null>;
  aruRef: React.RefObject<HTMLDivElement | null>;
  /** E pressed while a building is in range (same path as clicking its hotspot). */
  onInteract: (b: WorldBuilding) => void;
}

export interface WorldWalkState {
  /** Building Aru can enter right now (E-prompt target), or null. */
  prompt: WorldBuilding | null;
  /** NPC whose bubble is open because Aru stands nearby, or null. */
  voiceNpcId: string | null;
  moving: boolean;
  facing: 1 | -1;
  /** Camera scroll (throttled ~8Hz) for the pan indicator + bubble flip. */
  camY: number;
  controls: GameInputControls;
}

const CAM_PUSH_MS = 120;

export function useWorldWalk({
  walk,
  config,
  enabled,
  spawnOverride,
  debug,
  layerRef,
  aruRef,
  onInteract,
}: UseWorldWalkArgs): WorldWalkState {
  const live = !!walk && !!config;
  const isWalkable = useMemo(
    () => (walk ? makeIsWalkable(walk) : () => false),
    [walk]
  );

  const spawn = useMemo<Vec2>(() => {
    if (
      walk &&
      spawnOverride &&
      isWalkable(
        Math.floor(spawnOverride.x / WALK_TILE),
        Math.floor(spawnOverride.y / WALK_TILE)
      )
    ) {
      return spawnOverride;
    }
    return walk?.spawn ?? { x: 0, y: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walk, isWalkable]); // spawnOverride is read once per world entry on purpose

  const camFor = (p: Vec2) =>
    config ? followCamera(p, STAGE_W, config.imageSize.h, STAGE_W, STAGE_H).y : 0;

  const pos = useRef<Vec2>({ ...spawn });
  const promptRef = useRef<WorldBuilding | null>(null);
  const voiceRef = useRef<string | null>(null);
  const movingRef = useRef(false);
  const facingRef = useRef<1 | -1>(1);
  const camRef = useRef(camFor(spawn));
  const lastCamPush = useRef(0);
  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;

  const [prompt, setPrompt] = useState<WorldBuilding | null>(null);
  const [voiceNpcId, setVoiceNpcId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [camY, setCamY] = useState(camRef.current);

  const controls = useGameInput(enabled && live);

  // Fresh world (or spawn change) → snap Aru + camera + interaction state.
  useEffect(() => {
    if (!live) return;
    pos.current = { ...spawn };
    camRef.current = camFor(spawn);
    promptRef.current = null;
    voiceRef.current = null;
    movingRef.current = false;
    facingRef.current = 1;
    setPrompt(null);
    setVoiceNpcId(null);
    setMoving(false);
    setFacing(1);
    setCamY(camRef.current);
    applyTransforms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, config?.nodeId, spawn]);

  function applyTransforms() {
    const layer = layerRef.current;
    if (layer)
      layer.style.transform = `translate3d(0, ${-Math.round(camRef.current)}px, 0)`;
    const aru = aruRef.current;
    if (aru)
      aru.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
  }

  // Paint the very first frame from refs (loop render also does this every frame).
  useLayoutEffect(() => {
    if (live) applyTransforms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  useGameLoop(
    enabled && live,
    dt => {
      if (!config) return;
      const input = controls.input;
      const dir = input.getDir();
      const wasMoving = movingRef.current;
      const movingNow = dir.x !== 0 || dir.y !== 0;
      if (movingNow) {
        const speed = WALK_SPEED * (input.isRunning() ? RUN_MULTIPLIER : 1);
        pos.current = moveActor(
          pos.current,
          dir,
          speed,
          dt,
          WALK_TILE,
          isWalkable,
          ARU_HALF_W,
          ARU_HALF_H
        );
        if (dir.x !== 0) {
          const f: 1 | -1 = dir.x < 0 ? -1 : 1;
          if (f !== facingRef.current) {
            facingRef.current = f;
            setFacing(f);
          }
        }
      }
      if (movingNow !== wasMoving) {
        movingRef.current = movingNow;
        setMoving(movingNow);
      }

      const p = nearestPromptBuilding(pos.current, config.buildings);
      if ((p?.id ?? null) !== (promptRef.current?.id ?? null)) {
        promptRef.current = p;
        setPrompt(p);
      }
      const npc = nearestVoiceNpc(pos.current, config.npcs);
      const npcId = npc?.id ?? null;
      if (npcId !== voiceRef.current) {
        voiceRef.current = npcId;
        setVoiceNpcId(npcId);
      }

      if (input.consumeAction() && promptRef.current) {
        onInteractRef.current(promptRef.current);
      }
    },
    () => {
      // Dormant (non-walk world): never touch the DOM — React owns the
      // painting transform there.
      if (!live) return;
      camRef.current = camFor(pos.current);
      applyTransforms();
      const now = performance.now();
      if (now - lastCamPush.current > CAM_PUSH_MS) {
        lastCamPush.current = now;
        setCamY(c => (Math.abs(c - camRef.current) > 0.5 ? camRef.current : c));
      }
      if (debug) {
        (window as unknown as Record<string, unknown>).__bhvWalk = {
          x: Math.round(pos.current.x),
          y: Math.round(pos.current.y),
          prompt: promptRef.current?.id ?? null,
          npc: voiceRef.current,
        };
      }
    }
  );

  return { prompt, voiceNpcId, moving, facing, camY, controls };
}
