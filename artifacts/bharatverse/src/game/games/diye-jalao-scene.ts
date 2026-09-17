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

interface Diya { pos: Vec2; lit: boolean; litAt: number }
const JYOT = { c: 10, r: 6 };
const DIYA_SPOTS = [{ c: 3, r: 3 }, { c: 16, r: 3 }, { c: 3, r: 10 }, { c: 16, r: 10 }, { c: 7, r: 12 }, { c: 13, r: 12 }];
const PROPS = [
  { c: 3, r: 6, kind: 'jhoola' },
  { c: 6, r: 2, kind: 'stall' },
  { c: 13, r: 2, kind: 'stall' },
  { c: 16, r: 6, kind: 'bell' },
] as const;
const FACTS = [
  'Diwali — Ram ji ke Ayodhya lautne ki khushi me deep jale the!',
  'Dev Deepavali par Kashi ke ghat lakhon diyon se sajte hain!',
  'Chhath me ugte suraj ko arghya diya jata hai!',
  'Onam me phoolon ki pookalam sajti hai — phoolon ki rangoli!',
  'Pongal me nayi fasal ka dhanyavaad karte hain!',
  'Har diya kehta hai — andhere par ujale ki jeet!',
];
const tileKey = (c: number, r: number) => `${c},${r}`;
const SOLID = new Set([tileKey(JYOT.c, JYOT.r), ...PROPS.map(p => tileKey(p.c, p.r))]);
const tileCenter = (c: number, r: number): Vec2 => ({ x: (c + 0.5) * TILE, y: (r + 0.5) * TILE });
function isWalkable(c: number, r: number) {
  return c > 0 && r > 0 && c < COLS - 1 && r < ROWS - 1 && !SOLID.has(tileKey(c, r));
}

