/**
 * scene-harness — the ONE shared copy of the headless plumbing used by the
 * six mini-game solvability checkers (scripts/verify-*.ts).
 *
 * These checkers drive each REAL scene's fixed-step update() with synthetic
 * input along known-good waypoint routes. render() is never called, so
 * everything runs in plain Node. This module owns:
 *
 *  - the synthetic input stub (direction vector + one-shot action press),
 *  - the fixed-step driver with a global step-budget failsafe,
 *  - the axis-separated moveAxis/goTo walker with stuck + timeout detection,
 *  - press() before/after snapshots for act-style assertions,
 *  - makeCarryAct(): pick / place / reject / drop assertions shared by the
 *    four carry-and-place games,
 *  - settleAndAssertWon(): celebration settle + won/objective assertion,
 *  - assertFrozenAfterWin(): the two-direction post-win freeze probe.
 *
 * Fix or strengthen behavior HERE — never re-inline a private copy in one
 * verify script, or the six checkers drift apart again and a future bug can
 * slip through the weakest copy. Scene scripts keep only their route,
 * waypoints, and scene-specific assertions.
 */
import type { SceneHud } from '../../src/game/games/types';

export type Vec2 = { x: number; y: number };

/** The slice of GameInput that scenes read inside update(). */
export interface HarnessInput {
  getDir(): Vec2;
  consumeAction(): boolean;
  isRunning?(): boolean;
}

/** Every scene's debug seam exposes at least Aru's position and the won flag. */
export interface BaseDebugState {
  pos: Vec2;
  won: boolean;
}

/**
 * What the harness needs from a scene: the real Scene contract minus
 * render(), plus the debugState() observation seam each scene exposes.
 */
export interface HarnessScene<State extends BaseDebugState> {
  update(dt: number, input: HarnessInput): void;
  hud(): SceneHud;
  debugState(): State;
}

export interface HarnessOptions {
  /** Global failsafe on simulated steps (default 60*600 = 10 game-minutes). */
  maxSteps?: number;
  /** Per-leg step budget for moveAxis (default 60*30 = 30 game-seconds). */
  legTimeoutSteps?: number;
  /** Arrival tolerance in level px (default 4). */
  arriveTolerancePx?: number;
}

const DT = 1 / 60;

export function createHarness<State extends BaseDebugState>(
  scene: HarnessScene<State>,
  opts: HarnessOptions = {}
) {
  if (typeof scene.debugState !== 'function') {
    throw new Error('scene.debugState() missing — harness cannot observe state');
  }

  const maxSteps = opts.maxSteps ?? 60 * 600;
  const legTimeoutSteps = opts.legTimeoutSteps ?? 60 * 30;
  const tolerance = opts.arriveTolerancePx ?? 4;

  // -- synthetic input stub -------------------------------------------------
  let dirVec: Vec2 = { x: 0, y: 0 };
  let pending = false;
  const input: HarnessInput = {
    getDir: () => dirVec,
    consumeAction: () => {
      const a = pending;
      pending = false;
      return a;
    },
  };

  // -- fixed-step driver with global budget ----------------------------------
  let totalSteps = 0;
  function step(n = 1) {
    for (let i = 0; i < n; i++) {
      scene.update(DT, input);
      if (++totalSteps > maxSteps) throw new Error('step budget exceeded');
    }
  }

  const state = () => scene.debugState();
  const pos = () => state().pos;
  const hud = () => scene.hud();
  const at = () => `(${pos().x.toFixed(1)}, ${pos().y.toFixed(1)})`;

  // -- axis-separated walker --------------------------------------------------
  function moveAxis(axis: 'x' | 'y', target: number) {
    let stuck = 0;
    for (let i = 0; i < legTimeoutSteps; i++) {
      const cur = pos()[axis];
      if (Math.abs(cur - target) <= tolerance) {
        dirVec = { x: 0, y: 0 };
        return;
      }
      const sign = Math.sign(target - cur);
      dirVec = axis === 'x' ? { x: sign, y: 0 } : { x: 0, y: sign };
      step();
      if (Math.abs(pos()[axis] - cur) < 0.01) {
        if (++stuck > 10) {
          dirVec = { x: 0, y: 0 };
          throw new Error(`stuck moving ${axis}->${target} at ${at()}`);
        }
      } else {
        stuck = 0;
      }
    }
    throw new Error(`timeout moving ${axis}->${target} from ${at()}`);
  }

  /** Axis-separated walking; waypoints must make each leg a clear lane. */
  function goTo(x: number, y: number) {
    moveAxis('x', x);
    moveAxis('y', y);
  }

  /** Queue one action press, advance one step, return before/after states. */
  function press(): { before: State; after: State } {
    const before = state();
    pending = true;
    step();
    return { before, after: state() };
  }

  /** Assert the current HUD hint contains `substr` (feedback guard rails). */
  function expectHint(substr: string, context: string) {
    const hint = hud().hint;
    if (!hint.includes(substr)) {
      throw new Error(`${context}: expected hint containing "${substr}", got "${hint}"`);
    }
  }

  /** Let the celebration play out, then assert won=true and the objective. */
  function settleAndAssertWon(
    expectedObjective: string,
    settleSteps = 60 * 4
  ): { end: State; hud: SceneHud } {
    step(settleSteps);
    const end = state();
    const h = hud();
    if (!end.won || !h.won) {
      throw new Error(
        `scene did not reach won after settling — state=${JSON.stringify(end)} hud=${JSON.stringify(h)}`
      );
    }
    if (h.objective !== expectedObjective) throw new Error(`unexpected objective: ${h.objective}`);
    return { end, hud: h };
  }

  /**
   * Post-win freeze probe. Movement input and action presses must do nothing
   * once won (the host shows the win card over a frozen scene).
   *
   * Position is re-checked after EACH of two ORTHOGONAL pushes: a single
   * direction can false-pass when Aru already stands against a wall, and
   * opposite directions back-to-back can round-trip home. Do not "simplify"
   * this into one push or one end-of-probe check.
   *
   * `assertSettled` gets the final state for the scene-specific counter check
   * (e.g. placed === 5); won and hud().won are asserted here.
   */
  function assertFrozenAfterWin(assertSettled?: (settled: State) => void) {
    const frozen = { ...pos() };
    for (const d of [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ]) {
      dirVec = d;
      pending = true;
      step(60);
      dirVec = { x: 0, y: 0 };
      const now = state();
      if (now.pos.x !== frozen.x || now.pos.y !== frozen.y) {
        throw new Error(
          `won-pause: Aru moved after the win (dir ${d.x},${d.y}) — (${frozen.x.toFixed(1)},${frozen.y.toFixed(1)}) -> (${now.pos.x.toFixed(1)},${now.pos.y.toFixed(1)})`
        );
      }
    }
    const settled = state();
    if (!settled.won || !hud().won) {
      throw new Error('won-pause: end state drifted after extra input');
    }
    assertSettled?.(settled);
    console.log('OK paused-state immobility — input ignored after won');
  }

  /** Final success line, e.g. `PASS — puzzle completable in 41.2s of game time`. */
  function pass(message: string) {
    console.log(`PASS — ${message} in ${(totalSteps / 60).toFixed(1)}s of game time`);
  }

  return {
    input,
    step,
    state,
    pos,
    hud,
    at,
    moveAxis,
    goTo,
    press,
    expectHint,
    settleAndAssertWon,
    assertFrozenAfterWin,
    pass,
    totalSteps: () => totalSteps,
  };
}

