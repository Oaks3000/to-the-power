---
project: "To The Power"
type: "build"
phase: "Phase 5 — Scale + Outcomes (kickoff)"
lastUpdated: "2026-05-03"
---

# Doctrine Audit — To The Power

A root-and-branch review of the project as it currently stands, evaluated against the **Game First Principles Guide**. The audit covers the design vision (`TO_THE_POWER_DESIGN.md`), the implemented Tier 1 shell (`src/`, `prototype/`), the existing content (`content/`), the roadmap, and the build artifacts.

The deliverable is *findings + recommendations*, not new design. After review, the user accepts or rejects findings; follow-on work is opened separately.

---

## How to read this audit

Each principle, anti-pattern, and roadmap step is given one of five verdicts, with at least one piece of evidence (code path / line, design-doc section, or build artifact).

- **Proven** — direct evidence in code or content that the principle is met.
- **Partly proven** — design intent is articulated and partially implemented; significant gaps remain.
- **Unproven** — design intent exists but implementation does not yet match it; the principle is currently unsatisfied in play.
- **Disharmony with doctrine** — current direction actively conflicts with the principle.
- **Not yet applicable** — the principle applies to a system not yet implemented; cannot be evaluated.

Findings are ranked at the end by severity. Every individual finding can be disagreed with on its own evidence — disagreeing with one does not require disagreeing with the audit as a whole.

---

## 1. Project state snapshot

Phases 1–4 are closed (`.build/STATUS.md:30-39`, `.build/HANDOVER_2026-04-02_PHASE4_CLOSEOUT.md`). Phase 5 (Scale + Outcomes) is in kickoff with three open issues: #28 Tier 2/Tier 3 shell scaling, #29 extended ending coverage, #30 multi-run retrospective polish (`.build/ROADMAP.md:67-70`).

Tier 1 desk shell is shipped, with browser regression harness (`npm run prototype:regression`), accessibility gate (`npm run accessibility:gate`), and a productized retrospective + leaderboard surface (`src/application/retrospective.ts`).

Content library on `main`: 32 challenges across 19 event cards (24 + 8 from `pack-core-vertical-slice.json` + `pack-phase4-pps-jm-crisis-media.json`). Distribution by integration mode: **19 decision (59%) / 9 gate (28%) / 4 crisis (12.5%)** — see Section 8 for the empirical mode audit and what these tags mean in practice.

Issue #44 (the immediate trigger for this audit) reports that the Decision task and the Political call feel disconnected within a brief.

---

## 2. First principles assessment

### Principle 1 — Experience before systems

**Verdict: partly proven.**

The design doc opens with a clear plain-language statement of intended player experience: *"You are a newly elected MP for Hartwell North … the mathematics of politics are the instruments of power. Master them and you rise. Misread them and you fall"* (`TO_THE_POWER_DESIGN.md:26`). Design philosophy at line 18 is sharper still: *"The maths is the means; power is the goal."*

What's been built is system-rich: an event-sourced reducer (`src/domain/reducer.ts`), a tempo cadence policy (`src/domain/tempo.ts`), a remediation engine with rolling windows and transition-band threshold relaxation (`src/domain/remediation.ts`), a deterministic content selector (`src/content/selection.ts`), and a productized retrospective (`src/application/retrospective.ts`). All of these are well-implemented and well-tested.

What's underweight is the **player-facing effect** the systems are supposed to create. Sections 8 and 9 (mode audit + intrinsic integration) below show that the maths→power promise of line 18 is not yet felt in actual briefs. The systems are built; the experience they were meant to produce is not yet validated in play.

### Principle 2 — The core loop is sacred (the five-question test)

**Verdict: partly proven.**

The doctrine's five questions, applied to a current TTP brief:

1. **What does the player notice?** An EventCard title + description, with a maths challenge and a scene rendered alongside. *Implemented.*
2. **What does the player decide?** Whether to answer the maths correctly. The "scene" presents a political beat (e.g., "Priya offers canvassing volunteers if you back her amendment") but offers no decision affordance — there is no command to accept or refuse. *Partial — the maths is decided, the political beat is observed.*
3. **What does the player do?** Submit a numeric answer. `submit_challenge_answer` carries `(topic, correct: boolean, mode?)` (`src/domain/commands.ts:99-117`). *Implemented.*
4. **What changes because of that action?** Fixed reputation/competence deltas keyed by `(mode, tempo, correct)` (`src/domain/challenge-consequences.ts:26-81`); plus a topic-rolling-window update for remediation. The political beat in the scene is *not* affected by the maths outcome — its `relationshipDelta` is a fixed constant on the scene record (`src/application/encounter-service.ts:45-50`). *Partial — state changes, but the political element of the brief does not change as a function of the maths.*
5. **Why does the player want to re-enter the loop?** This is the weakest answer. There is no in-domain representation of what the player is currently pursuing — no `Ambition`, `Campaign`, `Goal`, `Thread`, or `Quest` type in `src/domain/types.ts` (verified — see Section 9 anti-pattern check). The pull is currently survival-shaped (avoid losing the career) rather than goal-shaped (advance toward something specific I named).

