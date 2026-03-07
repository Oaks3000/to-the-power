# TO THE POWER: It's a Numbers Game
## Game Design Document — Version 1.2 — February 2026

---

## Quick Reference

| Field | Detail |
|---|---|
| **Game Title** | To The Power: It's a Numbers Game |
| **Target Player** | Teenage student, Year 9–11, GCSE mathematics preparation |
| **Platform** | Browser-based (TypeScript domain core + standalone HTML prototype in Phase 2; React UI planned for Phase 3), mobile-compatible |
| **Genre** | Longitudinal political career simulation with educational mathematics |
| **Session Length** | 20–45 minutes (designed for repeat sessions over weeks/months) |
| **Replayability** | High — career always ends, leaderboard drives repeat attempts |
| **Core Hook** | Rise from backbench MP to Prime Minister through mathematical competence and political cunning |

> **Design philosophy:** The player should never feel they are doing homework. Every mathematical challenge is embedded in a consequential political decision with narrative stakes. The maths is the means; power is the goal.

---

## 1. Game Vision & Core Loop

### 1.1 The Central Premise

You are a newly elected Member of Parliament for Hartwell North — a marginal constituency that could swing either way at the next election. You have ambitions. Westminster is a machine that rewards competence, cunning, and survival instinct in roughly equal measure. The mathematics of politics — budgets, polling margins, economic indicators, policy costs — are the instruments of power. Master them and you rise. Misread them and you fall.

The game ends when your career ends: voted out at a general election, fired by the Chief Whip, forced to resign in scandal, or arrested. Each ending is a designed narrative conclusion with a retrospective on your legacy. The question is never whether you fall — it is how far you rose before you did, and whether your next career surpasses it.

### 1.2 Core Loop

> **Assess the week's events → Face mathematical decisions with political consequences → Relationships shift → State changes compound → Career advances or ends**

A typical session moves through three registers:

- **Deliberate choice** — selecting which policies to pursue, which committees to join, which alliances to build. Low time pressure, high stakes.
- **Mathematical gates** — appointment shortlists, select committee appearances, budget sign-offs. Must demonstrate competence to proceed.
- **Crisis response** — breaking stories, emergency debates, urgent decisions. Tempo accelerates, consequences compound rapidly.

### 1.3 What Makes It Longitudinal

Unlike episodic educational games, To The Power is designed to be played across weeks and months of real time. The game has memory. Actions taken in session three affect what is available in session fifteen — not deterministically, but probabilistically, depending on what has happened in between. This **moderate chaotic compounding** means no two careers play out identically even if the player makes similar initial choices.

The game is never finished. It is only ever interrupted by a career ending, after which the player starts again — armed with understanding of the system that their previous self lacked — and attempts to go further.

---

## 2. State Architecture

### 2.1 Three-Layer State Model

Game state is structured in three nested layers with different persistence characteristics. This architecture, following event-sourcing principles, ensures that past decisions can be interrogated at any point and that latent consequences can fire correctly when their conditions are met.

---

#### Layer 1 — Permanent Record (Immutable)

The event log. Every meaningful action produces an event appended to this log and never modified. This is the source of truth from which all other state is derived.

| Category | Contents |
|---|---|
| Vote Record | Every parliamentary vote — party line, rebellion, abstention, absence |
| Role History | Every appointment and dismissal with week number |
| Policy Decisions | Every major decision taken in a ministerial role |
| Maths Attempts | Every challenge attempted: topic, year level, correctness, timed/untimed, consequence applied |
| NPC Interactions | Every significant interaction — alliance, betrayal, favour, slight |
| Crisis Events | Every scandal, media storm, emergency — and how it resolved |
| Dark Actions | Grey-zone decisions: fund misappropriations, secret alliances, leaks |

---

#### Layer 2 — Reputation Profile (Derived, Slow-Moving)

Computed from the permanent record but expressed as tracked attributes. These shift gradually and have decay/recovery mechanics — damage is real but not permanent, though full recovery is rarely possible.

| Attribute | Description |
|---|---|
| Party Loyalty Score | 0–100. Falls on rebellion, rises on support. Whip tracks this closely. |
| Departmental Competence | Per-department rating derived from maths performance in that domain. |
| Public Approval | National polling average. Affected by policy outcomes and scandal. |
| Constituency Approval | Local standing. Separate from national approval. Determines electoral safety. |
| Press Relationship | How the media treats you. Can be cultivated or damaged. |
| Factional Alignment | Which internal party wings consider you an ally. |
| NPC Relationships | 14 individual relationship scores, each tracking history. |
| Dark Index | Hidden score tracking exposure risk from grey-zone actions. |
| Maths Performance Profile | Per-topic rolling accuracy across all attempts. Feeds the remediation system. |

---

#### Layer 3 — Situational State (Current, Fast-Moving)

The current conditions of the game world. Changes frequently and drives what events are generated each turn.

| Attribute | Description |
|---|---|
| Current Role | Backbencher → PPS → Junior Minister → Minister → Cabinet → PM |
| Current Tempo | Recess / Parliamentary / Crisis / Media Storm |
| Active Bills | Legislation currently progressing through Parliament |
| Live Crises | Active events requiring response this turn |
| Pending Events | Events queued but not yet triggered (some may never fire) |
| Parliament Calendar | Week number, session, distance to general election |
| Economic Indicators | National economic state affecting policy context |
| Government Standing | Governing majority, confidence level, PM's position |
| School Year Setting | Y9 / Y10 / Y11 — governs maths difficulty throughout entire career |

---

### 2.2 Latent Consequence System

The mechanism by which past decisions create future effects without deterministic causation. Every event in the permanent record can carry a `consequences` array containing immediate effects and latent effects.

> **A latent consequence has three components:** an activation condition (what must be true for it to fire), a probability modifier (how likely it is to fire when conditions are met), and a payload (what actually happens). Week 2 actions create latent consequences that only fire if specific Week 35 conditions are met — and only then with a probability, not a certainty.

**Example:**

```typescript
{
  activationCondition: "player_role >= Cabinet AND loyalty_score < 45 AND npc_whip_relationship < 30",
  probability: 0.7,
  payload: "activate(cabinet_reshuffle_threat)",
  expiresAtWeek: 120
}
```

The Week 8 rebellion vote sits dormant. If the player's loyalty score recovers, the consequence never fires. If they reach Cabinet with a damaged Whip relationship, there is a 70% chance it surfaces as a reshuffle threat at a politically inconvenient moment.

---

## 3. Career Progression

### 3.1 The Career Graph

