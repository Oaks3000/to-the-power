import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
function includesAll(input, snippets) {
    return snippets.every((snippet) => input.includes(snippet));
}
test("retrospective multi-run comparison hooks are present in shell markup and app flow", () => {
    const html = readFileSync(resolve(process.cwd(), "prototype/index.html"), "utf8");
    const appJs = readFileSync(resolve(process.cwd(), "prototype/app.js"), "utf8");
    const requiredHtml = [
        "id=\"save-run\"",
        "id=\"compare-runs\"",
        "id=\"clear-runs\"",
        "id=\"comparison-summary\"",
        "id=\"comparison-grid\""
    ];
    const requiredFlowHooks = [
        "loadSavedRetrospectiveRuns(",
        "persistSavedRetrospectiveRuns(",
        "renderRunComparison(",
        "saveCurrentRunSnapshot(",
        "clearSavedRunSnapshots(",
        "buildRetrospectiveComparison("
    ];
    assert.equal(includesAll(html, requiredHtml), true);
    assert.equal(includesAll(appJs, requiredFlowHooks), true);
});
