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
const PICK_RADIUS = 58;
const ACT_RADIUS = 72;
const CELEBRATE_SECONDS = 3;
const FEEDBACK_SECONDS = 3.2;

type Dye = 'laal' | 'peela' | 'neela';
type PotState = 'ground' | 'carried' | 'poured';
interface Pot {
  id: string;
  color: Dye;
  state: PotState;
  pos: Vec2;
  seed: number;
}

const CENTER = { c: 10, r: 7 };
const PROPS = [
  { c: 2, r: 7, kind: 'loom' },
  { c: 17, r: 7, kind: 'vat' },
  { c: 5, r: 5, kind: 'wheel' },
] as const;
const POT_SPOTS: { color: Dye; c: number; r: number }[] = [
  { color: 'laal', c: 3, r: 3 },
  { color: 'laal', c: 16, r: 11 },
  { color: 'peela', c: 3, r: 11 },
  { color: 'peela', c: 16, r: 3 },
  { color: 'neela', c: 6, r: 2 },
  { color: 'neela', c: 14, r: 12 },
];
const ORDER: Dye[] = ['laal', 'laal', 'peela', 'peela', 'neela', 'neela'];
const LABEL: Record<Dye, string> = { laal: 'LAAL', peela: 'PEELA', neela: 'NEELA' };
const COLOR: Record<Dye, string> = { laal: '#b83a32', peela: '#e6b82f', neela: '#315b91' };
const FACTS = [
  'Majith ki jadon se pakka laal rang banta tha!',
  'Sindoor aur laal — shubh kaamon ka rang!',
  'Haldi se peela rang — rasoi se rangoli tak!',
  'Peela rang basant aur khushi ka prateek hai!',
  'Neel (indigo) Bharat se duniya bhar jata tha — isi se naam INDIGO pada!',
  'Rangoli har pradesh me alag — kolam, alpana, mandana!',
];

const tileKey = (c: number, r: number) => `${c},${r}`;
const SOLID = new Set(PROPS.map(p => tileKey(p.c, p.r)));
const tileCenter = (c: number, r: number): Vec2 => ({ x: (c + 0.5) * TILE, y: (r + 0.5) * TILE });
function isWalkable(c: number, r: number) {
  return c > 0 && r > 0 && c < COLS - 1 && r < ROWS - 1 && !SOLID.has(tileKey(c, r));
}

