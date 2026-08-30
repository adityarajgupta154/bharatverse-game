---
name: Scaled-stage overlays
description: Why full-screen overlays/veils in BharatVerse must portal to document.body instead of using z-index inside the stage.
---

# Full-screen overlays vs the scaled stage

**Rule:** Any overlay that must cover the ENTIRE screen (transition veils, modal
scrims that should sit above TopNav) must be rendered via `createPortal` into
`document.body` with `position: fixed; inset: 0` and a high z-index. Do NOT try
to win with z-index from inside the stage tree.

**Why:** StageLayout wraps the whole 1024×592 stage in a `transform: scale(x, y)`
div. A CSS transform creates a stacking context, so every descendant's z-index
is trapped inside it — a `z-[9999]` child can still paint below an app-level
sibling like TopNav (`z-50`). This burned a full review+test cycle on the rift
transition veil (z-60 → z-100 attempts both failed) until the veil was portaled
to body.

**How to apply:**
- Portal the overlay to `document.body`, `fixed inset-0 z-[100]`.
- Convert stage-logical px coordinates (1024×592) to viewport percentages when
  the visual needs an origin point — the stage fills the viewport, so
  `(x/1024)*100% / (y/592)*100%` maps correctly.
- Overlays that only need to cover in-stage content (bubbles, cards under the
  nav) can stay inside the stage tree as before.
