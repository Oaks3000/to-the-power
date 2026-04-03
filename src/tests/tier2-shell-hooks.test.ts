import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

function includesAll(input: string, snippets: string[]): boolean {
  return snippets.every((snippet) => input.includes(snippet));
}

test("Tier 2 and Tier 3 shell markers are present in prototype markup and flow hooks", () => {
  const html = readFileSync(resolve(process.cwd(), "prototype/index.html"), "utf8");
  const appJs = readFileSync(resolve(process.cwd(), "prototype/app.js"), "utf8");

  const requiredHtml = [
    "id=\"shell-tier\"",
    "id=\"resolve-priority\"",
    "id=\"run-triage\"",
    "id=\"whip-anchor\"",
    "id=\"whip-surface\"",
    "id=\"whip-queue\"",
    "id=\"cabinet-anchor\"",
    "id=\"cabinet-surface\"",
    "id=\"cabinet-grid\""
  ];
  const requiredFlowHooks = [
    "setShellTier(",
    "buildWhipQueue(",
    "buildCabinetGrid(",
    "renderWhipQueue(",
    "renderCabinetGrid(",
    "resolveTopPriority(",
    "runCrisisTriage("
  ];

  assert.equal(includesAll(html, requiredHtml), true);
  assert.equal(includesAll(appJs, requiredFlowHooks), true);
});
