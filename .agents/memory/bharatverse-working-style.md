---
name: BharatVerse workflow & user style
description: How the BharatVerse user wants work delivered and checkpointed
---

# BharatVerse working style

- **Language**: user writes Hinglish; reply in Hinglish.
- **Checkpoint rule**: after each PRD task completes, report to the user and ASK whether to proceed to the next task. Exception agreed: Hub PRD Tasks 0–10 are pieces of one screen, so the first checkpoint is the complete Memory Map Hub; from Village World (Story/NPC PRD v4.1) onward, stop per task.
  **Why:** user explicitly asked for task-by-task sign-off; skipping it breaks trust.
- **Fidelity**: UI/UX must match the attached reference images ("same waisa hona chahiye"). Treat reference screenshots as the spec for layout/mood; PRD text as the spec for behavior/content.
- **Missing doc**: user said "3 PRDs" but only 2 arrived; both reference a "main unified PRD" (storyboard panels, string tables). Flagged to user — may be attached later; don't invent its contents.
- **Pixel-parity solution that finally satisfied "100% same"**: render the user's reference image itself as the screen (fixed logical stage + scale transform + letterbox), with live UI absolutely positioned to exactly cover its baked counterparts. Overlay backgrounds must be alpha-1 opaque or the baked UI ghosts through.
  **Why:** two rounds of hand-recreation were rejected as "alag"; only the image-as-canvas approach matched.
- **Verify subagent-claimed rewrites by reading the file**: a design subagent reported the MapStage rewrite complete but the file on disk was unchanged (old code). Screenshot + ReadFile before trusting "done".
