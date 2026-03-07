# Phase 1 Balancing Baseline

## Snapshot
- Date locked: March 7, 2026
- Scenario: `phase1_balancing_v1`
- Sweep size: `100` seeds (`1..100`)

## Cohort Targets
- `maxRemediationsPerRun = 3` (per-seed diagnostic threshold)
- `maxAverageRemediationsPerRun = 2`
- `maxCrisisFailureRate = 0.35` (35%)
- `maxCrisisFailureRateUpperBoundMargin = 0.05` (CI upper bound must stay <= 40%)
- `maxJuniorMinisterTransitionHour = 120`

## Current Tuned Difficulty Knobs
In [scenarios.ts](/Users/oakleywalters/Projects/to-the-power/src/application/scenarios.ts):
- Base challenge success rate: `0.75`
- `gate` penalty: `-0.05`
- `crisis` mode penalty: `-0.10`
- `crisis` tempo penalty: `-0.06`
- `media_storm` tempo penalty: `-0.08`
- `recess` bonus: `+0.05`

## Repro Commands
```bash
npm run balance:baseline
```

Alternative full sweep:
```bash
npm run scenario -- --seeds=1,2,3,4,5,6,7,8,9,10 --max-crisis-failure-rate=0.35 --max-remediations=3 --max-avg-remediations=2 --max-junior-hour=120 --crisis-ci-margin=0.05
```

## Baseline Result (Current)
- Overall crisis failure rate: `0.33` (33%)
- Average remediations/run: `1.37`
- Average role transition hours:
  - `pps: 84`
  - `junior_minister: 90`
- Crisis failure rate CI95: `30.5% - 35.6%`
- Remediations/run CI95: `1.14 - 1.60`
- Junior transition hour CI95: `90.0 - 90.0`
- Cohort gates: `PASS`
- Outlier count (diagnostic): `23 / 100`

## Interpretation
- Cohort-level release gates now drive balancing decisions.
- Per-seed outliers remain useful for targeted debugging but are no longer the sole go/no-go signal.
- Current baseline is in-band and stable enough to proceed.
