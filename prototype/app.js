import { PrototypeApi } from "/prototype/runtime-api.js";
import { buildRetrospectiveComparison } from "/dist/application/retrospective.js";
import { validateContentBundle } from "/dist/content/schema.js";

const summaryEntries = [
  ["School year", "schoolYear"],
  ["Role", "currentRole"],
  ["Tempo", "currentTempo"],
  ["Time", "timeHours"],
  ["Party loyalty", "partyLoyaltyScore"],
  ["Public approval", "publicApproval"],
  ["Constituency", "constituencyApproval"],
  ["Press", "pressRelationship"],
  ["Dark index", "darkIndex"],
  ["Remediations", "pendingRemediations"],
  ["Timed challenges", "activeTimedChallenges"],
  ["Event log", "eventLogEntries"]
];

const elements = {
  actionResult: document.querySelector("#action-result"),
  actionType: document.querySelector("#action-type"),
  advance: document.querySelector("#advance"),
  advanceHours: document.querySelector("#advance-hours"),
  bubbleAnchor: document.querySelector("#bubble-anchor"),
  bubbleLead: document.querySelector("#bubble-lead"),
  bubbleSurface: document.querySelector("#bubble-surface"),
  cabinetAnchor: document.querySelector("#cabinet-anchor"),
  cabinetGrid: document.querySelector("#cabinet-grid"),
  cabinetStamp: document.querySelector("#cabinet-stamp"),
  cabinetSurface: document.querySelector("#cabinet-surface"),
  collisionQueue: document.querySelector("#collision-queue"),
  collisionStamp: document.querySelector("#collision-stamp"),
  collisionSurface: document.querySelector("#collision-surface"),
  detailsToggle: document.querySelector("#details-toggle"),
  nextStep: document.querySelector("#next-step"),
  audioState: document.querySelector("#audio-state"),
  audioToggle: document.querySelector("#audio-toggle"),
  cleanReadToggle: document.querySelector("#clean-read-toggle"),
  clockReadout: document.querySelector("#clock-readout"),
  clearRuns: document.querySelector("#clear-runs"),
  compareRuns: document.querySelector("#compare-runs"),
  comparisonGrid: document.querySelector("#comparison-grid"),
  comparisonStatus: document.querySelector("#comparison-status"),
  comparisonSummary: document.querySelector("#comparison-summary"),
  diarySurface: document.querySelector("#diary-surface"),
  eventCount: document.querySelector("#event-count"),
  eventLog: document.querySelector("#event-log"),
  focusOrderStamp: document.querySelector("#focus-order-stamp"),
  interrupt: document.querySelector("#interrupt"),
  interruptBody: document.querySelector("#interrupt-body"),
  interruptDismiss: document.querySelector("#interrupt-dismiss"),
  interruptReturn: document.querySelector("#interrupt-return"),
  interruptTitle: document.querySelector("#interrupt-title"),
  lampAnchor: document.querySelector("#lamp-anchor"),
  openNext: document.querySelector("#open-next"),
  packetCount: document.querySelector("#packet-count"),
  packetFullscreenClose: document.querySelector("#packet-fullscreen-close"),
  packetFullscreenToggle: document.querySelector("#packet-fullscreen-toggle"),
  packetFocus: document.querySelector("#packet-focus"),
  packets: document.querySelector("#packets"),
  phoneBatches: document.querySelector("#phone-batches"),
  phoneAnchor: document.querySelector("#phone-anchor"),
  phoneSurface: document.querySelector("#phone-surface"),
  progression: document.querySelector("#progression"),
  promotionStamp: document.querySelector("#promotion-stamp"),
  retrospectiveStamp: document.querySelector("#retrospective-stamp"),
  retrospectiveSummary: document.querySelector("#retrospective-summary"),
  leaderboardSummary: document.querySelector("#leaderboard-summary"),
  recordAnchor: document.querySelector("#record-anchor"),
  recordStat: document.querySelector("#record-stat"),
  recordSurface: document.querySelector("#record-surface"),
  resolvePriority: document.querySelector("#resolve-priority"),
  runTriage: document.querySelector("#run-triage"),
  reducedMotionToggle: document.querySelector("#reduced-motion-toggle"),
  refresh: document.querySelector("#refresh"),
  restart: document.querySelector("#restart"),
  schoolYear: document.querySelector("#school-year"),
  saveRun: document.querySelector("#save-run"),
  shellTier: document.querySelector("#shell-tier"),
  status: document.querySelector("#status"),
  summary: document.querySelector("#summary"),
  summaryStamp: document.querySelector("#summary-stamp"),
  supplementList: document.querySelector("#supplement-list"),
  supplementAnchor: document.querySelector("#supplement-anchor"),
  supplementStamp: document.querySelector("#supplement-stamp"),
  supplementSurface: document.querySelector("#supplement-surface"),
  tempoState: document.querySelector("#tempo-state"),
  trayAnchor: document.querySelector("#tray-anchor"),
  trayState: document.querySelector("#tray-state"),
  whipAnchor: document.querySelector("#whip-anchor"),
  whipQueue: document.querySelector("#whip-queue"),
  whipStamp: document.querySelector("#whip-stamp"),
  whipSurface: document.querySelector("#whip-surface")
};

const SURFACE_FOCUS_ORDER_TIER1 = [
  "In-Tray",
  "Active packet",
  "Smartphone",
  "The Record",
  "The Bubble",
  "The Supplement",
  "Diary"
];
const SURFACE_FOCUS_ORDER_TIER2 = [
  "In-Tray",
  "Active packet",
  "Whip Board",
  "Smartphone",
  "The Record",
  "The Bubble",
  "The Supplement",
  "Diary"
];
const SURFACE_FOCUS_ORDER_TIER3 = [
  "In-Tray",
  "Active packet",
  "Whip Board",
  "Cabinet Grid",
  "Smartphone",
  "The Record",
  "The Bubble",
  "The Supplement",
  "Diary"
];

const URGENT_TEMPOS = new Set(["crisis", "media_storm"]);
const TEMPO_PROFILES = {
  recess: { visibleBatches: 2, updatesPerBatch: 2, audioFrequency: 220, pressureClass: "recess" },
  parliamentary: { visibleBatches: 3, updatesPerBatch: 3, audioFrequency: 260, pressureClass: "parliamentary" },
  crisis: { visibleBatches: 5, updatesPerBatch: 4, audioFrequency: 330, pressureClass: "crisis" },
  media_storm: { visibleBatches: 6, updatesPerBatch: 5, audioFrequency: 390, pressureClass: "media_storm" }
};
const COLLISION_PRIORITY = {
  crisis_interrupt: 1,
  timed_challenge: 2,
  packet_resolution: 3,
  fallout_updates: 4,
  flavour_updates: 5
};

let api;
let currentPackets = [];
let activePacketIndex = -1;
let lastAction = null;
let dismissedInterruptKey = null;
let latestSummary = null;
let packetFullscreen = false;
let falloutBatchCounter = 0;
let smartphoneBatches = [];
let recordLens = null;
let bubbleShadowLead = null;
let supplementItems = [];
let collisionQueueItems = [];
let audioEnabled = false;
let audioContext = null;
let lastTempoForCue = null;
let lastCollisionCueKey = "";
let cleanReadEnabled = false;
let reducedMotionEnabled = false;
let detailsVisible = false;
let shellTier = "tier1";
let whipQueueItems = [];
let cabinetGridItems = [];
let savedRetrospectiveRuns = [];

const RETROSPECTIVE_RUN_STORAGE_KEY = "ttp.retrospectiveRuns.v1";
const MAX_SAVED_RETROSPECTIVE_RUNS = 12;

function setStatus(message) {
  elements.status.textContent = message;
}

function applyDetailsVisibility() {
  document.body.classList.toggle("details-expanded", detailsVisible);
  if (elements.detailsToggle) {
    elements.detailsToggle.textContent = detailsVisible ? "Hide extra panels" : "Show extra panels";
  }
}

function formatDelta(value) {
  if (value === 0) {
    return "0";
  }
  return value > 0 ? `+${value}` : String(value);
}