Progression is a directed graph, not a linear ladder. Multiple valid paths exist to the Premiership. The path taken shapes the player's reputation profile and NPC relationships — but does not determine the type of problems faced at PM level. The Premiership is defined by breadth and context-switching velocity, not depth in any single domain.

| Level | Role | Entry Requirements | Maths Domain |
|---|---|---|---|
| 1 | Backbench MP | Start of game | Constituency arithmetic, basic percentages, ratios |
| 2 | Parliamentary Private Secretary | Loyalty ≥ 40, 1 session completed | Data reading, simple statistics, attendance tracking |
| 3 | Junior Minister | Competence ≥ 50 in chosen dept, PPS complete | Departmental maths — see curriculum matrix |
| 4 | Minister of State | Competence ≥ 65, departmental approval | Advanced departmental + cross-dept trade-offs |
| 5a | Secretary of State | Competence ≥ 75, party standing, PM favour | Full departmental mastery, budget responsibility |
| 5b | Chancellor of the Exchequer | Economics competence ≥ 80, PM trust ≥ 60 | National economics, compound interest, GDP modelling |
| 5c | Home Secretary | Loyalty ≥ 70, Home Affairs competence ≥ 75 | Statistics, probability, population modelling |
| 6 | Prime Minister | Path-dependent (see 3.2), leadership contest won | All domains simultaneously, rapid context-switching |

### 3.2 Routes to the Premiership

- **The Treasury Route** — Chancellor → PM. Fastest if economics competence is high. Arrives at PM with strong economic credibility but narrow cross-party relationships.
- **The Home Office Route** — Home Secretary → PM. Arrives with strong law-and-order reputation and media relationships. Statistical and probabilistic maths strength.
- **The Generalist Route** — Multiple departments, slower rise, broader competence profile. Widest NPC network and most diverse maths skills.

### 3.3 The Premiership

The PM role is qualitatively different from everything below it — simultaneous breadth across all mathematical domains under time pressure, with reduced advisor support (everyone wants something from the PM now). A typical PM week might require: approving a defence budget calculation, responding to unemployment statistics in PMQs, adjudicating a constituency funding dispute, and managing a Cabinet minister's scandal. The difficulty is context-switching velocity, not any single domain.

The PM is the only role where the player can call a general election voluntarily — choosing the timing based on polling mathematics. Getting the timing wrong can end the career earlier than any scandal.

---

## 4. Curriculum & Difficulty System

### 4.1 School Year Configuration

At game start, the player selects their current school year. This single setting silently governs the difficulty of every maths challenge throughout the career. The player never sees curriculum year labels during play — challenges are always framed politically.

The setting can be updated at the start of each new career as the player progresses through school. Leaderboard scores are tagged with the active year setting, making cross-year comparisons meaningful. Getting further on a harder setting is explicitly recognised on the leaderboard.

### 4.2 Curriculum Progression Matrix

| School Year Selected | Backbencher | PPS | Junior Minister | Minister of State | Cabinet | PM |
|---|---|---|---|---|---|---|
| **Year 9** | Y9 | Y9 | Y9 | Y9 | Y9 | Y9 |
| **Year 10** | Y9 | Y9 | Y9–10 | Y10 | Y10 | Y10 |
| **Year 11** | Y9 | Y9–10 | Y10–11 | Y11 | Y11 | Y11 |

**Transition zones** (Y9–10 in Year 10/11 paths, and Y10–11 in the Year 11 path) draw from both years, weighted toward the lower early in the role and toward the higher as the player settles in. This avoids hard cliff edges between career levels.

**Design rationale for Year 11 entry at Junior Minister:** Introducing Year 11 material from Junior Minister level (rather than Cabinet) gives the remediation system three full career tiers of runway — Junior Minister, Minister of State, and Cabinet all build familiarity before PM demands Year 11 fluency at pace. By the time the player reaches Cabinet they are consolidating, not meeting it cold. The Y9–10 transition at PPS level in Year 11 setting ensures the step up from Backbencher is also gradual.

**Remediation calibration at tier transitions:** When a new curriculum band first appears (e.g. Y11 material appearing at Junior Minister in Year 11 setting), the remediation trigger threshold drops temporarily from 3 wrong answers to 2. This more generous threshold normalises back to 3 once the player has had reasonable exposure to the new material (approximately 10 attempts in that band).

### 4.3 Diagnostic Quiz

Before confirming their year setting, the player takes a five-question diagnostic framed as "the Chief Whip wants to assess your parliamentary readiness." Results are never shown as a score. The Whip simply says "I think you're ready for [setting]" or "you may want to consider [higher setting]." Advisory, never gatekeeping. Gives the parent a useful signal and the player an optional upgrade path.

---

## 5. GCSE Curriculum Map

### Year 9 — Foundation Layer

All players start here regardless of year setting. Challenges should feel stretching but never alien.

**Number**
- Percentages: of an amount, increase/decrease, reverse percentages, percentage change (change ÷ original × 100)
- Fractions, decimals and percentages interchangeably
- Ratio and proportion: simplifying, dividing quantities, best value comparisons, scale problems
- Standard form: writing and calculating with very large and very small numbers
- Powers and roots: squares, cubes, square roots, cube roots
- Rounding: decimal places, significant figures, error intervals

**Algebra**
- Forming and solving linear equations (one and two steps, unknowns on both sides)
- Substitution into formulae
- Expanding brackets and factorising (single brackets)
- Sequences: nth term of arithmetic sequences
- Linear graphs: plotting, gradient, y-intercept, y = mx + c
- Real-world graphs: reading and interpreting distance-time and conversion graphs

**Statistics and Probability**
- Mean, median, mode, range from lists and frequency tables
- Simple probability: single events, 0–1 scale
- Relative frequency and experimental probability
- Pie charts, bar charts, frequency diagrams: reading and drawing
- Scatter graphs: plotting, describing correlation, drawing lines of best fit

*Game relevance:* Constituency polling margins (percentages, ratio), basic budget allocation (ratio and proportion), reading economic data (statistics, graphs), probability of winning a vote (simple probability), expressing national debt in standard form.

---

### Year 10 — GCSE Specification Proper

Introduced at Junior Minister (Y10 setting) or Minister of State transition zone (Y11 setting). More abstract, more multi-step, more algebraic.

**Number**
- Compound interest and compound growth/decay: multipliers, A = P(1 + r)ⁿ
- Repeated percentage change
- Growth and decay in context: population, depreciation, inflation over time
- Bounds and error intervals: upper and lower bounds, calculations with bounds
- Fractional and negative indices
- Surds: simplifying, rationalising (Higher tier)