### Principle 3 — Learning must be intrinsic

**Verdict: unproven (most likely disharmony — see Section 8 for empirical evidence).**

The doctrine's strict test: *"if the learning challenge can be removed from the action without damaging the core play, the learning is probably extrinsic."*

Applied to the implementation surface:

- A brief is composed of an `EventCardContent` with **independent** `candidateChallengeIds` and `candidateSceneIds` arrays (`src/content/types.ts:33-43`).
- The selector picks a challenge and a scene from those arrays with **independent** deterministic seeds (`src/content/selection.ts:74-78`). The choice of challenge does not influence the choice of scene, and vice versa.
- The execution sequencer applies the challenge result and the scene result as **two unrelated commands** (`src/application/encounter-service.ts:35-50`). The scene's effect is a fixed `relationshipDelta` on its `npcId`, with no reference to whether the maths was correct.
- The challenge's effect is a fixed mode/tempo delta on reputation scores, with no reference to which scene was chosen or what the political beat was about.

The data architecture cannot currently represent "this maths answer determines this political outcome." Section 8 shows that the *content* in `vertical-slice.json` confirms this empirically — even briefs tagged `mode: "decision"` typically present a topic-themed maths drill alongside a politically-themed flavour scene with no causal link.

This is the strongest disharmony with doctrine in the audit. It is the structural cause of issue #44.

### Principle 4 — Agency requires legible consequence

**Verdict: partly proven (proven at career-end; unproven at session-end).**

Career-end: the retrospective is real and well-built. `evaluateEndingState` (`src/application/retrospective.ts:238-313`) evaluates five terminal outcomes (resigned, sacked, election_defeat, voted_out, continuing) with documented precedence (`.build/ENDING_STATE_RULES.md`). `computeLegacySummary` produces a 0–100 score and a band. `buildReplayConsistency` verifies determinism. Whitmore-style retrospective framing is implemented in the prototype shell. **Consequence is legible at career-end.**

Within-run: a player completing one brief sees small, fixed reputation deltas. There is no surfaced "this happened *because* you answered X." The latent consequence engine is implemented but narrow: only two activation conditions exist in the type system, `dark_index_critical | cabinet_loyalty_whip_risk` (`src/domain/types.ts:55`, `src/domain/latent.ts:10-21`). Compare to the design doc's promise of arbitrary `activationCondition` strings driving "moderate chaotic compounding" (`TO_THE_POWER_DESIGN.md:108-126`). Mid-run consequence is not yet visible to the player as causality.

### Principle 5 — Narrative is a pressure and meaning system

**Verdict: partly proven.**

Role: clear (MP at Hartwell North; career graph in design doc sec. 3; `CareerLevel` type in code).
Stakes: clear at career-level (nine designed endings in the doc; five implemented, all terminal).
Tempo: proven — four named tempos with differentiated cadences (`src/domain/tempo.ts:10-35`); time advance and event burst counts vary materially between recess (21 days, 1 event) and crisis (6 hours, 3 events).
Reversal: weakly implemented. The latent consequence engine *could* generate reversals but is plumbing-only with two conditions wired (see Principle 4).
Aftermath: implemented at career-end (retrospective + ending evaluation).
Memory: weakly implemented. The event log is the substrate (good); NPC dormancy/resurgence is described in the design doc (`TO_THE_POWER_DESIGN.md:459-465`) but not implemented — there is no `NPCTransitionedToDormant` reducer case despite the type's existence (`src/domain/types.ts:65-77`). Backlog item "NPC dormancy/resurgence trigger model depth" (`.build/BACKLOG.md:12`) confirms this.

### Principle 6 — Difficulty should stretch, not expose

**Verdict: proven (in design and in code).**

