# BharatVerse — "Restore the Lost Memories"

An Indian heritage exploration game for school students: players travel a painted Memory Map with Aru (boy explorer) and Smriti (guide spirit), restoring fading memories era by era (Sindhu Ghati, Magadha, crafts, festivals, traditional games).

## Run & Operate

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
- Stub routes styled but placeholder: `/journal /passport /companions /heritage /settings /oracle /chapter/:nodeId`.
- Phase 2 (not built yet): inner "Village World" layer per Story/NPC PRD v4.1 (buildings.json, NPCs, climax gate).

## User preferences

- Communicate in Hinglish.
- After each PRD task completes: report and ASK before starting the next task (first checkpoint = whole Hub screen, since Hub tasks 0–10 form one screen).
- UI/UX must match the attached reference images pixel-close.
- User mentioned a third "main unified PRD" (storyboards, string tables) that was never attached — may arrive later.

## Gotchas

- Don't run root `pnpm dev`; restart the workflow `artifacts/bharatverse: web` instead.
- Game is landscape-desktop-first; small/portrait screens get a "rotate" overlay by design.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
