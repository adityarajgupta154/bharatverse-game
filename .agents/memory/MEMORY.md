# Memory Index

- [BharatVerse workflow & user style](bharatverse-working-style.md) — Hinglish replies; per-PRD-task checkpoints (report + ask before next task); pixel-fidelity to reference images.
- [Game art pipeline lessons](game-art-pipeline.md) — image gen returns square; ReadFile ignores alpha (flatten over magenta); crop UI straight from reference art for pixel parity.
- [localStorage save-state rule](localstorage-save-state.md) — persist progress deltas + schema version only; never persist whole config-driven objects (stale saves crash new UI).
- [Hover-bubble interaction lessons](npc-bubble-interaction.md) — multi-cause overlays need per-source visibility flags; :focus-visible gating; never put transient text in aria-label.
- [Scaled-stage overlays](scaled-stage-overlays.md) — transform:scale stage wrapper traps z-index; full-screen veils must portal to document.body (fixed, z-100, viewport-% origin).
- [E2E overlay click-block testing](e2e-overlay-testing.md) — element click() auto-retries past overlays; polling delays raw clicks via CDP queue; assert elementFromPoint instead.
- [GitHub push flow](github-push-flow.md) — origin=adityarajgupta154/bharatverse-game (private, canonical); PAT via per-invocation cred helper; old `bharatverse` repo = pre-rollback archive, never merge/port.
