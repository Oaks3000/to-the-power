# To The Power Build Task Plan

## Current Baseline (Completed)
- Domain core is event-sourced and TypeScript-first.
- Timeline is tempo-driven (`timeHours`), not fixed weekly turns.
- Command layer and runtime event schema validation are implemented.
- Content pipeline exists (schema, loader, validator, deterministic selection).
- Vertical slice dataset exists and tests pass.

## Phase 1.1: Stabilize Tempo-Driven Domain (Now)
### 1. Lock timeline and cadence semantics
- Finalize `tempo -> default advance hours` and burst policy constants.
- Define explicit guardrails for out-of-cadence jumps (warn vs block).
- Document how `TimeAdvanced` interacts with crises and timed challenge deadlines.

### 2. Tighten event and command contracts
- Ensure all command payloads are hour-based (`hours`, `timerHours`).
- Keep runtime event validation as source-of-truth for payload shape.
- Add explicit versioning note for event log compatibility.

### 3. Add deterministic replay guarantees
- Keep replay mode with no generated follow-up/latent evaluations.
- Add snapshot parity checks (live run state vs replayed state).
- Add tests for mixed tempo transitions during replay.

## Phase 1.2: Content Engine Expansion
### 4. Expand vertical slice to full Phase 1 content pack
- Increase challenge pool per band and tempo (especially crisis/media_storm).
- Add role-specific event cards for `backbencher` and `pps` during crisis/media.
- Add more scenes for primary NPCs with meaningful relationship deltas.

### 5. Build content quality tooling
- Add lint/validation rules for:
  - dead references
  - duplicate semantic prompts
  - invalid tempo-role-band combinations
- Add coverage report for content matrix:
  - by role
  - by tempo
  - by curriculum band

### 6. Add remediation and briefing content depth
- Create worked-example content entries by topic/band.
- Ensure remediation content exists for all high-frequency challenge topics.
- Add advisor voice variants (Frost/Chen/Whitmore/Oliver) by domain.

## Phase 1.3: Encounter and Scheduling Logic
### 7. Introduce encounter scheduler
- Build scheduler that selects packet batches by tempo burst policy.
- Ensure multiple packets in short windows for crisis/media_storm.
- Keep sparse cadence for recess.

### 8. Add latent consequence timing windows
- Move latent triggers to timeline windows and deadlines (`expiresAtHour`).
- Add priority resolution when multiple latent triggers fire together.
- Add auditability events for why a latent fired.

### 9. Add challenge outcome consequence hooks
- Map answer correctness + mode (`decision/gate/crisis`) to concrete state deltas.
- Implement differentiated penalties for timed failures.
- Add low-stakes recovery loops after high-pressure failures.

## Phase 1.4: Playable Simulation Harness
### 10. Build scenario runner
- Create scripted scenario definitions for regression simulations.
- Support deterministic seeds and outcome snapshots.
- Add CLI summaries for role progression, tempo shifts, remediation triggers.

### 11. Add balancing telemetry outputs
- Emit progression metrics:
  - average time to role transitions
  - remediation frequency by topic
  - crisis failure rates
- Flag outliers automatically in test runs.

## Phase 2: Browser Prototype (Minimal but Playable)
### 12. Implement thin application layer for prototype
- Expose app-facing APIs:
  - `getCurrentPacketBatch`
  - `submitChallengeOutcome`
  - `advance_time`
  - `getStateSummary`
- Keep domain package UI-agnostic.

### 13. Build minimal standalone UI flow
- Timeline panel (tempo + in-game clock).
- Current packet list (cards/challenges/scenes).
- Input and submit flow for challenge outcomes.
- Event log panel for debugging and tuning.

### 14. Add persistence for prototype sessions
- Save/load event logs via local storage or file export/import.
- Resume simulation from persisted logs.
- Show clear version mismatch handling for old logs.

## Phase 3: UX and Full Interface Pass
### 15. Replace debug-first UI with designed UX
- Narrative-first event presentation.
- Advisor overlays and remediation UX.
- Crisis/media pressure presentation with timer clarity.

### 16. Add content authoring support (optional but high leverage)
- JSON schema docs and templates.
- Content preview tooling for non-code edits.
- Batch validation command for writers.

## Phase 4: Content Expansion and Polish
### 17. Expand historical studies + simulators
- Integrate studies with mainline hint/boost links.
- Add year-tagged variants by curriculum band.
- Keep studies optional, never hard gates.

### 18. Leaderboard and career retrospective
- Implement Mathematical Acumen and Political Acumen scoring.
- Generate ending retrospectives with event-log evidence.
- Add benchmark comparisons.

### 19. Pre-release hardening
- Add full regression matrix (commands, replay, content validation, sim scenarios).
- Run balancing cycles with real player feedback.
- Freeze event schema and tag a release baseline.

## Immediate Next Build Tickets
1. Fill crisis/media content gaps for early roles so burst packets are populated.
2. Implement encounter scheduler service (packet batch + application sequencing).
3. Implement challenge consequence mapping layer by mode and tempo.
4. Add scenario runner with seeded deterministic outputs.