function loadSavedRetrospectiveRuns() {
  try {
    const raw = localStorage.getItem(RETROSPECTIVE_RUN_STORAGE_KEY);
    if (!raw) {
      savedRetrospectiveRuns = [];
      return;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      savedRetrospectiveRuns = [];
      return;
    }
    savedRetrospectiveRuns = parsed.filter((entry) => {
      if (!entry || typeof entry !== "object") {
        return false;
      }
      if (typeof entry.savedAtIso !== "string") {
        return false;
      }
      if (!entry.report || typeof entry.report !== "object") {
        return false;
      }
      return typeof entry.report.schemaVersion === "string";
    }).slice(-MAX_SAVED_RETROSPECTIVE_RUNS);
  } catch {
    savedRetrospectiveRuns = [];
  }
}

function persistSavedRetrospectiveRuns() {
  try {
    localStorage.setItem(RETROSPECTIVE_RUN_STORAGE_KEY, JSON.stringify(savedRetrospectiveRuns));
  } catch {
    // Ignore persistence errors; in-memory run list still works.
  }
}

function updateNextStep(trayState) {
  if (!elements.nextStep) {
    return;
  }
  if (shellTier === "tier3" && cabinetGridItems.length > 0) {
    elements.nextStep.textContent = `Tier 3 triage: ${cabinetGridItems[0].instruction} Then use Run crisis triage.`;
    return;
  }
  if (shellTier === "tier2" && whipQueueItems.length > 0) {
    elements.nextStep.textContent = `Top priority: ${whipQueueItems[0].instruction} Use Resolve top priority if unsure.`;
    return;
  }
  if (currentPackets.length === 0) {
    elements.nextStep.textContent = "No tasks are ready. Press Refresh batch to load a new task.";
    return;
  }
  if (activePacketIndex < 0) {
    elements.nextStep.textContent = "Press Open next task to bring a task into view.";
    return;
  }
  if (lastAction?.kind === "challenge") {
    elements.nextStep.textContent = "Good. Press Open next task to continue.";
    return;
  }
  if (trayState === "urgent") {
    elements.nextStep.textContent = "Urgent task: answer the question in Active Packet now.";
    return;
  }
  elements.nextStep.textContent = "Read the question, type a number, then press Check answer.";
}

function setShellTier(nextTier) {
  shellTier = nextTier === "tier3" ? "tier3" : (nextTier === "tier2" ? "tier2" : "tier1");
  document.body.classList.toggle("tier2-active", shellTier === "tier2" || shellTier === "tier3");
  document.body.classList.toggle("tier3-active", shellTier === "tier3");
  if (elements.shellTier && elements.shellTier.value !== shellTier) {
    elements.shellTier.value = shellTier;
  }
  if ((shellTier === "tier2" || shellTier === "tier3") && !detailsVisible) {
    detailsVisible = true;
    applyDetailsVisibility();
  }
  if (elements.whipStamp) {
    elements.whipStamp.textContent = shellTier === "tier1" ? "tier 2" : "priority live";
  }
  if (elements.cabinetStamp) {
    elements.cabinetStamp.textContent = shellTier === "tier3" ? "stacked pressure" : "tier 3";
  }
}

function formatTempo(tempo) {
  return String(tempo).replaceAll("_", " ");
}

function computeTrayState(summary, packets) {
  if (packets.length === 0) {
    return "idle";
  }
  const hasTimedPacket = packets.some((packet) => Boolean(packet.challenge?.timed));
  if (URGENT_TEMPOS.has(summary.currentTempo) || hasTimedPacket) {
    return "urgent";
  }
  return "available";
}

function isNarrowViewport() {
  return window.matchMedia("(max-width: 820px)").matches;
}

function setPacketFullscreen(nextState) {
  packetFullscreen = nextState;
  document.body.classList.toggle("packet-fullscreen", packetFullscreen);
  elements.packetFullscreenClose.classList.toggle("hidden", !packetFullscreen);
  elements.packetFullscreenToggle.classList.toggle("hidden", packetFullscreen);
}

function applyAccessibilityModes() {
  document.body.classList.toggle("clean-read", cleanReadEnabled);
  document.body.classList.toggle("reduced-motion", reducedMotionEnabled);
  if (elements.cleanReadToggle) {
    elements.cleanReadToggle.checked = cleanReadEnabled;
  }
  if (elements.reducedMotionToggle) {
    elements.reducedMotionToggle.checked = reducedMotionEnabled;
  }
}

function persistAccessibilityModes() {
  try {
    localStorage.setItem("ttp.cleanRead", cleanReadEnabled ? "1" : "0");
    localStorage.setItem("ttp.reducedMotion", reducedMotionEnabled ? "1" : "0");
  } catch {
    // Ignore persistence failures; runtime mode still applies.
  }
}

function loadAccessibilityModes() {
  try {
    cleanReadEnabled = localStorage.getItem("ttp.cleanRead") === "1";
    reducedMotionEnabled = localStorage.getItem("ttp.reducedMotion") === "1";
  } catch {
    cleanReadEnabled = false;
    reducedMotionEnabled = false;
  }
  applyAccessibilityModes();
}

function getTempoProfile(tempo) {
  return TEMPO_PROFILES[tempo] ?? TEMPO_PROFILES.parliamentary;
}

function setTempoVisualState(tempo) {
  const tempoClasses = Object.keys(TEMPO_PROFILES).map((entry) => `tempo-${entry}`);
  document.body.classList.remove(...tempoClasses);
  document.body.classList.add(`tempo-${tempo}`);
  elements.tempoState.textContent = `${formatTempo(tempo)} pressure`;
}

function ensureAudioContext() {
  if (audioContext) {
    return audioContext;
  }
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }
  audioContext = new AudioContextCtor();
  return audioContext;
}

function playPressureCue(summary, reasonKey) {
  const profile = getTempoProfile(summary.currentTempo);
  const cueLabel = `${formatTempo(summary.currentTempo)} hint`;
  const fallbackLabel = "Sound is off. Visual urgency hint is active.";

  if (!audioEnabled) {
    elements.audioState.textContent = fallbackLabel;
    return;
  }

  const ctx = ensureAudioContext();
  if (!ctx) {
    elements.audioState.textContent = "Sound unavailable. Visual urgency hint is active.";
    return;
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  const oscA = ctx.createOscillator();
  const gainA = ctx.createGain();
  oscA.type = "sine";
  oscA.frequency.value = profile.audioFrequency;
  gainA.gain.value = 0.0001;
  gainA.gain.exponentialRampToValueAtTime(0.04, now + 0.03);
  gainA.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  oscA.connect(gainA);
  gainA.connect(ctx.destination);
  oscA.start(now);
  oscA.stop(now + 0.24);

  if (summary.currentTempo === "crisis" || summary.currentTempo === "media_storm") {
    const oscB = ctx.createOscillator();
    const gainB = ctx.createGain();
    oscB.type = "triangle";
    oscB.frequency.value = profile.audioFrequency * 1.22;
    gainB.gain.value = 0.0001;
    gainB.gain.exponentialRampToValueAtTime(0.03, now + 0.19);
    gainB.gain.exponentialRampToValueAtTime(0.0001, now + 0.37);
    oscB.connect(gainB);
    gainB.connect(ctx.destination);
    oscB.start(now + 0.16);
    oscB.stop(now + 0.39);
  }

  elements.audioState.textContent = `${cueLabel} played.`;
}

function playPaperRustleCue(surfaceLabel) {
  if (!audioEnabled) {
    elements.audioState.textContent = `${surfaceLabel} opened. Sound is off; visual paper cue shown.`;
    return;
  }

  if (reducedMotionEnabled) {
    elements.audioState.textContent = `${surfaceLabel} opened. Reduced-motion mode skips rustle audio.`;
    return;
  }

  const ctx = ensureAudioContext();
  if (!ctx) {
    elements.audioState.textContent = `${surfaceLabel} opened. Sound unavailable; visual paper cue shown.`;
    return;
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  const durationSeconds = 0.18;
  const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * durationSeconds));
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < sampleCount; index += 1) {
    const progress = index / sampleCount;
    const envelope = Math.pow(1 - progress, 1.8);
    data[index] = (Math.random() * 2 - 1) * envelope;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1450, now);
  filter.Q.setValueAtTime(0.7, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.06, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start(now);
  source.stop(now + durationSeconds);
  elements.audioState.textContent = `${surfaceLabel} rustle cue played.`;
}

