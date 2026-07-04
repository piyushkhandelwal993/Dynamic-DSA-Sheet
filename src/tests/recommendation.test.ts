import test from "node:test";
import assert from "node:assert/strict";
import { getTopicProblems } from "../services/storage";
import { recommendAfterSubmission, recommendNextProblem } from "../services/recommendation";
import { createInitialProgress, createInitialSkillProfile } from "../services/storage";
import { Problem, ProgressState, SkillProfile } from "../types";
import { makeSignals } from "./helpers";
import { buildTopicConceptProgression, getNextUnlockedConceptId } from "../services/learningProgression";
import arraysConcepts from "../data/topics/arrays/concepts.json";
import arraysProblems from "../data/topics/arrays/problems.json";
import bitConcepts from "../data/topics/bit-manipulation/concepts.json";
import bitProblems from "../data/topics/bit-manipulation/problems.json";
import linkedListConcepts from "../data/topics/linked-list/concepts.json";
import linkedListProblems from "../data/topics/linked-list/problems.json";
import stackConcepts from "../data/topics/stack/concepts.json";
import stackProblems from "../data/topics/stack/problems.json";
import queueConcepts from "../data/topics/queue/concepts.json";
import queueProblems from "../data/topics/queue/problems.json";
import recursionConcepts from "../data/topics/recursion/concepts.json";
import recursionProblems from "../data/topics/recursion/problems.json";
import binarySearchConcepts from "../data/topics/binary-search/concepts.json";
import binarySearchProblems from "../data/topics/binary-search/problems.json";

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

test("next-step progression prefers the first introducing problem for a newly unlocked concept", () => {
  const base = makeProblem({ id: "base-001", expectedConcepts: ["array-traversal"] });
  const problems = [
    base,
    makeProblem({
      id: "core-002",
      expectedConcepts: ["sorted-check"],
      prerequisiteConcepts: ["array-traversal"],
      poolRole: "core"
    }),
    makeProblem({
      id: "challenge-002",
      expectedConcepts: ["sorted-check"],
      prerequisiteConcepts: ["array-traversal"],
      difficulty: "Medium",
      poolRole: "challenge"
    })
  ];

  const progress = makeProgress();
  progress.problems["base-001"] = {
    problemId: "base-001",
    status: "solved",
    attempts: 1,
    bestScore: 92
  };

  const recommendation = recommendNextProblem(
    problems,
    progress,
    makeSkillProfile({
      conceptScores: {
        ...createInitialSkillProfile().conceptScores,
        "array-traversal": 92
      },
      conceptStrongHits: {
        ...createInitialSkillProfile().conceptStrongHits,
        "array-traversal": 3
      },
      implementationScores: {
        ...createInitialSkillProfile().implementationScores,
        "array-traversal": 80
      },
      implementationStrongHits: {
        ...createInitialSkillProfile().implementationStrongHits,
        "array-traversal": 1
      }
    })
  );

  assert.equal(recommendation.problem?.id, "core-002");
  assert.deepEqual(recommendation.conceptIds, ["sorted-check"]);
});

test("next-step progression uses weak unlocked concepts as the immediate target", () => {
  const problems = [
    makeProblem({ id: "base-001", expectedConcepts: ["array-traversal"] }),
    makeProblem({
      id: "weak-review",
      expectedConcepts: ["prefix-sum"],
      prerequisiteConcepts: ["array-traversal"],
      poolRole: "review"
    }),
    makeProblem({
      id: "later-core",
      expectedConcepts: ["two-pointers"],
      prerequisiteConcepts: ["array-traversal"],
      poolRole: "core"
    })
  ];

  const recommendation = recommendNextProblem(
    problems,
    makeProgress(),
    makeSkillProfile({
      weakConcepts: ["prefix-sum"],
      conceptScores: {
        ...createInitialSkillProfile().conceptScores,
        "array-traversal": 82,
        "prefix-sum": 48
      },
      conceptAttempts: {
        ...createInitialSkillProfile().conceptAttempts,
        "prefix-sum": 1
      }
    })
  );

  assert.equal(recommendation.problem?.id, "weak-review");
  assert.deepEqual(recommendation.conceptIds, ["prefix-sum"]);
});

