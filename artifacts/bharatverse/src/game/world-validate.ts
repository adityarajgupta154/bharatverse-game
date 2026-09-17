/**
 * World-data validation — pure, asset-free, shared by BOTH gates:
 *  - defineWorld() in worlds/index.ts (DEV: throws the moment a world loads)
 *  - scripts/verify-world-data.ts (CI: validates ALL regions headlessly)
 *
 * Two layers, used together:
 *  1. parseWorldBuildings/parseWorldNpcs — STRUCTURAL: narrow the raw JSON
 *     imports field by field (unknown keys are rejected — a typo like
 *     "interactonRadius" must fail, not silently disable a feature). The
 *     region config modules (worlds/<id>/config.ts) call these once at
 *     import, so malformed data fails loudly everywhere, production included.
 *  2. validateWorldData — SEMANTIC: cross-references the typed data
 *     (duplicate ids, dangling links, out-of-bounds positions, game↔building
 *     completion targets, explore/recap content-target existence, walk
 *     mask/spawn/anchor integrity).
 *
 * tsx runs this file directly: runtime imports must stay RELATIVE (no `@/`).
 */
import { STAGE_W, STAGE_H } from '../lib/stage';
import { WALK_TILE, makeIsWalkable } from './world-walk';
import { GAME_BUILDINGS, gameIdFromRouteTarget } from './games/links';
import {
  PENDING_CONTENT_TARGETS,
  contentPartsFromRouteTarget,
  isShippedContent,
} from './content/links';
import type {
  BuildingState,
  BuildingType,
  NpcCategory,
  WorldBuilding,
  WorldCollisionGrid,
  WorldConfig,
  WorldNpc,
  WorldWalkConfig,
} from './world-types';

/** One world's authored data — everything about it EXCEPT vite assets. */
export interface WorldData {
  config: WorldConfig;
  walk?: WorldWalkConfig;
  walkRenderer?: 'canvas' | 'dom';
}

// ---------------------------------------------------------------------------
// Structural layer
// ---------------------------------------------------------------------------

const BUILDING_TYPES: readonly BuildingType[] = [
  'explore',
  'minigame',
  'builder',
  'climax',
  'narrative_gate',
];
const BUILDING_STATES: readonly BuildingState[] = [
  'explored',
  'in_progress',
  'locked',
  'story_mission',
];
const NPC_CATEGORIES: readonly NpcCategory[] = ['ambient', 'context', 'narrator'];

const BUILDING_KEYS = new Set([
  'id', 'name', 'subtitle', 'type', 'initialState', 'position', 'hotspot',
  'anchorTile', 'interactionRadius', 'unlocksAfter', 'routeTarget',
]);
const NPC_KEYS = new Set([
  'id', 'name', 'category', 'position', 'hotspot', 'dialogueLines',
  'linkedBuildingId', 'spriteId', 'waypoints', 'pauseDurationMs',
]);

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isInt = (v: unknown): v is number => isNum(v) && Number.isInteger(v);

function checkKeys(o: Rec, allowed: Set<string>, at: string, errs: string[]) {
  for (const k of Object.keys(o)) {
    if (!allowed.has(k)) errs.push(`${at}: unknown key "${k}" (typo?)`);
  }
}
const XY_KEYS = new Set(['x', 'y']);
const WH_KEYS = new Set(['w', 'h']);
const ROWCOL_KEYS = new Set(['row', 'col']);

function checkXY(v: unknown, at: string, errs: string[]): v is { x: number; y: number } {
  if (!isRec(v) || !isNum(v.x) || !isNum(v.y)) {
    errs.push(`${at} must be { x: number, y: number }`);
    return false;
  }
  checkKeys(v, XY_KEYS, at, errs);
  return true;
}
function checkWH(v: unknown, at: string, errs: string[]) {
  if (!isRec(v) || !isNum(v.w) || !isNum(v.h) || v.w <= 0 || v.h <= 0) {
    errs.push(`${at} must be { w: >0, h: >0 }`);
    return;
  }
  checkKeys(v, WH_KEYS, at, errs);
}
function checkRowCol(v: unknown, at: string, errs: string[]) {
  if (!isRec(v) || !isInt(v.row) || !isInt(v.col) || v.row < 0 || v.col < 0) {
    errs.push(`${at} must be { row: int>=0, col: int>=0 }`);
    return;
  }
  checkKeys(v, ROWCOL_KEYS, at, errs);
}

function fail(where: string, kind: string, errs: string[]): never {
  throw new Error(
    `Invalid ${kind} data for world "${where}":\n- ${errs.join('\n- ')}`
  );
}

