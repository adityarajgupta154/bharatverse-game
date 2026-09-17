import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'wouter';
import { getWorld } from '@/game/worlds';
import { SINDHU_COLLISION } from '@/game/worlds/sindhu-ghati/walk';
import {
  NPC_RANGE,
  WALK_TILE,
  maskFromCollisionGrid,
  reachableTiles,
  serializeCollisionGrid,
  tileCenter,
} from '@/game/world-walk';
import type { WorldCollisionGrid } from '@/game/world-types';

/**
 * /dev/mask-editor — DEV-ONLY collision authoring tool (Movement Bridge PRD
 * Task 1). Paints blocked/walkable tiles over the village art and exports
 * the canonical village-collision.json text (same serializer the repo
 * stores, so diffs stay reviewable). Live BFS from the spawn highlights
 * unreachable-but-walkable tiles the moment an edit strands them.
 *
 * The tool never writes files itself: author here → Copy JSON → paste into
 * src/game/worlds/sindhu-ghati/village-collision.json → verify:games proves
 * reachability headlessly. Rendered through a document.body portal because
 * the app shell scales its stage with a CSS transform (fixed-position UI
 * inside a transformed ancestor breaks).
 */

const WORLD_ID = 'sindhu-ghati';
const ZOOMS = [0.5, 0.75, 1] as const;

type Paint = 'block' | 'clear';

