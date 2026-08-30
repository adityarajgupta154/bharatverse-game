---
name: Hover-bubble interaction engine lessons
description: Source-aware visibility pattern + a11y/testing pitfalls for hover/tap/focus-driven overlays (NPC dialogue bubbles etc.)
---

# Overlay visibility must be source-aware

Rule: when an overlay (bubble/tooltip) can be opened by several causes — hover, keyboard focus, click-pin, ambient auto-cycle — give each cause its own boolean source and render while ANY is active. A cause ending only clears its own flag. Never share one `open` flag with unconditional `close()` calls.
**Why:** a shared flag let the ambient timer dismiss user-pinned bubbles, and pin-expiry closed bubbles still under the cursor (architect caught it; 3 test rounds to converge).
**How to apply:** `open = hovered || focusedVisible || pinned || ambient`; derived effects (e.g. advance dialogue line) fire on the open→close TRANSITION, not inside close handlers.

Two pitfalls found the hard way:
- Click/tap leaves lingering focus on buttons; if plain focus is a visibility source the overlay never closes on mouse-out. Gate it: `setFocused(e.currentTarget.matches(':focus-visible'))` — keyboard focus holds it, pointer-click focus doesn't.
- Never put transient content (the current dialogue line) in `aria-label` — accessible-name text always "exists", so text-based e2e/visibility checks match the button after the overlay closed, and rotation churns SR labels. Stable label on the control + `role="status"` on the transient overlay + `data-testid` for e2e presence checks.
