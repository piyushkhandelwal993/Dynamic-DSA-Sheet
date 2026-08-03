import test from "node:test";
import assert from "node:assert/strict";
import { __testables } from "../services/externalPractice";
import { createInitialProgress, createInitialSkillProfile } from "../services/storage";
import { ExternalPracticeProblem, Problem, ProgressState, SkillProfile } from "../types";

function makeSkillProfile(overrides?: Partial<SkillProfile>): SkillProfile {
  return {
    ...createInitialSkillProfile(),
    ...overrides
  };
}

function makeProgress(): ProgressState {
  return createInitialProgress();
}

function makeProblem(overrides: Partial<ExternalPracticeProblem>): ExternalPracticeProblem {
  return {
    id: "ext-default",
    platform: "leetcode",
    title: "Default External Problem",
    url: "https://leetcode.com/problems/two-sum/",
    difficulty: "Medium",
    topicId: "arrays",
    conceptIds: ["array-traversal"],
    prerequisiteConceptIds: ["array-traversal"],
    mappedFromProblemIds: ["arr-017"],
    recommendedAfterProblemIds: ["arr-017"],
    sourceQualityWeight: 1,
    ...overrides
  };
}

function makeCurrentProblem(overrides?: Partial<Problem>): Problem {
  return {
    id: "arr-017",
    topic: "arrays",
    title: "Maximum Consecutive Ones",
    difficulty: "Easy",
    subtopic: "Traversal",
    platform: "DSA Sheet",
    url: "https://example.com/problems/arr-017",
    description: "",
    hints: [],
    solutionMode: "function",
    expectedConcepts: ["array-traversal", "sliding-window"],
    prerequisiteConcepts: [],
    remedialProblems: [],
    skipIfMastered: [],
    examples: [],
    testCases: [],
    expectedComplexity: "O(n)",
    estimatedMinutes: 15,
    ...overrides
  };
}

test("external ranking prioritizes direct transfer overlap over generic eligibility", () => {
  const currentProblem = makeCurrentProblem();
  const progress = makeProgress();
  progress.problems["arr-017"] = {
    problemId: "arr-017",
    status: "solved",
    attempts: 1,
    bestScore: 92
  };

  const skillProfile = makeSkillProfile({
    conceptScores: {
      ...createInitialSkillProfile().conceptScores,
      "array-traversal": 88,
      "sliding-window": 84
    }
  });

  const directTransfer = makeProblem({
    id: "ext-direct-transfer",
    title: "Direct Transfer",
    conceptIds: ["array-traversal", "sliding-window"],
    prerequisiteConceptIds: ["array-traversal", "sliding-window"],
    recommendedAfterProblemIds: ["arr-017"]
  });
  const genericEligible = makeProblem({
    id: "ext-generic-eligible",
    title: "Generic Eligible",
    conceptIds: ["array-traversal"],
    prerequisiteConceptIds: ["array-traversal"],
    recommendedAfterProblemIds: ["arr-011"]
  });

  const ranked = __testables.rankProblems(
    [genericEligible, directTransfer],
    progress,
    skillProfile,
    { records: {} },
    currentProblem
  );

  assert.equal(ranked[0]?.problem.id, "ext-direct-transfer");
  assert.equal(ranked[0]?.matchedConceptIds.includes("sliding-window"), true);
});

test("external ranking downranks dismissed problems when alternatives exist", () => {
  const currentProblem = makeCurrentProblem();
  const progress = makeProgress();
  progress.problems["arr-017"] = {
    problemId: "arr-017",
    status: "solved",
    attempts: 1,
    bestScore: 90
  };

  const skillProfile = makeSkillProfile({
    conceptScores: {
      ...createInitialSkillProfile().conceptScores,
      "array-traversal": 86
    }
  });

  const fresh = makeProblem({
    id: "ext-fresh",
    title: "Fresh Option"
  });
  const dismissed = makeProblem({
    id: "ext-dismissed",
    title: "Dismissed Option"
  });

  const ranked = __testables.rankProblems(
    [dismissed, fresh],
    progress,
    skillProfile,
    {
      records: {
        "ext-dismissed": {
          problemId: "ext-dismissed",
          status: "dismissed",
          dismissedAt: "2026-08-03T00:00:00.000Z"
        }
      }
    },
    currentProblem
  );

  assert.equal(ranked[0]?.problem.id, "ext-fresh");
});

