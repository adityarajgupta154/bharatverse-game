---
name: Game art pipeline lessons
description: Quirks of generateImage/editImage/removeImageBackground worth remembering
---

# Game art pipeline lessons

- **Aspect ratio**: editImage/generateImage returned 1024x1024 square even when the source was landscape and the prompt demanded wide 16:9 (tried twice). Plan layouts around a square asset (e.g. square stage div `max(100vw,100vh)` with % hotspots) instead of burning retries.
  **How to apply:** for full-bleed scene art, decide the crop/stage strategy up front; don't promise the model an aspect ratio.
- **Verifying transparency**: ReadFile's image preview renders RGB and IGNORES the alpha channel, so a perfect cutout still "shows" its old background. Verify with `magick identify -format '%[fx:mean.a]'` (mean alpha ≈ subject coverage) or flatten over magenta and view that.
  **Why:** nearly discarded two good cutouts and re-ran an unnecessary edit job because the preview looked un-cut.
- `removeImageBackground` handles busy illustrated scenes fine (kept orb glow, clean hair edges) — no need to regenerate subjects on plain backgrounds first.
- **Pixel-parity UI**: when live UI must match painted reference art exactly, crop the UI straight out of the reference (`magick -crop`) instead of rebuilding it with CSS; blank dynamic zones by stretching a 1px clean-bg column over them, then render live text/state on top. Verify by `-append`-stacking a live screenshot strip against the same reference strip.
  **Why:** hand-rebuilt nav/bottom bars took repeated font/color tuning rounds and still drifted; cutouts matched on the first try.
- World hotspot calibration: screenshot `/world/<id>?debug&at=<worldY>` (debug = outlines + id labels, at = initial pan), measure against art, then update buildings/npcs JSON. Screen→world: divide by viewport scale, add scrollY.