/** Narrow a region's buildings.json. Throws listing EVERY problem at once. */
export function parseWorldBuildings(raw: unknown, where: string): WorldBuilding[] {
  const errs: string[] = [];
  if (!Array.isArray(raw)) fail(where, 'buildings', ['buildings.json must be an array']);
  raw.forEach((b, i) => {
    const at = `buildings[${i}]${isRec(b) && isStr(b.id) ? ` ("${b.id}")` : ''}`;
    if (!isRec(b)) {
      errs.push(`${at} must be an object`);
      return;
    }
    checkKeys(b, BUILDING_KEYS, at, errs);
    if (!isStr(b.id)) errs.push(`${at}: id must be a non-empty string`);
    if (!isStr(b.name)) errs.push(`${at}: name must be a non-empty string`);
    if (!isStr(b.subtitle)) errs.push(`${at}: subtitle must be a non-empty string`);
    if (!BUILDING_TYPES.includes(b.type as BuildingType))
      errs.push(`${at}: type "${String(b.type)}" not one of ${BUILDING_TYPES.join('/')}`);
    if (!BUILDING_STATES.includes(b.initialState as BuildingState))
      errs.push(`${at}: initialState "${String(b.initialState)}" not one of ${BUILDING_STATES.join('/')}`);
    checkXY(b.position, `${at}: position`, errs);
    checkWH(b.hotspot, `${at}: hotspot`, errs);
    if (b.anchorTile !== undefined) checkRowCol(b.anchorTile, `${at}: anchorTile`, errs);
    if (b.interactionRadius !== undefined && (!isNum(b.interactionRadius) || b.interactionRadius <= 0))
      errs.push(`${at}: interactionRadius must be a number > 0`);
    if (!Array.isArray(b.unlocksAfter) || b.unlocksAfter.some(d => !isStr(d)))
      errs.push(`${at}: unlocksAfter must be an array of building ids`);
    if (!isStr(b.routeTarget)) errs.push(`${at}: routeTarget must be a non-empty string`);
  });
  if (errs.length > 0) fail(where, 'buildings', errs);
  return raw as WorldBuilding[];
}

/** Narrow a region's npcs.json. Throws listing EVERY problem at once. */
export function parseWorldNpcs(raw: unknown, where: string): WorldNpc[] {
  const errs: string[] = [];
  if (!Array.isArray(raw)) fail(where, 'npcs', ['npcs.json must be an array']);
  raw.forEach((n, i) => {
    const at = `npcs[${i}]${isRec(n) && isStr(n.id) ? ` ("${n.id}")` : ''}`;
    if (!isRec(n)) {
      errs.push(`${at} must be an object`);
      return;
    }
    checkKeys(n, NPC_KEYS, at, errs);
    if (!isStr(n.id)) errs.push(`${at}: id must be a non-empty string`);
    if (n.name !== undefined && !isStr(n.name)) errs.push(`${at}: name must be a non-empty string`);
    if (!NPC_CATEGORIES.includes(n.category as NpcCategory))
      errs.push(`${at}: category "${String(n.category)}" not one of ${NPC_CATEGORIES.join('/')}`);
    checkXY(n.position, `${at}: position`, errs);
    if (n.hotspot !== undefined) checkWH(n.hotspot, `${at}: hotspot`, errs);
    if (!Array.isArray(n.dialogueLines) || n.dialogueLines.length === 0) {
      errs.push(`${at}: dialogueLines must be a non-empty array`);
    } else {
      n.dialogueLines.forEach((l, j) => {
        if (!isRec(l) || !isStr(l.hi) || !isStr(l.en))
          errs.push(`${at}: dialogueLines[${j}] must be { hi: string, en: string }`);
        else checkKeys(l, new Set(['hi', 'en']), `${at}: dialogueLines[${j}]`, errs);
      });
    }
    if (n.linkedBuildingId !== undefined && !isStr(n.linkedBuildingId))
      errs.push(`${at}: linkedBuildingId must be a non-empty string`);
    if (n.spriteId !== undefined && !isStr(n.spriteId))
      errs.push(`${at}: spriteId must be a non-empty string`);
    if (n.waypoints !== undefined) {
      if (!Array.isArray(n.waypoints)) errs.push(`${at}: waypoints must be an array`);
      else n.waypoints.forEach((w, j) => checkRowCol(w, `${at}: waypoints[${j}]`, errs));
    }
    if (n.pauseDurationMs !== undefined && (!isNum(n.pauseDurationMs) || n.pauseDurationMs < 0))
      errs.push(`${at}: pauseDurationMs must be a number >= 0`);
  });
  if (errs.length > 0) fail(where, 'npcs', errs);
  return raw as WorldNpc[];
}