test("preferredDifficulty scales with concept readiness", () => {
  const beginner = makeSkillProfile({
    conceptScores: {
      ...createInitialSkillProfile().conceptScores,
      "array-traversal": 74
    }
  });
  const intermediate = makeSkillProfile({
    conceptScores: {
      ...createInitialSkillProfile().conceptScores,
      "array-traversal": 82
    }
  });
  const advanced = makeSkillProfile({
    conceptScores: {
      ...createInitialSkillProfile().conceptScores,
      "array-traversal": 92
    }
  });

  assert.equal(__testables.preferredDifficulty(beginner, ["array-traversal"]), "Easy");
  assert.equal(__testables.preferredDifficulty(intermediate, ["array-traversal"]), "Medium");
  assert.equal(__testables.preferredDifficulty(advanced, ["array-traversal"]), "Hard");
});

test("strong submission fills external unlock candidates up to four with ranked fallbacks", () => {
  const progress = makeProgress();
  progress.problems["arr-017"] = {
    problemId: "arr-017",
    status: "solved",
    attempts: 1,
    bestScore: 92
  };
  progress.problems["arr-007"] = {
    problemId: "arr-007",
    status: "solved",
    attempts: 1,
    bestScore: 90
  };
  progress.problems["arr-011"] = {
    problemId: "arr-011",
    status: "solved",
    attempts: 1,
    bestScore: 89
  };

  const skillProfile = makeSkillProfile({
    conceptScores: {
      ...createInitialSkillProfile().conceptScores,
      "array-traversal": 90,
      "sliding-window": 86,
      "min-max-array": 84,
      "kadane-algorithm": 85
    },
    strongConcepts: ["array-traversal", "sliding-window"]
  });

  const unlocks = __testables.collectUnlockCandidates(
    makeCurrentProblem(),
    progress,
    skillProfile,
    { records: {} }
  );

  assert.ok(unlocks.length >= 3);
  assert.ok(unlocks.length <= 4);
});

test("same solved problem can yield different external sets for different skill profiles", () => {
  const progress = makeProgress();
  for (const problemId of ["arr-017", "arr-007", "arr-011", "arr-018", "arr-024", "arr-030"]) {
    progress.problems[problemId] = {
      problemId,
      status: "solved",
      attempts: 1,
      bestScore: 90
    };
  }

  const currentProblem = makeCurrentProblem();
  const beginnerish = makeSkillProfile({
    conceptScores: {
      ...createInitialSkillProfile().conceptScores,
      "array-traversal": 82,
      "sliding-window": 74,
      "fixed-size-window": 72,
      "variable-size-window": 71,
      "kadane-algorithm": 79
    },
    weakConcepts: ["sliding-window"]
  });
  const advanced = makeSkillProfile({
    conceptScores: {
      ...createInitialSkillProfile().conceptScores,
      "array-traversal": 92,
      "sliding-window": 91,
      "fixed-size-window": 90,
      "variable-size-window": 89,
      "kadane-algorithm": 88,
      "prefix-sum": 87
    },
    strongConcepts: ["array-traversal", "sliding-window", "fixed-size-window"]
  });

  const beginnerUnlocks = __testables.collectUnlockCandidates(currentProblem, progress, beginnerish, { records: {} });
  const advancedUnlocks = __testables.collectUnlockCandidates(currentProblem, progress, advanced, { records: {} });

  const beginnerIds = beginnerUnlocks.map((item) => item.problem.id);
  const advancedIds = advancedUnlocks.map((item) => item.problem.id);

  assert.notDeepEqual(beginnerIds, advancedIds);
});
