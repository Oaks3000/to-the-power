---
project: "To The Power"
type: "build"
lastUpdated: "2026-04-02"
---

# To The Power — Next Steps

## Immediate (This Session / Week)

1. Prepare Phase 4 completion handover packet (status, roadmap, and release-gate evidence links).
2. Define Phase 5 candidate scope and split blocking vs non-blocking backlog items.
3. Open and sequence Phase 5 implementation issues.

## Short Term (Next 2–4 Weeks)

1. Run a full Phase 4 validation sweep (`npm test`, `npm run accessibility:gate`, `npm run prototype:regression`) and archive outputs.
2. Open Phase 5 issues for Tier 2/Tier 3 shell scaling and deeper ending coverage.
3. Prioritize backlog items that affect near-term user testing clarity and retention.
4. Decide migration timing from `vertical-slice.json` default to `content/index.json`.

## Questions / Unknowns

- Which concrete release gate thresholds should be used for Tier 1 shell sign-off after broader playtests?
- Whether additional domain/API surface is required before scaling from Backbencher to PPS/Junior Minister shells.
- When to switch runtime defaults from `vertical-slice.json` to `content/index.json` after parity confidence.
