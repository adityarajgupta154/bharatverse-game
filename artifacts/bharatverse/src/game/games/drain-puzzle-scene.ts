import { followCamera } from '@/game/engine/camera';
import { RUN_MULTIPLIER } from '../engine/types';
import { moveActor } from '@/game/engine/movement';
import {
  facingFromDir,
  dist,
  type Facing,
  type Vec2,
} from '@/game/engine/types';
import type { Scene, SceneHud } from './types';

/**
 * Naali Paheli — the real drain-repair puzzle (replaces the Task-0 demo for
 * GAMES['drain-puzzle']).
 *
 * A Mohenjo-daro street grid: the covered drain from the well to the river is
 * broken in 5 places. 3 gaps need SEEDHA (straight) segments, 2 corner gaps
 * need MUDA (L) segments. Matching pieces lie scattered in the streets.
 * Pick one up (E/Space), carry it to a glowing gap of the same shape, place
 * it. Wrong shape → gentle Hinglish hint, no fail state. When all 5 are in,
 * water flows well→river and the scene reports won.
 *
 * All geometry lives in LEVEL px (tile grid × 64). The camera renders onto
 * the fixed 1024×592 stage. Everything is canvas-drawn in the same painted
 * terracotta/sand palette as the demo so the two games stay one family.
 */

const TILE = 64;
const COLS = 20;
const ROWS = 14;
const LEVEL_W = COLS * TILE;
const LEVEL_H = ROWS * TILE;
const VIEW_W = 1024;
const VIEW_H = 592;

const RIVER_FROM_COL = 17;
const WELL = { c: 2, r: 2 };

const PLAYER_SPEED = 190;
const PICK_RADIUS = 58;
const PLACE_RADIUS = 72;
const FLOW_SECONDS = 2.6;
const FEEDBACK_SECONDS = 2.4;

type Dir = 'n' | 's' | 'e' | 'w';
type PieceType = 'straight' | 'corner';

interface TrenchTile {
  c: number;
  r: number;
  conns: [Dir, Dir];
}

interface Gap {
  trenchIdx: number;
  c: number;
  r: number;
  shape: PieceType;
  filledBy: string | null;
}

interface PieceState {
  id: string;
  type: PieceType;
  state: 'ground' | 'carried' | 'placed';
  pos: Vec2;
  seed: number;
}

/* ---------------------------------------------------------------- level -- */

// Drain path: well (2,2) → east along row 2 → south along col 8 → east along
// row 8 → river (col 17). Built as an ordered list so water can flow along it.
const TRENCH_PATH: { c: number; r: number }[] = [];
for (let c = 3; c <= 8; c++) TRENCH_PATH.push({ c, r: 2 });
for (let r = 3; r <= 8; r++) TRENCH_PATH.push({ c: 8, r });
for (let c = 9; c <= 16; c++) TRENCH_PATH.push({ c, r: 8 });

const tileKey = (c: number, r: number) => `${c},${r}`;

const TRENCH_IDX = new Map<string, number>();
TRENCH_PATH.forEach((t, i) => TRENCH_IDX.set(tileKey(t.c, t.r), i));

function dirBetween(from: { c: number; r: number }, to: { c: number; r: number }): Dir {
  if (to.c > from.c) return 'e';
  if (to.c < from.c) return 'w';
  if (to.r > from.r) return 's';
  return 'n';
}

// Each trench tile connects to its neighbours along the path (well side feeds
// the first tile from the west, the river drinks from the last tile's east).
const TRENCH: TrenchTile[] = TRENCH_PATH.map((t, i) => {
  const prev = TRENCH_PATH[i - 1] ?? { c: t.c - 1, r: t.r };
  const next = TRENCH_PATH[i + 1] ?? { c: t.c + 1, r: t.r };
  return { c: t.c, r: t.r, conns: [dirBetween(t, prev), dirBetween(t, next)] };
});

function isStraight(conns: [Dir, Dir]): boolean {
  const [a, b] = conns;
  return (
    (a === 'e' && b === 'w') ||
    (a === 'w' && b === 'e') ||
    (a === 'n' && b === 's') ||
    (a === 's' && b === 'n')
  );
}

