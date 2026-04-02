---
project: "To The Power"
type: "build"
createdAt: "2026-03-03"
lastUpdated: "2026-04-02"
---

# To The Power — Roadmap

A British political career simulation that teaches GCSE mathematics through consequential Westminster decision-making.

## Current Phase: Phase 4 — Content Expansion + Release Hardening

### Phase 1: Domain + Engine Foundations (complete)
- 1.0 Event-sourced architecture ✅
- 1.1 Type system and state model ✅
- 1.2 Command system and event schema validation ✅
- 1.3 Reducer + persistence/replay utilities ✅
- 1.4 Curriculum/remediation engine ✅
- 1.5 Latent consequence framework ✅
- 1.6 Timeline refactor (`timeHours`) + tempo cadence policy ✅
- 1.7 Content schema/loader/validation + deterministic packet selection ✅
- 1.8 Tempo-aware packet batch selection ✅
- 1.9 Encounter sequencing service + `GameService` integration ✅
- 1.10 Consequence mapping matrix by mode/tempo ✅
- 1.11 Scenario runner + balancing telemetry ✅
- 1.12 Cohort confidence gates + baseline workflow ✅

### Phase 2: Playable Browser Prototype (complete)
- 2.0 Thin app-facing prototype API ✅
- 2.1 Minimal browser shell scaffolding ✅ (issue [#2](https://github.com/Oaks3000/to-the-power/issues/2))
- 2.2 Packet/challenge/advance loop UI wiring ✅ (issue [#3](https://github.com/Oaks3000/to-the-power/issues/3))
- 2.3 Session persistence and resume ✅ (issue [#1](https://github.com/Oaks3000/to-the-power/issues/1))
- 2.4 CI cohort-gate baseline check command ✅ (issue [#4](https://github.com/Oaks3000/to-the-power/issues/4))

### Phase 3: Full UX Build (complete)
- 3.1 Career progression gates and failure-state evaluation ✅ (issue [#5](https://github.com/Oaks3000/to-the-power/issues/5))
- 3.2 Visual design direction + interaction model
  - Desk interaction architecture and affordance rules ✅ (issue [#7](https://github.com/Oaks3000/to-the-power/issues/7); spec: `.build/DESK_INTERACTION_ARCHITECTURE.md`)
  - Tiered desk environment and role-to-space progression ✅ (issue [#6](https://github.com/Oaks3000/to-the-power/issues/6); spec: `.build/DESK_ENVIRONMENT_PROGRESSION.md`)
- 3.3 Narrative-first shell redesign
  - Diegetic packet and challenge presentation ✅ (issue [#9](https://github.com/Oaks3000/to-the-power/issues/9); spec: `.build/PACKET_PRESENTATION_SPEC.md`)
  - Fallout surfaces: smartphone, newspapers, and publication pile ✅ (issue [#8](https://github.com/Oaks3000/to-the-power/issues/8); spec: `.build/FALLOUT_SURFACES_SPEC.md`)
  - Tempo-driven environmental state and audio pressure ✅ (issue [#10](https://github.com/Oaks3000/to-the-power/issues/10); spec: `.build/TEMPO_PRESSURE_SPEC.md`)
- 3.4 Legacy, retrospective, and leaderboard UX
  - Career ending and retrospective presentation ✅ (issue [#12](https://github.com/Oaks3000/to-the-power/issues/12); spec: `.build/RETROSPECTIVE_PRESENTATION_SPEC.md`)
- 3.5 Playtest-driven UX iteration
  - Accessibility, responsive behavior, and input fallback for diegetic UI ✅ (issue [#11](https://github.com/Oaks3000/to-the-power/issues/11); spec: `.build/ACCESSIBILITY_INPUT_FALLBACK_SPEC.md`)
- 3.6 Tier 1 polished desk shell implementation ✅ (issues [#13](https://github.com/Oaks3000/to-the-power/issues/13), [#14](https://github.com/Oaks3000/to-the-power/issues/14), [#15](https://github.com/Oaks3000/to-the-power/issues/15), [#16](https://github.com/Oaks3000/to-the-power/issues/16), [#17](https://github.com/Oaks3000/to-the-power/issues/17))
  - Concrete implementation plan: `.build/TIER1_DESK_SHELL_IMPLEMENTATION_PLAN.md`
  - Minimum operability checklist artifact: `.build/TIER1_MINIMUM_OPERABILITY_CHECKLIST.md`
  - Visual direction lock: near-photoreal (stylised-real) desk presentation is required across all 3.6 slices, with full systemization in 3.6.5.

### Phase 4: Content Expansion + Release Hardening
- 4.1 Phase 4 execution map + content strategy lock ✅ (issue [#18](https://github.com/Oaks3000/to-the-power/issues/18))
- 4.2 Content expansion: crisis/media + mid-career routes ✅ (issue [#19](https://github.com/Oaks3000/to-the-power/issues/19))
- 4.3 Release accessibility baseline + hardening gates ✅ (issue [#20](https://github.com/Oaks3000/to-the-power/issues/20))
- 4.4 Browser regression harness for desk shell ✅ (issue [#21](https://github.com/Oaks3000/to-the-power/issues/21))
- 4.5 Retrospective and leaderboard productization ✅ (issue [#22](https://github.com/Oaks3000/to-the-power/issues/22))
- 4.6 Playtest loop and release threshold framework ✅ (issue [#23](https://github.com/Oaks3000/to-the-power/issues/23))
- Execution/dependency map artifact: `.build/PHASE4_EXECUTION_MAP.md`
- Playtest framework artifact: `.build/PHASE4_PLAYTEST_LOOP_FRAMEWORK.md`
- Accessibility gates artifact: `.build/ACCESSIBILITY_RELEASE_GATES.md`
- Browser regression command: `npm run prototype:regression`
- Retrospective/leaderboard model artifact: `.build/RETROSPECTIVE_LEADERBOARD_MODEL.md`

## Out of Scope (for now)

- Real-time multiplayer.
- Non-UK political systems.
- Post-GCSE tracks.
- Native mobile apps (browser-first).
