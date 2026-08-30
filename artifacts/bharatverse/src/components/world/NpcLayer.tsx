import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { cn } from '@/lib/utils';
import type { WorldNpc } from '@/game/world-types';
import { DialogueBubble } from './DialogueBubble';

/** Person-scale default hover zone (world px) when an NPC omits `hotspot`. */
const DEFAULT_HOTSPOT = { w: 70, h: 110 };
/** Bubble half-width + margin used to keep bubbles inside the 1024px canvas. */
const BUBBLE_CLAMP = 96;
const CANVAS_W = 1024;
/**
 * If the speaker's head is closer than this to the top of the current view,
 * an above-head bubble would sit under the pinned TopNav (stage rows 0–72) —
 * flip it below the speaker instead. ≈ nav 76 + bubble card ~60.
 */
const FLIP_THRESHOLD = 136;
/** How long a tapped/clicked bubble stays pinned open. */
const PIN_MS = 4500;
/** How long an ambient NPC's self-spoken bubble stays up. */
const AMBIENT_OPEN_MS = 3800;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/**
 * Generic NPC hotspot (PRD §A.4.4 static fallback, locked in Task 0):
 * NPCs are baked into the painting; this adds the "listen" interaction —
 * a reference-style dialogue bubble on hover/focus, or pinned open for a
 * few seconds on click/tap. Ambient NPCs also auto-speak on a staggered
 * timed cycle (PRD §A.4.2a) unless the player prefers reduced motion.
 *
 * Visibility is source-aware: hover, focus, pin, and the ambient cycle
 * each own their flag, and the bubble shows while ANY is active. A source
 * ending only removes itself — the ambient timer can never dismiss a
 * user-pinned or hovered bubble, and a pin expiring under a still-hovering
 * cursor hands the bubble back to hover instead of closing it.
 * The line rotates exactly once per full open→close cycle.
 */
function NpcHotspot({
  npc,
  index,
  debug,
  suppressRef,
  reducedMotion,
  scrollY,
}: {
  npc: WorldNpc;
  index: number;
  debug?: boolean;
  suppressRef: MutableRefObject<{ moved: boolean }>;
  reducedMotion: boolean;
  scrollY: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [ambientOpen, setAmbientOpen] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const pinTimer = useRef<number | null>(null);

  const open = hovered || focused || pinnedOpen || ambientOpen;

  // Advance to the next authored line exactly once per open→close cycle,
  // regardless of which sources opened/closed the bubble.
  const prevOpen = useRef(false);
  useEffect(() => {
    if (prevOpen.current && !open) setLineIdx(i => i + 1);
    prevOpen.current = open;
  }, [open]);

  // Ambient NPCs speak on their own, staggered so the village murmurs
  // instead of shouting in unison. The cycle only toggles its own source.
  useEffect(() => {
    if (npc.category !== 'ambient' || reducedMotion) return;
    const periodMs = 12000 + (index % 5) * 2300;
    let intervalId: number | undefined;
    let closeId: number | undefined;
    const speak = () => {
      setAmbientOpen(true);
      closeId = window.setTimeout(() => setAmbientOpen(false), AMBIENT_OPEN_MS);
    };
    const firstId = window.setTimeout(() => {
      speak();
      intervalId = window.setInterval(speak, periodMs);
    }, 1500 + index * 1700);
    return () => {
      window.clearTimeout(firstId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
      if (closeId !== undefined) window.clearTimeout(closeId);
      setAmbientOpen(false);
    };
  }, [npc.category, reducedMotion, index]);

  useEffect(() => () => {
    if (pinTimer.current !== null) window.clearTimeout(pinTimer.current);
  }, []);

  const hs = npc.hotspot ?? DEFAULT_HOTSPOT;
  const line = npc.dialogueLines[lineIdx % npc.dialogueLines.length]?.hi ?? '';

  // Keep the bubble on-canvas near the edges; the tail keeps aiming at the NPC.
  const clampedX = Math.min(Math.max(npc.position.x, BUBBLE_CLAMP), CANVAS_W - BUBBLE_CLAMP);
  const bubbleShift = clampedX - npc.position.x;
  // Near the top of the current view the TopNav would cover an above-head
  // bubble — flip it below the speaker's feet instead.
  const flip = npc.position.y - hs.h - scrollY < FLIP_THRESHOLD;

  return (
    <div
      className="absolute"
      style={{ left: npc.position.x, top: npc.position.y }}
      data-npc-id={npc.id}
    >
      <button
        data-npc-id={npc.id}
        aria-label={npc.name ? `${npc.name} ki baat suno` : `Baat suno — ${npc.id}`}
        onClick={() => {
          if (suppressRef.current.moved) return;
          // Click/tap "listens": pin the bubble open briefly, then release.
          // If the cursor is still hovering when the pin expires, the hover
          // source keeps the bubble up.
          setPinnedOpen(true);
          if (pinTimer.current !== null) window.clearTimeout(pinTimer.current);
          pinTimer.current = window.setTimeout(() => setPinnedOpen(false), PIN_MS);
        }}
        onPointerEnter={e => {
          if (e.pointerType === 'mouse') setHovered(true);
        }}
        onPointerLeave={e => {
          if (e.pointerType === 'mouse') setHovered(false);
        }}
        onFocus={e => {
          // Only keyboard-visible focus holds the bubble open — a mouse/touch
          // click also focuses the button, and that focus lingers after the
          // pointer leaves, which would keep the bubble stuck open.
          setFocused(e.currentTarget.matches(':focus-visible'));
        }}
        onBlur={() => setFocused(false)}
        className={cn(
          'absolute -translate-x-1/2 -translate-y-full cursor-pointer rounded-[45%]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
          debug && 'outline outline-1 outline-sky-400/80'
        )}
        style={{ width: hs.w, height: hs.h, left: 0, top: 0 }}
      >
        {debug && (
          <span className="absolute left-1/2 top-full -translate-x-1/2 text-[8px] text-sky-300 bg-black/70 px-1 rounded pointer-events-none whitespace-nowrap">
            {npc.id}
          </span>
        )}
      </button>
      {open && line && (
        <div
          data-testid={`npc-bubble-${npc.id}`}
          role="status"
          className="absolute z-30 pointer-events-none -translate-x-1/2"
          style={
            flip
              ? { left: bubbleShift, top: 10 }
              : { left: bubbleShift, bottom: hs.h + 8 }
          }
        >
          <DialogueBubble
            text={line}
            pointerOffsetX={-bubbleShift}
            tail={flip ? 'top' : 'bottom'}
          />
        </div>
      )}
    </div>
  );
}

/** Renders every NPC of a world's npcs.json — no per-node logic (PRD 4.2). */
export function NpcLayer({
  npcs,
  debug,
  suppressRef,
  scrollY,
}: {
  npcs: WorldNpc[];
  debug?: boolean;
  suppressRef: MutableRefObject<{ moved: boolean }>;
  scrollY: number;
}) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <>
      {npcs.map((npc, i) => (
        <NpcHotspot
          key={npc.id}
          npc={npc}
          index={i}
          debug={debug}
          suppressRef={suppressRef}
          reducedMotion={reducedMotion}
          scrollY={scrollY}
        />
      ))}
    </>
  );
}
