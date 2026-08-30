---
name: 2D minigame framework lessons
description: Routed canvas-game hosts — remount keying and e2e testability via DOM HUD
---

# 2D minigame framework lessons

## Key routed game hosts by route params
Wouter (and most routers) reuse the same component instance when only route
params change (`/world/a/game/x` → `/world/a/game/y`). A stateful host screen
(scene, phase, input, loaded assets) then leaks the previous route's state —
e.g. a "won" modal appearing for a game never played.
**Why:** architect review caught this after Task 0; no UI path triggered it yet
(all transitions went via the village screen, which unmounts the host), so it
would have surfaced later as a mystery bug.
**How to apply:** render routed stateful hosts with `key={param identity}`
(e.g. `key={nodeId:gameId}`), and make asset-loading hooks depend on a value
signature of their inputs, not run-once effects.

## Canvas gameplay is e2e-testable via DOM HUD text
The Playwright tester cannot read canvas pixels, but it CAN assert the DOM HUD
(objective chip, hint bar with role=status) that the scene updates contextually
(near-crate hint, carrying hint, "1/3" counter).
**Why:** this let the tester verify the full move→pick→place loop of a pure
canvas game (Task 0) with a success verdict and no special tooling.
**How to apply:** always mirror gameplay state transitions into DOM text; in
the test plan give the tester the level layout in world px + actor speed so it
can compute key-hold durations (`keyboard.down` + timeout), and tell it to
iterate small nudges polling the hint text.