function signedDelta(value) {
  if (value === 0) {
    return "0";
  }
  return value > 0 ? `+${value}` : String(value);
}

function extractSummaryDeltas(beforeSummary, afterSummary) {
  return {
    partyLoyaltyScore: afterSummary.partyLoyaltyScore - beforeSummary.partyLoyaltyScore,
    publicApproval: afterSummary.publicApproval - beforeSummary.publicApproval,
    constituencyApproval: afterSummary.constituencyApproval - beforeSummary.constituencyApproval,
    pressRelationship: afterSummary.pressRelationship - beforeSummary.pressRelationship,
    darkIndex: afterSummary.darkIndex - beforeSummary.darkIndex,
    pendingRemediations: afterSummary.pendingRemediations - beforeSummary.pendingRemediations
  };
}

function getDominantRecordMetric(deltas, summary) {
  const metricTable = [
    { key: "publicApproval", label: "Public approval", value: summary.publicApproval, delta: deltas.publicApproval },
    { key: "pressRelationship", label: "Press relationship", value: summary.pressRelationship, delta: deltas.pressRelationship },
    { key: "partyLoyaltyScore", label: "Party loyalty", value: summary.partyLoyaltyScore, delta: deltas.partyLoyaltyScore },
    { key: "constituencyApproval", label: "Constituency approval", value: summary.constituencyApproval, delta: deltas.constituencyApproval },
    { key: "darkIndex", label: "Dark index", value: summary.darkIndex, delta: deltas.darkIndex }
  ];

  metricTable.sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta));
  return metricTable[0];
}

function buildShadowLead(deltas, warnings, events) {
  if (deltas.darkIndex > 0 || warnings.length > 0) {
    return {
      headline: "Lobby whispers darken around the office",
      angle: "Sources suggest consequences are accumulating faster than statements can contain.",
      confidence: "high"
    };
  }
  if (deltas.publicApproval < 0 || deltas.pressRelationship < 0) {
    return {
      headline: "Narrative temperature turns against your brief",
      angle: "Media desks and constituency chatter are converging on the same criticism pattern.",
      confidence: Math.abs(deltas.publicApproval) + Math.abs(deltas.pressRelationship) >= 4 ? "high" : "medium"
    };
  }
  if (deltas.publicApproval > 0 || deltas.partyLoyaltyScore > 0) {
    return {
      headline: "Backbench buzz tilts in your favour",
      angle: "Supportive voices are amplifying the latest decision as proof of control.",
      confidence: "medium"
    };
  }
  if (events.length > 0) {
    return {
      headline: "Narrative churn continues without clear winner",
      angle: "Commentariat tone remains volatile, awaiting the next packet response.",
      confidence: "low"
    };
  }
  return {
    headline: "Quiet cycle",
    angle: "No strong shadow lead has emerged from this step.",
    confidence: "low"
  };
}

function buildSupplementItems(action, deltas) {
  const items = [];
  if (action.kind === "challenge" && action.correct === false) {
    items.push(`Practice brief: revisit ${action.topic} with one reinforcement problem.`);
  }
  if (deltas.pendingRemediations > 0) {
    items.push(`Supplement pack: ${deltas.pendingRemediations} remediation task(s) queued.`);
  }
  if (action.response.events.some((event) => event.type === "TimedChallengeStarted")) {
    items.push("Tempo drill: short timed warm-up to reduce crisis-response latency.");
  }
  return items.slice(0, 3);
}

function buildSmartphoneBatch(action, summary, deltas, isUrgent) {
  const profile = getTempoProfile(summary.currentTempo);
  const updates = [];

  if (action.response.warnings.length > 0) {
    updates.push(...action.response.warnings.map((warning) => `warning:${warning.code}`));
  }

  if (deltas.publicApproval !== 0) {
    updates.push(`public approval ${signedDelta(deltas.publicApproval)}`);
  }
  if (deltas.pressRelationship !== 0) {
    updates.push(`press relationship ${signedDelta(deltas.pressRelationship)}`);
  }
  if (deltas.darkIndex !== 0) {
    updates.push(`dark index ${signedDelta(deltas.darkIndex)}`);
  }
  if (updates.length === 0 && action.response.events.length > 0) {
    updates.push(`events:${action.response.events.length} routed`);
  }
  if (updates.length === 0) {
    updates.push("no measurable fallout movement");
  }

  falloutBatchCounter += 1;
  return {
    id: `batch-${falloutBatchCounter}`,
    label: action.label,
    urgent: isUrgent,
    tempo: summary.currentTempo,
    severity: isUrgent
      ? (summary.currentTempo === "media_storm" ? "critical" : "high")
      : (summary.currentTempo === "parliamentary" ? "elevated" : "normal"),
    updates: updates.slice(0, profile.updatesPerBatch)
  };
}

function applyFalloutRouting(action) {
  const deltas = extractSummaryDeltas(action.beforeSummary, action.response.summary);
  const summary = action.response.summary;
  const isUrgent = action.response.warnings.length > 0
    || URGENT_TEMPOS.has(summary.currentTempo)
    || deltas.darkIndex >= 2
    || deltas.publicApproval <= -3
    || deltas.pressRelationship <= -3;

  const batch = buildSmartphoneBatch(action, summary, deltas, isUrgent);
  smartphoneBatches = [batch, ...smartphoneBatches].slice(0, 6);

  const metric = getDominantRecordMetric(deltas, summary);
  recordLens = {
    label: metric.label,
    value: metric.value,
    delta: signedDelta(metric.delta),
    updatedAt: `${formatTempo(summary.currentTempo)} ${summary.timeHours}h`
  };

  bubbleShadowLead = buildShadowLead(deltas, action.response.warnings, action.response.events);
  supplementItems = buildSupplementItems(action, deltas);

  elements.phoneSurface.classList.toggle("urgent-physical", isUrgent);
}

function buildCollisionQueue(summary, trayState) {
  const items = [];
  const hasTimedPacket = currentPackets.some((packet) => Boolean(packet.challenge?.timed));
  const latestBatch = smartphoneBatches[0];

  if (URGENT_TEMPOS.has(summary.currentTempo)) {
    items.push({
      type: "crisis_interrupt",
      title: "Crisis interruption",
      detail: `${formatTempo(summary.currentTempo)} demands immediate prioritisation.`,
      priority: COLLISION_PRIORITY.crisis_interrupt
    });
  }

  if (hasTimedPacket) {
    items.push({
      type: "timed_challenge",
      title: "Timed challenge pressure",
      detail: "Active packet contains timed challenge constraints.",
      priority: COLLISION_PRIORITY.timed_challenge
    });
  }

  if (lastAction?.response?.events?.length > 0) {
    items.push({
      type: "packet_resolution",
      title: "Packet resolution updates",
      detail: `${lastAction.response.events.length} event(s) emitted from latest action.`,
      priority: COLLISION_PRIORITY.packet_resolution
    });
  }

  if (latestBatch) {
    items.push({
      type: "fallout_updates",
      title: "Fallout surface updates",
      detail: `${latestBatch.updates.length} routed update(s) in smartphone batch.`,
      priority: COLLISION_PRIORITY.fallout_updates
    });
  }

  if (bubbleShadowLead) {
    items.push({
      type: "flavour_updates",
      title: "Narrative climate lead",
      detail: bubbleShadowLead.headline,
      priority: COLLISION_PRIORITY.flavour_updates
    });
  }

  if (trayState === "urgent" && !items.some((item) => item.type === "timed_challenge")) {
    items.push({
      type: "timed_challenge",
      title: "Urgent tray state",
      detail: "In-Tray is signalling urgent packet handling.",
      priority: COLLISION_PRIORITY.timed_challenge
    });
  }

  items.sort((left, right) => left.priority - right.priority);
  return items.slice(0, 5);
}

