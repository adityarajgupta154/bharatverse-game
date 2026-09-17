import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { STAGE_W, STAGE_H } from '@/lib/stage';
import { useGameLoop } from '@/game/engine/loop';
import { useLoadedImages } from '@/game/engine/sprites';
import type { GameInput } from '@/game/engine/input';
import type { Vec2 } from '@/game/engine/types';
import {
  createVillageScene,
  type RigFreezePose,
  type VillageScene,
} from '@/game/worlds/village-scene';
import type { WorldBuilding, WorldConfig, WorldNpc, WorldWalkConfig } from '@/game/world-types';
import aruSprite from '@/assets/images/aru-sprite-cut.png';
import aruRigTorso from '@/assets/images/aru-rig/torso.png';
import aruRigArmL from '@/assets/images/aru-rig/armL.png';
import aruRigArmR from '@/assets/images/aru-rig/armR.png';
import aruRigLegL from '@/assets/images/aru-rig/legL.png';
import aruRigLegR from '@/assets/images/aru-rig/legR.png';
import { MoverNpcHotspot } from './NpcLayer';
import type { NpcSpriteDef } from './npc-sprites';

/**
 * VillageCanvas (Movement Bridge PRD Tasks 3+5) — the slim canvas host that
 * NodeWorldScreen mounts when a world's walkRenderer resolves to 'canvas'.
 * Owns ONLY the canvas plumbing (image preload, DPR fit, fixed-step loop)
 * plus the loop-positioned DOM overlays: the world-space layer that carries
 * the screen's invisible building hotspots (children), and the Aru-anchored
 * box with the a11y marker + E-prompt bubble. All world/game logic lives in
 * village-scene.ts; surrounding chrome (HUD, joystick, BuildingCard, aria
 * container) stays in NodeWorldScreen.
 */
export interface VillageCanvasProps {
  config: WorldConfig;
  walk: WorldWalkConfig;
  /** Resolved painting URL (WorldEntry.art). */
  art: string;
  /** Start position (already spawn-override-resolved by the screen). */
  spawn: Vec2;
  /** Shared engine input (NodeWorldScreen owns the instance + joystick UI). */
  input: GameInput;
  /** false while a card/veil is up — freezes update, keeps rendering. */
  enabled: boolean;
  /** ?debug — mirrors the scene's debugState to window.__bhvWalk. */
  debug?: boolean;
  /** Dev/e2e (?rigfreeze=…): freeze the scene in a fixed rig pose for the
   *  visual goldens. Implies the __bhvWalk mirror (shots need pos+cam). */
  freezeRig?: RigFreezePose;
  /** Dev/e2e (?moverface=…): pin patrol movers' initial facing at scene
   *  creation so the frozen mover goldens can capture the mirrored
   *  scale(-1,1) draw path (see village-scene.ts). Never set in gameplay. */
  freezeMoverFacing?: 1 | -1;
  /** Throttled camera-Y push (~8Hz) for the shared pan indicator. */
  onCamY?: (y: number) => void;
  /** E pressed with a building in anchor range (Task 5) — opens its card. */
  onInteract: (b: WorldBuilding) => void;
  /** Discrete change of the NPC Aru stands near (Task 6) — id or null. */
  onVoiceNpc?: (id: string | null) => void;
  /** Patrol movers (Task 7): waypointed NPCs + their registered cut sprites.
   *  Their hotspots render INSIDE this host (loop-tracked), so the screen
   *  must filter them out of its static NpcLayer. */
  movers?: { npc: WorldNpc; sprite: NpcSpriteDef }[];
  /** World-space overlay content: the screen's NodeBuilding hotspots. */
  children?: ReactNode;
}

const CAM_PUSH_MS = 120;

