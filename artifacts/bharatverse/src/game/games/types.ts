import type { GameInput } from '@/game/engine/input';

/**
 * Minigame contracts (Minigames Phase Task 0).
 *
 * A GameDef is pure data + a scene factory; GameScreen owns all React/DOM
 * chrome (intro, pause, win, HUD chips) so scenes stay plain canvas logic.
 */

export interface SceneHud {
  /** Short goal line shown top-right, e.g. "Naali ke tukde lagao — 1/3". */
  objective: string;
  /** Contextual helper line shown bottom-center during play. */
  hint: string;
  /** True once the scene is won; GameScreen switches to the win panel. */
  won: boolean;
}

export interface Scene {
  /** Fixed-step simulation tick (dt is constant). */
  update(dt: number, input: GameInput): void;
  /** Draw one frame in STAGE coordinates (1024x592); scene owns its camera. */
  render(ctx: CanvasRenderingContext2D): void;
  hud(): SceneHud;
}

export interface GameDef {
  /** Registry id — matches the building's routeTarget suffix. */
  id: string;
  /** The village building this game belongs to (completion target). */
  buildingId: string;
  title: string;
  subtitle: string;
  /** Intro-card story lines (Hinglish). */
  intro: string[];
  /** Win-panel line (Hinglish). */
  winLine: string;
  /** name -> src; all are loaded before the scene is created. */
  imageSrcs: Record<string, string>;
  createScene(images: Record<string, HTMLImageElement>): Scene;
}
