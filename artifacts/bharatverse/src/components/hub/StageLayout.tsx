import { useEffect, useState, ReactNode } from 'react';
import { STAGE_W, STAGE_H } from '@/lib/stage';
import { TopNav } from './TopNav';
import { ScreenFrame } from './ScreenFrame';

/**
 * Fit the 1024x592 logical stage to the viewport with NO visible distortion:
 * uniform scale, plus at most ~4% extra stretch on one axis (imperceptible on
 * painterly art) so common fullscreen ratios (16:9 etc.) fill edge-to-edge.
 * Any remaining gutter on extreme ratios is softened by a warm ambient halo
 * behind the painting instead of dead black bars.
 */
const STRETCH_CAP = 1.04;

function computeScale() {
  const rawX = window.innerWidth / STAGE_W;
  const rawY = window.innerHeight / STAGE_H;
  const s = Math.min(rawX, rawY);
  return {
    x: Math.min(rawX, s * STRETCH_CAP),
    y: Math.min(rawY, s * STRETCH_CAP),
  };
}

export function StageLayout({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(computeScale);

  useEffect(() => {
    function handleResize() {
      setScale(computeScale());
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050403] overflow-hidden flex items-center justify-center">
      <div
        className="relative bg-black"
        style={{
          width: `${STAGE_W}px`,
          height: `${STAGE_H}px`,
          transform: `scale(${scale.x}, ${scale.y})`,
          transformOrigin: 'center center'
        }}
      >
        {/* Ambient wall-glow behind the painting — fills letterbox gutters on extreme ratios */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            inset: '-160px',
            zIndex: -1,
            background:
              'radial-gradient(closest-side, rgba(148,104,52,0.26) 0%, rgba(84,58,28,0.13) 42%, rgba(24,17,10,0.05) 62%, rgba(5,4,3,0) 80%)',
          }}
        />
        {children}
        <TopNav />
        <ScreenFrame />
      </div>
    </div>
  );
}
