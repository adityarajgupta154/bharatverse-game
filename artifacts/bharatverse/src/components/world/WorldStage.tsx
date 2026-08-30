import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { useGame } from '@/game/store';
import { getWorld, deriveBuildingState, initiallyCompleted } from '@/game/worlds';
import type { WorldBuilding, BuildingState } from '@/game/world-types';
import { InfoPanel } from '@/components/hub/InfoPanel';
import { SmritiDialogue } from '@/components/hub/SmritiDialogue';
import { LegendBar } from '@/components/hub/LegendBar';
import { RightControls } from '@/components/hub/RightControls';
import { NodeBuilding } from './NodeBuilding';
import { BuildingCard } from './BuildingCard';

const STAGE_H = 592;

/**
 * Inner node world (Village layer): the node's reference painting rendered
 * 1:1 in stage px as a vertically pannable canvas, with the Hub's pinned HUD
 * (info panel, Smriti, legend, filter/rift) reused on top. Buildings are
 * config-driven invisible hotspots that scroll with the art.
 */
export default function WorldStage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const [, setLocation] = useLocation();
  const { state, selectNode } = useGame();
  const world = getWorld(nodeId);
  // Entry gate: the world must exist AND its map node must be unlocked —
  // mirrors Chapter.tsx so a direct URL can't bypass progression.
  const node = state.nodes.find(n => n.id === nodeId);
  const canEnter = !!world && !!node && node.status !== 'locked';

  const maxScroll = world ? Math.max(0, world.config.imageSize.h - STAGE_H) : 0;
  // Dev-only: ?at=<worldY> pins the initial pan position (hotspot calibration).
  const atParam = new URLSearchParams(window.location.search).get('at');
  const initialAt =
    atParam !== null && Number.isFinite(Number(atParam))
      ? Math.max(0, Math.min(maxScroll, Number(atParam)))
      : maxScroll;
  // Enter the world at the city gate (bottom of the painting).
  const [scrollY, setScrollY] = useState(initialAt);
  const [active, setActive] = useState<{ b: WorldBuilding; s: BuildingState } | null>(null);
  const [smritiLine, setSmritiLine] = useState(world ? world.config.lines.welcome : '');

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ down: false, startY: 0, startScroll: 0, scaleY: 1, moved: false });

  const debug = useMemo(
    () => new URLSearchParams(window.location.search).has('debug'),
    []
  );

  // Story-complete buildings count as done from the start (Task 3 adds
  // persisted player completions on top of this set).
  const completed = useMemo(
    () => (world ? initiallyCompleted(world.config) : new Set<string>()),
    [world]
  );

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
    setSmritiLine(world?.config.lines.welcome ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, maxScroll]);

  if (!world || !canEnter) return null;

  const clamp = (v: number) => Math.max(0, Math.min(maxScroll, v));
  const lines = world.config.lines;

  function handleActivate(b: WorldBuilding, s: BuildingState) {
    setActive({ b, s });
    setSmritiLine(s === 'locked' ? lines.locked : lines.welcome);
  }

  const pendingNames = active
    ? active.b.unlocksAfter
        .filter(id => !completed.has(id))
        .map(id => world.config.buildings.find(x => x.id === id)?.name ?? id)
    : [];

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {/* Pannable world canvas */}
      <div
        ref={containerRef}
        tabIndex={0}
        aria-label="Village — scroll ya drag karke ghoomo"
        className="absolute inset-0 overflow-hidden pointer-events-auto select-none touch-none cursor-grab active:cursor-grabbing focus:outline-none"
        onWheel={e => {
          // Wheel deltas arrive in CSS px (or lines); convert to world px so
          // pan speed matches drag at every viewport scale.
          const rect = containerRef.current?.getBoundingClientRect();
          const scaleY = rect ? rect.height / STAGE_H : 1;
          const dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
          setScrollY(s => clamp(s + dy / scaleY));
        }}
        onPointerDown={e => {
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
        <div
          className="absolute left-0 top-0 w-[1024px] will-change-transform"
          style={{
            height: world.config.imageSize.h,
            transform: `translate3d(0, ${-scrollY}px, 0)`,
          }}
        >
          <img
            src={world.art}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full select-none pointer-events-none"
          />
          {world.config.buildings.map(b => (
            <NodeBuilding
              key={b.id}
              building={b}
              state={deriveBuildingState(b, completed)}
              debug={debug}
              suppressRef={dragRef}
              onActivate={handleActivate}
            />
          ))}
        </div>

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
                  (scrollY / maxScroll) *
                  (400 - Math.max(30, 400 * (STAGE_H / world.config.imageSize.h))),
              }}
            />
          </div>
        )}
      </div>

      {/* Pinned HUD — same components as the Hub (PRD Task 7) */}
      <div className="pointer-events-auto relative z-10">
        <InfoPanel />
        <SmritiDialogue line={smritiLine} />
        <LegendBar />
        <RightControls />
        <button
          onClick={() => setLocation('/')}
          className="absolute left-[20px] top-[482px] w-[156px] h-[20px] rounded-full border border-primary/70 bg-black/60 hover:bg-primary/20 text-primary text-[8px] uppercase tracking-widest font-bold flex items-center justify-center gap-[4px] transition-colors z-40"
        >
          <ArrowLeft className="w-[10px] h-[10px]" />
          Memory Map
        </button>
      </div>

      {active && (
        <BuildingCard
          building={active.b}
          state={active.s}
          pendingNames={pendingNames}
          onClose={() => {
            setActive(null);
            setSmritiLine(lines.welcome);
          }}
        />
      )}
    </div>
  );
}
