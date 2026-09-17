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
 * Sheher Banao — the real city-builder minigame (replaces the Task-0 demo for
 * GAMES['city-builder']).
 *
 * A new mohalla is being raised beside the river, Mohenjo-daro style: a
 * straight grid of streets with 6 empty foundation plots. Matching material
 * bundles lie around the district — bricks for GHAR plots, grain sacks for
 * the ANAAJ GHAR, water-proof bricks for the SNANAGAR, awning goods for the
 * BAZAAR. Pick a bundle (E/Space), carry it to the glowing plot with the same
 * icon, place it and watch the building rise (with a little history fact).
 * Wrong bundle → gentle Hinglish hint, no fail state. When all 6 buildings
 * stand, the mohalla celebrates (flags + glow) and the scene reports won.
 *
 * Same engine + palette as Naali Paheli so the two games stay one family.
 * All geometry lives in LEVEL px (tile grid × 64); camera renders onto the
 * fixed 1024×592 stage.
 */

const TILE = 64;
const COLS = 20;
const ROWS = 14;
const LEVEL_W = COLS * TILE;
const LEVEL_H = ROWS * TILE;
const VIEW_W = 1024;
const VIEW_H = 592;

const PLAYER_SPEED = 190;
const PICK_RADIUS = 58;
const PLACE_RADIUS = 72;
const BUILD_SECONDS = 0.6;
const CELEBRATE_SECONDS = 3.0;
const FEEDBACK_SECONDS = 3.2;

type BuildType = 'ghar' | 'anaaj' | 'snan' | 'bazaar';

interface Plot {
  id: string;
  type: BuildType;
  c: number;
  r: number;
  builtBy: string | null;
  /** 0→1 rise animation once built. */
  buildT: number;
}

interface BundleState {
  id: string;
  type: BuildType;
  state: 'ground' | 'carried' | 'placed';
  pos: Vec2;
  seed: number;
}

/* ---------------------------------------------------------------- level -- */

const tileKey = (c: number, r: number) => `${c},${r}`;

// Main street runs down cols 10–11, the cross street along row 5 — the
// famous Indus grid. Paving is visual only (still walkable).
const STREET_COLS = new Set([10, 11]);
const STREET_ROW = 5;
const GATE_COLS = new Set([10, 11]); // arch in the south wall

// Already-standing 2×2 houses give the district its half-built look.
const HOUSES = [
  { c: 2, r: 2 },
  { c: 8, r: 2 },
  { c: 2, r: 8 },
  { c: 14, r: 7 },
  { c: 8, r: 9 },
];
const WELL = { c: 12, r: 2 };
const TREES = [
  { c: 5, r: 11 },
  { c: 16, r: 10 },
  { c: 17, r: 4 },
];
// Brick piles waiting at the construction site (solid decoration).
const BRICK_PILES = [
  { c: 6, r: 4 },
  { c: 13, r: 10 },
];

// The 6 foundation plots. Never walkable (dug foundations), solid forever.
const PLOT_SPOTS: { type: BuildType; c: number; r: number }[] = [
  { type: 'ghar', c: 5, r: 2 },
  { type: 'ghar', c: 15, r: 2 },
  { type: 'ghar', c: 4, r: 9 },
  { type: 'anaaj', c: 12, r: 4 },
  { type: 'snan', c: 7, r: 6 },
  { type: 'bazaar', c: 12, r: 9 },
];

// Material bundles — spread across the district, resting against walls so
// walking a street to its end lands you on them.
const BUNDLE_SPOTS: { type: BuildType; c: number; r: number }[] = [
  { type: 'ghar', c: 1, r: 5 },
  { type: 'ghar', c: 18, r: 1 },
  { type: 'ghar', c: 10, r: 12 },
  { type: 'anaaj', c: 1, r: 11 },
  { type: 'snan', c: 18, r: 11 },
  { type: 'bazaar', c: 18, r: 6 },
];

const SOLID = new Set<string>();
for (const h of HOUSES)
  for (let dc = 0; dc < 2; dc++)
    for (let dr = 0; dr < 2; dr++) SOLID.add(tileKey(h.c + dc, h.r + dr));
