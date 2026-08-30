---
name: GitHub push flow for this project
description: Remote repo setup, the archived pre-rollback build, and the safe push pattern with the user's PAT
---

# GitHub: remote layout & push pattern

Repo: `github.com/adityarajgupta154/bharatverse` (private), remote `origin`. Auth = `GITHUB_PERSONAL_ACCESS_TOKEN` env secret via a per-invocation credential helper — never store the token in `.git/config` or remote URLs:

```
git -c credential.helper='!f() { echo "username=x-access-token"; echo "password=$GITHUB_PERSONAL_ACCESS_TOKEN"; }; f' push origin main
```

**`archive/2026-08-29-historian-build`** holds a ~49k-line OLDER divergent build (Historian API, cutscenes, rewards, OpenAI lib) from a pre-rollback session — it was remote `main` until 2026-08-30, when current work replaced it (force-with-lease after archiving). Do NOT merge that branch into main; it predates the rollback the current codebase was rebuilt from.

**Why:** the repl was rolled back to an earlier checkpoint at some point, so remote history had commits local never saw; a blind force-push would have orphaned them.
**How to apply:** future pushes from here fast-forward normally. If a push is ever rejected again, fetch + diff first — another workspace/session may have pushed; archive before any forced update. `gitsafe-backup` remote is Replit-internal; leave it alone.
