import { STAGE_W, STAGE_H } from '@/lib/stage';
import { facingFromDir, dist, type Facing, type Vec2 } from '@/game/engine/types';
import { moveActor } from '@/game/engine/movement';
import { followCamera } from '@/game/engine/camera';
import type { GameInput } from '@/game/engine/input';
import type { Scene, SceneHud } from './types';

/**
 * Task 0 framework-proof scene: a small top-down pickup/place level that
 * exercises every engine system (fixed-step movement, AABB collision, follow
 * camera, contextual action, win flow). Placeholder flat-tone art — the real
 * painted levels replace this in the Naali Paheli / Sheher Banao tasks.
 *
 * Loop: find 3 scattered drain segments, carry them to the glowing gaps in
 * the dug channel, and the well's water flows to the river.
 */

const TILE = 64;
const COLS = 16;
const ROWS = 14;
const LEVEL_W = COLS * TILE;
const LEVEL_H = ROWS * TILE;

const PLAYER_SPEED = 190;
const PLAYER_HALF_W = 13;
const PLAYER_HALF_H = 9;
const PICK_RADIUS = 46;
const PLACE_RADIUS = 60;
const FLOW_SECONDS = 1.6;

/** Dug channel from the well to the river, in flow order. */
const TRENCH: { c: number; r: number }[] = [
  { c: 3, r: 3 }, { c: 4, r: 3 }, { c: 5, r: 3 }, { c: 6, r: 3 }, { c: 7, r: 3 },
  { c: 8, r: 3 }, { c: 8, r: 4 }, { c: 8, r: 5 }, { c: 8, r: 6 }, { c: 8, r: 7 },
  { c: 9, r: 7 }, { c: 10, r: 7 }, { c: 11, r: 7 }, { c: 12, r: 7 }, { c: 13, r: 7 },
];
const GAP_INDICES = [4, 8, 12];

const WELL = { c: 2, r: 3 };
const RIVER_FROM_COL = 14;
const RUBBLE = new Set(['5,5', '6,5', '11,4', '12,4', '4,9', '5,9', '10,10', '11,10']);
const CRATE_TILES: { c: number; r: number }[] = [
  { c: 12, r: 2 },
  { c: 3, r: 11 },
  { c: 13, r: 10 },
];

const trenchKey = new Map<string, number>();
TRENCH.forEach((t, i) => trenchKey.set(`${t.c},${t.r}`, i));

function tileCenter(t: { c: number; r: number }): Vec2 {
  return { x: t.c * TILE + TILE / 2, y: t.r * TILE + TILE / 2 };
}

interface Crate {
  pos: Vec2;
  state: 'ground' | 'carried' | 'placed';
}