**Algebra**
- Expanding double brackets, difference of two squares
- Factorising quadratics (leading coefficient 1)
- Solving quadratic equations by factorising
- Simultaneous equations: linear pairs, elimination and substitution
- Inequalities: solving and representing on number lines, graphing linear inequalities
- Geometric sequences: recognising and using
- Quadratic and cubic graphs: plotting and interpreting
- Real-world algebraic modelling: constructing equations from written problems

**Ratio, Proportion and Rates of Change**
- Direct and inverse proportion: recognising, calculating, graphing
- Rates of change: gradient as rate in real-world contexts (cost per unit, tax rates)
- Proportion in algebraic form: y ∝ x, y ∝ x², y ∝ 1/x

**Statistics and Probability**
- Cumulative frequency: drawing graphs, finding median, IQR, quartiles
- Box plots: drawing, interpreting, comparing distributions
- Histograms: drawing and interpreting frequency density
- Two-way tables: completing and calculating probabilities
- Probability trees: independent and dependent events
- Venn diagrams: two and three sets, calculating probabilities
- Expected frequency: probability × number of trials

*Game relevance:* Compound interest on government debt (A = P(1 + r)ⁿ), modelling population or economic growth over a parliamentary term, probability trees for electoral scenarios and risk assessment, simultaneous equations for cross-departmental budget trade-offs, histograms and cumulative frequency for interpreting economic data distributions, direct proportion for tax revenue modelling.

---

### Year 11 — Full GCSE, Sharp End

Introduced at Junior Minister in Year 11 setting. Cabinet and PM operate entirely in this territory.

**Number**
- Recurring decimals to fractions (algebraic proof)
- Limits of accuracy in complex multi-step calculations
- All index laws fluently including fractional and negative

**Algebra**
- Factorising quadratics where leading coefficient > 1
- Completing the square: solving equations, finding turning points, a(x + p)² + q form
- Quadratic formula: deriving and applying
- Simultaneous equations: one linear one quadratic
- Functions: f(x) notation, composite functions f(g(x)), inverse functions f⁻¹(x)
- Algebraic fractions: simplifying, adding, subtracting, solving equations
- Iteration: using iterative formulae to find approximate solutions
- Gradient of a curve: drawing and interpreting tangents, instantaneous rate of change
- Area under a curve: estimating using trapezium rule, interpreting as accumulated quantity

**Ratio, Proportion and Rates of Change**
- Rates of change from graphs in complex real-world contexts
- Exponential functions: graphs of y = aˣ, growth and decay in sophisticated models
- Complex direct and inverse proportion requiring algebraic construction

**Statistics and Probability**
- Conditional probability: P(A|B), using two-way tables and Venn diagrams
- Conditional probability trees: dependent events with changing probabilities
- Sampling methods: random, stratified, systematic — and their biases
- Interpreting and critiquing statistical claims: identifying misleading representations, evaluating methodology
- Comparing complex distributions across multiple representations

*Game relevance:* Completing the square for optimisation problems (maximising tax revenue, minimising cost), conditional probability for complex electoral modelling and risk under uncertainty, exponential functions for long-run economic modelling, iterative methods for approximating economic equilibria, critiquing statistical claims (directly enables the selective presentation grey zone mechanic), area under a curve for cumulative economic impact, composite functions for multi-stage policy effect modelling.

> **Note on selective presentation and Year 11 statistics:** "Interpreting and critiquing statistical claims" is explicitly on the Year 11 GCSE specification. The grey zone mechanic of constructing technically-accurate but misleading statistical arguments is the highest-order application of this topic — understanding the mechanics of misrepresentation well enough to deploy them deliberately. Educationally rigorous and narratively interesting simultaneously.

---

## 6. Mathematics Integration

### 6.1 Three Integration Modes

#### Mode 1 — Decision Maths
The most common mode. The quality of mathematical reasoning determines quality of outcome. No hard block — wrong answer produces a worse outcome with potential downstream consequences through the latent consequence system.

> **Example:** As Housing Minister (Y10 setting), you calculate the Right to Buy discount rate using compound growth — and set it 3% too high. The policy costs more than budgeted. Six weeks later, the Treasury calls for a departmental review. A latent consequence fires when you seek Cabinet promotion: the Treasury Permanent Secretary has a 15% probability of raising the overrun with the PM.

#### Mode 2 — Gate Maths
Used for appointments, committee memberships, Select Committee appearances — moments where demonstrating competence is literally the job requirement. Wrong answers mean the opportunity does not proceed, but recurs next parliamentary session.

> **Example:** Shortlisted for the Housing Select Committee. The Whip's office sends three calculations to verify. Get two of three correct and you secure the place. Fewer, and the Whip says you are "not yet ready." The seat goes to another MP who may later become a useful or inconvenient contact.

#### Mode 3 — Crisis Maths
Urgent problems during Crisis or Media Storm tempo. Consequences compound immediately and visibly. Also where grey-zone mechanics live — the maths of covering tracks and managing risk.

> **Example:** An emergency debate requires defending a department's spend. The opposition has found an apparent discrepancy. Options: (a) correctly recalculate to show no discrepancy, (b) construct an alternative explanation, or (c) if you previously misappropriated a budget line — construct a cover story the numbers will support.

---

### 6.2 Timed Challenges

Some challenges are timed. Timing correlates directly with narrative urgency.

**Untimed:** Recess tempo decisions, Parliamentary tempo non-urgent decisions, Historical Studies, Training Simulators, Gate Maths appointments (where preparation is expected).

**Timed:** Crisis tempo challenges, Media Storm challenges, PMQs questions, live parliamentary moments.

Timer length scales with curriculum year and question complexity:

| Curriculum Year | Simple calculation | Multi-step | Complex modelling |
|---|---|---|---|
| Year 9 | 30 seconds | 60 seconds | 90 seconds |
| Year 10 | 45 seconds | 90 seconds | 120 seconds |
| Year 11 | 60 seconds | 120 seconds | 180 seconds |

**Consequence of failing a timed challenge:** The political cost exceeds the mathematical cost. Being seen to hesitate or miscalculate under pressure damages Public Approval and Press Relationship beyond the policy consequence of the wrong answer itself. The same mistake costs more in front of cameras than in a private briefing. After a timed failure, the challenge recurs shortly after in a lower-stakes context so the learning moment is not lost.

---

### 6.3 Departmental Mathematics Curriculum

