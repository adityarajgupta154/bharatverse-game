import { useRef, useState } from 'react';
import type { Vec2 } from '@/game/engine/types';

const THUMB_TRAVEL = 26;

/**
 * Touch joystick (Minigames Phase Task 0). Rendered only on coarse-pointer
 * devices. Reports a normalized vector (length <= 1) to the game input; the
 * math uses the element's on-screen rect, so the scaled stage needs no
 * special handling.
 */
export function VirtualJoystick({ onChange }: { onChange: (v: Vec2 | null) => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<Vec2>({ x: 0, y: 0 });
  const activeId = useRef<number | null>(null);

  function vectorFor(e: React.PointerEvent): Vec2 {
    const rect = baseRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let x = (e.clientX - cx) / (rect.width / 2);
    let y = (e.clientY - cy) / (rect.height / 2);
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  function release() {
    activeId.current = null;
    setThumb({ x: 0, y: 0 });
    onChange(null);
  }

  return (
    <div
      ref={baseRef}
      aria-hidden
      className="absolute left-[26px] bottom-[26px] w-[92px] h-[92px] rounded-full border border-primary/40 bg-black/45 touch-none select-none"
      onPointerDown={e => {
        activeId.current = e.pointerId;
        baseRef.current?.setPointerCapture(e.pointerId);
        const v = vectorFor(e);
        setThumb(v);
        onChange(v);
      }}
      onPointerMove={e => {
        if (activeId.current !== e.pointerId) return;
        const v = vectorFor(e);
        setThumb(v);
        onChange(v);
      }}
      onPointerUp={e => {
        if (activeId.current === e.pointerId) release();
      }}
      onPointerCancel={e => {
        if (activeId.current === e.pointerId) release();
      }}
    >
      <div
        className="absolute w-[38px] h-[38px] rounded-full bg-primary/60 border border-primary"
        style={{
          left: 27 + thumb.x * THUMB_TRAVEL,
          top: 27 + thumb.y * THUMB_TRAVEL,
        }}
      />
    </div>
  );
}
