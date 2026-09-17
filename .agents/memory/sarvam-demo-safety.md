---
name: Sarvam demo safety boundary
description: Safe operating boundary for BharatVerse's child-facing Sarvam guide and voice demo.
---

Keep production Sarvam access fail-closed until it has authenticated users and durable shared quotas. In preview/demo, use an exact trusted origin, conservative request/concurrency limits, and never display generative provider prose to children; Sarvam may classify intent, while the app returns reviewed facts.

**Why:** Secret presence does not prove credential validity, and a public unauthenticated paid-AI proxy creates cost and child-safety exposure. Multiple securely supplied credentials were still rejected by Sarvam, so live smoke tests must remain the source of truth.

**How to apply:** For future Sarvam work, validate real guide and TTS calls after any credential change, keep the provider output behind strict structured classification, and do not enable public production access without authentication plus durable quotas.