const SERIF = "Georgia, 'Times New Roman', serif";

/**
 * Speech bubble matching the reference art's baked bubbles: dark rounded
 * card, thin warm border, short serif line, small pointer tail.
 * `pointerOffsetX` shifts the tail horizontally (world px) so it can keep
 * aiming at the speaker when the card itself is edge-clamped.
 * `tail` — 'bottom' (default) for a bubble above the speaker's head,
 * 'top' when the bubble is flipped below the speaker (e.g. near the
 * viewport top where the nav bar would cover it).
 */
export function DialogueBubble({
  text,
  pointerOffsetX = 0,
  tail = 'bottom',
}: {
  text: string;
  pointerOffsetX?: number;
  tail?: 'bottom' | 'top';
}) {
  return (
    <div className="relative max-w-[176px] rounded-[7px] border border-primary/25 bg-[#171109]/95 px-[10px] py-[6px] shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
      <p
        className="text-[9px] leading-[1.45] text-[#EAE0CC] text-center"
        style={{ fontFamily: SERIF }}
      >
        {text}
      </p>
      {tail === 'bottom' ? (
        <span
          aria-hidden
          className="absolute top-full h-0 w-0 border-x-[6px] border-t-[7px] border-x-transparent border-t-[#171109]/95"
          style={{ left: `calc(50% + ${pointerOffsetX}px)`, transform: 'translateX(-50%)' }}
        />
      ) : (
        <span
          aria-hidden
          className="absolute bottom-full h-0 w-0 border-x-[6px] border-b-[7px] border-x-transparent border-b-[#171109]/95"
          style={{ left: `calc(50% + ${pointerOffsetX}px)`, transform: 'translateX(-50%)' }}
        />
      )}
    </div>
  );
}
