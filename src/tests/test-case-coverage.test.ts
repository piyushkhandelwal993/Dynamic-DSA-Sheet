import test from "node:test";
import assert from "node:assert/strict";
import { topicPacks } from "../data/topics";
import { getCuratedBoundaryCases, getExecutionTestCases } from "../services/problemTestCases";
import {
  buildTestCaseCoverageReport,
  testCaseCoverageMeetsReleaseFloor,
  testCaseReleaseFloor
} from "../services/testCaseCoverage";

const curatedProblemIds = [
  "bit-002",
  "bit-004",
  "bit-005",
  "bit-006",
  "bit-007",
  "bit-008",
  "bit-009",
  "bit-010",
  "bit-011",
  "bit-012",
  "bit-013",
  "bit-014",
  "bit-015",
  "bit-016",
  "bit-017",
  "bit-018",
  "bit-019",
  "bit-020",
  "bit-021",
  "bit-022",
  "bit-023",
  "bit-024",
  "bit-025",
  "bit-026",
  "bit-027",
  "bit-029",
  "bit-030",
  "bit-032",
  "bit-033",
  "bit-035",
  "bit-036",
  "bit-037",
  "bit-038",
  "bit-039",
  "bit-040",
  "rec-002",
  "rec-004",
  "rec-005",
  "rec-006",
  "rec-007",
  "rec-008",
  "rec-009",
  "rec-010",
  "rec-012"
];

test("curated foundational problems have meaningful hidden boundary cases", () => {
  curatedProblemIds.forEach((problemId) => {
    const cases = getCuratedBoundaryCases(problemId);
    assert.ok(cases.length >= 3, `${problemId} should have at least three cases`);
    assert.ok(cases.filter((testCase) => testCase.visibility === "hidden").length >= 2, `${problemId} needs hidden boundaries`);
    cases.forEach((testCase) => {
      assert.notEqual(testCase.input, "");
      assert.notEqual(testCase.expectedOutput, "");
    });
  });
});

test("execution cases prefer authoritative configured or curated cases", () => {
  const problem = topicPacks["bit-manipulation"].problems.find((candidate) => candidate.id === "bit-002");
  assert.ok(problem);

  const cases = getExecutionTestCases(problem);
  assert.equal(cases.length, 3);
  assert.equal(cases.filter((testCase) => testCase.visibility === "hidden").length, 2);
});

test("curated problems expose canonical input and output contracts", () => {
  const problems = Object.values(topicPacks).flatMap((topicPack) => topicPack.problems);

  curatedProblemIds.forEach((problemId) => {
    const problem = problems.find((candidate) => candidate.id === problemId);
    assert.ok(problem, `${problemId} should exist`);
    assert.ok(problem.inputFormat?.length, `${problemId} needs a canonical input format`);
    assert.ok(problem.outputFormat?.length, `${problemId} needs a canonical output format`);
  });
});

test("catalog test-case coverage meets the release floor", () => {
  const report = buildTestCaseCoverageReport();

  assert.equal(report.totalProblems, 175);
  assert.equal(report.executableCoverage, testCaseReleaseFloor.executableCoverage);
  assert.ok(report.hiddenCoverage >= testCaseReleaseFloor.hiddenCoverage);
  assert.equal(report.missingProblems, 0);
  assert.equal(testCaseCoverageMeetsReleaseFloor(report), true);
});