export function createDemoScene(images: Record<string, HTMLImageElement>): Scene {
  const player = { pos: { x: 2.5 * TILE, y: 6.5 * TILE }, facing: 'down' as Facing };
  const crates: Crate[] = CRATE_TILES.map(t => ({ pos: tileCenter(t), state: 'ground' }));
  const gapFilled: boolean[] = GAP_INDICES.map(() => false);
  let carrying: number | null = null;
  let waterT = 0;
  let won = false;
  let t = 0;

  function allPlaced() {
    return gapFilled.every(Boolean);
  }

  function isWalkable(c: number, r: number): boolean {
    if (c < 1 || r < 1 || c >= RIVER_FROM_COL || r >= ROWS - 1) return false;
    if (c === WELL.c && r === WELL.r) return false;
    if (RUBBLE.has(`${c},${r}`)) return false;
    if (trenchKey.has(`${c},${r}`)) return false;
    return true;
  }

  function nearestGroundCrate(): { idx: number; d: number } | null {
    let best: { idx: number; d: number } | null = null;
    crates.forEach((cr, idx) => {
      if (cr.state !== 'ground') return;
      const d = dist(cr.pos, player.pos);
      if (!best || d < best.d) best = { idx, d };
    });
    return best;
  }

  function nearestOpenGap(): { gi: number; d: number } | null {
    let best: { gi: number; d: number } | null = null;
    GAP_INDICES.forEach((trenchIdx, gi) => {
      if (gapFilled[gi]) return;
      const d = dist(tileCenter(TRENCH[trenchIdx]), player.pos);
      if (!best || d < best.d) best = { gi, d };
    });
    return best;
  }

  function update(dt: number, input: GameInput) {
    t += dt;
    if (won) return;

    if (allPlaced()) {
      waterT = Math.min(1, waterT + dt / FLOW_SECONDS);
      if (waterT >= 1) won = true;
      return;
    }

    const dir = input.getDir();
    player.pos = moveActor(
      player.pos, dir, PLAYER_SPEED, dt, TILE, isWalkable, PLAYER_HALF_W, PLAYER_HALF_H
    );
    player.facing = facingFromDir(dir, player.facing);

    if (input.consumeAction()) {
      if (carrying === null) {
        const near = nearestGroundCrate();
        if (near && near.d <= PICK_RADIUS) {
          carrying = near.idx;
          crates[near.idx].state = 'carried';
        }
      } else {
        const gap = nearestOpenGap();
        if (gap && gap.d <= PLACE_RADIUS) {
          const trenchIdx = GAP_INDICES[gap.gi];
          crates[carrying].state = 'placed';
          crates[carrying].pos = tileCenter(TRENCH[trenchIdx]);
          gapFilled[gap.gi] = true;
          carrying = null;
        }
      }
    }
  }

  function hud(): SceneHud {
    const placed = gapFilled.filter(Boolean).length;
    let hint: string;
    if (won) hint = 'Paani nadi tak pahunch gaya — sheher bach gaya!';
    else if (allPlaced()) hint = 'Dekho! Paani beh raha hai…';
    else if (carrying !== null) hint = 'Chamakti khaali jagah ke paas jao — E / Space dabao, tukda lagao';
    else {
      const near = nearestGroundCrate();
      hint =
        near && near.d <= PICK_RADIUS
          ? 'E ya Space dabao — naali ka tukda uthao'
          : 'Naali ke tukde dhoondo — galiyon mein bikhre hain';
    }
    return { objective: `Naali ke tukde lagao — ${placed}/3`, hint, won };
  }

  function render(ctx: CanvasRenderingContext2D) {
    const cam = followCamera(player.pos, LEVEL_W, LEVEL_H, STAGE_W, STAGE_H);
    ctx.fillStyle = '#0b0805';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    const c0 = Math.max(0, Math.floor(cam.x / TILE));
    const c1 = Math.min(COLS - 1, Math.ceil((cam.x + STAGE_W) / TILE));
    const r0 = Math.max(0, Math.floor(cam.y / TILE));
    const r1 = Math.min(ROWS - 1, Math.ceil((cam.y + STAGE_H) / TILE));

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        drawTile(ctx, c, r);
      }
    }

    // Ground crates (carried one is drawn with the player).
    crates.forEach(cr => {
      if (cr.state === 'ground') drawCrate(ctx, cr.pos.x, cr.pos.y, 40);
      if (cr.state === 'placed') drawPlacedSegment(ctx, cr.pos);
    });

    drawPlayer(ctx);
    ctx.restore();
  }

  function drawTile(ctx: CanvasRenderingContext2D, c: number, r: number) {
    const x = c * TILE;
    const y = r * TILE;

    if (c >= RIVER_FROM_COL) {
      // River with slow shimmer bands.
      ctx.fillStyle = '#1d4e5e';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = 'rgba(90,180,200,0.18)';
      const band = ((Math.sin(t * 1.6 + r * 0.9) + 1) / 2) * (TILE - 14);
      ctx.fillRect(x, y + band, TILE, 7);
      return;
    }

    const isBorder = r === 0 || r === ROWS - 1 || c === 0;
    if (isBorder) {
      ctx.fillStyle = '#6e5136';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#7f5f40';
      ctx.fillRect(x, y, TILE, 10);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      return;
    }

    // Warm sand ground.
    ctx.fillStyle = (c + r) % 2 === 0 ? '#b5905f' : '#ad8a5a';
    ctx.fillRect(x, y, TILE, TILE);
    if ((c * 7 + r * 13) % 9 === 0) {
      ctx.fillStyle = 'rgba(90,64,38,0.25)';
      ctx.fillRect(x + 22, y + 30, 5, 4);
    }

    if (c === WELL.c && r === WELL.r) {
      ctx.fillStyle = '#8b8378';
      ctx.beginPath();
      ctx.arc(x + TILE / 2, y + TILE / 2, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#20303a';
      ctx.beginPath();
      ctx.arc(x + TILE / 2, y + TILE / 2, 13, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (RUBBLE.has(`${c},${r}`)) {
      ctx.fillStyle = '#6e4f33';
      ctx.fillRect(x + 8, y + 26, 22, 14);
      ctx.fillRect(x + 32, y + 14, 20, 13);
      ctx.fillRect(x + 24, y + 40, 24, 12);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.strokeRect(x + 8.5, y + 26.5, 22, 14);
      return;
    }

    const trenchIdx = trenchKey.get(`${c},${r}`);
    if (trenchIdx !== undefined) {
      const gi = GAP_INDICES.indexOf(trenchIdx);
      const isOpenGap = gi >= 0 && !gapFilled[gi];
      // Dug channel.
      ctx.fillStyle = '#4a3520';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#33230f';
      ctx.fillRect(x + 10, y + 10, TILE - 20, TILE - 20);

      if (isOpenGap) {
        const pulse = 0.45 + 0.35 * ((Math.sin(t * 3) + 1) / 2);
        ctx.strokeStyle = `rgba(217,169,74,${pulse})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 6]);
        ctx.strokeRect(x + 6, y + 6, TILE - 12, TILE - 12);
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
      } else if (allPlaced()) {
        // Water advancing along the channel.
        const flowFront = waterT * TRENCH.length;
        if (trenchIdx < flowFront) {
          ctx.fillStyle = '#2f7f96';
          ctx.fillRect(x + 12, y + 12, TILE - 24, TILE - 24);
          ctx.fillStyle = 'rgba(160,220,235,0.35)';
          const s = ((Math.sin(t * 5 + trenchIdx) + 1) / 2) * (TILE - 30);
          ctx.fillRect(x + 14, y + 12 + s / 2, TILE - 28, 4);
        }
      }
    }
  }

  function drawCrate(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
    const h = size / 2;
    ctx.fillStyle = '#8a5f34';
    ctx.fillRect(cx - h, cy - h, size, size);
    ctx.strokeStyle = '#4f3418';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - h + 1, cy - h + 1, size - 2, size - 2);
    ctx.fillStyle = '#3a2712';
    ctx.fillRect(cx - h + 6, cy - 4, size - 12, 8);
    ctx.lineWidth = 1;
  }

  function drawPlacedSegment(ctx: CanvasRenderingContext2D, pos: Vec2) {
    ctx.fillStyle = '#7a5433';
    ctx.fillRect(pos.x - 26, pos.y - 26, 52, 52);
    ctx.fillStyle = '#2b1d0c';
    ctx.fillRect(pos.x - 26, pos.y - 7, 52, 14);
  }

  function drawPlayer(ctx: CanvasRenderingContext2D) {
    const aru = images.aru;
    const h = 54;
    const w = (aru.naturalWidth / aru.naturalHeight) * h;
    const { x, y } = player.pos;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 6, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    if (player.facing === 'left') {
      ctx.translate(x, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(aru, -w / 2, y - h + 8, w, h);
    } else {
      ctx.drawImage(aru, x - w / 2, y - h + 8, w, h);
    }
    ctx.restore();

    if (carrying !== null) {
      drawCrate(ctx, x, y - h - 6, 26);
    }
  }

  return { update, render, hud };
}
