import { followCamera } from '@/game/engine/camera';
import { RUN_MULTIPLIER } from '../engine/types';
import { moveActor } from '@/game/engine/movement';
import { dist, facingFromDir, type Facing, type Vec2 } from '@/game/engine/types';
import type { Scene, SceneHud } from './types';

const TILE = 64;
const COLS = 20;
const ROWS = 14;
const LEVEL_W = COLS * TILE;
const LEVEL_H = ROWS * TILE;
const VIEW_W = 1024;
const VIEW_H = 592;
const PLAYER_SPEED = 190;
const ACT_RADIUS = 72;
const CELEBRATE_SECONDS = 3;
const FEEDBACK_SECONDS = 3.2;

const tileKey = (c: number, r: number) => `${c},${r}`;
const tileCenter = (c: number, r: number): Vec2 => ({
  x: (c + 0.5) * TILE,
  y: (r + 0.5) * TILE,
});
const POLES = [3, 5, 7, 9, 11, 13, 15, 17].map((c, i) => ({ c, r: 7, number: i + 1 }));
const BANYAN = { c: 2, r: 3 };
const MALLAKHAMB = { c: 17, r: 3 };
const SOLID = new Set([
  tileKey(BANYAN.c, BANYAN.r),
  tileKey(MALLAKHAMB.c, MALLAKHAMB.r),
  ...POLES.map(p => tileKey(p.c, p.r)),
]);

function isWalkable(c: number, r: number): boolean {
  if (c <= 0 || r <= 0 || c >= COLS - 1 || r >= ROWS - 1) return false;
  return !SOLID.has(tileKey(c, r));
}

const FACTS = [
  'Kho-kho me 8 khiladi beech ki line me baith kar khelte hain!',
  'Kabaddi me raider ek hi saans me kabaddi-kabaddi bolta hai!',
  'Mallakhamb — khambe par kasrat aur yoga ka sangam!',
  'Gilli-danda, langdi, kancha — sadiyon purane desi khel!',
];

