---
name: Canvas visual goldens
description: How to make pixel goldens of a live canvas game scene deterministic and actually sensitive to rig/sprite mistakes.
---

# Visual goldens for canvas game scenes

1. **Freeze the whole scene at creation, don't "settle".** A dev URL param → scene arg that pins the animation state and turns `update()` into a no-op (time, patrols, camera easing, proximity all stop at frame 0) makes repeated captures BYTE-IDENTICAL — hash-compare proves zero noise, so the diff budget guards only real change.
**Why:** waiting/settling still leaves time-driven idle sway, roaming NPCs and camera easing; those were exactly the AA-jitter sources that forced loose tolerances in earlier world shots.
**How to apply:** any canvas scene needing a pixel golden — expose the freeze through the same query-param family as ?spawn/?at, applied before the first rendered frame.

2. **`toHaveScreenshot` defaults to `scale: 'css'` — raising deviceScaleFactor alone changes NOTHING in the captured file.** Pass `scale: 'device'` too, or the 3x backing store is silently downsampled back to CSS pixels.

3. **Small pivot/anchor mistakes are sub-CSS-pixel at gameplay draw size.** A pivot shifted by Δ moves a limb ~2·sin(θ/2)·Δ (× draw scale) — for small swing angles that is <1 CSS px and passes at scale 1. Capture at DSF 3 + device scale so it lands as whole diffed device pixels; verify sensitivity by deliberately nudging a pivot and measuring the failure (here: 8 frame px → 327-461 diff px vs budget 80).

4. **A rest/zero-angle pose can never guard rotation pivots** — a pivot only matters while its piece rotates. Mid-motion poses are the pivot guards; the rest pose guards recomposition/art. Don't "fix" a rest golden that passes a pivot nudge.

5. **Crop tight around the subject.** Sprite-sized budgets over a full-canvas shot get swallowed by the background; a ~sprite-sized crop keeps one screen-px of limb drift comfortably above the budget.
- Empirical: nudge-calibrated tolerance absorbed a 50% source-PNG downscale (drawImage re-stretches to the same destination rect) — slimming source resolution while staying above draw size is golden-safe.

6. **Tick-gated state needs its own creation-time pin.** A freeze that no-ops `update()` can never reach state that only mutates while machines tick (patrol facing flips only during a leftward leg) — so mirrored/flip draw branches stay invisible to frozen goldens until a dev query param pins that state at scene creation (same family as the freeze). Symmetric crops make this cheap: a window covering max(ax, w−ax) serves both facings unchanged. Verify the variant catches what the original cannot: break the mirror math and confirm the unmirrored goldens stay GREEN while the mirrored ones redden.

8. **A dead-centre anchor (ax == w/2) makes the classic mirror-offset mistake a 0 px no-op** — the mirrored golden then guards only the flipped ART, not the offset math. Don't hunt for a phantom nudge signal; state the caveat in the shot's comment and move on.

9. **Pick golden spawns against the real data, never remembered maps.** A "walkable" tile recalled from a prior session was blocked (spawn silently fell back to the default, sliding the crop off-screen → "clipped area outside image"). Checklist per spawn: tile open in the collision JSON, camY clamp math, every NPC's voice radius vs the crop rect, building prompt ranges (+margin), fixed HUD chrome.

7. **Check the crop in VIEW space, not just world space.** A world-anchored crop rides the camera (subjectY − camY); a spawn that parks the camera high can slide the crop under pinned HUD chrome (TopNav ≈ stage rows 0-72), silently coupling the golden to unrelated UI text. Pick the spawn so the subject's view window clears all fixed chrome, and eyeball the first capture before committing. (Bonus fact: with integer camera + integer crop the same world window is byte-identical at different camY — world crops are translation-exact.)
