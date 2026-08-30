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
