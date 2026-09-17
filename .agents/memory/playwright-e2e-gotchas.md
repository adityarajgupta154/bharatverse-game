---
name: Playwright e2e gotchas
description: Small Playwright behaviors that produced confusing failures in this project's e2e suite.
---

# Playwright e2e gotchas

1. **`test-results/` is wiped at the start of every `playwright test` run** (even a `-g` filtered rerun of one test). Any artifact a spec produces for later inspection — calibration screenshots, exports — must be written OUTSIDE it (e.g. `/tmp/world-shots/`), or the next rerun deletes it before you look.

2. **Role-name matching is substring by default → strict-mode collisions with templated aria-labels.** `getByRole('button', { name: 'Locked' })` matched a disabled "Locked" CTA *plus* every hub gate labeled "… (locked)". When one label is a suffix/word of others (status suffixes especially), pass `exact: true` or a regex anchored to the full label.

3. **Assert what the UI actually does on redirects, not what seems canonical.** A guard that bounces `/world/<locked>` home may intentionally leave the locked node *selected* so the hub explains why — asserting the default-hub heading fails. Read the failure snapshot (`error-context.md` next to the trace) before "fixing" the app.

4. **`toBeVisible` fails on 0×0 positioning wrappers.** A zero-size absolutely-positioned div (transform-driven sprite/overlay anchor) "resolves" in the log but counts as hidden — put `data-testid` on a sized child (e.g. the `<img>`), never on the zero-size wrapper.

5. **Playwright transpiles specs and its config without type-checking them.** A stale helper signature or renamed fixture in a spec only fails at runtime — or silently weakens an assertion; a typo'd config option is silently ignored. Keep `tests/` (and root `*.ts` configs) in the package tsconfig include, and prove coverage the cheap way: inject a rename, watch tsc fail, restore.

6. **Speed/distance asserts must read WORLD coordinates (debug state hook), never element bounding boxes.** Camera-follow pins the sprite mid-viewport (vertical bbox barely changes), and two timed runs that both clamp on the same wall fake a "sprint not faster" regression (both end at ~the same x). Pick the lane from the collision mask first (longest clear run), measure via the `?debug` world-pos mirror, and treat an interactive tester's "modal won't close / controls dead" as suspect until a deterministic spec reproduces it — dialog focus-restore + Enter re-activating the trigger is standard a11y behavior, not a bug.

7. **`window.speechSynthesis` is a getter-only accessor — plain assignment in an init script silently no-ops.** The app then talks to the REAL engine while your recorder sees nothing (symptom: real `speak()` rejects the stubbed utterance class with a type error). Stub BOTH globals via `Object.defineProperty(window, 'speechSynthesis'|'SpeechSynthesisUtterance', { configurable: true, value: ... })`. Bonus determinism: a stub that never fires `onend` keeps the UI in its "speaking" state for assertions — provided the app's stop path completes state explicitly instead of waiting for engine events.

## Visual-verifying interactive states (cards, overlays)
The Screenshot tool only captures static pages. To eyeball states that need
clicks (modals, fact cards): drop a throwaway spec in tests/ that navigates,
clicks, and `page.screenshot({ path: '/tmp/...png' })`s each state, run just
that spec, delete it, then view the /tmp images. Reuses the Playwright
webServer/config for free; keeps artifacts out of test-results/.

- Screenshot specs: after click(), the mouse PARKS on the element — its hover style pollutes the shot (phantom "pill"). page.mouse.move() far away before screenshotting.