function buildWhipQueue(summary, trayState) {
  const directives = [];
  const topCollision = collisionQueueItems[0];

  if (topCollision?.type === "crisis_interrupt" || topCollision?.type === "timed_challenge" || trayState === "urgent") {
    directives.push({
      level: "critical",
      target: "packet",
      title: "Clear urgent packet first",
      instruction: "Answer the active packet before touching lower-priority surfaces."
    });
  }

  if (smartphoneBatches[0]?.urgent === true) {
    directives.push({
      level: "high",
      target: "phone",
      title: "Triage smartphone fallout",
      instruction: "Review the latest fallout batch and confirm no critical signal is missed."
    });
  }

  if (summary.partyLoyaltyScore < 45 || summary.publicApproval < 42) {
    directives.push({
      level: "high",
      target: "record",
      title: "Stability check",
      instruction: "Check record metrics before advancing time."
    });
  }

  if (summary.darkIndex >= 60) {
    directives.push({
      level: "high",
      target: "bubble",
      title: "Narrative risk review",
      instruction: "Review Bubble Wire for hostile momentum before opening another packet."
    });
  }

  if (directives.length === 0) {
    directives.push({
      level: "normal",
      target: "tray",
      title: "Maintain packet flow",
      instruction: "Open next task and continue steady progression."
    });
  }

  return directives.slice(0, 3);
}

function buildCabinetGrid(summary, trayState) {
  const directives = [];
  const topCollision = collisionQueueItems[0];
  const whipTop = whipQueueItems[0];

  if (topCollision && topCollision.priority <= 2) {
    directives.push({
      lane: "operations",
      title: "Immediate desk containment",
      instruction: "Clear urgent packet pressure before any narrative or optics actions."
    });
  }

  if (summary.pressRelationship < 40 || summary.publicApproval < 40) {
    directives.push({
      lane: "media",
      title: "Press confidence repair",
      instruction: "Stabilize perception signals before advancing the clock."
    });
  }

  if (summary.partyLoyaltyScore < 48 || summary.constituencyApproval < 44) {
    directives.push({
      lane: "political",
      title: "Coalition alignment check",
      instruction: "Review loyalty and constituency readings before opening the next packet."
    });
  }

  if (summary.darkIndex >= 55 || trayState === "urgent") {
    directives.push({
      lane: "risk",
      title: "Risk suppression lane",
      instruction: "Treat risk signals as blocking until pressure drops."
    });
  }

  if (directives.length === 0 && whipTop) {
    directives.push({
      lane: "operations",
      title: "Maintain cabinet rhythm",
      instruction: whipTop.instruction
    });
  }

  return directives.slice(0, 4);
}

function renderCollisionQueue() {
  if (collisionQueueItems.length === 0) {
    elements.collisionQueue.replaceChildren(
      Object.assign(document.createElement("p"), { textContent: "No queue pressure." })
    );
    elements.collisionStamp.textContent = "priority order";
    return;
  }

  elements.collisionQueue.replaceChildren(
    ...collisionQueueItems.map((item) => {
      const card = document.createElement("article");
      card.className = `collision-item priority-${item.priority}`;

      const title = document.createElement("h3");
      title.textContent = `${item.priority}. ${item.title}`;

      const detail = document.createElement("p");
      detail.textContent = item.detail;

      card.append(title, detail);
      return card;
    })
  );
  elements.collisionStamp.textContent = `top: ${collisionQueueItems[0].title}`;
}

function renderWhipQueue() {
  if (shellTier !== "tier2" && shellTier !== "tier3") {
    elements.whipQueue.replaceChildren(
      Object.assign(document.createElement("p"), { textContent: "Switch to Tier 2 or Tier 3 to activate whip directives." })
    );
    return;
  }

  if (whipQueueItems.length === 0) {
    elements.whipQueue.replaceChildren(
      Object.assign(document.createElement("p"), { textContent: "No whip directives queued." })
    );
    elements.whipStamp.textContent = "stable";
    return;
  }

  elements.whipQueue.replaceChildren(
    ...whipQueueItems.map((entry, index) => {
      const card = document.createElement("article");
      card.className = `whip-item level-${entry.level}`;

      const title = document.createElement("h3");
      title.textContent = `${index + 1}. ${entry.title}`;

      const detail = document.createElement("p");
      detail.textContent = entry.instruction;

      card.append(title, detail);
      return card;
    })
  );
  elements.whipStamp.textContent = `top: ${whipQueueItems[0].title}`;
}

function renderCabinetGrid() {
  if (shellTier !== "tier3") {
    elements.cabinetGrid.replaceChildren(
      Object.assign(document.createElement("p"), { textContent: "Switch to Tier 3 to activate cabinet-level triage." })
    );
    return;
  }

  if (cabinetGridItems.length === 0) {
    elements.cabinetGrid.replaceChildren(
      Object.assign(document.createElement("p"), { textContent: "No cabinet pressure is active." })
    );
    elements.cabinetStamp.textContent = "stable";
    return;
  }

  elements.cabinetGrid.replaceChildren(
    ...cabinetGridItems.map((entry, index) => {
      const card = document.createElement("article");
      card.className = `cabinet-item lane-${entry.lane}`;

      const title = document.createElement("h3");
      title.textContent = `${index + 1}. ${entry.title}`;

      const detail = document.createElement("p");
      detail.textContent = entry.instruction;

      card.append(title, detail);
      return card;
    })
  );
  elements.cabinetStamp.textContent = `top: ${cabinetGridItems[0].title}`;
}

function renderFalloutSurfaces() {
  const profile = getTempoProfile(latestSummary?.currentTempo ?? "parliamentary");
  const visibleBatches = smartphoneBatches.slice(0, profile.visibleBatches);

  if (smartphoneBatches.length === 0) {
    elements.phoneBatches.replaceChildren(
      Object.assign(document.createElement("p"), { textContent: "No fallout updates queued yet." })
    );
  } else {
    elements.phoneBatches.replaceChildren(
      ...visibleBatches.map((batch) => {
        const article = document.createElement("article");
        article.className = `phone-batch${batch.urgent ? " urgent" : ""} severity-${batch.severity}`;

        const title = document.createElement("h3");
        title.textContent = `${batch.label} | ${formatTempo(batch.tempo)}`;

        const list = document.createElement("ul");
        batch.updates.forEach((update) => {
          const item = document.createElement("li");
          item.textContent = update;
          list.append(item);
        });

        article.append(title, list);
        return article;
      })
    );
  }

  if (!recordLens) {
    elements.recordStat.replaceChildren(
      Object.assign(document.createElement("p"), {
        className: "meta",
        textContent: "Record lens"
      }),
      Object.assign(document.createElement("p"), {
        textContent: "No major state movement recorded yet."
      })
    );
  } else {
    const kicker = document.createElement("p");
    kicker.className = "meta";
    kicker.textContent = `Record lens | ${recordLens.updatedAt}`;

    const value = document.createElement("p");
    value.textContent = `${recordLens.label}: ${recordLens.value} (${recordLens.delta})`;
    value.className = "record-value";

    elements.recordStat.replaceChildren(kicker, value);
  }

  if (!bubbleShadowLead) {
    elements.bubbleLead.replaceChildren(
      Object.assign(document.createElement("h3"), { textContent: "Shadow lead" }),
      Object.assign(document.createElement("p"), { textContent: "No narrative lead is active yet." })
    );
  } else {
    const headline = document.createElement("h3");
    headline.textContent = bubbleShadowLead.headline;

    const angle = document.createElement("p");
    angle.textContent = bubbleShadowLead.angle;

    const confidence = document.createElement("p");
    confidence.className = "meta";
    confidence.textContent = `confidence: ${bubbleShadowLead.confidence}`;

    elements.bubbleLead.replaceChildren(headline, angle, confidence);
  }

  if (supplementItems.length === 0) {
    elements.supplementList.replaceChildren(
      Object.assign(document.createElement("p"), { textContent: "No supplementary items queued." })
    );
    elements.supplementStamp.textContent = "optional";
  } else {
    const list = document.createElement("ul");
    supplementItems.forEach((itemText) => {
      const item = document.createElement("li");
      item.textContent = itemText;
      list.append(item);
    });
    elements.supplementList.replaceChildren(list);
    elements.supplementStamp.textContent = `${supplementItems.length} queued`;
  }
}