export default function MaskEditorScreen() {
  const entry = getWorld(WORLD_ID);
  const grid0 = SINDHU_COLLISION;
  const rows = grid0.rows;
  const cols = grid0.cols;

  const [blocked, setBlocked] = useState<Set<string>>(
    () => new Set(grid0.blocked.map(([r, c]) => `${r},${c}`))
  );
  // ?zoom=50|75|100 — lets authoring sessions/screenshots deep-link a scale.
  const [zoom, setZoom] = useState<(typeof ZOOMS)[number]>(() => {
    const z = new URLSearchParams(window.location.search).get('zoom');
    return ZOOMS.find(v => String(Math.round(v * 100)) === z) ?? 0.5;
  });
  const [importText, setImportText] = useState('');
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const paintRef = useRef<Paint | null>(null);

  useEffect(() => {
    const end = () => {
      paintRef.current = null;
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, []);

  const gridJson: WorldCollisionGrid = useMemo(
    () => ({
      cols,
      rows,
      tileSize: WALK_TILE,
      blocked: [...blocked]
        .map(k => k.split(',').map(Number) as [number, number])
        .sort((a, b) => a[0] - b[0] || a[1] - b[1]),
    }),
    [blocked, cols, rows]
  );
  const mask = useMemo(() => maskFromCollisionGrid(gridJson), [gridJson]);
  const exportText = useMemo(() => serializeCollisionGrid(gridJson), [gridJson]);

  const spawn = entry?.walk?.spawn ?? { x: 0, y: 0 };
  const reach = useMemo(() => reachableTiles({ mask, spawn }), [mask, spawn]);

  const { walkableCount, unreachable } = useMemo(() => {
    let walkableCount = 0;
    const unreachable: [number, number][] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (mask[r][c] === '.') {
          walkableCount++;
          if (!reach[r]?.[c]) unreachable.push([r, c]);
        }
    return { walkableCount, unreachable };
  }, [mask, reach, rows, cols]);

  const checks = useMemo(() => {
    if (!entry) return [];
    const spawnCol = Math.floor(spawn.x / WALK_TILE);
    const spawnRow = Math.floor(spawn.y / WALK_TILE);
    const spawnOk = mask[spawnRow]?.[spawnCol] === '.';

    const anchorless: string[] = [];
    const strandedAnchors: string[] = [];
    for (const b of entry.config.buildings) {
      if (!b.anchorTile) anchorless.push(b.id);
      else if (!reach[b.anchorTile.row]?.[b.anchorTile.col]) strandedAnchors.push(b.id);
    }

    const reachCenters: { x: number; y: number }[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) if (reach[r]?.[c]) reachCenters.push(tileCenter(c, r));
    const exceptions = new Set(entry.walk?.voiceExceptions ?? []);
    const strandedNpcs = entry.config.npcs
      .filter(n => !exceptions.has(n.id))
      .filter(
        n =>
          !reachCenters.some(p => Math.hypot(p.x - n.position.x, p.y - n.position.y) <= NPC_RANGE)
      )
      .map(n => n.id);

    return [
      { label: `Spawn tile [${spawnRow},${spawnCol}] walkable`, ok: spawnOk, detail: '' },
      {
        label: 'Building anchors reachable',
        ok: anchorless.length === 0 && strandedAnchors.length === 0,
        detail: [...strandedAnchors, ...anchorless.map(id => `${id} (no anchor)`)].join(', '),
      },
      {
        label: `NPCs within voice range (${NPC_RANGE}px)`,
        ok: strandedNpcs.length === 0,
        detail: strandedNpcs.join(', '),
      },
      {
        label: 'No stranded walkable tiles',
        ok: unreachable.length === 0,
        detail: unreachable.length ? `${unreachable.length} tile(s)` : '',
      },
    ];
  }, [entry, mask, reach, spawn, unreachable, rows, cols]);

  if (!import.meta.env.DEV || !entry?.walk) return null;
  const { config, art } = entry;
  const cell = WALK_TILE * zoom;

  const applyPaint = (r: number, c: number) => {
    const mode = paintRef.current;
    if (!mode) return;
    setBlocked(prev => {
      const key = `${r},${c}`;
      const has = prev.has(key);
      if (mode === 'block' ? has : !has) return prev;
      const next = new Set(prev);
      if (mode === 'block') next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const loadGrid = (text: string, source: string) => {
    try {
      const parsed = JSON.parse(text) as WorldCollisionGrid;
      maskFromCollisionGrid(parsed); // throws with a clear message if malformed
      if (parsed.cols !== cols || parsed.rows !== rows)
        throw new Error(`grid must be ${cols}x${rows} for this world`);
      setBlocked(new Set(parsed.blocked.map(([r, c]) => `${r},${c}`)));
      setNotice({ kind: 'ok', text: `Loaded ${source}.` });
    } catch (e) {
      setNotice({ kind: 'err', text: `Import failed: ${(e as Error).message}` });
    }
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setNotice({ kind: 'ok', text: 'JSON copied — paste into village-collision.json.' });
    } catch {
      setNotice({ kind: 'err', text: 'Clipboard blocked — select the JSON below and copy.' });
    }
  };

  const downloadJson = () => {
    const url = URL.createObjectURL(new Blob([exportText], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'village-collision.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const badge = (ok: boolean) => (ok ? 'text-emerald-400' : 'text-red-400');

  return createPortal(
    <div
      data-testid="mask-editor"
      className="fixed inset-0 z-[100] overflow-auto bg-[#140f0a] text-amber-50 font-sans"
    >
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/10 bg-[#140f0a]/95 px-4 py-2 backdrop-blur">
        <h1 className="text-sm font-bold tracking-wide">
          Mask Editor — {config.nodeId} <span className="font-normal text-amber-200/60">(DEV only)</span>
        </h1>
        <div className="flex items-center gap-1 text-xs">
          {ZOOMS.map(z => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`rounded px-2 py-0.5 ${z === zoom ? 'bg-amber-400 text-black' : 'bg-white/10 hover:bg-white/20'}`}
            >
              {Math.round(z * 100)}%
            </button>
          ))}
        </div>
        <p className="text-xs text-amber-200/60">Click / drag = toggle blocked ↔ walkable</p>
        <Link href="/" className="ml-auto text-xs text-amber-300 underline hover:text-amber-200">
          ← Hub
        </Link>
      </header>

      <div className="flex items-start gap-4 p-4">
        <div
          className="relative shrink-0 select-none"
          style={{ width: cols * cell, height: rows * cell, touchAction: 'none' }}
        >
          <img
            src={art}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
              gridAutoRows: `${cell}px`,
            }}
          >
            {Array.from({ length: rows * cols }, (_, i) => {
              const r = Math.floor(i / cols);
              const c = i % cols;
              const isBlocked = blocked.has(`${r},${c}`);
              const stranded = !isBlocked && !reach[r]?.[c];
              return (
                <div
                  key={i}
                  data-testid={`mask-cell-${r}-${c}`}
                  title={`[${r},${c}] ${isBlocked ? 'blocked' : stranded ? 'WALKABLE BUT UNREACHABLE' : 'walkable'}`}
                  className={`cursor-crosshair border border-white/10 ${
                    isBlocked ? 'bg-red-600/45' : stranded ? 'bg-amber-400/60' : 'hover:bg-white/10'
                  }`}
                  onPointerDown={e => {
                    e.preventDefault();
                    (e.target as Element).releasePointerCapture?.(e.pointerId);
                    paintRef.current = isBlocked ? 'clear' : 'block';
                    applyPaint(r, c);
                  }}
                  onPointerEnter={() => applyPaint(r, c)}
                />
              );
            })}
          </div>

          {/* read-only markers — spawn, building anchors, NPC anchors */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-500/40 text-[10px] font-bold text-white"
              style={{ left: spawn.x * zoom, top: spawn.y * zoom }}
              title="spawn"
            >
              S
            </div>
            {config.buildings.map(b =>
              b.anchorTile ? (
                <div
                  key={b.id}
                  className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded border-2 border-sky-400 bg-sky-500/40 text-[10px] font-bold text-white"
                  style={{
                    left: tileCenter(b.anchorTile.col, b.anchorTile.row).x * zoom,
                    top: tileCenter(b.anchorTile.col, b.anchorTile.row).y * zoom,
                  }}
                  title={`anchor: ${b.id} (r ${b.interactionRadius ?? 1.5})`}
                >
                  A
                </div>
              ) : null
            )}
            {config.npcs.map(n => {
              const exempt = entry.walk?.voiceExceptions?.includes(n.id);
              return (
                <div
                  key={n.id}
                  className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                    exempt ? 'border-zinc-300 bg-zinc-400/70' : 'border-fuchsia-300 bg-fuchsia-500/80'
                  }`}
                  style={{ left: n.position.x * zoom, top: n.position.y * zoom }}
                  title={`npc: ${n.id}${exempt ? ' (voice exception)' : ''}`}
                />
              );
            })}
          </div>
        </div>

        <aside className="sticky top-12 w-80 shrink-0 space-y-4 text-xs">
          <section className="rounded-lg border border-white/10 bg-white/5 p-3">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-200/70">
              Live status
            </h2>
            <p data-testid="mask-stats">
              Walkable <b>{walkableCount}</b> · Blocked <b>{rows * cols - walkableCount}</b> ·
              Unreachable{' '}
              <b className={unreachable.length ? 'text-amber-400' : 'text-emerald-400'}>
                {unreachable.length}
              </b>
            </p>
            <ul className="mt-2 space-y-1">
              {checks.map(ch => (
                <li key={ch.label} className="flex gap-1.5">
                  <span className={badge(ch.ok)}>{ch.ok ? '✓' : '✗'}</span>
                  <span>
                    {ch.label}
                    {!ch.ok && ch.detail ? (
                      <span className="block text-red-300/80">{ch.detail}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-amber-100/70">
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-sm bg-red-600/60" /> blocked
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-sm bg-amber-400/70" /> unreachable
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-full border-2 border-emerald-400 bg-emerald-500/40" />{' '}
                spawn
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-sm border-2 border-sky-400 bg-sky-500/40" />{' '}
                anchor
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-2.5 w-2.5 rounded-full bg-fuchsia-500/80" /> NPC
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-400/70" /> NPC (exempt)
              </span>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/5 p-3">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-200/70">
              Export
            </h2>
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                data-testid="mask-copy"
                onClick={copyJson}
                className="rounded bg-amber-400 px-2.5 py-1 font-bold text-black hover:bg-amber-300"
              >
                Copy JSON
              </button>
              <button
                onClick={downloadJson}
                className="rounded bg-white/10 px-2.5 py-1 hover:bg-white/20"
              >
                Download
              </button>
              <button
                onClick={() => {
                  setBlocked(new Set(grid0.blocked.map(([r, c]) => `${r},${c}`)));
                  setNotice({ kind: 'ok', text: 'Reset to the saved village-collision.json.' });
                }}
                className="rounded bg-white/10 px-2.5 py-1 hover:bg-white/20"
              >
                Reset
              </button>
            </div>
            <textarea
              readOnly
              value={exportText}
              data-testid="mask-export"
              className="h-36 w-full resize-y rounded border border-white/10 bg-black/40 p-2 font-mono text-[10px] leading-snug text-amber-100"
            />
            <p className="mt-1 text-amber-200/50">
              Paste into <code>src/game/worlds/sindhu-ghati/village-collision.json</code>, then run
              the solvability check.
            </p>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/5 p-3">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-200/70">
              Import
            </h2>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder='Paste a village-collision.json ({"cols":16,...}) here'
              className="h-24 w-full resize-y rounded border border-white/10 bg-black/40 p-2 font-mono text-[10px] leading-snug text-amber-100 placeholder:text-amber-100/30"
            />
            <button
              onClick={() => loadGrid(importText, 'pasted JSON')}
              className="mt-1.5 rounded bg-white/10 px-2.5 py-1 hover:bg-white/20"
            >
              Load pasted JSON
            </button>
          </section>

          {notice ? (
            <p
              data-testid="mask-notice"
              className={`rounded border px-2.5 py-1.5 ${
                notice.kind === 'ok'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/40 bg-red-500/10 text-red-300'
              }`}
            >
              {notice.text}
            </p>
          ) : null}
        </aside>
      </div>
    </div>,
    document.body
  );
}
