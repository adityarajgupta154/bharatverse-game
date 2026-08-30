import type { Vec2 } from './types';

/**
 * Top-down actor movement with axis-separated AABB collision against a tile
 * grid (Minigames Phase Task 0). Moving each axis independently gives the
 * classic "slide along the wall" feel instead of sticking on contact.
 *
 * `isWalkable(col, row)` is the scene's own rule — the engine has no opinion
 * about what a tile means. Out-of-range tiles must return false there.
 */
export function moveActor(
  pos: Vec2,
  dir: Vec2,
  speed: number,
  dt: number,
  tileSize: number,
  isWalkable: (col: number, row: number) => boolean,
  halfW: number,
  halfH: number
): Vec2 {
  let { x, y } = pos;
  const dx = dir.x * speed * dt;
  const dy = dir.y * speed * dt;

  // Substep so no single move exceeds a quarter tile — a fast actor (or a
  // larger dt from some future caller) can never tunnel through a
  // one-tile-thick wall.
  const maxStep = tileSize / 4;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / maxStep));
  const sx = dx / steps;
  const sy = dy / steps;

  for (let i = 0; i < steps; i++) {
    const tryX = x + sx;
    if (boxWalkable(tryX, y, halfW, halfH, tileSize, isWalkable)) x = tryX;
    const tryY = y + sy;
    if (boxWalkable(x, tryY, halfW, halfH, tileSize, isWalkable)) y = tryY;
  }

  return { x, y };
}

function boxWalkable(
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  tileSize: number,
  isWalkable: (col: number, row: number) => boolean
): boolean {
  const left = Math.floor((cx - halfW) / tileSize);
  const right = Math.floor((cx + halfW) / tileSize);
  const top = Math.floor((cy - halfH) / tileSize);
  const bottom = Math.floor((cy + halfH) / tileSize);
  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      if (!isWalkable(col, row)) return false;
    }
  }
  return true;
}