export function createKhoKhoDaudScene(images: Record<string, HTMLImageElement>): Scene & {
  /** Test/debug hook: lets a headless harness observe sim state. */
  debugState(): { pos: Vec2; tagged: number; celebrateT: number; won: boolean };
} {
  const aru = images.aru;
  const player = { pos: { x: 10.5 * TILE, y: 11.5 * TILE }, facing: 'up' as Facing };
  let tagged = 0;
  let t = 0;
  let celebrateT = 0;
  let won = false;
  let feedback: { text: string; until: number } | null = null;
  const say = (text: string) => {
    feedback = { text, until: t + FEEDBACK_SECONDS };
  };

  function nearestPole(radius: number) {
    let best: (typeof POLES)[number] | null = null;
    let bestD = radius;
    for (const pole of POLES) {
      const d = dist(tileCenter(pole.c, pole.r), player.pos);
      if (d < bestD) {
        best = pole;
        bestD = d;
      }
    }
    return best;
  }

  function handleAction() {
    const pole = nearestPole(ACT_RADIUS);
    if (!pole) {
      say('Central line par agla chamakta khamba dhoondo.');
      return;
    }
    if (pole.number !== tagged + 1) {
      say('Abhi isse nahi — pehle chamakta khamba chhuo!');
      return;
    }
    tagged++;
    if (tagged % 2 === 0) say(FACTS[tagged / 2 - 1]);
    else say(`Shabash! Khamba ${tagged} tag hua — ab agla chamakta khamba.`);
  }

  function update(dt: number, input: { getDir(): Vec2; consumeAction(): boolean; isRunning?(): boolean }) {
    t += dt;
    const act = input.consumeAction();
    if (!won) {
      const dir = input.getDir();
      player.facing = facingFromDir(dir, player.facing);
      player.pos = moveActor(player.pos, dir, PLAYER_SPEED * (input.isRunning?.() ? RUN_MULTIPLIER : 1), dt, TILE, isWalkable, 14, 10);
      if (act && tagged < POLES.length) handleAction();
      if (tagged === POLES.length) {
        celebrateT = Math.min(1, celebrateT + dt / CELEBRATE_SECONDS);
        if (celebrateT >= 1) won = true;
      }
    }
    if (feedback && t > feedback.until) feedback = null;
  }

  function hud(): SceneHud {
    let hint: string;
    if (won) hint = 'Kho-kho daud poori — kya furti dikhayi!';
    else if (tagged === POLES.length) hint = 'Saare khambe tag hue — akhada jashn mana raha hai!';
    else if (feedback) hint = feedback.text;
    else {
      const near = nearestPole(ACT_RADIUS * 1.5);
      hint = near
        ? near.number === tagged + 1
          ? `Khamba ${near.number} chamak raha hai — E ya Space se tag karo.`
          : 'Yeh abhi nahi — agla chamakta khamba dekho.'
        : 'Central line ke chamakte khambe tak daudo aur E ya Space dabao.';
    }
    return { objective: `Khambe chhuo — ${tagged}/8`, hint, won };
  }

  function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.strokeStyle = '#4b321e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 25);
    ctx.stroke();
    ctx.fillStyle = '#c8542e';
    ctx.beginPath();
    ctx.moveTo(x, y - 25);
    ctx.lineTo(x + 17, y - 20 + Math.sin(t * 7 + x) * 2);
    ctx.lineTo(x, y - 14);
    ctx.closePath();
    ctx.fill();
  }

  function drawPole(ctx: CanvasRenderingContext2D, c: number, r: number, number: number) {
    const { x, y } = tileCenter(c, r);
    const isNext = number === tagged + 1;
    if (isNext) {
      const pulse = 0.55 + 0.25 * Math.sin(t * 4);
      ctx.strokeStyle = `rgba(230,183,74,${pulse.toFixed(3)})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y + 7, 28 + Math.sin(t * 4) * 3, 0, Math.PI * 2);
      ctx.stroke();
      const bounce = Math.sin(t * 5) * 5;
      ctx.fillStyle = '#e2b84f';
      ctx.beginPath();
      ctx.moveTo(x, y - 43 + bounce);
      ctx.lineTo(x - 8, y - 55 + bounce);
      ctx.lineTo(x + 8, y - 55 + bounce);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + 23, 17, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#76502d';
    ctx.strokeStyle = '#49301d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 8, y - 28, 16, 54, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f2d898';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), x, y - 5);
    if (number <= tagged) drawFlag(ctx, x + 7, y - 20);
  }

  function drawBanyan(ctx: CanvasRenderingContext2D) {
    const { x, y } = tileCenter(BANYAN.c, BANYAN.r);
    ctx.fillStyle = '#59351f';
    ctx.fillRect(x - 7, y - 5, 14, 30);
    ctx.strokeStyle = '#694428';
    ctx.lineWidth = 2;
    for (const dx of [-20, -10, 12, 22]) {
      ctx.beginPath();
      ctx.moveTo(x + dx, y - 20);
      ctx.lineTo(x + dx, y + 24);
      ctx.stroke();
    }
    ctx.fillStyle = '#405d35';
    ctx.beginPath();
    ctx.arc(x, y - 21, 30, 0, Math.PI * 2);
    ctx.arc(x - 24, y - 12, 18, 0, Math.PI * 2);
    ctx.arc(x + 24, y - 12, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMallakhamb(ctx: CanvasRenderingContext2D) {
    const { x, y } = tileCenter(MALLAKHAMB.c, MALLAKHAMB.r);
    ctx.fillStyle = '#6f4929';
    ctx.beginPath();
    ctx.moveTo(x - 11, y + 26);
    ctx.lineTo(x - 5, y - 25);
    ctx.quadraticCurveTo(x, y - 35, x + 5, y - 25);
    ctx.lineTo(x + 11, y + 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9b6b3d';
    ctx.fillRect(x - 17, y + 22, 34, 7);
  }

  function render(ctx: CanvasRenderingContext2D) {
    const cam = followCamera(player.pos, LEVEL_W, LEVEL_H, VIEW_W, VIEW_H);
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    const c0 = Math.max(0, Math.floor(cam.x / TILE));
    const r0 = Math.max(0, Math.floor(cam.y / TILE));
    const c1 = Math.min(COLS - 1, Math.ceil((cam.x + VIEW_W) / TILE));
    const r1 = Math.min(ROWS - 1, Math.ceil((cam.y + VIEW_H) / TILE));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const px = c * TILE;
        const py = r * TILE;
        const wall = c === 0 || r === 0 || c === COLS - 1 || r === ROWS - 1;
        ctx.fillStyle = wall ? '#67472e' : ((c + r) % 2 ? '#b98e58' : '#c09661');
        ctx.fillRect(px, py, TILE, TILE);
        if (!wall && r === 7) {
          ctx.fillStyle = 'rgba(239,219,170,0.23)';
          ctx.fillRect(px, py + TILE / 2 - 3, TILE, 6);
        }
      }
    }
    // Walkable red-soil wrestling pit.
    const pit = tileCenter(5, 11);
    ctx.fillStyle = '#a85e3d';
    ctx.beginPath();
    ctx.arc(pit.x, pit.y, 76, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ead39e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(pit.x, pit.y, 76, 0, Math.PI * 2);
    ctx.stroke();
    // Small pavilion painted along the bottom wall.
    ctx.fillStyle = '#8d3f2b';
    ctx.fillRect(8 * TILE, 13 * TILE + 7, 4 * TILE, 18);
    ctx.fillStyle = '#e0bd78';
    for (let c = 8; c <= 12; c++) ctx.fillRect(c * TILE, 13 * TILE + 25, 7, 39);
    drawBanyan(ctx);
    drawMallakhamb(ctx);
    POLES.forEach(p => drawPole(ctx, p.c, p.r, p.number));
    if (tagged === POLES.length) {
      const glow = 0.12 + 0.1 * Math.sin(t * 4);
      ctx.fillStyle = `rgba(238,195,88,${glow.toFixed(3)})`;
      ctx.fillRect(TILE, 6.8 * TILE, LEVEL_W - TILE * 2, TILE * 1.4);
    }
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
    ctx.restore();
  }

  return {
    update,
    render,
    hud,
    debugState: () => ({ pos: { ...player.pos }, tagged, celebrateT, won }),
  };
}