function renderSummary(summary) {
  elements.summary.replaceChildren(
    ...summaryEntries.flatMap(([label, key]) => {
      const dt = document.createElement("dt");
      dt.textContent = label;

      const dd = document.createElement("dd");
      dd.textContent = String(summary[key]);

      return [dt, dd];
    })
  );

  elements.summaryStamp.textContent = `${formatTempo(summary.currentTempo)} at ${summary.timeHours}h`;
  elements.clockReadout.textContent = `${formatTempo(summary.currentTempo)} | ${summary.timeHours}h`;
}

function renderProgression(snapshot) {
  const promotionCard = document.createElement("article");
  promotionCard.className = "progression-card";

  const promotionHeading = document.createElement("h3");
  promotionHeading.textContent = snapshot.promotion.nextRole
    ? `${snapshot.promotion.currentRole} -> ${snapshot.promotion.nextRole}`
    : `${snapshot.promotion.currentRole} is the current ceiling`;

  const promotionBody = document.createElement("p");
  promotionBody.textContent = snapshot.promotion.nextRole
    ? snapshot.promotion.ready
      ? "Promotion gate is currently satisfied."
      : "Promotion gate is not yet satisfied."
    : "No further automatic promotion gate is defined yet.";

  promotionCard.append(promotionHeading, promotionBody);

  if (snapshot.promotion.requirements.length > 0) {
    const list = document.createElement("ul");
    snapshot.promotion.requirements.forEach((requirement) => {
      const item = document.createElement("li");
      item.textContent = `${requirement.met ? "met" : "open"}: ${requirement.label} ${requirement.current}/${requirement.target}`;
      list.append(item);
    });
    promotionCard.append(list);
  }

  const careerCard = document.createElement("article");
  careerCard.className = "progression-card";

  const careerHeading = document.createElement("h3");
  careerHeading.textContent = snapshot.career.title;

  const careerBody = document.createElement("p");
  careerBody.textContent = snapshot.career.detail;

  careerCard.append(careerHeading, careerBody);

  elements.progression.replaceChildren(promotionCard, careerCard);
  elements.promotionStamp.textContent = snapshot.career.kind;
}

function renderRetrospective(report) {
  const summary = report.summary;
  const legacy = report.legacy;

  const summaryCard = document.createElement("article");
  summaryCard.className = "retrospective-card";

  const title = document.createElement("h3");
  title.textContent = `${summary.finalRole.replaceAll("_", " ")} finish (${summary.schoolYear})`;

  const detail = document.createElement("p");
  detail.textContent = `Peak role: ${summary.peakRole.replaceAll("_", " ")}. ${summary.challengeStats.accuracy}% challenge accuracy over ${summary.challengeStats.attempts} attempt${summary.challengeStats.attempts === 1 ? "" : "s"}.`;

  const ending = document.createElement("p");
  ending.textContent = `Ending: ${summary.ending.title}. ${summary.ending.detail}`;

  const replay = document.createElement("p");
  replay.className = "meta";
  replay.textContent = report.replay.deterministic
    ? "Replay consistency check: deterministic"
    : "Replay consistency check: mismatch detected";

  summaryCard.append(title, detail, ending, replay);
  elements.retrospectiveSummary.replaceChildren(summaryCard);

  const leaderboardCard = document.createElement("article");
  leaderboardCard.className = "retrospective-card";

  const legacyHeadline = document.createElement("h3");
  legacyHeadline.textContent = `Legacy score ${legacy.score} (${legacy.band})`;

  const legacyDetail = document.createElement("p");
  legacyDetail.textContent = legacy.rationale;

  const dtoStamp = document.createElement("p");
  dtoStamp.className = "meta";
  dtoStamp.textContent = `DTO ${report.schemaVersion} | ${report.leaderboardEntry.modelVersion} | ${report.leaderboardEntry.runId}`;

  leaderboardCard.append(legacyHeadline, legacyDetail, dtoStamp);
  elements.leaderboardSummary.replaceChildren(leaderboardCard);
  elements.retrospectiveStamp.textContent = report.replay.deterministic ? "deterministic replay" : "replay mismatch";
}

function renderRunComparison() {
  if (elements.comparisonStatus) {
    elements.comparisonStatus.textContent = `Saved runs: ${savedRetrospectiveRuns.length}`;
  }
  if (savedRetrospectiveRuns.length < 2) {
    elements.comparisonSummary.replaceChildren(
      Object.assign(document.createElement("p"), {
        textContent: "Save at least two runs to compare trajectory shifts."
      })
    );
    elements.comparisonGrid.replaceChildren(
      Object.assign(document.createElement("p"), {
        textContent: "No comparison available yet."
      })
    );
    return;
  }

  const comparison = buildRetrospectiveComparison(savedRetrospectiveRuns);
  const baseline = savedRetrospectiveRuns.find((entry) => entry.report.leaderboardEntry.runId === comparison.baselineRunId);
  const candidate = savedRetrospectiveRuns.find((entry) => entry.report.leaderboardEntry.runId === comparison.candidateRunId);
  if (!baseline || !candidate) {
    elements.comparisonSummary.replaceChildren(
      Object.assign(document.createElement("p"), { textContent: "Comparison records are incomplete." })
    );
    elements.comparisonGrid.replaceChildren(
      Object.assign(document.createElement("p"), { textContent: "Unable to render run comparison." })
    );
    return;
  }

  const trendCard = document.createElement("article");
  trendCard.className = "comparison-card";

  const trendTitle = document.createElement("h3");
  trendTitle.textContent = `Trend snapshot (${comparison.runCount} saved runs)`;

  const trendList = document.createElement("ul");
  const trendItems = [
    `Legacy score delta: ${formatDelta(comparison.trends.legacyScoreDelta)}`,
    `Accuracy delta: ${formatDelta(comparison.trends.challengeAccuracyDelta)}%`,
    `Dark-index delta: ${formatDelta(comparison.trends.darkIndexDelta)}`,
    `Hours delta: ${formatDelta(comparison.trends.totalHoursDelta)}`
  ];
  trendItems.forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    trendList.append(item);
  });

  const replayMeta = document.createElement("p");
  replayMeta.className = "meta";
  replayMeta.textContent = comparison.replay.allDeterministic
    ? "Comparison replay check: deterministic across compared runs."
    : `Replay mismatches in run IDs: ${comparison.replay.nonDeterministicRunIds.join(", ")}`;

  trendCard.append(trendTitle, trendList, replayMeta);
  elements.comparisonSummary.replaceChildren(trendCard);

  const makeRunCard = (label, entry) => {
    const card = document.createElement("article");
    card.className = "comparison-card";

    const title = document.createElement("h3");
    title.textContent = `${label}: ${entry.report.summary.finalRole.replaceAll("_", " ")}`;

    const details = document.createElement("p");
    details.textContent = `Legacy ${entry.report.legacy.score} | Accuracy ${entry.report.summary.challengeStats.accuracy}% | Dark index ${entry.report.summary.finalScores.darkIndex}`;

    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = `${entry.report.leaderboardEntry.runId} | ${entry.savedAtIso}`;

    card.append(title, details, meta);
    return card;
  };

  elements.comparisonGrid.replaceChildren(
    makeRunCard("Baseline", baseline),
    makeRunCard("Candidate", candidate)
  );
}

function saveCurrentRunSnapshot() {
  if (!api) {
    return;
  }
  const report = api.getRetrospectiveReport({
    playerAlias: "prototype-shell",
    runId: `shell-${Date.now()}`
  });
  const record = {
    savedAtIso: new Date().toISOString(),
    report
  };
  savedRetrospectiveRuns = [...savedRetrospectiveRuns, record].slice(-MAX_SAVED_RETROSPECTIVE_RUNS);
  persistSavedRetrospectiveRuns();
  renderRunComparison();
  setStatus(`Saved run snapshot ${record.report.leaderboardEntry.runId}.`);
}

