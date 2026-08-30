import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { STAGE_W, STAGE_H } from '@/lib/stage';
import { useReducedMotion } from '@/lib/use-reduced-motion';

/**
 * Hub ↔ Village World screen transitions (PRD Task 6): a brief "rift opening"
 * veil in the Time Rift's purple visual language, radiating from the thing
 * the player clicked (a gate on the map, the back button in a world) instead
 * of a jarring route cut. Generic — any screen pair can use it (Task 8).
 */
export const RIFT_OUT_MS = 420;
export const RIFT_IN_MS = 520;

/** sessionStorage handshake: the screen we navigate TO opens with a reveal. */
const FLAG = 'bv-rift-veil';

/**
 * Read-and-clear the reveal flag (call once on the destination's mount).
 * Only answers true when the flag was written for THIS destination and is
 * fresh — a flag some other navigation left behind can't trigger a reveal.
 */
export function consumeRiftFlag(expectedPath: string): boolean {
  try {
    const raw = sessionStorage.getItem(FLAG);
    if (!raw) return false;
    sessionStorage.removeItem(FLAG);
    const parsed = JSON.parse(raw) as { to?: unknown; exp?: unknown };
    return parsed.to === expectedPath && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * Rift-flavored navigation: darkens the current screen from `origin`
 * (stage px), then navigates. Under prefers-reduced-motion it navigates
 * immediately with no veil on either side.
 */
export function useRiftNavigate() {
  const [, navigate] = useLocation();
  const reduced = useReducedMotion();
  const [leavingFrom, setLeavingFrom] = useState<{ x: number; y: number } | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    []
  );

  const go = (to: string, origin?: { x: number; y: number }) => {
    if (timerRef.current !== null) return; // a transition is already underway
    if (reduced) {
      navigate(to);
      return;
    }
    setLeavingFrom(origin ?? { x: STAGE_W / 2, y: STAGE_H / 2 });
    timerRef.current = window.setTimeout(() => {
      // Free the guard so a future same-screen transition can run, and set
      // the handshake only when the navigation actually happens — scoped to
      // the destination with a short expiry, so a cancelled transition
      // (unmount, Back/Forward, nav click) can never leak a false reveal.
      timerRef.current = null;
      try {
        sessionStorage.setItem(FLAG, JSON.stringify({ to, exp: Date.now() + 3000 }));
      } catch {
        /* private mode etc. — destination just skips its reveal */
      }
      navigate(to);
    }, RIFT_OUT_MS);
  };

  return { leavingFrom, go };
}

/**
 * The veil itself. `out` fades the screen INTO the rift (and blocks clicks
 * while leaving); `in` reveals the new screen and removes itself when done.
 */
export function RiftVeil({
  mode,
  origin,
}: {
  mode: 'in' | 'out';
  origin?: { x: number; y: number };
}) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (mode !== 'in') return;
    const t = window.setTimeout(() => setGone(true), RIFT_IN_MS + 60);
    return () => window.clearTimeout(t);
  }, [mode]);
  if (gone) return null;
  const o = origin ?? { x: STAGE_W / 2, y: STAGE_H / 2 };
  // Portal into <body>: escapes every in-app stacking context (the scaled
  // stage wrapper, TopNav, panels), so `out` reliably covers and
  // click-blocks the ENTIRE screen during the outgoing window. The origin
  // converts from stage-logical px to viewport % (the stage fills the
  // viewport), so the radial still blooms from the thing the player clicked.
  return createPortal(
    <div
      aria-hidden
      className={cn(
        'fixed inset-0 z-[100]',
        mode === 'out' ? 'animate-rift-out pointer-events-auto' : 'animate-rift-in pointer-events-none'
      )}
      style={{
        background: `radial-gradient(circle at ${(o.x / STAGE_W) * 100}% ${(o.y / STAGE_H) * 100}%, rgba(124,77,214,0.55) 0%, rgba(24,12,40,0.94) 46%, rgba(5,3,10,0.985) 100%)`,
      }}
    />,
    document.body
  );
}
