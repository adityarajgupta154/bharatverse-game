import { type MutableRefObject } from 'react';
import { cn } from '@/lib/utils';
import type { WorldBuilding, BuildingState } from '@/game/world-types';

/** Hover glow tint per runtime state (legend colors). */
const GLOW: Record<BuildingState, string> = {
  explored: 'rgba(255,216,112,0.26)',
  in_progress: 'rgba(255,216,112,0.30)',
  story_mission: 'rgba(255,130,95,0.28)',
  locked: 'rgba(170,170,170,0.15)',
};

/**
 * Generic invisible hotspot over a building baked into the world painting —
 * same pattern as the Hub's gate hotspots. Positioned in world px inside the
 * pannable canvas, so it scrolls with the art.
 */
export function NodeBuilding({
  building,
  state,
  debug,
  suppressRef,
  onActivate,
}: {
  building: WorldBuilding;
  state: BuildingState;
  debug?: boolean;
  suppressRef: MutableRefObject<{ moved: boolean }>;
  onActivate: (b: WorldBuilding, state: BuildingState) => void;
}) {
  const b = building;
  return (
    <button
      aria-label={`${b.name} — ${b.subtitle}${state === 'locked' ? ' (bandh)' : ''}`}
      onClick={() => {
        if (!suppressRef.current.moved) onActivate(b, state);
      }}
      className={cn(
        'absolute -translate-x-1/2 -translate-y-1/2 rounded-[100%] group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
        debug && 'outline outline-1 outline-red-400/80'
      )}
      style={{
        left: b.position.x,
        top: b.position.y,
        width: b.hotspot.w,
        height: b.hotspot.h,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-[100%] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${GLOW[state]}, transparent 65%)`,
        }}
      />
      {debug && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] text-red-300 bg-black/70 px-1 rounded pointer-events-none whitespace-nowrap">
          {b.id}
        </span>
      )}
    </button>
  );
}