for (const s of TREES) SOLID.add(tileKey(s.c, s.r));
for (const s of BRICK_PILES) SOLID.add(tileKey(s.c, s.r));
SOLID.add(tileKey(WELL.c, WELL.r));
for (const p of PLOT_SPOTS) SOLID.add(tileKey(p.c, p.r));

function isWalkable(c: number, r: number): boolean {
  if (c <= 0 || r <= 0 || c >= COLS - 1 || r >= ROWS - 1) return false;
  if (SOLID.has(tileKey(c, r))) return false;
  return true;
}

const tileCenter = (c: number, r: number): Vec2 => ({
  x: (c + 0.5) * TILE,
  y: (r + 0.5) * TILE,
});

const LABEL: Record<BuildType, string> = {
  ghar: 'Ghar',
  anaaj: 'Anaaj Ghar',
  snan: 'Snanagar',
  bazaar: 'Bazaar',
};

const BUNDLE_NAME: Record<BuildType, string> = {
  ghar: 'Eeton ka gattha',
  anaaj: 'Anaaj ki boriyan',
  snan: 'Paani ki eentein',
  bazaar: 'Bazaar ka saman',
};

const PICK_LINE: Record<BuildType, string> = {
  ghar: 'Eeton ka gattha uthaya — GHAR ka chamakta plot dhoondo.',
  anaaj: 'Anaaj ki boriyan uthayin — ANAAJ GHAR ka plot dhoondo.',
  snan: 'Paani ki eentein uthayin — SNANAGAR ka plot dhoondo.',
  bazaar: 'Bazaar ka saman uthaya — BAZAAR ka plot dhoondo.',
};

const CARRY_LINE: Record<BuildType, string> = {
  ghar: 'Eetein haath mein — ghar ke icon wale plot par E ya Space.',
  anaaj: 'Boriyan haath mein — anaaj ghar ke plot par E ya Space.',
  snan: 'Paani ki eentein haath mein — snanagar ke plot par E ya Space.',
  bazaar: 'Saman haath mein — bazaar ke plot par E ya Space.',
};

// The little history lesson each building teaches when it rises.
const FACT_LINE: Record<BuildType, string> = {
  ghar: 'Ghar bana! Pakki eeton ke ghar — har ghar mein apna kuan aur snanghar hota tha.',
  anaaj: 'Anaaj Ghar bana! Poore sheher ka anaaj yahan surakshit rehta tha.',
  snan: 'Maha Snanagar bana — duniya ka sabse purana public pool yahi tha!',
  bazaar: 'Bazaar saj gaya! Yahan ki mohrein (seals) door desh tak jaati thin.',
};

/* ---------------------------------------------------------------- scene -- */

