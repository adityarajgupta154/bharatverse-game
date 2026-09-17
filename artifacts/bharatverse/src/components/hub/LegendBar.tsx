import { cn } from '@/lib/utils';
import { useGame } from '@/game/store';
import { FILTER_DEFS } from './filter-defs';
import legendCut from '@/assets/images/ui/legend-cut.png';

/**
 * Chip hit-zones over the baked legend art, in display px of the 364×40 bar.
 * Spans measured from the 586px-wide source art's column-brightness profile
 * (icon start → text end, plus a little padding), scaled by 364/586.
 */
const CHIP_RECTS: Record<string, { left: number; width: number }> = {
  explored: { left: 8, width: 62 },
  in_progress: { left: 93, width: 70 },
  locked: { left: 188, width: 55 },
  story_mission: { left: 269, width: 80 },
};

/**
 * The baked legend art IS the bar — each chip gets a transparent toggle
 * button over its painted icon+label (same pattern as the painted-glyph
 * buttons elsewhere).
 *
 * Off-state: a warm-grey layer in `mix-blend-mode: darken` fades in over the
 * chip. Darken = per-channel min, so the bright painted glyphs clamp down to
 * the grey ("faded ink") while the already-darker bar pixels are unchanged —
 * mathematically no visible patch/box, unlike a flat veil. The feathered
 * mask windows it to one chip; `isolate` on the wrapper keeps the blend from
 * reaching the map painting below the bar.
 */
export function LegendBar() {
  const { state, toggleFilter } = useGame();
  return (
    <div className="absolute left-[326px] top-[531px] w-[364px] h-[40px] z-40 pointer-events-auto isolate">
      <img
        src={legendCut}
        alt=""
        className="absolute inset-0 w-full h-full select-none pointer-events-none"
        draggable={false}
      />
      {FILTER_DEFS.map(f => {
        const rect = CHIP_RECTS[f.id];
        const isActive = state.activeFilters.includes(f.id);
        const featherMask = `linear-gradient(to right, transparent ${rect.left - 5}px, black ${rect.left + 3}px, black ${rect.left + rect.width - 3}px, transparent ${rect.left + rect.width + 5}px)`;
        return (
          <span
            key={`dim-${f.id}`}
            aria-hidden
            className={cn(
              'absolute inset-0 pointer-events-none transition-opacity duration-300',
              isActive ? 'opacity-0' : 'opacity-100'
            )}
            style={{
              background: 'rgb(92, 80, 66)',
              mixBlendMode: 'darken',
              maskImage: featherMask,
              WebkitMaskImage: featherMask,
            }}
          />
        );
      })}
      {FILTER_DEFS.map(f => {
        const rect = CHIP_RECTS[f.id];
        const isActive = state.activeFilters.includes(f.id);
        return (
          <button
            key={f.id}
            aria-pressed={isActive}
            aria-label={`${f.label} — map par ${isActive ? 'dikh raha hai' : 'chhupa hai'}`}
            onClick={() => toggleFilter(f.id)}
            // No hover overlay by request — the baked art stays pristine;
            // click feedback is the chip's own fade. Keyboard users still
            // get the focus-visible ring.
            className="absolute top-[3px] h-[34px] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            style={{ left: rect.left, width: rect.width }}
          />
        );
      })}
    </div>
  );
}
