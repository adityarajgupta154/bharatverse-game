# BharatVerse — "Restore the Lost Memories"

An Indian heritage exploration game for school students: players travel a painted Memory Map with Aru (boy explorer) and Smriti (guide spirit), restoring fading memories era by era (Sindhu Ghati, Magadha, crafts, festivals, traditional games).

## Run & Operate

- `pnpm --filter @workspace/bharatverse run dev` — run the main game frontend (the managed `artifacts/bharatverse: web` workflow supplies `PORT`/`BASE_PATH`; restart that workflow instead of running this by hand)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Game app: `artifacts/bharatverse` (react-vite, workflow `artifacts/bharatverse: web`)
- PRDs (source of truth for features): `attached_assets/BharatVerse_MemoryMapHub_FinalPolish_Tasks_(1)_1788080789342.md` (Hub screen) and `attached_assets/BharatVerse_Story_NPC_PRD_and_Tasks_v4.1_1788080789341.md` (Village World phase 2)
- Hub reference art (IS the live hub screen): `artifacts/bharatverse/src/assets/images/hub-reference.png`; original upload in `attached_assets/ChatGPT_Image_Aug_29,_2026,_07_41_02_PM_1788083505036.png`
- Game art: `artifacts/bharatverse/src/assets/images/` (hub reference, Aru sprite cutout); UI cutouts cropped from the reference live in `src/assets/images/ui/` (nav bg, tab art, Smriti frame, legend, filter, rift, gear)
- Game config/state: `artifacts/bharatverse/src/game/` + localStorage key `bharatverse-state`

## Architecture decisions

