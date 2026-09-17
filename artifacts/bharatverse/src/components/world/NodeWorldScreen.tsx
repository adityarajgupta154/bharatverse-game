import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAGE_H } from '@/lib/stage';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { useGame } from '@/game/store';
import { RiftVeil, useRiftNavigate, consumeRiftFlag } from './RiftTransition';
import { getWorld, deriveBuildingState, initiallyCompleted } from '@/game/worlds';
import { getGameForRouteTarget } from '@/game/games';
import { getDiscoveryForRouteTarget } from '@/game/content';
import type { WorldBuilding, BuildingState } from '@/game/world-types';
import { InfoPanel } from '@/components/hub/InfoPanel';
import { SmritiDialogue } from '@/components/hub/SmritiDialogue';
import { LegendBar } from '@/components/hub/LegendBar';
import { RightControls } from '@/components/hub/RightControls';
import { NodeBuilding } from './NodeBuilding';
import { BuildingCard } from './BuildingCard';
import { FactCard } from './FactCard';
import { NpcLayer } from './NpcLayer';
import { VirtualJoystick } from '@/components/game/VirtualJoystick';
import { useWorldWalk } from './useWorldWalk';
import { VillageCanvas } from './VillageCanvas';
import type { RigFreezePose } from '@/game/worlds/village-scene';
import { NPC_SPRITE_DEFS } from './npc-sprites';
import { useGameInput } from '@/game/engine/input';
import type { Vec2 } from '@/game/engine/types';
import { WALK_TILE, makeIsWalkable } from '@/game/world-walk';
import aruSprite from '@/assets/images/aru-sprite-cut.png';

/**
 * NodeWorldScreen (PRD Task 8): the GENERIC inner-world template. Takes a
 * `nodeId` prop and renders that node's world entirely from the registry —
 * the reference painting 1:1 in stage px as a vertically pannable canvas,
 * the Hub's pinned HUD (info panel, Smriti, legend, filter/rift) on top,
 * and config-driven building/NPC hotspots that scroll with the art.
 * No node-specific logic belongs here: standing up a new node's village is
 * config + art only (see game/worlds/index.ts for the how-to).
 */
