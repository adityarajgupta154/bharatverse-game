import type { Vec2 } from './types';

/**
 * Follow camera (Minigames Phase Task 0): centers on the target, clamped to
 * the level bounds. Levels smaller than the view are centered instead.
 */
export function followCamera(
  target: Vec2,
  levelW: number,
  levelH: number,
  viewW: number,
  viewH: number
): Vec2 {
  return {
    x: clampAxis(target.x, levelW, viewW),
    y: clampAxis(target.y, levelH, viewH),
  };
}

function clampAxis(center: number, levelSize: number, viewSize: number): number {
  if (levelSize <= viewSize) return (levelSize - viewSize) / 2;
  return Math.max(0, Math.min(levelSize - viewSize, center - viewSize / 2));
}

/**
 * Camera damping factor per 60Hz fixed step (Rig+Camera PRD Task 6): each
 * tick the camera covers this fraction of the remaining distance to its
 * follow target, so it eases toward Aru instead of hard-snapping — rapid
 * direction changes and clamp-boundary transitions stop feeling jumpy.
 */
export const CAM_DAMP = 0.18;

/** One damping step toward `target`. Keep the returned value UNROUNDED —
 *  rounding the stored camera would swallow the small tail increments and
 *  stall the ease (PRD Task 6.2). */
export function dampCamera(cam: Vec2, target: Vec2, factor: number = CAM_DAMP): Vec2 {
  return {
    x: cam.x + (target.x - cam.x) * factor,
    y: cam.y + (target.y - cam.y) * factor,
  };
}

/** Integer-px camera for DRAW offsets only (PRD Task 4): sub-pixel camera
 *  positions shimmer both the painting and every overlay riding it. Applied
 *  AFTER damping, never to the stored float (Task 6.2). */
export function roundCamera(cam: Vec2): Vec2 {
  return { x: Math.round(cam.x), y: Math.round(cam.y) };
}