export function VillageCanvas({
  config,
  walk,
  art,
  spawn,
  input,
  enabled,
  debug,
  freezeRig,
  freezeMoverFacing,
  onCamY,
  onInteract,
  onVoiceNpc,
  movers,
  children,
}: VillageCanvasProps) {
  // Same loader as the minigames: cached, and a load failure throws to the
  // error boundary instead of silently rendering a black village. Mover cut
  // sprites load with the painting — all-or-nothing.
  const imageSrcs = useMemo(() => {
    const srcs: Record<string, string> = {
      art,
      aru: aruSprite,
      'aru-rig:torso': aruRigTorso,
      'aru-rig:armL': aruRigArmL,
      'aru-rig:armR': aruRigArmR,
      'aru-rig:legL': aruRigLegL,
      'aru-rig:legR': aruRigLegR,
    };
    for (const m of movers ?? []) srcs[`npc:${m.npc.id}`] = m.sprite.src;
    return srcs;
  }, [art, movers]);
  const images = useLoadedImages(imageSrcs);
  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;
  const onVoiceNpcRef = useRef(onVoiceNpc);
  onVoiceNpcRef.current = onVoiceNpc;
  const voiceIdRef = useRef<string | null>(null);
  const scene = useMemo<VillageScene | null>(
    () =>
      images
        ? createVillageScene({
            config,
            walk,
            images: {
              art: images.art,
              aru: images.aru,
              aruRig: {
                torso: images['aru-rig:torso'],
                armL: images['aru-rig:armL'],
                armR: images['aru-rig:armR'],
                legL: images['aru-rig:legL'],
                legR: images['aru-rig:legR'],
              },
            },
            npcSprites: Object.fromEntries(
              (movers ?? []).map(m => [
                m.npc.id,
                {
                  img: images[`npc:${m.npc.id}`],
                  w: m.sprite.w,
                  h: m.sprite.h,
                  ax: m.sprite.ax,
                  ay: m.sprite.ay,
                },
              ])
            ),
            spawn,
            // Ref-indirected so a new callback identity (screen re-render)
            // never tears down + respawns the running scene.
            onInteract: b => onInteractRef.current(b),
            freezeRig,
            freezeMoverFacing,
          })
        : null,
    [images, config, walk, spawn, movers, freezeRig, freezeMoverFacing]
  );

  const sceneRef = useRef<VillageScene | null>(null);
  sceneRef.current = scene;
  const inputRef = useRef(input);
  inputRef.current = input;
  const onCamYRef = useRef(onCamY);
  onCamYRef.current = onCamY;
  const lastCamPush = useRef(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const aruBoxRef = useRef<HTMLDivElement>(null);

  // Discrete prompt state for the bubble text — changes only when the target
  // building changes (same pattern as the DOM hook), never at 60Hz.
  const [prompt, setPrompt] = useState<WorldBuilding | null>(null);
  const promptIdRef = useRef<string | null>(null);

  // Task 7: mover bubbles open by proximity INSIDE this host (statics still
  // go through the screen's NpcLayer via onVoiceNpc) — discrete state, set
  // only when the scene's voice id actually changes, never at 60Hz.
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const moverRefs = useRef(new Map<string, HTMLDivElement | null>());
  // Canvas mode has no drag-pan, so mover taps are never move-suppressed.
  const noDragRef = useRef({ moved: false });

  // Backing store = on-screen size (stage scale × DPR) so the painting stays
  // crisp at every viewport size — same fit as GameScreen.
  useEffect(() => {
    function fit() {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useGameLoop(
    enabled && !!scene,
    dt => {
      sceneRef.current?.update(dt, inputRef.current);
    },
    () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.setTransform(canvas.width / STAGE_W, 0, 0, canvas.height / STAGE_H, 0, 0);
       ctx.imageSmoothingEnabled = true;
       ctx.imageSmoothingQuality = 'high';
      const sc = sceneRef.current;
      if (!sc) {
        ctx.fillStyle = '#0b0805';
        ctx.fillRect(0, 0, STAGE_W, STAGE_H);
        return;
      }
      sc.render(ctx);

      const st = sc.debugState();
      // Loop-owned overlay transforms (Task 5 review advisory): hotspots and
      // the Aru box track the camera EVERY frame, straight from the scene —
      // never the throttled onCamY push, which would lag hit-targets behind
      // the painting. Never set in JSX (React would clobber these writes).
      const overlay = overlayRef.current;
      if (overlay) {
        overlay.style.transform = `translate3d(0, ${-st.cam.y}px, 0)`;
      }
      const aruBox = aruBoxRef.current;
      if (aruBox) {
        aruBox.style.transform = `translate3d(${st.pos.x}px, ${
          st.pos.y - st.cam.y
        }px, 0)`;
      }
      // Mover hotspots ride the SAME loop writes as the Aru box — world
      // space only (the overlay parent already carries the camera).
      for (const [id, el] of moverRefs.current) {
        const p = st.movers[id];
        if (el && p) el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      }
      const pid = st.prompt?.id ?? null;
      if (pid !== promptIdRef.current) {
        promptIdRef.current = pid;
        setPrompt(st.prompt);
      }
      // Voice NPC is discrete too — the screen mirrors it into NpcLayer's
      // proximity source (same flow as the DOM hook's voiceNpcId state).
      const vid = st.voiceNpc?.id ?? null;
      if (vid !== voiceIdRef.current) {
        voiceIdRef.current = vid;
        setVoiceId(vid);
        onVoiceNpcRef.current?.(vid);
      }
      const now = performance.now();
      if (now - lastCamPush.current > CAM_PUSH_MS) {
        lastCamPush.current = now;
        onCamYRef.current?.(st.cam.y);
      }
      if (debug || freezeRig) {
        const moverPx: Record<string, { x: number; y: number }> = {};
        for (const [id, p] of Object.entries(st.movers))
          moverPx[id] = { x: Math.round(p.x), y: Math.round(p.y) };
        (window as unknown as Record<string, unknown>).__bhvWalk = {
          x: Math.round(st.pos.x),
          y: Math.round(st.pos.y),
          // Rounded draw camera — the golden spec turns (x, y, camY) into
          // its screenshot crop around Aru.
          camY: st.cam.y,
          prompt: pid,
          npc: vid,
          movers: moverPx,
          renderer: 'canvas',
        };
      }
    }
  );

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        data-testid="village-canvas"
        aria-hidden
        className="absolute inset-0 w-full h-full"
      />
      {/* World-space overlay: full painting height, camera-tracked by the
          loop. Carries the same invisible NodeBuilding hotspots as the DOM
          renderer, so clicks/tab/aria work identically in canvas mode. */}
      <div
        ref={overlayRef}
        className="absolute left-0 top-0 w-[1024px] will-change-transform"
        style={{ height: config.imageSize.h }}
      >
        {scene && children}
        {/* Task 7 movers: wrapper transforms are LOOP-OWNED. The initial
            home position is set once in the ref callback — no style prop in
            JSX, so React re-renders never clobber the live transform. */}
        {scene &&
          (movers ?? []).map((m, i) => (
            <div
              key={m.npc.id}
              ref={el => {
                moverRefs.current.set(m.npc.id, el);
                if (el && !el.style.transform)
                  el.style.transform = `translate3d(${m.npc.position.x}px, ${m.npc.position.y}px, 0)`;
              }}
              className="absolute left-0 top-0 will-change-transform"
            >
              <MoverNpcHotspot
                npc={m.npc}
                index={20 + i}
                debug={debug}
                suppressRef={noDragRef}
                voiceOpen={voiceId === m.npc.id}
              />
            </div>
          ))}
      </div>
      {/* Aru-anchored box (screen space): a11y/e2e marker + E-prompt bubble.
          The bubble markup/testid matches the DOM renderer exactly. */}
      {scene && (
        <div
          ref={aruBoxRef}
          className="absolute left-0 top-0 z-20 pointer-events-none will-change-transform"
        >
          {/* Contract C: e2e/a11y observe walking through this position-
              tracked marker (opacity trick, NOT 0x0 — bounding boxes stay
              real). The visible Aru is painted on the canvas above. */}
          <img
            src={aruSprite}
            alt="Aru"
            data-testid="aru-walk"
            draggable={false}
            className="absolute left-0 top-0 h-[84px] w-auto max-w-none pointer-events-none select-none"
            style={{ opacity: 0.01, transform: 'translate(-50%, -100%)' }}
          />
          {prompt && (
            <div
              data-testid="walk-prompt"
              className="absolute -translate-x-1/2 top-[-124px] whitespace-nowrap rounded-full border border-primary/70 bg-black/85 px-[10px] py-[4px] text-[8px] font-bold uppercase tracking-widest text-primary"
            >
              E — Andar jao · {prompt.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