function clearSavedRunSnapshots() {
  savedRetrospectiveRuns = [];
  persistSavedRetrospectiveRuns();
  renderRunComparison();
  setStatus("Saved run snapshots cleared.");
}

function buildSection(title, body, meta) {
  const section = document.createElement("section");
  section.className = "packet-section";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const text = document.createElement("p");
  text.textContent = body;

  section.append(heading, text);

  if (meta) {
    const detail = document.createElement("p");
    detail.textContent = meta;
    section.append(detail);
  }

  return section;
}

function renderActionResult() {
  if (!lastAction) {
    elements.actionType.textContent = "none yet";
    elements.actionResult.replaceChildren(
      Object.assign(document.createElement("p"), {
        textContent: "No challenge outcome or time advance has been submitted yet."
      })
    );
    elements.eventCount.textContent = "0 emitted";
    elements.eventLog.replaceChildren(
      Object.assign(document.createElement("p"), {
        textContent: "No events emitted yet."
      })
    );
    return;
  }

  elements.actionType.textContent = lastAction.label;

  const actionCard = document.createElement("article");
  actionCard.className = "action-card";

  const heading = document.createElement("h3");
  heading.textContent = lastAction.heading;

  const summary = document.createElement("p");
  summary.textContent = `${formatTempo(lastAction.response.summary.currentTempo)} at ${lastAction.response.summary.timeHours}h after ${lastAction.response.events.length} event${lastAction.response.events.length === 1 ? "" : "s"}.`;

  actionCard.append(heading, summary);

  if (lastAction.response.warnings.length > 0) {
    const warnings = document.createElement("p");
    warnings.textContent = `Warnings: ${lastAction.response.warnings.map((warning) => warning.code).join(", ")}`;
    actionCard.append(warnings);
  }

  elements.actionResult.replaceChildren(actionCard);

  elements.eventCount.textContent = `${lastAction.response.events.length} emitted`;
  if (lastAction.response.events.length === 0) {
    elements.eventLog.replaceChildren(
      Object.assign(document.createElement("p"), { textContent: "Action emitted no events." })
    );
    return;
  }

  elements.eventLog.replaceChildren(
    ...lastAction.response.events.map((event, index) => {
      const card = document.createElement("article");
      card.className = "event-item";

      const title = document.createElement("h3");
      title.textContent = `${index + 1}. Event`;

      const body = document.createElement("p");
      body.textContent = `${event.type} at ${event.atHour}h.`;

      card.append(title, body);
      return card;
    })
  );
}

function handleChallengeOutcome(packet, correct, numericAnswer) {
  if (!packet.challenge || !api) {
    return;
  }

  const beforeSummary = api.getStateSummary();
  const answerSnippet = typeof numericAnswer === "string" && numericAnswer.trim() !== ""
    ? ` with answer ${numericAnswer.trim()}`
    : "";
  lastAction = {
    kind: "challenge",
    topic: packet.challenge.topic,
    correct,
    beforeSummary,
    label: correct ? "challenge correct" : "challenge incorrect",
    heading: `${packet.challenge.topic} marked ${correct ? "correct" : "incorrect"}${answerSnippet}`,
    response: api.submitChallengeOutcome({
      topic: packet.challenge.topic,
      correct,
      mode: packet.challenge.mode
    })
  };
  applyFalloutRouting(lastAction);
  refreshPackets();
  setStatus(correct ? "Nice. Answer checked as correct." : "Answer checked as incorrect. Try the next task.");
}

function handleAdvanceTime() {
  if (!api) {
    return;
  }

  const beforeSummary = api.getStateSummary();
  const hours = Number.parseInt(elements.advanceHours.value, 10);
  if (!Number.isInteger(hours) || hours <= 0) {
    setStatus("Please enter a whole number greater than zero.");
    return;
  }

  lastAction = {
    kind: "time",
    beforeSummary,
    label: "advance time",
    heading: `Advanced simulation by ${hours}h`,
    response: api.advanceTime(hours)
  };
  applyFalloutRouting(lastAction);
  refreshPackets();
}

function renderTrayState(state, packetCount) {
  elements.trayState.textContent = state;
  elements.packetCount.textContent = `${packetCount} packet${packetCount === 1 ? "" : "s"} in queue`;
  elements.openNext.disabled = packetCount === 0;
  elements.trayAnchor.setAttribute(
    "aria-label",
    `In-Tray ${state}. ${packetCount} packet${packetCount === 1 ? "" : "s"} available.`
  );
}

function renderPacket(packet, index) {
  const article = document.createElement("article");
  article.className = "packet";
  const isCrisisVariant = Boolean(packet.challenge?.timed) || Boolean(latestSummary && URGENT_TEMPOS.has(latestSummary.currentTempo));
  if (isCrisisVariant) {
    article.classList.add("packet-crisis");
  }

  const kicker = document.createElement("p");
  kicker.className = "doc-kicker";
  kicker.textContent = isCrisisVariant ? "Crisis packet" : "Event/Decision brief";
  article.append(kicker);

  const header = document.createElement("div");
  header.className = "packet-header";

  const title = document.createElement("h3");
  title.textContent = packet.eventCard?.title ?? `Packet ${index + 1}`;

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = packet.band;

  header.append(title, badge);
  article.append(header);

  article.append(buildSection("Briefing", packet.eventCard?.description ?? "No event card supplied for this packet."));

  if (packet.challenge) {
    const timer = packet.challenge.timed && packet.challenge.timerSeconds
      ? `Timed: ${packet.challenge.timerSeconds}s`
      : `Mode: ${packet.challenge.mode}`;
    article.append(buildSection("Decision task", packet.challenge.prompt, `${packet.challenge.topic} | ${timer}`));

    const form = document.createElement("form");
    form.className = "challenge-form";
    form.setAttribute("aria-label", `Challenge response for ${packet.challenge.topic}`);

    const answerLabel = document.createElement("label");
    answerLabel.textContent = "Numeric answer";

    const answerInput = document.createElement("input");
    answerInput.type = "number";
    answerInput.step = "any";
    answerInput.inputMode = "decimal";
    answerInput.required = true;
    answerInput.placeholder = "Enter value";
    answerInput.setAttribute("aria-label", "Numeric answer input");
    answerLabel.append(answerInput);

    const helper = document.createElement("p");
    helper.className = "challenge-help";
    helper.textContent = "Type your number and press Check answer.";

    const actions = document.createElement("div");
    actions.className = "packet-actions";

    const submitAnswer = document.createElement("button");
    submitAnswer.type = "submit";
    submitAnswer.textContent = "Check answer";

    actions.append(submitAnswer);
    form.append(answerLabel, helper, actions);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!answerInput.reportValidity()) {
        return;
      }
      const entered = Number(answerInput.value);
      const expected = packet.challenge.expectedAnswer;
      const tolerance = packet.challenge.tolerance ?? 0;
      const correct = typeof expected === "number"
        ? Math.abs(entered - expected) <= tolerance
        : true;
      handleChallengeOutcome(packet, correct, answerInput.value);
    });
    article.append(form);
  }

  if (packet.scene) {
    const sceneSection = document.createElement("section");
    sceneSection.className = "scene-attachment";

    const sceneHeading = document.createElement("h4");
    sceneHeading.textContent = "Attached scene memo";

    const sceneBody = document.createElement("p");
    sceneBody.textContent = packet.scene.text;

    const sceneMeta = document.createElement("p");
    sceneMeta.className = "meta";
    sceneMeta.textContent = `NPC: ${packet.scene.npcId}`;

    sceneSection.append(sceneHeading, sceneBody, sceneMeta);
    article.append(sceneSection);
  }

  return article;
}

