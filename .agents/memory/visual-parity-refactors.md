---
name: Visual-parity refactors
description: How to prove a UI refactor changed zero pixels in this project (DOM-diff normalization + pixel goldens with measured jitter tolerance)
---

# Proving "zero visual change" for a UI refactor

The rule: identical DOM + identical stylesheets ⇒ identical pixels. Verify both axes; DOM identity is the exact proof, screenshots are the sanity check.

**How to apply:**
1. Before refactoring, capture each affected UI state via a temporary Playwright spec: element-screenshot with `toMatchSnapshot` goldens AND a dump of `element.parentElement.outerHTML` + `document.activeElement` to /tmp. Re-run once to confirm the baseline is green run-to-run BEFORE touching code.
2. Dev-mode DOM dumps contain `data-replit-metadata` / `data-component-name` attributes recording source file:line — they legitimately change when JSX moves between files. Strip them with sed before diffing; everything else must be byte-identical.
3. Screenshots in walk-mode worlds jitter ~10–30 px of subpixel anti-aliasing between identical-code runs (camera easing never fully settles). Measure the noise on identical code first, then set `maxDiffPixels` a few× above it (150 worked) — far below any real layout/style change. Static `?at=` panning worlds are deterministic.
4. Keep Tailwind class strings byte-identical and as literals at call sites (JIT scans source for literal tokens; `w-[${x}px]` template interpolation breaks generation). When a shared component needs per-caller sizing, pass literal class strings as props and interpolate them into the same position in the class list so outerHTML diffs stay clean.

**Why:** pixel fidelity is a hard requirement in this project, but raw screenshot comparison alone either flakes (AA jitter) or lies (misses focus/behavior); the normalized-DOM diff catches every real change exactly and explains every diff it shows.
