/**
 * Pure story-content linkage — the ONLY shared source of truth for which
 * explore:/recap: routeTargets open REAL written content (fact cards and
 * story recaps), and which are declared, documented content debt.
 *
 * Why this file exists (same pattern as games/links.ts): the component that
 * will render fact cards / recaps may import app-only modules (vite assets,
 * `@/` aliases), which the headless CI validator (scripts/
 * verify-world-data.ts, run under tsx) cannot load. This module carries the
 * pure id sets both sides need:
 *  - world-validate.ts fails any building whose explore:/recap: routeTarget
 *    names content that is neither shipped nor allowlisted below — a typo'd
 *    or unwritten id would otherwise ship as a building that opens an empty
 *    "coming soon" popup, and
 *  - the content module (index.ts beside this file) derives its keysets from
 *    these ids (`satisfies { [K in ExploreContentId]: FactCardDef & { id: K } }`
 *    — same lock as games/index.ts) so ids and content never drift.
 *
 * Shipping content for a pending building:
 *  1. move its id from PENDING_CONTENT_TARGETS into EXPLORE_CONTENT_IDS /
 *     RECAP_CONTENT_IDS (leaving it in BOTH is a tsc error — the satisfies
 *     lock on PENDING_CONTENT_TARGETS forbids allowlisting shipped ids),
 *  2. key the content entry by that id in the content module.
 * verify:world-data fails on any dangling target, and on any PENDING entry
 * no building references — the debt list can only shrink, never rot.
 */

/** Fact-card content ids that are WRITTEN AND SHIPPED ("explore:<id>"). */
export const EXPLORE_CONTENT_IDS = [
  // Sindhu Ghati's four explore buildings — entries live in index.ts.
  'great-bath',
  'granary',
  'covered-drains',
  'bazaar',
] as const satisfies readonly string[];
export type ExploreContentId = (typeof EXPLORE_CONTENT_IDS)[number];

/** Recap / story-replay content ids that are WRITTEN AND SHIPPED ("recap:<id>"). */
export const RECAP_CONTENT_IDS = [
  // Sindhu Ghati's city-gate intro replay — entry lives in index.ts.
  'sindhu-intro',
] as const satisfies readonly string[];
export type RecapContentId = (typeof RECAP_CONTENT_IDS)[number];

/** A routeTarget whose content is shipped — allowlisting one below is a tsc error. */
type ShippedContentTarget =
  | `explore:${ExploreContentId}`
  | `recap:${RecapContentId}`;

/**
 * Grandfathered content debt — explore:/recap: targets authored in
 * buildings.json whose content is NOT written yet. This list is the explicit,
 * documented exception (never a silent skip): every entry names the building
 * and the work that owes it, validateWorldData only accepts targets that are
 * shipped OR listed here, and scripts/verify-world-data.ts fails any entry no
 * building references (stale debt after a rename/removal or after shipping).
 */
export const PENDING_CONTENT_TARGETS = {
  // — Four new regions: owned by the scheduled task "Turn the 'coming soon'
  //   buildings in new regions into real discoveries".
  'explore:festival-bell': 'apni-parampara — festival bell fact card',
  'explore:weaver-loom': 'kala-bhoomi — weaver loom fact card',
  'explore:wrestling-pit': 'khel-maidan — wrestling pit fact card',
  'explore:nalanda-library': 'magadha-kaal — Nalanda library fact card',
} as const satisfies Record<string, string> & { [K in ShippedContentTarget]?: never };

/**
 * "explore:great-bath" → { ns: 'explore', id: 'great-bath' } when the
 * routeTarget is a content namespace, else null (minigame:/builder:/climax:
 * targets are the games/links.ts completion-target check's job).
 */
export function contentPartsFromRouteTarget(
  routeTarget: string
): { ns: 'explore' | 'recap'; id: string } | null {
  const sep = routeTarget.indexOf(':');
  if (sep < 0) return null;
  const ns = routeTarget.slice(0, sep);
  if (ns !== 'explore' && ns !== 'recap') return null;
  return { ns, id: routeTarget.slice(sep + 1) };
}

/** Is this content id written and shipped for its namespace? */
export function isShippedContent(ns: 'explore' | 'recap', id: string): boolean {
  // Widen the const tuples once, here: `readonly []`.includes(string) is a
  // type error, and every caller would otherwise need this cast.
  const shipped: readonly string[] = ns === 'explore' ? EXPLORE_CONTENT_IDS : RECAP_CONTENT_IDS;
  return shipped.includes(id);
}
