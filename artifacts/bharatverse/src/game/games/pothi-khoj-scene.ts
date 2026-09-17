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

type Subject = 'ayurveda' | 'ganit' | 'jyotish';
type PothiState = 'ground' | 'carried' | 'shelved';

interface Pothi {
  id: string;
  subject: Subject;
  state: PothiState;
  pos: Vec2;
  seed: number;
}

interface Shelf {
  subject: Subject;
  c: number;
  r: number;
}

const tileKey = (c: number, r: number) => `${c},${r}`;
const tileCenter = (c: number, r: number): Vec2 => ({
  x: (c + 0.5) * TILE,
  y: (r + 0.5) * TILE,
});

const SHELVES: Shelf[] = [
  { subject: 'ayurveda', c: 4, r: 2 },
  { subject: 'ganit', c: 10, r: 2 },
  { subject: 'jyotish', c: 16, r: 2 },
];
const POTHI_SPOTS: { subject: Subject; c: number; r: number }[] = [
  { subject: 'ayurveda', c: 2, r: 7 },
  { subject: 'ayurveda', c: 6, r: 11 },
  { subject: 'ganit', c: 9, r: 6 },
  { subject: 'ganit', c: 12, r: 11 },
  { subject: 'jyotish', c: 17, r: 7 },
  { subject: 'jyotish', c: 14, r: 5 },
];
const BODHI = { c: 7, r: 8 };
const STUPAS = [
  { c: 2, r: 4 },
  { c: 17, r: 10 },
];
const SOLID = new Set<string>([
  tileKey(BODHI.c, BODHI.r),
  ...STUPAS.map(s => tileKey(s.c, s.r)),
  ...SHELVES.map(s => tileKey(s.c, s.r)),
]);

function isWalkable(c: number, r: number): boolean {
  if (c <= 0 || r <= 0 || c >= COLS - 1 || r >= ROWS - 1) return false;
  return !SOLID.has(tileKey(c, r));
}

const NAME: Record<Subject, string> = {
  ayurveda: 'Ayurveda',
  ganit: 'Ganit',
  jyotish: 'Jyotish',
};
const PICK_LINE: Record<Subject, string> = {
  ayurveda: 'Ayurveda ki pothi uthayi — patte ke icon wali taak dhoondo.',
  ganit: 'Ganit ki pothi uthayi — shunya ke icon wali taak dhoondo.',
  jyotish: 'Jyotish ki pothi uthayi — taare ke icon wali taak dhoondo.',
};
const FACTS = [
  'Nalanda ke Dharmaganja pustakalaya me 9 lakh se zyada pothiyan thi!',
  'Cheen se bhikshu Xuanzang yahan padhne aaye the!',
  'Aryabhata ne shunya (0) se ganit badal diya!',
  'Nalanda me 10,000 se zyada vidyarthi padhte the!',
  'Jyotish se log taaron ki chaal samajhte the!',
  'Ayurveda — jadi-bootiyon se ilaaj ka purana gyan!',
];

