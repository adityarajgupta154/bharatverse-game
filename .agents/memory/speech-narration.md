---
name: Speech narration (read-aloud)
description: Durable decisions behind Smriti's read-aloud (Web Speech) system — voice pick, one-voice ownership, painted-glyph buttons.
---

# Read-aloud (Web Speech) decisions

- **Pregen audio layered OVER runtime TTS, never instead of it.** Discovery cards play pregenerated mp3s (one consistent storyteller voice per device-independent); live TTS stays as the no-file fallback so new content still ships text-first with zero wiring. **How:** files map by content id via eager import.meta.glob (?url) — dropping a file IS the wiring; CI soft-warns (never gates) on shipped ids missing audio. Generation settings + voice id live in replit.md.
- **Voice ownership must span ALL engines.** When both an <audio> element and speechSynthesis can talk, the one-voice registry claims a slot with an engine-specific stopEngine callback, run inside finish() only while that session still owns the slot — a superseded handle can then never silence its successor, and takeover order (old finish → old engine stopped → new engine starts) stays correct across engine types.
- **Fallback needs onUnplayable separate from onEnd**: fire it INSTEAD of onEnd only when playback never started (load error / play() rejection pre-start), so the caller swaps engines without flickering its button; mid-play failures end normally (no mid-card voice switch).
- **Romanized Hinglish needs en-IN voices first, hi-IN second, generic en last.** hi-IN engines expect Devanagari and mangle Latin-script Hindi; Indian-English voices read it naturally.
- **One didi, one voice — ownership must live in a module-level session registry, not engine events.** Multiple components own listen buttons; `speakParts` force-ends the previous session's UI state synchronously before `cancel()`, because not every engine fires `onerror` for cancelled utterances (a stuck "Roko" otherwise). Corollary: a handle's `stop()` must touch the engine ONLY while its session still owns it, or it cuts off the reading that displaced it.
- **Per-part utterances** (intro / each section / fun fact): natural storyteller pauses + avoids long-utterance cutoffs on some engines; keep utterance refs alive for the session (Chrome GCs fired-and-forgotten utterances and drops their end events).
- **Painted UI glyphs become real controls via transparent hit-area buttons positioned over the art** (hover tint + speaking pulse only) — preserves pixel fidelity to reference art while delivering the affordance the art promises. Measure glyph position from the asset, not the mock.
- **A reading must stop when its text leaves the screen**: card unmount cleanup, and a line-change effect in the HUD (stale narration contradicting new on-screen text confuses kids).