| Department | Primary Maths Topics | Example Challenge |
|---|---|---|
| Constituency (all MPs) | Percentages, ratios, basic statistics | Calculate swing needed to hold seat given current polling |
| Treasury / Chancellor | Compound interest, GDP, debt ratios, % change | Project national debt in 5 years given current deficit and growth rate |
| Home Office | Statistics, probability, population modelling | Calculate expected prison population given sentencing policy change |
| Health | Cost-per-outcome, % allocation, waiting times | Determine funding needed to reduce waiting list by 15% in 18 months |
| Education | Per-pupil funding, attainment gaps, capital returns | Calculate attainment gap change given £200 per pupil increase |
| Housing | Price indices, affordability ratios, volume targets | Set Right to Buy discount to meet affordability target within budget |
| Transport | Cost-benefit analysis, journey time, traffic modelling | Evaluate HS3 route options using cost per passenger mile |
| Foreign Office | Exchange rates, trade volumes, aid percentages | Calculate diplomatic aid package as % of GDP to meet treaty obligation |
| Premiership | All of the above, rapid switching | Multiple domains in a single PMQs session |

---

## 7. Remediation System

### 7.1 Trigger Mechanism

The Maths Performance Profile in Layer 2 tracks per-topic accuracy across a rolling window of ten attempts. Three or more errors in the same topic within that window triggers the remediation system. The trigger is invisible to the player — they are never told "you keep getting this wrong."

The intervention is framed as advisor preparation: "Frost has asked to brief you before the next session." It feels like an opportunity, not a correction.

### 7.2 Intervention Structure

1. **Worked example** — the advisor walks through an equivalent problem step by step in the current political context. Frost for economics and finance, Chen for statistics, Whitmore for historically-framed problems.
2. **Practice problem** — an equivalent challenge at the same topic and year level, lower political stakes.
3. **Re-encounter** — the original challenge recurs as the same question or a direct equivalent.

The player is never penalised for needing the intervention. Worked examples and practice problems are drawn from the correct curriculum year — a Year 9 player sees the foundation version; a Year 11 player sees the full algebraic form.

### 7.3 NPC Integration

Taking a Frost briefing and then performing well increases her relationship score. She respects politicians who do the work. Declining a briefing and then failing has no direct penalty, but if the pattern repeats, Frost's dialogue shifts to mild exasperation before the next offer.

### 7.4 Progressive Hint System (In-Challenge)

Carried forward from Central Bank Commander and extended:

- **1st wrong answer:** Domain-appropriate advisor appears with a partial hint. Gentle nudge.
- **2nd wrong answer:** Advisor returns with full explanation and worked approach.
- **3rd+ wrong answer:** Whitmore takes over with complete worked solution framed historically.
- **Timed challenge failure:** Immediate consequence applied; challenge recurs shortly in untimed lower-stakes form.
- **Gate maths failure:** Whip delivers verdict in character. "The committee felt you weren't quite ready. These things take time." Specific date for next opportunity given.

---

## 8. Grey Zone Mechanics

### 8.1 Design Philosophy

Grey zone actions are **risk-adjusted opportunities**. The expected value can be genuinely positive if the player navigates them well — correct calculations, well-managed press relationship, good timing, right NPCs onside. A well-executed budget misappropriation that shores up a marginal constituency and never surfaces is simply a smart political move. The game does not punish success at grey zone play.

What it does is make risk legible. The Dark Index is the exposure score. High Dark Index means a crisis event is more likely to cascade into scandal. A player who keeps Dark Index low through correct calculations and good press management can sustain grey zone activity across a full career. The skill is in the management, not in avoiding the activity.

Grey zone actions are **never required**. Players who pursue entirely legitimate careers can reach PM. Players who use grey zone mechanics well get there faster or with a more powerful position. Players who use them carelessly accumulate exposure that eventually becomes unmanageable.

### 8.2 Grey Zone Action Types

#### Budget Misappropriation
Redirecting a departmental budget line to fund a local project. The maths: the money must balance elsewhere — another line absorbs the cost without raising Treasury flags. Requires correctly calculating reallocation within tolerance bands.

- *If navigated well:* Constituency approval increases, Dark Index rises modestly and manageably.
- *If maths is wrong:* Reallocation creates an obvious discrepancy. Treasury flags it. Latent consequence created with medium probability of surfacing during any future audit.

#### Secret Electoral Alliance
A vote-trading arrangement with a rival faction or opposition member. Gets a bill through or secures an appointment, but creates an obligation. The maths: calculating whether the alliance is necessary (vote margins) and what you are offering in return.

- *If navigated well:* Legislative win, no immediate exposure, obligation is manageable.
- *If maths is wrong:* You pay more than necessary — the trade is disadvantageous and the obligation larger than it needed to be.

#### Strategic Leak
Providing information that damages a rival before an appointment decision. The maths: calculating the information's impact on the rival's standing and your relative position.

- *If navigated well:* Rival damaged, appointment secured, Dark Index rises but press relationship absorbs it.
- *If maths is wrong or press relationship is low:* Leak is traced. Rival's Resurgent state will specifically reference this.

#### Selective Presentation
Presenting accurate but carefully selected statistics to Parliament that create a misleading impression. The hardest grey zone mechanic — requires Year 11 statistics competence to execute convincingly.

- *If navigated well:* Narrative controlled, no Dark Index increase (technically legal).
- *If maths is wrong:* The selection is too obvious. Webb spots it immediately. Media Storm triggered.

### 8.3 The Dark Index

| Dark Index Range | Effect |
|---|---|
| 0–20 | Grey zone actions are well-contained. Crisis events resolve normally. |
| 21–40 | Minor crises have a small probability of surfacing grey zone history. |
| 41–60 | Any crisis event has a meaningful chance of escalating to Media Storm. |
| 61–80 | A dedicated investigation becomes likely. NPCs start distancing. |
| 81–100 | Full financial audit triggered at next crisis event. Embezzlement ending available. |

> **The embezzlement ending:** Dark Index at maximum + audit trigger = final maths challenge: a complete reconciliation of all misappropriated budget lines. Failure = arrest. Success = Dark Index reset to 60, but permanent record evidence that future crises can activate.

---

## 9. Tempo System

### 9.1 Variable Time

| Tempo State | Turn Represents | Characteristics | Transition Triggers |
|---|---|---|---|
| Recess | 2–3 months | Slow burn. Constituency work, research, relationship-building. Full library accessible. | Parliament reconvenes |
| Parliamentary | 1–2 weeks | Bill progress, votes, questions, select committees. Calendar drives the player. | Breaking news, leadership challenge, emergency |
| Crisis | 1–3 days | Decisions compound rapidly. Cannot defer. Timed maths challenges active. | Crisis resolves or escalates to Media Storm |
| Media Storm | Hours | Reputational pressure. Managing narrative. Press relationship critical. | Story fades or forces resignation |

