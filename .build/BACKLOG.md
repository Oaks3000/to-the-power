---
project: "To The Power"
type: "build"
lastUpdated: "2026-03-07"
---

# To The Power — Backlog & Ideas

## Features / Functionality

- [ ] Role advancement prerequisite gates (loyalty/competence thresholds).
- [ ] Career ending detection (voted out, sacked, resigned, election defeat, etc.).
- [ ] Legacy/scoring formula (survival time, peak role, dark index, maths performance).
- [ ] Leaderboard verification via event-log replay.
- [ ] NPC dormancy/resurgence trigger model depth.

## Prototype / UI

- [ ] Minimal browser prototype shell wired to `PrototypeApi`.
- [ ] Packet-batch interaction flow (view packet -> submit outcome -> apply consequences -> advance).
- [ ] Session save/load UX for prototype runs.
- [ ] Debug timeline and event-log view in prototype.

## Content

- [ ] Expand challenge coverage by topic/band/tempo.
- [ ] Expand crisis/media narrative chains across mid/late roles.
- [ ] Remediation content packs (worked example + practice + re-encounter).
- [ ] Historical studies implementation model.

## Engine / Quality

- [ ] Data-driven latent activation registry.
- [ ] State invariant tests (`timeHours` monotonic, score bounds, etc.).
- [ ] Golden snapshot tests for fixed-seed full scenarios.
- [ ] CI-friendly baseline gate command for regression monitoring.

## Product / Research

- [ ] Final cohort gate targets after 200+ seed sweeps.
- [ ] Long-term content storage strategy (JSON vs CMS ingest).
- [ ] Accessibility baseline for prototype and release.
- [ ] Educator dashboard scope for early release.

## Captured Thoughts

- Core architecture is stable; major leverage is now UI integration and content depth.
- Cohort gates should remain the primary balancing decision signal.
- Per-seed outliers are still valuable for targeted scenario diagnostics.
