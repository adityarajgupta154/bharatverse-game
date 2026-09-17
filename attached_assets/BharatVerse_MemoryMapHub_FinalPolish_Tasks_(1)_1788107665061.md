# BharatVerse — Memory Map Hub: Final Polish Task List
**Purpose:** Fresh, standalone task breakdown to rebuild the Hub screen pixel-close to the reference image you shared. Old nav/route list (map, oracle, heritage, passport, historian, settings, shikshak, foundation) is dropped from this doc as requested — reconciled into the new nav structure in Task 0 below. Use this as a direct copy-paste brief for Replit Agent, one task at a time.

---

## RESEARCH FIRST: What nikugames.com actually tells us about the "2D isometric" style

I pulled this directly off `nikugames.com` (their own site + Steam page + press interviews), not guesswork:

- **Steam's own tags for the game:** `2D` · `2.5D` · `Top-Down` · `Hand-drawn`. **Not** tagged "Isometric" or "3D" by Steam's own genre system — the "isometric" description you heard is a player's informal read of the camera angle, not the studio's own classification.
- **Confirmed team:** 2 people — Mala Sen (art direction, a trained textile artist from Kala Bhavan Santiniketan) + Mridul Kashatria (programming). Music by Srikant Krishna. ~3–4 years, based Bengaluru → Coimbatore (cost reasons), funded by savings + ID@Xbox grant + Wings Elevate.
- **Confirmed art process (from their own interview):** *"The art of the game was created by painting large swatches of paper with watercolour"* — physically hand-painted, then digitized and composited into the game as 2D layered art (this is the "2.5D" tag — flat painted layers arranged with parallax/depth, not a true 3D-rotatable isometric camera).
- **Engine:** not publicly confirmed on their site or press materials. Given the profile (Windows/Mac/Linux/Xbox/Switch/iOS/Android, small team, 2D sprite-layered game), **Unity is the standard industry choice for this exact profile** — high-confidence inference, not a verified fact.

### Why this matters for YOUR task list (important correction from earlier research)
The reference image you shared (BharatVerse Memory Map) is almost certainly **not** meant to be a live, camera-rotatable, walkable 3D-isometric world engine. It reads exactly like Palace on the Hill's own approach: **one large, richly painted (here: AI-generated) background illustration, in a fixed isometric-style perspective, with 2D building/character assets composited on top as separate layers, and interactive hotspots positioned over them.** This is dramatically simpler and faster to build than a true Phaser tilemap-engine with walking movement — and it matches the reference image exactly (Aru doesn't need to "walk" tile-by-tile; he can idle-animate in place while the player taps nodes directly).

**Revised recommendation for final polish phase:** Build this as a **static isometric-style painted map + CSS/SVG-positioned interactive hotspots + lightweight idle/hover animations** — NOT a full tile-based movement engine. This is both more achievable in remaining time AND closer to what the reference image actually shows.

---

## TASK 0 — Nav & Route Reconciliation (do this first, it's a decision not code)

Your reference image's top nav: **MEMORY MAP · JOURNAL · PASSPORT · ARU'S COMPANIONS · HERITAGE HUB** — 5 items, clean.
Your current live routes: `/map` (Impact Map) · `/oracle` (Time Rift) · `/heritage` (Apni Parampara) · `/passport` · `/historian` (Itihaaskar) · `/settings` (Sahulat) · `/shikshak` · `/foundation` — 8 items, cluttered.

**Proposed reconciliation (adjust if you disagree):**
| Image's nav item | Maps to your existing route(s) |
|---|---|
| MEMORY MAP | `/map` — this IS the hub screen this whole task list builds |
| JOURNAL | New — a log/history view of facts learned, quiz results, submissions made (currently doesn't exist as a named route; could fold `/historian` "Itihaaskar" content in here as "past conversations with the historian") |
| PASSPORT | `/passport` — unchanged |
| ARU'S COMPANIONS | New — badges/ranks/Smriti relationship screen (currently doesn't exist; could absorb parts of `/shikshak` if that was companion-related) |
| HERITAGE HUB | Consolidates `/heritage` (Apni Parampara) + `/foundation` — a landing for community/UGC features |
| *(not in top nav, floating button instead)* | TIME RIFT — `/oracle` — reference image shows this as a **separate glowing button, bottom-right, not a top nav tab** — matches Oracle's "special moment" framing from the PRD |
| *(not shown — needs a home)* | `/settings` (Sahulat) → gear icon, top-right corner near Aru's profile (image shows a gear icon there already) |

