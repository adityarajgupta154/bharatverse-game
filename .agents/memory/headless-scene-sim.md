---
name: Headless scene-sim & e2e split for canvas minigames
description: How to verify 2D canvas puzzle solvability deterministically, and when NOT to use the browser tester for gameplay.
---

# Headless scene simulation + e2e split

## Rule
Verify minigame GAMEPLAY logic (movement, pickups, placements, win chain) with a headless
simulation that drives the real scene's fixed-step `update()` with synthetic input; use the
browser testing subagent ONLY for React chrome (intro/win cards, HUD text, navigation,
persistence) via short interaction smoke tests.

**Why:** keyboard-scripted navigation in a real browser drifts over long hold-key chains —
full-playthrough tester runs fail from cumulative position drift even when every mechanic
works. Deterministic fixed-dt simulation has zero drift and surfaces real geometry problems
instantly.

**How to apply:**
- Every scene exposes a read-only `debugState()` seam (pos, carried, placed, won) alongside
  `update/render/hud`, declared IN the factory's return type (`Scene & { debugState(): ... }`).
  Checkers derive their state type from that signature by inference — never re-declare a local
  State in a checker or cast the scene to it: an `as A & B` cast always succeeds, so a renamed
  seam field silently stops being type-checked (richer return stays assignable where `Scene` is
  expected, so nothing else changes).
- tsx STRIPS types, it never checks them — the scripts dir must be in the package tsconfig
  `include` (alongside src) or type bugs in checkers/harness ship silently. After widening
  coverage, prove the chain is real by injecting a field rename and watching tsc fail in the
  checker, then restore.
- Harness pattern: axis-separated waypoint walking + explicit per-act assertions (pick, place,
  mismatch-reject including the HUD hint text, drop/re-pick). One verify script per scene,
  registered as a package script; rerun after ANY level/radius/movement change.
- The plumbing (input stub, step budget, walker, carry-act assertions, freeze probe) lives ONCE
  in a shared scene-harness module under the scripts lib dir — strengthen probes THERE so every
  checker inherits the fix; never fork a private copy into one script, that is exactly how the
  checkers drifted apart before consolidation.
- Arrival threshold must exceed per-step movement distance (speed × dt): collision is
  reject-style (no snap), so a tighter threshold false-positives as "stuck".
- The React win-chain (win card → completion → navigation) is host-component-generic: once
  proven e2e for one scene, new scenes only need an interaction smoke test, not a full
  browser playthrough.
- Every harness needs the negative paths, not just the golden route: wrong-target reject
  (item stays in hand, state AND HUD line), drop asserts the set-down feedback, re-pick
  asserts the same item id (or subject/color if that's all the seam exposes), post-win freeze.
- Post-win freeze probe: drive TWO orthogonal directions with a position check after EACH —
  one direction can false-pass against a wall; opposite directions back-to-back round-trip home.
- Hint assertions need a substring unique to the rejection line — success and reject copy often
  share words (kho-kho's success and reject lines both say 'chamakta khamba').
- Cyclic animation phases wrap at 2π. Never compare run/walk phase deltas by dividing wrapped
  angles: either unwrap them, or compare each modulo delta with the modulo value implied by
  actual distance. A test can otherwise fail exactly when a healthy stride crosses a full cycle.

## Level-design corollary
- Pick radius < TILE means adjacent-tile pickup fails — players must overlap the piece tile.
  Keep pick radius forgiving (~0.9 × TILE) and never fence a pickup into a single-tile approach.
- Placing collectibles AGAINST walls is the friendliest spot: walking until the wall stops you
  lands you in pick range automatically.
