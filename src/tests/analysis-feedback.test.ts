import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCodeFacts } from "../services/analysis-engine/analyzeCode";
import { getConceptExpectation } from "../services/analysis-engine/expectations";
import { buildExplainableFeedback } from "../services/analysis-engine/feedback";
import { matchProblemExpectations } from "../services/analysis-engine/matcher";
import { scoreArraySubmissionFromFacts, scoreBitSubmissionFromFacts, scoreSubmissionFromFacts } from "../services/analysis-engine/factScoring";
import { topicPacks } from "../data/topics";
import { getProblemById } from "../services/storage";

test("explainable feedback includes confidence, facts, and evidence", () => {
  const problem = getProblemById("bit-003");
  assert.ok(problem);
  const facts = analyzeCodeFacts(
    "cpp",
    `
      int solve(int value, int index) {
        if (index < 0) return 0;
        int mask = 1 << index;
        return (value & mask) == 0 ? 0 : 1;
      }
    `
  );
  const expectation = matchProblemExpectations(problem, facts);
  const score = scoreBitSubmissionFromFacts(problem, facts, expectation);
  const feedback = buildExplainableFeedback(problem, facts, expectation, score);

  assert.equal(feedback.detectedConcepts.length, problem.expectedConcepts.length);
  assert.equal(feedback.detectedConcepts.every((item) => item.confidence === "High"), true);
  assert.equal(feedback.detectedConcepts.every((item) => item.factIds.length > 0), true);
  assert.equal(feedback.detectedConcepts.every((item) => item.evidence.length > 0), true);
  assert.deepEqual(feedback.missingConcepts, []);
});

test("explainable feedback turns anti-patterns into actionable guidance", () => {
  const problem = getProblemById("arr-003");
  assert.ok(problem);
  const facts = analyzeCodeFacts(
    "cpp",
    `
      int solve(vector<int>& arr) {
        int answer = 0;
        for (int i = 0; i < arr.size(); i++) {
          for (int j = 0; j < arr.size(); j++) {
            if (arr[i] > arr[j]) answer = arr[i];
          }
        }
        return answer;
      }
    `
  );
  const expectation = matchProblemExpectations(problem, facts);
  const score = scoreArraySubmissionFromFacts(problem, facts, expectation);
  const feedback = buildExplainableFeedback(problem, facts, expectation, score);

  assert.equal(feedback.complexityReasoning.some((item) => item.includes("nested loop depth")), true);
  assert.equal(feedback.improvements.some((item) => item.includes("intended")), true);
  assert.equal(feedback.missingConcepts.length > 0, true);
});

test("every active problem concept has a facts-native expectation", () => {
  Object.values(topicPacks).forEach((pack) => {
    pack.problems.forEach((problem) => {
      problem.expectedConcepts.forEach((conceptId) => {
        assert.ok(
          getConceptExpectation(problem.id, conceptId),
          `${problem.id} is missing a facts-native expectation for ${conceptId}`
        );
      });
    });
  });
});

test("shared facts-native scorer supports every active topic", () => {
  Object.values(topicPacks).forEach((pack) => {
    const problem = pack.problems[0];
    const facts = analyzeCodeFacts("java", "class Main { public static void main(String[] args) {} }");
    const expectation = matchProblemExpectations(problem, facts);
    const score = scoreSubmissionFromFacts(problem, facts, expectation);

    assert.equal(Number.isFinite(score.finalScore), true, `${problem.topic} did not produce a score`);
  });
});