test("curated arrays progression source metadata unlocks min-max after traversal and sorted-check", () => {
  const initial = createInitialSkillProfile();
  const skillProfile = makeSkillProfile({
    conceptScores: {
      ...initial.conceptScores,
      "array-traversal": 92,
      "sorted-check": 88
    },
    conceptStrongHits: {
      ...initial.conceptStrongHits,
      "array-traversal": 3,
      "sorted-check": 3
    },
    implementationScores: {
      ...initial.implementationScores,
      "array-traversal": 82,
      "sorted-check": 80
    },
    implementationStrongHits: {
      ...initial.implementationStrongHits,
      "array-traversal": 1,
      "sorted-check": 1
    }
  });
  const progression = buildTopicConceptProgression(arraysProblems as Problem[], arraysConcepts);

  assert.deepEqual(progression.orderedConceptIds.slice(0, 5), [
    "array-traversal",
    "sorted-check",
    "min-max-array",
    "reverse-array",
    "second-largest"
  ]);
  assert.equal(getNextUnlockedConceptId(progression, skillProfile), "min-max-array");
});

test("curated bit progression source metadata unlocks bitwise-and after binary representation", () => {
  const initial = createInitialSkillProfile();
  const skillProfile = makeSkillProfile({
    conceptScores: {
      ...initial.conceptScores,
      "binary-representation": 92
    },
    conceptStrongHits: {
      ...initial.conceptStrongHits,
      "binary-representation": 3
    },
    implementationScores: {
      ...initial.implementationScores,
      "binary-representation": 80
    },
    implementationStrongHits: {
      ...initial.implementationStrongHits,
      "binary-representation": 1
    }
  });
  const progression = buildTopicConceptProgression(bitProblems as Problem[], bitConcepts);

  assert.deepEqual(progression.orderedConceptIds.slice(0, 6), [
    "binary-representation",
    "bitwise-and",
    "odd-even-check",
    "left-shift",
    "check-ith-bit",
    "bitwise-or"
  ]);
  assert.equal(getNextUnlockedConceptId(progression, skillProfile), "bitwise-and");
});

test("curated linked list progression source metadata unlocks head-tail updates after traversal basics", () => {
  const initial = createInitialSkillProfile();
  const skillProfile = makeSkillProfile({
    conceptScores: {
      ...initial.conceptScores,
      "ll-traversal": 92,
      "ll-length": 88,
      "ll-search": 86
    },
    conceptStrongHits: {
      ...initial.conceptStrongHits,
      "ll-traversal": 3,
      "ll-length": 3,
      "ll-search": 3
    },
    implementationScores: {
      ...initial.implementationScores,
      "ll-traversal": 82,
      "ll-length": 80,
      "ll-search": 80
    },
    implementationStrongHits: {
      ...initial.implementationStrongHits,
      "ll-traversal": 1,
      "ll-length": 1,
      "ll-search": 1
    }
  });
  const progression = buildTopicConceptProgression(linkedListProblems as Problem[], linkedListConcepts);

  assert.deepEqual(progression.orderedConceptIds.slice(0, 6), [
    "ll-traversal",
    "ll-length",
    "ll-search",
    "ll-head-tail-update",
    "ll-node-delete",
    "ll-reverse"
  ]);
  assert.equal(getNextUnlockedConceptId(progression, skillProfile), "ll-head-tail-update");
});

test("curated stack progression source metadata unlocks balanced brackets after basic stack operations", () => {
  const initial = createInitialSkillProfile();
  const skillProfile = makeSkillProfile({
    conceptScores: {
      ...initial.conceptScores,
      "stack-intro": 92,
      "stack-array-implementation": 88,
      "stack-operations": 90,
      "reverse-using-stack": 84
    },
    conceptStrongHits: {
      ...initial.conceptStrongHits,
      "stack-intro": 3,
      "stack-array-implementation": 3,
      "stack-operations": 3,
      "reverse-using-stack": 3
    },
    implementationScores: {
      ...initial.implementationScores,
      "stack-intro": 80,
      "stack-array-implementation": 82,
      "stack-operations": 82,
      "reverse-using-stack": 78
    },
    implementationStrongHits: {
      ...initial.implementationStrongHits,
      "stack-intro": 1,
      "stack-array-implementation": 1,
      "stack-operations": 1,
      "reverse-using-stack": 1
    }
  });
  const progression = buildTopicConceptProgression(stackProblems as Problem[], stackConcepts);

  assert.deepEqual(progression.orderedConceptIds.slice(0, 7), [
    "stack-intro",
    "stack-array-implementation",
    "stack-operations",
    "reverse-using-stack",
    "balanced-parentheses",
    "stack-simulation",
    "postfix-evaluation"
  ]);
  assert.equal(getNextUnlockedConceptId(progression, skillProfile), "balanced-parentheses");
});

