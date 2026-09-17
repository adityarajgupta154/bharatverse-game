---
name: GitHub push flow for this project
description: Remote repo setup, the archived pre-rollback build, and the safe push pattern with the user's PAT
---

# GitHub: remote layout & push pattern

The `origin` repository is the canonical home. An older repository named `bharatverse` exists separately with pre-rollback history; leave it alone unless the user asks. Try the environment's existing Git authentication before requesting another credential. A previously used `GITHUB_PERSONAL_ACCESS_TOKEN` secret may no longer exist.

**Why:** Auth availability changes between sessions. Successful `ls-remote` or fetch proves read access only: a push can still fail with invalid credentials. The GitHub connector can have working REST write permissions without authenticating native Git transport.

**How to apply:** Check read access with `GIT_TERMINAL_PROMPT=0 git ls-remote origin`, but report success only after the authorized push and matching remote commit are verified. Check the GitHub integration before requesting credentials. For a full-history native Git push, use the fallback below only when the named secret is confirmed present; never store tokens in Git configuration or remote URLs:

```
git -c credential.helper='!f() { echo "username=x-access-token"; echo "password=$GITHUB_PERSONAL_ACCESS_TOKEN"; }; f' push origin main
```

In the OLD `bharatverse` repo, **`archive/2026-08-29-historian-build`** holds a ~49k-line OLDER divergent build (Historian API, cutscenes, rewards, OpenAI lib) from a pre-rollback session — it was that repo's `main` until 2026-08-30 (force-with-lease after archiving). Do NOT merge or port from it; the user explicitly chose fresh designs over the old code (2026-08-30, minigames decision).

**Why:** the repl was rolled back to an earlier checkpoint at some point, so remote history had commits local never saw; a blind force-push would have orphaned them.
**How to apply:** future pushes from here fast-forward normally. If a push is ever rejected again, fetch + diff first — another workspace/session may have pushed; archive before any forced update. `gitsafe-backup` remote is Replit-internal; leave it alone.

## Public snapshot publishing

Publish a clean snapshot commit parented to the current remote tip rather than copying local platform checkpoint history. Keep local development history intact and do not rewrite already-published history.

**Why:** Clean GitHub commits and local checkpoint history serve different purposes. Snapshot publishing means the local and remote commit graphs intentionally diverge even when their file trees match.

**How to apply:** Fetch and compare trees, not just ahead/behind counts. Preserve remote-only changes. When native Git credentials fail but the connector has write access, GitHub's Git Data API can upload binary blobs and a tree, create one commit, then advance the remote ref with `force: false`. Verify the exact target tree hash before changing the ref and the remote commit afterward. Pace writes to respect secondary API limits.