export function createCityBuilderScene(
  images: Record<string, HTMLImageElement>
): Scene & {
  /** Test/debug hook: lets a headless harness observe sim state. */
  debugState(): {
    pos: Vec2;
    carried: string | null;
    placed: number;
    celebrateT: number;
    won: boolean;
  };
} {
  const aru = images.aru;

  // Spawn on the main street, just inside the south gate.
  const player = { pos: { x: 10.5 * TILE, y: 11.5 * TILE }, facing: 'up' as Facing };

  const plots: Plot[] = PLOT_SPOTS.map((p, i) => ({
    id: `plot${i}`,
    type: p.type,
    c: p.c,
    r: p.r,
    builtBy: null,
    buildT: 0,
  }));

  const bundles: BundleState[] = BUNDLE_SPOTS.map((b, i) => ({
    id: `b${i}`,
    type: b.type,
    state: 'ground',
    pos: tileCenter(b.c, b.r),
    seed: i * 1.9,
  }));

  let carriedId: string | null = null;
  let t = 0;
  let celebrateT = 0;
  let won = false;
  let feedback: { text: string; until: number } | null = null;

  const builtCount = () => plots.filter(p => p.builtBy).length;
  const allBuilt = () => builtCount() === plots.length;
  const carriedBundle = () => bundles.find(b => b.id === carriedId) ?? null;

  const say = (text: string) => {
    feedback = { text, until: t + FEEDBACK_SECONDS };
  };

  function nearestGroundBundle(radius: number): BundleState | null {
    let best: BundleState | null = null;
    let bestD = radius;
    for (const b of bundles) {
      if (b.state !== 'ground') continue;
      const d = dist(b.pos, player.pos);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    return best;
  }

  function nearestOpenPlot(radius: number): Plot | null {
    let best: Plot | null = null;
    let bestD = radius;
    for (const p of plots) {
      if (p.builtBy) continue;
      const d = dist(tileCenter(p.c, p.r), player.pos);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  function handleAction() {
    const carried = carriedBundle();
    if (!carried) {
      const b = nearestGroundBundle(PICK_RADIUS);
      if (b) {
        b.state = 'carried';
        carriedId = b.id;
        say(PICK_LINE[b.type]);
      } else if (nearestOpenPlot(PLACE_RADIUS)) {
        say('Pehle saman dhoondo — sheher mein gatthe bikhre pade hain.');
      }
      return;
    }

    const plot = nearestOpenPlot(PLACE_RADIUS);
    if (plot) {
      if (plot.type === carried.type) {
        carried.state = 'placed';
        carried.pos = tileCenter(plot.c, plot.r);
        plot.builtBy = carried.id;
        plot.buildT = 0;
        carriedId = null;
        say(FACT_LINE[plot.type]);
      } else {
        say(`Is plot par ${LABEL[plot.type]} banega — ${BUNDLE_NAME[carried.type].toLowerCase()} yahan nahi lagega. Icon milao!`);
      }
      return;
    }

    // No plot in reach: set the bundle down on the street under Aru's feet.
    const tc = Math.floor(player.pos.x / TILE);
    const tr = Math.floor(player.pos.y / TILE);
    const spot = tileCenter(tc, tr);
    const occupied = bundles.some(b => b.state === 'ground' && dist(b.pos, spot) < 40);
    if (isWalkable(tc, tr) && !occupied) {
      carried.state = 'ground';
      carried.pos = spot;
      carriedId = null;
      say('Gattha neeche rakh diya.');
    } else {
      say('Yahan nahi rakh sakte — khuli jagah par rakho.');
    }
  }

  function update(dt: number, input: { getDir(): Vec2; consumeAction(): boolean; isRunning?(): boolean }) {
    t += dt;
    const act = input.consumeAction();

    for (const p of plots) {
      if (p.builtBy && p.buildT < 1) p.buildT = Math.min(1, p.buildT + dt / BUILD_SECONDS);
    }

    if (!won) {
      const dir = input.getDir();
      player.facing = facingFromDir(dir, player.facing);
      player.pos = moveActor(player.pos, dir, PLAYER_SPEED * (input.isRunning?.() ? RUN_MULTIPLIER : 1), dt, TILE, isWalkable, 14, 10);
      if (act && !allBuilt()) handleAction();
      if (allBuilt()) {
        celebrateT = Math.min(1, celebrateT + dt / CELEBRATE_SECONDS);
        if (celebrateT >= 1) won = true;
      }
    }

    if (feedback && t > feedback.until) feedback = null;
  }

  function hud(): SceneHud {
    const objective = `Sheher banao — ${builtCount()}/${plots.length}`;
    let hint: string;
    if (won) {
      hint = 'Naya mohalla taiyaar — grid-planning ka kamaal!';
    } else if (allBuilt()) {
      hint = 'Dekho — naya mohalla jag utha!';
    } else if (feedback) {
      hint = feedback.text;
    } else {
      const carried = carriedBundle();
      if (carried) {
        hint = CARRY_LINE[carried.type];
      } else {
        const near = nearestGroundBundle(PICK_RADIUS * 1.6);
        hint = near
          ? `${BUNDLE_NAME[near.type]} — E ya Space se uthao.`
          : 'Saman ke gatthe dhoondo — har gatthe par uske plot ka icon bana hai.';
      }
    }
    return { objective, hint, won };
  }

  /* ------------------------------------------------------------ drawing -- */

  function drawTypeIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: BuildType,
    size: number,
    color: string
  ) {
    const h = size / 2;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(2, size * 0.13);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (type === 'ghar') {
      // brick house: box + door notch
      ctx.strokeRect(x - h * 0.85, y - h * 0.7, h * 1.7, h * 1.5);
      ctx.fillRect(x - h * 0.22, y + h * 0.15, h * 0.44, h * 0.65);
    } else if (type === 'anaaj') {
      // grain sack: tied pouch
      ctx.moveTo(x - h * 0.6, y + h * 0.75);
      ctx.quadraticCurveTo(x - h * 0.85, y - h * 0.15, x - h * 0.2, y - h * 0.45);
      ctx.lineTo(x + h * 0.2, y - h * 0.45);
      ctx.quadraticCurveTo(x + h * 0.85, y - h * 0.15, x + h * 0.6, y + h * 0.75);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - h * 0.3, y - h * 0.6);
      ctx.lineTo(x + h * 0.3, y - h * 0.6);
      ctx.stroke();
    } else if (type === 'snan') {
      // water: two waves
      for (let i = 0; i < 2; i++) {
        const wy = y - h * 0.25 + i * h * 0.55;
        ctx.moveTo(x - h * 0.75, wy);
        ctx.quadraticCurveTo(x - h * 0.37, wy - h * 0.45, x, wy);
        ctx.quadraticCurveTo(x + h * 0.37, wy + h * 0.45, x + h * 0.75, wy);
      }
      ctx.stroke();
    } else {
      // bazaar: awning bar + hanging stripes
      ctx.moveTo(x - h * 0.8, y - h * 0.45);
      ctx.lineTo(x + h * 0.8, y - h * 0.45);
      ctx.stroke();
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * h * 0.5, y - h * 0.45);
        ctx.lineTo(x + i * h * 0.5, y + h * 0.55);
        ctx.stroke();
      }
    }
  }

  function drawBundle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: BuildType,
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
    // rope cross on the crate
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - half + 3, y);
    ctx.lineTo(x + half - 3, y);
    ctx.stroke();
    drawTypeIcon(ctx, x, y, type, size * 0.62, '#2e2317');
  }

  function drawPlot(ctx: CanvasRenderingContext2D, plot: Plot, idx: number) {
    const px = plot.c * TILE;
    const py = plot.r * TILE;
    // dug foundation pit
    ctx.fillStyle = '#33230f';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
    // corner foundation stones
    ctx.fillStyle = '#5f5140';
    for (const [dx, dy] of [
      [8, 8],
      [TILE - 14, 8],
      [8, TILE - 14],
      [TILE - 14, TILE - 14],
    ]) {
      ctx.fillRect(px + dx, py + dy, 6, 6);
    }
    // ghost icon of what belongs here
    drawTypeIcon(ctx, px + TILE / 2, py + TILE / 2, plot.type, 30, 'rgba(217,169,74,0.38)');
    // pulsing dashed invitation
    const pulse = 0.45 + 0.3 * Math.sin(t * 3 + idx * 1.3);
    ctx.strokeStyle = `rgba(217,169,74,${pulse.toFixed(3)})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 6]);
    ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
    ctx.setLineDash([]);
  }

  function drawFlag(ctx: CanvasRenderingContext2D, x: number, topY: number) {
    ctx.strokeStyle = '#4a3520';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, topY - 22);
    ctx.stroke();
    const wave = Math.sin(t * 6 + x * 0.05) * 3;
    ctx.fillStyle = '#c8542e';
    ctx.beginPath();
    ctx.moveTo(x, topY - 22);
    ctx.lineTo(x + 16, topY - 18 + wave);
    ctx.lineTo(x, topY - 13);
    ctx.closePath();
    ctx.fill();
  }

  function drawBuiltGhar(ctx: CanvasRenderingContext2D, px: number, py: number) {
    ctx.fillStyle = '#8a5f3a';
    ctx.fillRect(px + 5, py + 8, TILE - 10, TILE - 14);
    ctx.strokeStyle = '#5d3f26';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(px + 6, py + 9, TILE - 12, TILE - 16);
    ctx.fillStyle = '#a0714a';
    ctx.fillRect(px + 10, py + 12, TILE - 20, 12);
    // door + window
    ctx.fillStyle = '#3c2a18';
    ctx.fillRect(px + TILE / 2 - 6, py + TILE - 24, 12, 18);
    ctx.fillRect(px + 13, py + 30, 9, 8);
    ctx.fillRect(px + TILE - 22, py + 30, 9, 8);
  }

  function drawBuiltAnaaj(ctx: CanvasRenderingContext2D, px: number, py: number) {
    // raised platform + vented store
    ctx.fillStyle = '#6e5136';
    ctx.fillRect(px + 3, py + TILE - 16, TILE - 6, 12);
    ctx.fillStyle = '#9a7248';
    ctx.fillRect(px + 8, py + 6, TILE - 16, TILE - 22);
    ctx.strokeStyle = '#5d3f26';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(px + 9, py + 7, TILE - 18, TILE - 24);
    // air vents (the famous granary slits)
    ctx.fillStyle = '#3c2a18';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(px + 14 + i * 10, py + 14, 4, TILE - 38);
    }
    // grain sack beside
    ctx.fillStyle = '#c8a15f';
    ctx.beginPath();
    ctx.arc(px + TILE - 12, py + TILE - 20, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBuiltSnan(ctx: CanvasRenderingContext2D, px: number, py: number) {
    // brick rim
    ctx.fillStyle = '#8a5f3a';
    ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
    ctx.strokeStyle = '#5d3f26';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
    // sunken water tank
    ctx.fillStyle = '#1d4e5e';
    ctx.fillRect(px + 11, py + 11, TILE - 22, TILE - 22);
    const shine = 0.2 + 0.14 * Math.sin(t * 2.3);
    ctx.fillStyle = `rgba(120,200,220,${shine.toFixed(3)})`;
    ctx.fillRect(px + 14, py + 14, TILE - 34, 8);
    // entry steps
    ctx.strokeStyle = 'rgba(240,230,210,0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(px + 11, py + 18 + i * 7);
      ctx.lineTo(px + 24 - i * 4, py + 18 + i * 7);
      ctx.stroke();
    }
  }

  function drawBuiltBazaar(ctx: CanvasRenderingContext2D, px: number, py: number) {
    // posts
    ctx.strokeStyle = '#4a3520';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px + 10, py + TILE - 8);
    ctx.lineTo(px + 10, py + 16);
    ctx.moveTo(px + TILE - 10, py + TILE - 8);
    ctx.lineTo(px + TILE - 10, py + 16);
    ctx.stroke();
    // striped awning
    const stripes = 4;
    const aw = TILE - 8;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#c8542e' : '#e8d9b8';
      ctx.fillRect(px + 4 + (aw / stripes) * i, py + 8, aw / stripes, 12);
    }
    ctx.strokeStyle = '#5d3f26';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 4, py + 8, aw, 12);
    // goods on the counter
    ctx.fillStyle = '#b3502e';
    ctx.beginPath();
    ctx.arc(px + 22, py + TILE - 18, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c8a15f';
    ctx.beginPath();
    ctx.arc(px + 36, py + TILE - 16, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a5230';
    ctx.beginPath();
    ctx.arc(px + 47, py + TILE - 19, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBuilt(ctx: CanvasRenderingContext2D, plot: Plot, celebrated: boolean) {
    const px = plot.c * TILE;
    const py = plot.r * TILE;
    // ground under the finished building
    ctx.fillStyle = '#a38053';
    ctx.fillRect(px, py, TILE, TILE);

    const bt = plot.buildT;
    ctx.save();
    // rise from the foundation: scale vertically around the tile's bottom
    ctx.translate(px + TILE / 2, py + TILE);
    ctx.scale(1, 0.15 + 0.85 * bt);
    ctx.translate(-(px + TILE / 2), -(py + TILE));
    if (plot.type === 'ghar') drawBuiltGhar(ctx, px, py);
    else if (plot.type === 'anaaj') drawBuiltAnaaj(ctx, px, py);
    else if (plot.type === 'snan') drawBuiltSnan(ctx, px, py);
    else drawBuiltBazaar(ctx, px, py);
    ctx.restore();

    // dust puffs while rising
    if (bt < 1) {
      const a = 0.35 * (1 - bt);
      ctx.fillStyle = `rgba(200,180,150,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(px + 10, py + TILE - 6, 8 + bt * 8, 0, Math.PI * 2);
      ctx.arc(px + TILE - 10, py + TILE - 4, 7 + bt * 9, 0, Math.PI * 2);
      ctx.fill();
    }

    if (celebrated) {
      const glow = 0.18 + 0.12 * Math.sin(t * 4 + px * 0.03);
      ctx.fillStyle = `rgba(232,200,119,${glow.toFixed(3)})`;
      ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
      drawFlag(ctx, px + TILE - 14, py + 10);
    }
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
    ctx.fillStyle = '#b3502e';
    ctx.beginPath();
    ctx.arc(px + 18, py + hh - 18, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWellTile(ctx: CanvasRenderingContext2D) {
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

  function drawBrickPile(ctx: CanvasRenderingContext2D, s: { c: number; r: number }) {
    const px = s.c * TILE;
    const py = s.r * TILE;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(px + TILE / 2, py + TILE / 2 + 14, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // stacked bricks
    const rows: [number, number, number][] = [
      [px + 12, py + 34, 3],
      [px + 16, py + 24, 2],
      [px + 20, py + 14, 1],
    ];
    for (const [bx, by, n] of rows) {
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#a35a35' : '#b3663d';
        ctx.fillRect(bx + i * 14, by, 13, 9);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + i * 14 + 0.5, by + 0.5, 12, 8);
      }
    }
  }

  function render(ctx: CanvasRenderingContext2D) {
    const cam = followCamera(player.pos, LEVEL_W, LEVEL_H, VIEW_W, VIEW_H);
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    const c0 = Math.max(0, Math.floor(cam.x / TILE));
    const r0 = Math.max(0, Math.floor(cam.y / TILE));
    const c1 = Math.min(COLS - 1, Math.ceil((cam.x + VIEW_W) / TILE));
    const r1 = Math.min(ROWS - 1, Math.ceil((cam.y + VIEW_H) / TILE));

    // earth, city wall, paved streets
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const px = c * TILE;
        const py = r * TILE;
        const isWall = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1;
        if (isWall) {
          const isGate = r === ROWS - 1 && GATE_COLS.has(c);
          ctx.fillStyle = isGate ? '#7c5a39' : '#6e5136';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = 'rgba(255,255,255,0.07)';
          ctx.fillRect(px, py, TILE, 6);
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
          if (isGate) {
            ctx.fillStyle = '#3c2a18';
            ctx.beginPath();
            ctx.arc(px + TILE / 2, py + TILE, TILE / 2 - 6, Math.PI, 0);
            ctx.fill();
          }
          continue;
        }
        const isStreet = STREET_COLS.has(c) || r === STREET_ROW;
        if (isStreet) {
          ctx.fillStyle = (c + r) % 2 === 0 ? '#c2a06e' : '#b99868';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.strokeStyle = 'rgba(0,0,0,0.10)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
          ctx.beginPath();
          ctx.moveTo(px + TILE / 2, py + 6);
          ctx.lineTo(px + TILE / 2, py + TILE - 6);
          ctx.stroke();
        } else {
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
    }

    // plots (open foundations or rising/finished buildings)
    const celebrated = (idx: number) =>
      allBuilt() && celebrateT * (plots.length + 1) > idx + 1;
    plots.forEach((plot, i) => {
      if (plot.builtBy) drawBuilt(ctx, plot, celebrated(i));
      else drawPlot(ctx, plot, i);
    });

    drawWellTile(ctx);
    for (const h of HOUSES) drawHouse(ctx, h);
    for (const s of BRICK_PILES) drawBrickPile(ctx, s);
    for (const s of TREES) drawTree(ctx, s);

    // ground bundles
    for (const b of bundles) {
      if (b.state !== 'ground') continue;
      const bob = Math.sin(t * 2.2 + b.seed) * 2.5;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(b.pos.x, b.pos.y + 14, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      drawBundle(ctx, b.pos.x, b.pos.y + bob, b.type, 40, true);
    }

    // Aru + carried bundle
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
    const carried = carriedBundle();
    if (carried) {
      const bob = Math.sin(t * 3) * 2;
      drawBundle(ctx, px, py - spriteH + bob - 4, carried.type, 30, false);
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
      placed: builtCount(),
      celebrateT,
      won,
    }),
  };
}