test("curated queue progression source metadata unlocks queue simulation after core FIFO mechanics", () => {
  const initial = createInitialSkillProfile();
  const skillProfile = makeSkillProfile({
    conceptScores: {
      ...initial.conceptScores,
      "queue-intro": 92,
      "array-queue-implementation": 88,
      "queue-operations": 90,
      "circular-queue": 84
    },
    conceptStrongHits: {
      ...initial.conceptStrongHits,
      "queue-intro": 3,
      "array-queue-implementation": 3,
      "queue-operations": 3,
      "circular-queue": 3
    },
    implementationScores: {
      ...initial.implementationScores,
      "queue-intro": 80,
      "array-queue-implementation": 82,
      "queue-operations": 82,
      "circular-queue": 78
    },
    implementationStrongHits: {
      ...initial.implementationStrongHits,
      "queue-intro": 1,
      "array-queue-implementation": 1,
      "queue-operations": 1,
      "circular-queue": 1
    }
  });
  const progression = buildTopicConceptProgression(queueProblems as Problem[], queueConcepts);

  assert.deepEqual(progression.orderedConceptIds.slice(0, 7), [
    "queue-intro",
    "array-queue-implementation",
    "queue-operations",
    "circular-queue",
    "queue-simulation",
    "generate-binary-numbers",
    "bfs-on-grid"
  ]);
  assert.equal(getNextUnlockedConceptId(progression, skillProfile), "queue-simulation");
});

test("curated recursion progression source metadata unlocks string recursion after base parameter and functional flow", () => {
  const initial = createInitialSkillProfile();
  const skillProfile = makeSkillProfile({
    conceptScores: {
      ...initial.conceptScores,
      "recursion-intro": 92,
      "base-case": 90,
      "parameterized-recursion": 86,
      "functional-recursion": 88
    },
    conceptStrongHits: {
      ...initial.conceptStrongHits,
      "recursion-intro": 3,
      "base-case": 3,
      "parameterized-recursion": 3,
      "functional-recursion": 3
    },
    implementationScores: {
      ...initial.implementationScores,
      "recursion-intro": 82,
      "base-case": 82,
      "parameterized-recursion": 78,
      "functional-recursion": 80
    },
    implementationStrongHits: {
      ...initial.implementationStrongHits,
      "recursion-intro": 1,
      "base-case": 1,
      "parameterized-recursion": 1,
      "functional-recursion": 1
    }
  });
  const progression = buildTopicConceptProgression(recursionProblems as Problem[], recursionConcepts);

  assert.deepEqual(progression.orderedConceptIds.slice(0, 7), [
    "recursion-intro",
    "base-case",
    "parameterized-recursion",
    "functional-recursion",
    "recursion-on-strings",
    "tree-recursion",
    "recursion-on-arrays"
  ]);
  assert.equal(getNextUnlockedConceptId(progression, skillProfile), "recursion-on-strings");
});

test("curated binary search progression source metadata unlocks lower-bound after exact-match flow", () => {
  const initial = createInitialSkillProfile();
  const skillProfile = makeSkillProfile({
    conceptScores: {
      ...initial.conceptScores,
      "binary-search-intro": 92,
      "sorted-mid-check": 90
    },
    conceptStrongHits: {
      ...initial.conceptStrongHits,
      "binary-search-intro": 3,
      "sorted-mid-check": 3
    },
    implementationScores: {
      ...initial.implementationScores,
      "binary-search-intro": 82,
      "sorted-mid-check": 82
    },
    implementationStrongHits: {
      ...initial.implementationStrongHits,
      "binary-search-intro": 1,
      "sorted-mid-check": 1
    }
  });
  const progression = buildTopicConceptProgression(binarySearchProblems as Problem[], binarySearchConcepts);

  assert.deepEqual(progression.orderedConceptIds.slice(0, 6), [
    "binary-search-intro",
    "sorted-mid-check",
    "lower-bound",
    "upper-bound",
    "first-last-occurrence",
    "search-insert-position"
  ]);
  assert.equal(getNextUnlockedConceptId(progression, skillProfile), "lower-bound");
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

test("best score alone does not make a problem solved for future recommendations", () => {
  const problems = [
    makeProblem({ id: "arr-001", expectedConcepts: ["array-traversal"] }),
    makeProblem({ id: "arr-002", expectedConcepts: ["array-traversal"] })
  ];

  const progress = makeProgress();
  progress.problems["arr-001"] = {
    problemId: "arr-001",
    status: "submitted",
    attempts: 1,
    bestScore: 96
  };

  const recommendation = recommendNextProblem(problems, progress, makeSkillProfile());
  assert.equal(recommendation.problem?.id, "arr-001");
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
