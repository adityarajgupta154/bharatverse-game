import { useEffect, useMemo } from 'react';
import { applyJoystickRun, type Vec2 } from './types';

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
  /** True while Shift is held OR the joystick is pushed to its rim (Task
   *  8.3 hysteresis) — scenes multiply speed by RUN_MULTIPLIER. */
  isRunning(): boolean;
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

/** Targets where the user is typing text — suppress ALL game keys. */
function isTextEditingTarget(t: EventTarget | null): boolean {
  return (
    t instanceof HTMLElement &&
    (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable)
  );
}

/** Buttons/links keep native Space/Enter activation; everything else is ours. */
function isActivatableTarget(t: EventTarget | null): boolean {
  return t instanceof HTMLElement && (t.tagName === 'BUTTON' || t.tagName === 'A');
}

export function useGameInput(enabled: boolean): GameInputControls {
  const controls = useMemo<GameInputControls & { _state: InputState }>(() => {
    const state: InputState = { keys: new Set(), joy: null, action: false, run: false, joyRun: false };
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
        isRunning() {
          // Two independent sources (keyboard Shift, joystick rim) with their
          // own flags — releasing one never cancels the other's sprint.
          return state.run || state.joyRun;
        },
      },
      setJoystick(v) {
        state.joy = v;
        state.joyRun = applyJoystickRun(state.joyRun, v);
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
      controls._state.run = false;
      controls._state.joyRun = false;
      return;
    }
    const s = controls._state;

    function onKeyDown(e: KeyboardEvent) {
      // While typing in a field, no game keys at all.
      if (isTextEditingTarget(e.target)) return;
      if (KEY_DIRS[e.code]) {
        // Movement keys work even with a hotspot button focused (a11y:
        // tabbing onto a hotspot must not strand the walk engine).
        e.preventDefault();
        s.keys.add(e.code);
      } else if (ACTION_CODES.has(e.code)) {
        // Space/Enter on a focused button/link = native click; KeyE is ours.
        if (isActivatableTarget(e.target) && e.code !== 'KeyE') return;
        e.preventDefault();
        if (!e.repeat) s.action = true;
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        s.run = true;
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      s.keys.delete(e.code);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') s.run = false;
    }
    function onBlur() {
      s.keys.clear();
      s.joy = null;
      s.run = false;
      s.joyRun = false;
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
  /** Keyboard Shift held. */
  run: boolean;
  /** Joystick pushed past the rim threshold (hysteresis in applyJoystickRun). */
  joyRun: boolean;
}
