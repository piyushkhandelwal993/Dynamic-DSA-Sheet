import test from "node:test";
import assert from "node:assert/strict";
import { getTopicProblems } from "../services/storage";
import { recommendAfterSubmission, recommendNextProblem } from "../services/recommendation";
import { createInitialProgress, createInitialSkillProfile } from "../services/storage";
import { Problem, ProgressState, SkillProfile } from "../types";
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

function makeProblem(overrides: Partial<Problem> & Pick<Problem, "id" | "expectedConcepts">): Problem {
  return {
    topic: "Arrays",
    subtopic: "Traversal basics",
    title: overrides.id,
    difficulty: "Easy",
    platform: "Custom",
    url: "",
    prerequisiteConcepts: [],
    expectedComplexity: "O(n)",
    estimatedMinutes: 10,
    hints: [],
    examples: [],
    remedialProblems: [],
    skipIfMastered: [],
    ...overrides
  };
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

test("adaptive pool recommends review problems before core when a concept is weak", () => {
  const problems = [
    makeProblem({ id: "core-001", expectedConcepts: ["prefix-sum"], poolRole: "core" }),
    makeProblem({ id: "practice-001", expectedConcepts: ["prefix-sum"], poolRole: "practice" }),
    makeProblem({ id: "review-001", expectedConcepts: ["prefix-sum"], poolRole: "review" }),
    makeProblem({ id: "challenge-001", expectedConcepts: ["prefix-sum"], difficulty: "Medium", poolRole: "challenge" })
  ];

  const recommendation = recommendNextProblem(
    problems,
    makeProgress(),
    makeSkillProfile({
      weakConcepts: ["prefix-sum"],
      conceptScores: {
        "prefix-sum": 42
      }
    })
  );

  assert.equal(recommendation.problem?.id, "review-001");
  assert.match(recommendation.reasons.join(" "), /Review and practice pool/);
});

test("adaptive pool recommends challenge problems for strong concepts", () => {
  const problems = [
    makeProblem({ id: "core-001", expectedConcepts: ["two-pointers"], poolRole: "core" }),
    makeProblem({ id: "practice-001", expectedConcepts: ["two-pointers"], poolRole: "practice" }),
    makeProblem({
      id: "challenge-001",
      expectedConcepts: ["two-pointers"],
      difficulty: "Medium",
      poolRole: "challenge",
      masteryWeight: 1.4
    })
  ];

  const recommendation = recommendNextProblem(
    problems,
    makeProgress(),
    makeSkillProfile({
      strongConcepts: ["two-pointers"],
      conceptScores: {
        "two-pointers": 86
      }
    })
  );

  assert.equal(recommendation.problem?.id, "challenge-001");
});

test("adaptive extra practice prefers review pool variants after low code quality", () => {
  const current = makeProblem({ id: "arr-current", expectedConcepts: ["array-traversal"], poolRole: "core" });
  const problems = [
    current,
    makeProblem({ id: "arr-core", expectedConcepts: ["array-traversal"], poolRole: "core" }),
    makeProblem({ id: "arr-practice", expectedConcepts: ["array-traversal"], poolRole: "practice" }),
    makeProblem({ id: "arr-review", expectedConcepts: ["array-traversal"], poolRole: "review" })
  ];

  const recommendation = recommendAfterSubmission(
    current,
    problems,
    makeProgress(),
    makeSkillProfile({ weakConcepts: ["array-traversal"] }),
    {
      finalScore: 72,
      conceptMatchScore: 80,
      qualityScore: 40,
      complexityScore: 80
    },
    {
      detected: [],
      warnings: [],
      signals: makeSignals({ usesArrayTraversal: true })
    }
  );

  assert.equal(recommendation.type, "extra-practice");
  assert.equal(recommendation.suggestedProblemIds[0], "arr-review");
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

test("strong guided solve recommends the matching complete-program milestone", () => {
  const problems = getTopicProblems("arrays");
  const problem = problems.find((item) => item.id === "arr-001");
  assert.ok(problem);

  const recommendation = recommendAfterSubmission(
    problem,
    problems,
    makeProgress(),
    makeSkillProfile(),
    {
      finalScore: 94,
      conceptMatchScore: 100,
      qualityScore: 90,
      complexityScore: 90
    },
    {
      detected: [],
      warnings: [],
      signals: makeSignals({ usesArrayTraversal: true })
    }
  );

  assert.equal(recommendation.problem?.id, "arr-004");
  assert.match(recommendation.message, /complete program/i);
  assert.equal(recommendation.suggestedProblemIds[0], "arr-004");
});

test("next-problem recommendation prioritizes independence after guided mastery", () => {
  const problems = getTopicProblems("trees");
  const skillProfile = makeSkillProfile();
  skillProfile.conceptScores["tree-height"] = 90;
  skillProfile.conceptAttempts["tree-height"] = 2;
  skillProfile.implementationScores["tree-height"] = 60;
  skillProfile.implementationAttempts["tree-height"] = 2;

  const recommendation = recommendNextProblem(problems, makeProgress(), skillProfile);

  assert.equal(recommendation.problem?.id, "tr-006");
  assert.match(recommendation.message, /Implementation milestone/);
  assert.deepEqual(recommendation.conceptIds, ["tree-height"]);
});

test("solved independence milestones are not recommended again", () => {
  const problems = getTopicProblems("linked-list");
  const progress = makeProgress();
  progress.problems["ll-009"] = {
    problemId: "ll-009",
    status: "solved",
    attempts: 1,
    bestScore: 90
  };
  const skillProfile = makeSkillProfile();
  skillProfile.conceptScores["ll-reverse"] = 90;
  skillProfile.implementationScores["ll-reverse"] = 60;

  const recommendation = recommendNextProblem(problems, progress, skillProfile);

  assert.notEqual(recommendation.problem?.id, "ll-009");
});

test("guided stack solve routes to its complete-program milestone", () => {
  const problems = getTopicProblems("stack");
  const problem = problems.find((item) => item.id === "st-002");
  assert.ok(problem);

  const recommendation = recommendAfterSubmission(
    problem,
    problems,
    makeProgress(),
    makeSkillProfile(),
    { finalScore: 92, conceptMatchScore: 100, qualityScore: 90, complexityScore: 90 },
    {
      detected: [],
      warnings: [],
      signals: makeSignals({ usesStackStructure: true, usesParenthesisMatching: true })
    }
  );

  assert.equal(recommendation.problem?.id, "st-011");
});

test("guided queue and binary search concepts have milestone routes", () => {
  const queueProfile = makeSkillProfile();
  queueProfile.conceptScores["queue-simulation"] = 88;
  queueProfile.implementationScores["queue-simulation"] = 60;
  assert.equal(recommendNextProblem(getTopicProblems("queue"), makeProgress(), queueProfile).problem?.id, "q-005");

  const searchProfile = makeSkillProfile();
  searchProfile.conceptScores["binary-search-intro"] = 90;
  searchProfile.implementationScores["binary-search-intro"] = 60;
  assert.equal(recommendNextProblem(getTopicProblems("binary-search"), makeProgress(), searchProfile).problem?.id, "bs-003");
});

test("recursion graph and DP guided concepts have milestone routes", () => {
  const recursionProfile = makeSkillProfile();
  recursionProfile.conceptScores["functional-recursion"] = 90;
  recursionProfile.implementationScores["functional-recursion"] = 60;
  assert.equal(recommendNextProblem(getTopicProblems("recursion"), makeProgress(), recursionProfile).problem?.id, "rec-012");

  const graphProfile = makeSkillProfile();
  graphProfile.conceptScores["bfs-graph"] = 90;
  graphProfile.implementationScores["bfs-graph"] = 60;
  assert.equal(recommendNextProblem(getTopicProblems("graphs"), makeProgress(), graphProfile).problem?.id, "gr-011");

  const dpProfile = makeSkillProfile();
  dpProfile.conceptScores["dp-intro"] = 90;
  dpProfile.implementationScores["dp-intro"] = 60;
  assert.equal(recommendNextProblem(getTopicProblems("dp"), makeProgress(), dpProfile).problem?.id, "dp-002");
});