### 9.2 Tempo as Narrative Signal

Tempo shifts communicate urgency. The transition from Parliamentary to Crisis should feel like a lurch. Latent consequences can trigger tempo shifts — a forgotten vote surfaces in a journalist's piece on a Tuesday morning and suddenly it is a Media Storm. The player should never be able to predict when Crisis tempo will strike.

---

## 10. NPC Roster

### 10.1 Primary NPCs — 14 Characters

Primary NPCs have persistent relationship scores, their own career trajectories running parallel to the player's, and a three-state lifecycle:

- **Active** — in play, current role, interacting regularly
- **Dormant** — removed from role, present in background but not a major force
- **Resurgent** — returned with modified motivations shaped by what caused dormancy and what the player did to them

Transitions from Dormant to Resurgent are conditional, not timed: when a faction needs a figurehead, when the player is vulnerable, when the player reaches out.

---

#### Government Side — 8 NPCs

**Margaret Ashworth — Party Grandee / Former PM**
- *Archetype:* The elder statesman. Dispenses patronage and wisdom — at a price.
- *Starting Disposition:* Cautiously neutral. Assesses you over your first two parliamentary sessions.
- *Career Arc:* Starts senior and influential. Resurgent state: returns as party unity figurehead during government crisis.
- *Dark Mechanic:* Mutual assured destruction — she knows your secrets if Dark Index is high.

**Gerald Fosse — Chief Whip**
- *Archetype:* The enforcer. Compliance, not friendship.
- *Starting Disposition:* Professionally cold (50). Moves based purely on loyalty score.
- *Maths Domain:* Vote margin calculations, majority arithmetic.
- *Dark Mechanic:* Primary detection mechanism for party disloyalty. High Dark Index + low loyalty triggers investigations.

**Priya Sharma — Loyal Ally / Junior MP**
- *Archetype:* Rises alongside the player. Genuinely supportive, politically ambitious.
- *Starting Disposition:* Warm (high). Most reliable early ally.
- *Maths Domain:* Mirrors your departmental specialism — a performance benchmark.
- *Dark Mechanic:* If directly harmed by a grey zone action, her Resurgent state is the most painful in the game.

**Oliver Pemberton-Cross — Political Liaison / Spin Doctor**
- *Archetype:* Desperately optimistic, spins everything positive. Comic relief.
- *Starting Disposition:* Enthusiastically supportive.
- *Maths Domain:* Media framing, selective presentation mechanics.
- *Dark Mechanic:* Primary Strategic Leak enabler. If leak is traced, he is the first suspect.

**Dr. Helena Frost — Treasury Spad / Chief Economist**
- *Archetype:* Brutally analytical, sarcastically precise. Runs pre-Budget sessions and remediation briefings.
- *Starting Disposition:* Sceptical (35).
- *Maths Domain:* Economics and finance. The hardest maths in the game.
- *Dark Mechanic:* High Dark Index + low Frost relationship = latent consequence with audit probability.

**James Okafor — Parliamentary Colleague / Ideological Rival**
- *Archetype:* Same party, different wing. Not an enemy, but fundamentally incompatible.
- *Starting Disposition:* Professionally civil (45).
- *Maths Domain:* Cross-department trade-off calculations.
- *Dark Mechanic:* Most dangerous Strategic Leak target — if he discovers it, Resurgent state is principled internal critic with personal grievance.

**Margaret Fenn — Permanent Secretary (Home Office)**
- *Archetype:* Civil service, invested in departmental continuity. Has outlasted three ministers.
- *Starting Disposition:* Politely obstructive until you demonstrate competence.
- *Maths Domain:* Home Office statistics and population modelling.
- *Dark Mechanic:* Knows departmental skeletons. High Dark Index in Home Office actions = latent consequence of Treasury flag.

**Robert Hawley — Junior Ally / Mentee**
- *Archetype:* Newly elected MP the player can mentor.
- *Starting Disposition:* Admiring and impressionable.
- *Maths Domain:* Basic constituency maths — a measure of how far the player has come.
- *Dark Mechanic:* If involved in grey zone action, becomes a liability — young, idealistic, bad at keeping secrets.

---

#### Opposition — 3 NPCs

**Diana Calder — Leader of the Opposition**
- *Archetype:* The ultimate political antagonist. Disciplined, effective.
- *Starting Disposition:* Adversarial. Relationship score irrelevant until PM level.
- *Maths Domain:* National-level economics and policy. Hardest PMQs questions.
- *Dark Mechanic:* Cross-party deals at PM level create latent consequences — statesmanship or treachery depending on circumstances.

**Marcus Webb — Shadow Minister (Your Department)**
- *Archetype:* Your direct opposite number. Scrutinises every decision.
- *Starting Disposition:* Hostile and procedurally aggressive.
- *Maths Domain:* Mirrors your departmental domain — has done the same calculations and found the errors.
- *Dark Mechanic:* Most likely to spot selective presentation. Resurgent state focuses on your statistical credibility.

**Yvonne Strachey — Opposition Whip / Cross-Party Fixer**
- *Archetype:* Corridor operator. Outcomes not drama.
- *Starting Disposition:* Neutral transactional.
- *Maths Domain:* Vote margin and majority arithmetic.
- *Dark Mechanic:* Primary secret electoral alliance broker. If deal discovered, mutual exposure.

---

#### External Power — 3 NPCs

**Vincent Harrold — Press Baron**
- *Archetype:* Controls three national newspapers. Access and influence, not truth.
- *Starting Disposition:* Transactional warmth.
- *Maths Domain:* Readership statistics, polling impact calculations.
- *Dark Mechanic:* Can protect or expose. Access vs risk calculation is one of the most complex ongoing decisions in the game.

**Sir Anthony Birch — Party Donor / Businessman**
- *Archetype:* Financial support with policy expectations. Not corrupt, exactly.
- *Starting Disposition:* Genial (high).
- *Maths Domain:* Business mathematics — ROI, cost-benefit, profit margins.
- *Dark Mechanic:* Most direct route into budget misappropriation. Mutual Dark Index exposure.

**Ambassador Chen Wei — Foreign Counterpart**
- *Archetype:* Major trading partner. Different value system, unpredictable.
- *Starting Disposition:* Formally courteous.
- *Maths Domain:* International trade — exchange rates, tariff calculations, trade volumes.
- *Dark Mechanic:* Cross-border financial arrangements are technically legal but politically sensitive.

---

### 10.2 Secondary NPCs — 12 Characters

