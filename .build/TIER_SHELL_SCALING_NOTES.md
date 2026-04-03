# Tier Shell Scaling Notes (Slices 28A + 28B)

## Purpose
- Capture how shell complexity escalates from Tier 1 to Tier 2 and Tier 3 without losing novice clarity.

## Tier 1 Baseline
- Single primary task loop centered on In-Tray and Active Packet.
- Explicit next-step guidance and low-ambiguity action controls.
- Optional detail panels behind "Show extra panels".

## Tier 2 Additions (28A)
- New pressure surface: **Whip Board**.
  - Aggregates top-priority directives from current collision pressure and state risk.
- New prioritization mechanic: **Resolve top priority** button.
  - Routes player focus to the most urgent surface or task target.
- Shell tier selector in Diary:
  - `Tier 1 (clear basics)`
  - `Tier 2 (extra pressure)`

## Tier 3 Additions (28B)
- New pressure surface: **Cabinet Grid**.
  - Stacks higher-level directives across operations, media, political, and risk lanes.
- New prioritization mechanic: **Run crisis triage** button.
  - Routes focus through top whip/cabinet directives to enforce a controlled triage path.
- Shell tier selector extension:
  - `Tier 3 (stacked pressure)`

## Clarity Safeguards Preserved
- Next-step text remains explicit and actionable.
- Tier 2/Tier 3 auto-open detail view so added pressure surfaces are visible.
- Fallback statuses remain readable when audio cues are off.
- Tier 3 keeps Tier 2 control (`Resolve top priority`) rather than replacing it.

## Deterministic Guard
- Added static marker regression test:
  - `src/tests/tier2-shell-hooks.test.ts`
  - Verifies Tier 2 + Tier 3 markup IDs and core flow hook functions are present.
