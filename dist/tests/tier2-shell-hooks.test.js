import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
function includesAll(input, snippets) {
    return snippets.every((snippet) => input.includes(snippet));
}
test("Tier 2 shell markers are present in prototype markup and app flow hooks", () => {
    const html = readFileSync(resolve(process.cwd(), "prototype/index.html"), "utf8");
    const appJs = readFileSync(resolve(process.cwd(), "prototype/app.js"), "utf8");
    const requiredHtml = [
        "id=\"shell-tier\"",
        "id=\"resolve-priority\"",
        "id=\"whip-anchor\"",
        "id=\"whip-surface\"",
        "id=\"whip-queue\""
    ];
    const requiredFlowHooks = [
        "setShellTier(",
        "buildWhipQueue(",
        "renderWhipQueue(",
        "resolveTopPriority("
    ];
    assert.equal(includesAll(html, requiredHtml), true);
    assert.equal(includesAll(appJs, requiredFlowHooks), true);
});
