# BharatVerse — Story, Gameplay & NPC System PRD (v4.1) + Build Tasks
**Purpose:** Closes two real gaps in the prior PRDs — (1) story beats were never spatially grounded into an actual playable world, (2) there was no NPC system at all. Both are now specified, grounded directly in your two reference images (Hub view + IVC Village World view). Written for hand-off to Replit Agent (Claude Fable / Claude Opus 5) — every task below is self-contained and config-driven so content changes don't require touching code.

---

# PART A — PRD ADDENDUM

## A.1 What was actually missing (honest gap statement)
The main PRD (Parts IV–V) had a strong *narrative* (16-panel storyboard) and strong *node mechanics* (Explore/Builder/Quiz/Ending), but never answered: **where does the player physically stand while these things happen, and who else is in that world with them?** Your two images answer both:
- **Image 2 (Hub)** — the outer map, already speced in Part VII of the unified PRD.
- **Image 1 (IVC Village World)** — a **second, inner layer**: zooming into a node reveals a walkable-feeling village where every story beat and every minigame is a physical building, and the streets are populated with living NPCs going about their own business. This layer did not exist in any prior doc. This addendum specifies it.

## A.2 Deeper Palace on the Hill research — specifically on NPCs and world-population
Beyond the engine/art findings from the previous addendum, here's what's directly relevant to your NPC question:
- Steam's own listing confirms **"Over 25 regionally & culturally diverse cast of characters to interact"** with — a large cast of named, quirky village residents Vir encounters while exploring.
- The game is explicitly **not** a simulation — Steam tags it Story Rich, Life Sim, Relaxing, Top-Down, 2D/2.5D, Hand-drawn. It achieves a "living village" feeling through **character density and hand-authored dialogue, not through AI behavior or physics-driven crowds.**
- **The lesson for BharatVerse:** your reference image's ~15-20 NPCs doing small things (carrying grain, trading, kids running, a dog, people talking in pairs) do NOT need pathfinding, physics, or any simulation logic. They need: a fixed or short-loop position, an idle animation, and a good line of dialogue. This is entirely achievable with static/lightly-animated sprites — consistent with the "no engine, static isometric art + overlay" architecture already locked in your Hub build (previous task list).

## A.3 Story + Gameplay Integration Framework (closes the "story+game missing" gap)

### A.3.1 The core idea
Each node's micro-world (Image 1 for IVC) is the **physical stage** where that node's storyboard panels (main PRD Part IV, Panels 4–8 for IVC) actually happen. Every named building in the village is one of two things:
1. **A gameplay stage** — clicking it launches an actual mechanic (Explore card, minigame, builder, quiz, ending)
2. **A narrative gate** — recaps or re-triggers a story beat (e.g., the City Entry gate)

### A.3.2 IVC Village World — building-to-stage mapping (grounded in Image 1)
| Building (as labeled in Image 1) | Type | What it triggers | Corresponds to |
|---|---|---|---|
| Sheher ka Dwaar — City Entry | Narrative gate | Re-plays the node's intro cutscene/recap; "PHIR SE PADHO" (Read Again) button | Storyboard Panel 3–4 (rift entry) |
| Vishaal Snanagar — The Great Bath | Explore hotspot | Fact card popup (existing Explore Stage content) | Storyboard Panel 4, PRD §12.1 Stage 1 |
| Anaaj Bhandaar — The Great Granary | Explore hotspot | Fact card popup | Storyboard Panel 4, PRD §12.1 Stage 1 |
| Dhaki Naaliyon ki Gali — Street of Covered Drains | Explore hotspot | Fact card popup | Storyboard Panel 4, PRD §12.1 Stage 1 |
| Bazaar — Trade & Exchange | Explore hotspot (+ optional Trade Route minigame entry if built) | Fact card popup, or launches Trade Route Puzzle | Storyboard Panel 4 / Stage 2C |
| Naali Paheli — Drain Puzzle | Minigame | Launches Drainage Puzzle "Save the City" | Storyboard Panel 5–6 |
| Sheher Banao — City Builder | Minigame/builder | Launches Village Builder (feeds Flood event) | Storyboard Panel 6–7 |
| Aakhri Raaz — House of Mysteries | Climax stage | Launches Mystery Ending (3 theories) | Storyboard Panel 8 |
| Two wells (bottom corners, unlabeled) | Decorative/ambient | No hard gameplay function — NPC activity anchor points (water-carrying flavor, reinforces "water=life" theme) | Ambient world-building only |