export function createPothiKhojScene(
  images: Record<string, HTMLImageElement>
): Scene & {
  /** Test/debug hook: lets a headless harness observe sim state. */
  debugState(): {
    pos: Vec2;
    carried: Subject | null;
    shelved: number;
    celebrateT: number;
    won: boolean;
  };
} {
  const aru = images.aru;
  const player = { pos: { x: 10.5 * TILE, y: 11.5 * TILE }, facing: 'up' as Facing };
  const pothis: Pothi[] = POTHI_SPOTS.map((p, i) => ({
    id: `p${i}`,
    subject: p.subject,
    state: 'ground',
    pos: tileCenter(p.c, p.r),
    seed: i * 1.7,
  }));
  let carriedId: string | null = null;
  let t = 0;
  let celebrateT = 0;
  let won = false;
  let feedback: { text: string; until: number } | null = null;

  const carriedPothi = () => pothis.find(p => p.id === carriedId) ?? null;
  const shelvedCount = () => pothis.filter(p => p.state === 'shelved').length;
  const allShelved = () => shelvedCount() === pothis.length;
  const shelfCount = (subject: Subject) =>
    pothis.filter(p => p.subject === subject && p.state === 'shelved').length;
  const say = (text: string) => {
    feedback = { text, until: t + FEEDBACK_SECONDS };
  };

  function nearestGround(radius: number): Pothi | null {
    let best: Pothi | null = null;
    let bestD = radius;
    for (const p of pothis) {
      if (p.state !== 'ground') continue;
      const d = dist(p.pos, player.pos);
      if (d < bestD) {
        best = p;
        bestD = d;
      }
    }
    return best;
  }

  function nearestShelf(radius: number): Shelf | null {
    let best: Shelf | null = null;
    let bestD = radius;
    for (const shelf of SHELVES) {
      const d = dist(tileCenter(shelf.c, shelf.r), player.pos);
      if (d < bestD) {
        best = shelf;
        bestD = d;
      }
    }
    return best;
  }

  function handleAction() {
    const carried = carriedPothi();
    if (!carried) {
      const found = nearestGround(PICK_RADIUS);
      if (found) {
        found.state = 'carried';
        carriedId = found.id;
        say(PICK_LINE[found.subject]);
      } else if (nearestShelf(ACT_RADIUS)) {
        say('Pehle courtyard me bikhri pothiyan dhoondo.');
      }
      return;
    }

    const shelf = nearestShelf(ACT_RADIUS);
    if (shelf) {
      if (shelf.subject !== carried.subject) {
        say(`Yeh ${NAME[shelf.subject]} ki taak hai — Icon milao aur sahi taak chuno!`);
      } else {
        carried.state = 'shelved';
        carried.pos = tileCenter(shelf.c, shelf.r);
        carriedId = null;
        say(FACTS[shelvedCount() - 1]);
      }
      return;
    }

    const c = Math.floor(player.pos.x / TILE);
    const r = Math.floor(player.pos.y / TILE);
    const spot = tileCenter(c, r);
    const occupied = pothis.some(p => p.state === 'ground' && dist(p.pos, spot) < 40);
    if (isWalkable(c, r) && !occupied) {
      carried.state = 'ground';
      carried.pos = spot;
      carriedId = null;
      say('Pothi sambhal kar neeche rakh di.');
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
      if (act && !allShelved()) handleAction();
      if (allShelved()) {
        celebrateT = Math.min(1, celebrateT + dt / CELEBRATE_SECONDS);
        if (celebrateT >= 1) won = true;
      }
    }
    if (feedback && t > feedback.until) feedback = null;
  }

  function hud(): SceneHud {
    let hint: string;
    if (won) hint = 'Sab pothiyan surakshit — Nalanda ka gyan phir jagmaga utha!';
    else if (allShelved()) hint = 'Wah! Teenon taak gyan se bhar gayin!';
    else if (feedback) hint = feedback.text;
    else {
      const carried = carriedPothi();
      if (carried) hint = `${NAME[carried.subject]} ki pothi haath mein — matching icon wali taak par E ya Space.`;
      else {
        const near = nearestGround(PICK_RADIUS * 1.6);
        hint = near
          ? `${NAME[near.subject]} ki pothi — E ya Space se uthao.`
          : 'Courtyard me pothiyan dhoondo aur matching taak tak le jao.';
      }
    }
    return { objective: `Pothiyan rakho — ${shelvedCount()}/6`, hint, won };
  }

  function drawIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    subject: Subject,
    size: number,
    color: string
  ) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(2, size * 0.12);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (subject === 'ayurveda') {
      ctx.beginPath();
      ctx.ellipse(x, y, size * 0.28, size * 0.45, Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - size * 0.25, y + size * 0.25);
      ctx.lineTo(x + size * 0.25, y - size * 0.25);
      ctx.stroke();
    } else if (subject === 'ganit') {
      ctx.beginPath();
      ctx.arc(x, y, size * 0.34, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const radius = i % 2 === 0 ? size * 0.42 : size * 0.18;
        const px = x + Math.cos(a) * radius;
        const py = y + Math.sin(a) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  function drawPothi(ctx: CanvasRenderingContext2D, x: number, y: number, subject: Subject, size: number) {
    ctx.fillStyle = '#c99b52';
    ctx.strokeStyle = '#56351f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - size / 2, y - size * 0.27, size, size * 0.54, 5);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#9d3f2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.27);
    ctx.lineTo(x, y + size * 0.27);
    ctx.stroke();
    drawIcon(ctx, x - size * 0.22, y, subject, size * 0.42, '#4b2e1d');
  }

  function drawShelf(ctx: CanvasRenderingContext2D, shelf: Shelf, index: number) {
    const px = shelf.c * TILE;
    const py = shelf.r * TILE;
    const pulse = 0.18 + 0.1 * Math.sin(t * 3 + index);
    ctx.fillStyle = '#643221';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = `rgba(239,190,86,${pulse.toFixed(3)})`;
    ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
    ctx.fillStyle = '#2f1c16';
    ctx.beginPath();
    ctx.roundRect(px + 9, py + 9, TILE - 18, TILE - 18, 18);
    ctx.fill();
    drawIcon(ctx, px + TILE / 2, py + 23, shelf.subject, 22, '#e6bd62');
    const count = shelfCount(shelf.subject);
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = i === 0 ? '#c99b52' : '#d8ae68';
      ctx.fillRect(px + 13 + i * 20, py + 42, 17, 9);
      ctx.fillStyle = '#9d3f2b';
      ctx.fillRect(px + 20 + i * 20, py + 42, 3, 9);
    }
  }

  function drawTree(ctx: CanvasRenderingContext2D) {
    const { x, y } = tileCenter(BODHI.c, BODHI.r);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + 19, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#59351f';
    ctx.fillRect(x - 6, y - 4, 12, 29);
    ctx.fillStyle = '#3f6137';
    ctx.beginPath();
    ctx.arc(x, y - 20, 27, 0, Math.PI * 2);
    ctx.arc(x - 20, y - 10, 18, 0, Math.PI * 2);
    ctx.arc(x + 20, y - 10, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStupa(ctx: CanvasRenderingContext2D, c: number, r: number) {
    const { x, y } = tileCenter(c, r);
    ctx.fillStyle = '#d3b27b';
    ctx.fillRect(x - 24, y + 13, 48, 9);
    ctx.beginPath();
    ctx.arc(x, y + 11, 20, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - 3, y - 18, 6, 18);
    ctx.fillStyle = '#a6472f';
    ctx.fillRect(x - 11, y - 20, 22, 4);
  }

  function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.strokeStyle = '#4a3520';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 20);
    ctx.stroke();
    ctx.fillStyle = '#c8542e';
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x + 15, y - 15 + Math.sin(t * 6 + x) * 2);
    ctx.lineTo(x, y - 10);
    ctx.closePath();
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
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const px = c * TILE;
        const py = r * TILE;
        const wall = c === 0 || r === 0 || c === COLS - 1 || r === ROWS - 1;
        ctx.fillStyle = wall ? ((c + r) % 2 ? '#783b28' : '#87452e') : ((c + r) % 2 ? '#b88f5e' : '#c09a68');
        ctx.fillRect(px, py, TILE, TILE);
        if (wall) {
          ctx.strokeStyle = 'rgba(45,20,10,0.35)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
        } else if (c === 10 || r === 7) {
          ctx.fillStyle = 'rgba(225,199,146,0.22)';
          ctx.fillRect(px, py, TILE, TILE);
        }
      }
    }
    SHELVES.forEach((s, i) => drawShelf(ctx, s, i));
    drawTree(ctx);
    STUPAS.forEach(s => drawStupa(ctx, s.c, s.r));
    for (const p of pothis) {
      if (p.state !== 'ground') continue;
      const bob = Math.sin(t * 2.3 + p.seed) * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(p.pos.x, p.pos.y + 11, 19, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      drawPothi(ctx, p.pos.x, p.pos.y + bob, p.subject, 43);
    }
    if (allShelved()) {
      SHELVES.forEach((s, i) => {
        if (celebrateT * 4 > i + 1) drawFlag(ctx, (s.c + 1) * TILE - 12, s.r * TILE + 8);
      });
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
    const carried = carriedPothi();
    if (carried) drawPothi(ctx, px, py - spriteH - 2 + Math.sin(t * 3) * 2, carried.subject, 32);
    ctx.restore();
  }

  return {
    update,
    render,
    hud,
    debugState: () => ({
      pos: { ...player.pos },
      carried: carriedPothi()?.subject ?? null,
      shelved: shelvedCount(),
      celebrateT,
      won,
    }),
  };
}