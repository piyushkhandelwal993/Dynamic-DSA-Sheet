import test from "node:test";
import assert from "node:assert/strict";
import { getTopicProblems } from "../services/storage";
import { recommendAfterSubmission, recommendNextProblem } from "../services/recommendation";
import { createInitialProgress, createInitialSkillProfile } from "../services/storage";
import { ProgressState, SkillProfile } from "../types";
import { makeSignals } from "./helpers";

function makeSkillProfile(overrides?: Partial<SkillProfile>): SkillProfile {
  return {
    ...createInitialSkillProfile(),
    ...overrides
  };
}

function makeProgress(): ProgressState {
  return createInitialProgress();
}

test("recommendNextProblem prioritizes revision due first", () => {
  const problems = getTopicProblems("bit-manipulation");
  const progress = makeProgress();
  progress.problems["bit-003"] = {
    problemId: "bit-003",
    status: "solved",
    attempts: 1,
    bestScore: 84,
    nextRevisionDate: "2000-01-01"
  };

  const recommendation = recommendNextProblem(problems, progress, makeSkillProfile());
  assert.equal(recommendation.problem?.id, "bit-003");
  assert.equal(recommendation.type, "revise-prerequisite");
});

test("recommendAfterSubmission asks for same-problem retry on low concept match", () => {
  const problems = getTopicProblems("bit-manipulation");
  const problem = problems.find((item) => item.id === "bit-003");
  assert.ok(problem);

  const recommendation = recommendAfterSubmission(
    problem,
    problems,
    makeProgress(),
    makeSkillProfile(),
    {
      finalScore: 62,
      conceptMatchScore: 40,
      qualityScore: 80,
      complexityScore: 70
    },
    {
      detected: [],
      warnings: [],
      signals: makeSignals()
    }
  );

  assert.equal(recommendation.type, "revise-prerequisite");
  assert.equal(recommendation.conceptIds[0], "check-ith-bit");
  assert.equal(recommendation.suggestedProblemIds[0], "bit-003");
});

test("recommendAfterSubmission uses real progress for the next recommendation", () => {
  const problems = getTopicProblems("bit-manipulation");
  const problem = problems.find((item) => item.id === "bit-003");
  assert.ok(problem);

  const progress = makeProgress();
  progress.problems["bit-001"] = {
    problemId: "bit-001",
    status: "solved",
    attempts: 1,
    bestScore: 90
  };

  const skillProfile = makeSkillProfile({
    conceptScores: {
      ...createInitialSkillProfile().conceptScores,
      "check-ith-bit": 82,
      "bitwise-and": 82,
      "left-shift": 82
    }
  });

  const recommendation = recommendAfterSubmission(
    problem,
    problems,
    progress,
    skillProfile,
    {
      finalScore: 84,
      conceptMatchScore: 100,
      qualityScore: 85,
      complexityScore: 90
    },
    {
      detected: [],
      warnings: [],
      signals: makeSignals({
        usesAnd: true,
        usesLeftShift: true
      })
    }
  );

  assert.equal(recommendation.message.startsWith("Solid attempt."), true);
  assert.notEqual(recommendation.suggestedProblemIds[0], "bit-001");
});

test("strong mastery recommendation does not fall back to same-problem retry when no harder sibling exists", () => {
  const problems = getTopicProblems("bit-manipulation");
  const problem = problems.find((item) => item.id === "bit-003");
  assert.ok(problem);

  const progress = makeProgress();
  progress.problems["bit-003"] = {
    problemId: "bit-003",
    status: "solved",
    attempts: 1,
    bestScore: 95
  };

  const recommendation = recommendAfterSubmission(
    problem,
    problems,
    progress,
    makeSkillProfile(),
    {
      finalScore: 95,
      conceptMatchScore: 100,
      qualityScore: 75,
      complexityScore: 90
    },
    {
      detected: [],
      warnings: [],
      signals: makeSignals({
        usesAnd: true,
        usesLeftShift: true
      })
    }
  );

  assert.equal(recommendation.type, "move-forward");
  assert.notEqual(recommendation.suggestedProblemIds[0], "bit-003");
});