// The 5 broken places. Shapes are derived from the path so they can never
// disagree with the geometry: (5,2) straight, (8,2) corner, (8,5) straight,
// (8,8) corner, (12,8) straight.
const GAP_TILES = new Set([
  tileKey(5, 2),
  tileKey(8, 2),
  tileKey(8, 5),
  tileKey(8, 8),
  tileKey(12, 8),
]);

// 2×2 flat-roof houses (top-left tile), single rubble piles, neem trees.
const HOUSES = [
  { c: 4, r: 4 },
  { c: 11, r: 2 },
  { c: 13, r: 5 },
  { c: 3, r: 8 },
  { c: 11, r: 10 },
  { c: 6, r: 9 },
  { c: 15, r: 2 },
];
const RUBBLE = [
  { c: 6, r: 6 },
  { c: 10, r: 4 },
  // keep col 14 open so the far street piece has a friendly approach
  { c: 15, r: 10 },
  { c: 3, r: 6 },
];
const TREES = [
  { c: 3, r: 12 },
  { c: 10, r: 12 },
  { c: 16, r: 12 },
];

const SOLID = new Set<string>();
for (const h of HOUSES)
  for (let dc = 0; dc < 2; dc++)
    for (let dr = 0; dr < 2; dr++) SOLID.add(tileKey(h.c + dc, h.r + dr));
for (const s of RUBBLE) SOLID.add(tileKey(s.c, s.r));
for (const s of TREES) SOLID.add(tileKey(s.c, s.r));
SOLID.add(tileKey(WELL.c, WELL.r));

function isWalkable(c: number, r: number): boolean {
  if (c <= 0 || r <= 0 || c >= COLS || r >= ROWS - 1) return false;
  if (c >= RIVER_FROM_COL) return false;
  const k = tileKey(c, r);
  if (TRENCH_IDX.has(k)) return false;
  if (SOLID.has(k)) return false;
  return true;
}

const tileCenter = (c: number, r: number): Vec2 => ({
  x: (c + 0.5) * TILE,
  y: (r + 0.5) * TILE,
});

// Scattered segments: exactly 3 straight + 2 corner, one per gap.
const PIECE_SPOTS: { type: PieceType; c: number; r: number }[] = [
  { type: 'straight', c: 13, r: 2 },
  { type: 'straight', c: 2, r: 7 },
  // bottom-wall spot: walking down the far street runs straight into it
  { type: 'straight', c: 14, r: 12 },
  { type: 'corner', c: 10, r: 6 },
  { type: 'corner', c: 5, r: 12 },
];

const typeLabel = (t: PieceType) => (t === 'corner' ? 'muda (L)' : 'seedha');

/* ---------------------------------------------------------------- scene -- */