Consistent voice and personality without mechanical relationship tracking. Can be elevated to primary in exceptional circumstances.

| Character | Role | Function & Voice |
|---|---|---|
| The Speaker | Parliamentary procedure | Formal, impartial, occasionally dry. "Order. The honourable member will come to the point." |
| Patricia Leigh | Parliamentary sketchwriter | Sardonic verdicts on PMQs performance the following morning. |
| Derek Hollis | Lobby journalist | Always outside the chamber. Stories can be fed or starved. |
| Sandra Yates | Constituency agent | Blunt local reality. "They don't care about the bill, they care about the car park." |
| Councillor Ray Brunt | Local businessman | Local commercial interests. Occasional source of political currency. |
| Dr. Amara Diallo | Think tank economist | Reports that support or embarrass your positions. Occasional maths research assist. |
| Philip Rowe | Party pollster | Straight delivery. "You're at 34% in the marginals. Thought you should know." |
| Miriam Cross | Community organiser | The human face of policy decisions. |
| QC Jonathan Fairfax | Barrister | Appears when legal questions arise — grey zone exposure, regulatory investigations. |
| Commissioner Adesola | Senior police officer | Surfaces during law and order crises. Home Office and PM level. |
| EU Counterpart Vogel | European diplomat | International trade negotiations. Different pace and political style. |
| IMF Representative | International economist | Appears during major economic crises. An IMF visit is itself a Crisis tempo trigger. |

> **Secondary-to-Primary elevation:** If a secondary NPC becomes involved in a grey zone action, a scandal, or a significant plot branch, they can be elevated to primary status with a relationship score introduced at that point.

---

## 11. Failure States & Designed Endings

Every career ends. Each ending is a complete story with a Whitmore-style retrospective on legacy. The quality depends on how far the player rose and what they accomplished, not just how they fell.

| Ending | Trigger Conditions |
|---|---|
| **Voted Out — General Election** | Constituency approval declining. Polling maths miscalculated or local support neglected. Full election night sequence. |
| **Voted Out — By-Election Loss** | Local scandal or neglect. Abrupt and inglorious. |
| **Fired by Chief Whip** | Loyalty score collapse. Usually preceded by two warning events. |
| **Forced Resignation — Scandal** | Press relationship + Dark Index at critical levels. One final crisis maths challenge to attempt cover. |
| **Arrested — Financial Irregularities** | Dark Index at maximum + audit triggered. Final challenge: full budget reconciliation. Failure = arrest. |
| **Ousted in Leadership Challenge** | Rival has built sufficient faction. Vote of confidence calculation under extreme time pressure. |
| **Resigned on Principle** | Voluntary. Player refuses party instruction that conflicts with stated values. Short career, honourable exit. High prestige on leaderboard. |
| **Retired — Senior Statesman** | Served at high levels without dramatic fall. The dignified exit. |
| **Served a Full Parliamentary Term as PM** | Called election voluntarily, won on correct polling mathematics, served full term, retired. Rarest ending. Maximum leaderboard score. |

---

## 12. Hall of Power — Leaderboard

### 12.1 Scoring Model

Two visible axes:

- **Mathematical Acumen** — accuracy across all attempts, weighted by difficulty tier and domain breadth. Attempting harder challenges scores more than staying in a comfort zone. Timed challenges correct score higher than untimed equivalents.
- **Political Acumen** — highest office reached, NPC relationships cultivated, legislation passed, crises survived, grey zone exposure managed well.

Both axes shown as separate bars alongside combined score. Leaderboard scores tagged with active school year setting — getting further on a harder setting is explicitly recognised.

### 12.2 Historical Benchmarks

| Historical Figure | Maths Acumen | Political Acumen | Flavour Note |
|---|---|---|---|
| William Gladstone | 78 | 91 | "Four-time Prime Minister. Mastered the detail. Occasionally forgot the politics." |
| Margaret Thatcher | 82 | 88 | "Conviction over consensus. The numbers were always right. The people were complicated." |
| Clement Attlee | 75 | 94 | "Quiet competence. Built more than anyone remembered to credit him for." |
| Harold Wilson | 71 | 85 | "Survived everything. Perhaps too clever by half, but never caught." |
| William Pitt the Younger | 88 | 79 | "Chancellor at 24. The maths were extraordinary. The judgement, occasionally not." |
| Tony Blair | 69 | 82 | "Communication over calculation. The numbers sometimes suffered for the narrative." |
| Gordon Brown | 91 | 64 | "Perhaps the finest economic mind in modern politics. Westminster itself defeated him." |
| Benjamin Disraeli | 61 | 89 | "Brilliant politics, approximate arithmetic. Survived on charm and audacity." |
| Liz Truss | 23 | 11 | "Lasted 45 days. The lettuce outlasted her by four. History will be kind, eventually." |
| A Head of Lettuce | 28 | 14 | "Did not miscalculate anything. Outlasted a Prime Minister. No comment from the lettuce." |

---

## 13. Historical Studies & Training Simulators

### 13.1 Standalone Architecture

Historical Studies and Training Simulators exist as **standalone games outside the main narrative**. They are a parallel library of self-contained educational episodes, playable without any main game context — including by players who have not yet started a career.

The connection to the main game: when Whitmore offers a historical parallel during a key decision, there is a link to the relevant standalone study. Playing it before deciding gives a hint or a competence boost in that topic. The link is enrichment, never a gate.

During **Recess tempo** the full library is freely browsable. During **Parliamentary tempo** relevant studies surface when decisions arise. During **Crisis tempo** they are unavailable.

Each study and simulator carries a curriculum year tag. The standalone games detect the active year setting and serve the appropriate variant, or offer the player a choice if they want to challenge themselves above their setting.

### 13.2 Training Simulators

Targeted skill drills in political framing. Each simulator is tagged to a specific curriculum topic and year level and can be played independently or triggered by the remediation system.

Framing examples: Frost's pre-Budget briefing session on compound interest, Chen's statistics masterclass before a Select Committee appearance, Whitmore's crash course on historical inflation models.

### 13.3 Historical Studies Backlog (Planned for Phase 4) — 20 Studies

#### British & European

