/**
 * The game's logical stage dimensions (design px). Every screen is authored
 * on this canvas and scaled to the viewport by StageLayout.
 *
 * Single source of truth — import these instead of hardcoding 1024/592.
 * (Tailwind literal classes like w-[1024px] can't consume JS constants;
 * those few remain inline by necessity.)
 */
export const STAGE_W = 1024;
export const STAGE_H = 592;