### A.3.3 Progression model — free-roam with a climax gate
Image 1 shows buildings scattered non-linearly around a central path, not a forced single-file corridor. **Ruling: the village is free-roam.** The player can visit Great Bath, Granary, Drains, and Bazaar hotspots in any order they like — this matches "wonder, not lecture" (main PRD Design Law, §3). Only **Aakhri Raaz (Mystery Ending)** is gated: it unlocks only after the Drainage Puzzle, Village Builder, and at least the Explore hotspots have been visited (mirrors the existing Explore→Minigames→Builder→Quiz→Ending flow, but expressed spatially instead of as a forced sequence).

### A.3.4 Why this resolves the "story+game missing" gap
Previously, "the storyboard" and "the node mechanics" were described in two separate PRD parts with no explicit spatial/UX bridge. Now: **entering a node from the Hub = walking through this village gate; every mechanic is a building you choose to enter; the story is literally the map.** This is the single biggest structural gap this addendum closes.

## A.4 NPC System Specification (net-new — did not exist before)

### A.4.1 NPC categories
| Category | Behavior | Purpose | Example from Image 1 |
|---|---|---|---|
| **Ambient/Flavor NPCs** | Fixed position or short 2–4 point walk-loop; idle animation only | Pure atmosphere — makes the village feel alive | Kid running, dog, man carrying a sack |
| **Context NPCs** | Fixed position near a specific building; dialogue bubble tied to that building's theme | Ambient preview of what's inside that building, reinforces the fact before the player even clicks in | Granary keeper: *"Anaaj surakshit hai, shahar majboot hai"* near Anaaj Bhandaar; well-women: *"Jal amrit hai, iski raksha karo"* near the wells |
| **Narrator-voice NPCs** (stretch, optional) | Fixed position, central path | Deliver a more reflective/thematic line, not tied to one building | Center figure: *"Har gali ek kahani, har mod ek yaad"* |

**Hard rule: no NPC in this system is a pathfinding agent, has AI-generated dialogue, or reacts dynamically to the player in real time.** All positions, loops, and lines are pre-authored and stored in config. This keeps the system fast to build and matches exactly how Palace on the Hill achieves its "living village" feeling (§A.2).