| Study Title | Year | Maths Concepts | Game Relevance |
|---|---|---|---|
| The 1976 IMF Crisis | 1976 | Debt ratios, % of GDP, interest calculations | Chancellor / PM — economic emergency template |
| Black Wednesday | 1992 | Exchange rates, % change, cost of currency defence | Treasury / Foreign — currency crisis |
| The Poll Tax Collapse | 1990 | Per-capita calculation, % burden shift, polling margins | PM — catastrophic policy reversal |
| Suez Crisis | 1956 | Military cost-benefit, foreign exchange, trade route economics | Foreign / PM — limits of power |
| The Great Reform Act 1832 | 1832 | Electoral arithmetic, probability of revolution, constituency ratios | Backbench / Cabinet — constitutional change |
| The Miners' Strike | 1984 | Break-even analysis, pit viability, community economic modelling | Cabinet — policy vs human cost |
| NHS Founding Negotiations | 1948 | Cost projection, per-capita funding, % of GDP | Health — landmark policy creation |
| The Profumo Affair | 1963 | Polling decline rates, probability of survival, press reach | Any level — scandal management |
| MPs' Expenses Scandal | 2009 | % claims, statistical sampling, audit mathematics | Backbench — integrity and transparency |
| Falklands — The Decision Weekend | 1982 | Military logistics, % risk, cost of inaction | PM — irreversible decision under uncertainty |
| The 2008 Bank Bailout | 2008 | Compound interest, systemic risk %, GDP impact | Treasury — crisis of scale |
| Weimar Hyperinflation | 1923 | Exponential growth, large number arithmetic, currency devaluation | Treasury — inflation as economic weapon |

#### Ancient World

| Study Title | Period | Maths Concepts | Game Relevance |
|---|---|---|---|
| Roman Currency Debasement | 64–270 AD | Progressive % reduction in silver content, purchasing power, Diocletian's price edict as inflation control | Treasury — debasement as policy tool |
| Athenian Silver Mines & Public Finance | 483 BC | Revenue calculation, % allocation to fleet vs public works, compound growth of naval power | Treasury / Cabinet — public investment returns |
| The Roman Grain Dole | 123 BC–AD 400 | Population %, per-capita cost, budget % of state revenue, logistics ratios | Health / Cabinet — welfare cost modelling |
| Tang Dynasty Paper Money & Its Collapse | 618–907 AD | Inflation rates, % increase in money supply, purchasing power collapse over time | Treasury — early monetary policy failure |

#### Non-European & Global

| Study Title | Year | Maths Concepts | Game Relevance |
|---|---|---|---|
| 1997 Asian Financial Crisis | 1997 | Currency % devaluations, contagion modelling, IMF loan ratios | Chancellor / PM — international economic shock |
| Mughal Revenue Farming | 1556–1707 | Tax yield %, administrative cost ratios, compound extraction over time | Cabinet — taxation and extraction efficiency |
| The Ottoman Fiscal Crisis | 1875 | Debt-to-GDP ratio, % of revenue to debt service, bond yield calculations | Chancellor — sovereign debt management |
| Post-Colonial African Debt Crises | 1980s–90s | Compound interest on external debt, % GDP debt service, IMF conditionality trade-offs | PM / Foreign — development economics |

> **On the transatlantic slave trade:** This episode is historically important, mathematically rich (financial instruments, compound returns, insurance calculations), and deliberately uncomfortable. It is available in the library but framed with appropriate gravity — Whitmore's voice shifts register. The study exists because sanitising the historical library is educationally dishonest. Its inclusion is flagged as a design question to be confirmed before build.

### 13.4 Future Expansion Candidates

John Law's Mississippi Scheme, Tulip Mania 1637, Spanish Silver Inflation 1500s, South Sea Bubble's South American context, Greek Debt Crisis 2010–15, Silicon Valley Bank 2023, Bitcoin Bull Run 2021, Opium Wars economic impact, the economics of the Silk Road, Song Dynasty fiscal innovation, Inca redistribution economy.

---

## 14. Advisor Characters

| Advisor | Role & Voice |
|---|---|
| **Professor Atticus Whitmore** | Historical Advisor. Academic, loves parallels, slightly pompous. Delivers Historical Study introductions and contextual observations. Delivers 3rd-hint worked solutions framed historically. "Governor — forgive me, Prime Minister — when Callaghan faced this exact calculation in 1976..." |
| **Dr. Helena Frost** | Treasury Spad (also primary NPC). Brutally analytical, sarcastically precise. Primary hint voice for economics and finance. Runs remediation sessions. "Again? Very well. Let me be more explicit." |
| **Oliver Pemberton-Cross** | Political Liaison / Spin Doctor (also primary NPC). Comic relief. "The PM will be THRILLED! (Once we adjust the numbers slightly...)" |
| **Zara Chen** | Data Analyst. No-nonsense, direct, just facts. Appears for statistics and data interpretation challenges. "The data says you're wrong. Here's why." |

---

## 15. Technical Architecture

### 15.1 Architecture Principles

Event-sourcing throughout, following Calculating Glory's established pattern. All state derived from immutable event log. Commands validated against current state, produce events, applied by reducers to produce new state. Latent consequence evaluation runs after every event against the full state.

```
Command → Validation → Events → Reducer → New State
                                    ↓
                     Latent consequence evaluation
                     (checks all dormant consequences
                      against new state after every event)
```

### 15.2 Event Taxonomy

| Category | Event Types |
|---|---|
| Career Events | `AppointmentMade`, `AppointmentRevoked`, `ElectionCalled`, `ElectionResult`, `LeadershipContestEntered`, `LeadershipContestResult` |
| Parliamentary Events | `VoteCast`, `BillIntroduced`, `BillPassed`, `BillFailed`, `QuestionAsked`, `SelectCommitteeAppeared` |
| Policy Events | `PolicyDecisionMade`, `PolicyOutcomeRevealed`, `BudgetLineSet`, `BudgetLineRevised` |
| Maths Events | `ChallengePresented`, `ChallengeAttempted`, `ChallengeOutcomeApplied`, `HintRequested`, `RemediationTriggered`, `TimedChallengeStarted`, `TimedChallengeExpired` |
| Relationship Events | `NPCRelationshipChanged`, `FactionAlignmentShifted`, `AllianceFormed`, `BetrayalRecorded` |
| Tempo Events | `TempoChanged`, `CrisisStarted`, `CrisisResolved`, `MediaStormStarted`, `MediaStormFaded` |
| Grey Zone Events | `GreyZoneActionTaken`, `DarkIndexChanged`, `ExposureRiskEvaluated`, `AuditTriggered` |
| NPC Lifecycle Events | `NPCTransitionedToDormant`, `NPCTransitionedToResurgent`, `NPCElevatedToPrimary` |
| Curriculum Events | `SchoolYearSet`, `SchoolYearUpdated`, `DiagnosticCompleted` |

### 15.3 Key Type Definitions