export function createRangoliRangScene(images: Record<string, HTMLImageElement>): Scene & {
  /** Test/debug hook: lets a headless harness observe sim state. */
  debugState(): { pos: Vec2; carried: Dye | null; poured: number; celebrateT: number; won: boolean };
} {
  const aru = images.aru;
  const player = { pos: { x: 10.5 * TILE, y: 11.5 * TILE }, facing: 'up' as Facing };
  const pots: Pot[] = POT_SPOTS.map((p, i) => ({
    id: `pot${i}`,
    color: p.color,
    state: 'ground',
    pos: tileCenter(p.c, p.r),
    seed: i * 1.7,
  }));
  let carriedId: string | null = null;
  let poured = 0;
  let t = 0;
  let celebrateT = 0;
  let won = false;
  let feedback: { text: string; until: number } | null = null;

  const centerPos = tileCenter(CENTER.c, CENTER.r);
  const carriedPot = () => pots.find(p => p.id === carriedId) ?? null;
  const say = (text: string) => {
    feedback = { text, until: t + FEEDBACK_SECONDS };
  };
  function nearestPot(radius: number) {
    let best: Pot | null = null;
    let bestD = radius;
    for (const pot of pots) {
      if (pot.state !== 'ground') continue;
      const d = dist(pot.pos, player.pos);
      if (d < bestD) {
        best = pot;
        bestD = d;
      }
    }
    return best;
  }
  function handleAction() {
    const carried = carriedPot();
    const atCenter = dist(player.pos, centerPos) < ACT_RADIUS * 1.5;
    if (!carried) {
      const pot = nearestPot(PICK_RADIUS);
      if (pot) {
        pot.state = 'carried';
        carriedId = pot.id;
        say(`${LABEL[pot.color]} rang uthaya — rangoli ke beech tak le jao.`);
      } else if (atCenter && poured < ORDER.length) {
        say(`Ab ${LABEL[ORDER[poured]]} rang chahiye — us rang ka matka dhoondo.`);
      }
      return;
    }
    if (atCenter) {
      const needed = ORDER[poured];
      if (carried.color !== needed) {
        say(`Pehle ${LABEL[needed]} rang ki baari hai — yeh matka sambhal kar rakho.`);
        return;
      }
      carried.state = 'poured';
      carried.pos = centerPos;
      carriedId = null;
      say(FACTS[poured]);
      poured++;
      return;
    }
    const c = Math.floor(player.pos.x / TILE);
    const r = Math.floor(player.pos.y / TILE);
    const spot = tileCenter(c, r);
    const occupied = pots.some(p => p.state === 'ground' && dist(p.pos, spot) < 40);
    if (isWalkable(c, r) && !occupied) {
      carried.state = 'ground';
      carried.pos = spot;
      carriedId = null;
      say('Rang ka matka yahin rakh diya — baad mein phir utha sakte ho.');
    } else {
      say('Matka khuli jagah par rakho.');
    }
  }
  function update(dt: number, input: { getDir(): Vec2; consumeAction(): boolean; isRunning?(): boolean }) {
    t += dt;
    const act = input.consumeAction();
    if (!won) {
      const dir = input.getDir();
      player.facing = facingFromDir(dir, player.facing);
      player.pos = moveActor(player.pos, dir, PLAYER_SPEED * (input.isRunning?.() ? RUN_MULTIPLIER : 1), dt, TILE, isWalkable, 14, 10);
      if (act && poured < ORDER.length) handleAction();
      if (poured === ORDER.length) {
        celebrateT = Math.min(1, celebrateT + dt / CELEBRATE_SECONDS);
        if (celebrateT >= 1) won = true;
      }
    }
    if (feedback && t > feedback.until) feedback = null;
  }
  function hud(): SceneHud {
    let hint: string;
    if (won) hint = 'Rangoli taiyaar — aangan rang aur khushi se bhar gaya!';
    else if (poured === ORDER.length) hint = 'Wah! Rangoli ke teenon rang chamak rahe hain!';
    else if (feedback) hint = feedback.text;
    else if (carriedPot()) hint = `${LABEL[carriedPot()!.color]} matka — rangoli ke beech E ya Space dabao.`;
    else {
      const near = nearestPot(PICK_RADIUS * 1.6);
      hint = near ? `${LABEL[near.color]} rang ka matka — E ya Space se uthao.` : 'Aangan mein rang ke matke dhoondo.';
    }
    return { objective: `Rangoli bharo — ${poured}/6`, hint, won };
  }

  function drawPot(ctx: CanvasRenderingContext2D, x: number, y: number, color: Dye, size = 36) {
    ctx.fillStyle = '#9b5538';
    ctx.strokeStyle = '#573422';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.38, y - size * 0.18);
    ctx.quadraticCurveTo(x - size * 0.55, y + size * 0.35, x, y + size * 0.45);
    ctx.quadraticCurveTo(x + size * 0.55, y + size * 0.35, x + size * 0.38, y - size * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLOR[color];
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.18, size * 0.38, size * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  function drawRangoli(ctx: CanvasRenderingContext2D) {
    const { x, y } = centerPos;
    for (let ring = 3; ring >= 1; ring--) {
      const completed = Math.max(0, Math.min(2, poured - (ring - 1) * 2));
      ctx.fillStyle = completed === 2 ? COLOR[ORDER[(ring - 1) * 2]] : completed === 1
        ? `${COLOR[ORDER[(ring - 1) * 2]]}99` : 'rgba(245,231,197,0.05)';
      ctx.beginPath();
      ctx.arc(x, y, ring * 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#eee0bd';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = 'rgba(89,52,31,0.45)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12);
      ctx.lineTo(x + Math.cos(a) * 126, y + Math.sin(a) * 126);
      ctx.stroke();
    }
  }
  function drawProp(ctx: CanvasRenderingContext2D, p: (typeof PROPS)[number]) {
    const x = p.c * TILE;
    const y = p.r * TILE;
    ctx.fillStyle = '#704a31';
    ctx.strokeStyle = '#49301f';
    ctx.lineWidth = 4;
    if (p.kind === 'loom') {
      ctx.strokeRect(x + 9, y + 7, 46, 51);
      for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(x + 16 + i * 8, y + 10); ctx.lineTo(x + 16 + i * 8, y + 55); ctx.stroke();
      }
    } else if (p.kind === 'vat') {
      ctx.fillRect(x + 5, y + 17, 54, 34);
      ctx.fillStyle = '#315b91'; ctx.fillRect(x + 10, y + 20, 44, 10);
    } else {
      ctx.beginPath(); ctx.arc(x + 32, y + 36, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c08a58'; ctx.beginPath(); ctx.arc(x + 32, y + 36, 12, 0, Math.PI * 2); ctx.fill();
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
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const x = c * TILE;
      const y = r * TILE;
      const wall = c === 0 || r === 0 || c === COLS - 1 || r === ROWS - 1;
      ctx.fillStyle = wall ? '#6e5136' : (c + r) % 2 ? '#b99868' : '#c2a06e';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = wall ? 'rgba(0,0,0,.25)' : 'rgba(80,45,20,.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
    drawRangoli(ctx);
    for (const p of PROPS) drawProp(ctx, p);
    for (const pot of pots) if (pot.state === 'ground') {
      const bob = Math.sin(t * 2.2 + pot.seed) * 2;
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      ctx.beginPath(); ctx.ellipse(pot.pos.x, pot.pos.y + 15, 17, 6, 0, 0, Math.PI * 2); ctx.fill();
      drawPot(ctx, pot.pos.x, pot.pos.y + bob, pot.color);
    }
    if (poured === ORDER.length) {
      const a = 0.12 + 0.1 * Math.sin(t * 4);
      ctx.fillStyle = `rgba(232,200,119,${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(centerPos.x, centerPos.y, 145 + celebrateT * 15, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? '#e6b82f' : '#b83a32';
        ctx.beginPath();
        ctx.arc(centerPos.x + Math.cos(i * Math.PI / 4) * 150, centerPos.y + Math.sin(i * Math.PI / 4) * 150, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const px = player.pos.x;
    const py = player.pos.y;
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(px, py + 10, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
    const spriteH = 64;
    const spriteW = aru ? (aru.width / Math.max(1, aru.height)) * spriteH : 40;
    if (aru) {
      ctx.save();
      if (player.facing === 'left') {
        ctx.translate(px, 0); ctx.scale(-1, 1); ctx.drawImage(aru, -spriteW / 2, py - spriteH + 12, spriteW, spriteH);
      } else ctx.drawImage(aru, px - spriteW / 2, py - spriteH + 12, spriteW, spriteH);
      ctx.restore();
    }
    const carried = carriedPot();
    if (carried) drawPot(ctx, px, py - spriteH - 1 + Math.sin(t * 3) * 2, carried.color, 28);
    ctx.restore();
  }
  return {
    update, render, hud,
    debugState: () => ({ pos: { ...player.pos }, carried: carriedPot()?.color ?? null, poured, celebrateT, won }),
  };
}