The remediation system is a strong implementation of this principle. `src/domain/remediation.ts:43-86` tracks per-topic rolling windows of ten attempts and triggers remediation at three errors. Transition bands (Y9-10, Y10-11) use a **lower** threshold of two errors initially — explicitly to avoid cliff edges when new material first appears (`TO_THE_POWER_DESIGN.md:178-180`). Hint progression is designed across three levels with NPC voicing (`TO_THE_POWER_DESIGN.md:376-385`). This matches the doctrine's "preserve dignity, recover into stronger play" criterion well.

### Principle 7 — UX is part of the mechanic

**Verdict: partly proven.**

The Tier 1 shell answers the doctrine's three UX questions explicitly. `prototype/index.html` includes a persistent `#next-step` element ("Open a task from In-Tray, enter a number, then press Check answer"), an `#interrupt` region with `aria-live="assertive"` for crisis takeovers, and skip-links to the tray, packet, phone, and collision queue. Accessibility gates (`npm run accessibility:gate`) and a regression harness (`npm run prototype:regression`) are mainline.

Caveats:

- Baseline drift: clean `main` does not include the `accessibility:gate` and `prototype:regression` scripts (`.build/STATUS.md:72-75`, `.build/NEXT.md:14`). The gates exist on shipped branches but not on main package scripts. This is a tooling-discipline issue rather than a doctrine issue, but it weakens the claim that UX validation is mainline.
- Tier 2/Tier 3 shell additions are specified (`.build/TIER_SHELL_SCALING_NOTES.md`) but not yet implemented (#28). Doctrine alignment for those tiers cannot yet be assessed.

### Principle 8 — Depth beats breadth early

**Verdict: proven directionally.**

The project has explicitly held breadth: Tier 1 is the only polished route, Tier 2/3 are paused, content is one vertical-slice pack plus one Phase 4 increment (8 challenges added, not a content explosion). `.build/BACKLOG.md:50` records this as intentional: *"Tier 1 shell should be treated as the UX quality bar for all future role tiers."*

The risk this principle flags is the *intent to scale next* — Phase 5 issues #28/#29 plan to expand to Tier 2/3 shells and additional ending states, which is breadth before the Tier 1 loop's intrinsic-integration disharmony (Principle 3) is resolved. See Section 10 for the roadmap-ordering check.

---

## 3. Narrative principles assessment

| Principle | Verdict | Evidence |
|---|---|---|
| Role before plot | **Proven** | "Newly elected MP for Hartwell North" is set up immediately; no extended worldbuilding precedes role definition (`TO_THE_POWER_DESIGN.md:26`). |
| Stakes before lore | **Proven in design, partly proven in play** | Nine career endings catalogued (sec. 11). In current play, only five terminal endings are evaluable; mid-run stakes are not surfaced as named threats (no representation of "this scandal could surface" before it does). |
| Characters as functions in pressure | **Proven in design, unproven in implementation** | 14 primary NPCs each given an archetype + maths domain + dark mechanic (sec. 10.1). In code: `npcRelationships: Record<string, NPCState>` with relationship score and lifecycle. The lifecycle states (`active|dormant|resurgent`) are typed but no transition is implemented in the reducer; NPCs do not currently *function* as pressure sources because they don't move through their lifecycle. |
| Memory matters | **Partly proven** | The event log is the substrate; reputation scores are derived; retrospective replays the log. But: latent consequences are stubbed (two conditions); NPC dormancy/resurgence is unimplemented; "tailored endings" exist as five terminal evaluations but are not narratively differentiated by what the player did, only by which thresholds tripped. |
| Endings should judge a way of playing | **Partly proven** | `evaluateEndingState` produces an outcome + reasons array. Legacy score is a composite (`.build/RETROSPECTIVE_LEADERBOARD_MODEL.md`). What's missing: the retrospective collapses two designed axes (Mathematical Acumen + Political Acumen — `TO_THE_POWER_DESIGN.md:610-615`) into a single legacy score. The design doc explicitly wants the player to see they were a Gladstone (high politics) vs. a Brown (high maths) profile; the implementation reports one number. |

---

## 4. Flow and pacing principles assessment

| Principle | Verdict | Evidence |
|---|---|---|
| Use named tempo states | **Proven** | Four tempos defined and differentiated (`src/domain/tempo.ts:10-35`); cadence policy varies materially (recess 21 days/1 event default, crisis 6h/3 events default, media_storm 3h/2 events default). |
| Alternate control and pressure | **Partly proven** | Tempo states differ in event burst and time advance, which structurally alternates pressure. Whether a player *experiences* this as alternation depends on transition triggering. Tempo transitions today appear to be explicit `change_tempo` commands (`src/domain/commands.ts:79-84`) — there is no observed *automatic* trigger from latent state into Crisis or Media Storm tempo. The "lurch" the design doc describes (`TO_THE_POWER_DESIGN.md:451`) is not visible in code. |
| Escalation should come from commitments | **Unproven** | The doctrine says the strongest pressure emerges from earlier choices. The latent consequence engine is the mechanism the design doc proposes for this. With only two activation conditions wired and no observed automatic tempo shifts, escalation is not currently emerging from earlier commitments — it's authored into the tempo of whatever scene the selector picks. |
| Recovery is part of pacing | **Proven directionally** | Recess tempo is implemented with the longest cadence and lowest event burst — this is structurally a recovery space. Remediation is framed as advisor preparation, not penalty (`TO_THE_POWER_DESIGN.md:362`). |

---

## 5. Gameplay principles assessment

| Principle | Verdict | Evidence |
|---|---|---|
| Build around a small set of verbs | **Partly proven** | The player verbs in code are essentially: *answer a maths question* and *let time advance*. `submit_challenge_answer` and `advance_time` are the two main commands the prototype-api exposes (`src/application/prototype-api.ts:168-189`). This is *very* small — possibly too small. The design doc names richer verbs (vote, alliance-form, leak, present-selectively) that have **no command surface today**. The doctrine asks for a small set of *deep* verbs — what's there is small but not yet deep, because the maths answer is only loosely coupled to outcomes. |
| Failure should branch, not brick-wall | **Proven directionally** | Wrong answers in decision/gate/crisis modes apply negative deltas but don't terminate the brief; the next brief still happens. Remediation triggers when the rolling window's wrong-count crosses the threshold. Timed challenge expiry triggers approval/press penalties but doesn't end the run. The design intent (`TO_THE_POWER_DESIGN.md:303-306`: "no hard block — wrong answer produces a worse outcome") is honoured. |
| Trade-offs are better than obvious answers | **Unproven** | A maths question has a single correct answer. There is no current brief structure in which the player chooses *which* maths to do, *whether* to do it, or *how to weight competing political pressures*. The grey zone mechanics (sec. 8) describe trade-offs at the design level but no grey-zone command exists in the code. |
| Repetition needs variation in context | **Partly proven** | The selector seeds on `${time}|${role}|${tempo}|${band}|${slot}` which produces variation across time and tempo. But within a given time/role/tempo/band the selection is deterministic — a player who replays the same week sees the same brief. Variation comes from state evolution, not from designed reframing. |

---

## 6. UX principles assessment

| Principle | Verdict | Evidence |
|---|---|---|
| Hierarchical legibility | **Proven** | Tier 1 shell uses an explicit "what to do now" surface as the top-of-fold attention anchor; detail panels are gated behind a `Show extra panels` toggle (`prototype/index.html:30-33`). |
| Reveal state change immediately | **Partly proven** | After `submit_challenge_answer`, the prototype-api returns a fresh `PrototypeStateSummary` (`src/application/prototype-api.ts:117-132`). What's reflected: scores, time, queue lengths, event log size. What's not visibly reflected back to the player: *which* state moved because of *which* outcome — the change is shown as a snapshot, not as a causal narrative. |
| Match visual prominence to importance | **Proven directionally** | `Show extra panels` pattern is correct; interrupt region with `aria-live="assertive"` is correct for urgent state. |
| Navigation mirrors mental model | **Proven** | Tray / packet / phone / collision queue maps to the diegetic desk fiction; named anchors mirror player's mental model of "where am I working from" (`prototype/index.html:11-14`). |
| Assistance preserves fiction | **Proven in design** | Remediation is framed as Frost briefing the player, not as a help screen. Hint levels are voiced by Frost / Chen / Whitmore (`TO_THE_POWER_DESIGN.md:376-385`). Implementation of voiced advisors in the shell is not directly verified in this audit — flagged as not-yet-applicable in detail. |
| Mobile and accessibility are structural | **Proven** | Accessibility release gates are formalised (`.build/ACCESSIBILITY_RELEASE_GATES.md`); `npm run accessibility:gate` is an executable check. Skip links, ARIA roles, and reduced-motion handling are present in the shell. (Caveat: the gate scripts have drifted from clean `main`.) |

---

## 8. Empirical Mode 1/2/3 audit of Tier 1 content

This is the central empirical exercise the user asked for. It applies the doctrine's intrinsic-integration test to actual brief content rather than relying on tags.

### Distribution by tagged mode

Across all loaded content (`content/vertical-slice.json` + `content/packs/pack-phase4-pps-jm-crisis-media.json`):

| Mode | Count | % |
|---|---|---|
| `decision` (Mode 1 — maths IS the decision) | 19 | 59% |
| `gate` (Mode 2 — maths gates the decision) | 9 | 28% |
| `crisis` (Mode 3 — maths under time pressure) | 4 | 13% |

By the design doc's own statement (sec. 6.1), Decision Maths "should be the most common mode." The tag distribution honours this.

### What the tags actually mean in play

A spot-check of four briefs in `content/vertical-slice.json` against the doctrine's strict intrinsic-integration test:

**`ev_constituency_polling_01` — "Marginal Seat Nerves"** (decision mode)
- Description: "Constituency swing model needed before weekend campaign push."
- Challenge: *"Local polling rose from 42% to 48%. What is the percentage point increase?"*
- Scene: *"Priya offers canvassing volunteers if you back her amendment."*
- **Test**: Could the maths be removed without damaging the political beat? *Yes* — Priya's offer is unrelated to the polling number. The maths is a percentage-points drill placed beside a politically-themed flavour scene. **Extrinsic.**

**`ev_local_service_brief_01` — "Local Service Backlog"** (decision mode)
- Challenge: *"Median waiting times are 10, 14, 12, 16, 8 weeks. What is the median?"*
- Scene: *"Priya offers canvassing volunteers if you back her amendment."*
- **Test**: The maths is "find the median of 5 numbers." The scene is Priya's offer. The two have no semantic link. **Extrinsic.**

**`ev_committee_screening_01` — "Committee Screening"** (gate mode)
- Description: "Whip's office requests arithmetic checks before shortlist confirmation."
- Challenges: linear equation `y = 2x + 30 for x = 8`, ratio `5:3 → 25 then ?`, probability `1/4 as decimal`.
- Scene: Fosse with whip sheet.
- **Test**: This is gate-mode by tag and gate-mode in feel — the maths is the qualifying check for the committee seat. The narrative ("Whip's office requests arithmetic checks") matches the maths action. **Honest gate maths**, doctrine-aligned for what gate maths is (an entrance test, not intrinsic integration).

**`ev_treasury_shadow_task_01` — "Treasury Shadow Task"** (decision mode)
- Description: "Frost asks for a quick debt-growth estimate before PM sees it."
- Challenge: *"£1,000 grows by 5% for 2 years. Use A=P(1+r)^n."*
- Scene: *"Frost circles one equation and says, 'Start with the multiplier.'"*
- **Test**: This is the closest sample to intrinsic integration. The maths topic (compound growth) and the political setting (debt-growth estimate for PM) are about the same thing. The scene is even a contextual hint from Frost referencing the equation. **However**: the calculation is on £1,000, not "the national debt"; and the player's answer produces no political consequence beyond the standard `(decision, parliamentary, correct)` deltas. **Thematically aligned but not causally bound.**

### Diagnosis

The tag `mode: "decision"` is being used to describe *briefs whose narrative framing is a decision context*, not briefs in which the maths *is* the decision in the doctrine's sense. The strongest decision-mode brief in the sample is thematically aligned but not causally bound: a correct answer of £1,102.50 does not differ in political consequence from a correct answer that landed on a different value within tolerance. The only bit of the answer that affects the world is the boolean correctness flag.

The structural cause is in the data model:

1. `submit_challenge_answer` carries `(topic, correct: boolean, mode?)` only (`src/domain/commands.ts:99-117`). There is no field for "this is the political payload your answer determines."
2. `getChallengeConsequenceDeltas(mode, tempo, correct)` produces fixed deltas keyed by mode and tempo (`src/domain/challenge-consequences.ts:83-90`). The deltas are not parameterised by content specifics.
3. Scenes are independent of challenges in both selection and execution (`src/content/selection.ts:74-78`; `src/application/encounter-service.ts:35-50`).

### Verdict

**Disharmony with Principle 3.** The content is correctly tagged as predominantly decision-mode by intent, and the implementation is faithful to that *as a tagging exercise*, but the implementation cannot represent *what the design doc means by Decision Maths in section 6.1*: "the quality of mathematical reasoning determines quality of outcome." That requires an outcome surface that varies with the *value*, not just the *correctness*, of the answer — and a brief schema that binds the maths value to a political consequence within the same brief. Neither exists today.

This is the structural cause of issue #44.

---

## 9. Anti-pattern check

| Anti-pattern | Verdict | Evidence |
|---|---|---|
| Systems-first development | **Partial yes** | The implemented systems (event-sourcing, reducer, tempo cadence, remediation engine, retrospective, replay consistency) are sophisticated and well-tested. The player-facing experience the systems are supposed to produce (Principle 1 + Section 8) is less developed. The project has been disciplined in *not* over-scaling content — but the opposite trap, building elegant systems whose player-facing payoff is undertested, is partially present. |
| Extrinsic learning wrappers | **Yes (the central finding)** | See Section 8. Briefs are tagged `mode: "decision"` but the maths is, in practice, a topic-aligned drill placed beside a politically-themed flavour scene. The educational layer is wrapped in game fiction rather than embedded in the meaningful action. This is the doctrine's most strongly-named anti-pattern, and the strongest disharmony in the audit. |
| Opaque consequence | **Partial yes (mid-run)** | Career-end consequence is legible (retrospective + replay-consistency check). Mid-run consequence is not surfaced as causality — the state moves but the player isn't told *what moved because of what*. With the latent consequence engine stubbed (`src/domain/types.ts:55`), the design doc's "moderate chaotic compounding" is not yet mid-run-visible. |
| Breadth before depth | **Risk, not yet realised** | The project has held breadth so far (Tier 1 only, single content pack + one increment). Phase 5 issues #28 (Tier 2/3 shell scaling) and #29 (extended ending coverage) plan to *start* breadth-before-depth before the Section 8 disharmony is resolved. This is the scheduling risk to flag. |
| UI as an afterthought | **No** | Accessibility, regression harness, diegetic shell were treated as first-class through Phase 3 and 4. Doctrine-aligned. |

---

## 10. Roadmap-ordering check

The doctrine's six-step roadmap order vs. current state:

| Step | Doctrine question | Current verdict |
|---|---|---|
| 1 | Player promise in a short loop | **Partly proven** — loop runs end-to-end; promise of "the maths is the means; power is the goal" not yet felt. |
| 2 | Consequence readability | **Partly proven** — strong at career-end (retrospective/replay), weak mid-run. |
| 3 | Intrinsic learning integration | **Disharmony** (Section 8). The single largest unproven step. |
| 4 | Pacing across ≥2 tempo states | **Partly proven** — four tempos differentiated in code; automatic transitions/lurches not yet visibly emerging from state. |
| 5 | UI supports loop without friction | **Proven for Tier 1** (with caveat about gate-script drift on `main`). |
| 6 | Content scaling | Correctly deferred for Tier 1; Phase 5 plans to *begin* it via #28/#29. |

The order matters. The project has skipped ahead on step 5 (UI for Tier 1) and step 6 (paused but planned) while step 3 remains in disharmony. The doctrine's strongest argument: step 5 polish and step 6 scaling do not strengthen the loop if step 3 is unresolved — they decorate and multiply something that doesn't yet do what the design promises.

**Phase 5 issues #28 (Tier 2/3 shell scaling) and #29 (ending coverage expansion) are step-6 work.** Resuming them before step 3 is addressed would, by the doctrine, build broader scaffolding around an unproven core.

---

## 11. Design-choice filter applied to in-flight and queued work

The doctrine's five filter questions, applied to currently planned work:

### Issue #44 — Tier 1 narrative arc contract (original framing)

| Filter | Verdict |
|---|---|
| Deepens core loop? | Partial — tightens brief seams. |
| Strengthens intrinsic integration? | Indirect at best. The original framing (5 arcs across distinct tempo × call-shape pairings) is a content/authoring exercise, not a coupling-architecture exercise. |
| Improves consequence legibility? | Yes if the contract specifies that each arc's beats refer to the same political situation. |
| Stories via recombination? | Partial. |
| Players need or design feels incomplete? | Players need (the symptom is real). |

**Doctrine reading**: doctrine-conditional. As originally scoped, the contract addresses the symptom but not the root cause. The work has more value if reshaped to make intrinsic integration the explicit pass criterion (see Recommendation #1).

### Issue #28 — Tier 2 + Tier 3 shell scaling

| Filter | Verdict |
|---|---|
| Deepens core loop? | No — extends the loop's surface area to new role tiers. |
| Strengthens intrinsic integration? | No. |
| Improves consequence legibility? | Tangentially. |
| Stories via recombination? | No — adds shell scaffolding, not new combinatorial space. |
| Players need or design feels incomplete? | Design feels incomplete (Tier 2/3 promised). |

**Doctrine reading**: doctrine-fail at current sequencing. This is roadmap-step-6 work and the doctrine says to defer it until step 3 is proven. Recommendation: pause until intrinsic integration is addressed.

### Issue #29 — Extended ending-state coverage

| Filter | Verdict |
|---|---|
| Deepens core loop? | Indirectly — more endings means more legibility about how a way of playing was judged. |
| Strengthens intrinsic integration? | No. |
| Improves consequence legibility? | Yes (this is consequence at career-end). |
| Stories via recombination? | Partial — if endings are derived from event-log patterns, yes. |
| Players need or design feels incomplete? | Design feels incomplete (9 endings designed, 5 implemented). |

**Doctrine reading**: doctrine-conditional. The work is principled (Principle 5: "endings should judge a way of playing"), but adding more terminal endings before the *play* judges intrinsically is sequencing the dessert before the meal. Recommendation: keep #29 as the *next-after-step-3* item.

### Issue #30 — Multi-run retrospective polish

| Filter | Verdict |
|---|---|
| Deepens core loop? | No. |
| Strengthens intrinsic integration? | No. |
| Improves consequence legibility? | Yes — across runs. |
| Stories via recombination? | No. |
| Players need or design feels incomplete? | Backlog item. |

**Doctrine reading**: doctrine-conditional, low priority. UX polish on a surface that already exists. Defer until step 3 is addressed; at that point #30 is a small item.

### Backlog items worth noting

- **"Data-driven latent activation registry"** (`.build/BACKLOG.md:31`): doctrine-pass. Directly addresses the latent consequence stub (Principle 4 partial verdict) and would make mid-run consequence legible. Currently buried in the backlog; promote.
- **"NPC dormancy/resurgence trigger model depth"** (`.build/BACKLOG.md:12`): doctrine-pass for Principle 5 (memory matters) and Principle 4 (legible consequence). Promote.

---

## 12. Findings, ranked

### Critical disharmonies (block other work)

1. **Intrinsic integration is structurally unrepresentable.** The brief schema (`EventCardContent`), the command surface (`submit_challenge_answer`), and the consequence engine (`getChallengeConsequenceDeltas`) cannot bind a maths *value* to a political *outcome* within the same brief. The strongest doctrine principle (Principle 3) is in disharmony with the implementation. This is the structural cause of issue #44 and the dominant finding of the audit.
2. **Latent consequence engine is a stub.** Two activation conditions exist (`dark_index_critical | cabinet_loyalty_whip_risk`). The design doc's "moderate chaotic compounding" — the engine the doc explicitly nominates as the source of mid-run pressure (Principles 4 + 5 + flow principle 3) — is not implemented. This blocks doctrine-aligned answers to "why does the player want to re-enter the loop" (Principle 2 question 5).

### Significant disharmonies (should reshape upcoming work)

3. **Phase 5 sequencing inverts the doctrine's roadmap order.** #28 and #29 are step-6 work; step 3 remains in disharmony. Resuming Phase 5 as currently scoped would build scaffolding around an unproven loop.
4. **Two designed leaderboard axes collapsed into one.** `RetrospectiveSummary` reports a single `legacyScore`; design doc sec. 12 promises Mathematical Acumen + Political Acumen as separate axes. This weakens Principle 5's "endings should judge a way of playing" — the player can't see the *shape* of how they played.
5. **NPCs do not move through their lifecycle.** `NPCLifecycle` is typed but no reducer transitions it. NPCs do not currently function as the design's "characters as functions in the pressure system" (narrative principle).
6. **Tempo transitions are explicit-command only.** The design doc's "lurch" from Parliamentary into Crisis is not emerging from state. With latent consequences stubbed and tempo changes manual, escalation does not currently come from commitments (flow principle 3).

### Minor / cosmetic

7. **Gate-script drift on `main`.** `accessibility:gate` and `prototype:regression` are not in clean main's package scripts. Tooling-discipline issue, not a doctrine issue, but it weakens the claim that UX validation is mainline.
8. **Selector is goal-blind.** Confirms there is no domain representation of player intent. This is a *symptom* of finding 1 + 2; addressing those will determine the right shape for goal/ambition representation.

### Confirmed harmony (worth protecting from drift)

- **Remediation system** is doctrine-aligned for "difficulty should stretch, not expose."
- **Tier 1 UX** is doctrine-aligned for hierarchical legibility, navigation mirroring mental model, accessibility as structural.
- **Tempo definition** (named tempos, differentiated cadences) is doctrine-aligned for flow principles.
- **Career-end consequence surface** (retrospective + ending evaluator + replay consistency) is doctrine-aligned for legible consequence at run-end.
- **Discipline of holding breadth back** (Tier 1 only, paused Phase 5 issues) has been doctrine-aligned through Phase 4.

---

## 13. Recommendations

The findings above suggest a small number of high-value moves. Each is a recommendation the user can accept or reject independently.

### Recommendation 1 — Address Finding 1 (intrinsic integration) before any Phase 5 work resumes

The doctrine reading is unambiguous: step 3 in disharmony makes step 5/6 work scaffolding-around-emptiness. Concrete shape this could take (the user owns the choice between these):

- **A. Schema-first.** Extend `EventCardContent` and the command surface to express "this maths value determines this political consequence within this brief." This would allow the existing Decision Maths content to be re-authored with real value-to-outcome binding. New types likely needed: a `politicalPayload` on the challenge or the event card, a way for `getChallengeConsequenceDeltas` to consult brief specifics.
- **B. Content-first proof.** Hand-author 3–5 pilot briefs that demonstrate intrinsic integration *within the existing schema's constraints* — using the scene text and challenge prompt to make the value-to-outcome link narratively, even if the engine still applies generic deltas. Cheaper. Tests whether the experience is achievable before committing to schema work.
- **C. Hybrid.** Author 2–3 pilot briefs to nail the player-facing target (B), then design the schema extension to support that target (A).

**The audit recommends C.** Cheapest honest order: prove the experience is achievable, then build the engine to support it.

### Recommendation 2 — Reshape #44 around the doctrine

Issue #44's original framing (5 narrative arcs across tempo × call-shape pairings) was content-authoring work; the audit's diagnosis says the bottleneck is one layer earlier. **Narrow #44 to "intrinsic-integration validation": author the pilot briefs from Recommendation 1 and define a falsifiable test the existing Tier 1 content can be measured against.** The "5 arcs" exercise is downstream of this; it can run after the integration model is proven.

### Recommendation 3 — Pause Phase 5 issues #28 and #30; keep #29 in queue

- **#28 (Tier 2/3 shell scaling)**: pause. Step-6 work; resume after Recommendation 1 lands.
- **#30 (multi-run retrospective polish)**: pause. UX polish on a surface that already exists; trivial to resume later.
- **#29 (extended ending coverage)**: keep as next-after-Recommendation-1. It is the natural follow-on once intrinsic integration is real — endings can then meaningfully judge a *way of playing*.

### Recommendation 4 — Promote two backlog items into the active queue after Recommendation 1

- **Data-driven latent activation registry** (`.build/BACKLOG.md:31`). Resolves Finding 2. Until this exists, mid-run consequence cannot be legible (Principle 4) and pressure cannot emerge from earlier commitments (flow principle 3).
- **NPC dormancy/resurgence trigger model depth** (`.build/BACKLOG.md:12`). Resolves Finding 5. Until this exists, NPCs do not function as pressure sources (narrative principle 3).

These two are the right *step-3-and-step-4 follow-ons* that make the loop's intrinsic integration land mid-run as well as in-brief.

### Recommendation 5 — Make the audit a recurring rubric

Per the doctrine's "How to use this document" guidance, this audit should not be a one-time exercise. The recommended habit is to test any proposed feature against the doctrine's design-choice filters before it becomes committed work. Concrete: add a one-line check to `.build/ISSUE_WORKFLOW.md` requiring new issues to record their doctrine-filter verdict in the issue body.

---

## What this audit does not do

- It does not draft Recommendation 1's schema or content. That is the next planning artifact, opened only after the user accepts (or rejects) the recommendations above.
- It does not open new issues or close existing ones. Issue #44's reshaping (Recommendation 2) and the pausing of #28/#30 (Recommendation 3) are recorded here as recommendations; the user owns whether to act on them.
- It does not update `.build/ROADMAP.md`, `.build/STATUS.md`, `.build/NEXT.md`, or `.build/BACKLOG.md`. Those updates land downstream of an accepted recommendation set.
- It does not assess Phase 4 playtest evidence in detail. `.build/PHASE4_PLAYTEST_LOOP_FRAMEWORK.md` is referenced but the audit's empirical core (Section 8) is content-architectural, not playtest-driven. If the user has playtest signal that contradicts Section 8, the audit's central finding is rebuttable on that evidence.

---

## Decisions surfaced for the user

1. Accept or reject the central finding: *intrinsic integration is structurally unrepresentable in the current brief schema and is the root cause of #44*.
2. If accepted: choose A / B / C for Recommendation 1.
3. Confirm or reject the pausing of Phase 5 issues #28 and #30.
4. Confirm whether Recommendation 4 (promoting latent registry + NPC lifecycle) is the right next-after-step-3 sequencing.
5. Confirm whether the audit should become a recurring rubric (Recommendation 5).
