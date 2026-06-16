import test from "node:test";
import assert from "node:assert/strict";
import { getTopicProblems } from "../services/storage";
import { scoreSubmission } from "../services/scoring";
import { makeSignals } from "./helpers";

test("scoring penalizes constant-time problems solved with string conversion and loops", () => {
  const problem = getTopicProblems("bit-manipulation").find((item) => item.id === "bit-003");
  assert.ok(problem);

  const score = scoreSubmission(
    problem,
    {
      detected: [],
      warnings: [],
      signals: makeSignals({
        usesStringConversion: true,
        hasUnnecessaryLoop: true,
        missingEdgeCaseHandling: true
      })
    },
    {
      matchedConcepts: [],
      missingConcepts: problem.expectedConcepts
    }
  );

  assert.equal(score.correctnessScore, 55);
  assert.equal(score.complexityScore, 45);
  assert.ok(score.finalScore < 60);
});

test("scoring drops clearly wrong bit submissions with no concept evidence", () => {
  const problem = getTopicProblems("bit-manipulation").find((item) => item.id === "bit-003");
  assert.ok(problem);

  const score = scoreSubmission(
    problem,
    {
      detected: [],
      warnings: [],
      signals: makeSignals({
        hasUnnecessaryLoop: true,
        missingEdgeCaseHandling: true
      })
    },
    {
      matchedConcepts: [],
      missingConcepts: problem.expectedConcepts
    }
  );

  assert.equal(score.correctnessScore, 20);
  assert.equal(score.complexityScore, 25);
  assert.ok(score.finalScore < 35);
});

test("scoring drops clearly wrong recursion submissions with no recursion evidence", () => {
  const problem = getTopicProblems("recursion").find((item) => item.id === "rec-003");
  assert.ok(problem);

  const score = scoreSubmission(
    problem,
    {
      detected: [],
      warnings: [],
      signals: makeSignals({
        hasPoorVariableNames: true,
        missingEdgeCaseHandling: true
      })
    },
    {
      matchedConcepts: [],
      missingConcepts: problem.expectedConcepts
    }
  );

  assert.equal(score.correctnessScore, 15);
  assert.equal(score.complexityScore, 25);
  assert.ok(score.finalScore < 30);
});
