---
name: localStorage save-state rule
description: How to persist game/app state without stale-save crashes
---

# localStorage save-state rule

Persist only progress deltas (ids + mutable fields) plus a `v` schema-version key; on load, discard saves with a different `v` and merge progress onto fresh config by id. Never persist whole config-driven objects.

**Why:** BharatVerse hub crashed (`undefined.map`) after a node-schema change because the old save's `nodes` array (missing new fields) was spread over the new config.

**How to apply:** any time state derived from a config file (nodes.ts, buildings.json, npcs.json…) is saved to localStorage — including the upcoming Village World phase.
- Schema bumps should be additive when possible: v2→v3 accepted old saves and defaulted the new field (completedBuildings: {}) instead of discarding progress. Only discard on incompatible shapes.
