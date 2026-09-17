/**
 * Pure game↔building linkage — the ONLY shared source of truth for which
 * village building each registered 2D game completes.
 *
 * Why this file exists (world-data validation task): games/index.ts imports
 * a vite image asset, so the headless CI validator (scripts/
 * verify-world-data.ts, run under tsx) cannot import the GAMES registry.
 * This module carries the pure metadata both sides need:
 *  - games/index.ts derives every GameDef.buildingId from GAME_BUILDINGS
 *    (a typo'd key is a compile error, so the two can never drift), and
 *  - world-validate.ts checks building routeTargets against it in CI.
 *
 * Adding a game: add its id → buildingId pair here FIRST, then the GAMES
 * entry (games/index.ts guards both keysets at module load).
 */
export const GAME_BUILDINGS = {
  'drain-puzzle': 'naali-paheli',
  'city-builder': 'sheher-banao',
  'pothi-khoj': 'pothi-khoj',
  'rangoli-rang': 'rangoli-rang',
  'diye-jalao': 'diye-jalao',
  'kho-kho-daud': 'kho-kho-daud',
} as const satisfies Record<string, string>;

export type GameId = keyof typeof GAME_BUILDINGS;

/**
 * "minigame:drain-puzzle" → 'drain-puzzle' when that game is registered,
 * else null. The `builder:` and `climax:` namespaces may also carry a game
 * (in the four single-game worlds the playable finale IS the climax
 * building). Unregistered ids return null on purpose — "coming soon"
 * buildings may point at future games.
 */
export function gameIdFromRouteTarget(routeTarget: string): GameId | null {
  const sep = routeTarget.indexOf(':');
  if (sep < 0) return null;
  const ns = routeTarget.slice(0, sep);
  if (ns !== 'minigame' && ns !== 'builder' && ns !== 'climax') return null;
  const id = routeTarget.slice(sep + 1);
  return id in GAME_BUILDINGS ? (id as GameId) : null;
}
