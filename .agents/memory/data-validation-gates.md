---
name: World-data validation gates
description: How authored-content validation is CI-proofed here — pure shared validator, compile-time registry locks, strict parsers with proven negatives.
---

# World-data validation gates

**Rule:** a `import.meta.env.DEV`-gated guard is dev-browser-only — CI and production never execute it. Any authoring guard worth having must live in a PURE, asset-free module (relative runtime imports so tsx can load it) that BOTH the dev-time guard and a headless verify script call. One validator, two gates.
**Why:** the village `defineWorld` guard silently protected nothing in CI; schema drift in region JSONs would have shipped as dead hotspots.
**How to apply:** semantic checks return a `problems: string[]` (caller decides throw vs exit-code); structural JSON narrowing lives in throwing `parse*` functions called ONCE in each region's pure config module, so malformed data fails loudly at import everywhere, prod included.

**Registry mirrors — compile-time beats runtime.** A registry that imports vite assets (sprites) can't be loaded under tsx, so CI validation reads a pure mirror module (id → target map). Lock mirror⇄registry with `satisfies { [K in Id]: Def & { id: K } }` on the registry literal: missing key, extra key, and id≠key are all tsc errors (root typecheck = CI). Module-load runtime guards are weaker — nothing in CI ever evaluates that module (architect caught this). Derive per-entry fields (e.g. buildingId) FROM the mirror so values can't drift either.

**Strict parsers:** reject unknown keys (typos are the whole threat model) — including NESTED objects ({x,y,z} passed until nested checkKeys was added). Collect ALL errors before throwing, with per-entry paths.

**Prove every detector:** mutation test the compile-time lock (inject ghost key → tsc must fail naming it) and feed parsers negative fixtures (typo'd key, bad enum, out-of-grid pair). A checker that has never failed is unproven.

**Auto-discovery + expected list:** the CI script readdir-discovers region dirs (dynamic `import(pathToFileURL(...))` under tsx) so a new region can't skip validation, AND cross-checks an explicit expected-ids list so a deleted/renamed dir can't pass an emptier run.

**Content-debt allowlists (gap now closed — explore/recap targets are content-checked):** when a checker must land before the content it checks exists, grandfather via an explicit pending map (full target → owner note) in the pure links module — the validator accepts shipped XOR pending, CI fails any pending entry no building references (debt can only shrink), and a `satisfies Record<string, string> & { [K in ShippedTarget]?: never }` lock makes shipping-without-unlisting a tsc error. Never a boolean/silent skip-list.
