# TTP Session Start — February 22, 2026

## Project: `to-the-power`

**Status:** Phase 1 domain + content engine in active build. Core architecture implemented, tested, and tempo-driven. Browser prototype not started yet.

---

## Current State (Implemented)

### Architecture and Runtime
- TypeScript event-sourced core implemented.
- Runtime command validation and runtime event-schema validation implemented.
- Deterministic event-log replay implemented.
- Timeline model refactored from fixed turn/week progression to **tempo-driven `timeHours` progression**.
- `TimeAdvanced` and timed challenge deadlines now run on hour-based semantics.

### Tempo and Cadence
- Tempo states supported: `recess`, `parliamentary`, `crisis`, `media_storm`.
- Cadence policy implemented with default hour jumps per tempo.
- Command layer supports `advance_time` with tempo-aware defaults and warnings on oversized jumps.
- Content selector supports **tempo-aware packet batches** (multiple packets in compressed tempos).

### Content Engine
- Typed content schema, loader, and validation implemented.
- Referential integrity checks implemented for content IDs.
- Deterministic content selection implemented from state seed.
- Vertical slice content exists and is actively expanding.

### Service Layer
- `GameService` supports:
  - command execution
  - state access
  - event log save/load
  - deterministic reconstruction from logs
  - current packet retrieval
  - current packet batch retrieval (tempo-aware)

### Verification
- Test suite passing.
- Simulation script passing with tempo-driven timeline flow.

---

## What Is In Code Now

### Domain
- core types and state model
- command layer
- reducer/event application
- latent consequence evaluation
- remediation tracking
- tempo cadence policy

### Content
- content schemas/types
- content validator
- content loader
- deterministic packet selection (single + burst/batch)
- vertical slice JSON dataset

### Application
- game service wrapper around domain/content flows
- event-log persistence and replay utilities

---

## Build Phase Position

1. **Phase 1 (In Progress):**
- Domain logic and timeline model implemented.
- Content engine implemented.
- Vertical slice content expansion and scheduler tuning in progress.

2. **Phase 2 (Next):**
- Playable browser prototype with minimal UX around packet batches, challenge submission, and time advancement.

3. **Phase 3:**
- Full UX build informed by playtesting.

4. **Phase 4:**
- Content expansion (historical studies/simulators/NPC depth/endings/leaderboard polish).

---

## Immediate Next Tickets

1. Fill crisis/media content gaps for early roles so burst packets are consistently populated.
2. Implement encounter scheduler service for packet batch sequencing + outcome application.
3. Add explicit challenge consequence mapping by mode (`decision`, `gate`, `crisis`) and tempo.
4. Add seeded scenario runner for balancing and regression output.

---

## Open Questions (Still Unresolved)

1. Constituency naming finalization.
2. Election timing mechanics at PM level (fixed vs variable call).
3. Prototype party naming approach.
4. Whether a separate difficulty modifier is needed beyond year setting.
5. Prototype persistence strategy (local-only vs migration-ready).
6. Accessibility implementation order in prototype.
7. Handling/scope/timing of sensitive historical studies.

---

## Reference Docs

- Design spec: `TO_THE_POWER_DESIGN.md`
- Build roadmap: `task.md`

---

*Session snapshot updated — February 22, 2026*
