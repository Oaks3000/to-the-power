# Retrospective + Leaderboard Model (Issue #22)

## Purpose
- Generate retrospective output directly from live run state and event log.
- Produce a stable leaderboard/legacy DTO for downstream UI polish.
- Include replay consistency checks so deterministic integrity is visible per run.

## Source of Truth
- Builder: `src/application/retrospective.ts`
- API exposure:
  - Node service API: `src/application/prototype-api.ts#getRetrospectiveReport`
  - Browser shell API: `prototype/runtime-api.js#getRetrospectiveReport`

## DTO Shape (v1)
- `schemaVersion: "retrospective-v1"`
- `summary`
  - final/peak role, final tempo, total hours, score snapshot, challenge stats
  - remediation/timed challenge counters
- `eventCounts`
  - count for each domain event type in the run log
- `legacy`
  - `score` (0-100), `band` (`fragile|developing|established|dominant`), rationale string
- `leaderboardEntry`
  - `modelVersion: "legacy-v1"`
  - run metadata + score + progression metrics
- `replay`
  - `deterministic` boolean
  - checked fields list
  - mismatch list (non-empty only on failure)

## Legacy Score Formula (legacy-v1)
- Weighted composite:
  - party loyalty 24%
  - public approval 24%
  - constituency approval 18%
  - press relationship 16%
  - challenge accuracy 18%
  - dark index penalty -20%
- Clamped to 0..100 then mapped to band:
  - `75+ dominant`
  - `60-74 established`
  - `40-59 developing`
  - `<40 fragile`

## Determinism Check
- Rebuild state from event log and compare key fields:
  - school year, role, tempo, time, key scores, queue counts, event log length
- Replay uses reducer path with latent evaluation disabled so event log remains the single source of truth for replays.
- Failures surface explicit per-field mismatch strings in DTO.

## UI Binding
- Prototype panel: `Retrospective`
  - shows run snapshot, legacy score/band, DTO stamp, replay status
  - files: `prototype/index.html`, `prototype/app.js`, `prototype/styles.css`