const COLLISION_KEYS = new Set(['cols', 'rows', 'tileSize', 'blocked']);

/**
 * Narrow a region's village-collision.json (the mask-editor's canonical
 * output that walk.ts expands into a WorldWalkConfig). Throws listing every
 * problem — unknown keys, bad dimensions, out-of-grid blocked pairs.
 */
export function parseWorldCollisionGrid(raw: unknown, where: string): WorldCollisionGrid {
  const errs: string[] = [];
  if (!isRec(raw)) fail(where, 'collision-grid', ['collision json must be an object']);
  checkKeys(raw, COLLISION_KEYS, 'grid', errs);
  const posInt = (v: unknown): v is number => isInt(v) && v > 0;
  if (!posInt(raw.cols)) errs.push('grid: cols must be an int > 0');
  if (!posInt(raw.rows)) errs.push('grid: rows must be an int > 0');
  if (!posInt(raw.tileSize)) errs.push('grid: tileSize must be an int > 0');
  if (!Array.isArray(raw.blocked)) {
    errs.push('grid: blocked must be an array of [row, col] pairs');
  } else {
    const rows = posInt(raw.rows) ? raw.rows : Infinity;
    const cols = posInt(raw.cols) ? raw.cols : Infinity;
    raw.blocked.forEach((p, i) => {
      if (!Array.isArray(p) || p.length !== 2 || !isInt(p[0]) || !isInt(p[1]) || p[0] < 0 || p[1] < 0)
        errs.push(`grid: blocked[${i}] must be [row>=0, col>=0] ints`);
      else if (p[0] >= rows || p[1] >= cols)
        errs.push(`grid: blocked[${i}] (${p[0]},${p[1]}) is outside the ${rows}×${cols} grid`);
    });
  }
  if (errs.length > 0) fail(where, 'collision-grid', errs);
  return raw as unknown as WorldCollisionGrid;
}

// ---------------------------------------------------------------------------
// Semantic layer (the former dev-only defineWorld guard, now shared with CI)
// ---------------------------------------------------------------------------

/**
 * Cross-reference one world's typed data. Returns ALL problems (empty =
 * valid). Callers decide how to fail: defineWorld throws in DEV, the CI
 * script prints per region and exits non-zero.
 */
