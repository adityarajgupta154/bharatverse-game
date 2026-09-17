---
name: Walk-mode world architecture
description: Durable rules from adding DOM-based player walking to a painted world screen.
---

# Walk-mode world architecture

1. **One owner per style prop.** The 60Hz rAF loop mutates the painting layer + sprite transforms via refs; that element's `transform` must NOT also appear in JSX style, or React re-renders clobber loop writes mid-frame. Non-walk worlds keep the JSX-driven transform — the split is per-mode, and dormant hook instances are guarded by a `live` flag so they never touch the DOM.
**Why:** two writers on one style prop = intermittent snap-backs that look like collision bugs.
**How to apply:** any screen where a loop drives an element React also renders (other regions getting walk configs, cutscenes).

2. **Global game-key listeners: suppress only text-editing targets.** Suppressing every BUTTON/A target strands keyboard users the moment Tab lands on a hotspot — only Space/Enter belong to focused buttons/links; movement keys + the interact key stay with the engine.
**Why:** architect review flagged this exact filter as an a11y failure; fix was narrowing it, locked in by an e2e regression (focus a hotspot → press E → card opens).
**How to apply:** any global keydown handler on game screens; always test with focus ON an interactive element.

3. **Walkability is data + proof, not vibes.** Per-world opt-in walk config (tile mask authored against a grid overlay of the painting, spawn, documented voice exceptions) + a headless BFS verifier wired into the `pnpm verify:*` chain (every open tile connects to spawn; every building within interact pad; every NPC within voice range). Corridors must be re-checked against the ART (crop + zoom) before opening tiles — hotspot rects are generous click zones, not building footprints, so the art often has honest walk space a rect claims as blocked.
**Why:** first mask pass left an 8-tile pocket disconnected; art crops showed the real lane between two buildings whose rects overlapped.
**How to apply:** authoring walk masks for the other four regions; keep the reachability verifier in the chain per world.

## Canvas-mode interaction layer (Tasks 5–6)
- Don't port DOM bubbles/buttons to canvas — mount the SAME interaction components (NodeBuilding, NpcLayer) as children of the loop-transformed world overlay; hover/pin/ambient/a11y come free and stay in parity.
- Scene → React state must be discrete: id-guarded refs (prompt id, voice-npc id) push state only on target change; never mirror per-frame values into React.
- Negative proximity asserts need structurally wide dead zones: moveAxis arrival tolerance is ±4px, so a <25px gap between NPC ranges is fragile — pick spots ≥10px from every range boundary, and prefer re-siting over re-tuning when data shifts.

## NPC patrol movers (Task 7)
- Mover hotspot wrappers extend rule 1: JSX carries NO style prop at all; the initial home transform is set once in the ref callback, the loop owns it afterward — React re-renders can never clobber or flash movers at (0,0).
- Route-bounce guards must range-check reversal at route ENDPOINTS: at index 0 a blocked step + naive dir flip targets points[-1] → crash on structurally valid drifted data (validators prove waypoint tiles walkable, not the segment out of home). Endpoint semantics: hold + retry the same leg each pause. Locked in by a gated-isWalkable pure test (blocked first leg → hold; unblock → recover).
- Proximity must read LIVE patrol positions, never authored homes — and the assert proving it is positional: park Aru AT the far waypoint (home provably out of range) and wait for the mover to arrive.
- Figures baked into the painting that become movers: patch them out of a separate walkArt copy only; DOM mode keeps the original art + static hotspots, same npcs.json powers both renderers.
- Touch sprint decision: joystick RIM-HOLD (hysteresis engage 0.95 / release 0.8, pure fn in engine types so scripts can test it), NOT a dedicated button — one thumb, no third touch target, "push harder = faster" is kid-intuitive. Keyboard Shift and joystick rim are separate flags OR-ed in isRunning() so releasing one never cancels the other.
- Procedural walk wobble must derive from per-leg distance with an endpoint taper: then it is exactly zero at every rest BY CONSTRUCTION — frozen goldens need no new pins, and any pause that clears the moving flag gets the rest pose for free. Prove engagement via a debug-state mirror of the same pure function the draw calls (peaks over a leg), never via draw output. Composes with the conversation hold for free: a held mover clears `moving`, so its wobble reads zero while it talks.
- Conversation hold: a voiced mover freezes WHOLESALE (position, leg progress, dwell countdown) and re-faces Aru every held tick; resume = exact continuation. Key engagement on OWNING the open bubble (the scene's voiceNpc), never on raw NPC_RANGE — authored homes can sit inside range of scripted park spots (spawn is ~82px from a guard home; the nearer static owns the bubble there), so raw-range holds deadlock departure/stagger checks. Feeding LAST tick's voiceNpc into tick() is self-stabilizing: a held mover stays put, so it stays nearest.
- The hold inverts release asserts: a voiced mover can no longer "walk out of range" on its own — release/handoff checks must move ARU away (and any facing-flip assert should walk Aru across the frozen mover's axis, computing the expected side from live positions, not hardcoded spots).
