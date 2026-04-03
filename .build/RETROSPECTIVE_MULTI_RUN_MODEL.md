# Retrospective Multi-Run Model (Issue #30)

## Goal
- Support side-by-side comparison of saved retrospective runs with deterministic trend metrics.

## Comparison DTO
- Builder: `buildRetrospectiveComparison(...)` in `src/application/retrospective.ts`
- Output schema: `retrospective-compare-v1`
- Fields:
  - `baselineRunId`, `candidateRunId`
  - `runCount`
  - `trends`
    - `legacyScoreDelta`
    - `challengeAccuracyDelta`
    - `darkIndexDelta`
    - `totalHoursDelta`
  - `replay`
    - `allDeterministic`
    - `nonDeterministicRunIds`

## Storage Strategy
- Client storage key: `ttp.retrospectiveRuns.v1`
- Storage medium: browser `localStorage`
- Record shape:
  - `savedAtIso`
  - `report` (`RetrospectiveReport`)
- Retention cap:
  - keep latest 12 records (`MAX_SAVED_RETROSPECTIVE_RUNS`)
- Safety:
  - invalid/malformed stored entries are ignored on load
  - persistence failures fall back to in-memory run list

## UX Path
- Controls in Retrospective panel:
  - `Save this run`
  - `Compare latest two`
  - `Clear saved runs`
- Comparison render:
  - trend summary card
  - baseline and candidate run cards side-by-side
  - replay determinism status for compared runs

## Regression Coverage
- Domain/model tests:
  - `src/tests/retrospective.test.ts` (comparison deltas + non-deterministic replay detection)
- Shell rendering hooks:
  - `src/tests/retrospective-multirun-hooks.test.ts`
