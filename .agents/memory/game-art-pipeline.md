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
- **Removing baked figures from a busy painterly scene**: ImageMagick clone-stamping fails — dense scenes have no clean source rects (twice it copied a recognizable torso/planter into the patch). Working pipeline: crop a region around the figures → `editImage` inpaint ("remove the people, keep the pavement") → force-resize the square output back to the crop's exact WxH → paste back ONLY small feathered rects (+4px margin) around each removed figure, never the whole crop.
  **Why:** whole-crop paste-back shifts texture/lighting visibly at the seam; tiny rects passed pixel-QA first try.
- **Pixel-parity UI**: when live UI must match painted reference art exactly, crop the UI straight out of the reference (`magick -crop`) instead of rebuilding it with CSS; blank dynamic zones by stretching a 1px clean-bg column over them, then render live text/state on top. Verify by `-append`-stacking a live screenshot strip against the same reference strip.
  **Why:** hand-rebuilt nav/bottom bars took repeated font/color tuning rounds and still drifted; cutouts matched on the first try.
- World hotspot calibration: screenshot `/world/<id>?debug&at=<worldY>` (debug = outlines + id labels, at = initial pan), measure against art, then update buildings/npcs JSON. Screen→world: divide by viewport scale, add scrollY.

- **Out-of-context chrome on painted screens**: when a painted screen shows chrome that exists as a LIVE component elsewhere (hub filter/rift buttons on the Time Rift), render it as inert art there — state-mutating controls out of context silently corrupt the other screen's state (filter toggles persist to localStorage). Mark the current-screen button with `aria-current` instead of a self-link. A pixel golden at exact stage scale (fixed viewport, small maxDiffPixelRatio) guards overlay coordinates that are coupled to the reference crop.

- **AI image edits full-regenerate**: editImage re-synthesizes the ENTIRE image (and returns square ~1024²) — never drop-in replace an approved painting with its output (text gets typos, composition drifts). To remove one baked element: editImage a padded SQUARE crop around it, resize the output back, then composite ONLY the changed strip over the untouched original with a feathered alpha gradient (seam through dark/organic zones blends invisibly).
- **Animating a painted element**: crop it at native res under a feathered alpha mask (ImageMagick circle + blur → CopyOpacity), then CSS-rotate the cutout over its own static copy in the painting; a counter-rotating mix-blend-screen echo adds liquid shimmer. Pixel goldens stay deterministic because Playwright toHaveScreenshot freezes CSS animations; pair with prefers-reduced-motion: none per file convention.
- Rig pieces draw into a FIXED destination rect (drawImage stretches source → RIG_FRAME), so source PNG resolution is decoupled from pivot math — shrink sources freely. For ~84px draw height a 400px-tall source suffices: Lanczos 50% downscale cut payload 10× with zero visual change; palette quantization was unnecessary (and risks banding on feathered glow gradients).
- Full-screen baked-art screens (hub map): keep native resolution (retina already upscales it), re-encode PNG→WebP q90 method=6 for ~6× size cut. Do NOT re-encode quality-critical JPG paintings to lower quality — JPG→JPG compounds artifacts; measure RMSE first (~>2% vs source = visible risk, skip).

- **removeImageBackground rejects absolute paths** — pass workspace-relative paths (leading `/` fails); stage crops somewhere like attached_assets/ first.
- **Patching figures out of a JPEG others pixel-test against**: decode → paste feathered rects → ONE re-save at the source's own quality (q92 here) converged — crops far from the patch rects came back byte-identical (AE 0), so unrelated pixel goldens survive. Pre-test convergence (plain decode+re-encode, compare AE) before trusting it on a guarded asset; never re-save twice.
- Wiring buttons onto a baked chip-strip (legend bars etc.): measure each chip x-span objectively with an ImageMagick column-brightness profile (crop the text band, max-per-column via txt: + awk, threshold ~110, merge runs <25px apart), then scale source px to display px. Eyeballing gridline overlays misjudges; the profile lands hit-areas pixel-right first try.

- Dimming glyphs of translucent baked-art UI per-region (chip strips etc.): overlay warm grey + mix-blend-mode:darken (per-channel min → bright glyphs clamp, darker bar pixels unchanged) + feathered gradient mask + isolate on the wrapper. Flat veils and backdrop-filter read as patches (painting leaks through translucent bar); multi-layer luminance mask-mode lists are unreliable.