### A.4.2 Technical approach (consistent with the Hub's static-art architecture)
- Each NPC is a small illustrated sprite (AI-generated, same style-locked palette as the node's background) placed at a fixed `{x, y}` anchor over the static village background
- **Movement (optional per NPC):** a simple linear tween between 2–4 waypoints, looped back and forth, CSS/JS transform-based — no physics, no collision detection, no pathfinding
- **Idle animation:** a 2–4 frame swap or subtle CSS transform loop (bob, sway) — same technique as Aru's idle animation from the Hub build
- **Dialogue bubble:** reuses the Hub/Village's existing speech-bubble visual style (dark rounded card, small pointer, short Hindi line) — appears either (a) automatically on a timed cycle for ambient immersion, or (b) on hover/tap for a deliberate "listen" interaction — recommend (a) for flavor NPCs, (b) for context NPCs so players discover facts by exploring
- **Content storage:** one `npcs.json` per node, each entry: `{ id, position, waypoints[] (optional), spriteId, category, dialogueLines[], linkedBuildingId (optional) }` — content-only file, editable without touching component code

### A.4.3 Population density guidance
Image 1 shows roughly 15–20 NPCs. For hackathon build speed, **target 8–12 NPCs per node**, using a small set of base sprite templates (e.g., 4–5 pose templates: walking-carrying, standing-talking-pair, child-running, animal, water-carrier) with palette/prop variation rather than fully unique art per NPC. This preserves the "lived-in" density feeling at a fraction of the art cost.

### A.4.4 Fallback rule
If the movement/animation pipeline runs short on time, **NPCs can ship fully static** (fixed pose, no walk-loop) with only the dialogue-bubble-on-hover interaction working. Per §A.2's own research finding, density + good dialogue matters more than motion — this fallback still delivers most of the intended feeling.

## A.5 Cross-Node Reuse
This entire Village World pattern — style-locked background, `buildings.json`-driven gates, `npcs.json`-driven ambient life, free-roam-with-climax-gate progression — is the **template for all 5 nodes**, not just IVC. Only the art (per-node style bible, already defined in the earlier isometric addendum) and the two config files change per node.

## A.6 Notes for the Replit Agent (Claude Fable / Claude Opus 5)
- Keep `buildings.json` and `npcs.json` fully separate from component logic — the agent should build ONE generic `NodeWorldScreen` component that reads any node's two config files and renders accordingly, not five hand-coded village screens.
- Reuse existing Hub components wherever the visual language repeats: the info panel (left), Smriti dialogue box, legend bar, Filter/Time Rift buttons are **identical** components between Image 1 and Image 2 — do not rebuild them, import/reuse.
- Follow the style-lock discipline from the Hub build: lock ONE building's art + ONE NPC sprite template before mass-generating the rest of this village's assets.

---

# PART B — BUILD TASKS (Task 0 onward)

## Task 0 — Config Schema Lock (decisions, not code — do first)
- 0.1 Finalize `buildings.json` schema: `{ id, name, subtitle, type: "explore"|"minigame"|"builder"|"climax"|"narrative_gate", state: "explored"|"in_progress"|"locked"|"story_mission", position: {x,y}, unlocksAfter: [buildingId...], routeTarget }`
- 0.2 Finalize `npcs.json` schema (per §A.4.2 above)
- 0.3 Confirm the IVC building list + states from the table in §A.3.2 as the seed data
- **Acceptance:** both schemas reviewed and approved before any component work starts.

## Task 1 — Village Background Art (style-locked)
- 1.1 Generate the IVC village background — cobblestone streets, river-adjacent layout, matches the Hub's established terracotta/sandy palette (per Part VII style bible) — this is a NEW illustration, not the Hub's map, but same art style family
- 1.2 Lock this as the reference for all IVC building sprites (Task 2) and NPC sprites (Task 4) — approve before proceeding
- **Acceptance:** background matches the Hub's overall visual language; visibly "IVC" (terracotta brick, sandy ground) not confusable with another node.

## Task 2 — Building/Gate Components
- 2.1 Generate 8 building illustrations (per §A.3.2's list) matching Task 1's locked style — City Entry gate, Great Bath, Granary, Drain Street, Bazaar, Drain Puzzle building, City Builder building, House of Mysteries
- 2.2 Build the generic `NodeBuilding` component — reuses the Hub's node-gate pattern exactly (glow ring by state, state-icon badge, label card) — this is the SAME component pattern as the Hub's node gates, just reused at a different scale/config
- 2.3 Wire each building's click to its `routeTarget` (Explore card modal / Drainage Puzzle / Village Builder / Mystery Ending / narrative recap) per the mapping table §A.3.2
- **Acceptance:** all 8 buildings render at correct positions with correct state styling; clicking each launches the correct existing screen/modal.

## Task 3 — Progression/Gating Logic
- 3.1 Implement `unlocksAfter` check — Aakhri Raaz (Mystery Ending) stays locked until Drainage Puzzle + Village Builder + at least the Explore hotspots are marked complete in player state
- 3.2 All other buildings (Great Bath, Granary, Drains, Bazaar, Drain Puzzle, City Builder) are free-roam accessible from node entry — no forced order
- **Acceptance:** locked/unlocked states update live as the player completes stages; no dead-ends, no forced linear path except the climax gate.

## Task 4 — NPC System Core (generic, reusable across all nodes)
- 4.1 Build the generic `NPC` component: renders sprite at position, optional waypoint-loop tween, idle animation, dialogue-bubble-on-hover or timed-cycle (per category, §A.4.1)
- 4.2 Build the `NPCLayer` container that reads a node's `npcs.json` and renders all NPCs for that node
- 4.3 Dialogue bubble component — reuse exact visual style from reference image (dark card, pointer, short line)
- **Acceptance:** generic system works with a placeholder/test `npcs.json` before real content is written; no per-node hardcoding in the component itself.

## Task 5 — NPC Content for IVC Village
- 5.1 Generate 4–5 base NPC sprite templates (walking-carrying, talking-pair, child-running, animal, water-carrier) matching Task 1's locked style
- 5.2 Write 8–12 NPC entries for `npcs.json`: positions scattered per Image 1's layout, category assignment, dialogue lines (bilingual, reuse main PRD's EN/HI string-table pattern), context NPCs linked to their nearby building
- 5.3 Sample lines to seed from (already shown in your reference — reuse/extend this set): granary keeper, mystery-house resident, central path villagers, bazaar trader, bath-side resident, drain-street resident, well women (x2)
- **Acceptance:** village feels populated and non-repetitive on a full screen view; no two adjacent NPCs share the same line.

## Task 6 — Hub ↔ Village World Transitions
- 6.1 Entry transition: clicking a Hub node (e.g., Sindhu Ghati gate) transitions into that node's Village World screen — a brief zoom/fade transition (matches the "rift opening" visual language already established for Oracle) rather than a jarring cut
- 6.2 Exit transition: a persistent "back to Memory Map" affordance (small icon/button, doesn't exist in Image 1's crop but needs to be added — recommend top-left corner near the info panel, unobtrusive)
- 6.3 On node completion (Aakhri Raaz finished): trigger the Hub's region-restore event (grey→color tileset swap, already speced in Part VII)
- **Acceptance:** entering and exiting the village feels intentional, not like a page reload; region-restore fires correctly on the real completion event.

## Task 7 — Shared Component Reuse Audit
- 7.1 Confirm left info panel, Smriti dialogue box, legend bar, Filter button, Time Rift button are the SAME components imported from the Hub build, not rebuilt — only their content/context changes (e.g., info panel still shows Mohenjo-Daro details while inside the village, since you're still "in" that node)
- **Acceptance:** zero duplicate component code between Hub and Village World for these five shared elements.

## Task 8 — Template Generalization (unlocks the other 4 nodes cheaply)
- 8.1 Extract everything built in Tasks 1–7 into a generic `NodeWorldScreen` that takes a `nodeId` prop and loads that node's background image + `buildings.json` + `npcs.json`
- 8.2 Do NOT build the other 4 nodes' content yet — just confirm the template renders correctly with IVC's data, proving it will generalize
- **Acceptance:** `NodeWorldScreen` has no IVC-specific hardcoding left in it; swapping the `nodeId` and config files would be sufficient to stand up a new node's village (even though that's future work).

## Task 9 — Full QA Pass Against Image 1
- 9.1 Side-by-side comparison: building positions, NPC density/placement feel, color palette, typography — match as closely as time allows
- 9.2 State-matrix test: verify all building states (explored/in-progress/locked/story-mission) render correctly together
- 9.3 Performance check on mid-range/school device — this screen has MORE visual elements than the Hub (8 buildings + 8-12 NPCs + background), so profile this specifically, don't assume Hub's performance numbers carry over
- **Acceptance:** demo-ready; matches reference image closely; runs acceptably on target hardware.

---

## Build Order Summary
Task 0 (schema) → Task 1 (background, style-lock) → Task 2 (buildings) → Task 3 (gating) → Task 4 (NPC engine) → Task 5 (NPC content) → Task 6 (transitions) → Task 7 (reuse audit) → Task 8 (generalize template) → Task 9 (QA)

**Why this order:** config schema before any code prevents rework; art style-locked before mass-generating buildings AND npcs (both depend on it); core interactive buildings before decorative NPCs (NPCs are enhancement, buildings are function); generalization only after IVC proves the pattern works — don't abstract prematurely.