export function validateWorldData(entry: WorldData): string[] {
  const { config } = entry;
  const problems: string[] = [];

  if (config.imageSize.w !== STAGE_W)
    problems.push(`imageSize.w must be ${STAGE_W} (1:1 with stage px), got ${config.imageSize.w}`);
  if (config.imageSize.h < STAGE_H)
    problems.push(`imageSize.h ${config.imageSize.h} is shorter than the ${STAGE_H}px stage`);
  if (!config.lines.welcome || !config.lines.locked)
    problems.push('lines.welcome and lines.locked must be non-empty');

  const maskRows = entry.walk ? entry.walk.mask.length : 0;
  const maskCols = entry.walk ? (entry.walk.mask[0]?.length ?? 0) : 0;

  const buildingIds = new Set<string>();
  for (const b of config.buildings) {
    if (buildingIds.has(b.id)) problems.push(`duplicate building id "${b.id}"`);
    buildingIds.add(b.id);
    if (!/^(explore|minigame|builder|climax|recap):/.test(b.routeTarget))
      problems.push(`building "${b.id}" routeTarget "${b.routeTarget}" has an unknown namespace`);
    // A registered 2D game must declare THIS building as its completion
    // target — otherwise winning would mark the wrong building complete.
    const gameId = gameIdFromRouteTarget(b.routeTarget);
    if (gameId && GAME_BUILDINGS[gameId] !== b.id)
      problems.push(
        `building "${b.id}" routeTarget "${b.routeTarget}" launches game "${gameId}", but that game declares buildingId "${GAME_BUILDINGS[gameId]}" — they must match`
      );
    // explore:/recap: targets must open REAL story content — a typo'd or
    // not-yet-written id would ship as a building whose popup is empty, the
    // exact dead-content class this validator exists to catch. Content still
    // being authored must be declared in PENDING_CONTENT_TARGETS
    // (content/links.ts), an explicit per-entry-documented debt list — never
    // a silent skip.
    const content = contentPartsFromRouteTarget(b.routeTarget);
    if (
      content &&
      !isShippedContent(content.ns, content.id) &&
      !(b.routeTarget in PENDING_CONTENT_TARGETS)
    )
      problems.push(
        `building "${b.id}" routeTarget "${b.routeTarget}" names ${content.ns} content that doesn't exist — ship it (content/links.ts ${
          content.ns === 'explore' ? 'EXPLORE_CONTENT_IDS' : 'RECAP_CONTENT_IDS'
        }) or, if the content is scheduled work, allowlist it in PENDING_CONTENT_TARGETS with an owner note`
      );
    if (!Number.isFinite(b.position.x) || !Number.isFinite(b.position.y))
      problems.push(`building "${b.id}" position must be finite numbers`);
    else if (b.position.x < 0 || b.position.x > STAGE_W || b.position.y < 0 || b.position.y > config.imageSize.h)
      problems.push(`building "${b.id}" position is outside the painting`);
    if (b.anchorTile) {
      if (!entry.walk) {
        problems.push(`building "${b.id}" has anchorTile but the world has no walk config`);
      } else if (
        b.anchorTile.row < 0 || b.anchorTile.row >= maskRows ||
        b.anchorTile.col < 0 || b.anchorTile.col >= maskCols
      ) {
        problems.push(`building "${b.id}" anchorTile (${b.anchorTile.row},${b.anchorTile.col}) is outside the ${maskRows}×${maskCols} walk grid`);
      } else if (!makeIsWalkable(entry.walk)(b.anchorTile.col, b.anchorTile.row)) {
        problems.push(`building "${b.id}" anchorTile (${b.anchorTile.row},${b.anchorTile.col}) is a blocked tile — its E-prompt could never fire`);
      }
    }
  }
  for (const b of config.buildings) {
    for (const dep of b.unlocksAfter) {
      if (!buildingIds.has(dep))
        problems.push(`building "${b.id}" unlocksAfter unknown id "${dep}"`);
    }
  }
  const climaxCount = config.buildings.filter(b => b.type === 'climax').length;
  if (climaxCount !== 1)
    problems.push(`exactly one climax building required (it fires the hub region-restore), got ${climaxCount}`);

  const npcIds = new Set<string>();
  for (const n of config.npcs) {
    if (npcIds.has(n.id)) problems.push(`duplicate npc id "${n.id}"`);
    npcIds.add(n.id);
    if (n.dialogueLines.length === 0) problems.push(`npc "${n.id}" has no dialogue lines`);
    if (n.linkedBuildingId && !buildingIds.has(n.linkedBuildingId))
      problems.push(`npc "${n.id}" links unknown building "${n.linkedBuildingId}"`);
    if (!Number.isFinite(n.position.x) || !Number.isFinite(n.position.y))
      problems.push(`npc "${n.id}" position must be finite numbers`);
    else if (n.position.x < 0 || n.position.x > STAGE_W || n.position.y < 0 || n.position.y > config.imageSize.h)
      problems.push(`npc "${n.id}" position is outside the painting`);
    if (n.waypoints && n.waypoints.length > 0) {
      if (!entry.walk) {
        problems.push(`npc "${n.id}" has waypoints but the world has no walk config`);
      } else {
        for (const w of n.waypoints) {
          if (w.row < 0 || w.row >= maskRows || w.col < 0 || w.col >= maskCols)
            problems.push(`npc "${n.id}" waypoint (${w.row},${w.col}) is outside the ${maskRows}×${maskCols} walk grid`);
          else if (!makeIsWalkable(entry.walk)(w.col, w.row))
            problems.push(`npc "${n.id}" waypoint (${w.row},${w.col}) is a blocked tile`);
        }
      }
    }
  }

  if (entry.walk) {
    const { mask, spawn, voiceExceptions } = entry.walk;
    const wantRows = config.imageSize.h / WALK_TILE;
    const wantCols = config.imageSize.w / WALK_TILE;
    if (mask.length !== wantRows)
      problems.push(`walk.mask has ${mask.length} rows, painting needs ${wantRows}`);
    mask.forEach((row, i) => {
      if (row.length !== wantCols)
        problems.push(`walk.mask row ${i} has ${row.length} cols, painting needs ${wantCols}`);
      if (/[^#.]/.test(row)) problems.push(`walk.mask row ${i} has chars other than '#' and '.'`);
    });
    const walkable = makeIsWalkable(entry.walk);
    if (!walkable(Math.floor(spawn.x / WALK_TILE), Math.floor(spawn.y / WALK_TILE)))
      problems.push(`walk.spawn (${spawn.x},${spawn.y}) lands on a blocked tile`);
    for (const id of voiceExceptions ?? []) {
      if (!npcIds.has(id)) problems.push(`walk.voiceExceptions has unknown npc id "${id}"`);
    }
  }
  if (entry.walkRenderer && !entry.walk)
    problems.push(`walkRenderer "${entry.walkRenderer}" is set but the world has no walk config`);

  return problems;
}
