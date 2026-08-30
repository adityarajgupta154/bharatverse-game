/**
 * 2D game engine — shared primitives (Minigames Phase Task 0).
 *
 * Coordinate system: LEVEL px (a level is a tile grid; tiles are square).
 * The GameScreen renders the level through a camera onto the 1024x592 stage,
 * so everything here stays in plain level coordinates.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export type Facing = 'left' | 'right' | 'up' | 'down';

export function facingFromDir(dir: Vec2, fallback: Facing): Facing {
  if (dir.x === 0 && dir.y === 0) return fallback;
  if (Math.abs(dir.x) >= Math.abs(dir.y)) return dir.x < 0 ? 'left' : 'right';
  return dir.y < 0 ? 'up' : 'down';
}

export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
