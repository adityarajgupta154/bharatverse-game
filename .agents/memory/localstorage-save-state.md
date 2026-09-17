---
name: localStorage save-state rule
description: How to persist game/app state without stale-save crashes
---

# localStorage save-state rule

Persist only progress deltas (ids + mutable fields) plus a `v` schema-version key; on load, discard saves with a different `v` and merge progress onto fresh config by id. Never persist whole config-driven objects.

**Why:** BharatVerse hub crashed (`undefined.map`) after a node-schema change because the old save's `nodes` array (missing new fields) was spread over the new config.

**How to apply:** any time state derived from a config file (nodes.ts, buildings.json, npcs.json…) is saved to localStorage — including the upcoming Village World phase.
- Schema bumps should be additive when possible: accept old saves and default the new field instead of discarding progress. Only discard on incompatible shapes.
- Corollary — derive, don't migrate: when a persisted field can go stale against new content rules (e.g. a saved lock status once unlock conditions exist), keep the raw save untouched and derive the reader-facing value at read time from other progress. Old saves then upgrade retroactively with zero migration, and writes still persist the raw value.

- Widening a persisted enum list (e.g. filter categories gaining a member): bump schema version and reset JUST that field to the new all-on default for older saves — trusting the old subset silently hides the new category forever. Progress fields still load.