function renderPacketFocus() {
  if (activePacketIndex < 0 || !currentPackets[activePacketIndex]) {
    elements.packetFullscreenToggle.disabled = true;
    elements.packetFocus.replaceChildren(
      Object.assign(document.createElement("p"), {
        textContent: "No active packet selected. Open the tray to pull the next packet into focus."
      })
    );
    elements.packetFocus.removeAttribute("aria-label");
    return;
  }

  elements.packetFullscreenToggle.disabled = false;
  const packet = currentPackets[activePacketIndex];
  elements.packetFocus.setAttribute(
    "aria-label",
    `Active packet ${activePacketIndex + 1}: ${packet.eventCard?.title ?? "Untitled packet"}`
  );
  elements.packetFocus.replaceChildren(renderPacket(packet, activePacketIndex));
}

function setActivePacket(index) {
  if (index < 0 || index >= currentPackets.length) {
    activePacketIndex = -1;
    renderPacketFocus();
    return;
  }

  activePacketIndex = index;
  renderPacketFocus();
  renderPacketQueue();
  elements.packetFocus.focus({ preventScroll: true });
}

function renderPacketQueue() {
  if (currentPackets.length === 0) {
    elements.packets.replaceChildren(
      Object.assign(document.createElement("p"), {
        textContent: "Tray is clear. Advance time or refresh to continue."
      })
    );
    return;
  }

  elements.packets.replaceChildren(
    ...currentPackets.map((packet, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `queue-item${index === activePacketIndex ? " active" : ""}`;
      button.textContent = packet.eventCard?.title ?? `Packet ${index + 1}`;
      button.addEventListener("click", () => {
        setActivePacket(index);
      });
      return button;
    })
  );
}

function openNextPacketFromTray() {
  if (currentPackets.length === 0) {
    setStatus("In-Tray is idle. No packet available to open.");
    return;
  }

  const nextIndex = activePacketIndex < 0 ? 0 : Math.min(activePacketIndex + 1, currentPackets.length - 1);
  setActivePacket(nextIndex);
  if (isNarrowViewport()) {
    setPacketFullscreen(true);
  }
  setStatus("Task opened. Read it, then press Check answer.");
}

function findPrimaryTaskTarget() {
  if (activePacketIndex >= 0) {
    return elements.packetFocus.querySelector("input, button") || elements.packetFocus;
  }
  return elements.openNext;
}

function routePriorityTarget(target) {
  if (target === "packet") {
    const primary = findPrimaryTaskTarget();
    primary.focus({ preventScroll: true });
    if (primary instanceof HTMLElement && primary.scrollIntoView) {
      primary.scrollIntoView({ behavior: reducedMotionEnabled ? "auto" : "smooth", block: "center" });
    }
    return;
  }
  if (target === "phone") {
    focusSurface(elements.phoneSurface);
    return;
  }
  if (target === "record") {
    focusSurface(elements.recordSurface);
    return;
  }
  if (target === "bubble") {
    focusSurface(elements.bubbleSurface);
    return;
  }
  if (target === "cabinet") {
    focusSurface(elements.cabinetSurface);
    return;
  }
  elements.trayAnchor.focus({ preventScroll: true });
}

function resolveTopPriority() {
  if (shellTier !== "tier2" && shellTier !== "tier3") {
    setStatus("Resolve top priority is available in Tier 2 or Tier 3.");
    return;
  }

  const top = whipQueueItems[0];
  if (!top) {
    setStatus("No whip priority is active right now.");
    return;
  }

  routePriorityTarget(top.target);
  setStatus(`Priority routed: ${top.title}.`);
}

function runCrisisTriage() {
  if (shellTier !== "tier3") {
    setStatus("Run crisis triage is available in Tier 3.");
    return;
  }
  if (cabinetGridItems.length === 0) {
    setStatus("No cabinet directives are active right now.");
    return;
  }

  const topWhipTarget = whipQueueItems[0]?.target ?? "packet";
  routePriorityTarget(topWhipTarget);
  const topCabinet = cabinetGridItems[0];
  if (topCabinet?.lane === "media") {
    focusSurface(elements.phoneSurface);
  } else if (topCabinet?.lane === "political") {
    focusSurface(elements.recordSurface);
  } else if (topCabinet?.lane === "risk") {
    focusSurface(elements.bubbleSurface);
  }

  setStatus(`Tier 3 triage routed: ${topCabinet.title}.`);
}

function maybeRenderInterrupt(summary, trayState) {
  const top = collisionQueueItems[0];
  const urgentFallout = smartphoneBatches[0]?.urgent === true;
  const isUrgent = Boolean(top && top.priority <= 2) || trayState === "urgent" || urgentFallout;
  const interruptKey = `${summary.timeHours}:${summary.currentTempo}:${trayState}:${top?.type ?? "none"}:${urgentFallout ? "fallout" : "normal"}`;
  const shouldShow = isUrgent && dismissedInterruptKey !== interruptKey;

  if (!shouldShow) {
    elements.interrupt.classList.add("hidden");
    return;
  }

  elements.interrupt.classList.remove("hidden");
  if (top?.type === "crisis_interrupt") {
    elements.interruptTitle.textContent = "Crisis interruption";
    elements.interruptBody.textContent = top.detail;
  } else if (top?.type === "timed_challenge") {
    elements.interruptTitle.textContent = "Timed challenge pressure";
    elements.interruptBody.textContent = top.detail;
  } else if (urgentFallout) {
    elements.interruptTitle.textContent = "Urgent fallout alert";
    elements.interruptBody.textContent = "High-priority consequences were routed to Smartphone. Use return to continue the active packet path.";
  } else {
    elements.interruptTitle.textContent = `${formatTempo(summary.currentTempo)} pressure state`;
    elements.interruptBody.textContent = "Urgent state is active. Use In-Tray or active packet to clear priority work.";
  }
  elements.interruptDismiss.onclick = () => {
    dismissedInterruptKey = interruptKey;
    elements.interrupt.classList.add("hidden");
    setStatus("Urgent alert acknowledged.");
  };
  elements.interruptReturn.onclick = () => {
    const target = findPrimaryTaskTarget();
    target.focus();
    setStatus("Back to your main task.");
  };
}

function refreshPackets() {
  if (!api) {
    return;
  }

  const summary = api.getStateSummary();
  const progression = api.getProgressionStatus();
  const retrospective = api.getRetrospectiveReport({ playerAlias: "prototype-shell" });
  currentPackets = api.getCurrentPacketBatch();
  latestSummary = summary;

  if (activePacketIndex < 0 && currentPackets.length > 0) {
    activePacketIndex = 0;
  } else if (activePacketIndex >= currentPackets.length) {
    activePacketIndex = currentPackets.length > 0 ? 0 : -1;
  }
  if (currentPackets.length === 0) {
    setPacketFullscreen(false);
  }
  if (!isNarrowViewport() && packetFullscreen) {
    setPacketFullscreen(false);
  }

  const trayState = computeTrayState(summary, currentPackets);
  const pressureProfile = getTempoProfile(summary.currentTempo);
  setTempoVisualState(summary.currentTempo);
  collisionQueueItems = buildCollisionQueue(summary, trayState);
  whipQueueItems = buildWhipQueue(summary, trayState);
  cabinetGridItems = buildCabinetGrid(summary, trayState);

  renderSummary(summary);
  renderProgression(progression);
  renderRetrospective(retrospective);
  renderRunComparison();
  renderTrayState(trayState, currentPackets.length);
  renderPacketQueue();
  renderPacketFocus();
  elements.packetFocus.classList.remove("pressure-high", "pressure-medium");
  if (pressureProfile.pressureClass === "crisis" || pressureProfile.pressureClass === "media_storm") {
    elements.packetFocus.classList.add("pressure-high");
  } else if (pressureProfile.pressureClass === "parliamentary") {
    elements.packetFocus.classList.add("pressure-medium");
  }
  renderActionResult();
  renderFalloutSurfaces();
  renderCollisionQueue();
  renderWhipQueue();
  renderCabinetGrid();
  maybeRenderInterrupt(summary, trayState);
  updateNextStep(trayState);

  const topCollision = collisionQueueItems[0]?.type ?? "none";
  const cueKey = `${summary.currentTempo}:${topCollision}`;
  if (summary.currentTempo !== lastTempoForCue || (collisionQueueItems[0] && cueKey !== lastCollisionCueKey)) {
    playPressureCue(summary, topCollision);
    lastTempoForCue = summary.currentTempo;
    lastCollisionCueKey = cueKey;
  }

  const focusOrder = shellTier === "tier3"
    ? SURFACE_FOCUS_ORDER_TIER3
    : (shellTier === "tier2" ? SURFACE_FOCUS_ORDER_TIER2 : SURFACE_FOCUS_ORDER_TIER1);
  elements.focusOrderStamp.textContent = focusOrder.join(" -> ");
  setStatus("Ready. Follow the step guide above.");
}