- Frontend-only for now: no DB/API server usage; game state is config-driven (`src/game/nodes.ts`) + localStorage. Backend can come later.
- Hub = the reference image itself: `src/assets/images/hub-reference.png` (user's approved art, 1649×954) is rendered `object-fit: fill` as the entire hub screen — map, gates, rings, paths, Aru, compass all baked in. NO game engine, per Hub PRD.
- Fixed logical canvas: `StageLayout` renders a 1024×592 stage scaled by `min(vw/1024, vh/592)`, centered with letterbox bars (#050403). ALL hub UI is absolutely positioned in stage px.
- Live UI (TopNav, InfoPanel, SmritiDialogue, LegendBar, RightControls) sits exactly on top of its baked counterpart in the image. Backgrounds MUST be fully opaque — any alpha < 1 lets the baked UI "ghost" through.
- Static baked UI (nav, Smriti frame, legend, Filter/Time Rift) is cropped straight from the reference into `src/assets/images/ui/` and re-rendered as `<img>` at the same stage position — pixel-identical by construction. Dynamic zones (active nav tab, player name/level/XP, dialogue text) are blanked inside the cutout (stretched 1px clean-bg columns, ImageMagick) and re-rendered live on top. Nav tabs have gray/gold cutout variants so the active state follows the route.
- Map interactivity: 5 invisible hover-glow hotspot buttons in `MapStage` at gate centers (stage px). Old square-stage/NodeGate overlay approach is removed.
- Hub components are config-driven (`src/game/nodes.ts`) for reuse in the Village World phase.

## Product

- Memory Map Hub (`/`): 5 era-gates with states (explored / in progress / locked), left info panel with restoration ring, Smriti dialogue box, legend, Filter + Time Rift buttons.
- Time Rift (`/oracle`): painted full-scene screen — `rift-scene.jpg` is a native-res crop of the reference art (title/description/tagline/pill visuals baked; sr-only copies for screen readers). Live layer on top: `RiftInfoPanel` (opaque, exactly covers the baked panel so its numbers stay real; teal→green ring), transparent Wapas-Naksha hit-area link, LegendBar reuse. The portal is ALIVE: `rift-swirl.png` (painted swirl disc, feathered circular mask) spins over its static copy with a counter-rotating screen-blend layer + breathing purple glow (`rift-spin`/`rift-glow-pulse` keyframes in index.css, reduced-motion aware). Filter + Time Rift chrome are INERT art (`aria-current` marks the current screen). Pixel golden guards the crop-coupled layout (`tests/time-rift.spec.ts`, regen via `--update-snapshots`).
- Stub routes styled but placeholder: `/journal /passport /companions /heritage /settings /chapter/:nodeId`.
- Phase 2 (COMPLETE, Tasks 0–9): inner "Village World" layer per Story/NPC PRD v4.1. Generic template: `src/components/world/NodeWorldScreen.tsx` (takes nodeId; route `/world/:nodeId`); per-node data in `src/game/worlds/<node-id>/{buildings,npcs}.json` + registry entry in `src/game/worlds/index.ts` (has a "how to add a new node world" guide + dev-time config validator). Climax building completion fires the hub region-restore. Dev helpers: `?debug` (hotspot outlines + dev-complete), `?at=<worldY>` (pan worlds) and `?spawn=<x,y>` (walk worlds).
- Village walking (sindhu-ghati): Aru walks the world with WASD/arrows + Shift-run (touch: joystick + E button); E opens the nearest building's card, walking near an NPC pops their voice bubble. Per-world opt-in via the `walk` config (tile mask + spawn) in `src/game/worlds/index.ts`; reachability enforced by `pnpm verify:village-walk`. Other worlds keep pan+click. Shift-run also works inside all 6 minigames.
- Read-aloud ("Suno"): Smriti voices discovery cards (intro → sections → fun fact), the HUD dialogue box (hub + village — the frame art's speaker glyph is a real button), and BuildingCard invites/locked explanations. Discovery cards play PREGENERATED narration (one consistent storyteller voice on every device): mp3s at `src/assets/audio/narration/<contentId>.mp3`, auto-mapped by `src/lib/narrationAudio.ts` (drop a file = wired); generated with ElevenLabs voice "Niharika" (id `zJrRUu1KEcKH8qdpNaPJ`, settings stability 0.5 / similarity 0.75 / style 0.35 / speed 0.95) from the EXACT `discoveryNarration()` text so audio never drifts from screen copy — regenerate per new region the same way. Live Web Speech TTS (en-IN voice preferred — copy is romanized Hinglish) remains the fallback for missing files and voices the HUD/invites. Shared session (`claimVoiceSession` in `src/lib/speech.ts`) + `useSpeech` hook enforce one voice app-wide across BOTH engines; `verify:world-data` gates narration text and soft-warns on shipped cards missing audio; audio stops on card close/line change.

## User preferences

- Communicate in Hinglish.
- After each PRD task completes: report and ASK before starting the next task (first checkpoint = whole Hub screen, since Hub tasks 0–10 form one screen).
- UI/UX must match the attached reference images pixel-close.
- User mentioned a third "main unified PRD" (storyboards, string tables) that was never attached — may arrive later.

## Validation & release checks

- Registered validation commands: `typecheck` (`pnpm run typecheck`) and `solvability` (`pnpm --filter @workspace/bharatverse run verify:games`). Run both before releasing level/layout edits — a red `solvability` means a kid-facing puzzle became unwinnable or a village became unreachable.
- The `verify:games` chain opens with `verify:world-data` — every region's authored JSONs (buildings/npcs/collision) are schema-parsed and cross-checked (dup ids, game↔building completion targets, anchors on walkable tiles) by the SAME validator the dev-time `defineWorld` guard uses (`src/game/world-validate.ts`). It then replays every minigame headlessly (the REAL scene `update()` driven by synthetic input, observed via each scene's `debugState()` seam), checks unlock rules, and BFS-verifies village walk reachability. The drain-puzzle harness also asserts guard rails: wrong-shape placement rejected, drop-and-repick, post-win freeze.
- Adding a new scene: expose a `debugState()` seam, write `scripts/verify-<scene>.ts` that drives the real `update()` along a golden route (plus negative checks where they apply), and append it to the `verify:games` chain in `artifacts/bharatverse/package.json`.
- Aru-rig visual goldens (`tests/aru-rig-shots.spec.ts`): `?rigfreeze=phase,blend,run,facing` (+`?spawn`) freezes the village scene in a fixed pose — no idle sway/patrols/camera easing — and the spec pixel-compares tight device-scale crops of Aru (idle, mid-stride, run, left-facing). Captures are byte-deterministic; after a DELIBERATE rig/art change regen via `--update-snapshots` and eyeball the new crops before committing.
- Collision masks are authored visually, never by hand-editing strings: open `/dev/mask-editor?zoom=100` (DEV-only route), paint blocked/walkable tiles — live BFS instantly flags stranded tiles, unreachable building anchors, and out-of-range NPCs — then Copy JSON → paste into `src/game/worlds/<node>/village-collision.json` → run `solvability`. `walk.ts` is a thin loader over that JSON (`maskFromCollisionGrid`).

## Gotchas

- Don't run root `pnpm dev`; restart the workflow `artifacts/bharatverse: web` instead.
- Game is landscape-desktop-first; small/portrait screens get a "rotate" overlay by design.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
