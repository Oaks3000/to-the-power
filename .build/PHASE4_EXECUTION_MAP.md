---
project: "To The Power"
type: "build"
phase: "Phase 4 — Content Expansion + Release Hardening"
lastUpdated: "2026-03-12"
---

# Phase 4 Execution Map

## Decision Lock

- Content strategy lock: **A** (JSON packs + manifest index, with legacy `vertical-slice.json` compatibility retained).
- Scope lock for first content increment: **PPS + Junior Minister crisis/media** only.
- Increment size lock: **moderate** (+8 challenges, +6 event cards, +4 scenes).

## Dependency Order

1. [#18](https://github.com/Oaks3000/to-the-power/issues/18) — execution map + content strategy lock.
2. [#19](https://github.com/Oaks3000/to-the-power/issues/19) — content expansion increment v1.
3. [#23](https://github.com/Oaks3000/to-the-power/issues/23) — playtest loop and release thresholds.
4. [#20](https://github.com/Oaks3000/to-the-power/issues/20) — accessibility baseline hardening gates.
5. [#21](https://github.com/Oaks3000/to-the-power/issues/21) — browser regression harness.
6. [#22](https://github.com/Oaks3000/to-the-power/issues/22) — retrospective/leaderboard productization.

## Migration Notes (A -> future C optional)

- Keep `content/vertical-slice.json` valid during transition.
- Adopt `content/index.json` as pack manifest for new content growth.
- Add new content in `content/packs/*.json` and merge via loader.
- Move runtime defaults to manifest path only after parity and regression confidence is stable.
- Revisit richer authoring format only if non-technical authoring/CMS/localization requirements justify migration cost.

## Validation + Quality Gates for New Packs

- Schema validity: merged bundle must pass `validateContentBundle`.
- Referential integrity: all event card challenge/scene references must resolve.
- Determinism parity: equivalent legacy and manifest bundles must pick identical packet outputs for fixed states/seeds.
- Volume gate for #19 v1: PPS/Junior Minister crisis+media event card pool must increase and be measurable.
- Regression gate: full `npm test` must pass before issue closeout.

## Ownership Cadence

- Build rhythm: paired decision gates with user sign-off before strategy or scope pivots.
- Update cadence: refresh `.build/ROADMAP.md`, `.build/STATUS.md`, `.build/NEXT.md` at each issue closeout.
