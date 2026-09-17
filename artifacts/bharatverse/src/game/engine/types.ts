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

/** Speed multiplier while Shift is held (village walking + all minigames). */
export const RUN_MULTIPLIER = 1.6;

/**
 * Touch sprint (Movement Bridge PRD Task 8.3, per A.5): pushing the joystick
 * thumb out to its RIM runs — one thumb, no extra button to coordinate.
 * Hysteresis keeps the flag from flickering at the boundary: engage only at
 * ≥ ENGAGE, release only under RELEASE, hold the previous state in between.
 */
export const JOY_RUN_ENGAGE = 0.95;
export const JOY_RUN_RELEASE = 0.8;

/** Pure per-sample joystick-sprint step (v = normalized vector, null = released). */
export function applyJoystickRun(prev: boolean, v: Vec2 | null): boolean {
  if (!v) return false;
  const len = Math.hypot(v.x, v.y);
  if (len >= JOY_RUN_ENGAGE) return true;
  if (len < JOY_RUN_RELEASE) return false;
  return prev;
}
