# Ending State Rules (Issue #29)

## Purpose
- Define explicit ending taxonomy and deterministic precedence for retrospective/ending evaluation.

## Outcomes
- `continuing`
- `voted_out`
- `sacked`
- `resigned`
- `election_defeat`

## Trigger Conditions
- `resigned`
  - `darkIndex >= 85` AND (`pressRelationship <= 35` OR `publicApproval <= 35`)
- `sacked`
  - role is ministerial (`junior_minister|minister_of_state|cabinet|pm`) AND
  - (`partyLoyaltyScore <= 25` OR `darkIndex >= 75`)
- `election_defeat`
  - `timeHours >= 96` AND (`publicApproval + constituencyApproval <= 70`)
- `voted_out`
  - `constituencyApproval <= 20` AND `publicApproval <= 30`
- `continuing`
  - fallback when no terminal condition is met

## Precedence (high -> low)
1. `resigned`
2. `sacked`
3. `election_defeat`
4. `voted_out`
5. `continuing`

This precedence resolves overlapping failure signals deterministically.

## Integration Points
- Evaluator: `src/application/retrospective.ts` (`evaluateEndingState`)
- Retrospective output: `RetrospectiveSummary.ending`
- Prototype shell display: retrospective panel in `prototype/app.js`

## Determinism Coverage
- Tests: `src/tests/retrospective.test.ts`
  - one test per outcome
  - precedence conflict test
  - retrospective DTO inclusion test