function focusSurface(surface) {
  surface.scrollIntoView({ behavior: reducedMotionEnabled ? "auto" : "smooth", block: "center" });
  surface.focus({ preventScroll: true });
}

async function loadBundle() {
  const response = await fetch("/content/vertical-slice.json");
  if (!response.ok) {
    throw new Error(`Failed to load content bundle (${response.status})`);
  }
  const bundle = await response.json();
  validateContentBundle(bundle);
  return bundle;
}

async function boot() {
  setStatus("Loading vertical slice content…");
  const bundle = await loadBundle();
  lastAction = null;
  dismissedInterruptKey = null;
  falloutBatchCounter = 0;
  smartphoneBatches = [];
  recordLens = null;
  bubbleShadowLead = null;
  supplementItems = [];
  collisionQueueItems = [];
  whipQueueItems = [];
  cabinetGridItems = [];
  lastTempoForCue = null;
  lastCollisionCueKey = "";
  currentPackets = [];
  activePacketIndex = -1;
  latestSummary = null;
  setPacketFullscreen(false);
  setTempoVisualState("parliamentary");
  elements.phoneSurface.classList.remove("urgent-physical");
  api = await PrototypeApi.create({
    schoolYear: elements.schoolYear.value,
    contentBundle: bundle
  });
  refreshPackets();
}

function wireEvents() {
  if (elements.detailsToggle) {
    elements.detailsToggle.addEventListener("click", () => {
      detailsVisible = !detailsVisible;
      applyDetailsVisibility();
      setStatus(detailsVisible ? "Extra panels shown." : "Simple view shown.");
    });
  }

  elements.trayAnchor.addEventListener("click", () => {
    openNextPacketFromTray();
  });
  elements.openNext.addEventListener("click", () => {
    openNextPacketFromTray();
  });
  elements.packetFullscreenToggle.addEventListener("click", () => {
    setPacketFullscreen(true);
    setStatus("Packet is now fullscreen.");
  });
  elements.packetFullscreenClose.addEventListener("click", () => {
    setPacketFullscreen(false);
    setStatus("Back to standard view.");
  });
  elements.audioToggle.addEventListener("click", () => {
    audioEnabled = !audioEnabled;
    elements.audioToggle.textContent = audioEnabled ? "Disable sound hints" : "Enable sound hints";
    elements.audioState.textContent = audioEnabled ? "Sound hints on." : "Sound hints off.";
    if (audioEnabled) {
      const ctx = ensureAudioContext();
      if (!ctx) {
        audioEnabled = false;
        elements.audioToggle.textContent = "Enable audio cues";
        elements.audioState.textContent = "Sound unavailable; visual hints only.";
      } else {
        playPressureCue(latestSummary ?? { currentTempo: "parliamentary" }, "manual_toggle");
      }
    }
  });
  if (elements.cleanReadToggle) {
    elements.cleanReadToggle.addEventListener("change", () => {
      cleanReadEnabled = elements.cleanReadToggle.checked;
      applyAccessibilityModes();
      persistAccessibilityModes();
      setStatus(cleanReadEnabled ? "Clean-read mode enabled." : "Clean-read mode disabled.");
    });
  }
  if (elements.reducedMotionToggle) {
    elements.reducedMotionToggle.addEventListener("change", () => {
      reducedMotionEnabled = elements.reducedMotionToggle.checked;
      applyAccessibilityModes();
      persistAccessibilityModes();
      setStatus(reducedMotionEnabled ? "Reduced-motion mode enabled." : "Reduced-motion mode disabled.");
    });
  }

  elements.refresh.addEventListener("click", () => {
    refreshPackets();
  });
  if (elements.saveRun) {
    elements.saveRun.addEventListener("click", () => {
      saveCurrentRunSnapshot();
    });
  }
  if (elements.compareRuns) {
    elements.compareRuns.addEventListener("click", () => {
      renderRunComparison();
      setStatus("Compared latest saved runs.");
    });
  }
  if (elements.clearRuns) {
    elements.clearRuns.addEventListener("click", () => {
      clearSavedRunSnapshots();
    });
  }

  if (elements.shellTier) {
    elements.shellTier.addEventListener("change", () => {
      setShellTier(elements.shellTier.value);
      refreshPackets();
      setStatus(shellTier === "tier3" ? "Tier 3 shell active." : (shellTier === "tier2" ? "Tier 2 shell active." : "Tier 1 shell active."));
    });
  }
  if (elements.resolvePriority) {
    elements.resolvePriority.addEventListener("click", () => {
      resolveTopPriority();
    });
  }
  if (elements.runTriage) {
    elements.runTriage.addEventListener("click", () => {
      runCrisisTriage();
    });
  }

  elements.advance.addEventListener("click", () => {
    handleAdvanceTime();
  });

  elements.restart.addEventListener("click", async () => {
    try {
      await boot();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to restart prototype shell.");
    }
  });

  elements.phoneAnchor.addEventListener("click", () => {
    focusSurface(elements.phoneSurface);
    setStatus("Smartphone anchor opened immediate fallout surface.");
  });
  if (elements.whipAnchor) {
    elements.whipAnchor.addEventListener("click", () => {
      focusSurface(elements.whipSurface);
      setStatus("Whip Board opened current priority directives.");
    });
  }
  if (elements.cabinetAnchor) {
    elements.cabinetAnchor.addEventListener("click", () => {
      focusSurface(elements.cabinetSurface);
      setStatus("Cabinet Grid opened stacked pressure directives.");
    });
  }
  elements.recordAnchor.addEventListener("click", () => {
    focusSurface(elements.recordSurface);
    playPaperRustleCue("The Record");
    setStatus("The Record anchor opened official summary surface.");
  });
  elements.bubbleAnchor.addEventListener("click", () => {
    focusSurface(elements.bubbleSurface);
    playPaperRustleCue("The Bubble");
    setStatus("The Bubble anchor opened narrative event wire.");
  });
  elements.supplementAnchor.addEventListener("click", () => {
    focusSurface(elements.supplementSurface);
    playPaperRustleCue("The Supplement");
    setStatus("The Supplement anchor opened optional enrichment surface.");
  });
  elements.lampAnchor.addEventListener("click", () => {
    setStatus("Lamp fallback activated. Save/Quit action remains available through explicit controls.");
  });

  window.addEventListener("keydown", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      return;
    }

    if (event.key === "Escape" && packetFullscreen) {
      setPacketFullscreen(false);
      setStatus("Exited fullscreen.");
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "t") {
      elements.trayAnchor.focus();
      return;
    }
    if (key === "p") {
      focusSurface(elements.packetFocus);
      return;
    }
    if (key === "s") {
      focusSurface(elements.phoneSurface);
      return;
    }
    if (key === "r") {
      focusSurface(elements.recordSurface);
      return;
    }
    if (key === "w" && (shellTier === "tier2" || shellTier === "tier3")) {
      focusSurface(elements.whipSurface);
      return;
    }
    if (key === "g" && shellTier === "tier3") {
      focusSurface(elements.cabinetSurface);
      return;
    }
    if (key === "b") {
      focusSurface(elements.bubbleSurface);
      return;
    }
    if (key === "u") {
      focusSurface(elements.supplementSurface);
    }
  });
  window.addEventListener("resize", () => {
    if (!isNarrowViewport() && packetFullscreen) {
      setPacketFullscreen(false);
    }
  });
}

loadAccessibilityModes();
loadSavedRetrospectiveRuns();
applyDetailsVisibility();
setShellTier("tier1");
wireEvents();

boot().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Prototype shell failed to boot.");
});
