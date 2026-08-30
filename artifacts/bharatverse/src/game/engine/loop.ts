import { useEffect, useRef } from 'react';

/**
 * Fixed-timestep game loop (Minigames Phase Task 0).
 *
 * - Updates run at a fixed 60Hz step regardless of display refresh, so game
 *   speed is identical on 60/120/144Hz screens.
 * - Frame gaps are clamped (tab switch, long GC) so a hiccup costs at most a
 *   handful of catch-up steps, never a long burst.
 * - `running=false` skips updates but keeps rendering — overlays (intro,
 *   pause, win) sit over a live-looking, frozen world.
 */
const STEP = 1 / 60;
const MAX_FRAME = 0.1;

export function useGameLoop(
  running: boolean,
  update: (dt: number) => void,
  render: () => void
) {
  const updateRef = useRef(update);
  const renderRef = useRef(render);
  const runningRef = useRef(running);
  updateRef.current = update;
  renderRef.current = render;
  runningRef.current = running;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let alive = true;

    function frame(now: number) {
      if (!alive) return;
      acc += Math.min((now - last) / 1000, MAX_FRAME);
      last = now;
      if (runningRef.current) {
        while (acc >= STEP) {
          updateRef.current(STEP);
          acc -= STEP;
        }
      } else {
        acc = 0;
      }
      renderRef.current();
      raf = requestAnimationFrame(frame);
    }

    // After the tab was hidden, restart timing so the first visible frame
    // doesn't see a giant gap.
    function onVisible() {
      last = performance.now();
      acc = 0;
    }

    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}
