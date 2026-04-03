# Tier Shell Scaling Notes (Slice 28A)

## Purpose
- Capture how shell complexity escalates from Tier 1 to Tier 2 without losing novice clarity.

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

## Clarity Safeguards Preserved
- Next-step text remains explicit and actionable.
- Tier 2 auto-opens detail view so added pressure surface is visible.
- Fallback statuses remain readable when audio cues are off.

## Deterministic Guard
- Added static marker regression test:
  - `src/tests/tier2-shell-hooks.test.ts`
  - Verifies Tier 2 markup IDs and core flow hook functions are present.