export type Harness<State extends BaseDebugState> = ReturnType<typeof createHarness<State>>;

/** Carry-and-place games also expose what Aru is holding (id, or null). */
export interface CarryDebugState extends BaseDebugState {
  carried: string | null;
}

export type CarryActKind = 'pick' | 'place' | 'reject' | 'drop';

export interface CarryActConfig<State extends CarryDebugState> {
  /** Read the progress counter (placed/shelved/poured) from debug state. */
  count: (s: State) => number;
  /** The winning total; used in every OK line. */
  total: number;
  /** Counter word for OK lines, e.g. 'placed', 'shelved', 'poured'. */
  word: string;
  /** HUD hint substring proving a wrong-target rejection. */
  rejectHint: string;
  /** HUD hint substring proving an open-floor set-down. */
  dropHint: string;
}

/**
 * Shared act-style assertions for the four carry-and-place games:
 *  - 'pick'   : hands must end non-empty
 *  - 'place'  : counter must advance by exactly 1
 *  - 'reject' : counter unchanged, the SAME item kept in hand, rejection hint shown
 *  - 'drop'   : hands empty, counter unchanged, set-down hint shown
 * Every success prints `OK <label> — <word> <n>/<total>, carried=<id|->`.
 */
export function makeCarryAct<State extends CarryDebugState>(
  h: Harness<State>,
  cfg: CarryActConfig<State>
) {
  return function act(kind: CarryActKind, label: string) {
    const { before, after } = h.press();
    const at = `(${after.pos.x.toFixed(1)}, ${after.pos.y.toFixed(1)})`;
    if (kind === 'pick' && after.carried === null) {
      throw new Error(`${label}: pickup failed at ${at}`);
    }
    if (kind === 'place' && cfg.count(after) !== cfg.count(before) + 1) {
      throw new Error(
        `${label}: ${cfg.word} count did not advance at ${at} — hint: "${h.hud().hint}"`
      );
    }
    if (kind === 'reject') {
      if (cfg.count(after) !== cfg.count(before)) {
        throw new Error(`${label}: forbidden placement was ACCEPTED at ${at}`);
      }
      if (after.carried !== before.carried || after.carried === null) {
        throw new Error(`${label}: item was not kept in hand after rejection at ${at}`);
      }
      h.expectHint(cfg.rejectHint, label);
    }
    if (kind === 'drop') {
      if (after.carried !== null) {
        throw new Error(`${label}: drop failed at ${at} — still carrying ${after.carried}`);
      }
      if (cfg.count(after) !== cfg.count(before)) {
        throw new Error(`${label}: drop changed the ${cfg.word} count at ${at}`);
      }
      h.expectHint(cfg.dropHint, label);
    }
    console.log(
      `OK ${label} — ${cfg.word} ${cfg.count(after)}/${cfg.total}, carried=${after.carried ?? '-'}`
    );
  };
}