**Acceptance:** Confirm this mapping before building — if any route should NOT fold in as proposed, flag it now so Task 1+ builds the right nav.

---

## TASK 1 — Top Navigation Bar
**Reference elements (left to right):**
- BharatVerse logo (gold ornamental icon) + wordmark "BHARATVERSE" + tagline "RESTORE THE LOST MEMORIES" (small, muted gold)
- 5 nav tabs with icons: Memory Map (temple icon, active/gold-underlined state), Journal (book icon), Passport (ID-card icon), Aru's Companions (people/group icon), Heritage Hub (lotus/circular icon)
- Right side: circular player avatar (Aru's portrait) + "Aru" name + "Level 8 Explorer" (teal) + XP bar with "850 / 1500 XP" + gear/settings icon

**Build tasks:**
- 1.1 Static header bar, dark textured background (matches map's parchment-dark theme), gold accent borders
- 1.2 Nav tabs component — active state = gold underline + gold icon/text; inactive = muted grey/tan
- 1.3 Player identity block — avatar (circular, gold ring border), name, level label, animated XP progress bar (teal fill, dark track), numeric label
- 1.4 Settings gear icon → routes to `/settings`

**Acceptance:** Header renders pixel-close to reference at both desktop and tablet widths; active tab visually distinct; XP bar fills proportionally to actual player XP state.

---

## TASK 2 — Left Info Panel (Node Detail Card)
**Reference elements (top to bottom):**
- Eyebrow label: "INDUS VALLEY CIVILIZATION"
- Title: "MOHENJO-DARO" (large serif/display font)
- Subtitle: "3000 BCE – 1900 BCE"
- Descriptive paragraph (Hindi, ~3 lines): city planning, trade, art, technique fact
- "MEMORY RESTORATION" label + circular progress ring showing "42%" (gold/teal gradient ring)
- "MEMORIES RESTORED" label + fraction "18 / 42"
- "NEXT MEMORY REWARD" card: small icon (scroll/map fragment) + reward title "Indus Script Mysteries" + reward stats "+1 Memory Fragment" / "+25 Resonance"
- "VIEW CHAPTER" button (book icon, gold outline)

**Build tasks:**
- 2.1 Panel container — dark semi-transparent card, gold hairline border, sits over the map's left edge
- 2.2 Node-detail content block — this panel is **dynamic per selected node**: clicking any node on the map (Task 4) updates this panel's title/subtitle/description/dates to that node's data
- 2.3 Circular progress ring component — SVG-based, animated fill, percentage label centered
- 2.4 Reward preview card — icon + title + stat lines
- 2.5 "View Chapter" CTA button — routes into that node's actual gameplay/explore screen

**Acceptance:** Panel content swaps correctly when a different node is selected on the map; progress ring animates on load; reward card reflects that node's actual next-unlock data from `villageState`/node config.

---

## TASK 3 — The Isometric-Style Map Background (see research note above)
**Reference:** a single, continuous, richly painted terrain — sandy/earthy browns, a winding teal river, scattered trees, distant small structures, all rendered in a consistent soft painterly style, fixed camera angle (not top-down flat, not full 3D — a raised ~30–40° painted perspective).

**Build tasks:**
- 3.1 **Style lock (do this before anything else in this task):** generate ONE full-map reference illustration via AI image generation, in the exact palette/perspective of the reference image (earthy terrain, teal river, painterly not flat-vector). Approve this single background before proceeding — every node gate art asset (Task 4) must visually match this background's lighting/style.
- 3.2 Export/slice the approved background as a single large image asset (or a few large tiled sections if file size requires), positioned as the map's base layer
- 3.3 Compass rose element (top-right, N/S/E/W) — decorative, static or subtly rotating with a parallax-on-scroll micro-interaction if time permits
- 3.4 Ambient micro-animation layer (optional, low priority): gentle tree sway, river shimmer/sparkle particles, subtle cloud-shadow drift — these sell the "alive" feeling seen in the reference without needing a game engine; achievable with CSS animations or a lightweight canvas particle layer over the static background

**Acceptance:** Background renders at full width without pixelation on target screen sizes; style is visually consistent with node gate art from Task 4 (test them together, not in isolation).

---

## TASK 4 — Node Gates (the 5 interactive structures)
**Reference:** 5 distinct architectural structures scattered across the map, each inside a soft glowing ring, each a different gate/arch style reflecting its node's era/theme:
- **Sindhu Ghati** (top-left) — Indus-brick gateway with bull motif carving, terracotta/blue — **state: EXPLORED** (green checkmark badge, "Gateway to the Civilization" label)
- **Magadha Kaal** (top-right) — stone pillars topped with lion capitals (Ashokan reference) — **state: LOCKED** ("Coming Soon" label, padlock icon)
- **Kala Bhoomi** (mid-left) — pottery/weaving-themed arch with hanging textiles — **state: LOCKED** ("Crafts & Creations")
- **Apni Parampara** (bottom-center) — ornate temple-bell/curtain gate, most decorated — **state: IN PROGRESS** (heart icon, glowing gold ring, "Add Your Heritage — Andar Chalo")
- **Khel Maidan** (bottom-right) — bunting/flag-decorated courtyard gate — **state: LOCKED** ("Traditional Games")
- Dotted glowing path lines connect each gate back to Aru's center position

**Build tasks:**
- 4.1 Generate 5 node-gate art assets (AI image gen, same style-locked palette from Task 3.1) — one per node, distinct architecture matching its era (this is where the "era-distinct visual identity" AoE-inspired principle from earlier research directly applies)
- 4.2 Node component: gate image + soft radial glow ring (color varies by state: green-tinted for Explored, gold-pulsing for In Progress, dim/grey for Locked) + state icon badge (checkmark / padlock / heart / story-mission star) + label card (node name + short subtitle)
- 4.3 State-driven rendering: node's visual state (Explored/In Progress/Locked/Story Mission) pulls from actual `playerState`/node-completion data — not hardcoded
- 4.4 Dotted/glowing connector paths (SVG, from Aru's center position to each gate) — animate as a subtle traveling light pulse along the path (matches the reference's dotted-gold-light styling)
- 4.5 Click/tap handler: selecting a node updates Task 2's info panel AND (if unlocked) offers a "View Chapter"/enter action; locked nodes show a gentle "not yet unlocked" state, no dead click

**Acceptance:** All 5 nodes render with correct state styling matching current game progress; clicking updates the info panel; locked nodes are visually distinct and don't allow entry; connector paths render correctly regardless of node position changes.

---

## TASK 5 — Aru (Center Character)
**Reference:** Aru stands at the map's center, small glowing circle beneath his feet, holding a satchel/scroll, in a warm earthy-toned outfit consistent with the map's palette. Not walking — idle/standing pose with a paw-print icon marker directly below him.

**Build tasks:**
- 5.1 Aru idle sprite/illustration — same style-locked palette, standing pose (per research note above: **no walk-cycle/movement engine needed** — this is a fixed anchor point, not a walkable character)
- 5.2 Subtle idle animation — gentle breathing/sway loop (2–4 frame swap or CSS transform micro-animation), small glow pulse at his feet
- 5.3 Position Aru as the fixed visual center the connector paths (Task 4.4) radiate from

**Acceptance:** Aru renders centered, idle animation loops smoothly without jank, doesn't require any movement/input logic.

---

## TASK 6 — Smriti Dialogue Box (bottom-left)
**Reference:** Smriti's circular portrait (glowing gold ring) + name label + spoken line in Hindi ("Naksha bhool raha hai, Aru. Chal ke har dwar tak jao.") + audio waveform/speaker icon (implies voice narration playback).

**Build tasks:**
- 6.1 Dialogue box component — dark card, gold border, portrait + text + speaker icon
- 6.2 Contextual line logic — Smriti's line should change based on hub state (e.g., different line if a node just got unlocked vs. general nudge) — reuse the bilingual string-table pattern from the main PRD
- 6.3 Speaker icon → plays a short audio clip if TTS/voice asset exists; if not yet built, icon can be present but non-functional (visually complete, functionally stubbed) — don't block this task on voice pipeline being ready

**Acceptance:** Box renders with correct current line; speaker icon doesn't break the UI if no audio is wired yet.

---

## TASK 7 — Legend Bar (bottom-center)
**Reference:** horizontal row of 4 state-indicator chips: ✅ Explored · 🐾 In Progress · 🔒 Locked · ✨ Story Mission — each with icon + label, small pill/chip styling.

**Build tasks:**
- 7.1 Legend chip row component, matches the exact 4 states used in Task 4.2's node states
- 7.2 Ensure icon set here is IDENTICAL to the icon set used on actual node badges (Task 4.2) — this is a consistency check, not new design work

**Acceptance:** Legend icons visually match node badge icons exactly (same icon, same color per state).

---

## TASK 8 — Filter & Time Rift Buttons (bottom-right)
**Reference:** two buttons — "FILTER" (funnel icon, small red notification dot) and "TIME RIFT" (swirling purple portal icon, distinct glowing purple/violet button, visually set apart from everything else on screen).

**Build tasks:**
- 8.1 Filter button — opens a filter panel/modal (by node state, by region, etc. — scope this based on what's actually filterable in your current data model)
- 8.2 Time Rift button — **routes to `/oracle`** (per Task 0's reconciliation) — this button's violet/purple glow should be the single most visually distinct element on the whole screen, matching the PRD's "Oracle is the demo's participation moment" design intent
- 8.3 Notification dot on Filter — wire to actual state (e.g., "new filter option available") or remove if not applicable yet

**Acceptance:** Time Rift button is unmistakably the visual "odd one out" (different color family from the rest of the gold/teal palette) — this is intentional per the reference image, don't theme-match it to the rest of the UI.

---

## TASK 9 — Left Sidebar Progress Panel Wiring (data layer)
This connects Task 2's UI to real data — separate task because it's backend/state work, not visual work.
- 9.1 `nodeProgress` state shape: per-node `{ region, era, dateRange, description, restorationPercent, memoriesRestored, memoriesTotal, nextReward: { icon, title, stats[] } }`
- 9.2 Compute `restorationPercent` from actual completed-content-count / total-content-count per node (not a hardcoded number)
- 9.3 Wire "View Chapter" button to the correct node-entry route per node

**Acceptance:** Numbers shown in the panel (42%, 18/42, etc.) are computed from real progress state, not placeholder constants.

---

## TASK 10 — Full-Screen QA Pass
- 10.1 Side-by-side comparison against the reference image — check spacing, font choices (display serif for titles, clean sans for body — match the reference's type pairing), color values (sample exact hex tones from the reference if possible)
- 10.2 Responsive check — tablet width minimum (this is a school-device-context product per the main PRD; don't assume desktop-only)
- 10.3 Performance check — one large background image + several mid-size node assets should load fast; compress/optimize all AI-generated art before shipping (WebP over PNG where possible)
- 10.4 State-matrix test — manually set a node to each of the 4 states (Explored/In Progress/Locked/Story Mission) and confirm Task 2 + Task 4 + Task 7 all stay visually consistent with each other

**Acceptance:** This screen is demo-ready — matches reference image closely, all states tested, performs well on a mid-range device.

---

## Build Order Summary (do in this sequence)
Task 0 (nav decision) → Task 3.1 (style lock — do this before ANY art asset) → Task 1 (header) → Task 3.2–3.4 (background) → Task 4 (node gates) → Task 5 (Aru) → Task 2 (info panel) → Task 9 (data wiring) → Task 6 (Smriti) → Task 7 (legend) → Task 8 (filter/rift buttons) → Task 10 (QA pass)

**Why this order:** style-lock first prevents rework; background before nodes so node art can be generated to match it; nodes+Aru+panel form the interactive core (highest priority); Smriti/legend/buttons are additive polish; QA last.
