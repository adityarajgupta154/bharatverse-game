# Memory Index

- [BharatVerse workflow & user style](bharatverse-working-style.md) — Hinglish replies; per-PRD-task checkpoints (report + ask before next task); pixel-fidelity to reference images.
- [Game art pipeline lessons](game-art-pipeline.md) — image gen returns square; ReadFile ignores alpha (flatten over magenta); crop UI straight from reference art for pixel parity.
- [localStorage save-state rule](localstorage-save-state.md) — persist progress deltas + schema `v` only; derive stale-able fields (unlocks) at read time instead of migrating saves.
- [Playwright e2e gotchas](playwright-e2e-gotchas.md) — test-results/ wiped every run (artifacts → /tmp); substring role-name matching; specs/configs type-check only if tsconfig includes them.
- [Hover-bubble interaction lessons](npc-bubble-interaction.md) — multi-cause overlays need per-source visibility flags; :focus-visible gating; never put transient text in aria-label.
- [Scaled-stage overlays](scaled-stage-overlays.md) — transform:scale stage wrapper traps z-index; full-screen veils must portal to document.body (fixed, z-100, viewport-% origin).
- [E2E overlay click-block testing](e2e-overlay-testing.md) — element click() auto-retries past overlays; polling delays raw clicks via CDP queue; assert elementFromPoint instead.
- [GitHub push flow](github-push-flow.md) — origin=adityarajgupta154/bharatverse-game (private, canonical); PAT via per-invocation cred helper; old `bharatverse` repo = pre-rollback archive, never merge/port.
- [2D minigame framework lessons](minigame-framework-lessons.md) — key routed game hosts by route params (router reuses instances); mirror gameplay state into DOM HUD text so canvas games are e2e-assertable.
- [Headless scene-sim & e2e split](headless-scene-sim.md) — debugState()+synthetic-input sim for solvability; e2e only for chrome; tsx strips types — keep scripts in tsc include, derive state from the scene seam.
- [Playwright on Replit Nix](playwright-replit-nix.md) — downloaded Chromium still needs explicit Nix runtime libraries; GBM requires the dedicated libgbm package.
- [Walk-mode world architecture](village-walk-mode.md) — loop-owned transforms never in JSX; key filters suppress only text targets; walk masks via BFS verifier; patrol reversal range-checked at endpoints.
- [World-data validation gates](data-validation-gates.md) — DEV-only guards never run in CI: pure shared validator; satisfies-lock registries to pure mirrors; mutation-prove detectors.
- [Speech narration](speech-narration.md) — en-IN voices for romanized Hinglish; one-voice via module session registry (never engine events); painted glyphs → transparent hit-area buttons.
- [Visual-parity refactors](visual-parity-refactors.md) — prove zero visual change via normalized outerHTML diff (strip data-replit-metadata) + pixel goldens with measured AA-jitter tolerance.
- [Canvas visual goldens](canvas-visual-goldens.md) — freeze at creation; DSF needs scale:'device'; zero-angle poses can't guard pivots; tick-gated state (mover facing) needs creation-time pins.
- [Sarvam demo safety boundary](sarvam-demo-safety.md) — production stays fail-closed; preview is rate-limited; only reviewed facts reach children; live calls must validate credentials.