```typescript
type SchoolYear = 'Y9' | 'Y10' | 'Y11';
type CurriculumBand = 'Y9' | 'Y9-10' | 'Y10' | 'Y10-11' | 'Y11';
type CareerLevel = 'backbencher' | 'pps' | 'junior_minister' | 'minister_of_state' | 'cabinet' | 'pm';
type ChallengeMode = 'decision' | 'gate' | 'crisis';
type TempoState = 'recess' | 'parliamentary' | 'crisis' | 'media_storm';
type NPCLifecycle = 'active' | 'dormant' | 'resurgent';

type MathsTopic =
  // Year 9 — Number
  | 'percentages' | 'ratio_proportion' | 'standard_form' | 'powers_roots' | 'rounding'
  // Year 9 — Algebra
  | 'linear_equations' | 'linear_graphs' | 'sequences_arithmetic' | 'substitution'
  // Year 9 — Statistics & Probability
  | 'basic_probability' | 'statistics_basic' | 'scatter_graphs'
  // Year 10 — Number
  | 'compound_interest' | 'growth_decay' | 'bounds' | 'indices' | 'surds'
  // Year 10 — Algebra
  | 'quadratics_basic' | 'simultaneous_equations' | 'inequalities' | 'geometric_sequences'
  // Year 10 — Ratio & Rates
  | 'direct_inverse_proportion' | 'rates_of_change_linear'
  // Year 10 — Statistics & Probability
  | 'probability_trees' | 'venn_diagrams' | 'histograms' | 'cumulative_frequency' | 'box_plots'
  // Year 11 — Algebra
  | 'completing_square' | 'quadratic_formula' | 'functions' | 'algebraic_fractions' | 'iteration'
  // Year 11 — Rates & Exponentials
  | 'exponential_functions' | 'area_under_curve' | 'gradient_curve' | 'rates_of_change_complex'
  // Year 11 — Statistics & Probability
  | 'conditional_probability' | 'sampling_methods' | 'statistical_critique';

interface MathsChallenge {
  id: string;
  mode: ChallengeMode;
  topic: MathsTopic;
  curriculumYear: CurriculumBand;
  question: string;
  answer: number;
  tolerance: number;
  unit: string;
  timed: boolean;
  timerSeconds?: number;
  hints: [string, string, string]; // partial hint, full hint, worked solution
  politicalContext: string;
  departmentalDomain: string;
}

interface LatentConsequence {
  activationCondition: string;
  probability: number;
  payload: string;
  expiresAtWeek?: number;
}

interface GameEvent {
  type: string;
  week: number;
  payload: Record<string, unknown>;
  immediateConsequences: Consequence[];
  latentConsequences: LatentConsequence[];
}

interface NPCState {
  id: string;
  name: string;
  lifecycleState: NPCLifecycle;
  relationshipScore: number;
  dormantSinceWeek?: number;
  dormancyCause?: string;
  resurgentMotivation?: string;
}

interface TopicPerformance {
  attempts: number;
  correct: number;
  recentAttempts: boolean[];   // rolling window of last 10
  remediationCount: number;
}

interface MathsPerformanceProfile {
  [topic: string]: TopicPerformance;
}

interface GameState {
  // Layer 1 — Permanent Record
  eventLog: GameEvent[];

  // Layer 2 — Reputation Profile
  partyLoyaltyScore: number;
  departmentalCompetence: Record<string, number>;
  publicApproval: number;
  constituencyApproval: number;
  pressRelationship: number;
  factionalAlignment: string[];
  npcRelationships: Record<string, NPCState>;
  darkIndex: number;
  mathsPerformance: MathsPerformanceProfile;

  // Layer 3 — Situational State
  currentRole: CareerLevel;
  currentTempo: TempoState;
  activeBills: string[];
  liveCrises: string[];
  pendingEvents: PendingEvent[];
  parliamentWeek: number;
  parliamentSession: number;
  weeksToElection: number;
  economicIndicators: EconomicIndicators;
  schoolYear: SchoolYear;
}
```

### 15.4 Curriculum Resolution Function

```typescript
function getCurriculumBand(schoolYear: SchoolYear, careerLevel: CareerLevel): CurriculumBand {
  const matrix: Record<SchoolYear, Record<CareerLevel, CurriculumBand>> = {
    Y9: {
      backbencher: 'Y9', pps: 'Y9', junior_minister: 'Y9',
      minister_of_state: 'Y9', cabinet: 'Y9', pm: 'Y9'
    },
    Y10: {
      backbencher: 'Y9', pps: 'Y9', junior_minister: 'Y9-10',
      minister_of_state: 'Y10', cabinet: 'Y10', pm: 'Y10'
    },
    Y11: {
      backbencher: 'Y9', pps: 'Y9-10', junior_minister: 'Y10-11',
      minister_of_state: 'Y11', cabinet: 'Y11', pm: 'Y11'
    }
  };
  return matrix[schoolYear][careerLevel];
}
```

### 15.5 Build Phases

- **Phase 1:** Domain logic — TypeScript, event-sourcing, state machine, NPC system, latent consequence engine, maths challenge types, curriculum matrix and resolution, remediation system
- **Phase 2:** Playable browser prototype — standalone HTML, minimal UI, enough to test career progression and tempo feel with real player
- **Phase 3:** Full UI build informed by prototype feedback
- **Phase 4:** Content expansion — Historical Studies library, Training Simulators, NPC depth, additional endings, full leaderboard

> **Priority before Phase 3:** Get the actual player playing it. The state architecture is proven in code. Whether career transitions and tempo shifts feel right is answered only by playing. Expect most iteration on career progression gates and the tempo system.

---

## 16. Open Design Questions

| Question | Notes |
|---|---|
| Constituency naming | Hartwell North proposed. Purely fictional or real geography with fictional name? |
| General election timing | Fixed 5-year term or variable (PM calls it)? Variable preferred for strategic tension at PM level. |
| Party naming | Do the two parties need names for the prototype, or is "the party" / "the opposition" sufficient? |
| Difficulty alongside year setting | Explicit additional difficulty setting, or does year setting alone govern challenge level? |
| Save/persistence | localStorage for prototype. Cloud save for cross-device leaderboard competition is a future question. |
| Multiplayer | Event-sourcing supports async multiplayer. Not in scope but architecture should not preclude it. |
| Accessibility | Multiple formats for maths challenges, screen reader compatibility — plan from the start, not retrospectively. |
| Transatlantic slave trade study | Include with appropriate framing, or defer to later expansion? Educationally honest but requires careful handling. |

---

*TO THE POWER: It's a Numbers Game — Game Design Document v1.2 — February 2026*
