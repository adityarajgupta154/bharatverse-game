import { useRef, useState } from 'react';
import { applyJoystickRun, type Vec2 } from '@/game/engine/types';

const THUMB_TRAVEL = 26;

/**
 * Touch joystick (Minigames Phase Task 0). Rendered only on coarse-pointer
 * devices. Reports a normalized vector (length <= 1) to the game input; the
 * math uses the element's on-screen rect, so the scaled stage needs no
 * special handling.
 *
 * Sprint (Task 8.3): pushing the thumb to the rim runs. The glow/label here
 * mirrors the ENGINE's exact hysteresis (same applyJoystickRun), so what the
 * kid sees always matches the speed Aru actually gets.
 */
export function VirtualJoystick({ onChange }: { onChange: (v: Vec2 | null) => void }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<Vec2>({ x: 0, y: 0 });
  const [running, setRunning] = useState(false);
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
    setRunning(false);
    onChange(null);
  }

  return (
    <div
      ref={baseRef}
      aria-hidden
      className={`absolute left-[26px] bottom-[26px] w-[92px] h-[92px] rounded-full border touch-none select-none transition-shadow ${
        running
          ? 'border-primary bg-black/55 shadow-[0_0_16px_2px] shadow-primary/50'
          : 'border-primary/40 bg-black/45'
      }`}
      onPointerDown={e => {
        activeId.current = e.pointerId;
        baseRef.current?.setPointerCapture(e.pointerId);
        const v = vectorFor(e);
        setThumb(v);
        setRunning(r => applyJoystickRun(r, v));
        onChange(v);
      }}
      onPointerMove={e => {
        if (activeId.current !== e.pointerId) return;
        const v = vectorFor(e);
        setThumb(v);
        setRunning(r => applyJoystickRun(r, v));
        onChange(v);
      }}
      onPointerUp={e => {
        if (activeId.current === e.pointerId) release();
      }}
      onPointerCancel={e => {
        if (activeId.current === e.pointerId) release();
      }}
    >
      {running && (
        <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[7px] font-bold uppercase tracking-widest text-primary whitespace-nowrap">
          Daudo!
        </div>
      )}
      <div
        className={`absolute w-[38px] h-[38px] rounded-full border transition-colors ${
          running ? 'bg-primary border-white/80' : 'bg-primary/60 border-primary'
        }`}
        style={{
          left: 27 + thumb.x * THUMB_TRAVEL,
          top: 27 + thumb.y * THUMB_TRAVEL,
        }}
      />
    </div>
  );
}
