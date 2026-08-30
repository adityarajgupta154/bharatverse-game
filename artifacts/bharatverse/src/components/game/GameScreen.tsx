import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { STAGE_W, STAGE_H } from '@/lib/stage';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { cn } from '@/lib/utils';
import { useGame } from '@/game/store';
import { getWorld, deriveBuildingState, initiallyCompleted } from '@/game/worlds';
import { GAMES, type Scene, type SceneHud } from '@/game/games';
import { useGameLoop } from '@/game/engine/loop';
import { useGameInput } from '@/game/engine/input';
import { useLoadedImages } from '@/game/engine/sprites';
import { VirtualJoystick } from './VirtualJoystick';

type Phase = 'intro' | 'play' | 'pause' | 'won';

/**
 * Full-screen 2D game host (Minigames Phase Task 0). Owns everything around
 * a Scene: entry gating (mirrors NodeWorldScreen so a direct URL can't skip
 * progression), canvas + DPR fitting, the fixed-step loop, keyboard/touch
 * input, and the intro / pause / win chrome in the village's visual language.
 */
export function GameScreen({ nodeId, gameId }: { nodeId: string; gameId: string }) {
  const [, setLocation] = useLocation();
  const { state, markBuildingComplete, restoreNode } = useGame();
  const reducedMotion = useReducedMotion();

  const world = getWorld(nodeId);
  const game = GAMES[gameId] ?? null;
  const node = state.nodes.find(n => n.id === nodeId);

  const completed = useMemo(() => {
    const set = new Set<string>(world ? initiallyCompleted(world.config) : []);
    if (world) {
      for (const id of state.completedBuildings[world.config.nodeId] ?? []) {
        set.add(id);
      }
    }
    return set;
  }, [world, state.completedBuildings]);

  // GameDef.buildingId is the one authoritative game->building mapping
  // (worlds/index.ts validates it against routeTargets in dev).
  const building =
    world && game ? world.config.buildings.find(b => b.id === game.buildingId) ?? null : null;
  const buildingState = building ? deriveBuildingState(building, completed) : null;
  const canPlay =
    !!world && !!game && !!node && node.status !== 'locked' && !!building && buildingState !== 'locked';

  useEffect(() => {
    if (!canPlay) setLocation(world ? `/world/${nodeId}` : '/');
  }, [canPlay, world, nodeId, setLocation]);

  const debug = useMemo(() => new URLSearchParams(window.location.search).has('debug'), []);
  const coarsePointer = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);

  const [phase, setPhase] = useState<Phase>('intro');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const images = useLoadedImages(game?.imageSrcs ?? {});
  const scene = useMemo<Scene | null>(
    () => (game && images ? game.createScene(images) : null),
    [game, images]
  );
  const sceneRef = useRef<Scene | null>(null);
  sceneRef.current = scene;

  const controls = useGameInput(phase === 'play');
  const [hud, setHud] = useState<SceneHud | null>(null);
  const hudRef = useRef<SceneHud | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fit the canvas backing store to the on-screen size (stage scale x DPR)
  // so the painted level stays crisp at every viewport size.
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
    phase === 'play' && !!scene && canPlay,
    dt => {
      const sc = sceneRef.current;
      if (!sc) return;
      sc.update(dt, controls.input);
      const h = sc.hud();
      const prev = hudRef.current;
      if (!prev || prev.hint !== h.hint || prev.objective !== h.objective || prev.won !== h.won) {
        hudRef.current = h;
        setHud(h);
      }
      if (h.won && phaseRef.current === 'play') setPhase('won');
    },
    () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.setTransform(canvas.width / STAGE_W, 0, 0, canvas.height / STAGE_H, 0, 0);
      const sc = sceneRef.current;
      if (sc) {
        sc.render(ctx);
      } else {
        ctx.fillStyle = '#0b0805';
        ctx.fillRect(0, 0, STAGE_W, STAGE_H);
      }
    }
  );

  // ESC toggles pause during play.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape' || e.repeat) return;
      setPhase(p => (p === 'play' ? 'pause' : p === 'pause' ? 'play' : p));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!canPlay || !world || !game || !building) return null;

  const backToVillage = () => setLocation(`/world/${nodeId}`);
  const finishComplete = () => {
    markBuildingComplete(world.config.nodeId, building.id);
    if (building.type === 'climax') restoreNode(world.config.nodeId);
    backToVillage();
  };

  const chip =
    'pointer-events-none rounded-full border border-primary/40 bg-black/70 px-[10px] py-[4px] text-[8px] uppercase tracking-[0.14em] text-primary';

  return (
    <div className={cn('absolute inset-0 z-0', !reducedMotion && 'animate-world-enter')}>
      <div ref={wrapRef} className="absolute inset-0 pointer-events-auto select-none">
        <canvas
          ref={canvasRef}
          aria-label={`${game.title} — 2D khel. Chalne ke liye WASD ya arrow keys, uthane-rakhne ke liye E ya Space.`}
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {/* HUD chips (under the top nav) */}
      <div className="absolute left-[16px] top-[64px] flex items-center gap-[6px]">
        <span className={chip}>{game.title}</span>
        <span className={cn(chip, 'text-primary/60 border-primary/25')}>Demo</span>
      </div>
      {hud && phase !== 'intro' && (
        <span className={cn(chip, 'absolute right-[16px] top-[64px]')}>{hud.objective}</span>
      )}
      {hud && phase === 'play' && (
        <div
          role="status"
          className="absolute left-1/2 -translate-x-1/2 bottom-[18px] rounded-full border border-primary/30 bg-black/75 px-[14px] py-[5px] text-[8.5px] text-foreground/90 pointer-events-none max-w-[70%] text-center"
        >
          {hud.hint}
        </div>
      )}

      {phase === 'play' && (
        <button
          onClick={() => setPhase('pause')}
          className="absolute right-[16px] bottom-[18px] pointer-events-auto rounded-full border border-primary/60 bg-black/70 hover:bg-primary/20 px-[12px] py-[5px] text-[8px] uppercase tracking-widest font-bold text-primary transition-colors"
        >
          ⏸ Roko (Esc)
        </button>
      )}

      {coarsePointer && phase === 'play' && (
        <div className="pointer-events-auto">
          <VirtualJoystick onChange={controls.setJoystick} />
          <button
            aria-label="Uthao ya rakho"
            onPointerDown={controls.queueAction}
            className="absolute right-[26px] bottom-[64px] w-[56px] h-[56px] rounded-full border-2 border-primary/70 bg-primary/25 text-primary font-bold text-[16px]"
          >
            E
          </button>
        </div>
      )}

      {phase === 'intro' && (
        <Card>
          <span className="text-[6.5px] text-primary/90 uppercase tracking-[0.16em] font-medium">
            Khel
          </span>
          <h2 className="font-title-serif text-[15px] font-bold text-white tracking-wide mt-[3px] leading-tight text-glow">
            {game.title}
          </h2>
          <span className="text-[7.5px] text-primary/80 block mt-[2px]">{game.subtitle}</span>
          <div className="w-[85%] h-px bg-primary/20 my-[9px] mx-auto" />
          {game.intro.map((line, i) => (
            <p key={i} className="text-[8px] leading-[1.65] text-foreground/90 px-[6px] mt-[4px]">
              {line}
            </p>
          ))}
          <div className="mt-[9px] rounded border border-primary/20 bg-black/40 px-[8px] py-[6px] text-[7px] leading-[1.7] text-muted-foreground">
            Chalo: WASD ya Arrow keys{coarsePointer ? ' (ya joystick)' : ''}
            <br />
            Uthao / Rakho: E ya Space{coarsePointer ? ' (ya E button)' : ''} · Roko: Esc
          </div>
          <button
            autoFocus
            onClick={() => {
              if (!scene) return;
              setHud(scene.hud());
              hudRef.current = scene.hud();
              setPhase('play');
            }}
            className="block mx-auto mt-[11px] text-[9px] uppercase tracking-[0.16em] font-bold text-black bg-primary hover:bg-primary/85 rounded-full px-[18px] py-[6px] transition-colors disabled:opacity-50"
            disabled={!scene}
          >
            {scene ? '▶ Shuru Karo' : 'Taiyari…'}
          </button>
        </Card>
      )}

      {phase === 'pause' && (
        <Card>
          <h2 className="font-title-serif text-[14px] font-bold text-white tracking-wide text-glow">
            Khel ruka hai
          </h2>
          <div className="w-[85%] h-px bg-primary/20 my-[9px] mx-auto" />
          <button
            autoFocus
            onClick={() => setPhase('play')}
            className="block mx-auto text-[9px] uppercase tracking-[0.16em] font-bold text-black bg-primary hover:bg-primary/85 rounded-full px-[18px] py-[6px] transition-colors"
          >
            ▶ Wapas Khelo
          </button>
          <button
            onClick={backToVillage}
            className="mx-auto mt-[8px] flex items-center gap-[4px] text-[7.5px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-[9px] h-[9px]" />
            Village wapas jao
          </button>
        </Card>
      )}

      {phase === 'won' && (
        <Card>
          <span className="text-[6.5px] text-primary/90 uppercase tracking-[0.16em] font-medium">
            ✦ Jeet
          </span>
          <h2 className="font-title-serif text-[15px] font-bold text-white tracking-wide mt-[3px] text-glow">
            Shabash, Aru!
          </h2>
          <div className="w-[85%] h-px bg-primary/20 my-[9px] mx-auto" />
          <p className="text-[8px] leading-[1.65] text-foreground/90 px-[6px]">{game.winLine}</p>
          <p className="text-[6.5px] text-muted-foreground mt-[6px]">
            (Framework demo — asli level apni yaad ke saath agle update mein khulega.)
          </p>
          <button
            autoFocus
            onClick={backToVillage}
            className="block mx-auto mt-[11px] text-[9px] uppercase tracking-[0.16em] font-bold text-black bg-primary hover:bg-primary/85 rounded-full px-[18px] py-[6px] transition-colors"
          >
            Village wapas jao
          </button>
          {debug && (
            <button
              onClick={finishComplete}
              className="block mx-auto mt-[8px] text-[6.5px] uppercase tracking-[0.14em] text-red-300 border border-red-400/50 rounded-full px-[8px] py-[3px] hover:bg-red-400/10 transition-colors"
            >
              Mark complete (dev)
            </button>
          )}
        </Card>
      )}
    </div>
  );
}

/** Modal card in the BuildingCard's visual language (corner brackets & all). */
function Card({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
      <div className="absolute inset-0 bg-black/55" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-[300px] bg-[#0a0907] border border-primary/40 rounded-lg p-[14px] text-center shadow-2xl"
      >
        <div className="absolute top-[3px] left-[3px] w-[10px] h-[10px] border-t-[1.5px] border-l-[1.5px] border-primary pointer-events-none" />
        <div className="absolute top-[3px] right-[3px] w-[10px] h-[10px] border-t-[1.5px] border-r-[1.5px] border-primary pointer-events-none" />
        <div className="absolute bottom-[3px] left-[3px] w-[10px] h-[10px] border-b-[1.5px] border-l-[1.5px] border-primary pointer-events-none" />
        <div className="absolute bottom-[3px] right-[3px] w-[10px] h-[10px] border-b-[1.5px] border-r-[1.5px] border-primary pointer-events-none" />
        {children}
      </div>
    </div>
  );
}