export function createDrainPuzzleScene(
  images: Record<string, HTMLImageElement>
): Scene & {
  /** Test/debug hook: lets a headless harness observe sim state. */
  debugState(): {
    pos: Vec2;
    carried: string | null;
    placed: number;
    waterT: number;
    won: boolean;
  };
} {
  const aru = images.aru;

  const player = { pos: { x: 2.5 * TILE, y: 11.5 * TILE }, facing: 'down' as Facing };

  const gaps: Gap[] = TRENCH.filter(t => GAP_TILES.has(tileKey(t.c, t.r))).map(t => ({
    trenchIdx: TRENCH_IDX.get(tileKey(t.c, t.r))!,
    c: t.c,
    r: t.r,
    shape: isStraight(t.conns) ? 'straight' : 'corner',
    filledBy: null,
  }));

  const pieces: PieceState[] = PIECE_SPOTS.map((p, i) => ({
    id: `p${i}`,
    type: p.type,
    state: 'ground',
    pos: tileCenter(p.c, p.r),
    seed: i * 1.7,
  }));

  let carriedId: string | null = null;
  let t = 0;
  let waterT = 0;
  let won = false;
  let feedback: { text: string; until: number } | null = null;

  const placedCount = () => gaps.filter(g => g.filledBy).length;
  const allPlaced = () => placedCount() === gaps.length;
  const carriedPiece = () => pieces.find(p => p.id === carriedId) ?? null;

  const say = (text: string) => {
    feedback = { text, until: t + FEEDBACK_SECONDS };
  };

  function nearestGroundPiece(radius: number): PieceState | null {
    let best: PieceState | null = null;
    let bestD = radius;
    for (const p of pieces) {
      if (p.state !== 'ground') continue;
      const d = dist(p.pos, player.pos);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  function nearestOpenGap(radius: number): Gap | null {
    let best: Gap | null = null;
    let bestD = radius;
    for (const g of gaps) {
      if (g.filledBy) continue;
      const d = dist(tileCenter(g.c, g.r), player.pos);
      if (d < bestD) {
        bestD = d;
        best = g;
      }
    }
    return best;
  }

  function handleAction() {
    const carried = carriedPiece();
    if (!carried) {
      const p = nearestGroundPiece(PICK_RADIUS);
      if (p) {
        p.state = 'carried';
        carriedId = p.id;
        say(p.type === 'corner' ? 'Muda tukda uthaya — ab chamakta MOD dhoondo.' : 'Seedha tukda uthaya — chamakti seedhi jagah dhoondo.');
      } else if (nearestOpenGap(PLACE_RADIUS)) {
        say('Pehle tukda dhoondo — galiyon mein bikhre hain.');
      }
      return;
    }

    const gap = nearestOpenGap(PLACE_RADIUS);
    if (gap) {
      if (gap.shape === carried.type) {
        carried.state = 'placed';
        carried.pos = tileCenter(gap.c, gap.r);
        gap.filledBy = carried.id;
        carriedId = null;
        say(gap.shape === 'corner' ? 'Muda tukda mod par fit — waah!' : 'Seedha tukda fit ho gaya!');
      } else {
        say(
          gap.shape === 'corner'
            ? 'Yeh mod hai — yahan muda (L) tukda chahiye.'
            : 'Yeh seedhi jagah hai — yahan seedha tukda chahiye.'
        );
      }
      return;
    }

    // No gap in reach: set the piece down on the street under Aru's feet.
    const tc = Math.floor(player.pos.x / TILE);
    const tr = Math.floor(player.pos.y / TILE);
    const spot = tileCenter(tc, tr);
    const occupied = pieces.some(p => p.state === 'ground' && dist(p.pos, spot) < 40);
    if (isWalkable(tc, tr) && !occupied) {
      carried.state = 'ground';
      carried.pos = spot;
      carriedId = null;
      say('Tukda neeche rakh diya.');
    } else {
      say('Yahan nahi rakh sakte — khuli jagah par rakho.');
    }
  }

  function update(dt: number, input: { getDir(): Vec2; consumeAction(): boolean; isRunning?(): boolean }) {
    t += dt;
    const act = input.consumeAction();

    if (!won) {
      const dir = input.getDir();
      player.facing = facingFromDir(dir, player.facing);
      player.pos = moveActor(player.pos, dir, PLAYER_SPEED * (input.isRunning?.() ? RUN_MULTIPLIER : 1), dt, TILE, isWalkable, 14, 10);
      if (act && !allPlaced()) handleAction();
      if (allPlaced()) {
        waterT = Math.min(1, waterT + dt / FLOW_SECONDS);
        if (waterT >= 1) won = true;
      }
    }

    if (feedback && t > feedback.until) feedback = null;
  }

  function hud(): SceneHud {
    const objective = `Naali jodo — ${placedCount()}/${gaps.length}`;
    let hint: string;
    if (won) {
      hint = 'Paani nadi tak pahunch gaya — sheher bach gaya!';
    } else if (allPlaced()) {
      hint = 'Dekho — kuen ka paani naali mein beh raha hai!';
    } else if (feedback) {
      hint = feedback.text;
    } else {
      const carried = carriedPiece();
      if (carried) {
        hint =
          carried.type === 'corner'
            ? 'Muda tukda haath mein — chamakte MOD par E ya Space se lagao.'
            : 'Seedha tukda haath mein — chamakti seedhi jagah par E ya Space.';
      } else {
        const near = nearestGroundPiece(PICK_RADIUS * 1.6);
        hint = near
          ? `${near.type === 'corner' ? 'Muda (L)' : 'Seedha'} tukda — E ya Space se uthao.`
          : 'Galiyon mein naali ke tukde dhoondo — 3 seedhe, 2 mude.';
      }
    }
    return { objective, hint, won };
  }

  /* ------------------------------------------------------------ drawing -- */

  function grooveEnds(conns: [Dir, Dir], px: number, py: number) {
    const cx = px + TILE / 2;
    const cy = py + TILE / 2;
    const pt = (d: Dir): Vec2 =>
      d === 'n'
        ? { x: cx, y: py }
        : d === 's'
          ? { x: cx, y: py + TILE }
          : d === 'w'
            ? { x: px, y: cy }
            : { x: px + TILE, y: cy };
    return { cx, cy, a: pt(conns[0]), b: pt(conns[1]) };
  }

  function strokeGroove(
    ctx: CanvasRenderingContext2D,
    conns: [Dir, Dir],
    px: number,
    py: number,
    width: number,
    color: string
  ) {
    const { cx, cy, a, b } = grooveEnds(conns, px, py);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(cx, cy);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function drawSlab(ctx: CanvasRenderingContext2D, tile: TrenchTile, placed: boolean) {
    const px = tile.c * TILE;
    const py = tile.r * TILE;
    ctx.fillStyle = placed ? '#8d7a5e' : '#7d6b52';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.strokeStyle = placed ? 'rgba(217,169,74,0.5)' : '#5f5140';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
    // slab seams
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + TILE / 2, py + 4);
    ctx.lineTo(px + TILE / 2, py + TILE - 4);
    ctx.stroke();
    strokeGroove(ctx, tile.conns, px, py, 14, '#2e2317');
  }

  function drawGap(ctx: CanvasRenderingContext2D, gap: Gap, idx: number) {
    const tile = TRENCH[gap.trenchIdx];
    const px = gap.c * TILE;
    const py = gap.r * TILE;
    // dug-open pit
    ctx.fillStyle = '#33230f';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
    // ghost of the needed shape
    strokeGroove(ctx, tile.conns, px, py, 10, 'rgba(217,169,74,0.30)');
    // pulsing dashed invitation
    const pulse = 0.45 + 0.3 * Math.sin(t * 3 + idx * 1.3);
    ctx.strokeStyle = `rgba(217,169,74,${pulse.toFixed(3)})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 6]);
    ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
    ctx.setLineDash([]);
  }

  function drawWaterAlongTrench(ctx: CanvasRenderingContext2D) {
    if (waterT <= 0) return;
    const front = waterT * TRENCH.length;
    for (let i = 0; i < TRENCH.length; i++) {
      if (i >= front) break;
      const tile = TRENCH[i];
      const px = tile.c * TILE;
      const py = tile.r * TILE;
      strokeGroove(ctx, tile.conns, px, py, 10, '#2f8ba3');
      strokeGroove(ctx, tile.conns, px, py, 4, '#58b7c9');
    }
    // sparkling leading edge
    const leadIdx = Math.min(TRENCH.length - 1, Math.floor(front));
    const lead = TRENCH[leadIdx];
    const cx = (lead.c + 0.5) * TILE;
    const cy = (lead.r + 0.5) * TILE;
    const glow = 0.5 + 0.4 * Math.sin(t * 9);
    ctx.fillStyle = `rgba(140,220,235,${(glow * 0.7).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 9 + glow * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMiniPiece(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: PieceType,
    size: number,
    glow: boolean
  ) {
    const half = size / 2;
    if (glow) {
      const pulse = 0.35 + 0.2 * Math.sin(t * 3.2);
      ctx.fillStyle = `rgba(217,169,74,${pulse.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, half + 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#8d7a5e';
    ctx.strokeStyle = '#4a3b28';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - half, y - half, size, size, 5);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#2e2317';
    ctx.lineWidth = Math.max(5, size * 0.22);
    ctx.lineCap = 'butt';
    ctx.beginPath();
    if (type === 'straight') {
      ctx.moveTo(x - half + 3, y);
      ctx.lineTo(x + half - 3, y);
    } else {
      ctx.moveTo(x - half + 3, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + half - 3);
    }
    ctx.stroke();
  }

  function drawWell(ctx: CanvasRenderingContext2D) {
    const px = WELL.c * TILE;
    const py = WELL.r * TILE;
    const cx = px + TILE / 2;
    const cy = py + TILE / 2;
    ctx.fillStyle = '#6e5136';
    ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
    ctx.fillStyle = '#8a6a47';
    ctx.fillRect(px + 8, py + 8, TILE - 16, TILE - 16);
    ctx.fillStyle = '#123a46';
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
    const shine = 0.25 + 0.15 * Math.sin(t * 2.1);
    ctx.fillStyle = `rgba(120,200,220,${shine.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    // posts + crossbar + rope
    ctx.strokeStyle = '#4a3520';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px + 10, py + 10);
    ctx.lineTo(px + 10, py - 12);
    ctx.moveTo(px + TILE - 10, py + 10);
    ctx.lineTo(px + TILE - 10, py - 12);
    ctx.moveTo(px + 8, py - 12);
    ctx.lineTo(px + TILE - 8, py - 12);
    ctx.stroke();
    ctx.strokeStyle = '#c8a15f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, py - 12);
    ctx.lineTo(cx, cy - 8);
    ctx.stroke();
  }

  function drawHouse(ctx: CanvasRenderingContext2D, h: { c: number; r: number }) {
    const px = h.c * TILE;
    const py = h.r * TILE;
    const w = TILE * 2;
    const hh = TILE * 2;
    ctx.fillStyle = '#8a5f3a';
    ctx.fillRect(px, py, w, hh);
    ctx.strokeStyle = '#5d3f26';
    ctx.lineWidth = 3;
    ctx.strokeRect(px + 1.5, py + 1.5, w - 3, hh - 3);
    // flat roof rim + stairwell block
    ctx.fillStyle = '#a0714a';
    ctx.fillRect(px + 6, py + 6, w - 12, hh - 12);
    ctx.fillStyle = '#7c522f';
    ctx.fillRect(px + w - 34, py + 10, 22, 18);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(px + 6, py + 6 + ((hh - 12) / 4) * i);
      ctx.lineTo(px + w - 6, py + 6 + ((hh - 12) / 4) * i);
      ctx.stroke();
    }
    // rooftop water pot
    ctx.fillStyle = '#b3502e';
    ctx.beginPath();
    ctx.arc(px + 18, py + hh - 18, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRubble(ctx: CanvasRenderingContext2D, s: { c: number; r: number }) {
    const cx = (s.c + 0.5) * TILE;
    const cy = (s.r + 0.5) * TILE;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 12, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    const stones: [number, number, number, string][] = [
      [-10, 2, 11, '#7d6b52'],
      [8, 6, 9, '#6e5c45'],
      [2, -6, 8, '#8a785f'],
    ];
    for (const [dx, dy, rad, col] of stones) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function drawTree(ctx: CanvasRenderingContext2D, s: { c: number; r: number }) {
    const cx = (s.c + 0.5) * TILE;
    const cy = (s.r + 0.5) * TILE;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 16, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5b3d22';
    ctx.fillRect(cx - 4, cy - 6, 8, 24);
    const sway = Math.sin(t * 1.3 + cx * 0.01) * 2;
    ctx.fillStyle = '#3a5230';
    ctx.beginPath();
    ctx.arc(cx + sway, cy - 18, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4c6b3a';
    ctx.beginPath();
    ctx.arc(cx - 10 + sway, cy - 12, 13, 0, Math.PI * 2);
    ctx.arc(cx + 11 + sway, cy - 11, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  function render(ctx: CanvasRenderingContext2D) {
    const cam = followCamera(player.pos, LEVEL_W, LEVEL_H, VIEW_W, VIEW_H);
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    const c0 = Math.max(0, Math.floor(cam.x / TILE));
    const r0 = Math.max(0, Math.floor(cam.y / TILE));
    const c1 = Math.min(COLS - 1, Math.ceil((cam.x + VIEW_W) / TILE));
    const r1 = Math.min(ROWS - 1, Math.ceil((cam.y + VIEW_H) / TILE));

    // streets, walls, river base
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const px = c * TILE;
        const py = r * TILE;
        if (c >= RIVER_FROM_COL) {
          ctx.fillStyle = '#1d4e5e';
          ctx.fillRect(px, py, TILE, TILE);
          continue;
        }
        if (r === 0 || r === ROWS - 1 || c === 0) {
          ctx.fillStyle = '#6e5136';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = 'rgba(255,255,255,0.07)';
          ctx.fillRect(px, py, TILE, 6);
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
          continue;
        }
        ctx.fillStyle = (c + r) % 2 === 0 ? '#b5905f' : '#ad8a5a';
        ctx.fillRect(px, py, TILE, TILE);
        if ((c * 7 + r * 13) % 11 === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.08)';
          ctx.beginPath();
          ctx.arc(px + 18 + ((c * 31) % 24), py + 20 + ((r * 17) % 20), 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // river shimmer
    for (let r = r0; r <= r1; r++) {
      const py = r * TILE;
      const wave = Math.sin(t * 1.4 + r * 0.8) * 6;
      ctx.fillStyle = 'rgba(90,170,190,0.25)';
      ctx.fillRect(RIVER_FROM_COL * TILE + 10 + wave, py + 8, 5, TILE - 16);
      ctx.fillRect(RIVER_FROM_COL * TILE + 70 - wave, py + 22, 4, TILE - 30);
    }

    // trench: slabs, gaps, water
    let gapIdx = 0;
    for (const tile of TRENCH) {
      const gap = gaps.find(g => g.trenchIdx === TRENCH_IDX.get(tileKey(tile.c, tile.r)));
      if (gap && !gap.filledBy) {
        drawGap(ctx, gap, gapIdx++);
      } else {
        drawSlab(ctx, tile, Boolean(gap?.filledBy));
      }
    }
    drawWaterAlongTrench(ctx);

    drawWell(ctx);
    for (const h of HOUSES) drawHouse(ctx, h);
    for (const s of RUBBLE) drawRubble(ctx, s);
    for (const s of TREES) drawTree(ctx, s);

    // ground pieces
    for (const p of pieces) {
      if (p.state !== 'ground') continue;
      const bob = Math.sin(t * 2.2 + p.seed) * 2.5;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(p.pos.x, p.pos.y + 14, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      drawMiniPiece(ctx, p.pos.x, p.pos.y + bob, p.type, 40, true);
    }

    // Aru + carried piece
    const px = player.pos.x;
    const py = player.pos.y;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(px, py + 10, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    const spriteH = 64;
    const spriteW = aru ? (aru.width / Math.max(1, aru.height)) * spriteH : 40;
    if (aru) {
      ctx.save();
      if (player.facing === 'left') {
        ctx.translate(px, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(aru, -spriteW / 2, py - spriteH + 12, spriteW, spriteH);
      } else {
        ctx.drawImage(aru, px - spriteW / 2, py - spriteH + 12, spriteW, spriteH);
      }
      ctx.restore();
    }
    const carried = carriedPiece();
    if (carried) {
      const bob = Math.sin(t * 3) * 2;
      drawMiniPiece(ctx, px, py - spriteH + bob - 4, carried.type, 30, false);
    }

    ctx.restore();
  }

  return {
    update,
    render,
    hud,
    debugState: () => ({
      pos: { ...player.pos },
      carried: carriedId,
      placed: placedCount(),
      waterT,
      won,
    }),
  };
}
