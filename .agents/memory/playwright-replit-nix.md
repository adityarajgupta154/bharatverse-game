---
name: Playwright on Replit Nix
description: Runtime requirements for launching Playwright's downloaded Chromium in this Replit workspace.
---

Playwright's downloaded Chromium binary is not self-contained on Replit's Nix environment. Keep its Linux GUI/runtime libraries declared in the workspace Nix packages, including the dedicated `libgbm` package.

**Why:** Downloaded browser binaries do not inherit the Linux runtime libraries they need from npm dependencies, and GBM is not reliably exposed by a general graphics package.

**How to apply:** When adding or upgrading Playwright browser checks, keep the browser install step reproducible and preserve the Nix runtime package list. If Chromium fails before tests start, diagnose loader errors separately from app failures.