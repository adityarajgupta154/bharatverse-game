---
name: E2E click-block overlay testing
description: How to correctly verify that a temporary overlay blocks clicks in Playwright-based e2e tests (and why timed-click tests give false failures).
---

# Verifying click-blocking overlays in e2e

**Rule:** To prove a transient overlay blocks clicks, assert
`document.elementFromPoint(x, y)` returns the overlay during its window —
never assert "a click during the window did nothing".

**Why (two false-failure modes seen while testing the rift veil):**
1. Playwright element `click()` auto-retries actionability: it silently waits
   until the overlay unmounts, then the click fires on the revealed target —
   test concludes "click went through" even though a real single click was
   swallowed.
2. Raw `page.mouse.click()` has no retry, but page.evaluate polling loops share
   the CDP command queue and delay the dispatch — a "click at 150ms" actually
   fired after the 420ms window. The tester's own timeline (navigation observed
   ~200ms after overlay unmount) exposed this.

**How to apply:** One single evaluate mid-window: capture
`elementFromPoint(targetX, targetY)?.className` and check it is the overlay.
Since the overlay has no click handlers and covers the viewport, hit-testing is
deterministic proof. Avoid concurrent polling loops during timing-sensitive
input dispatch.
