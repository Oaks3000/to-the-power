import assert from "node:assert/strict";
import test from "node:test";
import { getCurriculumBand } from "../domain/curriculum.js";
test("curriculum matrix resolves Year 11 junior minister as transition band", () => {
    assert.equal(getCurriculumBand("Y11", "junior_minister"), "Y10-11");
});
test("curriculum matrix resolves Year 10 cabinet as Year 10", () => {
    assert.equal(getCurriculumBand("Y10", "cabinet"), "Y10");
});
