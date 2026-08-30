import { useEffect, useMemo } from 'react';
import type { Vec2 } from './types';

/**
 * Unified game input (Minigames Phase Task 0): keyboard (WASD / arrows) and
 * the virtual touch joystick feed one direction vector; E / Space / Enter and
 * the on-screen action button feed one edge-triggered "action" press.
 *
 * Scenes read input inside the fixed-step update via `getDir()` and
 * `consumeAction()` — no React re-renders are involved.
 */
export interface GameInput {
  /** Current movement direction, normalized to length <= 1. */
  getDir(): Vec2;
  /** True exactly once per action press (edge-triggered). */
  consumeAction(): boolean;
}

export interface GameInputControls {
  input: GameInput;
  /** Virtual joystick writes its vector here (null = released). */
  setJoystick(v: Vec2 | null): void;
  /** On-screen action button. */
  queueAction(): void;
}

const KEY_DIRS: Record<string, Vec2> = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

const ACTION_CODES = new Set(['KeyE', 'Space', 'Enter']);

function isFormTarget(t: EventTarget | null): boolean {
  return (
    t instanceof HTMLElement &&
    ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(t.tagName)
  );
}

export function useGameInput(enabled: boolean): GameInputControls {
  const controls = useMemo<GameInputControls & { _state: InputState }>(() => {
    const state: InputState = { keys: new Set(), joy: null, action: false };
    return {
      _state: state,
      input: {
        getDir() {
          if (state.joy) return state.joy;
          let x = 0;
          let y = 0;
          for (const code of state.keys) {
            const d = KEY_DIRS[code];
            if (d) {
              x += d.x;
              y += d.y;
            }
          }
          const len = Math.hypot(x, y);
          if (len > 1) {
            x /= len;
            y /= len;
          }
          return { x, y };
        },
        consumeAction() {
          const a = state.action;
          state.action = false;
          return a;
        },
      },
      setJoystick(v) {
        state.joy = v;
      },
      queueAction() {
        state.action = true;
      },
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      controls._state.keys.clear();
      controls._state.joy = null;
      controls._state.action = false;
      return;
    }
    const s = controls._state;

    function onKeyDown(e: KeyboardEvent) {
      // Let buttons/links keep their native Space/Enter behavior.
      if (isFormTarget(e.target)) return;
      if (KEY_DIRS[e.code]) {
        e.preventDefault();
        s.keys.add(e.code);
      } else if (ACTION_CODES.has(e.code)) {
        e.preventDefault();
        if (!e.repeat) s.action = true;
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      s.keys.delete(e.code);
    }
    function onBlur() {
      s.keys.clear();
      s.joy = null;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [enabled, controls]);

  return controls;
}

interface InputState {
  keys: Set<string>;
  joy: Vec2 | null;
  action: boolean;
}
