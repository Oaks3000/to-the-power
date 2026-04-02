---
project: "To The Power"
type: "build"
lastUpdated: "2026-04-02"
---

# To The Power — Next Steps

## Immediate (This Session / Week)

1. Start [#28](https://github.com/Oaks3000/to-the-power/issues/28) Tier 2/Tier 3 shell scaling with a concrete implementation slice plan.
2. Start [#29](https://github.com/Oaks3000/to-the-power/issues/29) ending-state expansion design and deterministic test matrix.
3. Start [#30](https://github.com/Oaks3000/to-the-power/issues/30) multi-run retrospective/leaderboard DTO and comparison UX framing.
4. Reconcile baseline gate script drift on `main` (`accessibility:gate`, `prototype:regression` missing in clean main checkout).

## Short Term (Next 2–4 Weeks)

1. Deliver first playable Tier 2 shell path with preserved novice clarity affordances.
2. Ship deterministic ending-state evaluator coverage for voted out/sacked/resigned/election defeat.
3. Add multi-run retrospective comparison panels and replay-backed score trend outputs.
4. Decide migration timing from `vertical-slice.json` default to `content/index.json`.

## Questions / Unknowns

- Which concrete release gate thresholds should be used for Tier 1 shell sign-off after broader playtests?
- Whether additional domain/API surface is required before scaling from Backbencher to PPS/Junior Minister shells.
- When to switch runtime defaults from `vertical-slice.json` to `content/index.json` after parity confidence.
- Which branch introduced `accessibility:gate` and `prototype:regression` without those scripts being present on clean `main`.