export function NodeWorldScreen({ nodeId }: { nodeId: string }) {
  const [, setLocation] = useLocation();
  const { state, selectNode, markBuildingComplete, restoreNode } = useGame();
  const reducedMotion = useReducedMotion();
  const { leavingFrom, go } = useRiftNavigate();
  // Clear our handshake flag (we always play our own entry reveal below).
  useState(() => consumeRiftFlag(`/world/${nodeId}`));
  const world = getWorld(nodeId);
  // Entry gate: the world must exist AND its map node must be unlocked —
  // mirrors Chapter.tsx so a direct URL can't bypass progression.
  const node = state.nodes.find(n => n.id === nodeId);
  const canEnter = !!world && !!node && node.status !== 'locked';

  const maxScroll = world ? Math.max(0, world.config.imageSize.h - STAGE_H) : 0;
  // Reactive search params (review fix): an in-app navigation that only
  // changes the query (?walk=, ?spawn=) must re-resolve the renderer —
  // window.location read inside a memo is frozen at whichever render ran it.
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  // Dev-only: ?at=<worldY> pins the initial pan position (hotspot calibration).
  const atParam = params.get('at');
  const initialAt =
    atParam !== null && Number.isFinite(Number(atParam))
      ? Math.max(0, Math.min(maxScroll, Number(atParam)))
      : maxScroll;
  // Enter the world at the city gate (bottom of the painting).
  const [scrollY, setScrollY] = useState(initialAt);
  const [active, setActive] = useState<{ b: WorldBuilding; s: BuildingState } | null>(null);
  // Activation card → its written discovery (fact card / recap) when opened.
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [smritiLine, setSmritiLine] = useState(world ? world.config.lines.welcome : '');

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ down: false, startY: 0, startScroll: 0, scaleY: 1, moved: false });

  const debug = params.has('debug');
  const coarsePointer = useMemo(
    () => window.matchMedia('(pointer: coarse)').matches,
    []
  );
  // Dev/e2e: ?spawn=x,y places Aru (only honored on a walkable tile).
  // Keyed on the param STRING so the object identity only changes when the
  // value actually does (useWorldWalk keeps it in its effect deps).
  const spawnParam = params.get('spawn');
  const spawnOverride = useMemo(() => {
    if (!spawnParam) return null;
    const [x, y] = spawnParam.split(',').map(Number);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
  }, [spawnParam]);
  // Dev/e2e: ?rigfreeze=phase,blend,run,facing freezes the canvas scene in
  // a fixed rig pose for the visual goldens (aru-rig-shots.spec.ts) — same
  // spirit as ?spawn/?at/?walk. Malformed values are ignored.
  const rigFreezeParam = params.get('rigfreeze');
  const freezeRig = useMemo<RigFreezePose | null>(() => {
    if (rigFreezeParam === null) return null;
    const [phase, blend, run, face] = rigFreezeParam.split(',').map(Number);
    if (!Number.isFinite(phase) || !Number.isFinite(blend)) return null;
    return {
      phase,
      blend: Math.max(0, Math.min(1, blend)),
      running: run === 1,
      facing: face === -1 ? -1 : 1,
    };
  }, [rigFreezeParam]);
  // Dev/e2e: ?moverface=-1 pins each patrol mover's INITIAL facing at scene
  // creation — with ?rigfreeze (patrols never tick, so facing never flips
  // back) the mover goldens capture the mirrored scale(-1,1) draw path
  // (npc-mover-shots.spec.ts). Values other than ±1 are ignored; a plain
  // primitive, so no memo needed. Never set in gameplay.
  const moverFaceParam = params.get('moverface');
  const freezeMoverFacing: 1 | -1 | undefined =
    moverFaceParam === '-1' ? -1 : moverFaceParam === '1' ? 1 : undefined;
  // Movement Bridge (Task 10): which renderer drives walk mode — registry
  // default (sindhu ships 'canvas'; 'dom' is the flag-gated fallback) with a
  // dev/e2e ?walk=canvas|dom override.
  // null = this world has no walking at all (classic scroll/drag panning).
  const walkRenderer = useMemo<'canvas' | 'dom' | null>(() => {
    if (!world?.walk) return null;
    const p = params.get('walk');
    if (p === 'canvas' || p === 'dom') return p;
    return world.walkRenderer ?? 'dom';
  }, [world, params]);
  const domWalk = walkRenderer === 'dom';
  const canvasWalk = walkRenderer === 'canvas';

  // Completed = authored story-completions + the player's persisted deltas.
  const completed = useMemo(() => {
    const set = new Set<string>(world ? initiallyCompleted(world.config) : []);
    if (world) {
      for (const id of state.completedBuildings[world.config.nodeId] ?? []) {
        set.add(id);
      }
    }
    return set;
  }, [world, state.completedBuildings]);

  const layerRef = useRef<HTMLDivElement>(null);
  const aruRef = useRef<HTMLDivElement>(null);
  // Village walking (worlds that declare a walk config): Aru + the camera run
  // on the shared 2D engine; classic worlds keep scroll/drag panning and this
  // hook stays dormant. E in range opens the same card as clicking.
  const walkState = useWorldWalk({
    // Canvas renderer active → this DOM hook stays fully dormant (walk: null).
    walk: domWalk ? world?.walk ?? null : null,
    config: world?.config ?? null,
    enabled: !!world && canEnter && !active && !leavingFrom,
    spawnOverride,
    debug,
    layerRef,
    aruRef,
    onInteract: b => handleActivate(b, deriveBuildingState(b, completed)),
  });
  const walkMode = walkRenderer !== null;

  // Canvas walk renderer (Task 3): its own input instance (the DOM hook's is
  // dormant then), a throttled camera-Y for the shared pan indicator, and the
  // same ?spawn override rule (only honored on a walkable tile).
  const canvasControls = useGameInput(canvasWalk && canEnter && !active && !leavingFrom);
  const [canvasCamY, setCanvasCamY] = useState(initialAt);
  // Task 6: NPC Aru stands near in canvas mode — feeds NpcLayer's proximity
  // bubble source, mirroring the DOM hook's voiceNpcId state.
  const [canvasVoiceNpc, setCanvasVoiceNpc] = useState<string | null>(null);
  // Task 7: waypointed NPCs with a registered cut sprite become canvas-mode
  // patrol movers; everyone else stays a static NpcLayer hotspot. In DOM
  // mode the split is moot — the legacy renderer keeps ALL of them static
  // (the figures are only patched out of walkArt, never out of world.art).
  const moverNpcs = useMemo(
    () =>
      (world?.config.npcs ?? [])
        .filter(n => (n.waypoints?.length ?? 0) > 0 && n.spriteId && NPC_SPRITE_DEFS[n.spriteId])
        .map(n => ({ npc: n, sprite: NPC_SPRITE_DEFS[n.spriteId!] })),
    [world]
  );
  const canvasSpawn = useMemo<Vec2 | null>(() => {
    if (!canvasWalk || !world?.walk) return null;
    const w = world.walk;
    if (
      spawnOverride &&
      makeIsWalkable(w)(
        Math.floor(spawnOverride.x / WALK_TILE),
        Math.floor(spawnOverride.y / WALK_TILE)
      )
    ) {
      return spawnOverride;
    }
    return w.spawn;
  }, [canvasWalk, world, spawnOverride]);
  const walkControls = canvasWalk ? canvasControls : walkState.controls;

  useEffect(() => {
    if (world && state.selectedNodeId !== world.config.nodeId) {
      selectNode(world.config.nodeId);
    }
  }, [world, state.selectedNodeId, selectNode]);

  useEffect(() => {
    if (!canEnter) setLocation('/');
  }, [canEnter, setLocation]);

  // Re-entering (or switching worlds) starts back at the gate.
  useEffect(() => {
    setScrollY(initialAt);
    setActive(null);
    setShowDiscovery(false);
    setSmritiLine(world?.config.lines.welcome ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, maxScroll]);

  if (!world || !canEnter) return null;

  const clamp = (v: number) => Math.max(0, Math.min(maxScroll, v));
  const lines = world.config.lines;
  // Walk mode: the loop writes the real transform straight to the DOM; this
  // throttled camera value only feeds the pan indicator + bubble flip logic.
  const viewY = canvasWalk ? canvasCamY : domWalk ? walkState.camY : scrollY;

  function handleActivate(b: WorldBuilding, s: BuildingState) {
    setActive({ b, s });
    setShowDiscovery(false);
    setSmritiLine(s === 'locked' ? lines.locked : lines.welcome);
  }

  const pendingNames = active
    ? active.b.unlocksAfter
        .filter(id => !completed.has(id))
        .map(id => world.config.buildings.find(x => x.id === id)?.name ?? id)
    : [];

  // Playable 2D game behind this building (Minigames Phase Task 0)?
  const activeGame =
    active && active.s !== 'locked' ? getGameForRouteTarget(active.b.routeTarget) : null;
  // Written discovery (fact card / story recap) behind it, when shipped.
  const activeDiscovery =
    active && active.s !== 'locked' ? getDiscoveryForRouteTarget(active.b.routeTarget) : null;

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {/* Pannable world canvas */}
      <div
        ref={containerRef}
        tabIndex={0}
        aria-label={
          walkMode
            ? 'Village — Aru ke saath ghoomo (WASD ya arrows)'
            : 'Village — scroll ya drag karke ghoomo'
        }
        className={cn(
          'absolute inset-0 overflow-hidden pointer-events-auto select-none touch-none focus:outline-none',
          walkMode ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
          !reducedMotion && 'animate-world-enter'
        )}
        onWheel={e => {
          if (walkMode) return; // camera is Aru-locked
          // Wheel deltas arrive in CSS px (or lines); convert to world px so
          // pan speed matches drag at every viewport scale.
          const rect = containerRef.current?.getBoundingClientRect();
          const scaleY = rect ? rect.height / STAGE_H : 1;
          const dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
          setScrollY(s => clamp(s + dy / scaleY));
        }}
        onPointerDown={e => {
          if (walkMode) return; // no drag-pan; dragRef.moved stays false so clicks work
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          const rect = containerRef.current?.getBoundingClientRect();
          dragRef.current = {
            down: true,
            startY: e.clientY,
            startScroll: scrollY,
            scaleY: rect ? rect.height / STAGE_H : 1,
            moved: false,
          };
        }}
        onPointerMove={e => {
          const d = dragRef.current;
          if (!d.down) return;
          const dy = e.clientY - d.startY;
          if (Math.abs(dy) > 6) d.moved = true;
          if (d.moved) setScrollY(clamp(d.startScroll - dy / d.scaleY));
        }}
        onPointerUp={() => {
          dragRef.current.down = false;
        }}
        onPointerLeave={() => {
          dragRef.current.down = false;
        }}
        onKeyDown={e => {
          if (walkMode) return; // arrows steer Aru via the engine's window listeners
          const step = (
            { ArrowUp: -60, ArrowDown: 60, PageUp: -500, PageDown: 500 } as Record<string, number>
          )[e.key];
          if (step !== undefined) {
            e.preventDefault();
            setScrollY(s => clamp(s + step));
          } else if (e.key === 'Home') {
            setScrollY(0);
          } else if (e.key === 'End') {
            setScrollY(maxScroll);
          }
        }}
      >
        {/* Canvas walk renderer (Movement Bridge): the scene draws painting +
            camera + Aru; building hotspots + the E-prompt ride its loop-owned
            overlay (Task 5). NPC overlays arrive in Task 6. */}
        {canvasWalk && world.walk && canvasSpawn && (
          <VillageCanvas
            config={world.config}
            walk={world.walk}
            art={world.walkArt ?? world.art}
            spawn={canvasSpawn}
            input={canvasControls.input}
            enabled={!active && !leavingFrom}
            debug={debug}
            freezeRig={freezeRig ?? undefined}
            freezeMoverFacing={freezeMoverFacing}
            onCamY={setCanvasCamY}
            onInteract={b => handleActivate(b, deriveBuildingState(b, completed))}
            onVoiceNpc={setCanvasVoiceNpc}
            movers={moverNpcs}
          >
            {world.config.buildings.map(b => {
              const s = deriveBuildingState(b, completed);
              return (
                <NodeBuilding
                  key={b.id}
                  building={b}
                  state={s}
                  filteredOut={!state.activeFilters.includes(s)}
                  debug={debug}
                  suppressRef={dragRef}
                  onActivate={handleActivate}
                />
              );
            })}
            {/* Same NpcLayer as the DOM renderer (hover/click/ambient bubbles
                all work unchanged); proximity comes from the scene via
                onVoiceNpc. scrollY only drives bubble flip — the throttled
                camY is fine for that (DOM mode passes the same). Patrol
                movers are filtered out: VillageCanvas renders their
                loop-tracked hotspots itself (Task 7). */}
            <NpcLayer
              npcs={world.config.npcs.filter(n => !moverNpcs.some(m => m.npc.id === n.id))}
              debug={debug}
              suppressRef={dragRef}
              scrollY={viewY}
              voiceNpcId={canvasVoiceNpc}
            />
          </VillageCanvas>
        )}
        {!canvasWalk && (
        <div
          ref={domWalk ? layerRef : undefined}
          className="absolute left-0 top-0 w-[1024px] will-change-transform"
          style={{
            height: world.config.imageSize.h,
            // Walk mode: the game loop owns this transform via direct DOM
            // writes — keeping it out of JSX stops React from clobbering the
            // camera on unrelated re-renders.
            ...(walkMode ? {} : { transform: `translate3d(0, ${-scrollY}px, 0)` }),
          }}
        >
          <img
            src={world.art}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full select-none pointer-events-none"
          />
          {world.config.buildings.map(b => {
            const s = deriveBuildingState(b, completed);
            return (
              <NodeBuilding
                key={b.id}
                building={b}
                state={s}
                filteredOut={!state.activeFilters.includes(s)}
                debug={debug}
                suppressRef={dragRef}
                onActivate={handleActivate}
              />
            );
          })}
          {/* NPCs sit above building zones: a villager in front of a building
              speaks on hover; the building stays clickable around them. */}
          <NpcLayer
            npcs={world.config.npcs}
            debug={debug}
            suppressRef={dragRef}
            scrollY={viewY}
            voiceNpcId={walkMode ? walkState.voiceNpcId : null}
          />
          {/* Aru — feet-anchored at the walk position; the loop moves this
              container, React only re-renders on facing/moving/prompt changes. */}
          {domWalk && (
            <div
              ref={aruRef}
              className="absolute left-0 top-0 z-20 pointer-events-none will-change-transform"
            >
              <div
                aria-hidden
                className="absolute -translate-x-1/2 -translate-y-1/2 w-[36px] h-[12px] rounded-[50%] bg-black/45 blur-[2px]"
              />
              <img
                src={aruSprite}
                alt="Aru"
                data-testid="aru-walk"
                draggable={false}
                className="absolute left-0 top-0 h-[84px] w-auto max-w-none select-none"
                style={
                  {
                    transform: `translate(-50%, -100%)${
                      walkState.facing === -1 ? ' scaleX(-1)' : ''
                    }`,
                    '--aru-flip':
                      walkState.facing === -1 ? 'scaleX(-1)' : 'scaleX(1)',
                    animation: walkState.moving
                      ? 'aru-bob 0.32s ease-in-out infinite alternate'
                      : undefined,
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.55))',
                  } as React.CSSProperties
                }
              />
              {walkState.prompt && (
                <div
                  data-testid="walk-prompt"
                  className="absolute -translate-x-1/2 top-[-124px] whitespace-nowrap rounded-full border border-primary/70 bg-black/85 px-[10px] py-[4px] text-[8px] font-bold uppercase tracking-widest text-primary"
                >
                  E — Andar jao · {walkState.prompt.name}
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Slim pan indicator */}
        {maxScroll > 0 && (
          <div
            aria-hidden
            className="absolute right-[8px] top-[88px] w-[3px] h-[400px] rounded-full bg-black/50 border border-primary/15"
          >
            <div
              className="absolute left-0 w-full rounded-full bg-primary/50"
              style={{
                height: Math.max(30, 400 * (STAGE_H / world.config.imageSize.h)),
                top:
                  (viewY / maxScroll) *
                  (400 - Math.max(30, 400 * (STAGE_H / world.config.imageSize.h))),
              }}
            />
          </div>
        )}

        {/* Walking controls: key hints on desktop, joystick + E on touch */}
        {walkMode && !coarsePointer && !active && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[96px] z-20 pointer-events-none rounded-full bg-black/65 border border-primary/25 px-[12px] py-[4px] text-[7.5px] uppercase tracking-widest text-primary/85 whitespace-nowrap">
            WASD / Arrows — chalo · Shift — daudo · E — andar jao
          </div>
        )}
        {walkMode && coarsePointer && !active && (
          <>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[96px] z-20 pointer-events-none rounded-full bg-black/65 border border-primary/25 px-[12px] py-[4px] text-[7.5px] uppercase tracking-widest text-primary/85 whitespace-nowrap">
              Joystick — chalo · Kinaare tak dabao — daudo · E — andar jao
            </div>
            <VirtualJoystick onChange={walkControls.setJoystick} />
            <button
              aria-label="Andar jao"
              onPointerDown={walkControls.queueAction}
              className="absolute right-[26px] bottom-[64px] w-[56px] h-[56px] rounded-full border-2 border-primary/70 bg-primary/25 text-primary font-bold text-[16px]"
            >
              E
            </button>
          </>
        )}
      </div>

      {/* Pinned HUD — same components as the Hub (PRD Task 7) */}
      <div className="pointer-events-auto relative z-10">
        <InfoPanel />
        <SmritiDialogue line={smritiLine} />
        <LegendBar />
        <RightControls />
        <button
          onClick={() => go('/', { x: 98, y: 492 })}
          className="absolute left-[20px] top-[482px] w-[156px] h-[20px] rounded-full border border-primary/70 bg-black/60 hover:bg-primary/20 text-primary text-[8px] uppercase tracking-widest font-bold flex items-center justify-center gap-[4px] transition-colors z-40"
        >
          <ArrowLeft className="w-[10px] h-[10px]" />
          Memory Map
        </button>
      </div>

      {active && !showDiscovery && (
        <BuildingCard
          building={active.b}
          state={active.s}
          pendingNames={pendingNames}
          debug={debug}
          discovery={activeDiscovery}
          onOpenDiscovery={activeDiscovery ? () => setShowDiscovery(true) : undefined}
          onPlay={
            activeGame
              ? () => setLocation(`/world/${world.config.nodeId}/game/${activeGame.id}`)
              : undefined
          }
          onDevComplete={() => {
            markBuildingComplete(world.config.nodeId, active.b.id);
            // Completing the node's climax building IS node completion —
            // fire the Hub's region-restore event (PRD 6.3). Config-driven:
            // works for any node whose buildings.json has a climax entry.
            if (active.b.type === 'climax') restoreNode(world.config.nodeId);
            setActive(null);
            setSmritiLine(lines.welcome);
          }}
          onClose={() => {
            setActive(null);
            setSmritiLine(lines.welcome);
          }}
        />
      )}

      {active && showDiscovery && activeDiscovery && (
        <FactCard
          discovery={activeDiscovery}
          explored={active.s === 'explored'}
          onRestore={
            activeDiscovery.kind === 'explore' && active.s !== 'explored'
              ? () => {
                  // Reading the discovery IS the memory returning — this is
                  // how the in_progress explore buildings complete (and, via
                  // unlocksAfter, feed the climax gate).
                  markBuildingComplete(world.config.nodeId, active.b.id);
                  setActive(null);
                  setShowDiscovery(false);
                  setSmritiLine(activeDiscovery.completeLine);
                }
              : undefined
          }
          onClose={() => {
            setActive(null);
            setShowDiscovery(false);
            setSmritiLine(
              activeDiscovery.kind === 'recap' ? activeDiscovery.completeLine : lines.welcome
            );
          }}
        />
      )}

      {/* Rift transition veils: reveal on entry, darken toward the rift on exit. */}
      {!reducedMotion && !leavingFrom && <RiftVeil mode="in" />}
      {leavingFrom && <RiftVeil mode="out" origin={leavingFrom} />}
    </div>
  );
}