test("recommendAfterSubmission keeps modulo-only bit-001 solves in same-problem retry flow", () => {
  const problems = getTopicProblems("bit-manipulation");
  const problem = problems.find((item) => item.id === "bit-001");
  assert.ok(problem);

  const recommendation = recommendAfterSubmission(
    problem,
    problems,
    makeProgress(),
    makeSkillProfile(),
    {
      finalScore: 74,
      conceptMatchScore: 100,
      qualityScore: 80,
      complexityScore: 70
    },
    {
      detected: ["Used modulo/division approach"],
      warnings: [],
      signals: makeSignals({
        usesModuloDivision: true,
        hasUnnecessaryLoop: true
      })
    }
  );

  assert.equal(recommendation.type, "revise-prerequisite");
  assert.equal(recommendation.suggestedProblemIds[0], "bit-001");
});

test("recommendNextProblem prioritizes same-problem retry after non-bitwise foundation solve", () => {
  const problems = getTopicProblems("bit-manipulation");
  const progress = makeProgress();
  progress.problems["bit-001"] = {
    problemId: "bit-001",
    status: "solved",
    attempts: 1,
    bestScore: 74,
    approachTags: ["non-bitwise-foundation", "retry-required"],
    retryRequired: true,
    retryConceptIds: ["binary-representation"],
    retryReason: "The last solution was correct, but it did not use bit operators."
  };

  const recommendation = recommendNextProblem(problems, progress, makeSkillProfile());
  assert.equal(recommendation.type, "revise-prerequisite");
  assert.equal(recommendation.problem?.id, "bit-001");
});

test("recursion strong solve moves to the next curated problem", () => {
  const problems = getTopicProblems("recursion");
  const problem = problems.find((item) => item.id === "rec-013");
  assert.ok(problem);

  const progress = makeProgress();
  progress.problems["rec-013"] = {
    problemId: "rec-013",
    status: "solved",
    attempts: 1,
    bestScore: 95
  };

  const skillProfile = makeSkillProfile({
    conceptScores: {
      ...createInitialSkillProfile().conceptScores,
      "recursion-intro": 85,
      "backtracking-basics": 85,
      "subsequence-generation": 85
    },
    conceptStrongHits: {
      ...createInitialSkillProfile().conceptStrongHits,
      "recursion-intro": 3,
      "backtracking-basics": 3,
      "subsequence-generation": 3
    },
    strongConcepts: ["recursion-intro", "backtracking-basics", "subsequence-generation"]
  });

  const recommendation = recommendAfterSubmission(
    problem,
    problems,
    progress,
    skillProfile,
    {
      finalScore: 92,
      conceptMatchScore: 100,
      qualityScore: 85,
      complexityScore: 90
    },
    {
      detected: [],
      warnings: [],
      signals: makeSignals({
        hasRecursiveCall: true,
        hasBaseCase: true,
        hasMultipleRecursiveCalls: true,
        usesBacktrackingUndo: true
      })
    }
  );

  assert.equal(recommendation.problem?.id, "rec-014");
});

test("recursion strong solve respects sequence before difficulty jumps", () => {
  const problems = getTopicProblems("recursion");
  const problem = problems.find((item) => item.id === "rec-019");
  assert.ok(problem);

  const progress = makeProgress();
  progress.problems["rec-019"] = {
    problemId: "rec-019",
    status: "solved",
    attempts: 1,
    bestScore: 95
  };

  const skillProfile = makeSkillProfile({
    conceptScores: {
      ...createInitialSkillProfile().conceptScores,
      "tree-recursion": 85,
      "memoization": 85
    },
    conceptStrongHits: {
      ...createInitialSkillProfile().conceptStrongHits,
      "tree-recursion": 3,
      "memoization": 3
    },
    strongConcepts: ["tree-recursion", "memoization"]
  });

  const recommendation = recommendAfterSubmission(
    problem,
    problems,
    progress,
    skillProfile,
    {
      finalScore: 92,
      conceptMatchScore: 100,
      qualityScore: 85,
      complexityScore: 90
    },
    {
      detected: [],
      warnings: [],
      signals: makeSignals({
        hasRecursiveCall: true,
        hasBaseCase: true,
        hasMultipleRecursiveCalls: true,
        usesMemoization: true
      })
    }
  );

  assert.equal(recommendation.problem?.id, "rec-020");
});
