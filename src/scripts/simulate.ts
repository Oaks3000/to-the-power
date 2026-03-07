import { resolve } from "node:path";
import { GameService } from "../application/game-service.js";

async function run(): Promise<void> {
  const contentPath = resolve(process.cwd(), "content/vertical-slice.json");
  const service = new GameService({ schoolYear: "Y9" });
  await service.loadContent(contentPath);

  console.log("TTP tempo-timeline simulation");

  for (let step = 1; step <= 8; step += 1) {
    if (step === 2) {
      service.execute({ type: "change_tempo", tempo: "crisis" });
    }
    if (step === 4) {
      service.execute({ type: "change_tempo", tempo: "media_storm" });
    }
    if (step === 5) {
      service.execute({ type: "change_role", role: "pps" });
      service.execute({ type: "change_tempo", tempo: "parliamentary" });
    }
    if (step === 6) {
      service.execute({ type: "set_school_year", schoolYear: "Y10" });
      service.execute({ type: "change_role", role: "junior_minister" });
    }
    if (step === 7) {
      service.execute({ type: "change_tempo", tempo: "recess" });
    }

    const before = service.getState();
    const result = service.runCurrentEncounterBatch({
      defaultChallengeCorrect: step % 2 === 0
    });

    console.log(`\nstep ${step} | hour=${before.timeHours} | role=${before.currentRole} | tempo=${before.currentTempo} | packets=${result.selections.length}`);

    result.slotResults.forEach((slot, index) => {
      if (!slot.selection.eventCard) {
        console.log(`  [${index}] no eligible event card`);
        return;
      }
      console.log(`  [${index}] card: ${slot.selection.eventCard.title}`);
      if (slot.selection.challenge) {
        const outcome = slot.challengeResult?.events[0]?.payload.correct === true ? "correct" : "incorrect";
        console.log(`      challenge: ${slot.selection.challenge.id} -> ${outcome}`);
      }
      if (slot.selection.scene) {
        console.log(`      scene: ${slot.selection.scene.id}`);
      }
    });
  }

  const finalState = service.getState();
  console.log(`\nfinal hour: ${finalState.timeHours}`);
  console.log(`event log entries: ${finalState.eventLog.length}`);
  console.log(`pending remediations: ${finalState.pendingRemediations.length}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