export function createDiyeJalaoScene(images: Record<string, HTMLImageElement>): Scene & {
  /** Test/debug hook: lets a headless harness observe sim state. */
  debugState(): { pos: Vec2; carryingFlame: boolean; lit: number; celebrateT: number; won: boolean };
} {
  const aru = images.aru;
  const player = { pos: { x: 10.5 * TILE, y: 11.5 * TILE }, facing: 'up' as Facing };
  const diyas: Diya[] = DIYA_SPOTS.map(p => ({ pos: tileCenter(p.c, p.r), lit: false, litAt: -10 }));
  const jyotPos = tileCenter(JYOT.c, JYOT.r);
  let carryingFlame = false;
  let t = 0;
  let celebrateT = 0;
  let won = false;
  let feedback: { text: string; until: number } | null = null;
  const litCount = () => diyas.filter(d => d.lit).length;
  const say = (text: string) => { feedback = { text, until: t + FEEDBACK_SECONDS }; };
  function nearestUnlit(radius: number) {
    let best: Diya | null = null;
    let bestD = radius;
    for (const diya of diyas) {
      if (diya.lit) continue;
      const d = dist(diya.pos, player.pos);
      if (d < bestD) { best = diya; bestD = d; }
    }
    return best;
  }
  function handleAction() {
    const diya = nearestUnlit(PICK_RADIUS);
    if (diya) {
      if (!carryingFlame) {
        say('Pehle jyot se lau lo, phir is diye ko jalao.');
        return;
      }
      const n = litCount();
      diya.lit = true;
      diya.litAt = t;
      carryingFlame = false;
      say(FACTS[n]);
      return;
    }
    if (dist(player.pos, jyotPos) < ACT_RADIUS) {
      if (!carryingFlame) {
        carryingFlame = true;
        say('Lau mil gayi — ab kisi diye tak le jao.');
      } else say('Lau tumhare saath hai — ab diye tak le jao.');
      return;
    }
    if (carryingFlame) say('Lau ko sambhalo — kisi diye tak le jao.');
  }
  function update(dt: number, input: { getDir(): Vec2; consumeAction(): boolean; isRunning?(): boolean }) {
    t += dt;
    const act = input.consumeAction();
    if (!won) {
      const dir = input.getDir();
      player.facing = facingFromDir(dir, player.facing);
      player.pos = moveActor(player.pos, dir, PLAYER_SPEED * (input.isRunning?.() ? RUN_MULTIPLIER : 1), dt, TILE, isWalkable, 14, 10);
      if (act && litCount() < diyas.length) handleAction();
      if (litCount() === diyas.length) {
        celebrateT = Math.min(1, celebrateT + dt / CELEBRATE_SECONDS);
        if (celebrateT >= 1) won = true;
      }
    }
    if (feedback && t > feedback.until) feedback = null;
  }
  function hud(): SceneHud {
    let hint: string;
    if (won) hint = 'Aangan roshan — har diya milkar andhera door karta hai!';
    else if (litCount() === diyas.length) hint = 'Dekho, poora aangan jagmaga utha!';
    else if (feedback) hint = feedback.text;
    else if (carryingFlame) hint = 'Lau ko kisi unlit diye tak le jao aur E ya Space dabao.';
    else if (dist(player.pos, jyotPos) < ACT_RADIUS * 1.5) hint = 'Akhand jyot — E ya Space se lau lo.';
    else hint = 'Akhand jyot se lau lo, phir chhe diye jalao.';
    return { objective: `Diye jalao — ${litCount()}/6`, hint, won };
  }

  function drawFlame(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    const flick = Math.sin(t * 9 + x * 0.01) * size * 0.08;
    ctx.fillStyle = '#ff8a35';
    ctx.beginPath();
    ctx.moveTo(x, y - size + flick);
    ctx.quadraticCurveTo(x + size * 0.65, y - size * 0.25, x, y);
    ctx.quadraticCurveTo(x - size * 0.65, y - size * 0.25, x, y - size + flick);
    ctx.fill();
    ctx.fillStyle = '#ffe07a';
    ctx.beginPath(); ctx.ellipse(x, y - size * 0.28, size * 0.2, size * 0.32, 0, 0, Math.PI * 2); ctx.fill();
  }
  function drawDiya(ctx: CanvasRenderingContext2D, diya: Diya) {
    const x = diya.pos.x;
    const y = diya.pos.y;
    if (diya.lit) {
      const glow = ctx.createRadialGradient(x, y - 8, 2, x, y - 8, 45);
      glow.addColorStop(0, 'rgba(255,205,90,.62)');
      glow.addColorStop(1, 'rgba(255,145,45,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y - 8, 45, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#a95434';
    ctx.strokeStyle = '#572d21';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 15, y); ctx.quadraticCurveTo(x, y + 18, x + 15, y); ctx.quadraticCurveTo(x, y + 7, x - 15, y); ctx.fill(); ctx.stroke();
    if (diya.lit) {
      drawFlame(ctx, x, y, 20);
      const age = t - diya.litAt;
      if (age < 1) for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 + t;
        ctx.fillStyle = '#ffe69a';
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * (18 + age * 18), y - 8 + Math.sin(a) * (18 + age * 18), 2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  function drawProp(ctx: CanvasRenderingContext2D, p: (typeof PROPS)[number]) {
    const x = p.c * TILE;
    const y = p.r * TILE;
    ctx.strokeStyle = '#4b2c25';
    ctx.fillStyle = '#744533';
    ctx.lineWidth = 4;
    if (p.kind === 'jhoola') {
      ctx.beginPath(); ctx.moveTo(x + 8, y + 58); ctx.lineTo(x + 18, y + 8); ctx.lineTo(x + 47, y + 8); ctx.lineTo(x + 57, y + 58); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 25, y + 9); ctx.lineTo(x + 25, y + 42); ctx.moveTo(x + 41, y + 9); ctx.lineTo(x + 41, y + 42); ctx.stroke();
      ctx.fillRect(x + 21, y + 40, 24, 7);
    } else if (p.kind === 'stall') {
      ctx.fillRect(x + 7, y + 25, 50, 31);
      ctx.fillStyle = '#d58a32'; ctx.fillRect(x + 3, y + 12, 58, 15);
      ctx.fillStyle = '#f1c65b'; for (let i = 0; i < 4; i += 2) ctx.fillRect(x + 3 + i * 14.5, y + 12, 14.5, 15);
    } else {
      ctx.fillRect(x + 27, y + 9, 10, 50);
      ctx.fillStyle = '#d9a94a'; ctx.beginPath(); ctx.arc(x + 32, y + 18, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4b2c25'; ctx.beginPath(); ctx.arc(x + 32, y + 18, 5, 0, Math.PI * 2); ctx.fill();
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
      ctx.fillStyle = wall ? '#4b302b' : (c + r) % 2 ? '#66505a' : '#705660';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = wall ? 'rgba(0,0,0,.35)' : 'rgba(255,220,160,.05)';
      ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, TILE - 1, TILE - 1);
      if (r === 0 && c > 0 && c < COLS - 1) {
        ctx.fillStyle = c % 2 ? '#dc8e2f' : '#edb43d';
        ctx.beginPath(); ctx.arc(x + 16, y + 54, 7, 0, Math.PI * 2); ctx.arc(x + 32, y + 57, 7, 0, Math.PI * 2); ctx.arc(x + 48, y + 54, 7, 0, Math.PI * 2); ctx.fill();
      }
    }
    const warm = litCount() * 0.025;
    ctx.fillStyle = `rgba(255,157,62,${warm.toFixed(3)})`;
    ctx.fillRect(0, 0, LEVEL_W, LEVEL_H);
    for (const p of PROPS) drawProp(ctx, p);
    const jx = JYOT.c * TILE;
    const jy = JYOT.r * TILE;
    const jyotGlow = ctx.createRadialGradient(jyotPos.x, jyotPos.y - 10, 4, jyotPos.x, jyotPos.y - 10, 72);
    jyotGlow.addColorStop(0, 'rgba(255,207,93,.65)'); jyotGlow.addColorStop(1, 'rgba(255,130,40,0)');
    ctx.fillStyle = jyotGlow; ctx.beginPath(); ctx.arc(jyotPos.x, jyotPos.y - 10, 72, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6e4938'; ctx.fillRect(jx + 7, jy + 23, 50, 34);
    ctx.fillStyle = '#d49a42'; ctx.beginPath(); ctx.ellipse(jyotPos.x, jy + 24, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
    drawFlame(ctx, jyotPos.x, jy + 22, 30);
    for (const diya of diyas) drawDiya(ctx, diya);
    if (litCount() === diyas.length) {
      for (let i = 0; i < 10; i++) {
        const x = 120 + i * 112;
        const wave = Math.sin(t * 6 + i) * 3;
        ctx.strokeStyle = '#59362a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 120); ctx.lineTo(x, 92); ctx.stroke();
        ctx.fillStyle = i % 2 ? '#d9a94a' : '#c8542e'; ctx.beginPath(); ctx.moveTo(x, 92); ctx.lineTo(x + 18, 98 + wave); ctx.lineTo(x, 105); ctx.fill();
      }
    }
    const px = player.pos.x;
    const py = player.pos.y;
    if (carryingFlame) {
      const glow = ctx.createRadialGradient(px, py - 30, 2, px, py - 30, 55);
      glow.addColorStop(0, 'rgba(255,210,100,.55)'); glow.addColorStop(1, 'rgba(255,140,40,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(px, py - 30, 55, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(px, py + 10, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
    const spriteH = 64;
    const spriteW = aru ? (aru.width / Math.max(1, aru.height)) * spriteH : 40;
    if (aru) {
      ctx.save();
      if (player.facing === 'left') {
        ctx.translate(px, 0); ctx.scale(-1, 1); ctx.drawImage(aru, -spriteW / 2, py - spriteH + 12, spriteW, spriteH);
      } else ctx.drawImage(aru, px - spriteW / 2, py - spriteH + 12, spriteW, spriteH);
      ctx.restore();
    }
    if (carryingFlame) drawFlame(ctx, px, py - spriteH + 3, 18);
    ctx.restore();
  }
  return {
    update, render, hud,
    debugState: () => ({ pos: { ...player.pos }, carryingFlame, lit: litCount(), celebrateT, won }),
  };
}